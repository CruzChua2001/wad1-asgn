const mongoose = require('mongoose');
const { generateUUID } = require('../utils/uuidUtils');
const {formatDateTime} = require('../utils/dateUtils')
const Event = require("./eventModel")

//create feedback schema
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
        type: String
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

//create model
const Feedback = mongoose.model('Feedback', feedbackSchema, 'feedback');

//addfeedback method to create new feedback document 
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
//
exports.getTopEvents = async () => {
    //get feedback records that is not deleted
    const feedbacks = await Feedback.find({ isDeleted: 0 });
    //create empty array to store top events
    const topEvents = [];
    //create empty object to group feedback scores by event
    const eventMap = {};
    //loops through feedback, gets the eventid for each event, sum the totalscore
    for (const feedback of feedbacks) {
        const eventId = feedback.EventID;
        const totalScore = feedback.rating + feedback.attend + feedback.recommend + feedback.goals;
        //check if this event exist in eventmap, if not create a new key for the event
        if (!eventMap[eventId]) {
            eventMap[eventId] = {
                totalScore: 0,
                numResponses: 0
            };
        }
        //update the total score and the number of responses for a event
        eventMap[eventId].totalScore += totalScore;
        eventMap[eventId].numResponses += 1;
    }
    // loop through each event in eventMap and gets the event document from the event collection
    for (const eventId in eventMap) {
        const event = await Event.retrieveById(eventId);
    //if the event exist create an object with the eventid, eventName, avgscore, numresponses.
        if (event) {
            topEvents.push({
                eventId: event.EventID,
                eventName: event.EventName,
                eventImage: event.EventImage,
                avgScore: eventMap[eventId].totalScore / eventMap[eventId].numResponses,
                numResponses: eventMap[eventId].numResponses
            });
        }
    }
    //sort the objects in topEvents based on ascending order 
    topEvents.sort((a, b) => b.avgScore - a.avgScore);
    //slice the top 10
    return topEvents.slice(0, 10);
};

//get the feedback collection based on documents that match the userid of the current user that are not deleted and sort by createddatetime in descending order
exports.getHistory = async (userId) => {
    const feedbacks = await Feedback.find({
        UserID: userId,
        isDeleted: 0
    }).sort({ CreatedDateTime: -1 })
    //create an empty array to store feedback history
    const history = []
    //iterate through feedbacks  
    for (const feedback of feedbacks) {
        const event = await Event.retrieveById(feedback.EventID)
        //get the event details for the event by eventid, get eventname from event collection
        //push the history record into the array with feedbackid, eventid, eventname,createddatetime
        history.push({
            FeedbackID: feedback.FeedbackID,
            EventID: feedback.EventID,
            EventName: event ? event.EventName : "Unknown Event",
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

    const event = await Event.retrieveById(feedback.EventID)

    return {
        FeedbackID: feedback.FeedbackID,
        EventID: feedback.EventID,
        EventName: event ? event.EventName : "Unknown Event",
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
    //find feedback using feedbackid and userid and not deleted
    const feedback = await Feedback.findOne({
        FeedbackID: feedbackId,
        UserID: userId,
        isDeleted: 0
    });
    //if feedback does not exist, return null
    if (!feedback) {
        return null;
    }

    await Feedback.updateOne(
        //update the feedback record based on the criterias
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
    //return the updated document
    return await Feedback.findOne({
        FeedbackID: feedbackId,
        UserID: userId,
        isDeleted: 0
    });
};

//soft delete the feedback
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