const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");
const { awardXP, evaluateAchievements } = require("../services/achievementService");

const router = express.Router();

// ======================================
// POST /api/focus/start
// Wait, typically we can just log complete sessions
// If the prompt requires start/complete separation:
// ======================================
router.post("/start", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { task_name, duration } = req.body;
    if (!duration) return res.status(400).json({ success: false, message: "Duration required" });

    const sql = `
        INSERT INTO focus_sessions (user_id, task_name, duration, completed)
        VALUES (?, ?, ?, FALSE)
    `;

    db.query(sql, [userId, task_name || 'Focus Session', duration], (err, result) => {
        if (err) {
            console.error("Error starting focus session:", err);
            return res.status(500).json({ success: false, message: "Failed to start focus session" });
        }
        res.status(201).json({ success: true, session_id: result.insertId });
    });
});

// ======================================
// POST /api/focus/complete
// Complete a session
// ======================================
router.post("/complete", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { session_id, duration_completed } = req.body; // Can support completing without start if session_id is omitted

    if (session_id) {
        const sql = `
            UPDATE focus_sessions
            SET completed = TRUE, completed_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        `;
        db.query(sql, [session_id, userId], async (err, result) => {
            if (err) {
                console.error("Error completing session:", err);
                return res.status(500).json({ success: false, message: "Failed to complete" });
            }
            
            try {
                await awardXP(userId, 10, "Focus session", "focus_session", session_id);
                evaluateAchievements(userId, () => {});
            } catch(e) {
                console.error("XP award error in focus:", e);
            }
            
            res.status(200).json({ success: true, message: "Session completed!" });
        });
    } else {
        // If they just send a complete request without starting (e.g. client handles timer)
        const { task_name, duration } = req.body;
        const sql = `
            INSERT INTO focus_sessions (user_id, task_name, duration, completed, completed_at)
            VALUES (?, ?, ?, TRUE, CURRENT_TIMESTAMP)
        `;
        db.query(sql, [userId, task_name || 'Focus Session', duration || duration_completed || 25], async (err, result) => {
            if (err) return res.status(500).json({ success: false, message: "Failed to save session" });
            
            try {
                await awardXP(userId, 10, "Focus session", "focus_session", result.insertId);
                evaluateAchievements(userId, () => {});
            } catch(e) {
                console.error("XP award error in focus:", e);
            }
            
            res.status(200).json({ success: true, message: "Session saved!" });
        });
    }
});

// ======================================
// GET /api/focus/history
// Get session history
// ======================================
router.get("/history", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const sql = `
        SELECT id, task_name, duration, completed, started_at, completed_at
        FROM focus_sessions
        WHERE user_id = ?
        ORDER BY started_at DESC
        LIMIT 50
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Failed to fetch history" });
        res.status(200).json({ success: true, sessions: results || [] });
    });
});

// ======================================
// GET /api/focus/stats
// Get focus stats (total minutes, etc)
// ======================================
router.get("/stats", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const sql = `
        SELECT 
            COUNT(*) as total_sessions,
            SUM(duration) as total_minutes,
            MAX(duration) as longest_session
        FROM focus_sessions
        WHERE user_id = ? AND completed = TRUE
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Failed to fetch stats" });
        
        const stats = results[0] || { total_sessions: 0, total_minutes: 0, longest_session: 0 };
        
        // Let's also fetch sessions this week
        const sqlWeek = `
            SELECT COUNT(*) as sessions_this_week
            FROM focus_sessions
            WHERE user_id = ? AND completed = TRUE 
              AND started_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        `;

        db.query(sqlWeek, [userId], (err2, weekResults) => {
            if (err2) return res.status(500).json({ success: false, message: "Failed to fetch week stats" });
            stats.sessions_this_week = weekResults[0].sessions_this_week || 0;
            res.status(200).json({ success: true, stats });
        });
    });
});

module.exports = router;
