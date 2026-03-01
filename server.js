const express = require("express");
const server = express();
const path = require("path");

const HOSTNAME = "localhost";
const PORT = 8000;

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

server.use("/user", userRouter);                        // Anumitaa 
server.use("/event", eventRouter)                       // Claudine
server.use("/reserve", reserveRouter);                  // Zhi Yang
server.use("/configuration", configurationRouter);      // Mahshuk
server.use("/feedback", feedbackRouter);                // Keifer

server.get("/home", auth.requireAuth, (req, res) => {
    return res.render("home");
})

server.use("/", authRouter);

// Insert code above -------------------------

server.listen(PORT, HOSTNAME, () => {
    console.log(`Hello! Server is currently running on http://${HOSTNAME}:${PORT}`);
})