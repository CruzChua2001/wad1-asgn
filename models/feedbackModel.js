const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    FeedbackID: {
        type: String,
        required: [true, 'Feedback require a FeedbackID']
    },
    EventID: {
        type: String,
        required: [true, 'Feedback require an EventID']
    },
    UserID: {
        type: String,
        required: [true, 'Feedback require a UserID']
    },
    Feedback: {
        type: String,
        required: [true, 'Feedback require a Feedback']
    },
    CreatedDateTime: {
        type: Date,
        default: Date.now
    },
    isAnonymous: {
        type: Number,
        required: [true, 'Feedback require an isAnonymous'],
        enum: [0, 1]
    },
    isDeleted: {
        type: Number,
        default: 0,
        enum: [0, 1]
    }
})

const Feedback = mongoose.model('Feedback', feedbackSchema, 'feedback');

exports.retrieveFeedbackByEventID = (eventID) => {
    return Feedback.find({ EventID: eventID, isDeleted: 0 });
}