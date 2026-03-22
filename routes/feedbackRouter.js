const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
router.use(requireAuth)
router.get("/", (req, res) => {
    res.send("testing")
})
router.get("/:eventId", feedbackController.getFeedbackForm);
router.post("/:eventId", requireAuth,feedbackController.submitFeedback)

module.exports = router;  


