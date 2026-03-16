const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    UserID: {
        type: String,
        required: [true, "User require a UserId"]
    },
    FirstName: {
        type: String,
        required: [true, "User require a FirstName"]
    },
    LastName: {
        type: String,
        required: [true, "User require a LastName"]
    },
    Email: {
        type: String,
        required: [true, "User require an Email"]
    },
    Password: {
        type: String,
        required: [true, "User require a Password"]
    },
    PasswordSalt: {
        type: String,
        required: [true, "User require a PasswordSalt"]
    },
    Role: {
        type: String,
        required: [true, "User require a Role"],
        enum: ["admin", "student"]
    },
    isDeleted: {
        type: Number,
        default: 0
    }   
})

const User = mongoose.model("User", userSchema, "user");

exports.retrieveAll = () => {
    return User.find({ isDeleted: 0 });
}