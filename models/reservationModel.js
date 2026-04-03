
// Get event details for a single event
const mongoose = require('mongoose');
const { retrieveById } = require('./eventModel');

// Update event's CurrentCapacity by EventID (for use in reserveController)
exports.updateEventCapacityById = (eventId, newCapacity) => {
    const Event = mongoose.model('Event');
    return Event.findOneAndUpdate({ EventID: eventId, isDeleted: 0 }, { CurrentCapacity: newCapacity }, { new: true });
};

const reservationSchema = new mongoose.Schema({
    ReservationID: {
        type: String,
        required: [true, "Reservation require a ReservationID"]
    },
    EventId: {
        type: String,
        required: [true, "Reservation require an EventId"]
    },
    UserId: {
        type: String,
        required: [true, "Reservation require a UserId"]
    },
    Status: {
        type: String,
        required: [true, "Reservation require a Status"],
        enum: ["pending", "waitlist", "approved", "rejected"]
    },
    CreatedBy: {
        type: String,
        required: [true, "Reservation require a CreatedBy"]
    },
    ApprovedBy: {
        type: String,
    },
    CreatedDateTime: {
        type: Date,
        required: [true, "Reservation require a CreatedDateTime"]
    },
    WaitlistNo: {
        type: Number,
        required: [true, "Reservation require a WaitlistNo"]
    },
        numofppl: {
        type: Number,
        required: [true, "Reservation require a minimum of 1 person"],
        min: [1, "Number of people must be at least 1"]
    },
    isDeleted: {
        type: Number,
        default: 0
    }
})

const Reservation = mongoose.model("Reservation", reservationSchema, "reservation");

exports.getEventDetailsById = async (eventId) => {
    // Try to get event details via reservation aggregation
    const results = await Reservation.aggregate([
        { $match: { EventId: eventId, isDeleted: 0 } },
        {
            $lookup: {
                from: "event",
                localField: "EventId",
                foreignField: "EventID",
                as: "EventDetails"
            }
        },
        {
            $unwind: {
                path: "$EventDetails",
                preserveNullAndEmptyArrays: true
            }
        }
    ]);
    if (results.length > 0 && results[0].EventDetails) {
        return results[0].EventDetails;
    }
    // If not found, query event collection directly
    return await retrieveById(eventId);
};

// Get event details for reservation
exports.getEventDetailsForReservation = async (reservationId) => {
    const results = await Reservation.aggregate([
        { $match: { ReservationID: reservationId, isDeleted: 0 } },
        {
            $lookup: {
                from: "event",
                localField: "EventId",
                foreignField: "EventID",
                as: "EventDetails"
            }
        },
        {
            $unwind: {
                path: "$EventDetails",
                preserveNullAndEmptyArrays: true
            }
        }
    ]);
    return results.length > 0 ? results[0].EventDetails : null;
};

// Aggregation to join event details
exports.getReservationsWithEventDetails = async (filter = {}) => {
    // filter can be used to filter by user, etc.
    return await Reservation.aggregate([
        { $match: { ...filter, isDeleted: 0 } },
        {
            $lookup: {
                from: "event",
                localField: "EventId",
                foreignField: "EventID",
                as: "EventDetails"
            }
        },
        {
            $unwind: {
                path: "$EventDetails",
                preserveNullAndEmptyArrays: true
            }
        }
    ]);
};

exports.getUserName = async (filter = {}) => {
    // Use pipeline to get user's first and last name from user collection based on UserId in reservation
    const result = await Reservation.aggregate([
        { $match: { ...filter, isDeleted: 0 } },
        { $limit: 1 },
        {
            $lookup: {
                from: "user",
                localField: "UserId",
                foreignField: "UserID",
                as: "UserDetails"
            }
        },
        { $unwind: { path: "$UserDetails", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 0,
                firstName: "$UserDetails.FirstName",
                lastName: "$UserDetails.LastName"
            }
        }
    ]);
    if (result.length > 0) {
        return { firstName: result[0].firstName || "", lastName: result[0].lastName || "" };
    }
    return { firstName: "", lastName: "" };
};

exports.retrieveAll = () => {
    return Reservation.find({ isDeleted: 0 });
};

exports.retrieveById = (id) => {
    return Reservation.findOne({ ReservationID: id, isDeleted: 0 });
};

exports.countByEvent = (eventId) => {
    return Reservation.countDocuments({ EventId: eventId, isDeleted: 0 });
};

exports.retrieveByEventAndUser = (eventId, userId) => {
    return Reservation.findOne({ EventId: eventId, UserId: userId, isDeleted: 0 });
};

exports.retrieveByUser = (userId) => {
    return Reservation.find({ UserId: userId, isDeleted: 0 });
};

exports.retrieveWaitlistByEvent = (eventId) => {
    return Reservation.find({ EventId: eventId, Status: "waitlist", isDeleted: 0 })
        .sort({ WaitlistNo: 1, CreatedDateTime: 1 });
};
exports.retrievePending = (adminName) => {
    return Reservation.aggregate([
        { $match: { Status: "pending", isDeleted: 0 } },
        // Join to event to get EventType (CategoryID)
        {
            $lookup: {
                from: "event",
                localField: "EventId",
                foreignField: "EventID",
                as: "EventDetails"
            }
        },
        { $unwind: { path: "$EventDetails", preserveNullAndEmptyArrays: true } },
        // Join to category to get Approval field
        {
            $lookup: {
                from: "category",
                localField: "EventDetails.EventType",
                foreignField: "CategoryID",
                as: "CategoryDetails"
            }
        },
        { $unwind: { path: "$CategoryDetails", preserveNullAndEmptyArrays: true } },
        // Filter: only where Approval is "ALL" or matches the admin name
        {
            $match: {
                $or: [
                    { "CategoryDetails.Approval": "ALL" },
                    { "CategoryDetails.Approval": adminName }
                ]
            }
        },
        // Join to user for FullName
        {
            $lookup: {
                from: "user",
                localField: "UserId",
                foreignField: "UserID",
                as: "UserDetails"
            }
        },
        {
            $addFields: {
                "FullName": {
                    $cond: {
                        if: { $gt: [{$size: "$UserDetails"}, 0]},
                        then: {
                            $concat: [
                                {$arrayElemAt: ["$UserDetails.FirstName", 0]},
                                " ",
                                {$arrayElemAt: ["$UserDetails.LastName", 0]}
                            ]
                        },
                        else: "Unknown User"
                    }
                }
            }
        },
    ]);
}

exports.retrieveApprovedByAdminId = (adminId) => {
    // Add FullName field from user collection based on UserId in reservation
    return Reservation.aggregate([
        { $match: { Status: "approved", ApprovedBy: adminId, isDeleted: 0 } },
        {
            $lookup: {
                from: "user",
                localField: "UserId",
                foreignField: "UserID",
                as: "UserDetails"
            }
        },
        {
            $addFields: {
                "FullName": {
                    $cond: {
                        if: { $gt: [{$size: "$UserDetails"}, 0]},
                        then: {
                            $concat: [
                                {$arrayElemAt: ["$UserDetails.FirstName", 0]},
                                " ",
                                {$arrayElemAt: ["$UserDetails.LastName", 0]}
                            ]
                        },
                        else: "Unknown User"
                    }
                }
            }
        },
    ]);
}

exports.create = (reservationData) => {
    const reservation = new Reservation(reservationData);
    return reservation.save();
};

exports.updatepax = (id, numofppl) => {
    return Reservation.findOneAndUpdate({ ReservationID: id, isDeleted: 0 }, { numofppl: numofppl }, { new: true });
}

exports.update = (id, updateData) => {
    return Reservation.findOneAndUpdate({ ReservationID: id, isDeleted: 0 }, updateData, { new: true });
};

exports.delete = (id) => {
    return Reservation.findOneAndUpdate({ ReservationID: id, isDeleted: 0 }, { isDeleted: 1 }, { new: true });
};



