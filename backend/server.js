
const User = require("./models/User");
const Slot = require("./models/Slots");
const Product = require("./models/Products");

const bcrypt = require("bcryptjs");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Storvia API!",
    status: "running"
  });
});

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
    const existingUser = await User.findOne({ email: normalizedEmail });

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

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to login right now"
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Storvia backend is working"
  });
});

// Existing warehouse testing route
app.post("/api/warehouses", (req, res) => {
  res.status(201).json({
    success: true,
    message: "Warehouse data received successfully",
    data: req.body
  });
});

// Create and save storage slots
app.post("/api/slots", async (req, res) => {
  try {
    const {
      slotType,
      length,
      breadth,
      height,
      numberOfSlots,
      userEmail
    } = req.body;

    if (!["Small", "Medium", "Large"].includes(slotType)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid slot type"
      });
    }

    if (
      typeof userEmail !== "string" ||
      !userEmail.trim() ||
      !Number.isFinite(length) ||
      !Number.isFinite(breadth) ||
      !Number.isFinite(height) ||
      length <= 0 ||
      breadth <= 0 ||
      height <= 0 ||
      !Number.isInteger(numberOfSlots) ||
      numberOfSlots < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid slot details"
      });
    }

    const normalizedEmail = userEmail.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const prefix = {
      Large: "A",
      Medium: "B",
      Small: "C"
    }[slotType];

    const existingSlots = await Slot.find({
      userEmail: normalizedEmail,
      size: slotType
    }).select("id");

    // Use the highest existing slot number to avoid reusing IDs after deletions.
    const highestNumber = existingSlots.reduce((highest, slot) => {
      const match = slot.id.match(/-(\d+)$/);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);

    const volume = length * breadth * height;
    const slotsToCreate = [];

    for (let i = 1; i <= numberOfSlots; i++) {
      slotsToCreate.push({
        id: `${prefix}-${String(highestNumber + i).padStart(2, "0")}`,
        size: slotType,
        userEmail: normalizedEmail,
        length,
        breadth,
        height,
        volume,
        usedVolume: 0,
        productId: null,
        productName: null,
        productQuantity: 0
      });
    }

    const savedSlots = await Slot.insertMany(slotsToCreate);

    return res.status(201).json({
      success: true,
      message: `${savedSlots.length} ${slotType} slot(s) added successfully`,
      count: savedSlots.length,
      data: savedSlots
    });
  } catch (error) {
    console.error("Save slots error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to save slots"
    });
  }
});

// Get all products for the current user's email
app.get("/api/products", async (req, res) => {
  try {
    const { userEmail } = req.query;

    if (typeof userEmail !== "string" || !userEmail.trim()) {
      return res.status(400).json({
        success: false,
        message: "User email is required"
      });
    }

    const normalizedEmail = userEmail.trim().toLowerCase();
    const products = await Product.find({
      userEmail: normalizedEmail
    }).sort({ createdAt: 1 });

    return res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error("Get products error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load products"
    });
  }
});

// Create a product
app.post("/api/products", async (req, res) => {
  try {
    const data = req.body;

    if (
      typeof data.userEmail !== "string" ||
      !data.userEmail.trim() ||
      !data.name?.trim() ||
      !data.category ||
      !Number.isInteger(data.quantity) ||
      data.quantity < 1 ||
      !["Pieces", "Boxes", "Sets", "Packs", "Cartons"].includes(data.unit) ||
      !Number.isInteger(data.itemsPerUnit) ||
      data.itemsPerUnit < 1 ||
      !["Small", "Medium", "Large", "Custom"].includes(data.size) ||
      !["Yes", "No"].includes(data.fragile) ||
      !Number.isFinite(data.length) ||
      !Number.isFinite(data.breadth) ||
      !Number.isFinite(data.height) ||
      !Number.isFinite(data.volume) ||
      !Number.isFinite(data.totalVolume) ||
      !Number.isFinite(data.weight) ||
      data.length < 0 ||
      data.breadth < 0 ||
      data.height < 0 ||
      data.volume < 0 ||
      data.totalVolume < 0 ||
      data.weight < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid product details"
      });
    }

    const normalizedEmail = data.userEmail.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const product = await Product.create({
      ...data,
      id: new mongoose.Types.ObjectId().toString(),
      name: data.name.trim(),
      userEmail: normalizedEmail,
      allocationStatus: data.allocationStatus || "Pending",
      allocatedQuantity: 0,
      allocatedVolume: 0,
      allocationMessage: "Waiting for warehouse allocation.",
      date: data.date || new Date().toISOString().slice(0, 10)
    });

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: product
    });
  } catch (error) {
    console.error("Create product error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to save product"
    });
  }
});

// Edit a product and preserve its allocation fields
app.put("/api/products/:id", async (req, res) => {
  try {
    const { userEmail } = req.body;

    if (typeof userEmail !== "string" || !userEmail.trim()) {
      return res.status(400).json({
        success: false,
        message: "User email is required"
      });
    }

    const normalizedEmail = userEmail.trim().toLowerCase();
    const product = await Product.findOne({
      id: req.params.id,
      userEmail: normalizedEmail
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const editableFields = [
      "name",
      "category",
      "quantity",
      "unit",
      "itemsPerUnit",
      "size",
      "length",
      "breadth",
      "height",
      "volume",
      "totalVolume",
      "weight",
      "fragile",
      "date"
    ];

    for (const field of editableFields) {
      if (req.body[field] !== undefined) {
        product[field] =
          field === "name" ? String(req.body[field]).trim() : req.body[field];
      }
    }

    await product.save();

    return res.json({
      success: true,
      message: "Product updated successfully",
      data: product
    });
  } catch (error) {
    console.error("Update product error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update product"
    });
  }
});

// Delete a product and release any slots assigned to it
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { userEmail } = req.query;

    if (typeof userEmail !== "string" || !userEmail.trim()) {
      return res.status(400).json({
        success: false,
        message: "User email is required"
      });
    }

    const normalizedEmail = userEmail.trim().toLowerCase();

    const product = await Product.findOneAndDelete({
      id: req.params.id,
      userEmail: normalizedEmail
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    await Slot.updateMany(
      {
        userEmail: normalizedEmail,
        productId: product.id
      },
      {
        $set: {
          usedVolume: 0,
          productId: null,
          productName: null,
          productQuantity: 0
        }
      }
    );

    return res.json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error("Delete product error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to delete product"
    });
  }
});
