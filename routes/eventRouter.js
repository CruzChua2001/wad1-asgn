const express = require("express");
const router = express.Router();
const auth = require("../auth/auth"); // Middleware to check if user is admin
const { logger } = require("../middleware/logger");
const multer = require("multer"); // Handle file uploads for event images
const path = require("path");

const eventController = require("../controllers/eventController");

router.use(logger);

// Configure Multer storage for uploaded event images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Save files in /public/images
        cb(null, path.join(__dirname, "../public/images"));
    },
    filename: (req, file, cb) => {
        // Generate unique file name: timestamp + random number + original file extension
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// For handling image uploads for events
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        // Only allow image files
        const allowed = [".jpg", ".jpeg", ".png"];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // Max 5MB
});

// View all events
router.get("/", eventController.getAllEvents);

// View all events with management options (admin only)
router.get("/manage", auth.requireAdmin, eventController.getManageEvents);

// Display create new event form
router.get("/new", auth.requireAdmin, eventController.getNewEvent);

// Submit new event form with optional image upload
router.post("/new", auth.requireAdmin, upload.single("EventImage"), eventController.postNewEvent);

// View details of a specific event
router.get("/:id", eventController.getEventByID);

// View/edit details of a specific event
router.get("/manage/:id", auth.requireAdmin, eventController.getManageEventByID);

// Update event details using PATCH, and allow new image upload
router.patch("/edit/:id", auth.requireAdmin, upload.single("EventImage"), eventController.editEvent);

// Delete an event
router.delete("/delete/:id", auth.requireAdmin, eventController.deleteEvent);

// Cancel a reservation for an event and auto-promote waitlist (event-only logic)
router.post("/cancel-reservation/:eventId/:reservationId", auth.requireAdmin, eventController.eventCancelReservation);

module.exports = router;  