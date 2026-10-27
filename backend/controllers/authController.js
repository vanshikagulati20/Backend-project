const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");

// Temporary, one-time login handoffs; expire after two minutes.
const pendingLoginHandoffs = new Map();

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (name.trim().length < 2 || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Name must contain at least 2 characters and password at least 8 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    console.error("Signup error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create account"
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

  const safeUser = {
  id: user._id,
  name: user.name,
  email: user.email
};

if (req.body.createHandoff === true) {
  const token = crypto.randomBytes(32).toString("hex");

  pendingLoginHandoffs.set(token, {
    user: safeUser,
    expiresAt: Date.now() + 2 * 60 * 1000
  });

  const frontendUrl = "http://127.0.0.1:5500/smart-warehouse/frontend";

  return res.status(200).json({
    success: true,
    message: "Login successful. Open the handoff URL in your browser.",
    user: safeUser,
    handoffUrl:
      `${frontendUrl}/auth-handoff.html?token=${token}`
  });
}

return res.status(200).json({
  success: true,
  message: "Login successful",
  user: safeUser
});
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to login right now"
    });
  }
};

exports.consumeLoginHandoff = (req, res) => {
  const token = req.body.token;

  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({
      success: false,
      message: "Invalid handoff token"
    });
  }

  const handoff = pendingLoginHandoffs.get(token);

  // Delete it immediately so it cannot be reused.
  pendingLoginHandoffs.delete(token);

  if (!handoff || handoff.expiresAt < Date.now()) {
    return res.status(401).json({
      success: false,
      message: "Handoff expired or already used. Please log in again."
    });
  }

  return res.json({
    success: true,
    user: handoff.user
  });
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: 1 });

    return res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error("Get users error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load users"
    });
  }
};

