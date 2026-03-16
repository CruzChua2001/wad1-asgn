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
    Status: {
        type: String,
        required: [true, 'Report require a Status'],
        enum: ['In-Progress', 'Solved', 'Not Applicable']
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