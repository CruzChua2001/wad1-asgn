const eventModel = require("../models/eventModel");
const categoryModel = require("../models/categoryModel");

const generateUUID = require('../utils/uuidUtils').generateUUID;

exports.getAllEvents = async (req, res) => {
    try {
        const events = await eventModel.retrieveAllWithCategory();

        const filteredEvents = events.filter(e => e.Status === 'active')

        res.render("events/event", { events: filteredEvents });
    } catch (err) {
        console.log(err);
        res.send("Error loading events");
    }
};

exports.getManageEvents = async (req, res) => {
    try {
        const searchTerm = req.query.search || ""; // get search query from URL
        let events = await eventModel.retrieveAllWithCategory(); // fetch all events with category

        if (searchTerm) {
            const regex = new RegExp(searchTerm, "i"); // case-insensitive search
            events = events.filter(e => regex.test(e.EventName));
        }

        res.render("events/eventmanage", { events, searchTerm });
    } catch (err) {
        console.log(err);
        res.send("Error loading events");
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
        EventImage: "", // Leave it empty first
        EventType: req.body.EventType,
        MaxCapacity: Number(req.body.MaxCapacity),
        CreatedBy: "adm001", // req.user.UserID, use this when can login
        EndDateTime: new Date(req.body.EndDateTime), // Combine date and time from the form OR however u want to do it
        Status: 'active' // Set as default active, only edit can change this 
    }

    try {
        await eventModel.createEvent(newEvent);
        res.redirect("/event/manage");
    } catch (error) {
        // Log your errors
        // TODO: Replace the error message
        newEventErrorMsg.push("Error creating new event, please try again");
        return res.redirect("/event/new");
    }
}

exports.getEventByID = async (req, res) => {
    let eventID = req.params.id;

    try {
        let events = await eventModel.getEventByID(eventID); // returns array
        let event = events[0]; // pick the first (and only) event
        
        if (!event) {
            return res.status(404).send("Event not found");
        }
        res.render("events/eventdetail", { event });
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

    editEventErrorMsg = []; // reset

    if (!req.body.EventName || !req.body.EventDescription || !req.body.EventType || !req.body.MaxCapacity || !req.body.EndDateTime || !req.body.Status) {
        return res.status(400).json({ message: "Please fill in all the fields" });
    }

    const updatedEvent = {
        EventName: req.body.EventName,
        EventDescription: req.body.EventDescription,
        EventType: req.body.EventType,
        MaxCapacity: Number(req.body.MaxCapacity),
        EndDateTime: new Date(req.body.EndDateTime),
        Status: req.body.Status
    };

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
        let response = await eventModel.deleteEvent(eventID);

        if (response.deletedCount === 0) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting event, please try again" });
    }
}