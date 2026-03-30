const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");

router.get("/", (req, res) => {
    res.send("testing")
})

router.get("/history", feedbackController.getHistoryForm)
router.get("/seefeedback/:feedbackId", feedbackController.seeFeedbackForm)

router.get("/edit/:feedbackId", feedbackController.getEditFeedbackForm);
router.post("/edit/:feedbackId", feedbackController.postEditFeedbackForm);
router.post("/delete/:feedbackId", feedbackController.deleteFeedback);

router.get("/:eventId", feedbackController.getFeedbackForm);
router.post("/:eventId",feedbackController.submitFeedback)


module.exports = router;  


