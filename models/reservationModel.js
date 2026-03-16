const mongoose = require('mongoose');

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
        required: [true, "Reservation require an ApprovedBy"]
    },
    CreatedDateTime: {
        type: Date,
        required: [true, "Reservation require a CreatedDateTime"]
    },
    WaitlistNo: {
        type: Number,
        required: [true, "Reservation require a WaitlistNo"]
    },
    isDeleted: {
        type: Number,
        default: 0
    }
})

const Reservation = mongoose.model("Reservation", reservationSchema, "reservation");

exports.retrieveAll = () => {
    return Reservation.find();
}