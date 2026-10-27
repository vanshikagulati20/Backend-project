const User = require("../models/User");
const Slot = require("../models/Slots");

exports.getSlots = async (req, res) => {
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
};

exports.createSlots = async (req, res) => {
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
};

exports.updateSlot = async (req, res) => {
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
};

exports.deleteSlot = async (req, res) => {
  try {
    const { userEmail } = req.query;

    if (typeof userEmail !== "string" || !userEmail.trim()) {
      return res.status(400).json({
        success: false,
        message: "User email is required"
      });
    }

    const normalizedEmail = userEmail.trim().toLowerCase();

    const slot = await Slot.findOneAndDelete({
      id: req.params.id,
      userEmail: normalizedEmail
    });

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found"
      });
    }

    return res.json({
      success: true,
      message: "Slot deleted successfully",
      data: slot
    });
  } catch (error) {
    console.error("Delete slot error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete slot"
    });
  }
};

