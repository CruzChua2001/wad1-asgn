const fs = require("fs");
const path = require("path");

const eventModel = require("../models/eventModel");
const categoryModel = require("../models/categoryModel");
const commentModel = require("../models/commentModel");

const generateUUID = require('../utils/uuidUtils').generateUUID;

exports.getAllEvents = async (req, res) => {
    try {
        const searchTerm = req.query.search || "";

        let events = await eventModel.retrieveAllWithCategory();

        // Search by Event Name
        if (searchTerm) {
            const regex = new RegExp(searchTerm, "i"); // case-insensitive
            events = events.filter(e => regex.test(e.EventName));
        }

        // Only show active events
        const filteredEvents = events.filter(e => e.Status === 'active');

        res.render("events/event", {
            events: filteredEvents,
            searchTerm // MUST pass this
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Error loading events");
    }
};

exports.getManageEvents = async (req, res) => {
    try {
        const searchTerm = req.query.search || ""; // get search query from URL
        let events = await eventModel.retrieveAllWithCategory(); // fetch all events with category
        const categories = await categoryModel.retrieveAll();

        if (searchTerm) {
            const regex = new RegExp(searchTerm, "i"); // case-insensitive search
            events = events.filter(e => regex.test(e.EventName));
        }

        res.render("events/eventmanage", { events, searchTerm, categories });
    } catch (err) {
        console.log(err);
        res.status(500).send("Error loading events");
    }
}

let newEventErrorMsg = [];

exports.getNewEvent = async (req, res) => {
    try {
        // get category list
        let categories = await categoryModel.retrieveAll();

        // TODO: uncomment this when mahshuk is done with category.
        // if (category.length === 0) {
        //     newEventErrorMsg.push("No category available, please contact admin");
        //     return res.render("events/eventnew", { error: newEventErrorMsg });
        // } else {
        //     return res.render("events/eventnew", { error: newEventErrorMsg, categories: category });
        // }

        return res.render("events/eventnew", { errors: newEventErrorMsg, categories });
    } catch (error) {
        // Log your errors
        newEventErrorMsg.push("Error loading page, please try again");
        res.redirect("/event/manage");
    }
}

exports.postNewEvent = async (req, res) => {
    newEventErrorMsg = [];

    if (!req.body.EventName || !req.body.EventDescription || !req.body.EventType || !req.body.MaxCapacity || !req.body.EndDateTime) {
        newEventErrorMsg.push("Please fill in all the fields");
    }

    if (newEventErrorMsg.length > 0) {
        return res.redirect("/event/new");
    }

    let newEvent = {
        EventID: generateUUID(),
        EventName: req.body.EventName,
        EventDescription: req.body.EventDescription,
        EventImage: req.file ? "/images/" + req.file.filename : "",
        EventType: req.body.EventType,
        MaxCapacity: Number(req.body.MaxCapacity),
        CreatedBy: req.user.userId,
        EndDateTime: new Date(req.body.EndDateTime), // Combine date and time from the form OR however u want to do it
        Status: 'active' // Set as default active, only edit can change this 
    }

    try {
        await eventModel.createEvent(newEvent);
        res.redirect("/event/manage");
    } catch (error) {
        console.error(error);
        newEventErrorMsg.push("Error creating new event, please try again");
        return res.redirect("/event/new");
    }
}

exports.getEventByID = async (req, res) => {
    let eventID = req.params.id;

    try {
        let events = await eventModel.getEventByID(eventID); // returns array
        let event = events[0]; // pick the first (and only) event

        let comments = await commentModel.retrieveCommentByEventId(eventID);

        if (!event) {
            return res.status(404).send("Event not found");
        }
        res.render("events/eventdetail", { event, comments });
    } catch (error) {
        // Log your errors
        res.redirect("/event");
    }
}

let editEventErrorMsg = [];

exports.getManageEventByID = async (req, res) => {
    let eventID = req.params.id;

    try {
        let events = await eventModel.getEventByID(eventID); // aggregation returns array
        let event = events[0];

        if (!event) {
            return res.redirect("/event/manage");
        }

        // convert EndDateTime to JS Date if it's not
        if (event.EndDateTime && !(event.EndDateTime instanceof Date)) {
            event.EndDateTime = new Date(event.EndDateTime);
        }

        res.render("events/eventmanagedetail", { event, categories: await categoryModel.retrieveAll(), errors: editEventErrorMsg });
    } catch (error) {
        console.error(error);
        res.redirect("/event/manage");
    }

}

exports.editEvent = async (req, res) => {
    let eventID = req.params.id;

    let errors = []; // reset

    // convert this to individual if statements and push to errors array
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
    }
    if (!req.body.EndDateTime) {
        errors.push("End Date & Time is required");
    }
    if (!req.body.Status) {
        errors.push("Status is required");
    }

    if (errors.length > 0) {
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
        res.status(200).json({ message: "Event updated successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating event" });
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