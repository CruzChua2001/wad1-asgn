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
        // --- 1. Extract inputs from request ---
        const reservationId = req.params.reservationId;
        const userId = req.user.userId; // From auth middleware
        
        // Safely convert numofppl to a number (default to empty string if missing)
        const rawNumOfPpl = String(req.body.numofppl || "").trim();
        const numOfPpl = Number(rawNumOfPpl);

        // --- 2. Validate the new pax count ---
        if (!Number.isInteger(numOfPpl) || numOfPpl < 1) {
            return res.status(400).json({ success: false, message: "Number of pax must be at least 1." });
        }

        // --- 3. Verify the reservation exists and belongs to this user ---
        const reservation = await Reservation.retrieveById(reservationId);
        if (!reservation || reservation.UserId !== userId) {
            return res.status(404).json({ success: false, message: "Reservation not found." });
        }

        // --- 4. Verify the linked event still exists ---
        const event = await Reservation.getEventDetailsById(reservation.EventId);
        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found." });
        }

        // --- 5. Calculate how many seats are being added or removed ---
        // paxDifference > 0 means user wants MORE seats, < 0 means FEWER
        const currentNumOfPpl = reservation.numofppl || 1;
        const paxDifference = numOfPpl - currentNumOfPpl;

        // Guard against non-numeric capacity values in the DB
        const currentCapacity = Number(event.CurrentCapacity || 0); // Currently occupied seats
        const maxCapacity = Number(event.MaxCapacity || 0);         // Total seats available

        if (Number.isNaN(currentCapacity) || Number.isNaN(maxCapacity)) {
            return res.status(500).json({ success: false, message: "Event capacity is invalid." });
        }

        // --- 6. If increasing pax, check there's enough room ---
        // Only block if adding seats would push occupied seats past the max
        if (paxDifference > 0 && (currentCapacity + paxDifference > maxCapacity)) {
            return res.status(400).json({ success: false, message: "Not enough capacity to add that many people." });
        }

        // --- 7. Build the update payload ---
        const updateData = { numofppl: numOfPpl };

        // Increasing pax requires re-approval — reset to pending and clear approver
        // Decreasing pax keeps the existing status unchanged
        if (paxDifference > 0) {
            updateData.Status = "pending";
            updateData.ApprovedBy = "";
        }

        await Reservation.update(reservationId, updateData);

        // --- 8. Adjust event's CurrentCapacity if the reservation was previously approved ---
        // (Pending/waitlisted reservations don't occupy seats yet, so no adjustment needed for them)
        if (reservation.Status === "approved") {
            let newCapacity;

            if (paxDifference > 0) {
                // Increasing pax: reservation reverts to pending, so release ALL previously occupied seats.
                // The new (larger) pax will re-occupy seats only once approved again.
                newCapacity = currentCapacity - currentNumOfPpl;
            } else {
                // Decreasing pax: reservation stays approved, so just shrink occupied seats by the difference.
                // paxDifference is negative here, so adding it reduces the count.
                newCapacity = currentCapacity + paxDifference;
            }

            if (newCapacity < 0) newCapacity = 0; // Safety clamp — never go below zero
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
        // --- 1. Extract inputs and verify ownership ---
        const reservationId = req.params.reservationId;
        const userId = req.user.userId;

        const reservation = await Reservation.retrieveById(reservationId);
        if (!reservation || reservation.UserId !== userId) {
            return res.status(404).json({ success: false, message: "Reservation not found." });
        }

        // --- 2. If the reservation was approved, its seats are currently occupied ---
        // We need to free those seats and potentially promote waitlisted users
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

                // --- 3. Free the seats vacated by the canceled reservation ---
                let newCapacity = currentCapacity - canceledPax;
                if (newCapacity < 0) newCapacity = 0;

                // --- 4. Use the freed seats to promote users off the waitlist ---
                let availableSeats = maxCapacity - newCapacity; // How many seats are now open
                if (availableSeats > 0) {
                    // Retrieve waitlisted reservations ordered by their WaitlistNo (priority)
                    const waitlistReservations = await Reservation.retrieveWaitlistByEvent(reservation.EventId);

                    for (const waitlistReservation of waitlistReservations) {
                        const waitlistPax = Number(waitlistReservation.numofppl || 1);

                        // Skip any entries with bad data
                        if (Number.isNaN(waitlistPax) || waitlistPax <= 0) {
                            continue;
                        }

                        // Only promote if the entire group fits in the remaining open seats
                        if (waitlistPax <= availableSeats) {
                            await Reservation.update(waitlistReservation.ReservationID, {
                                Status: "approved",
                                WaitlistNo: 0 // Remove from waitlist queue
                            });

                            // Occupy the seats and shrink the available pool for the next iteration
                            newCapacity += waitlistPax;
                            availableSeats -= waitlistPax;
                            promotedCount += 1;
                        }
                        // If the group is too large to fit, skip them (don't break — a smaller group later may still fit)
                    }
                }

                // --- 5. Persist the final occupied seat count back to the event ---
                await EventModel.updateCapacityById(event.EventID, newCapacity);
            }
        }

        // --- 6. Delete the reservation record and return the result ---
        await Reservation.delete(reservationId);
        return res.json({
            success: true,
            message: "Reservation canceled successfully.",
            promotedCount // Lets the caller know how many waitlisted users were auto-approved
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Unable to cancel reservation." });
    }
};