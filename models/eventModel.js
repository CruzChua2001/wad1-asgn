const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    EventID: {
        type: String,
        required: [true, 'Event require an EventID']
    },
    EventName: {
        type: String,
        required: [true, 'Event require an EventName']
    },
    EventDescription: {
        type: String,
        required: [true, 'Event require an EventDescription']
    },
    EventImage: {
        type: String
    },
    EventType: {
        type: String,
        required: [true, 'Event require an EventType']
    },
    MaxCapacity: {
        type: Number,
        required: [true, 'Event require a MaxCapacity']
    },
    CurrentCapacity: {
        type: Number,
        default: 0
    },
    ViewCount: {
        type: Number,
        default: 0
    },
    CreatedBy: {
        type: String,
        required: [true, 'Event require a CreatedBy']
    },
    CreatedDateTime: {
        type: Date,
        default: Date.now
    },
    EndDateTime: {
        type: Date,
        required: [true, 'Event require an EndDateTime']
    },
    Status: {
        type: String,
        required: [true, 'Event require a Status'],
        enum: ['active', 'inactive'] // restricts to only these 2 values
    },
    isDeleted: {
        type: Number,
        default: 0
    }
})

const Event = mongoose.model('Event', eventSchema, 'event');

exports.retrieveAll = () => {
    return Event.find({ isDeleted: 0 });
}

// Retrieve all events with Category details using aggregation
exports.retrieveAllWithCategory = () => {
    return Event.aggregate([
        { $match: { isDeleted: 0 } }, 
        {
            $lookup: {
                from: "category",       // collection name of categories
                localField: "EventType", // Event.EventType
                foreignField: "CategoryID", // Category.CategoryID
                as: "categoryDetails"
            }
        },
        { $unwind: "$categoryDetails" } // convert array to object
    ]);
}

exports.getEventByID = (eventID) => {
    return Event.aggregate([
        { $match: { EventID: eventID, isDeleted: 0 } },
        {
            $lookup: {
                from: "category",
                localField: "EventType",
                foreignField: "CategoryID",
                as: "categoryDetails"
            }
        },
        {
            $unwind: {
                path: "$categoryDetails",
                preserveNullAndEmptyArrays: true  // <-- allow event even if no matching category
            }
        }
    ]);
}

exports.createEvent = (newEvent) => {
    return Event.create(newEvent);
}

exports.updateEvent = (eventID, updatedEventData) => {
    return Event.updateOne({ EventID: eventID }, updatedEventData);
}

exports.deleteEvent = (eventID) => {
    return Event.deleteOne({ EventID: eventID });
}