
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Storvia server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Storvia API!",
    status: "running"
  });
});



// -- signup api

app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (name.trim().length < 2 || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Invalid name or password length"
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
});



// Health route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Storvia backend is working"
  });
});

// Temporary warehouse testing route
app.post("/api/warehouses", (req, res) => {
  const warehouse = req.body;

  res.status(201).json({
    success: true,
    message: "Warehouse data received successfully",
    data: warehouse
  });
});

// Temporary slots testing route
app.post("/api/slots", (req, res) => {
  const { slots } = req.body;

  if (!Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide at least one slot"
    });
  }

  console.log("Slots received from Storvia:", slots.length);

  res.status(201).json({
    success: true,
    message: "Slots received successfully",
    count: slots.length,
    data: slots
  });
});
