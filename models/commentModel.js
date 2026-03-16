const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    CommentID: {
        type: String,
        required: [true, "Comment require a CommentId"]
    },
    EventId: {
        type: String,
        required: [true, "Comment require an EventId"]
    },
    UserId: {
        type: String,
        required: [true, "Comment require a UserId"]
    },
    Comment: {
        type: String,
        required: [true, "Comment require a Comment"]
    },
    CreatedDateTime: {
        type: Date,
        required: [true, "Comment require a CreatedDateTime"]
    },
    Reply: [{
        ReplyID: {
            type: String,
            required: [true, "Reply require a ReplyId"]
        },
        EventId: {
            type: String,
            required: [true, "Reply require an EventId"]
        },
        UserId: {
            type: String,
            required: [true, "Reply require a UserId"]
        },
        Comment: { 
            type: String,
            required: [true, "Reply require a Comment"]
        },
        CreatedDateTime: {
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
    return Comment.find({ EventId: eventId, isDeleted: 0 });
}