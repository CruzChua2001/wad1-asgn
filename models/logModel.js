const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    LogID: {
        type: String,
        required: [true, "Log require a LogID"]
    },
    UserID: {
        type: String,
        required: [true, "Log require a UserID"]
    },
    Method: {
        type: String,
        required: [true, "Log require a Method"]
    },
    URL: {
        type: String,
        required: [true, "Log require a URL"]
    },
    StatusCode: {
        type: Number,
        required: [true, "Log require a StatusCode"]
    },
    IP: {
        type: String,
        required: [true, "Log require an IP"]
    },
    UserAgent: {
        type: String,
        required: [true, "Log require a UserAgent"]
    },
    CreatedAt:{
        type: Date,
        default: Date.now
    }
})

const Log = mongoose.model("Log", logSchema, "log");

exports.createLog = (newLog) => {
    return Log.create(newLog);
}

exports.retrieveLogsByUserId = (userId) => {
    return Log.aggregate([
        { $match: { UserID: userId } },
        { 
            $lookup: {
                from: "user",
                localField: "UserID",
                foreignField: "UserID",
                as: "userInfo"
            }
        },
        {
            $addFields: {
                "FullName": {
                    $cond: {
                        if: { $gt: [{$size: "$userInfo"}, 0]},
                        then: {
                            $concat: [
                                {$arrayElemAt: ["$userInfo.FirstName", 0]},
                                " ",
                                {$arrayElemAt: ["$userInfo.LastName", 0]}
                            ]
                        },
                        else: "Unknown User"
                    }
                }
            }
        },
        { $project: {userInfo: 0} },
        { $sort: { CreatedAt: -1 } }
    ]);
}