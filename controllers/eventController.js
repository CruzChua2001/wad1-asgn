const eventModel = require("../models/eventModel");
const categoryModel = require("../models/categoryModel");

const generateUUID = require('../utils/uuidUtils').generateUUID;

exports.getAllEvents = async (req, res) => {
    try {
        const events = await eventModel.retrieveAll();
        res.render("events/event", { events });
    } catch (err) {
        console.log(err);
        res.send("Error loading events");
    }
};

exports.getManageEvents = async (req, res) => {
    // TODO: Retrieve all events and pass it to the eventmanage.ejs page

    res.render("events/eventmanage");
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
        res.redirect("/event/manage");
    }
}

exports.postNewEvent = async (req, res) => {
    newEventErrorMsg = [];
    // TODO:
    // 1. Get the details from the form
        // Check for empty fields and push error message
        /* Example:
        if (!req.body.EventName || !req.body.EventDescription || !req.body.EventType || !req.body.MaxCapacity || !req.body.EndDateTime) {
            newEventErrorMsg.push("Please fill in all the fields");
        }

        if (newEventErrorMsg.length > 0) {
            return res.redirect("/event/new");
        }
        */
    // 2. Create a new event using the details
            /* Example:
            const newEvent = {
                EventID: generateUUID(),
                EventName: req.body.EventName,
                EventDescription: req.body.EventDescription,
                EventImage: "", // Leave it empty first
                EventType: req.body.EventType,
                CurrentCapacity: 0, // Set it to 0 for new event
                MaxCapacity: req.body.MaxCapacity, // Convert to Number
                CreatedBy: req.user.UserID, // u can get the userid from this
                EndDateTime: req.body.EndDateTime, // Combine date and time from the form OR however u want to do it
                Status: 'active' // Set as default active, only edit can change this 
            }
            */
    // 3. In your eventModel, create a function for creating a new event
        // Example: eventModel.createEvent(newEvent);

    try {
        // Save the new event to the database
        
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
        let event = await eventModel.getEventByID(eventID);
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
        // TODO: Use the model to retrieve the event by ID
        // Example: let event = await eventModel.getEventByID(eventID);
        // get category list
        let categories = await categoryModel.retrieveAll();
        
        // TODO: add event inside the object
        res.render("events/eventmanagedetail", { errors: editEventErrorMsg, categories});
    } catch (error) {
        // Log your errors
        res.redirect("/event/manage");
    }
}

exports.editEvent = async (req, res) => {
    let eventID = req.params.id;
    
    // TODO: Get the details from the form
    // 1. Check for empty fields and push error message
            /* Example:
            if (!req.body.EventName || !req.body.EventDescription || !req.body.EventType || !req.body.MaxCapacity || !req.body.EndDateTime) {
                editEventErrorMsg.push("Please fill in all the fields");
            }

            if (editEventErrorMsg.length > 0) {
                return res.redirect(`/event/${eventID}`);
            }
            */
    // 2. Create an updated event object using the details
            /* Example:
            const updatedEvent = {
                EventName: req.body.EventName,
                EventDescription: req.body.EventDescription,
                EventType: req.body.EventType,
                MaxCapacity: req.body.MaxCapacity, // Convert to Number
                EndDateTime: req.body.EndDateTime, // Combine date and time from the form OR however u want to do it
            }
            */
    // 3. In your eventModel, create a function for updating an event
        // Example: eventModel.updateEvent(eventID, updatedEvent);

    try {
        // Update the event in the database
        
        res.redirect("/event/manage");
    } catch (error) {
        // Log your errors
        editEventErrorMsg.push("Error updating event, please try again");
        return res.redirect(`/event/${eventID}`);
    }
}

exports.deleteEvent = async (req, res) => {
    let eventID = req.params.id;

    try {
        // TODO: Use the model to delete the event
        /* Example: let response await eventModel.deleteEvent(eventID);
        if (response.deletedCount === 0) {
            return res.status(404).json({ message: "Event not found" });
        }
        */
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        // Log your errors
        res.status(500).json({ message: "Error deleting event, please try again" });
    }
}