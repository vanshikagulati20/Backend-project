const mongoose = require("mongoose");
const User = require("../models/User");
const Slot = require("../models/Slots");
const Product = require("../models/Products");

exports.getProducts = async (req, res) => {
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
};

exports.createProduct = async (req, res) => {
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
};

exports.deleteProduct = async (req, res) => {
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
};

exports.updateProduct = async (req, res) => {
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
};

