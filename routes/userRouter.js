const express = require("express");
const router = express.Router();
const auth = require("../auth/auth");
const userController = require("../controllers/userController");

router.use(auth.requireAuth);

router.get("/profile", userController.getProfile);

router.get("/",            auth.requireAdmin, userController.getAllUsers);
router.post("/admin",      auth.requireAdmin, userController.createAdmin);
router.post("/:id/delete", auth.requireAdmin, userController.deleteUser);

router.get("/:id", auth.requireAdmin, userController.getUserById);

module.exports = router;