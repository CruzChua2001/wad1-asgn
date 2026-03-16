const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    CategoryID: {
        type: String,
        required: [true, "Category require a CategoryID"]
    },
    CategoryName: {
        type: String,
        required: [true, "Category require a CategoryName"]
    },
    Approval: {
        type: String,
        required: [true, "Category require an Approval"]
    },
    CreatedBy: {
        type: String,
        required: [true, "Category require a CreatedBy"]
    },
    RejectionReason: {
        type: String,
        required: [true, "Category require a RejectionReason"]
    },
    isDeleted: {
        type: Number,
        default: 0
    }
})

const Category = mongoose.model("Category", categorySchema, "category");

exports.retrieveAll = () => {
    return Category.find({ isDeleted: 0 });
}