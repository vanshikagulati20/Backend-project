const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const slotRoutes = require("./routes/slotRoutes");
const productRoutes = require("./routes/productRoutes");
const warehouseRoutes = require("./routes/warehouseRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

// Keep the same API URLs used by the existing frontend.
app.use("/api", authRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/products", productRoutes);
app.use("/api/warehouses", warehouseRoutes);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Storvia server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
