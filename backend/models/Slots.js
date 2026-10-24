
const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    size: {
      type: String,
      required: true,
      enum: ["Small", "Medium", "Large"]
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    length: {
      type: Number,
      required: true,
      min: 0.1
    },
    breadth: {
      type: Number,
      required: true,
      min: 0.1
    },
    height: {
      type: Number,
      required: true,
      min: 0.1
    },
    volume: {
      type: Number,
      required: true
    },
    usedVolume: {
      type: Number,
      default: 0
    },
    productId: {
      type: String,
      default: null
    },
    productName: {
      type: String,
      default: null
    },
    productQuantity: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

slotSchema.index({ userEmail: 1, id: 1 }, { unique: true });

module.exports = mongoose.model("Slot", slotSchema);
