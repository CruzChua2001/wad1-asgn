const express = require("express");
const path = require("path");
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const server = express();

const HOSTNAME = "localhost";
const PORT = 8000;

dotenv.config({ path: './config.env' });

server.set("view engine", "ejs");
server.use(express.urlencoded({ extended: true }));
server.use(express.static(path.join(__dirname, "public")))

server.get("/health", (req, res) => {
    res.send("Server is running");
})

// Insert code below -------------------------

const auth = require("./auth/auth");

const authRouter = require("./routes/authRouter");
const userRouter = require("./routes/authRouter");
const eventRouter = require("./routes/eventRouter");
const reserveRouter = require("./routes/reserveRouter");
const configurationRouter = require("./routes/configurationRouter");
const feedbackRouter = require("./routes/feedbackRouter");
const contactusRouter = require("./routes/contactusRouter");

server.use("/user", userRouter);                        // Anumitaa 
server.use("/event", eventRouter)                       // Claudine
server.use("/reserve", reserveRouter);                  // Zhi Yang
server.use("/configuration",auth.requireAuth,auth.requireAdmin, configurationRouter);      // Mahshuk
server.use("/feedback", feedbackRouter);                // Keifer
server.use("/contactus", auth.requireAuth, contactusRouter);            // Cruz

server.get("/home", auth.requireAuth, (req, res) => {
    return res.render("home");
})

server.use("/", authRouter);

// Insert code above -------------------------

const connectDB = async () => {
    await mongoose.connect(process.env.DB);
    try {
        // connecting to Database with our config.env file and DB is constant in config.env
        await mongoose.connect(process.env.DB);
        console.log("MongoDB connected successfully");
      } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1); 
      }
}

const startServer = () => {
    server.listen(PORT, HOSTNAME, () => {
        console.log(`Hello! Server is currently running on http://${HOSTNAME}:${PORT}`);
    })
}

connectDB().then(startServer);
