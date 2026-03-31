const express = require("express");
const router = express.Router();
const { logger } = require("../middleware/logger");
router.use(express.urlencoded({ extended: true }));
router.use(logger);
const reserveController = require("../controllers/reserveController");

router.get("/reservation", reserveController.getAllReservations);
router.get("/:id", reserveController.getReservationById);
router.get("/create/:EventId", reserveController.showCreateReservationForm);
router.post("/create/:EventId", reserveController.createReservation);
router.get("/update/:reservationId", reserveController.showUpdateReservationForm);
router.patch("/update/:reservationId", reserveController.updateReservation);
router.delete("/delete/:reservationId", reserveController.deleteReservation);

module.exports = router;