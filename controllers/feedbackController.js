const {addfeedback, getTopEvents} = require("../models/feedback")
const Event = require("../models/event")

const ratings = [1,2,3,4,5]
exports.getFeedbackForm = (req,res) => {
    let eventId = req.params.eventId
    res.render("feedback", {ratings, eventId})
}

exports.submitFeedback = async (req,res) => {
    try {
        const userId = req.user.userId
        const eventId = req.params.eventId
        const event = await Event.findOne({eventId:eventId})
        const eventName = event.eventName

        await addfeedback(userId, eventId, eventName, req.body)
        res.redirect("/")
        } catch (error) {
          console.log(error)
          res.send("Error fetching feedback")};
        }

exports.TopEvents = async (req, res) => {
  try {
    const topEvents = await getTopEvents()
    res.render("topEvents", { topEvents });
  } catch (error) {
    console.error(error);
    res.send("Error fetching top events");
  }
};