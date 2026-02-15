const express = require("express");
const server = express();

const HOSTNAME = "localhost";
const PORT = 8000;

server.set("view engine", "ejs");
server.use(express.urlencoded({ extended: true }));

server.get("/health", (req, res) => {
    res.send("Server is running");
})


// Insert code below -------------------------



// Insert code above -------------------------

server.listen(PORT, HOSTNAME, () => {
    console.log(`Hello! Server is currently running on http://${HOSTNAME}:${PORT}`);
})