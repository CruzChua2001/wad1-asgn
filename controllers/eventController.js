const fs = require("fs");
const path = require("path");

const eventModel = require("../models/eventModel");
const categoryModel = require("../models/categoryModel");
const commentModel = require("../models/commentModel");

const generateUUID = require('../utils/uuidUtils').generateUUID;

// User side
exports.getAllEvents = async (req, res) => {
    try {
        // Get search input from URL query parameters, default to empty string if not provided
        const searchTerm = req.query.search || "";
        // Retrieve all events with category information as category name is needed as event type
        let events = await eventModel.retrieveAllWithCategory();

        // Search by Event Name
        if (searchTerm) {
            // Create a case-insensitive pattern
            const regex = new RegExp(searchTerm, "i"); 
            // Keep only events whose name matches the search term
            events = events.filter(event => regex.test(event.EventName));
        }

        // Only show active events to users
        const filteredEvents = events.filter(event => event.Status === 'active');

        res.render("events/event", { events: filteredEvents, searchTerm });
    } catch (err) {
        console.log(err);
        res.status(500).send("Error loading events"); // 500 = server error
    }
};

// Admin side
exports.getManageEvents = async (req, res) => {
    try {
        // Get search input from URL, default to empty string if not provided
        const searchTerm = req.query.search || ""; 
        let events = await eventModel.retrieveAllWithCategory();
        // Retrieve all categories for filter dropdown
        const categories = await categoryModel.retrieveAll();

        if (searchTerm) {
            const regex = new RegExp(searchTerm, "i");
            events = events.filter(event => regex.test(event.EventName));
        }

        res.render("events/eventmanage", { events, searchTerm, categories });
    } catch (err) {
        console.log(err);
        res.status(500).send("Error loading events"); 
    }
}

let newEventErrorMsg = [];

// Load create new event form
exports.getNewEvent = async (req, res) => {
    try {
        // Retrieve categories for dropdown selection
        let categories = await categoryModel.retrieveAll();

        if (categories.length === 0) {
            newEventErrorMsg.push("No category available, please contact admin");
            return res.render("events/eventnew", { errors: newEventErrorMsg, formData: {} });
        } else {
            return res.render("events/eventnew", { errors: newEventErrorMsg, categories: categories, formData: {} });
        }

    } catch (error) {
        newEventErrorMsg.push("Error loading page, please try again");
        res.redirect("/event/manage");
    }
}

// Handle create new event form submission
exports.postNewEvent = async (req, res) => {
    newEventErrorMsg = [];

    // Validate required fields
    if (!req.body.EventName || !req.body.EventDescription || !req.body.EventType || !req.body.MaxCapacity || !req.body.EndDateTime) {
        newEventErrorMsg.push("Please fill in all the fields");
    }

    // Validate Max Capacity (no negative, no decimal)
    if (req.body.MaxCapacity) {
        const maxCapacity = Number(req.body.MaxCapacity);

        if (maxCapacity <= 0 || !Number.isInteger(maxCapacity)) {
            newEventErrorMsg.push("Maximum capacity must be a positive integer");
        }
    }
    // If there are validation errors, re-render the form with error messages and previously entered data
    if (newEventErrorMsg.length > 0) {
        let categories = await categoryModel.retrieveAll();

        return res.render("events/eventnew", {
            errors: newEventErrorMsg,
            categories,
            formData: req.body // Pass the previously entered form data back to the template to pre-fill the form
        });
    }

    // Create new event object with form data
    let newEvent = {
        EventID: generateUUID(),
        EventName: req.body.EventName,
        EventDescription: req.body.EventDescription,
        EventImage: req.file ? "/images/" + req.file.filename : "",
        EventType: req.body.EventType,
        MaxCapacity: Number(req.body.MaxCapacity),
        CreatedBy: req.user.userId,
        EndDateTime: new Date(req.body.EndDateTime), 
        Status: 'active' // Set as default active, only edit can change this 
    }

    try {
        await eventModel.createEvent(newEvent);
        res.redirect("/event/manage");
    } catch (error) {
        console.error(error);
        let categories = await categoryModel.retrieveAll();
        return res.render("events/eventnew", {
            newEventErrorMsg: ["Error creating new event, please try again"],
            categories,
            formData: req.body
        });
    }       
}

// Event details page
exports.getEventByID = async (req, res) => {
    // Get event ID from URL parameters (:id)
    let eventID = req.params.id;

    try {
        // getEventByID returns an array even for one event, so events[0] gets the object
        let events = await eventModel.getEventByID(eventID);
        let event = events[0];

        let comments = await commentModel.retrieveCommentByEventId(eventID);

        if (!event) {
            console.log("Event not found for ID:", eventID);
            return res.redirect("/event");
        }
        res.render("events/eventdetail", { event, comments });
    } catch (error) {
        console.error("Error occurred while fetching event:", error);
        res.redirect("/event");
    }
}

let editEventErrorMsg = [];

// Event manage details page
exports.getManageEventByID = async (req, res) => {
    let eventID = req.params.id;

    try {
        let events = await eventModel.getEventByID(eventID); // Aggregation returns array
        let event = events[0];

        if (!event) {
            return res.redirect("/event/manage");
        }

        // Ensure EndDateTime is a proper Date object
        if (event.EndDateTime && !(event.EndDateTime instanceof Date)) {
            event.EndDateTime = new Date(event.EndDateTime);
        }

        res.render("events/eventmanagedetail", {
            event,
            categories: await categoryModel.retrieveAll(),
            errors: editEventErrorMsg,
            approvedParticipants: event.approvedParticipants || []
        });
    } catch (error) {
        console.error(error);
        res.redirect("/event/manage");
    }

}

exports.editEvent = async (req, res) => {
    let eventID = req.params.id;

    let errors = []; // reset

    // Validate required fields and push to errors array
    if (!req.body.EventName) {
        errors.push("Event Name is required");
    }
    if (!req.body.EventDescription) {
        errors.push("Event Description is required");
    }
    if (!req.body.EventType) {
        errors.push("Event Type is required");
    }

    if (!req.body.MaxCapacity) {
        errors.push("Max Capacity is required");
    } else {
        const maxCapacity = Number(req.body.MaxCapacity);
        if (maxCapacity <= 0 || !Number.isInteger(maxCapacity)) {
            errors.push("Max Capacity must be a positive integer");
        }
    }

    if (!req.body.EndDateTime) {
        errors.push("End Date & Time is required");
    }
    if (!req.body.Status) {
        errors.push("Status is required");
    }

    // If validation fails, send error response to frontend
    if (errors.length > 0) {
        // 400 = bad request (user input error)
        return res.status(400).json({ message: errors });
    }

    const updatedEvent = {
        EventName: req.body.EventName,
        EventDescription: req.body.EventDescription,
        EventType: req.body.EventType,
        MaxCapacity: Number(req.body.MaxCapacity),
        EndDateTime: new Date(req.body.EndDateTime),
        Status: req.body.Status
    };

    // Delete old image if new one is uploaded
    if (req.file) {
        const events = await eventModel.getEventByID(eventID);
        const event = events[0];
        if (event && event.EventImage) {
            fs.unlink(path.join(__dirname, "../public", event.EventImage), (err) => {
                if (err) console.error("Failed to delete old image:", err);
            });
        }
        updatedEvent.EventImage = "/images/" + req.file.filename;
    }

    try {
        await eventModel.updateEvent(eventID, updatedEvent);
        // 200 = success
        res.status(200).json({ message: "Event updated successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: ["Error updating event, please try again"] });
    }
};

exports.deleteEvent = async (req, res) => {
    let eventID = req.params.id;
    try {
        let events = await eventModel.getEventByID(eventID);
        let event = events[0];

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        fs.unlink(path.join(__dirname, "../public", event.EventImage), (err) => {
            if (err) console.error("Failed to delete image:", err);
        });

        let response = await eventModel.deleteEvent(eventID);

        if (response.deletedCount === 0) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Delete image file if it exists
        if (event.EventImage) {
            const imagePath = path.join(__dirname, "../public", event.EventImage);
            fs.unlink(imagePath, (err) => {
                if (err) console.error("Failed to delete image:", err);
            });
        }
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting event, please try again" });
    }
}


exports.eventCancelReservation = async (req, res) => {
    const { eventId, reservationId } = req.params;
    // Accept numofppl from body (sent as JSON from frontend)
    let numofppl = 1;
    if (req.body && req.body.numofppl) {
        numofppl = Number(req.body.numofppl) || 1;
    }
    try {
        const result = await eventModel.cancelReservationAndPromoteWaitlist(eventId, reservationId, numofppl);
        if (result.success) {
            res.status(200).json({
                success: true,
                message: "Reservation cancelled and waitlist promoted successfully.",
                promoted: result.promoted || [],
                newCapacity: result.newCapacity
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message || "Could not cancel reservation."
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error cancelling reservation, please try again."
        });
    }
};

// Additional helper functions for event details retrieval (used in reservation flow)
