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

exports.retrieveAll = () => User.find({ isDeleted: 0 });
// fetches every user where isDeleted is 0 (not deleted)

exports.findByEmail = (email) => User.findOne({ Email: email, isDeleted: 0 });
// used in login and forgot password

exports.findByUserID = (userID) => User.findOne({ UserID: userID, isDeleted: 0 });
// used in profile

exports.createUser = (userData) => {
    const user = new User(userData);
    return user.save();
};
// creates new user, called during register and create admin

exports.updatePasswordByEmail = (email, hashedPassword, salt) => {
    return User.updateOne(
        { Email: email, isDeleted: 0 },
        { $set: { Password: hashedPassword, PasswordSalt: salt } }
    );
};
// finds user by email and updates their password fields 
// called during forgot password 

exports.deleteUser = (userID) => {
    return User.updateOne({ UserID: userID }, { $set: { isDeleted: 1 } });
};
// doesnt actually delete the record from mongoDB, just sets isDeleted to 1 (other queries cal filter by isDeleted: 0)
// soft delete as a safety mechanism to prevent accidental deletions and potential data loss, also bc user data might be linked to other records

exports.getAdminIdByName = (name) => {
    return User.findOne({FirstName:name.split(" ")[0],LastName:name.split(" ")[1]})
}
exports.getAdminUsers = () =>{
    return User.find({Role:"admin"});
}
