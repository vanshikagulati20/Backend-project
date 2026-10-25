const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");
const Slot = require("./models/Slots");
const Product = require("./models/Products");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB and start the server
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

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Storvia backend is working"
  });
});

// SIGN UP
app.post("/api/signup", async (req, res) => {
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
});

// LOG IN
app.post("/api/login", async (req, res) => {
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
// GET ALL REGISTERED USERS
app.get("/api/users", async (req, res) => {
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
});

// WAREHOUSE TESTING ROUTE
// This currently receives data but does not save it to MongoDB.
app.post("/api/warehouses", (req, res) => {
  return res.status(201).json({
    success: true,
    message: "Warehouse data received successfully",
    data: req.body
  });
});

// GET ALL SLOTS FOR A USER
app.get("/api/slots", async (req, res) => {
  try {
    const { userEmail } = req.query;

    if (typeof userEmail !== "string" || !userEmail.trim()) {
      return res.status(400).json({
        success: false,
        message: "User email is required"
      });
    }

    const normalizedEmail = userEmail.trim().toLowerCase();

    const slots = await Slot.find({
      userEmail: normalizedEmail
    }).sort({ createdAt: 1 });

    return res.json({
      success: true,
      count: slots.length,
      data: slots
    });
  } catch (error) {
    console.error("Get slots error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load slots"
    });
  }
});

// CREATE STORAGE SLOTS
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
      typeof length !== "number" ||
      typeof breadth !== "number" ||
      typeof height !== "number" ||
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

    const user = await User.findOne({
      email: normalizedEmail
    });

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

    const highestNumber = existingSlots.reduce((highest, slot) => {
      const match = String(slot.id).match(/-(\d+)$/);

      return match
        ? Math.max(highest, Number(match[1]))
        : highest;
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



// Update slot occupancy for warehouse allocation
app.put("/api/slots/:id", async (req, res) => {
  try {
    const userEmail = String(req.body.userEmail || "")
      .trim()
      .toLowerCase();

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "User email is required."
      });
    }

    const slot = await Slot.findOne({
      id: req.params.id,
      userEmail
    });

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found."
      });
    }

    const usedVolume = Number(req.body.usedVolume);
    const productQuantity = Number(req.body.productQuantity);

    if (
      !Number.isFinite(usedVolume) ||
      usedVolume < 0 ||
      usedVolume > Number(slot.volume) + 1e-8
    ) {
      return res.status(400).json({
        success: false,
        message: "Used volume exceeds the slot's capacity."
      });
    }

    if (
      !Number.isInteger(productQuantity) ||
      productQuantity < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Product quantity must be a non-negative integer."
      });
    }

    const productId = req.body.productId || null;
    const productName = req.body.productName || null;

    if (productQuantity > 0 && (!productId || !productName)) {
      return res.status(400).json({
        success: false,
        message: "Product ID and name are required for an occupied slot."
      });
    }

    slot.usedVolume = usedVolume;
    slot.productQuantity = productQuantity;
    slot.productId = productQuantity > 0 ? productId : null;
    slot.productName = productQuantity > 0 ? productName : null;

    await slot.save();

    return res.json({
      success: true,
      message: "Slot allocation saved.",
      data: slot
    });
  } catch (error) {
    console.error("Slot update error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update slot.",
      error: error.message
    });
  }
});




// GET ALL PRODUCTS FOR A USER
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

// CREATE A PRODUCT
app.post("/api/products", async (req, res) => {
  try {
    const data = req.body;

    if (
      !data ||
      typeof data.userEmail !== "string" ||
      !data.userEmail.trim() ||
      typeof data.name !== "string" ||
      !data.name.trim() ||
      typeof data.category !== "string" ||
      !data.category.trim() ||
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

    const user = await User.findOne({
      email: normalizedEmail
    });

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
      category: data.category.trim(),
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



// DELETE A PRODUCT AND RELEASE ITS SLOTS
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

// Update a product, including its saved allocation summary
app.put("/api/products/:id", async (req, res) => {
  try {
    const userEmail = String(req.body.userEmail || "")
      .trim()
      .toLowerCase();

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "User email is required."
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
      "date",
      "allocatedQuantity",
      "allocatedVolume",
      "allocationStatus",
      "allocationMessage"
    ];

    const updates = {};

    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (updates.allocatedQuantity !== undefined) {
      updates.allocatedQuantity = Number(updates.allocatedQuantity);

      if (
        !Number.isFinite(updates.allocatedQuantity) ||
        updates.allocatedQuantity < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Allocated quantity must be zero or greater."
        });
      }
    }

    if (updates.allocatedVolume !== undefined) {
      updates.allocatedVolume = Number(updates.allocatedVolume);

      if (
        !Number.isFinite(updates.allocatedVolume) ||
        updates.allocatedVolume < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Allocated volume must be zero or greater."
        });
      }
    }

    const product = await Product.findOne({
      id: req.params.id,
      userEmail
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found."
      });
    }

    const finalQuantity =
      updates.quantity !== undefined
        ? Number(updates.quantity)
        : Number(product.quantity);

    const finalAllocatedQuantity =
      updates.allocatedQuantity !== undefined
        ? updates.allocatedQuantity
        : Number(product.allocatedQuantity || 0);

    if (
      !Number.isFinite(finalQuantity) ||
      finalQuantity < 0 ||
      finalAllocatedQuantity > finalQuantity
    ) {
      return res.status(400).json({
        success: false,
        message: "Allocated quantity cannot exceed product quantity."
      });
    }

    Object.assign(product, updates);
    await product.save();

    return res.json({
      success: true,
      message: "Product updated successfully.",
      data: product
    });
  } catch (error) {
    console.error("Product update error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product.",
      error: error.message
    });
  }
});