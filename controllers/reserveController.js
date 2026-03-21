const { formatDateTime } = require("../utils/dateUtils");
const { generateUUID } = require("../utils/uuidUtils");
const Reservation = require("../models/reservationModel");

// GET all reservations for the current user
exports.getAllReservations = async (req, res) => {
	try {
		const userId = req.user.userId;
		// Use aggregation to get event details
		const reservations = await Reservation.getReservationsWithEventDetails({ UserId: userId });
		res.render("reserveviews/myreservation.ejs", { reservations, userId });
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
		res.render("reserveviews/updatebooking.ejs", { reservation });
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
		res.render("reserveviews/booking.ejs", { reservation });
	} catch (error) {
		res.render("reserveviews/unknownevent.ejs");
	}
};

// POST create a reservation for an event
exports.createReservation = async (req, res) => {
	try {
		const eventId = req.params.EventId;
		const userId = req.user.userId;
		const numOfPpl = parseInt(req.body.numofppl, 10) || 1;
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
		// Optionally update event booked count if confirmed
		if (status === 'confirmed') {
			event.CurrentCapacity += numOfPpl;
			await event.updateCapacityById(event.EventID, event.CurrentCapacity);
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
		res.render("reserveviews/updatebooking.ejs", { reservation });
	} catch (error) {
		res.render("reserveviews/unknownevent.ejs");
	}
};
// PUT update a reservation (number of people)
exports.updateReservation = async (req, res) => {
	try {
		const reservationId = req.params.reservationId;
		const userId = req.user.userId;
		const numOfPpl = parseInt(req.body.numofppl, 10) || 1;
		const reservation = await Reservation.retrieveById(reservationId);
		if (!reservation || reservation.UserId !== userId) {
			return res.render("reserveviews/unknownevent.ejs");
		}
		const event = await Reservation.getEventDetailsById(reservation.EventId);
		if (!event) {
			return res.render("reserveviews/unknownevent.ejs");
		}
		// Check if updating to more people exceeds capacity
		const reservationCount = await Reservation.countByEvent(reservation.EventId);
		const currentNumOfPpl = reservation.numofppl || 1;
		if (numOfPpl > currentNumOfPpl && reservationCount + (numOfPpl - currentNumOfPpl) > event.MaxCapacity) {
			return res.send('Not enough capacity to add that many people. <a href="/reserve/reservation">Go back</a>');
		}
		// Update reservation
		reservation.numofppl = numOfPpl;
		await Reservation.updatepax(reservationId, numOfPpl); // change to model update method
		// Optionally update event booked count if confirmed
		if (reservation.Status === 'confirmed') {
			event.CurrentCapacity += (numOfPpl - currentNumOfPpl);
			await event.updateCapacityById(event.EventID, event.CurrentCapacity);
		}
		   res.redirect('/reserve/reservation');
	} catch (error) {
		res.render("reserveviews/unknownevent.ejs");
	}
};


// DELETE a reservation
exports.deleteReservation = async (req, res) => {
	try {
		const reservationId = req.params.reservationId;
		const userId = req.user.userId;
		const reservation = await Reservation.retrieveById(reservationId);
		if (!reservation || reservation.UserId !== userId) {
			return res.render("reserveviews/unknownevent.ejs");
		}
		// If confirmed, free up spots
		if (reservation.Status === 'confirmed') {
			const event = await Reservation.getEventDetailsById(reservation.EventId);
			if (event) {
				event.CurrentCapacity -= reservation.numofppl || 1;
				if (event.CurrentCapacity < 0) event.CurrentCapacity = 0;
				// Optionally update event in DB if needed
			}
		}
		await Reservation.delete(reservationId);
		res.redirect('/reserve/reservation');
	} catch (error) {
		res.render("reserveviews/unknownevent.ejs");
	}
	//create a waitlist management function to move people from waitlist to confirmed if a spot opens up (not implemented here, but can be triggered after delete or update)
	
};


