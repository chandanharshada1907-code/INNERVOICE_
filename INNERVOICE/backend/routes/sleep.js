const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

// Automatically calculate sleep duration on backend
function calculateDuration(bedtime, wakeTime) {
    const [bedHour, bedMin] = bedtime.split(':').map(Number);
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);

    let bedTotalMinutes = bedHour * 60 + bedMin;
    let wakeTotalMinutes = wakeHour * 60 + wakeMin;

    // Handle overnight sleep (bedtime > wakeTime)
    if (bedTotalMinutes > wakeTotalMinutes) {
        wakeTotalMinutes += 24 * 60; // Add 24 hours
    }

    const durationMinutes = wakeTotalMinutes - bedTotalMinutes;
    // Convert to decimal hours (e.g., 7.5 hours)
    return parseFloat((durationMinutes / 60).toFixed(2));
}

// Format decimal hours to hours and minutes (e.g., 7.5 -> 7h 30m)
function formatDuration(decimalHours) {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

// POST /api/sleep - Add new sleep record
router.post('/', verifyToken, (req, res) => {
    const { sleepDate, bedtime, wakeTime, sleepQuality, notes } = req.body;
    const userId = req.user.id;

    if (!sleepDate || !bedtime || !wakeTime || !sleepQuality) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const duration = calculateDuration(bedtime, wakeTime);

    if (duration < 0 || duration > 24) {
        return res.status(400).json({ error: 'Invalid sleep duration' });
    }

    const query = `
        INSERT INTO sleep_records 
        (user_id, sleep_date, bedtime, wake_time, sleep_duration, sleep_quality, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [userId, sleepDate, bedtime, wakeTime, duration, sleepQuality, notes || null], (err, results) => {
        if (err) {
            console.error('Database error logging sleep:', err);
            return res.status(500).json({ error: 'Database error while logging sleep' });
        }
        res.status(201).json({ message: 'Sleep record added successfully', id: results.insertId });
    });
});

// GET /api/sleep/history - Get sleep history for logged-in user
router.get('/history', verifyToken, (req, res) => {
    const userId = req.user.id;
    const query = `
        SELECT id, sleep_date, bedtime, wake_time, sleep_duration, sleep_quality, notes, created_at 
        FROM sleep_records 
        WHERE user_id = ? 
        ORDER BY sleep_date DESC, created_at DESC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error fetching sleep history:', err);
            return res.status(500).json({ error: 'Database error while fetching sleep history' });
        }

        // Format duration for frontend if needed, but returning both is better
        const formattedResults = results.map(row => ({
            ...row,
            formatted_duration: formatDuration(row.sleep_duration)
        }));

        res.json(formattedResults);
    });
});

module.exports = router;
