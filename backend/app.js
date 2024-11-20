// Import dependencies
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize the app and SQLite database
const app = express();
const db = new sqlite3.Database('./tripgo.db'); // Ensure the database path is correct

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'frontend')));

// === API Routes ===

// Fetch all hotels with their reviews
app.get('/hotels', (req, res) => {
    const query = `
        SELECT h.id AS hotel_id, h.name AS hotel_name, h.price, h.photo_url, 
               r.reviewer_name, r.review, r.rating 
        FROM hotels h
        LEFT JOIN hotel_reviews r ON h.id = r.hotel_id
        ORDER BY h.id;
    `;

    db.all(query, (err, rows) => {
        if (err) {
            console.error("Error fetching hotels:", err);
            return res.status(500).json({ error: "Failed to fetch hotel data." });
        }

        // Group reviews by hotel
        const hotels = {};
        rows.forEach(row => {
            if (!hotels[row.hotel_id]) {
                hotels[row.hotel_id] = {
                    hotel_id: row.hotel_id,
                    hotel_name: row.hotel_name,
                    price: row.price,
                    photo_url: row.photo_url,
                    reviews: []
                };
            }
            if (row.reviewer_name) {
                hotels[row.hotel_id].reviews.push({
                    reviewer_name: row.reviewer_name,
                    review: row.review,
                    rating: row.rating
                });
            }
        });

        res.json(Object.values(hotels)); // Return grouped hotel data
    });
});

// Fetch reviews for a specific hotel
app.get('/hotels/:id/reviews', (req, res) => {
    const hotelId = req.params.id;
    const query = `
        SELECT reviewer_name, review, rating 
        FROM hotel_reviews 
        WHERE hotel_id = ?;
    `;

    db.all(query, [hotelId], (err, rows) => {
        if (err) {
            console.error("Error fetching hotel reviews:", err);
            return res.status(500).json({ error: "Failed to fetch reviews." });
        }
        res.json(rows);
    });
});

// User registration
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error("Error hashing password:", err);
            return res.status(500).json({ message: 'Error hashing password.' });
        }

        db.run(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword],
            function (err) {
                if (err) {
                    console.error("Error registering user:", err);
                    return res.status(400).json({ message: 'Error registering user.' });
                }
                res.status(201).json({ message: 'User registered successfully.' });
            }
        );
    });
});

// User login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            console.error("Error fetching user:", err);
            return res.status(500).json({ message: 'Database error.' });
        }
        if (!user) {
            return res.status(400).json({ message: 'Invalid login details.' });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error("Error comparing passwords:", err);
                return res.status(500).json({ message: 'Error comparing passwords.' });
            }
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid login details.' });
            }

            res.status(200).json({ message: 'Login successful.' });
        });
    });
});

// Book a hotel
app.post('/api/book-hotel', (req, res) => {
    const { hotelId, paymentMethod } = req.body;

    if (!hotelId || !paymentMethod) {
        return res.status(400).json({ error: 'Hotel ID and payment method are required.' });
    }

    const bookingDate = new Date().toISOString(); // Current date and time
    db.run(
        'INSERT INTO bookings (hotel_id, payment_method, booking_date) VALUES (?, ?, ?)',
        [hotelId, paymentMethod, bookingDate],
        function (err) {
            if (err) {
                console.error('Error booking hotel:', err.message);
                return res.status(500).json({ error: 'Failed to book the hotel.' });
            }
            res.status(201).json({ message: 'Hotel booked successfully!', bookingId: this.lastID });
        }
    );
});

// Fetch booked hotels
app.get('/api/booked-hotels', (req, res) => {
    const query = `
        SELECT b.id AS booking_id, h.name AS hotel_name, b.payment_method, b.booking_date, h.photo_url
        FROM bookings b
        JOIN hotels h ON b.hotel_id = h.id;
    `;

    db.all(query, (err, rows) => {
        if (err) {
            console.error('Error fetching booked hotels:', err.message);
            return res.status(500).json({ error: 'Failed to retrieve booked hotels.' });
        }
        res.json(rows);
    });
});

// Cancel a booking
app.delete('/api/cancel/:bookingId', async (req, res) => {
    const bookingId = req.params.bookingId;

    try {
        const result = await new Promise((resolve, reject) => {
            db.run('DELETE FROM bookings WHERE id = ?', [bookingId], function (err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        res.status(200).json({ message: 'Cancellation successful.' });
    } catch (error) {
        console.error('Error canceling booking:', error.message);
        res.status(500).json({ error: 'An error occurred while canceling the booking.' });
    }
});

// Serve the booking payment page
app.get('/booking_payment', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'booking_payment.html'));
});

// Payment processing
app.post('/api/payment', async (req, res) => {
    try {
        const paymentDetails = req.body;

        // Simulate successful payment
        res.status(200).json({ message: 'Payment successful' });
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ message: 'Payment failed, please try again.' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});