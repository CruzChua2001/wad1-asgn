const mongoose = require('mongoose');
const { generateUUID } = require('../utils/uuidUtils');
const {formatDateTime} = require('../utils/dateUtils')

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
    },
    rating: { type: Number, default: 0 },
    attend: { type: Number, default: 0 },
    recommend: {type: Number, default:0},
    goals: {type:Number, default:0}
})

const Feedback = mongoose.model('Feedback', feedbackSchema, 'feedback');

exports.addfeedback = async(userId, eventId,  body) => {
    return Feedback.create(
    {FeedbackID: generateUUID(),
    EventID: eventId,
    UserID: userId,
    Feedback: body.feedback || "",
    CreatedDateTime: formatDateTime(new Date().toISOString()),
    isAnonymous: Number(body.isAnonymous) || 0,
    isDeleted: 0,
    rating: Number(body.rating) || 0,
    attend: Number(body.attend) || 0,
    recommend: Number(body.recommend) || 0,
    goals:Number(body.goals) || 0
    },
)
}
exports.getTopEvents = async () => {
    const feedbacks = await Feedback.find({ isDeleted: 0 });
    const topEvents = [];

    const eventMap = {};

    for (const feedback of feedbacks) {
        const eventId = feedback.EventID;
        const totalScore = feedback.rating + feedback.attend + feedback.recommend + feedback.goals;

        if (!eventMap[eventId]) {
            eventMap[eventId] = {
                totalScore: 0,
                numResponses: 0
            };
        }

        eventMap[eventId].totalScore += totalScore;
        eventMap[eventId].numResponses += 1;
    }

    for (const eventId in eventMap) {
        const event = await Event.findOne({ eventId: eventId });

        if (event) {
            topEvents.push({
                eventId: event.eventId,
                eventName: event.eventName,
                avgScore: eventMap[eventId].totalScore / eventMap[eventId].numResponses,
                numResponses: eventMap[eventId].numResponses
            });
        }
    }

    topEvents.sort((a, b) => b.avgScore - a.avgScore);

    return topEvents.slice(0, 10);
};

const Event = require("./event")

exports.getHistory = async (userId) => {
    const feedbacks = await Feedback.find({
        UserID: userId,
        isDeleted: 0
    }).sort({ CreatedDateTime: -1 })

    const history = []

    for (const feedback of feedbacks) {
        const event = await Event.findOne({ eventId: feedback.EventID })

        history.push({
            FeedbackID: feedback.FeedbackID,
            EventID: feedback.EventID,
            EventName: event ? event.eventName : "Unknown Event",
            CreatedDateTime: feedback.CreatedDateTime
        })
    }

    return history
}


exports.getFeedbackByID = async (feedbackId, userId) => {
    const feedback = await Feedback.findOne({
        FeedbackID: feedbackId,
        UserID: userId,
        isDeleted: 0
    })

    if (!feedback) return null

    const event = await Event.findOne({ eventId: feedback.EventID })

    return {
        FeedbackID: feedback.FeedbackID,
        EventID: feedback.EventID,
        EventName: event ? event.eventName : "Unknown Event",
        Feedback: feedback.Feedback,
        isAnonymous: feedback.isAnonymous,
        rating: feedback.rating,
        attend: feedback.attend,
        recommend: feedback.recommend,
        goals: feedback.goals,
        CreatedDateTime: feedback.CreatedDateTime
    }
}

exports.updateFeedbackByID = async (feedbackId, userId, body) => {
    const feedback = await Feedback.findOne({
        FeedbackID: feedbackId,
        UserID: userId,
        isDeleted: 0
    });

    if (!feedback) {
        return null;
    }

    await Feedback.updateOne(
        {
            FeedbackID: feedbackId,
            UserID: userId,
            isDeleted: 0
        },
        {
            $set: {
                Feedback: body.feedback || "",
                isAnonymous: Number(body.isAnonymous) || 0,
                rating: Number(body.rating) || 0,
                attend: Number(body.attend) || 0,
                recommend: Number(body.recommend) || 0,
                goals: Number(body.goals) || 0
            }
        }
    );

    return await Feedback.findOne({
        FeedbackID: feedbackId,
        UserID: userId,
        isDeleted: 0
    });
};

exports.deleteFeedbackByID = async (feedbackId, userId) => {
    return Feedback.findOneAndUpdate(
        {
            FeedbackID: feedbackId,
            UserID: userId,
            isDeleted: 0
        },
        {
            isDeleted: 1
        },
        { new: true }
    );
};