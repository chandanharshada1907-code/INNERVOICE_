const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// ======================================
// GET /api/emotion-patterns
// Get emotion patterns triggers and overview
// ======================================
router.get("/", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const sql = `
        SELECT id, name, category, is_custom 
        FROM emotion_triggers 
        WHERE user_id IS NULL OR user_id = ?
        ORDER BY category, name
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching emotion patterns:", err);
            return res.status(500).json({ success: false, message: "Failed to fetch emotion patterns" });
        }
        res.status(200).json({ success: true, triggers: results || [] });
    });
});

// ======================================
// GET /api/emotion-patterns/triggers
// Get available triggers for the user
// ======================================
router.get("/triggers", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const sql = `
        SELECT id, name, category, is_custom 
        FROM emotion_triggers 
        WHERE user_id IS NULL OR user_id = ?
        ORDER BY category, name
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching triggers:", err);
            return res.status(500).json({ success: false, message: "Failed to fetch triggers" });
        }
        res.status(200).json({ success: true, triggers: results || [] });
    });
});

// ======================================
// POST /api/emotion-patterns
// Log a mood trigger
// ======================================
router.post("/", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { mood_id, trigger_id, custom_trigger_name, category, context_note } = req.body;

    if (!mood_id) {
        return res.status(400).json({ success: false, message: "Mood ID is required" });
    }

    const insertMoodTrigger = (t_id) => {
        const sql = `
            INSERT INTO mood_triggers (mood_id, trigger_id, context_note)
            VALUES (?, ?, ?)
        `;
        db.query(sql, [mood_id, t_id, context_note || ''], (err, result) => {
            if (err) {
                console.error("Error logging mood trigger:", err);
                return res.status(500).json({ success: false, message: "Failed to log mood trigger" });
            }
            res.status(201).json({ success: true, message: "Trigger logged successfully", id: result.insertId });
        });
    };

    if (custom_trigger_name) {
        // Create custom trigger first
        const sqlCustom = `
            INSERT INTO emotion_triggers (name, category, user_id, is_custom)
            VALUES (?, ?, ?, TRUE)
        `;
        db.query(sqlCustom, [custom_trigger_name, category || 'Other', userId], (err, result) => {
            if (err) {
                console.error("Error creating custom trigger:", err);
                return res.status(500).json({ success: false, message: "Failed to create custom trigger" });
            }
            insertMoodTrigger(result.insertId);
        });
    } else if (trigger_id) {
        insertMoodTrigger(trigger_id);
    } else {
        return res.status(400).json({ success: false, message: "Trigger ID or custom trigger name required" });
    }
});

// ======================================
// GET /api/emotion-patterns/history
// Get trigger history
// ======================================
router.get("/history", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const sql = `
        SELECT mt.id, mt.mood_id, m.mood, m.mood_icon, m.mood_date, 
               et.name AS trigger_name, et.category AS trigger_category, 
               mt.context_note, mt.created_at
        FROM mood_triggers mt
        JOIN moods m ON mt.mood_id = m.mood_id
        JOIN emotion_triggers et ON mt.trigger_id = et.id
        WHERE m.user_id = ?
        ORDER BY mt.created_at DESC
        LIMIT 50
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching trigger history:", err);
            return res.status(500).json({ success: false, message: "Failed to fetch history" });
        }
        res.status(200).json({ success: true, history: results || [] });
    });
});

// ======================================
// GET /api/emotion-patterns/patterns
// Get deterministic patterns
// ======================================
router.get("/patterns", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // We can do a couple of group by queries or one that joins
    const sqlFreq = `
        SELECT et.name, COUNT(*) as count
        FROM mood_triggers mt
        JOIN moods m ON mt.mood_id = m.mood_id
        JOIN emotion_triggers et ON mt.trigger_id = et.id
        WHERE m.user_id = ?
        GROUP BY et.id, et.name
        ORDER BY count DESC
    `;

    const sqlMoods = `
        SELECT et.name as trigger_name, m.mood, COUNT(*) as count
        FROM mood_triggers mt
        JOIN moods m ON mt.mood_id = m.mood_id
        JOIN emotion_triggers et ON mt.trigger_id = et.id
        WHERE m.user_id = ?
        GROUP BY et.id, et.name, m.mood
    `;

    db.query(sqlFreq, [userId], (err, freqResults) => {
        if (err) {
            console.error("Error in patterns:", err);
            return res.status(500).json({ success: false, message: "Failed to load patterns" });
        }

        db.query(sqlMoods, [userId], (err2, moodResults) => {
            if (err2) {
                console.error("Error in patterns:", err2);
                return res.status(500).json({ success: false, message: "Failed to load patterns" });
            }

            res.status(200).json({
                success: true,
                frequencies: freqResults || [],
                moodDistribution: moodResults || []
            });
        });
    });
});

// ======================================
// DELETE /api/emotion-patterns/:id
// Delete a mood trigger record
// ======================================
router.delete("/:id", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const triggerId = parseInt(req.params.id, 10);
    if (isNaN(triggerId)) return res.status(400).json({ success: false, message: "Invalid ID" });

    // Ensure they own the mood entry this trigger is attached to
    const sql = `
        DELETE mt FROM mood_triggers mt
        JOIN moods m ON mt.mood_id = m.mood_id
        WHERE mt.id = ? AND m.user_id = ?
    `;

    db.query(sql, [triggerId, userId], (err, result) => {
        if (err) {
            console.error("Error deleting mood trigger:", err);
            return res.status(500).json({ success: false, message: "Failed to delete" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Trigger not found or unauthorized" });
        }
        res.status(200).json({ success: true, message: "Trigger deleted" });
    });
});

module.exports = router;
