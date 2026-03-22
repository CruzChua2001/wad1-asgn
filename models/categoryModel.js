const mongoose = require('mongoose');
const { formatDateTime } = require('../utils/dateUtils');

const categorySchema = new mongoose.Schema({
    CategoryID: {
        type: String,
        required: [true, "Category require a CategoryID"]
    },
    CategoryName: {
        type: String,
        required: [true, "Category require a CategoryName"]
    },
    CategoryDesc:{
        type:String,
        required:[true,"Category require a valid Description"]
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
    },
    createdAt:{
        type:Date,
        required:[true,"Category require a Creation Date and Time Recorded"]
    }
})

const Category = mongoose.model("Category", categorySchema, "category");



exports.retrieveAll = () => {
    return Category.find({ isDeleted: 0 });
}

exports.addCategory = (newCategory) =>{
    return Category.create(newCategory)
}
exports.updateDetail = (id,name,desc) =>{
    return Category.updateOne({CategoryID:id,isDeleted:0},{CategoryName:name,CategoryDesc:desc})
}

exports.deleteCategory = (id) =>{
    return Category.updateOne({CategoryID:id},{isDeleted:1})
}