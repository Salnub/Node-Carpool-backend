const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');


router.post('/ride/create', rideController.createRide);
router.get('/ride/get-all', rideController.getAllRides);
router.post('/book-ride',rideController.bookRide);
router.get('/:ride_id/booked-passengers', rideController.getBookedPassengers);
router.post('/fare/add',rideController.addRouteFare);
router.get('/fare/get-all', rideController.getAllRouteFares);
router.post('/register-user', rideController.registerUser);
router.get('/:id/get-user', rideController.getUserById);
router.get('/get-all/users', rideController.getAllUsers);
router.get('/ride/get-date', rideController.getRidesByDate);

module.exports = router;

