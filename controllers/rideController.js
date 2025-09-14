const db = require('../db/db');
const { v4: uuidv4 } = require('uuid');



exports.registerUser = async (req, res) => {
  const { name, phone, email } = req.body;

  if (!name || !phone || !email) {
    return res.status(400).json({ error: 'Name, email and phone are required' });
  }

  const userId = `usr_${uuidv4()}`;

  try {
    await db.execute(
      'INSERT INTO users (id, name, phone, email, is_user) VALUES (?, ?, ?, ?, ?)',
      [userId, name, phone, email, 1]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user_id: userId,
      name: name,
      phone: phone,
      email: email,
    });
  } catch (err) {
    console.error('User registration failed:', err);
    res.status(500).json({ error: 'User registration failed', err });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM users');

    res.status(200).json({
      data: results
    });
  } catch (err) {
    console.error('Error fetching user data: ', err);
    res.status(500).json({ error: 'Database error', err });
  }
};


exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await db.query('SELECT * FROM users WHERE id = ?', [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ data: results });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Database error', err });
  }
};


exports.createRide = async (req, res) => {
  const {
    driver_id,
    pickup_point,
    dropoff_point,
    available_seats,
    departure_time,
    car_model,
    car_make,
    number_plate,
    fare
  } = req.body;

  const rideId = `ride_${uuidv4()}`; // generate unique ride ID

  try {
    const [result] = await db.execute(
      'INSERT INTO rides (id, driver_id, pickup_point, dropoff_point, available_seats, departure_time, car_model, car_make, number_plate, fare) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [rideId, driver_id, pickup_point, dropoff_point, available_seats, departure_time, car_model, car_make, number_plate, fare]
    );
    res.status(201).json({ message: 'Ride created!', ride_id: rideId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create ride' });
  }
};

exports.getAllRides = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM rides');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
};

exports.getRidesByDate = async (req, res) => {
  try {
    const { date } = req.body;

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    const rideDate = date || today;

    const [rows] = await db.execute(
      'SELECT * FROM rides WHERE date = ? ORDER BY time ASC',
      [rideDate]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No rides found for this date', date: rideDate });
    }

    res.status(200).json({
      message: `Rides for ${rideDate}`,
      data: rows
    });
  } catch (err) {
    console.error('Error fetching rides by date:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.bookRide = async (req, res) => {
  const { ride_id, passenger_id, pickup_point, dropoff_point } = req.body;

  if (!ride_id || !passenger_id || !pickup_point || !dropoff_point) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // 1. Check available seats
    const [rideRows] = await db.execute(
      'SELECT available_seats FROM rides WHERE id = ?',
      [ride_id]
    );

    if (rideRows.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const seatsAvailable = rideRows[0].available_seats;

    if (seatsAvailable <= 0) {
      return res.status(400).json({ error: 'No seats available for this ride' });
    }

    // 2. Verify passenger exists
    const [passengerRows] = await db.execute(
      'SELECT * FROM passengers WHERE id = ?',
      [passenger_id]
    );

    if (passengerRows.length === 0) {
      return res.status(404).json({ error: 'Passenger not found' });
    }

    // 3. Insert booking
    await db.execute(
      'INSERT INTO bookings (ride_id, passenger_id, pickup_point, dropoff_point) VALUES (?, ?, ?, ?)',
      [ride_id, passenger_id, pickup_point, dropoff_point]
    );

    // 4. Update available seats
    await db.execute(
      'UPDATE rides SET available_seats = available_seats - 1 WHERE id = ?',
      [ride_id]
    );

    res.status(201).json({ message: 'Ride booked successfully!', passenger_id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Booking failed' });
  }
};


exports.getBookedPassengers = async (req, res) => {
  const { ride_id } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT 
         passengers.id AS passenger_id,
         passengers.name,
         passengers.phone, 
         bookings.pickup_point,
         bookings.dropoff_point
       FROM bookings
       JOIN passengers ON bookings.passenger_id = passengers.id
       WHERE bookings.ride_id = ?`,
      [ride_id]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch booked passengers' });
  }
};


exports.addRouteFare = async (req, res) => {
  const { origin_city, destination_city, fare } = req.body;

  if (!origin_city || !destination_city || fare == null) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const id = uuidv4(); // Unique ID for the fare record

  try {
    const [result] = await db.execute(
      `INSERT INTO route_fares (id, origin_city, destination_city, fare) 
       VALUES (?, ?, ?, ?)`,
      [id, origin_city, destination_city, fare]
    );

    res.status(201).json({
      message: 'Route fare added successfully',
      fare_id: id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error while adding fare' });
  }
};

exports.getAllRouteFares = async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT * FROM route_fares ORDER BY created_at DESC`);

    res.status(200).json({
      message: 'Route fares fetched successfully',
      data: rows
    });

  } catch (err) {
    console.error('Error fetching route fares:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


