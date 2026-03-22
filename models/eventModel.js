const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    EventID: {
        type: String,
        required: [true, 'Event require an EventID']
    },
    EventName: {
        type: String,
        required: [true, 'Event require an EventName']
    },
    EventDescription: {
        type: String,
        required: [true, 'Event require an EventDescription']
    },
    EventImage: {
        type: String
    },
    EventType: {
        type: String,
        required: [true, 'Event require an EventType']
    },
    MaxCapacity: {
        type: Number,
        required: [true, 'Event require a MaxCapacity']
    },
    CurrentCapacity: {
        type: Number,
        default: 0
    },
    ViewCount: {
        type: Number,
        default: 0
    },
    CreatedBy: {
        type: String,
        required: [true, 'Event require a CreatedBy']
    },
    CreatedDateTime: {
        type: Date,
        default: Date.now
    },
    EndDateTime: {
        type: Date,
        required: [true, 'Event require an EndDateTime']
    },
    Status: {
        type: String,
        required: [true, 'Event require a Status'],
        enum: ['active', 'inactive']
    },
    isDeleted: {
        type: Number,
        default: 0
    }
})

const Event = mongoose.model('Event', eventSchema, 'event');

exports.retrieveAll = () => {
    return Event.find({ isDeleted: 0 });
}

exports.retrieveById = (id) => {
    return Event.findOne({ EventID: id, isDeleted: 0 });
};

exports.updateCapacityById = (id, newCapacity) => {
    return Event.findOneAndUpdate({ EventID: id, isDeleted: 0 }, { CurrentCapacity: newCapacity }, { new: true });
};

exports.retrieveByCategoryId = (categoryId) =>{
    return Event.find({EventType:categoryId,isDeleted:0})
}
