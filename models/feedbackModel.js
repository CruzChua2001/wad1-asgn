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
    isAnonymous: Number(body.isAnonymous),
    isDeleted: 0,
    rating: Number(body.rating),
    attend: Number(body.attend),
    recommend: Number(body.recommend),
    goals:Number(body.goals)
    },
)
}
exports.getTopEvents =  () => {
    return Feedback.aggregate([
      {
        $addFields: {
          totalScore: { $add: ["$rating", "$attend", "$recommend", "$goals"] }
        }
      },
      {
        $group: {
          _id: "$EventId",
          EventName: { $first: "$EventName" },
          avgScore: { $avg: "$totalScore" }, 
          numResponses: { $sum: 1 }          
        }
      },
     {
        $lookup: {
            from: "events",             
            localField: "_id",          
            foreignField: "eventId",    
            as: "eventDetails"
        }
    },
        {
            $unwind: "$eventDetails"
        },
        {
            $project: {
                _id: 1,
                eventName: "$eventDetails.eventName",
                avgScore: 1,
                numResponses: 1
            }
        },
      { $sort: { avgScore: -1 } },

      { $limit: 10 }
    ]);
}

exports.getHistory = (userId) => {
    return Feedback.aggregate([
        {
            $match: {
                UserID: userId,
                isDeleted: 0
            }
        },
        {
            $lookup: {
                from: "event", 
                localField: "EventID",
                foreignField: "eventId",
                as: "eventDetails"
            }
        },
        {
            $unwind: "$eventDetails"
        },
        {
            $project: {
                _id: 0,
                FeedbackID: 1,
                EventID: 1,
                EventName: "$eventDetails.eventName",
                CreatedDateTime: 1
            }
        },
        {
            $sort: {
                CreatedDateTime: -1
            }
        }
    ])
}

exports.retrieveFeedbackByEventID = (eventID) => {
    return Feedback.find({ EventID: eventID, isDeleted: 0 });
}