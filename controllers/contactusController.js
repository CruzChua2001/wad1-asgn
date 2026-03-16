const { formatDateTime } = require("../utils/dateUtils");
const { generateUUID } = require("../utils/uuidUtils");

const reportModel = require("../models/reportModel");

// TODO: To be removed
// Report Column Structure:
// ReportId (uuid, primary key) - Format (GE-2024-0001, FE-2024-0002, RP-2024-0003, etc. where prefix indicates category and number is auto-incremented)
// UserId (int, foreign key to Users table)
// CaseNo (string, unique)
// Category (string)
// Report (text)
// Reply (Array of objects with fields: ReplyId (uuid), UserId (int), Message (text), CreatedAt (datetime))
// CreatedAt (datetime)
// Status (string, e.g., "Pending", "In-Progress", "Solved", "Not Applicable")
// isDeleted (boolean)

// Mock data with all the columns for testing purposes, to be replaced with actual database retrieval logic
// Mock 5 data points with different categories, some with attachments and some without, and different createdAt timestamps
const mockReports = [
    {
        ReportId: "123123-12323-123123-123123",
        UserId: "aoisjdoiq",
        CaseNo: "GE-2024-0001",
        Category: "General Inquiry",
        Report: "I have a question about the course schedule.",
        SupportingDocuments: [],
        Reply: [
            {
                ReplyId: "reply-001",
                UserId: "admin123",
                Message: "The course schedule is available on the course homepage.",
                CreatedAt: formatDateTime(new Date(Date.now() - 86400000 * 4).toISOString()) // 4 days ago
            },
            {
                ReplyId: "reply-002",
                UserId: "aoisjdoiq",
                Message: "Thank you for the information!",
                CreatedAt: formatDateTime(new Date(Date.now() - 86400000 * 3).toISOString()) // 3 days ago
            }
        ],
        CreatedAt: formatDateTime(new Date(Date.now() - 86400000 * 5).toISOString()), // 5 days ago
        Status: "Pending",
        isDeleted: 1
    },
    {
        ReportId: "456456-456456-456456-456456",
        UserId: "aoisjdoiq",
        CaseNo: "FE-2024-0002",
        Category: "Feedback",
        Report: "The new online portal is very user-friendly!",
        SupportingDocuments: ["/report_attachments/report_2_screenshot.png"],
        Reply: [],
        CreatedAt: formatDateTime(new Date(Date.now() - 86400000 * 3).toISOString()), // 3 days ago
        Status: "Not Applicable",
        isDeleted: 0
    },
    {
        ReportId: "789789-789789-789789-789789",
        UserId: "aoisjdoiq",
        CaseNo: "RP-2024-0003",
        Category: "Report a Problem",
        Report: "I'm experiencing issues with the login page.",
        SupportingDocuments: ["/report_attachments/report_3_errorlog.txt"],
        Reply: [
            {
                ReplyId: "reply-003",
                UserId: "admin123",
                Message: "We are looking into the login issue and will update you soon.",
                CreatedAt: formatDateTime(new Date(Date.now() - 86400000 * 2).toISOString()) // 2 days ago
            },
            {
                ReplyId: "reply-004",
                UserId: "aoisjdoiq",
                Message: "I'm still experiencing the issue.",
                CreatedAt: formatDateTime(new Date(Date.now() - 86400000).toISOString()) // 1 day ago
            },
            {
                ReplyId: "reply-005",
                UserId: "admin123",
                Message: "The login issue has been resolved. Please try again and let us know if you still face any problems.",
                CreatedAt: formatDateTime(new Date().toISOString()) // now
            }
        ],
        CreatedAt: formatDateTime(new Date(Date.now() - 86400000).toISOString()), // 1 day ago
        Status: "In Progress",
        isDeleted: 0
    },
    {
        ReportId: "456456-456456-456456-456456",
        UserId: "aoikjdsnfiun",
        CaseNo: "GE-2024-0004",
        Category: "General Inquiry",
        Report: "Can I get an extension on the assignment deadline?",
        SupportingDocuments: [],
        Reply: [],
        CreatedAt: formatDateTime(new Date(Date.now() - 86400000 * 7).toISOString()) // 7 days ago
    },
    {
        ReportId: "234234-234234-234234-234234",
        UserId: "12u3h809jdda",
        CaseNo: "FE-2024-0005",
        Category: "Feedback",
        Report: "The lecture recordings are very helpful for revision.",
        SupportingDocuments: ["/report_attachments/report_5_feedback.pdf"],
        Reply: [],
        CreatedAt: formatDateTime(new Date(Date.now() - 86400000 * 2).toISOString()) // 2 days ago
    }
];  

const REPORTTYPES = ["General Inquiry", "Feedback", "Report a Problem"];

exports.getReportHistory = (req, res) => {
    // TODO: Retrieve all reports from the database

    res.render("contactus/history", {
        reports: mockReports
    });
}

exports.getContactUs = async (req, res) => {
    // TODO: Retrieve the reports necessary from the database
    // Retreive all reports where UserId matches logged in User
    // Retrieve reports that isDeleted is not 1 (true)

    if (req.user.role === "admin") {
        return res.redirect("/contactus/history");
    }

    const currUserId = req.user.userId;
    // For now, we will just return all mock reports
    // const userReports = mockReports.filter(report => report.UserId === currUserId && !report.isDeleted);
    try {
        const userReports = await reportModel.retrieveReportByUserId(currUserId);

        res.render("contactus/contactus", {
            submitted: false,
            reportTypes: REPORTTYPES,
            reports: userReports
        });
    } catch (error) {
        console.error("Error retrieving user reports:", error);
        res.redirect("/home");
    }
}

exports.addReport = async (req, res) => {
    const { category, report } = req.body;

    if (!category || !report) {
        let htmlResponse = `
        <h2>Failed to submit report</h2>
        <p>Please ensure all required fields are filled out.</p>
        <a href="/contactus">Back to Contact Us</a>
        `

        return res.send(htmlResponse);
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
            return res.render("contactus/contactus", {
                submitted: true,
                reportTypes: REPORTTYPES,
                reports: mockReports
            });
        }
    } catch (error) {
        console.error("Error adding new report:", error);

        let htmlResponse = `
        <h2>Failed to submit report</h2>
        <p>There was an error while submitting your report. Please try again later.</p>
        <a href="/contactus">Back to Contact Us</a>
        `

        return res.send(htmlResponse);
    }
}

exports.getReportById = async (req, res) => {
    const reportId = req.params.id;

    try {
        const report = await reportModel.retrieveReportByReportId(reportId);

        if (!report) {
            return res.status(404).json({ message: "Report not found." });
        }

        const username = "Cruz Chua"; // TODO: Replace with actual username retrieval logic based on report.UserId

        res.render("contactus/reportDetail", {
            report: report,
            username,
            currentUserId: req.user.userId,
            isAdmin: res.locals.isAdmin
        });
    } catch (error) {
        console.error("contactusController.getReportById: Error retrieving report by ID:", error);
        return res.redirect("/contactus");
    }
}

exports.updateReportById = async (req, res) => {
    const reportId = req.params.id;
    const { report: updatedReport } = req.body;

    console.log("Received updateReportById request with reportId:", reportId, "and updatedReport:", updatedReport);

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

    // TODO: Implement report deletion logic from the database
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

exports.updateStatusById = (req, res) => {
    const reportId = req.params.id;
    const { status: updatedStatus } = req.body;

    const report = mockReports.find(r => r.ReportId === reportId);

    if (!report) {
        return res.status(404).json({ message: "Report not found." });
    }

    report.Status = updatedStatus;

    res.redirect(`/contactus/${reportId}`);
}

exports.addReplyById = async (req, res) => {
    const reportId = req.params.id;
        const { message } = req.body;
    
        // TODO: Implement reply submission logic to the database
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

    try {
        let response = await reportModel.updateReplyByReplyId(reportId, replyId, updatedMessage);
        if (!response) {
            return res.status(404).json({ message: "Report or reply not found." });
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