const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/auth");

// ─────────────────────────────────────────────────────────────
// PHQ-9 SEVERITY CALCULATION
// ─────────────────────────────────────────────────────────────
function calculatePhq9Severity(score) {
    if (score <= 4) return "Minimal";
    if (score <= 9) return "Mild";
    if (score <= 14) return "Moderate";
    if (score <= 19) return "Moderately severe";
    return "Severe";
}

// ─────────────────────────────────────────────────────────────
// GAD-7 SEVERITY CALCULATION
// ─────────────────────────────────────────────────────────────
function calculateGad7Severity(score) {
    if (score <= 4) return "Minimal";
    if (score <= 9) return "Mild";
    if (score <= 14) return "Moderate";
    return "Severe";
}

// ─────────────────────────────────────────────────────────────
// POST /api/assessments/phq9 - Submit PHQ-9 Assessment
// ─────────────────────────────────────────────────────────────
router.post("/phq9", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { answers } = req.body;

        if (!Array.isArray(answers) || answers.length !== 9) {
            return res.status(400).json({
                success: false,
                message: "PHQ-9 requires exactly 9 answered questions."
            });
        }

        const validAnswers = answers.every(val => Number.isInteger(val) && val >= 0 && val <= 3);
        if (!validAnswers) {
            return res.status(400).json({
                success: false,
                message: "Each answer must be an integer between 0 and 3."
            });
        }

        const totalScore = answers.reduce((sum, val) => sum + val, 0);
        const severity = calculatePhq9Severity(totalScore);
        const flagQuestion9 = answers[8] > 0;

        const answersJson = JSON.stringify(answers);

        const [result] = await db.promise().query(
            "INSERT INTO mental_wellness_assessments (user_id, assessment_type, total_score, severity, answers) VALUES (?, 'phq9', ?, ?, ?)",
            [userId, totalScore, severity, answersJson]
        );

        return res.status(201).json({
            success: true,
            id: result.insertId,
            assessment_type: "phq9",
            total_score: totalScore,
            max_score: 27,
            severity: severity,
            flagQuestion9: flagQuestion9,
            safetyMessage: flagQuestion9 ? "Your response to Question 9 indicates thoughts of self-harm or distress. Help is available 24/7. Please connect with emergency helplines immediately." : null,
            created_at: new Date()
        });
    } catch (err) {
        console.error("Error submitting PHQ-9:", err.message);
        return res.status(500).json({ success: false, message: "Server error submitting PHQ-9 assessment." });
    }
});

// ─────────────────────────────────────────────────────────────
// POST /api/assessments/gad7 - Submit GAD-7 Assessment
// ─────────────────────────────────────────────────────────────
router.post("/gad7", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { answers } = req.body;

        if (!Array.isArray(answers) || answers.length !== 7) {
            return res.status(400).json({
                success: false,
                message: "GAD-7 requires exactly 7 answered questions."
            });
        }

        const validAnswers = answers.every(val => Number.isInteger(val) && val >= 0 && val <= 3);
        if (!validAnswers) {
            return res.status(400).json({
                success: false,
                message: "Each answer must be an integer between 0 and 3."
            });
        }

        const totalScore = answers.reduce((sum, val) => sum + val, 0);
        const severity = calculateGad7Severity(totalScore);
        const answersJson = JSON.stringify(answers);

        const [result] = await db.promise().query(
            "INSERT INTO mental_wellness_assessments (user_id, assessment_type, total_score, severity, answers) VALUES (?, 'gad7', ?, ?, ?)",
            [userId, totalScore, severity, answersJson]
        );

        return res.status(201).json({
            success: true,
            id: result.insertId,
            assessment_type: "gad7",
            total_score: totalScore,
            max_score: 21,
            severity: severity,
            created_at: new Date()
        });
    } catch (err) {
        console.error("Error submitting GAD-7:", err.message);
        return res.status(500).json({ success: false, message: "Server error submitting GAD-7 assessment." });
    }
});

// ─────────────────────────────────────────────────────────────
// GET /api/assessments/history - Retrieve User Assessment History
// ─────────────────────────────────────────────────────────────
router.get("/history", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.promise().query(
            "SELECT id, assessment_type, total_score, severity, answers, created_at FROM mental_wellness_assessments WHERE user_id = ? ORDER BY created_at DESC",
            [userId]
        );

        return res.json({
            success: true,
            history: rows
        });
    } catch (err) {
        console.error("Error fetching assessment history:", err.message);
        return res.status(500).json({ success: false, message: "Server error fetching assessment history." });
    }
});

module.exports = router;
