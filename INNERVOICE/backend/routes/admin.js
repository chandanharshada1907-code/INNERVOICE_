// =====================================================
// INNERVOICE — Admin Dashboard Routes
//
// All routes require:
//   1. verifyToken  — valid JWT
//   2. requireAdmin — role === 'admin'
//
// Endpoints:
//   GET  /api/admin/stats        — platform-wide aggregate stats
//   GET  /api/admin/users        — paginated user list (safe fields only)
//   GET  /api/admin/users/:id    — single user detail + activity counts
//   DELETE /api/admin/users/:id  — delete user (cascade, guarded)
// =====================================================

const express      = require('express');
const router       = express.Router();
const db           = require('../db');
const verifyToken  = require('../middleware/auth');
const requireAdmin = require('../middleware/adminAuth');

// Promise-wrapped pool (db.js exports a callback pool)
const pool = db.promise();

// Apply both middleware to every admin route
router.use(verifyToken, requireAdmin);

// ─────────────────────────────────────────────────────────────
// HELPER: safe query wrapper
// ─────────────────────────────────────────────────────────────
async function safeCount(query, params = []) {
    try {
        const [rows] = await pool.execute(query, params);
        return rows[0] ? (rows[0].count || rows[0].total || 0) : 0;
    } catch {
        return 0;
    }
}

// ─────────────────────────────────────────────────────────────
// GET /api/admin/stats
// Platform-wide aggregate statistics from real MySQL data.
// ─────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const [
            totalUsers,
            adminUsers,
            totalMoods,
            totalJournals,
            totalReflections,
            totalGoals,
            completedGoals,
            totalSleep,
            totalAssessments,
            totalHabits,
            totalAchievements,
            totalChatMessages,
            totalNotifications,
            totalFocusSessions,
            newUsersThisMonth,
            newUsersThisWeek,
        ] = await Promise.all([
            safeCount('SELECT COUNT(*) AS count FROM users'),
            safeCount("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'"),
            safeCount('SELECT COUNT(*) AS count FROM moods'),
            safeCount('SELECT COUNT(*) AS count FROM journals'),
            safeCount('SELECT COUNT(*) AS count FROM reflections'),
            safeCount('SELECT COUNT(*) AS count FROM goals'),
            safeCount('SELECT COUNT(*) AS count FROM goals WHERE completed = TRUE'),
            safeCount('SELECT COUNT(*) AS count FROM sleep_records'),
            safeCount('SELECT COUNT(*) AS count FROM mental_wellness_assessments'),
            safeCount('SELECT COUNT(*) AS count FROM habits'),
            safeCount('SELECT COUNT(*) AS count FROM user_achievements'),
            safeCount('SELECT COUNT(*) AS count FROM chat_messages'),
            safeCount('SELECT COUNT(*) AS count FROM notifications'),
            safeCount('SELECT COUNT(*) AS count FROM focus_sessions'),
            safeCount('SELECT COUNT(*) AS count FROM users WHERE created_at >= DATE_FORMAT(NOW(),"%Y-%m-01")'),
            safeCount('SELECT COUNT(*) AS count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'),
        ]);

        // User registration trend (last 7 days)
        let registrationTrend = [];
        try {
            const [trend] = await pool.execute(`
                SELECT DATE(created_at) AS day, COUNT(*) AS count
                FROM users
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at)
                ORDER BY day ASC
            `);
            registrationTrend = trend;
        } catch { /* leave empty */ }

        // Mood activity trend (last 7 days)
        let moodTrend = [];
        try {
            const [trend] = await pool.execute(`
                SELECT mood_date AS day, COUNT(*) AS count
                FROM moods
                WHERE mood_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY mood_date
                ORDER BY mood_date ASC
            `);
            moodTrend = trend;
        } catch { /* leave empty */ }

        // Feature usage counts
        let featureUsage = {};
        try {
            const [usage] = await pool.execute(`
                SELECT activity_type, COUNT(*) AS count
                FROM wellness_activity_log
                GROUP BY activity_type
                ORDER BY count DESC
                LIMIT 10
            `);
            usage.forEach(row => { featureUsage[row.activity_type] = row.count; });
        } catch { /* leave empty */ }

        res.json({
            success: true,
            stats: {
                users: {
                    total:            totalUsers,
                    admins:           adminUsers,
                    regular:          totalUsers - adminUsers,
                    newThisMonth:     newUsersThisMonth,
                    newThisWeek:      newUsersThisWeek,
                },
                activity: {
                    totalMoods,
                    totalJournals,
                    totalReflections,
                    totalGoals,
                    completedGoals,
                    totalSleep,
                    totalAssessments,
                    totalHabits,
                    totalAchievements,
                    totalChatMessages,
                    totalNotifications,
                    totalFocusSessions,
                },
                trends: {
                    registrationTrend,
                    moodTrend,
                },
                featureUsage,
            }
        });
    } catch (err) {
        console.error('[Admin] Stats error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
    }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users
// Paginated user list. Safe fields only — NO passwords or secrets.
// Query params: ?page=1&limit=20&search=<term>
// ─────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
    try {
        const pageNum   = Math.max(1, parseInt(req.query.page, 10)  || 1);
        const limitNum  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const offsetNum = (pageNum - 1) * limitNum;
        const search    = (req.query.search || '').trim();

        let whereClause = '';
        const params = [];

        if (search) {
            whereClause = 'WHERE (u.name LIKE ? OR u.email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        const [users] = await pool.query(
            `SELECT
                u.id, u.name, u.email, u.role,
                u.streak, u.xp, u.level,
                u.email_verified, u.phone_verified,
                u.created_at
             FROM users u
             ${whereClause}
             ORDER BY u.created_at DESC
             LIMIT ${limitNum} OFFSET ${offsetNum}`,
            params
        );

        // Get total count for pagination
        const [countRows] = await pool.query(
            `SELECT COUNT(*) AS total FROM users u ${whereClause}`,
            params
        );
        const total = countRows[0] ? countRows[0].total : 0;

        res.json({
            success: true,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
            users
        });
    } catch (err) {
        console.error('[Admin] Users list error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch users.' });
    }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users/:id
// Single user detail + activity summary. Safe fields only.
// ─────────────────────────────────────────────────────────────
router.get('/users/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (!userId || isNaN(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID.' });
        }

        // Safe user info — explicitly exclude password and OTP fields
        const [users] = await pool.execute(
            `SELECT id, name, email, role, streak, xp, level,
                    email_verified, phone_verified, created_at
             FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const user = users[0];

        // Activity summary from real data
        const [
            moodCount,
            journalCount,
            reflectionCount,
            goalCount,
            completedGoalCount,
            sleepCount,
            assessmentCount,
            habitCount,
            achievementCount,
            chatCount,
        ] = await Promise.all([
            safeCount('SELECT COUNT(*) AS count FROM moods    WHERE user_id = ?', [userId]),
            safeCount('SELECT COUNT(*) AS count FROM journals WHERE user_id = ?', [userId]),
            safeCount('SELECT COUNT(*) AS count FROM reflections WHERE user_id = ?', [userId]),
            safeCount('SELECT COUNT(*) AS count FROM goals WHERE user_id = ?', [userId]),
            safeCount('SELECT COUNT(*) AS count FROM goals WHERE user_id = ? AND completed = TRUE', [userId]),
            safeCount('SELECT COUNT(*) AS count FROM sleep_records WHERE user_id = ?', [userId]),
            safeCount('SELECT COUNT(*) AS count FROM mental_wellness_assessments WHERE user_id = ?', [userId]),
            safeCount('SELECT COUNT(*) AS count FROM habits WHERE user_id = ?', [userId]),
            safeCount('SELECT COUNT(*) AS count FROM user_achievements WHERE user_id = ?', [userId]),
            safeCount('SELECT COUNT(*) AS count FROM chat_messages WHERE user_id = ?', [userId]),
        ]);

        // Recent moods
        let recentMoods = [];
        try {
            const [rows] = await pool.execute(
                'SELECT mood, mood_date FROM moods WHERE user_id = ? ORDER BY mood_date DESC LIMIT 5',
                [userId]
            );
            recentMoods = rows;
        } catch { /* leave empty */ }

        res.json({
            success: true,
            user,
            activity: {
                moodCount, journalCount, reflectionCount,
                goalCount, completedGoalCount, sleepCount,
                assessmentCount, habitCount, achievementCount, chatCount,
            },
            recentMoods
        });
    } catch (err) {
        console.error('[Admin] User detail error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch user details.' });
    }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id
// Delete user and cascade all their data.
// Requires ?confirm=true to prevent accidents.
// Prevents admin from deleting themselves.
// ─────────────────────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
    try {
        const targetId = parseInt(req.params.id);
        const adminId  = req.user.id;

        if (!targetId || isNaN(targetId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID.' });
        }

        // Self-deletion guard
        if (targetId === adminId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own admin account.'
            });
        }

        // Require explicit confirmation
        if (req.query.confirm !== 'true') {
            return res.status(400).json({
                success: false,
                message: 'Add ?confirm=true to confirm deletion. This will permanently delete the user and all their data.'
            });
        }

        // Verify target user exists
        const [users] = await pool.execute('SELECT id, name, email FROM users WHERE id = ?', [targetId]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Delete — foreign keys use ON DELETE CASCADE, so all related data is removed
        await pool.execute('DELETE FROM users WHERE id = ?', [targetId]);

        res.json({
            success: true,
            message: `User "${users[0].name}" (${users[0].email}) has been permanently deleted.`,
            deletedUserId: targetId
        });
    } catch (err) {
        console.error('[Admin] Delete user error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete user.' });
    }
});

module.exports = router;
