const express = require("express");
const path = require("path");
const dotenv = require('dotenv');
const session = require("express-session");
const mongoose = require('mongoose');
const feedbackModel = require("./models/feedbackModel");

const server = express();

const HOSTNAME = "localhost";
const PORT = 8000;

dotenv.config({ path: './config.env' });

server.set("view engine", "ejs");
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
// server.use(express.static(path.join(__dirname, "public")));
server.use(session({
    secret: process.env.SECRET || "campus-event-board-secret",
    resave: false, // dont resave the session to the server on every request if nothing changed 
    saveUninitialized: false, // dont create session for users who are not logged in yet
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 } // refers to how long the cookie lasts, meaning the session expires in 24 hours 
}));

server.get("/health", (req, res) => {
    res.send("Server is running");
})

// Insert code below -------------------------

const auth = require("./auth/auth");

server.use(auth.attachUserLocals);

server.get("/", async (req, res) => {
    try {
        const topEvents = await feedbackModel.getTopEvents()
        res.render("home", { topEvents });
      } catch (error) {
        console.error(error);
        res.send("Error fetching top events");
      }
})

const authRouter = require("./routes/authRouter");
const userRouter = require("./routes/userRouter");
const eventRouter = require("./routes/eventRouter");
const reserveRouter = require("./routes/reserveRouter");
const configurationRouter = require("./routes/configurationRouter");
const feedbackRouter = require("./routes/feedbackRouter");
const contactusRouter = require("./routes/contactusRouter");

server.use("/user", userRouter);                        // Anumitaa 
server.use("/event", auth.requireAuth, eventRouter)     // Claudine
server.use("/reserve",auth.requireAuth, reserveRouter);                  // Zhi Yang
server.use("/feedback", auth.requireAuth, feedbackRouter);                // Keifer
server.use("/configuration",auth.requireAuth,auth.requireAdmin, configurationRouter);      // Mahshuk
server.use("/contactus", auth.requireAuth, contactusRouter);            // Cruz

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
