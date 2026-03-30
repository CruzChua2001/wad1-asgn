const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const { generateUUID } = require("../utils/uuidUtils");

const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.retrieveAll();
        return res.render("users/userList", { users, error: null });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error retrieving users.");
    }
};

const getProfile = async (req, res) => { // when admin visits /users
    try {
        const user = await userModel.findByUserID(req.user.userID);
        if (!user) {
            return res.redirect("/login");}
        return res.render("users/profile", { user });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error loading profile.");
    }
};

const getUserById = async (req, res) => { // when admin visits users/:id
    try {
        const user = await userModel.findByUserID(req.params.id);
        if (!user) {
            return res.status(404).send("User not found.");}
        return res.render("users/userDetail", { user });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error retrieving user.");
    }
};

const deleteUser = async (req, res) => { // when admin submits delete form for a user
    try {
        if (req.params.id === req.user.userID) // check if admin is deleteting themselves
            return res.redirect("/user?error=Cannot delete your own account.");
        await userModel.deleteUser(req.params.id);
        return res.redirect("/user"); // show admin updated user list
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error deleting user.");
    }
};

const createAdmin = async (req, res) => {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;

    if (!firstName || !lastName || !email || !password) {
        const users = await userModel.retrieveAll();
        return res.render("users/userList", { users, error: "All fields required." });
    }
    try {
        const existing = await userModel.findByEmail(email);
        if (existing) {
            const users = await userModel.retrieveAll();
            return res.render("users/userList", { users, error: "Email already in use." });
        }
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);
        await userModel.createUser({
            UserID: generateUUID(), FirstName: firstName, LastName: lastName,
            Email: email, Password: hashed, PasswordSalt: salt, Role: "admin"
        });
        return res.redirect("/user"); // show admin updated user list
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error creating admin.");
    }
};

module.exports = { getAllUsers, getProfile, getUserById, deleteUser, createAdmin };