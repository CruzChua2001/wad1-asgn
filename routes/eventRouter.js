const express = require("express");
const router = express.Router();
// const { requireAdmin } = require("../auth/auth");

const eventController = require("../controllers/eventController");
router.get("/", eventController.getAllEvents);

module.exports = router;  