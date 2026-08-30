const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");
const { awardXP, evaluateAchievements } = require("../services/achievementService");

const router = express.Router();


// ======================================
// POST /api/reflections
// Save a reflection entry (JWT protected)
// Body: { question, answer }
// ======================================

router.post("/", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const { question, answer } = req.body;

    if (!answer || answer.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Answer is required"
        });
    }

    const sql = `
        INSERT INTO reflections (user_id, question, answer, reflection_date)
        VALUES (?, ?, ?, CURDATE())
    `;

    db.query(
        sql,
        [userId, (question || "").trim(), answer.trim()],
        async (err, result) => {

            if (err) {
                console.error("Error saving reflection:", err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to save reflection: " + (err.sqlMessage || err.message)
                });
            }

            try {
                await awardXP(userId, 10, "Reflection", "reflection", result.insertId);
                evaluateAchievements(userId, () => {});
            } catch(e) {
                console.error("XP award error in reflections:", e);
            }

            res.status(201).json({
                success:        true,
                message:        "Reflection saved!",
                reflection_id:  result.insertId,
                created_at:     new Date().toISOString()
            });

        }
    );

});


// ======================================
// GET /api/reflections
// Get all reflections for the logged-in
// user (newest first, limit 30)
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
        SELECT reflection_id AS id, question, answer, reflection_date, created_at
        FROM reflections
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 30
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("Error fetching reflections:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch reflections: " + (err.sqlMessage || err.message)
            });
        }

        res.status(200).json({
            success:     true,
            reflections: results || []
        });

    });

});


// ======================================
// GET /api/reflections/:id
// Get a single reflection by ID.
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
            message: "Invalid reflection ID"
        });
    }

    const sql = `
        SELECT reflection_id AS id, question, answer, reflection_date, created_at
        FROM reflections
        WHERE reflection_id = ? AND user_id = ?
    `;

    db.query(sql, [entryId, userId], (err, results) => {

        if (err) {
            console.error("Error fetching reflection:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch reflection: " + (err.sqlMessage || err.message)
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Reflection not found"
            });
        }

        res.status(200).json({
            success:    true,
            reflection: results[0]
        });

    });

});


// ======================================
// DELETE /api/reflections/:id
// Delete a reflection by ID.
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
            message: "Invalid reflection ID"
        });
    }

    const sql = `
        DELETE FROM reflections
        WHERE reflection_id = ? AND user_id = ?
    `;

    db.query(sql, [entryId, userId], (err, result) => {

        if (err) {
            console.error("Error deleting reflection:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to delete reflection: " + (err.sqlMessage || err.message)
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Reflection not found or already deleted"
            });
        }

        res.status(200).json({
            success: true,
            message: "Reflection deleted"
        });

    });

});


module.exports = router;
