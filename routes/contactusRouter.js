const express = require("express");
const router = express.Router();

const REPORTTYPES = ["General Inquiry", "Feedback", "Report a Problem"];

router.get("/", (req, res) => {
    res.render("contactus/contactus", {
        submitted: false,
        reportTypes: REPORTTYPES
    });
})

module.exports = router;  