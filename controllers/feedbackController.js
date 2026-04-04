const {addfeedback, getHistory, getFeedbackByID, updateFeedbackByID, deleteFeedbackByID} = require("../models/feedbackModel")
const Event = require("../models/eventModel")

const ratings = [1,2,3,4,5]
exports.getFeedbackForm = (req,res) => {
    let eventId = req.params.eventId

    let errors = req.session.feedbackErrors ? req.session.feedbackErrors.errors : null
    delete req.session.feedbackErrors;

    res.render("feedback/feedback", {ratings, eventId, errors})
}

exports.submitFeedback = async (req,res) => {
    try {
        const userId = req.user.userId
        const eventId = req.params.eventId

        let { rating, attend, recommend, goals  } = req.body;
        let errors = [];

        if (!rating) {
            errors.push("Select a rating for your overall experience.");
        }

        if (!attend) {
            errors.push("Select how likely you are to attend similar events in the future.");
        }

        if (!recommend) {
            errors.push("Select how likely you are to recommend this event to a friend or colleague.");
        }

        if (!goals) {
            errors.push("Select how well this event helped you achieve your goals.");
        }

        if (errors.length > 0) {
            console.error("Validation errors:", errors);
            req.session.feedbackErrors = { errors };
            return res.redirect("/feedback/" + eventId);
        }

        await addfeedback(userId, eventId, req.body)
        res.redirect("/")
    } catch (error) {
        console.log(error)
        res.status(500).send("Error fetching feedback")
    };
}

exports.getHistoryForm = async(req,res) => {
  try{
    const userId = req.user.userId
    const history = await getHistory(userId)
    res.render("feedback/history", {history})
  }
  catch(error) {
    console.log(error);
    res.status(500).send("Error fetching history");
  }
}

exports.seeFeedbackForm = async (req, res) => {
    try {
        const userId = req.user.userId
        const feedbackId = req.params.feedbackId

        const feedback = await getFeedbackByID(feedbackId, userId)

        if (!feedback) {
            console.log("Feedback not found for ID:", feedbackId, "and user ID:", userId);
            return res.redirect("/feedback/history")
        }

        res.render("feedback/seeFeedback", { feedback })
    } catch (error) {
        console.error(error)
        res.status(500).send("Error fetching feedback details")
    }
}

exports.getEditFeedbackForm = async (req, res) => {
    try {
        const userId = req.user.userId;
        const feedbackId = req.params.feedbackId;

        const feedback = await getFeedbackByID(feedbackId, userId);

        if (!feedback) {
            console.log("Feedback not found for ID:", feedbackId, "and user ID:", userId);
            return res.redirect("/feedback/history")
        }

        let errors = req.session.editFeedbackErrors ? req.session.editFeedbackErrors.errors : null
        delete req.session.editFeedbackErrors;

        res.render("feedback/editFeedback", { feedback, ratings, errors });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading edit feedback form");
    }
};

exports.postEditFeedbackForm = async (req, res) => {
    try {
        const userId = req.user.userId;
        const feedbackId = req.params.feedbackId;

        const { rating, attend, recommend, goals } = req.body;
        let errors = [];

        if (!rating) {
            errors.push("Select a rating for your overall experience.");
        }

        if (!attend) {
            errors.push("Select how likely you are to attend similar events in the future.");
        }

        if (!recommend) {
            errors.push("Select how likely you are to recommend this event to a friend or colleague.");
        }

        if (!goals) {
            errors.push("Select how well this event helped you achieve your goals.");
        }

        if (errors.length > 0) {
            console.error("Validation errors:", errors);
            req.session.editFeedbackErrors = { errors };
            return res.redirect("/feedback/edit/" + feedbackId);
        }

        const updatedFeedback = await updateFeedbackByID(feedbackId, userId, req.body);

        if (!updatedFeedback) {
            console.log("Feedback not found or could not be updated for ID:", feedbackId, "and user ID:", userId);
            return res.redirect("/feedback/history");
        }

        res.redirect(`/feedback/seefeedback/${feedbackId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating feedback");
    }
};

exports.deleteFeedback = async (req, res) => {
    try {
        const userId = req.user.userId;
        const feedbackId = req.params.feedbackId;

        const deletedFeedback = await deleteFeedbackByID(feedbackId, userId);

        if (!deletedFeedback) {
            console.log("Feedback not found or already deleted for ID:", feedbackId, "and user ID:", userId);
            return res.redirect("/feedback/history")
        }

        res.redirect("/feedback/history");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error deleting feedback");
    }
};