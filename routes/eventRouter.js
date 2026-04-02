const express = require("express");
const router = express.Router();
const auth = require("../auth/auth");
const { logger } = require("../middleware/logger");
const multer = require("multer");
const path = require("path");

const eventController = require("../controllers/eventController");

router.use(logger);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/images"));
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = [".jpg", ".jpeg", ".png"];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.get("/", eventController.getAllEvents);

router.get("/manage", auth.requireAdmin, eventController.getManageEvents);

router.get("/new", auth.requireAdmin, eventController.getNewEvent);
router.post("/new", auth.requireAdmin, upload.single("EventImage"), eventController.postNewEvent);

router.get("/:id", eventController.getEventByID);

router.get("/manage/:id", auth.requireAdmin, eventController.getManageEventByID);

router.patch("/edit/:id", auth.requireAdmin, upload.single("EventImage"), eventController.editEvent);

router.delete("/delete/:id", auth.requireAdmin, eventController.deleteEvent);

// Cancel a reservation for an event and auto-promote waitlist (event-only logic)
router.post("/cancel-reservation/:eventId/:reservationId", auth.requireAdmin, eventController.eventCancelReservation);

module.exports = router;  