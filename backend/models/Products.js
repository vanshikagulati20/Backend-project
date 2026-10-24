
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      required: true,
      enum: ["Pieces", "Boxes", "Sets", "Packs", "Cartons"]
    },
    itemsPerUnit: {
      type: Number,
      required: true,
      min: 1
    },
    size: {
      type: String,
      required: true,
      enum: ["Small", "Medium", "Large", "Custom"]
    },
    length: {
      type: Number,
      required: true,
      min: 0
    },
    breadth: {
      type: Number,
      required: true,
      min: 0
    },
    height: {
      type: Number,
      required: true,
      min: 0
    },
    volume: {
      type: Number,
      required: true,
      min: 0
    },
    totalVolume: {
      type: Number,
      required: true,
      min: 0
    },
    weight: {
      type: Number,
      required: true,
      min: 0
    },
    fragile: {
      type: String,
      required: true,
      enum: ["Yes", "No"]
    },
    allocationStatus: {
      type: String,
      default: "Pending"
    },
    allocatedQuantity: {
      type: Number,
      default: 0
    },
    allocatedVolume: {
      type: Number,
      default: 0
    },
    allocationMessage: {
      type: String,
      default: "Waiting for warehouse allocation."
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    date: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

productSchema.index({ userEmail: 1, id: 1 }, { unique: true });

module.exports = mongoose.model("Product", productSchema);
