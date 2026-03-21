const eventModel = require("../models/eventModel");

exports.getAllEvents = async (req, res) => {
    try {
        const events = await eventModel.retrieveAll();
        res.render("events/event", { events });
    } catch (err) {
        console.log(err);
        res.send("Error loading events");
    }
};

