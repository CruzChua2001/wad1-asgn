const { formatDateTime } = require("../utils/dateUtils");
const { generateUUID } = require("../utils/uuidUtils");

const reportModel = require("../models/reportModel");
const userModel = require("../models/userModel");

const REPORTTYPES = ["General Inquiry", "Feedback", "Report a Problem"];

exports.getReportHistory = async (req, res) => {
    try {
        const allReports = await reportModel.retrieveAllReport();

        // Sort reports by CreatedAt in descending order (most recent first)
        allReports.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));

        res.render("contactus/history", {
            reports: allReports
        });
    } catch (error) {
        console.error("contactusController.getReportHistory: Error retrieving report history:", error);
        return res.redirect("/");
    }
}

exports.getContactUs = async (req, res) => {
    if (req.user.role === "admin") {
        return res.redirect("/contactus/history");
    }

    const currUserId = req.user.userId;

    try {
        const userReports = await reportModel.retrieveReportByUserId(currUserId);
        
        let errors = req.session.contactus ? req.session.contactus.errorMsg : null;
        delete req.session.contactus;

        let submitted = req.session.contactus ? req.session.contactus.submitted : false;

        res.render("contactus/contactus", {
            submitted,
            reportTypes: REPORTTYPES,
            reports: userReports,
            errors
        });
    } catch (error) {
        console.error("Error retrieving user reports:", error);
        res.redirect("/");
    }
}

exports.addReport = async (req, res) => {
    const { category, report } = req.body;

    let errorMsg = [];

    if (!category) {
        errorMsg.push("Category is required.");
    }

    if (!report) {
        errorMsg.push("Message is required.");
    }

    if (errorMsg.length > 0) {
        req.session.contactus = { errorMsg };
        return res.redirect("/contactus");
    }

    const generateCaseNo = () => {
        const prefix = category.substring(0, 2).toUpperCase();
        const timestamp = Date.now();
        return `${prefix}-${timestamp}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
    }
    
    const newReport = {
        ReportID: generateUUID(),
        UserID: req.user.userId,
        CaseNo: generateCaseNo(),
        Category: category,
        Report: report,
        Reply: [],
        CreatedAt: formatDateTime(new Date().toISOString()),
        Status: category === "Feedback" ? "Not Applicable" : "Pending",
        isDeleted: 0
    };

    try {
        let response = await reportModel.createReport(newReport);

        if (response) {
            req.session.contactus = { submitted: true };
            return res.redirect("/contactus");
        }
    } catch (error) {
        console.error("Error adding new report:", error);

        let errorMsg = ["An error occurred while submitting your report. Please try again later."];
        req.session.contactus = { errorMsg };

        return res.redirect("/contactus");
    }
}

exports.getReportById = async (req, res) => {
    const reportId = req.params.id;

    try {
        const report = await reportModel.retrieveReportByReportId(reportId);

        if (!report) {
            return res.redirect("/contactus");
        }

        let errorMsg = req.session.reportDetail ? req.session.reportDetail.errorMsg : null;
        delete req.session.reportDetail;

        res.render("contactus/reportDetail", {
            report: report,
            username: "",
            currentUserId: req.user.userId,
            isAdmin: res.locals.isAdmin,
            errorMsg
        });
    } catch (error) {
        console.error("contactusController.getReportById: Error retrieving report by ID:", error);
        return res.redirect("/contactus");
    }
}

exports.updateReportById = async (req, res) => {
    const reportId = req.params.id;
    const { report: updatedReport } = req.body;

    if (!updatedReport) {
        return res.status(400).json({ message: "Updated report content is required." });
    }

    try {
        let response = await reportModel.updateReportByReportId(reportId, updatedReport);

        if (!response) {
            return res.status(404).json({ message: "Report not found." });
        } else {
            return res.status(200).json({ message: "Report updated successfully." });
        }
    } catch (error) {
        console.error("contactusController.updateReportById: Error updating report:", error);
        return res.status(500).json({ message: "An error occurred while updating the report." });
    }
}

exports.deleteReportById = async (req, res) => {
    const reportId = req.params.id;

    try {
        let response = await reportModel.deleteReportByReportId(reportId);

        if (!response) {
            return res.status(404).json({ message: "Report not found." });
        } else {
            return res.status(200).json({ message: "Report deleted successfully." });
        }
    } catch (error) {
        console.error("contactusController.deletereportById: Error deleting report:", error);
        return res.status(500).json({ message: "An error occurred while deleting the report." });
    }
}

exports.updateStatusById = async (req, res) => {
    const reportId = req.params.id;
    const { status: updatedStatus } = req.body;

    try {
        let response = await reportModel.updateReportStatusByReportId(reportId, updatedStatus);

        if (!response) {
            return res.status(404).json({ message: "Report not found." });
        } else {
            return res.redirect(`/contactus/${reportId}`);
        }
    } catch (error) {
        console.error("contactusController.updateStatusById: Error updating report status:", error);
        return res.status(500).json({ message: "An error occurred while updating the report status." });
    }
}

exports.addReplyById = async (req, res) => {
    const reportId = req.params.id;
        const { message } = req.body;

        if (!message) {
            req.session.reportDetail = { errorMsg: "Reply message is required." };
            return res.redirect(`/contactus/${reportId}`);
        }

        try {
            let response = await reportModel.addReplyByReportId(reportId, {
                ReplyID: generateUUID(),
                UserID: req.user.userId,
                Message: message,
                CreatedAt: formatDateTime(new Date().toISOString())
            });
            if (!response) {                
                return res.status(404).json({ message: "Report not found." });
            } else {
                return res.redirect(`/contactus/${reportId}`);
            }
        } catch (error) {
            console.error("contactusController.addReplyById: Error adding reply:", error);
            return res.status(500).json({ message: "An error occurred while adding the reply." });
        }
}

exports.updateReplyById = async (req, res) => {
    const reportId = req.params.id;
    const replyId = req.params.replyId;
    const { message: updatedMessage } = req.body;

    if (!updatedMessage) {
        return res.status(400).json({ message: "Updated reply message is required." });
    }

    try {
        let response = await reportModel.updateReplyByReplyId(reportId, replyId, updatedMessage);
        if (!response) {
            return res.status(404).json({ message: "An error occurred while updating the reply." });
        } else {
            return res.status(200).json({ message: "Reply updated successfully." });
        }
    } catch (error) {
        console.error("contactusController.updateReplyById: Error updating reply:", error);
        return res.status(500).json({ message: "An error occurred while updating the reply." });
    }
}

exports.deleteReplyById = async (req, res) => {
    const reportId = req.params.id;
    const replyId = req.params.replyId;

    try {
        let response = await reportModel.deleteReplyByReplyId(reportId, replyId); 
        if (!response) {
            return res.status(404).json({ message: "Report or reply not found." });
        } else {
            return res.status(200).json({ message: "Reply deleted successfully." });
        }
    } catch (error) {
        console.error("contactusController.deleteReplyById: Error deleting reply:", error);
        return res.status(500).json({ message: "An error occurred while deleting the reply." });
    }


}