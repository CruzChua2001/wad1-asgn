const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const { generateUUID } = require("../utils/uuidUtils");

const SALT_ROUNDS = 10;

const getLogin = (req, res) => {
    if (req.session && req.session.user) { //if session alr exists and user is logged in
        return res.redirect("/")};
    return res.render("auth/login", { error: null });
};

const postLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.render("auth/login", { error: "Email and password are required." });

    try {
        const user = await userModel.findByEmail(email);
        if (!user) return res.render("auth/login", { error: "Invalid email or password." }); // re render login page if user email not found

        const match = await bcrypt.compare(password, user.Password);
        if (!match) return res.render("auth/login", { error: "Invalid email or password." }); // re render login page if entered pw doesnt match stored pw

        req.session.user = { userId: user.UserID, email: user.Email, role: user.Role }; // save user info in session
        
        return res.redirect("/");
    } catch (err) {
        console.error(err);
        return res.render("auth/login", { error: "An error occurred. Please try again." });
    }
};

const getRegister = (req, res) => {
    if (req.session && req.session.user) 
        {return res.redirect("/");} // show home page if logged in already
    return res.render("auth/register", { error: null, success: null });
};

const postRegister = async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword)
        return res.render("auth/register", { error: "All fields are required.", success: null });
    if (password !== confirmPassword)
        return res.render("auth/register", { error: "Passwords do not match.", success: null });
    if (password.length < 8)
        return res.render("auth/register", { error: "Password must be at least 8 characters.", success: null });

    try {
        const existing = await userModel.findByEmail(email);
        if (existing)
            return res.render("auth/register", { error: "Email already registered.", success: null }); //cant register if the user email already exists in the db (no duplicates)

        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hashedPassword = await bcrypt.hash(password, salt);

        await userModel.createUser({
            UserID: generateUUID(),
            FirstName: firstName,
            LastName: lastName,
            Email: email,
            Password: hashedPassword,
            PasswordSalt: salt,
            Role: "student"
        }); // creates new user 

        return res.render("auth/register", { error: null, success: "Account created! You can now log in." }); // or is it supposed to redirect to log in
    } catch (err) {
        console.error(err);
        return res.render("auth/register", { error: "An error occurred. Please try again.", success: null });
    }
};

const getForgotPassword = (req, res) => {
    return res.render("auth/forgotpassword", { error: null, success: null });
};

const patchForgotPassword = async (req, res) => {
    const email = req.body.email;
    const newPassword = req.body.newPassword;
    const confirmNewPassword = req.body.confirmNewPassword;

    if (!email || !newPassword || !confirmNewPassword)
        return res.render("auth/forgotpassword", { error: "All fields are required.", success: null });
    if (newPassword !== confirmNewPassword)
        return res.render("auth/forgotpassword", { error: "Passwords do not match.", success: null });
    if (newPassword.length < 8)
        return res.render("auth/forgotpassword", { error: "Password must be at least 8 characters.", success: null });

    try {
        const user = await userModel.findByEmail(email);
        if (!user) return res.redirect("/login");

        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const hashed = await bcrypt.hash(newPassword, salt);
        await userModel.updatePasswordByEmail(email, hashed, salt); 
        return res.redirect("/login"); 
    } catch (err) {
        console.error(err);
        return res.render("auth/forgotpassword", { error: "An error occurred. Please try again.", success: null });
    }
};

const getSignout = (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("connect.sid");
        return res.redirect("/");
    });
}; // end session if user signs out 

module.exports = { getLogin, postLogin, getRegister, postRegister, getForgotPassword, patchForgotPassword, getSignout };