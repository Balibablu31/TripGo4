const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'tripgo.db'), (err) => {
    if (err) {
        console.error("Error connecting to the database:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

// Create `users` table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )
`);

// Create `hotels` table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS hotels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        photo_url TEXT NOT NULL
    )
`);

// Create `hotel_reviews` table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS hotel_reviews (
        review_id INTEGER PRIMARY KEY AUTOINCREMENT,
        hotel_id INTEGER NOT NULL,
        reviewer_name TEXT NOT NULL,
        review TEXT NOT NULL,
        rating REAL NOT NULL
    )
`);

// Create `bookings` table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hotel_id INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`);

// Insert sample hotel data
db.serialize(() => {
    db.get("SELECT COUNT(*) AS count FROM hotels", (err, row) => {
        if (err) {
            console.error("Error checking hotels table data:", err.message);
        } else if (row.count === 0) {
            console.log("Inserting sample hotel data...");
            const stmt = db.prepare("INSERT INTO hotels (name, price, photo_url) VALUES (?, ?, ?)");
            stmt.run("Grand Palace Hotel", 6000.00, "https://pic.surf/l1f");
            stmt.run("Seaside Resort", 1500.00, "https://pic.surf/gbq");
            stmt.run("Mountain View Inn", 2000.00, "https://pic.surf/68");
            stmt.run("Urban Escape Hotel", 4000.00, "https://pic.surf/joz");
            stmt.run("Downtown Suites", 3000.00, "https://pic.surf/qn");
            stmt.run("Country Club Lodge", 3500.00, "https://pic.surf/2up");
            stmt.run("Cozy Cabin Retreat", 2700.00, "https://pic.surf/g9c");
            stmt.run("Luxury Boutique Hotel", 4500.00, "https://via.placeholder.com/150?text=Luxury+Boutique+Hotel");
            stmt.run("Green Leaf Eco Resort", 5000.00, "https://pic.surf/er7");
            stmt.run("Sunlit Beach House", 6500.00, "https://pic.surf/vd");
            stmt.finalize();
        }
    });

    db.get("SELECT COUNT(*) AS count FROM hotel_reviews", (err, row) => {
        if (err) {
            console.error("Error checking hotel_reviews table data:", err.message);
        } else if (row.count === 0) {
            console.log("Inserting sample hotel reviews...");
            const reviewStmt = db.prepare(`
                INSERT INTO hotel_reviews (hotel_id, reviewer_name, review, rating) VALUES (?, ?, ?, ?)
            `);

            const reviews = [
                [1, 'Rajesh Sharma', 'Amazing service and great ambiance!', 4.8],
                [1, 'Priya Mehta', 'Loved the decor and the food!', 4.7],
                [1, 'Ankit Kumar', 'Slightly expensive, but worth it!', 4.5],
                [1, 'Kavita Joshi', 'Comfortable rooms and friendly staff.', 4.6],
                [2, 'Rohan Desai', 'Decent stay, but food quality could improve.', 3.5],
                [2, 'Neha Patel', 'Good location but noisy rooms.', 3.7],
                [2, 'Vivek Bansal', 'Average experience for the price.', 3.6],
                [2, 'Swati Kapoor', 'Wouldn\'t recommend for families.', 3.4],
                [3, 'Sameer Malhotra', 'Breathtaking view, worth every penny!', 4.9],
                [3, 'Pooja Gupta', 'Clean rooms and excellent staff.', 4.8],
                [3, 'Ajay Singh', 'Perfect for a romantic getaway.', 4.9],
                [3, 'Sneha Chatterjee', 'Loved the beach access and pool.', 4.7],
                [4, 'Anjali Nair', 'Very comfortable but far from the city center.', 4.2],
                [4, 'Rohit Verma', 'Affordable but needs better room service.', 4.0],
                [4, 'Meera Reddy', 'Great for budget travelers.', 4.1],
                [4, 'Kunal Thakur', 'Clean but lacks amenities.', 4.0],
                [5, 'Arjun Kapoor', 'Good facilities but noisy surroundings.', 3.8],
                [5, 'Divya Ahuja', 'Convenient location for business travelers.', 3.9],
                [5, 'Suresh Iyer', 'Rooms are modern but small.', 3.7],
                [5, 'Ria Deshmukh', 'Would recommend for short stays.', 3.8],
                [6, 'Akash Jain', 'Excellent location and friendly staff.', 4.7],
                [6, 'Nidhi Saxena', 'Comfortable stay with great amenities.', 4.6],
                [6, 'Shreya Bhardwaj', 'Loved the breakfast options!', 4.7],
                [6, 'Manish Tiwari', 'Perfect for business trips.', 4.6],
                [7, 'Deepak Soni', 'Perfect getaway with serene surroundings.', 4.6],
                [7, 'Kavya Desai', 'Peaceful and clean.', 4.5],
                [7, 'Rahul Chawla', 'Ideal for family vacations.', 4.6],
                [7, 'Ishita Roy', 'Loved the hiking trails nearby.', 4.7],
                [8, 'Affordable luxury in the heart of the city.', 4.5],
                [8, 'Simran Kaur', 'Modern rooms with great service.', 4.6],
                [8, 'Kartik Gupta', 'Parking is an issue, but overall good.', 4.4],
                [8, 'Tanya Bajaj', 'Highly recommend for business trips.', 4.5],
                [9, 'Aditya Joshi', 'Relaxing stay with great amenities.', 4.3],
                [9, 'Snehal Patil', 'Perfect for a weekend retreat.', 4.4],
                [9, 'Pranav Kulkarni', 'Good for families and couples alike.', 4.3],
                [9, 'Ritika Mishra', 'Lake view is stunning.', 4.5],
                [10, 'Ishaan Pandey', 'Historical charm with modern comfort.', 4.4],
                [10, 'Saumya Dixit', 'Loved the architecture and service.', 4.5],
                [10, 'Nisha Rao', 'Best for history enthusiasts!', 4.4],
                [10, 'Karan Chopra', 'Very clean and well-maintained.', 4.5],
            ];

            reviews.forEach((review) => {
                reviewStmt.run(review);
            });
            reviewStmt.finalize();
        }
    });
});

// Function to insert a booking
function insertBooking(hotelId, paymentMethod, callback) {
    const query = `INSERT INTO bookings (hotel_id, payment_method) VALUES (?, ?)`;
    db.run(query, [hotelId, paymentMethod], function (err) {
        callback(err, this.lastID);
    });
}

// Function to fetch all bookings
function getBookedHotels(callback) {
    const query = `
        SELECT b.id AS booking_id, h.name AS hotel_name, b.payment_method, b.booking_date 
        FROM bookings b 
        INNER JOIN hotels h ON b.hotel_id = h.id;
    `;
    db.all(query, [], (err, rows) => {
        callback(err, rows);
    });
}

module.exports = {
    db,
    insertBooking,
    getBookedHotels,
};