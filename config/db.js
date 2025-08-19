const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.HOST,
    port: process.env.PORT,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    waitForConnections: true,  
    connectionLimit: 10, 
    queueLimit: 0              
});

// Using the pool to connect
pool.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed: ", err.message);
        return;
    }
    console.log("Connected to the database");

    // Don't forget to release the connection when done
    connection.release();
});

// Export the pool for use in other parts of your app
module.exports = pool;