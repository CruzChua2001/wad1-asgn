const express = require("express");
const router = express.Router();
const auth = require("../auth/auth");

const eventController = require("../controllers/eventController");

router.get("/", eventController.getAllEvents);

// TODO: 
// 1. Finish up the getManageEvents function in the controller
// 2. Complete the eventmange.ejs page to display the events, and fetch method to delete an event
router.get("/manage", auth.requireAdmin, eventController.getManageEvents);

router.get("/new", auth.requireAdmin, eventController.getNewEvent);
router.post("/new", auth.requireAdmin, eventController.postNewEvent);

router.get("/:id", eventController.getEventByID);

router.get("/manage/:id", auth.requireAdmin, eventController.getManageEventByID);

router.patch("/edit/:id", auth.requireAdmin, eventController.editEvent);

router.delete("/delete/:id", auth.requireAdmin, eventController.deleteEvent);

module.exports = router;  