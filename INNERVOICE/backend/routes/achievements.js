const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");
const { evaluateAchievements, awardXP, calculateLevelInfo } = require("../services/achievementService");

const router = express.Router();

// ======================================
// GET /api/achievements
// Returns all achievements with live progress
// JWT protected.
// ======================================

router.get("/", verifyToken, (req, res) => {
    const userId = req.user.id;

    evaluateAchievements(userId, (err, data) => {
        if (err) {
            console.error("Error loading achievements:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to load achievements"
            });
        }
        res.status(200).json({ success: true, ...data });
    });
});

// ======================================
// GET /api/achievements/summary
// Returns XP, level info, stats
// ======================================

router.get("/summary", verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const promiseDb = db.promise();
        const [users] = await promiseDb.query("SELECT xp, level FROM users WHERE id = ?", [userId]);
        
        if(users.length === 0) return res.status(404).json({ success: false, message: "User not found" });
        
        const user = users[0];
        const levelInfo = calculateLevelInfo(user.xp);

        evaluateAchievements(userId, (err, data) => {
            if (err) return res.status(500).json({ success: false, message: "Failed to load stats" });
            
            res.status(200).json({
                success: true,
                xp: user.xp,
                levelInfo,
                stats: data.stats
            });
        });
    } catch(err) {
        console.error("Error getting summary:", err);
        res.status(500).json({ success: false, message: "Internal error" });
    }
});

// ======================================
// GET /api/achievements/history
// Returns recent XP transactions
// ======================================

router.get("/history", verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const promiseDb = db.promise();
        const [transactions] = await promiseDb.query(
            "SELECT * FROM achievement_xp_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10", 
            [userId]
        );
        
        res.status(200).json({
            success: true,
            transactions
        });
    } catch (err) {
        console.error("Error getting XP history:", err);
        res.status(500).json({ success: false, message: "Internal error" });
    }
});


// ======================================
// POST /api/achievements/log-activity
// Kept for backward compatibility if used directly
// ======================================

router.post("/log-activity", verifyToken, (req, res) => {
    const userId = req.user.id;
    const { activity_type, activity_name } = req.body;

    if (!activity_type) {
        return res.status(400).json({ success: false, message: "activity_type is required" });
    }

    const cleanType = String(activity_type).toLowerCase().trim();
    const cleanName = activity_name ? String(activity_name).trim() : "";

    const sql = `INSERT INTO wellness_activity_log (user_id, activity_type, activity_name) VALUES (?, ?, ?)`;
    db.query(sql, [userId, cleanType, cleanName], async (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Failed to log wellness activity" });

        try {
            await awardXP(userId, 5, `Wellness Activity: ${cleanType}`, 'wellness_activity_log', result.insertId);
        } catch(e) { console.error(e); }

        evaluateAchievements(userId, (achErr, data) => {
            res.status(201).json({
                success: true,
                message: "Activity logged",
                activity_id: result.insertId,
                newlyUnlocked: (data && data.newlyUnlocked) ? data.newlyUnlocked : [],
                stats: data ? data.stats : null
            });
        });
    });
});


// ======================================
// POST /api/achievements/evaluate
// Explicitly check & trigger unlocks
// ======================================

router.post("/evaluate", verifyToken, (req, res) => {
    const userId = req.user.id;
    evaluateAchievements(userId, (err, data) => {
        if (err) return res.status(500).json({ success: false, message: "Failed to check achievements" });
        res.status(200).json({ success: true, newlyUnlocked: data.newlyUnlocked, stats: data.stats });
    });
});

module.exports = router;
