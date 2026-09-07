const path = require("path");
const dotenv = require("dotenv");

const envPath = path.resolve(__dirname, ".env");
const envResult = dotenv.config({ path: envPath });
if (envResult && envResult.error) {
    console.warn("Could not load backend .env file at:", envPath, envResult.error.message);
}

const mysql = require("mysql2");

const pool = mysql.createPool({
    host:               process.env.DB_HOST     || "localhost",
    user:               process.env.DB_USER     || "root",
    password:           process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
    database:           process.env.DB_NAME     || "innervoice",
    port:               parseInt(process.env.DB_PORT || "3306", 10),
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
