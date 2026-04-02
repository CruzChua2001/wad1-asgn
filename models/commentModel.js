const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    CommentID: {
        type: String,
        required: [true, "Comment require a CommentId"]
    },
    EventID: {
        type: String,
        required: [true, "Comment require an EventId"]
    },
    UserID: {
        type: String,
        required: [true, "Comment require a UserId"]
    },
    Comment: {
        type: String,
        required: [true, "Comment require a Comment"]
    },
    CreatedAt: {
        type: Date,
        required: [true, "Comment require a CreatedDateTime"]
    },
    Reply: [{
        ReplyID: {
            type: String,
            required: [true, "Reply require a ReplyId"]
        },
        UserID: {
            type: String,
            required: [true, "Reply require a UserID"]
        },
        Comment: { 
            type: String,
            required: [true, "Reply require a Comment"]
        },
        isAnonymous: {
            type: Number,
            required: [true, "Reply require an isAnonymous"]
        },
        CreatedAt: {
            type: Date,
            required: [true, "Reply require a CreatedDateTime"]
        }
    }],
    isAnonymous: {
        type: Number,
        required: [true, "Comment require an isAnonymous"]
    },
    isDeleted: {
        type: Number,
        default: 0
    }
})

const Comment = mongoose.model("Comment", commentSchema, "comment");

exports.retrieveCommentByEventId = (eventId) => {
    return Comment.aggregate([
        { $match: { EventID: eventId, isDeleted: 0 } },
        { $lookup: {
            from: "user",
            localField: "UserID",
            foreignField: "UserID",
            as: "userDetails"
        }},
        { $unwind: "$userDetails" },
        { $unwind: { path: "$Reply", preserveNullAndEmptyArrays: true } },
        { $lookup: {
            from: "user",
            localField: "Reply.UserID",
            foreignField: "UserID",
            as: "replyUserDetails"
        }},
        { $addFields: {
            "FullName": { $concat: ["$userDetails.FirstName", " ", "$userDetails.LastName"] },
            "Reply.FullName": {
                $cond: {
                    if: { $ifNull: ["$Reply.ReplyID", false] },
                    then: {
                        $cond: {
                            if: { $gt: [{ $size: "$replyUserDetails" }, 0] },
                            then: { $concat: [{ $arrayElemAt: ["$replyUserDetails.FirstName", 0] }, " ", { $arrayElemAt: ["$replyUserDetails.LastName", 0] }] },
                            else: "Unknown User"
                        }
                    },
                    else: "$$REMOVE"
                }
            }
        }},
        { $project: { replyUserDetails: 0, userDetails: 0 } },
        { $sort: { "Reply.CreatedAt": -1 } },
        { $group: {
            _id: "$_id",
            CommentID: { $first: "$CommentID" },
            EventID: { $first: "$EventID" },
            UserID: { $first: "$UserID" },
            Comment: { $first: "$Comment" },
            CreatedAt: { $first: "$CreatedAt" },
            isAnonymous: { $first: "$isAnonymous" },
            FullName: { $first: "$FullName" },
            Reply: {
                $push: {
                    $cond: {
                        if: { $ifNull: ["$Reply.ReplyID", false] },
                        then: "$Reply",
                        else: "$$REMOVE"
                    }
                }
            }
        }},
        { $sort: { CreatedAt: -1 } }
    ])
}

exports.createComment = (comment) => {
    return Comment.create(comment);
}

exports.editComment = (commentId, newCommentText, isAnonymous) => {
    return Comment.updateOne(
        { CommentID: commentId },
        { $set: { Comment: newCommentText, isAnonymous: isAnonymous } }
    );
}

exports.deleteComment = (commentId) => {
    return Comment.updateOne(
        { CommentID: commentId },
        { $set: { isDeleted: 1 } }
    );
}

exports.addReply = (commentId, reply) => {
    return Comment.updateOne(
        { CommentID: commentId },
        { $push: { Reply: reply } }
    );
}

exports.editReply = (commentId, replyId, newReplyText, isAnonymous) => {
    return Comment.updateOne(
        { CommentID: commentId, "Reply.ReplyID": replyId },
        { $set: { "Reply.$.Comment": newReplyText, "Reply.$.isAnonymous": isAnonymous } }
    );
}

exports.deleteReply = (commentId, replyId) => {
    return Comment.updateOne(
        { CommentID: commentId },
        { $pull: { Reply: { ReplyID: replyId } } }
    );
}
