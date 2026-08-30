const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");
const { awardXP, evaluateAchievements } = require("../services/achievementService");

const router = express.Router();


// ======================================
// POST /api/journals
// Save a journal entry (JWT protected)
// ======================================

router.post("/", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const { title, text, content } = req.body;
    const journalText = (text || content || "").trim();
    const journalTitle = (title || "").trim();

    if (!journalText) {
        return res.status(400).json({
            success: false,
            message: "Journal text is required"
        });
    }

    const sql = `
        INSERT INTO journals (user_id, title, content, journal_date)
        VALUES (?, ?, ?, CURDATE())
    `;

    db.query(sql, [userId, journalTitle, journalText], async (err, result) => {

        if (err) {
            console.error("Error saving journal:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to save journal entry: " + (err.sqlMessage || err.message)
            });
        }

        // Award XP for journal entry (10 XP)
        try {
            await awardXP(userId, 10, "Journal entry", "journal", result.insertId);
            evaluateAchievements(userId, () => {});
        } catch(e) {
            console.error("XP award error in journals:", e);
        }

        res.status(201).json({
            success: true,
            message: "Journal entry saved!",
            journal_id: result.insertId,
            created_at: new Date().toISOString()
        });

    });

});


// ======================================
// GET /api/journals
// Get all journal entries for the
// logged-in user (newest first, limit 30)
// ======================================

router.get("/", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const sql = `
        SELECT journal_id AS id, title, content AS text, journal_date, created_at
        FROM journals
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 30
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("Error fetching journals:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch journal entries: " + (err.sqlMessage || err.message)
            });
        }

        res.status(200).json({
            success: true,
            journals: results || []
        });

    });

});


// ======================================
// GET /api/journals/:id
// Get a single journal entry by ID.
// Only the owner can access it.
// ======================================

router.get("/:id", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const entryId = parseInt(req.params.id, 10);

    if (isNaN(entryId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid journal ID"
        });
    }

    const sql = `
        SELECT journal_id AS id, title, content AS text, journal_date, created_at
        FROM journals
        WHERE journal_id = ? AND user_id = ?
    `;

    db.query(sql, [entryId, userId], (err, results) => {

        if (err) {
            console.error("Error fetching journal:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch journal entry: " + (err.sqlMessage || err.message)
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Journal entry not found"
            });
        }

        res.status(200).json({
            success: true,
            journal: results[0]
        });

    });

});


// ======================================
// DELETE /api/journals/:id
// Delete a journal entry by ID.
// Only the owner can delete their own.
// ======================================

router.delete("/:id", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const entryId = parseInt(req.params.id, 10);

    if (isNaN(entryId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid journal ID"
        });
    }

    const sql = `
        DELETE FROM journals
        WHERE journal_id = ? AND user_id = ?
    `;

    db.query(sql, [entryId, userId], (err, result) => {

        if (err) {
            console.error("Error deleting journal:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to delete journal entry: " + (err.sqlMessage || err.message)
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Journal entry not found or already deleted"
            });
        }

        res.status(200).json({
            success: true,
            message: "Journal entry deleted"
        });

    });

});


// ======================================
// PUT /api/journals/:id
// Update an existing journal entry.
// Only the owner can edit their own.
// ======================================

router.put("/:id", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const entryId = parseInt(req.params.id, 10);

    if (isNaN(entryId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid journal ID"
        });
    }

    const { title, text, content } = req.body;
    const journalText = (text || content || "").trim();
    const journalTitle = (title || "").trim();

    if (!journalText) {
        return res.status(400).json({
            success: false,
            message: "Journal text cannot be empty"
        });
    }

    const sql = `
        UPDATE journals
        SET title = ?, content = ?
        WHERE journal_id = ? AND user_id = ?
    `;

    db.query(sql, [journalTitle, journalText, entryId, userId], (err, result) => {

        if (err) {
            console.error("Error updating journal:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to update journal entry: " + (err.sqlMessage || err.message)
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Journal entry not found or unauthorized"
            });
        }

        res.status(200).json({
            success: true,
            message: "Journal entry updated!",
            journal: {
                id: entryId,
                title: journalTitle,
                text: journalText
            }
        });

    });

});


// ======================================
// POST /api/journals/analyze
// AI Sentiment & Reflection Analysis
// Checks if AI provider is configured
// ======================================

router.post("/analyze", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const { text, content } = req.body;
    const journalText = (text || content || "").trim();

    if (!journalText) {
        return res.status(400).json({
            success: false,
            message: "Journal text is required for analysis."
        });
    }

    // Check if an AI service/API key (OpenAI/Gemini) is configured in environment
    const aiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

    if (!aiKey) {
        return res.status(200).json({
            success: false,
            available: false,
            message: "AI service is not configured. An API key (OpenAI/Gemini) is required in the backend environment."
        });
    }

    // If an external service is configured in the future, handle it here
    return res.status(200).json({
        success: false,
        available: false,
        message: "AI service provider integration pending."
    });

});


module.exports = router;
