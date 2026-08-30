require("dotenv").config();
const mysql = require("mysql2");

const pool = mysql.createPool({
    host:               process.env.DB_HOST,
    user:               process.env.DB_USER,
    password:           process.env.DB_PASSWORD,
    database:           process.env.DB_NAME,
    charset:            "utf8mb4",
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0
});

// Force utf8mb4 on every new connection so emoji (😊 🎯 🔥) are stored correctly
pool.on("connection", function (connection) {
    connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
});

// Verify connection on startup
pool.getConnection((err, connection) => {
    if (err) {
        console.log("❌ MySQL connection failed!");
        console.log(err.message);
        return;
    }
    console.log("✅ MySQL connected successfully!");
    connection.release();
});

module.exports = pool;
