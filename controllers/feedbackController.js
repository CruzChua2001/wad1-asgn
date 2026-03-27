const {addfeedback, getTopEvents, getHistory} = require("../models/feedbackModel")
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

        await addfeedback(userId, eventId, eventName, req.body)
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
    const history = await this.getHistoryForm(userId)
    res.render("history", {history})
  }
  catch{error} {
    console.log(error);
    res.send("Error fetching history");
  }
}