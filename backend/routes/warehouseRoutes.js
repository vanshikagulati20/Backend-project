const express = require("express");
const router = express.Router();
const controller = require("../controllers/warehouseController");

router.post("/", controller.createWarehouse);

module.exports = router;
