const {addfeedback, getTopEvents, getHistory, getFeedbackByID, updateFeedbackByID, deleteFeedbackByID} = require("../models/feedbackModel")
const Event = require("../models/eventModel")

const ratings = [1,2,3,4,5]
exports.getFeedbackForm = (req,res) => {
    let eventId = req.params.eventId
    res.render("feedback/feedback", {ratings, eventId})
}

exports.submitFeedback = async (req,res) => {
    try {
        const userId = req.user.userId
        const eventId = req.params.eventId
        const event = await Event.findOne({eventId:eventId})

        await addfeedback(userId, eventId, req.body)
        res.redirect("/")
        } catch (error) {
          console.log(error)
          res.send("Error fetching feedback")};
        }

exports.TopEvents = async (req, res) => {
  try {
    const topEvents = await getTopEvents()
    res.render("home", { topEvents });
  } catch (error) {
    console.error(error);
    res.send("Error fetching top events");
  }
};

exports.getHistoryForm = async(req,res) => {
  try{
    const userId = req.user.userId
    const history = await getHistory(userId)
    res.render("history", {history})
  }
  catch(error) {
    console.log(error);
    res.send("Error fetching history");
  }
}

exports.seeFeedbackForm = async (req, res) => {
    try {
        const userId = req.user.userId
        const feedbackId = req.params.feedbackId

        const feedback = await getFeedbackByID(feedbackId, userId)

        if (!feedback) {
            return res.send("Feedback not found")
        }

        res.render("seeFeedbackForm", { feedback })
    } catch (error) {
        console.error(error)
        res.send("Error fetching feedback details")
    }
}

exports.getEditFeedbackForm = async (req, res) => {
    try {
        const userId = req.user.userId;
        const feedbackId = req.params.feedbackId;

        const feedback = await getFeedbackByID(feedbackId, userId);

        if (!feedback) {
            return res.send("Feedback not found");
        }

        res.render("feedback/editFeedback", { feedback, ratings: [1, 2, 3, 4, 5] });
    } catch (error) {
        console.error(error);
        res.send("Error loading edit feedback form");
    }
};

exports.postEditFeedbackForm = async (req, res) => {
    try {
        const userId = req.user.userId;
        const feedbackId = req.params.feedbackId;

        const updatedFeedback = await updateFeedbackByID(feedbackId, userId, req.body);

        if (!updatedFeedback) {
            return res.send("Feedback not found or could not be updated");
        }

        res.redirect(`/feedback/seefeedback/${feedbackId}`);
    } catch (error) {
        console.error(error);
        res.send("Error updating feedback");
    }
};

exports.deleteFeedback = async (req, res) => {
    try {
        const userId = req.user.userId;
        const feedbackId = req.params.feedbackId;

        const deletedFeedback = await deleteFeedbackByID(feedbackId, userId);

        if (!deletedFeedback) {
            return res.send("Feedback not found or already deleted");
        }

        res.redirect("/feedback/history");
    } catch (error) {
        console.error(error);
        res.send("Error deleting feedback");
    }
};