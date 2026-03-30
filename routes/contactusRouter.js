
const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../auth/auth");

const contactusController = require("../controllers/contactusController");

router.use(express.json());

router.get("/history", requireAdmin, contactusController.getReportHistory);

router.get("/", contactusController.getContactUs);

router.post("/", contactusController.addReport);

router.get("/:id", contactusController.getReportById);

router.patch("/:id", contactusController.updateReportById);

router.delete("/:id", contactusController.deleteReportById);

router.post("/:id/status", requireAdmin, contactusController.updateStatusById);

router.post("/:id/reply", contactusController.addReplyById);

router.put("/:id/:replyId/reply", contactusController.updateReplyById);

router.delete("/:id/:replyId/reply", contactusController.deleteReplyById);

module.exports = router;  