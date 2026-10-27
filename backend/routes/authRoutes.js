const express = require("express");
const router = express.Router();
const controller = require("../controllers/authController");

router.post("/signup", controller.signup);
router.post("/login", controller.login);
router.post("/login-handoff/consume", controller.consumeLoginHandoff);
router.get("/users", controller.getUsers);

module.exports = router;
