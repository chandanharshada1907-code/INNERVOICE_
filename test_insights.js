const pool = require('./INNERVOICE/backend/db');

async function testWeeklyInsights() {
    try {
        // Find a user ID
        const [users] = await pool.promise().query('SELECT id, email FROM users LIMIT 1');
        if (users.length === 0) {
            console.log("No users found.");
            return;
        }
        const user = users[0];
        
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || "fallback_secret",
            { expiresIn: "7d" }
        );

        console.log("Testing GET /api/insights/weekly for user:", user.email);
        
        const res = await fetch('http://localhost:5000/api/insights/weekly', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = await res.json();
        
        if (res.ok) {
            console.log("✅ SUCCESS:", data);
        } else {
            console.error("❌ HTTP ERROR:", res.status);
            console.error(data);
        }
    } catch (err) {
        console.error("❌ ERROR:", err.message);
    } finally {
        pool.end();
        process.exit();
    }
}

require('dotenv').config({ path: './INNERVOICE/backend/.env' });
testWeeklyInsights();
