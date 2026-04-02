const express = require("express");
const router = express.Router();

const commentController = require("../controllers/commentController");

router.post("/:eventId", commentController.createComment);

router.patch("/:id", commentController.editComment);

router.delete("/delete/:id", commentController.deleteComment);

router.post("/reply/:id", commentController.addReply);

router.patch("/reply/:id/:replyId", commentController.editReply);

router.delete("/reply/:id/:replyId", commentController.deleteReply);

module.exports = router;