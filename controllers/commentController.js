const { generateUUID } = require("../utils/uuidUtils");
const { formatDateTime } = require("../utils/dateUtils");
const commentModel = require("../models/commentModel");

exports.createComment = async (req, res) => {
    let eventId = req.params.eventId;
    let userId = req.user.userId;
    let commentText = req.body.commentText;
    let isAnonymous = req.body.isAnonymous ? 1 : 0;

    let newComment = {
        CommentID: generateUUID(),
        EventID: eventId,
        UserID: userId,
        Comment: commentText,
        Reply: [],
        CreatedAt: formatDateTime(new Date().toISOString()),
        isAnonymous: isAnonymous
    }

    try {
        await commentModel.createComment(newComment);
        res.status(200).send({ message: "Comment created successfully" });
    } catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).send({ message: "There was a problem adding the comment. Please try again." });
    }
}

exports.editComment = async (req, res) => {
    console.log("Editing comment with ID:", req.body.commentText);
    let commentId = req.params.id;
    let newCommentText = req.body.commentText;
    let isAnonymous = req.body.isAnonymous ? 1 : 0;

    try {
        await commentModel.editComment(commentId, newCommentText, isAnonymous);
        res.status(200).send({ message: "Comment edited successfully" });
    } catch (error) {
        console.error("Error editing comment:", error);
        res.status(500).send({ message: "There was a problem editing the comment. Please try again." });   
    }
}

exports.deleteComment = async (req, res) => {
    let commentId = req.params.id;

    try {
        await commentModel.deleteComment(commentId);
        res.status(200).send({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).send({ message: "There was a problem deleting the comment. Please try again." });   
    }
}

exports.addReply = async (req, res) => {
    let commentId = req.params.id;
    let userId = req.user.userId;
    let replyText = req.body.replyText;
    let isAnonymous = req.body.isAnonymous ? 1 : 0; 

    let newReply = {
        ReplyID: generateUUID(),
        UserID: userId,
        Comment: replyText,
        isAnonymous: isAnonymous,
        CreatedAt: formatDateTime(new Date().toISOString())
    }

    try {
        await commentModel.addReply(commentId, newReply);
        res.status(200).send({ message: "Reply added successfully" });
    } catch (error) {
        console.error("Error adding reply:", error);
        res.status(500).send({ message: "There was a problem adding the reply. Please try again." });   
    }
}

exports.editReply = async (req, res) => {
    let commentId = req.params.id;
    let replyId = req.params.replyId;
    let newReplyText = req.body.replyText;
    let isAnonymous = req.body.isAnonymous ? 1 : 0;

    try {
        await commentModel.editReply(commentId, replyId, newReplyText, isAnonymous);
        res.status(200).send({ message: "Reply edited successfully" });
    } catch (error) {
        console.error("Error editing reply:", error);
        res.status(500).send({ message: "There was a problem editing the reply. Please try again." });   
    }
}

exports.deleteReply = async (req, res) => {
    let commentId = req.params.id;
    let replyId = req.params.replyId;

    try {
        await commentModel.deleteReply(commentId, replyId);
        res.status(200).send({ message: "Reply deleted successfully" });
    } catch (error) {
        console.error("Error deleting reply:", error);
        res.status(500).send({ message: "There was a problem deleting the reply. Please try again." });   
    }
}