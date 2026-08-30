const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// ======================================
// HELPER: GENERATE TIMELY REMINDERS
// ======================================
async function ensureDailyReminders(userId) {
    const promiseDb = db.promise();
    const todayStr = new Date().toISOString().split('T')[0];

    try {
        // 1. Get existing notifications generated today to avoid duplicates
        const [existing] = await promiseDb.query(`
            SELECT type, reference_id FROM notifications 
            WHERE user_id = ? AND DATE(created_at) = CURDATE()
        `, [userId]);
        
        const existingKeys = new Set(existing.map(r => r.reference_id ? `${r.type}_${r.reference_id}` : r.type));

        const toInsert = [];

        // 2. Check Mood Check-in
        if (!existingKeys.has("mood_reminder")) {
            const [moods] = await promiseDb.query(`
                SELECT mood_id FROM moods 
                WHERE user_id = ? AND (mood_date = CURDATE() OR DATE(created_at) = CURDATE()) 
                LIMIT 1
            `, [userId]);
            if (moods.length === 0) {
                toInsert.push([userId, "mood_reminder", "Daily Mood Check-in", "How are you feeling right now? Take a brief moment to check in.", "😊", "#mood", "high", null]);
            }
        }

        // 3. Check Journaling
        if (!existingKeys.has("journal_reminder")) {
            const [journals] = await promiseDb.query(`
                SELECT journal_id FROM journals 
                WHERE user_id = ? AND (journal_date = CURDATE() OR DATE(created_at) = CURDATE()) 
                LIMIT 1
            `, [userId]);
            if (journals.length === 0) {
                toInsert.push([userId, "journal_reminder", "Mindful Journaling", "Take a few minutes to reflect on your day.", "📝", "#journal", "medium", null]);
            }
        }

        // 4. Check Goals
        if (!existingKeys.has("goal_reminder")) {
            const [goals] = await promiseDb.query(`
                SELECT goal_id FROM goals 
                WHERE user_id = ? AND completed = 0 AND target_date = CURDATE()
                LIMIT 1
            `, [userId]);
            if (goals.length > 0) {
                toInsert.push([userId, "goal_reminder", "Goal Reminder", "You have a wellness goal due today that is not yet completed.", "🎯", "#goals", "medium", null]);
            }
        }

        // 5. Check Habits (optional — table may not exist until migrate_habits.sql is run)
        try {
            const [habits] = await promiseDb.query(`
                SELECT h.id, h.name FROM habits h
                LEFT JOIN habit_completions hc ON h.id = hc.habit_id AND hc.completion_date = CURDATE()
                WHERE h.user_id = ? AND h.active = 1 AND hc.id IS NULL
            `, [userId]);
            
            for (const habit of habits) {
                const refKey = `habit_reminder_${habit.id}`;
                if (!existingKeys.has(refKey)) {
                    toInsert.push([userId, "habit_reminder", "Habit Reminder", `Your "${habit.name}" habit is waiting for you.`, "🔥", "#habits", "medium", habit.id.toString()]);
                }
            }
        } catch (habitErr) {
            // habits / habit_completions table may not exist yet — skip silently
            console.warn("Habit reminder check skipped (table may not exist):", habitErr.code || habitErr.message);
        }

        // 6. Check Daily Plan (optional — table may not exist until migrate_daily_plan.sql is run)
        try {
            if (!existingKeys.has("daily_plan_reminder")) {
                const [plans] = await promiseDb.query(`
                    SELECT p.id, COUNT(i.id) as pending_items 
                    FROM daily_plans p
                    JOIN daily_plan_items i ON p.id = i.daily_plan_id
                    WHERE p.user_id = ? AND p.plan_date = CURDATE() AND i.completed = 0
                    GROUP BY p.id
                `, [userId]);
                
                if (plans.length > 0 && plans[0].pending_items > 0) {
                    toInsert.push([userId, "daily_plan_reminder", "Daily Plan", `You still have ${plans[0].pending_items} wellness activities to complete today.`, "🌱", "#daily-plan", "high", null]);
                }
            }
        } catch (planErr) {
            // daily_plans / daily_plan_items table may not exist yet — skip silently
            console.warn("Daily plan reminder check skipped (table may not exist):", planErr.code || planErr.message);
        }

        // Insert new notifications
        if (toInsert.length > 0) {
            const insertSql = `
                INSERT INTO notifications (user_id, type, title, message, icon, link, priority, reference_id)
                VALUES ?
            `;
            await promiseDb.query(insertSql, [toInsert]);
        }
    } catch (err) {
        console.error("Error generating daily reminders:", err);
    }
}

// ======================================
// GET /api/notifications
// ======================================
router.get("/", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const filter = req.query.filter || 'all';
    const limit = parseInt(req.query.limit, 10) || 50;

    await ensureDailyReminders(userId);

    let sql = `SELECT id, user_id, type, title, message, icon, link, priority, reference_id, is_read, created_at 
               FROM notifications WHERE user_id = ?`;
    const params = [userId];

    if (filter === 'unread') {
        sql += ` AND is_read = 0`;
    } else if (filter === 'today') {
        sql += ` AND DATE(created_at) = CURDATE()`;
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: "Database error", error: err.message });
        
        // Count unread from all (not just the filtered/limited list)
        db.query(`SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0`, [userId], (err2, countRows) => {
            if (err2) return res.status(500).json({ success: false, message: "Database error" });
            
            res.json({
                success: true,
                notifications: rows,
                unread_count: countRows[0].unread_count
            });
        });
    });
});

// ======================================
// GET /api/notifications/unread-count
// ======================================
router.get("/unread-count", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    db.query(`SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        res.json({ success: true, count: rows[0].count });
    });
});

// ======================================
// POST /api/notifications
// ======================================
router.post("/", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { type, title, message, icon, link, priority, reference_id } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: "title and message are required" });

    const sql = `
        INSERT INTO notifications (user_id, type, title, message, icon, link, priority, reference_id, is_read)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;
    const values = [
        userId, 
        type || 'reminder', 
        title, 
        message, 
        icon || '🔔', 
        link || '#dashboard', 
        priority || 'low', 
        reference_id || null
    ];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Database error", error: err.message });
        res.status(201).json({ success: true, notification_id: result.insertId });
    });
});

// ======================================
// PUT /api/notifications/:id/read
// ======================================
router.put("/:id/read", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const notifId = parseInt(req.params.id, 10);
    if (!userId || isNaN(notifId)) return res.status(401).json({ success: false, message: "Unauthorized or Invalid ID" });

    db.query(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [notifId, userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, message: "Marked as read" });
    });
});

// ======================================
// PUT /api/notifications/read-all
// ======================================
router.put("/read-all", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    db.query(`UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`, [userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        res.json({ success: true, message: "All marked as read" });
    });
});

// ======================================
// DELETE /api/notifications/:id
// ======================================
router.delete("/:id", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const notifId = parseInt(req.params.id, 10);
    if (!userId || isNaN(notifId)) return res.status(401).json({ success: false, message: "Unauthorized or Invalid ID" });

    db.query(`DELETE FROM notifications WHERE id = ? AND user_id = ?`, [notifId, userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, message: "Deleted" });
    });
});

module.exports = router;
