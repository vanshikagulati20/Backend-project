const express = require("express");
const router = express.Router();
const controller = require("../controllers/slotController");

router.get("/", controller.getSlots);
router.post("/", controller.createSlots);
router.put("/:id", controller.updateSlot);
router.delete("/:id", controller.deleteSlot);

module.exports = router;
