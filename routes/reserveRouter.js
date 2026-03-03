const express = require("express");
const router = express.Router();
router.use(express.urlencoded({ extended: true }));

let eventsDb = [
    { id: '1', name: 'Web Dev Bootcamp', date:"19/03/2026 19:00", capacity: 30, booked: 10 },
    { id: '2', name: 'UI/UX Masterclass', date:"19/03/2026 12:00", capacity: 20, booked: 20 }, 
    { id: '3', name: 'AI Summit', date:"19/03/2026 13:00", capacity: 50, booked: 49 }
];

let userReservationsDb = [
    { id: 'res1', userId: 'zhi yang', eventId: '1', eventName: 'Web Dev Bootcamp', status: 'confirmed' }
];

router.get("/reservation", (req, res) => {
    res.render("reserveviews/myreservation.ejs", {userReservationsDb, eventsDb})
})

router.get('/:eventid', (req, res) => {
    const EVENT = eventsDb.find(e => e.id === req.params.eventid);
    
    if (!EVENT) {
        res.render('reserveviews/unknownevent.ejs');
    }

    res.render('reserveviews/booking', { event: EVENT });
});

router.post('/:eventid', (req, res) => {
    const EVENTID = req.params.eventid;
    const NUMOFPPL = req.body.numofppl;
    const EVENT = eventsDb.find(e => e.id === EVENTID);
    const USERID = 'user123'; 

    if (!EVENT) {
        res.render('reserveviews/unknownevent.ejs');
    }

    const alreadyReserved = userReservationsDb.some(r => r.eventId === EVENTID && r.userId === USERID);
    if (alreadyReserved) {
        return res.send('You have already reserved a slot for this event. <a href="/reserve/reservation">Go back</a>');
    }

    let status = 'confirmed';
    if (EVENT.booked >= EVENT.capacity) {
        status = 'waitlist';
    } else {
        EVENT.booked += NUMOFPPL;
    }

    userReservationsDb.push({
        id: 'res' + Math.floor(Math.random() * 1000), // fake random ID
        userId: userId,
        eventId: EVENT.id,
        eventName: EVENT.name,
        status: status
    });

    res.redirect('/reserve/reservation');
});

router.put('/:eventid', (req, res) => {
    const eventId = req.params.eventid;
    const userId = 'user123';
    const newNumOfPpl = parseInt(req.body.numofppl, 10);

    // Find their specific reservation and the event
    const reservation = userReservationsDb.find(r => r.eventId === eventId && r.userId === userId);
    const event = eventsDb.find(e => e.id === eventId);

    if (reservation && event) {
        // Calculate the difference (e.g., changing from 2 people to 5 people means difference is +3)
        const DIFFERENCE = newNumOfPpl - reservation.numofppl;

        if (reservation.status === 'confirmed') {
            // Ensure there is enough room for the extra people
            if (difference > 0 && event.booked + difference > event.capacity) {
                return res.send('Not enough capacity to add that many people. <a href="/reserve/reservation">Go back</a>');
            }
            // Update the main event capacity
            event.booked += difference;
        }

        // Update the reservation ticket itself
        reservation.numofppl = newNumOfPpl;
    }

    res.redirect('/reserve/reservation');
});

// DELETE /reserve/:eventid
// Remarks: Delete the reservation, update capacity -1, redirect.
router.delete('/:eventid', (req, res) => {
    const eventId = req.params.eventid;
    const userId = 'user123';

    // Find the reservation
    const reservationIndex = userReservationsDb.findIndex(r => r.eventId === eventId && r.userId === userId);

    if (reservationIndex !== -1) {
        const reservation = userReservationsDb[reservationIndex];

        // If it was confirmed, we free up a spot in the event
        if (reservation.status === 'confirmed') {
            const event = eventsDb.find(e => e.id === eventId);
            if (event) {
                event.booked -= 1; // Update capacity -1
            }
        }

        // Remove from DB
        userReservationsDb.splice(reservationIndex, 1);
    }

    // Redirect back to myreservation
    res.redirect('/reserve/reservation');
});

module.exports = router;  