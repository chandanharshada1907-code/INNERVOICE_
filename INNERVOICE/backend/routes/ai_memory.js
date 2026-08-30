const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// ======================================
// GET /api/ai-memory
// Get all saved AI memories/preferences
// ======================================
router.get("/", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const sql = `
        SELECT id, memory_type, memory_key, memory_value, created_at, updated_at
        FROM ai_memory
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Failed to fetch memories" });
        res.status(200).json({ success: true, memories: results || [] });
    });
});

// ======================================
// POST /api/ai-memory
// Create a new memory
// ======================================
router.post("/", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { memory_type, memory_key, memory_value } = req.body;
    if (!memory_key || !memory_value) return res.status(400).json({ success: false, message: "Key and value required" });

    // Ensure we don't store passwords or tokens (simple check)
    const lowerVal = memory_value.toLowerCase();
    if (lowerVal.includes('password') || lowerVal.includes('token') || lowerVal.includes('jwt')) {
        return res.status(400).json({ success: false, message: "Storing sensitive information is prohibited" });
    }

    // Check if key already exists, then update instead, or just insert new
    const checkSql = `SELECT id FROM ai_memory WHERE user_id = ? AND memory_key = ?`;
    db.query(checkSql, [userId, memory_key], (checkErr, checkResults) => {
        if (checkErr) return res.status(500).json({ success: false, message: "Database error" });

        if (checkResults.length > 0) {
            // Update
            const updateSql = `UPDATE ai_memory SET memory_value = ?, memory_type = ? WHERE id = ?`;
            db.query(updateSql, [memory_value, memory_type || 'preference', checkResults[0].id], (err, result) => {
                if (err) return res.status(500).json({ success: false, message: "Failed to update memory" });
                res.status(200).json({ success: true, message: "Memory updated!", id: checkResults[0].id });
            });
        } else {
            // Insert
            const sql = `
                INSERT INTO ai_memory (user_id, memory_type, memory_key, memory_value)
                VALUES (?, ?, ?, ?)
            `;
            db.query(sql, [userId, memory_type || 'preference', memory_key, memory_value], (err, result) => {
                if (err) return res.status(500).json({ success: false, message: "Failed to create memory" });
                res.status(201).json({ success: true, message: "Memory saved!", id: result.insertId });
            });
        }
    });
});

// ======================================
// PUT /api/ai-memory/:id
// Update specific memory by ID
// ======================================
router.put("/:id", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const memId = parseInt(req.params.id, 10);
    const { memory_value } = req.body;
    if (isNaN(memId) || !memory_value) return res.status(400).json({ success: false, message: "Invalid input" });

    const sql = `UPDATE ai_memory SET memory_value = ? WHERE id = ? AND user_id = ?`;
    db.query(sql, [memory_value, memId, userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Failed to update memory" });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Memory not found" });
        res.status(200).json({ success: true, message: "Memory updated!" });
    });
});

// ======================================
// DELETE /api/ai-memory/:id
// Delete a specific memory
// ======================================
router.delete("/:id", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const memId = parseInt(req.params.id, 10);
    if (isNaN(memId)) return res.status(400).json({ success: false, message: "Invalid input" });

    const sql = `DELETE FROM ai_memory WHERE id = ? AND user_id = ?`;
    db.query(sql, [memId, userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Failed to delete memory" });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Memory not found" });
        res.status(200).json({ success: true, message: "Memory deleted!" });
    });
});

// ======================================
// DELETE /api/ai-memory
// Clear all memories
// ======================================
router.delete("/", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const sql = `DELETE FROM ai_memory WHERE user_id = ?`;
    db.query(sql, [userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Failed to clear memory" });
        res.status(200).json({ success: true, message: "All memories cleared!" });
    });
});

module.exports = router;
