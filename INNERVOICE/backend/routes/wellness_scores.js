const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/auth");

// Calculate and save wellness score
router.post("/calculate", verifyToken, async (req, res) => {
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    try {
        // We will sum up points based on today's activity
        let score = 50; // Base neutral score
        let reasons = [];

        // 1. Moods today
        const moodsQuery = "SELECT mood FROM moods WHERE user_id = ? AND DATE(created_at) = ?";
        const [moods] = await db.promise().query(moodsQuery, [userId, today]);
        
        let positiveMoods = 0;
        let negativeMoods = 0;
        for (const row of moods) {
            const m = row.mood.toLowerCase();
            if (["happy", "excited", "grateful", "calm", "relaxed", "loved", "proud", "motivated", "hopeful", "relief"].includes(m)) {
                positiveMoods++;
            } else if (["sad", "anxious", "angry", "stressed", "tired", "frustrated", "lonely", "confused", "overwhelmed", "guilty"].includes(m)) {
                negativeMoods++;
            }
        }
        
        if (positiveMoods > 0) {
            score += (positiveMoods * 5);
            reasons.push("Positive moods recorded");
        }
        if (negativeMoods > 0) {
            score -= (negativeMoods * 2); // Less penalty to encourage tracking
            reasons.push("Negative moods recorded");
        }

        // 2. Journaling today
        const [journals] = await db.promise().query("SELECT COUNT(*) as count FROM journals WHERE user_id = ? AND DATE(created_at) = ?", [userId, today]);
        if (journals[0].count > 0) {
            score += 10;
            reasons.push("Journaled thoughts");
        }

        // 3. Voice Journaling today
        const [vj] = await db.promise().query("SELECT COUNT(*) as count FROM voice_journals WHERE user_id = ? AND DATE(created_at) = ?", [userId, today]);
        if (vj[0].count > 0) {
            score += 10;
            reasons.push("Voice journaled");
        }

        // 4. Reflections today
        const [ref] = await db.promise().query("SELECT COUNT(*) as count FROM reflections WHERE user_id = ? AND DATE(created_at) = ?", [userId, today]);
        if (ref[0].count > 0) {
            score += 15;
            reasons.push("Completed reflection");
        }

        // 5. Focus Sessions completed today
        const [focus] = await db.promise().query("SELECT SUM(duration) as mins FROM focus_sessions WHERE user_id = ? AND DATE(started_at) = ? AND completed = TRUE", [userId, today]);
        if (focus[0].mins > 0) {
            score += 15;
            reasons.push(`Focused for ${focus[0].mins} mins`);
        }

        // Clamp score between 0 and 100
        score = Math.max(0, Math.min(100, score));
        const changeReason = reasons.length > 0 ? reasons.join(", ") : "Base score (No activity today)";

        // Insert or Update today's score
        const insertQuery = `
            INSERT INTO wellness_scores (user_id, score, change_reason, score_date) 
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            score = VALUES(score), change_reason = VALUES(change_reason)
        `;
        
        await db.promise().query(insertQuery, [userId, score, changeReason, today]);

        res.status(200).json({
            success: true,
            score: score,
            reason: changeReason,
            message: "Wellness score calculated successfully!"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error calculating score." });
    }
});

// Retrieve score history
router.get("/", verifyToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const query = `
            SELECT score, change_reason, score_date 
            FROM wellness_scores 
            WHERE user_id = ? 
            ORDER BY score_date DESC 
            LIMIT 30
        `;
        const [rows] = await db.promise().query(query, [userId]);

        res.status(200).json({
            success: true,
            history: rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error fetching score history." });
    }
});

module.exports = router;
