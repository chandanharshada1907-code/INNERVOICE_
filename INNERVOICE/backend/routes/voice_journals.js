const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// ======================================
// POST /api/voice-journals
// Save a voice journal entry
// ======================================
router.post("/", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { transcript, duration } = req.body;
    if (!transcript) {
        return res.status(400).json({ success: false, message: "Transcript is required" });
    }

    const sql = `
        INSERT INTO voice_journals (user_id, transcript, duration)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [userId, transcript, duration || '00:00'], (err, result) => {
        if (err) {
            console.error("Error saving voice journal:", err);
            return res.status(500).json({ success: false, message: "Failed to save voice journal" });
        }
        res.status(201).json({
            success: true,
            message: "Voice journal saved!",
            id: result.insertId
        });
    });
});

// ======================================
// GET /api/voice-journals
// Get all voice journals for user
// ======================================
router.get("/", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const sql = `
        SELECT id, transcript, duration, created_at
        FROM voice_journals
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching voice journals:", err);
            return res.status(500).json({ success: false, message: "Failed to fetch voice journals" });
        }
        res.status(200).json({ success: true, journals: results || [] });
    });
});

// ======================================
// DELETE /api/voice-journals/:id
// Delete a voice journal entry
// ======================================
router.delete("/:id", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const entryId = parseInt(req.params.id, 10);
    if (isNaN(entryId)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const sql = `
        DELETE FROM voice_journals
        WHERE id = ? AND user_id = ?
    `;

    db.query(sql, [entryId, userId], (err, result) => {
        if (err) {
            console.error("Error deleting voice journal:", err);
            return res.status(500).json({ success: false, message: "Failed to delete voice journal" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Voice journal not found or unauthorized" });
        }
        res.status(200).json({ success: true, message: "Voice journal deleted" });
    });
});

module.exports = router;
