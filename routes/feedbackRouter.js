const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");

router.get("/", (req, res) => {
    res.send("testing")
})
router.get("/:eventId", feedbackController.getFeedbackForm);
router.post("/:eventId",feedbackController.submitFeedback)
router.get("/home", feedbackController.TopEvents)

module.exports = router;  


