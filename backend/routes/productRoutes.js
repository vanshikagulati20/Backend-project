const express = require("express");
const router = express.Router();
const controller = require("../controllers/productController");

router.get("/", controller.getProducts);
router.post("/", controller.createProduct);
router.delete("/:id", controller.deleteProduct);
router.put("/:id", controller.updateProduct);

module.exports = router;
