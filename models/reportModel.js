const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    ReportID: {
        type: String,
        required: [true, 'Report require a ReportID']
    },
    UserID: {
        type: String,
        required: [true, 'Report require a UserID']
    },
    CaseNo: {
        type: String,
        required: [true, 'Report require a CaseNo']
    },
    Category: {
        type: String,
        required: [true, 'Report require a Category']
    },
    Report: {
        type: String,
        required: [true, 'Report require a Report']
    },
    Reply: [{
        ReplyID: {
            type: String,
            required: [true, 'Reply require a ReplyID']
        },
        UserID: {
            type: String,
            required: [true, 'Reply require a UserID']
        },
        Message: {
            type: String,
            required: [true, 'Reply require a Message']
        },
        CreatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    CreatedAt: {
        type: Date,
        default: Date.now
    },
    Status: {
        type: String,
        required: [true, 'Report require a Status'],
        enum: ['Pending', 'In-Progress', 'Solved', 'Not Applicable']
    },
    isDeleted: {
        type: Number,
        default: 0,
        enum: [0, 1]
    }
})

const Report = mongoose.model('Report', reportSchema, 'report');

exports.retrieveAllReport = () => {
    return Report.find({ isDeleted: 0 });
}

exports.retrieveReportByUserId = (userID) => {
    return Report.find({ UserID: userID, isDeleted: 0 });
}

exports.createReport = (reportData) => {
    return Report.create(reportData);
}

exports.retrieveReportByReportId = (reportID) => {
    return Report.findOne({ ReportID: reportID, isDeleted: 0 });
}

exports.updateReportByReportId = (reportID, updatedReport) => {
    return Report.updateOne({ ReportID: reportID }, { Report: updatedReport })
}

exports.deleteReportByReportId = (reportID) => {
    return Report.updateOne({ ReportID: reportID }, { isDeleted: 1 })
}

exports.addReplyByReportId = (reportID, replyData) => {
    return Report.updateOne({ ReportID: reportID }, { $push: { Reply: replyData } })
}

exports.updateReplyByReplyId = (reportID, replyID, updatedMessage) => {
    return Report.updateOne({ ReportID: reportID, "Reply.ReplyID": replyID }, { $set: { "Reply.$.Message": updatedMessage } })
}

exports.deleteReplyByReplyId = (reportID, replyID) => {
    return Report.updateOne({ ReportID: reportID }, { $pull: { Reply: { ReplyID: replyID } } })
}

exports.updateReportStatusByReportId = (reportID, updatedStatus) => {
    return Report.updateOne({ ReportID: reportID }, { Status: updatedStatus });
}