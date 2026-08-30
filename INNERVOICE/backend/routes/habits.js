const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");
const { awardXP, evaluateAchievements } = require("../services/achievementService");
const router = express.Router();

// Helper to calculate streaks and stats for a single habit
async function calculateHabitStats(habitId, userId) {
    const [completions] = await db.promise().query(
        "SELECT completion_date FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completed = 1 ORDER BY completion_date DESC",
        [habitId, userId]
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;
    
    // Reverse array to iterate chronologically
    const chronCompletions = [...completions].reverse();
    
    // Note: streak logic here is a simple consecutive-day logic for all frequency types to keep it robust but simple initially.
    // In a fully developed weekly frequency, missing a day might not break a streak, but for now we look at consecutive completed entries.
    for (const c of chronCompletions) {
        const d = new Date(c.completion_date);
        d.setHours(0,0,0,0);
        if (!lastDate) {
            tempStreak = 1;
        } else {
            const diffTime = Math.abs(d - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                tempStreak++;
            } else if (diffDays > 1) {
                if (tempStreak > longestStreak) longestStreak = tempStreak;
                tempStreak = 1;
            }
        }
        lastDate = d;
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;
    
    // Calculate current streak by checking if the last completion was today or yesterday
    if (chronCompletions.length > 0) {
        const lastC = new Date(chronCompletions[chronCompletions.length - 1].completion_date);
        const today = new Date();
        const diffTime = Math.abs(today.setHours(0,0,0,0) - lastC.setHours(0,0,0,0));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
            currentStreak = tempStreak;
        } else {
            currentStreak = 0;
        }
    }

    return { currentStreak, longestStreak, totalCompletions: completions.length };
}


// GET /api/habits - List active habits
router.get("/", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    try {
        const [habits] = await db.promise().query(
            "SELECT * FROM habits WHERE user_id = ? AND active = 1 ORDER BY created_at DESC",
            [userId]
        );

        // Get today's completions for these habits
        const todayStr = new Date().toISOString().split("T")[0];
        const [todayCompletions] = await db.promise().query(
            "SELECT habit_id FROM habit_completions WHERE user_id = ? AND completion_date = ? AND completed = 1",
            [userId, todayStr]
        );
        const todayCompletedIds = todayCompletions.map(c => c.habit_id);

        // Get this week's completions
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const weekStartStr = weekStart.toISOString().split("T")[0];
        const [weekCompletions] = await db.promise().query(
            "SELECT habit_id, COUNT(*) as count FROM habit_completions WHERE user_id = ? AND completed = 1 AND completion_date >= ? GROUP BY habit_id",
            [userId, weekStartStr]
        );
        const weekCountMap = {};
        weekCompletions.forEach(c => { weekCountMap[c.habit_id] = c.count; });

        const enriched = await Promise.all(habits.map(async h => {
            const stats = await calculateHabitStats(h.id, userId);
            let weeklyTarget = h.frequency_type === 'daily' ? 7 : (h.target_count || 1);
            let weeklyProgress = Math.min(100, Math.round(((weekCountMap[h.id] || 0) / weeklyTarget) * 100));

            return {
                ...h,
                current_streak: stats.currentStreak,
                longest_streak: stats.longestStreak,
                completed_today: todayCompletedIds.includes(h.id),
                weekly_progress: weeklyProgress
            };
        }));

        res.json({ success: true, habits: enriched });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching habits" });
    }
});

// GET /api/habits/summary - Global habit stats
router.get("/summary", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    try {
        const [habits] = await db.promise().query("SELECT id FROM habits WHERE user_id = ? AND active = 1", [userId]);
        const todayStr = new Date().toISOString().split("T")[0];
        
        const [todayCompletions] = await db.promise().query(
            "SELECT habit_id FROM habit_completions WHERE user_id = ? AND completion_date = ? AND completed = 1",
            [userId, todayStr]
        );

        let highestStreak = 0;
        for (const h of habits) {
            const stats = await calculateHabitStats(h.id, userId);
            if (stats.currentStreak > highestStreak) highestStreak = stats.currentStreak;
        }

        res.json({
            success: true,
            total_active: habits.length,
            completed_today: todayCompletions.length,
            completion_percentage: habits.length ? Math.round((todayCompletions.length / habits.length) * 100) : 0,
            overall_highest_streak: highestStreak
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching habit summary" });
    }
});

// POST /api/habits - Create a habit
router.post("/", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const { name, description, category, frequency_type, target_count, preferred_time } = req.body;
    
    if (!name) return res.status(400).json({ success: false, message: "Habit name is required." });

    try {
        const [result] = await db.promise().query(
            "INSERT INTO habits (user_id, name, description, category, frequency_type, target_count, preferred_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [userId, name, description, category || 'Wellness', frequency_type || 'daily', target_count || 1, preferred_time || null]
        );
        res.json({ success: true, message: "Habit created", habit_id: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to create habit" });
    }
});

// POST /api/habits/:id/complete - Mark completed
router.post("/:id/complete", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const habitId = req.params.id;
    const todayStr = new Date().toISOString().split("T")[0];

    try {
        // Ensure habit exists and belongs to user
        const [habits] = await db.promise().query("SELECT id FROM habits WHERE id = ? AND user_id = ?", [habitId, userId]);
        if (!habits.length) return res.status(404).json({ success: false, message: "Habit not found" });

        const [result] = await db.promise().query(
            "INSERT INTO habit_completions (habit_id, user_id, completion_date, completed) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE completed = 1",
            [habitId, userId, todayStr]
        );
        
        if (result.affectedRows === 1 || result.affectedRows === 2) {
            // Award XP for habit completion (5 XP)
            try {
                // If ON DUPLICATE KEY UPDATE triggers without actually changing anything, affectedRows might be 0 or 2 depending on connection flags. 
                // Using transaction ID `habit_${habitId}_${todayStr}` to ensure idempotency is handled by awardXP naturally, but we can pass `result.insertId` or a string
                await awardXP(userId, 5, "Habit completion", "habit_completion", parseInt(habitId) + (new Date(todayStr).getTime() / 100000));
                evaluateAchievements(userId, () => {});
            } catch(e) {
                console.error("XP award error in habits:", e);
            }
        }
        
        const stats = await calculateHabitStats(habitId, userId);
        res.json({ success: true, message: "Habit completed", ...stats });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to complete habit" });
    }
});

// POST /api/habits/:id/uncomplete - Mark uncompleted
router.post("/:id/uncomplete", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const habitId = req.params.id;
    const todayStr = new Date().toISOString().split("T")[0];

    try {
        await db.promise().query(
            "DELETE FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completion_date = ?",
            [habitId, userId, todayStr]
        );
        const stats = await calculateHabitStats(habitId, userId);
        res.json({ success: true, message: "Habit uncompleted", ...stats });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to uncomplete habit" });
    }
});

// DELETE /api/habits/:id - Soft delete
router.delete("/:id", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const habitId = req.params.id;

    try {
        const [result] = await db.promise().query("UPDATE habits SET active = 0 WHERE id = ? AND user_id = ?", [habitId, userId]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Habit not found or already deleted" });
        res.json({ success: true, message: "Habit deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to delete habit" });
    }
});

module.exports = router;
