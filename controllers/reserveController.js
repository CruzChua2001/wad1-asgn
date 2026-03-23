const { formatDateTime } = require("../utils/dateUtils");
const { generateUUID } = require("../utils/uuidUtils");
const Reservation = require("../models/reservationModel");
const EventModel = require("../models/eventModel");

// GET all reservations for the current user
exports.getAllReservations = async (req, res) => {
	try {
		const userId = req.user.userId;
		// Use aggregation to get event details
		const reservations = await Reservation.getReservationsWithEventDetails({ UserId: userId });
		res.render("reserveviews/myreservation.ejs", { reservations, userId, formatDateTime });
	} catch (error) {
		res.render("reserveviews/unknownevent.ejs");
	}
};

// GET a reservation by ReservationID
exports.getReservationById = async (req, res) => {
	try {
		const userId = req.user.userId;
		const reservations = await Reservation.getReservationsWithEventDetails({ UserId: userId });
		const reservation = reservations.find(r => r.ReservationID === req.params.id);
		if (!reservation) {
			return res.render("reserveviews/unknownevent.ejs");
		}
		res.render("reserveviews/updatebooking.ejs", { reservation, formatDateTime });
	} catch (error) {
		res.render("reserveviews/unknownevent.ejs");
	}
};
exports.showCreateReservationForm = async (req, res) => {
	try {
		const eventId = req.params.EventId;
		const event = await Reservation.getEventDetailsById(eventId); 
		if (!event) {
			return res.render("reserveviews/unknownevent.ejs");
		}
		// Pass a mock reservation object for booking.ejs
		const reservation = {
			EventId: event.EventId,
			EventDetails: event,
			CreatedDateTime: new Date(),
			Status: "pending"
		};
		res.render("reserveviews/booking.ejs", { reservation, formatDateTime });
	} catch (error) {
		res.render("reserveviews/unknownevent.ejs");
	}
};

// POST create a reservation for an event
exports.createReservation = async (req, res) => {
	try {
		const eventId = req.params.EventId;
		const userId = req.user.userId;
		const rawNumOfPpl = String(req.body.numofppl || "").trim();
		
		const numOfPpl = Number(rawNumOfPpl);
		if (!Number.isInteger(numOfPpl) || numOfPpl < 1) {
			return res.send('Number of pax must be at least 1. <a href="javascript:history.back()">Go back</a>');
		}
		const event = await Reservation.getEventDetailsById(eventId);
		
		if (!event) {
			return res.render("reserveviews/unknownevent.ejs");
		}
		// Check if already reserved
		const alreadyReserved = await Reservation.retrieveByEventAndUser(eventId, userId );
		if (alreadyReserved) {
			return res.send('You have already reserved a slot for this event. <a href="/reserve/reservation">Go back</a>');
		}
		// Check capacity
		const reservationCount = await Reservation.countByEvent(eventId);
		let status = 'pending';

		// Create reservation
		const reservationData = {
			ReservationID: generateUUID(),
			EventId: eventId,
			UserId: userId,
			Status: status,
			CreatedBy: userId,
			ApprovedBy: "",
			CreatedDateTime: new Date(),
			WaitlistNo: 0,
			numofppl: numOfPpl
		};
		await Reservation.create(reservationData);
		// Optionally update event booked count if approved
		if (status === "approved") {
			event.CurrentCapacity += numOfPpl;
			await EventModel.updateCapacityById(event.EventID, event.CurrentCapacity);
		}
		res.redirect('/reserve/reservation');
	} catch (error) {
		res.render("reserveviews/unknownevent.ejs");
	}
};
// GET show update reservation form
exports.showUpdateReservationForm = async (req, res) => {
	try {
		const reservationId = req.params.reservationId;
		const userId = req.user.userId;
		const reservation = await Reservation.retrieveById(reservationId);
		if (!reservation || reservation.UserId !== userId) {
			return res.render("reserveviews/unknownevent.ejs");
		}
		const event = await Reservation.getEventDetailsById(reservation.EventId);
		if (!event) {
			return res.render("reserveviews/unknownevent.ejs");
		}
		reservation.EventDetails = event;
		res.render("reserveviews/updatebooking.ejs", { reservation, formatDateTime });
	} catch (error) {
		res.render("reserveviews/unknownevent.ejs");
	}
};
// PUT update a reservation (number of people)
exports.updateReservation = async (req, res) => {
	try {
		const reservationId = req.params.reservationId;
		const userId = req.user.userId;
		const rawNumOfPpl = String(req.body.numofppl || "").trim();
		const numOfPpl = Number(rawNumOfPpl);
		if (!Number.isInteger(numOfPpl) || numOfPpl < 1) {
			return res.status(400).json({ success: false, message: "Number of pax must be at least 1." });
		}
		const reservation = await Reservation.retrieveById(reservationId);
		if (!reservation || reservation.UserId !== userId) {
			return res.status(404).json({ success: false, message: "Reservation not found." });
		}
		const event = await Reservation.getEventDetailsById(reservation.EventId);
		if (!event) {
			return res.status(404).json({ success: false, message: "Event not found." });
		}
		// Check if pax increase exceeds event capacity
		const currentNumOfPpl = reservation.numofppl || 1;
		const paxDifference = numOfPpl - currentNumOfPpl; 

		const currentCapacity = Number(event.CurrentCapacity || 0);
		const maxCapacity = Number(event.MaxCapacity || 0);

		if (Number.isNaN(currentCapacity) || Number.isNaN(maxCapacity)) {
			return res.status(500).json({ success: false, message: "Event capacity is invalid." });
		}

		// 2. Check if ADDING people exceeds the max limit
		if (paxDifference > 0 && (currentCapacity + paxDifference > maxCapacity)) {
			return res.status(400).json({ success: false, message: "Not enough capacity to add that many people." });
		}

		const updateData = { numofppl: numOfPpl };

		// Keep current status for reduction, but if pax increases set reservation back to pending.
		if (paxDifference > 0) {
			updateData.Status = "pending";
			updateData.ApprovedBy = "";
		}

		await Reservation.update(reservationId, updateData);

		// CurrentCapacity stores occupied seats. If an approved reservation changes:
		// - reduction keeps approved and reduces occupied seats
		// - increase becomes pending and releases previously occupied seats
		if (reservation.Status === "approved") {
			let newCapacity;
			if (paxDifference > 0) {
				newCapacity = currentCapacity - currentNumOfPpl;
			} else {
				newCapacity = currentCapacity + paxDifference;
			}
			if (newCapacity < 0) newCapacity = 0;
			await EventModel.updateCapacityById(event.EventID, newCapacity);
		}
		return res.json({ success: true, message: "Reservation updated successfully." });
	} catch (error) {
		console.log("updateReservation error:", error);
		return res.status(500).json({ success: false, message: error.message || "Unable to update reservation." });
	}
};


exports.deleteReservation = async (req, res) => {
	try {
		const reservationId = req.params.reservationId;
		const userId = req.user.userId;
		const reservation = await Reservation.retrieveById(reservationId);
		if (!reservation || reservation.UserId !== userId) {
			return res.status(404).json({ success: false, message: "Reservation not found." });
		}

		let promotedCount = 0;
		if (reservation.Status === "approved") {
			const event = await Reservation.getEventDetailsById(reservation.EventId);
			if (event) {
				const currentCapacity = Number(event.CurrentCapacity || 0);
				const maxCapacity = Number(event.MaxCapacity || 0);
				const canceledPax = Number(reservation.numofppl || 1);
				if (Number.isNaN(currentCapacity) || Number.isNaN(maxCapacity) || Number.isNaN(canceledPax)) {
					return res.status(500).json({ success: false, message: "Event capacity is invalid." });
				}

				// CurrentCapacity tracks occupied seats.
				let newCapacity = currentCapacity - canceledPax;
				if (newCapacity < 0) newCapacity = 0;

				// Promote waitlist users whose pax can fit into the newly available seats.
				let availableSeats = maxCapacity - newCapacity;
				if (availableSeats > 0) {
					const waitlistReservations = await Reservation.retrieveWaitlistByEvent(reservation.EventId);
					for (const waitlistReservation of waitlistReservations) {
						const waitlistPax = Number(waitlistReservation.numofppl || 1);
						if (Number.isNaN(waitlistPax) || waitlistPax <= 0) {
							continue;
						}
						if (waitlistPax <= availableSeats) {
							await Reservation.update(waitlistReservation.ReservationID, {
								Status: "approved",
								WaitlistNo: 0
							});
							newCapacity += waitlistPax;
							availableSeats -= waitlistPax;
							promotedCount += 1;
						}
					}
				}

				await EventModel.updateCapacityById(event.EventID, newCapacity);
			}
		}
		await Reservation.delete(reservationId);
		return res.json({
			success: true,
			message: "Reservation canceled successfully.",
			promotedCount
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: "Unable to cancel reservation." });
	}
};


