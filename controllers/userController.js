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
        const user = await userModel.findByUserID(req.user.userId);
        if (!user) {
            return res.redirect("/login");}
        return res.render("users/profile", { user, error: null, success: null });
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error loading profile.");
    }
};

const postProfile = async (req, res) => {
    const { firstName, lastName, email, currentPassword, newPassword, confirmNewPassword } = req.body;

    try {
        const user = await userModel.findByUserID(req.user.userId);
        if (!user) return res.redirect("/login");

        // if user is trying to change password
        if (currentPassword || newPassword || confirmNewPassword) {
            if (!currentPassword || !newPassword || !confirmNewPassword)
                return res.render("users/profile", { user, error: "Fill in all password fields to change password.", success: null });

            const match = await bcrypt.compare(currentPassword, user.Password);
            if (!match)
                return res.render("users/profile", { user, error: "Current password is incorrect.", success: null });

            if (newPassword !== confirmNewPassword)
                return res.render("users/profile", { user, error: "New passwords do not match.", success: null });

            if (newPassword.length < 8)
                return res.render("users/profile", { user, error: "New password must be at least 8 characters.", success: null });

            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(newPassword, salt);
            await userModel.updatePasswordByEmail(user.Email, hashed, salt);
        }

        // update first name, last name and email
        await userModel.updateProfile(req.user.userId, firstName, lastName, email);

        const updatedUser = await userModel.findByUserID(req.user.userId);
        return res.render("users/profile", { user: updatedUser, error: null, success: "Profile updated successfully." });

    } catch (err) {
        console.error(err);
        const user = await userModel.findByUserID(req.user.userId);
        return res.render("users/profile", { user, error: "An error occurred. Please try again.", success: null });
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
        if (req.params.id === req.user.userId) // check if admin is deleting themselves
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

module.exports = { getAllUsers, getProfile, postProfile, getUserById, deleteUser, createAdmin };