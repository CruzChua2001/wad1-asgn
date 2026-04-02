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

// Event Management (R)
// Retrieve all events that are not deleted
exports.retrieveAll = () => {
    return Event.find({ isDeleted: 0 });
}

// Retrieve all events with Category details using aggregation
exports.retrieveAllWithCategory = () => {
    return Event.aggregate([
        { $match: { isDeleted: 0 } }, 
        {
            $lookup: {
                from: "category",       // Collection name of categories
                localField: "EventType", // Event.EventType
                foreignField: "CategoryID", // Category.CategoryID
                as: "categoryDetails"       // Output field
            }
        },
        { $unwind: "$categoryDetails" } // Convert array to object
    ]);
}

// Get event by ID
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
            $lookup: {
                from: "feedback",
                localField: "EventID",
                foreignField: "EventID",
                as: "feedbackDetails"
            }
        },
        {
            $lookup: {
                from: "reservation",
                let: { eventId: "$EventID" },
                pipeline: [
                    { $match: { $expr: { $and: [
                        { $eq: ["$EventId", "$$eventId"] },
                        { $eq: ["$Status", "approved"] },
                        { $eq: ["$isDeleted", 0] }
                    ] } } },
                    {
                        $lookup: {
                            from: "user",
                            localField: "UserId",
                            foreignField: "UserID",
                            as: "userInfo"
                        }
                    },
                    { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            _id: 0,
                            UserID: "$UserId",
                            UserName: { $concat: ["$userInfo.FirstName", " ", "$userInfo.LastName"] },
                            numofppl: "$numofppl",
                            ReservationID: "$ReservationID"
                        }
                    }
                ],
                as: "approvedParticipants"
            }
        },
        {
            $unwind: {
                path: "$categoryDetails",
                preserveNullAndEmptyArrays: true  // <-- allow event even if no matching category
            }
        },
        {
            $addFields: {
                averageScore: {
                    $cond: {
                        if: { $gt: [{ $size: "$feedbackDetails" }, 0] },
                        then: {
                            $round: [
                                { $divide: [
                                    { $sum: {
                                        $map: {
                                            input: "$feedbackDetails",
                                            as: "fb",
                                            in: { $add: ["$$fb.rating", "$$fb.attend", "$$fb.recommend", "$$fb.goals"] }
                                        }
                                    }},
                                    { $size: "$feedbackDetails" }
                                ]},
                                2
                            ]
                        },
                        else: 0
                    }
                }
            }
        }
    ]);
}

// Event Management (C)
exports.createEvent = (newEvent) => {
    return Event.create(newEvent);
}

// Event Management (U)
exports.updateEvent = (eventID, updatedEventData) => {
    return Event.updateOne({ EventID: eventID }, updatedEventData);
}

// Event Management (D)
exports.deleteEvent = (eventID) => {
    return Event.deleteOne({ EventID: eventID });
}
exports.retrieveEventName = (EventId) =>{
    return Event.findOne({EventID:EventId,isDeleted:0}).select('EventName')
}
exports.retrieveById = (id) => {
    return Event.findOne({ EventID: id, isDeleted: 0 });
};

exports.updateCapacityById = (id, newCapacity) => {
    return Event.findOneAndUpdate({ EventID: id, isDeleted: 0 }, { CurrentCapacity: newCapacity }, { new: true });
};

exports.retrieveByCategoryId = (categoryId) =>{
    return Event.find({EventType:categoryId,isDeleted:0})
}

exports.retrieveByEventid = (eventId) =>{
    return Event.findOne({ EventID: eventId, isDeleted: 0 }).select("EventType CurrentCapacity MaxCapacity")
}

exports.updateEventPax = (eventId,pax) =>{
    return Event.updateOne({EventID:eventId},{CurrentCapacity:pax});
}
// Cancel a reservation, update event capacity, and promote waitlist users if possible (pipeline/aggregation style)
exports.cancelReservationAndPromoteWaitlist = async function(eventId, reservationId, numofppl) {
    const db = mongoose.connection;
    const reservationCol = db.collection('reservation');
    const eventCol = db.collection('event');

    // 1. Cancel the reservation (set isDeleted=1, Status="cancelled")
    const cancelled = await reservationCol.updateOne(
        { ReservationID: reservationId, EventId: eventId, isDeleted: 0 },
        { $set: { isDeleted: 1, Status: "cancelled" } }
    );
    if (!cancelled.matchedCount) return { success: false, message: "Reservation not found or already cancelled." };

    // 2. Get event and update current capacity (decrement by numofppl)
    const eventArr = await eventCol.aggregate([
        { $match: { EventID: eventId, isDeleted: 0 } },
        { $limit: 1 }
    ]).toArray();
    if (!eventArr.length) return { success: false, message: "Event not found." };
    let event = eventArr[0];
    let newCapacity = Math.max(0, (event.CurrentCapacity || 0) - (numofppl || 1));
    await eventCol.updateOne({ EventID: eventId, isDeleted: 0 }, { $set: { CurrentCapacity: newCapacity } });

    // 3. Promote waitlist users if possible (aggregation pipeline style)
    const waitlist = await reservationCol.aggregate([
        { $match: { EventId: eventId, Status: "waitlist", isDeleted: 0 } },
        { $sort: { WaitlistNo: 1, CreatedDateTime: 1 } },
        { $project: { ReservationID: 1, numofppl: 1 } }
    ]).toArray();
    let promoted = [];
    for (let w of waitlist) {
        if (newCapacity + w.numofppl <= event.MaxCapacity) {
            await reservationCol.updateOne(
                { ReservationID: w.ReservationID },
                { $set: { Status: "approved", WaitlistNo: null } }
            );
            newCapacity += w.numofppl;
            promoted.push(w.ReservationID);
            await eventCol.updateOne({ EventID: eventId, isDeleted: 0 }, { $set: { CurrentCapacity: newCapacity } });
        } else {
            break;
        }
    }
    return { success: true, promoted, newCapacity };
};