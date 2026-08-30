const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

// GET /api/wellness-journey
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        let { from, to } = req.query;

        // Default to 30 days if not provided
        if (!from || !to) {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 30);
            
            from = startDate.toISOString().split('T')[0];
            // to end of day
            to = endDate.toISOString().split('T')[0] + ' 23:59:59';
        } else {
            // Append end of day time to 'to' date if it doesn't have time
            if (to && to.length === 10) to += ' 23:59:59';
        }

        // 1. Fetch milestone data (firsts)
        const getMilestones = () => new Promise((resolve, reject) => {
            db.query(`
                SELECT 
                    (SELECT MIN(created_at) FROM journals WHERE user_id = ?) AS first_journal,
                    (SELECT MIN(created_at) FROM reflections WHERE user_id = ?) AS first_reflection,
                    (SELECT MIN(completed_at) FROM habit_completions hc WHERE hc.user_id = ? AND hc.completed = TRUE) AS first_habit,
                    (SELECT MIN(target_date) FROM goals WHERE user_id = ? AND completed = TRUE) AS first_goal
            `, [userId, userId, userId, userId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        const milestones = await getMilestones();
        const firsts = milestones[0] || {};

        // 2. Fetch all aggregated events within the date range using UNION ALL
        // All string literal expressions use COLLATE utf8mb4_unicode_ci to prevent
        // "Illegal mix of collations for operation 'UNION'" (ER_CANT_AGGREGATE_NCOLLATIONS).
        const query = `
            SELECT 
                CONCAT('mood-', mood_id) COLLATE utf8mb4_unicode_ci AS id,
                'mood' COLLATE utf8mb4_unicode_ci AS type,
                'Mood Check-in' COLLATE utf8mb4_unicode_ci AS title,
                CONVERT(mood USING utf8mb4) COLLATE utf8mb4_unicode_ci AS description,
                created_at AS date,
                CONVERT(COALESCE(mood_icon, '😊') USING utf8mb4) COLLATE utf8mb4_unicode_ci AS icon,
                'normal' COLLATE utf8mb4_unicode_ci AS importance
            FROM moods 
            WHERE user_id = ? AND created_at >= ? AND created_at <= ?

            UNION ALL

            SELECT 
                CONCAT('journal-', journal_id) COLLATE utf8mb4_unicode_ci AS id,
                'journal' COLLATE utf8mb4_unicode_ci AS type,
                CONVERT(COALESCE(NULLIF(title, ''), 'Journal Entry') USING utf8mb4) COLLATE utf8mb4_unicode_ci AS title,
                CONVERT(LEFT(content, 100) USING utf8mb4) COLLATE utf8mb4_unicode_ci AS description,
                created_at AS date,
                '📝' COLLATE utf8mb4_unicode_ci AS icon,
                'normal' COLLATE utf8mb4_unicode_ci AS importance
            FROM journals 
            WHERE user_id = ? AND created_at >= ? AND created_at <= ?

            UNION ALL

            SELECT 
                CONCAT('reflection-', reflection_id) COLLATE utf8mb4_unicode_ci AS id,
                'reflection' COLLATE utf8mb4_unicode_ci AS type,
                'Reflection Completed' COLLATE utf8mb4_unicode_ci AS title,
                CONVERT(LEFT(COALESCE(question, answer), 100) USING utf8mb4) COLLATE utf8mb4_unicode_ci AS description,
                created_at AS date,
                '💭' COLLATE utf8mb4_unicode_ci AS icon,
                'normal' COLLATE utf8mb4_unicode_ci AS importance
            FROM reflections 
            WHERE user_id = ? AND created_at >= ? AND created_at <= ?

            UNION ALL

            SELECT 
                CONCAT('goal-', goal_id) COLLATE utf8mb4_unicode_ci AS id,
                'goal' COLLATE utf8mb4_unicode_ci AS type,
                'Goal Completed' COLLATE utf8mb4_unicode_ci AS title,
                CONVERT(title USING utf8mb4) COLLATE utf8mb4_unicode_ci AS description,
                COALESCE(target_date, created_at) AS date,
                '🎯' COLLATE utf8mb4_unicode_ci AS icon,
                'high' COLLATE utf8mb4_unicode_ci AS importance
            FROM goals 
            WHERE user_id = ? AND completed = TRUE AND COALESCE(target_date, created_at) >= ? AND COALESCE(target_date, created_at) <= ?

            UNION ALL

            SELECT 
                CONCAT('habit-', hc.id) COLLATE utf8mb4_unicode_ci AS id,
                'habit' COLLATE utf8mb4_unicode_ci AS type,
                'Habit Completed' COLLATE utf8mb4_unicode_ci AS title,
                CONVERT(h.name USING utf8mb4) COLLATE utf8mb4_unicode_ci AS description,
                IFNULL(hc.completed_at, hc.completion_date) AS date,
                '🔥' COLLATE utf8mb4_unicode_ci AS icon,
                'normal' COLLATE utf8mb4_unicode_ci AS importance
            FROM habit_completions hc
            JOIN habits h ON hc.habit_id = h.id
            WHERE hc.user_id = ? AND hc.completed = TRUE AND IFNULL(hc.completed_at, hc.completion_date) >= ? AND IFNULL(hc.completed_at, hc.completion_date) <= ?

            UNION ALL

            SELECT 
                CONCAT('achievement-', ua.id) COLLATE utf8mb4_unicode_ci AS id,
                'achievement' COLLATE utf8mb4_unicode_ci AS type,
                'Achievement Unlocked' COLLATE utf8mb4_unicode_ci AS title,
                CONVERT(a.name USING utf8mb4) COLLATE utf8mb4_unicode_ci AS description,
                ua.unlocked_at AS date,
                CONVERT(a.icon USING utf8mb4) COLLATE utf8mb4_unicode_ci AS icon,
                'high' COLLATE utf8mb4_unicode_ci AS importance
            FROM user_achievements ua
            JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = ? AND ua.unlocked_at >= ? AND ua.unlocked_at <= ?

            UNION ALL

            SELECT 
                CONCAT('focus-', id) COLLATE utf8mb4_unicode_ci AS id,
                'focus' COLLATE utf8mb4_unicode_ci AS type,
                'Focus Session' COLLATE utf8mb4_unicode_ci AS title,
                CONVERT(CONCAT(task_name, ' (', duration, ' mins)') USING utf8mb4) COLLATE utf8mb4_unicode_ci AS description,
                completed_at AS date,
                '🧘' COLLATE utf8mb4_unicode_ci AS icon,
                'normal' COLLATE utf8mb4_unicode_ci AS importance
            FROM focus_sessions 
            WHERE user_id = ? AND completed = TRUE AND completed_at >= ? AND completed_at <= ?

            UNION ALL

            SELECT 
                CONCAT('daily_plan-', id) COLLATE utf8mb4_unicode_ci AS id,
                'daily_plan' COLLATE utf8mb4_unicode_ci AS type,
                'Daily Plan Completed' COLLATE utf8mb4_unicode_ci AS title,
                CONVERT(title USING utf8mb4) COLLATE utf8mb4_unicode_ci AS description,
                completed_at AS date,
                '🌱' COLLATE utf8mb4_unicode_ci AS icon,
                'normal' COLLATE utf8mb4_unicode_ci AS importance
            FROM daily_plan_items 
            WHERE user_id = ? AND completed = TRUE AND completed_at >= ? AND completed_at <= ?

            ORDER BY date DESC
        `;

        const params = [
            userId, from, to, // moods
            userId, from, to, // journals
            userId, from, to, // reflections
            userId, from, to, // goals
            userId, from, to, // habits
            userId, from, to, // achievements
            userId, from, to, // focus
            userId, from, to  // daily_plan
        ];

        const getEvents = () => new Promise((resolve, reject) => {
            db.query(query, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        const events = await getEvents();

        // 3. Process Smart Milestones
        const processedEvents = events.map(event => {
            const eventTime = new Date(event.date).getTime();
            
            // Check milestones
            if (event.type === 'journal' && firsts.first_journal && new Date(firsts.first_journal).getTime() === eventTime) {
                event.title = "First Journal Entry!";
                event.importance = 'high';
            } else if (event.type === 'reflection' && firsts.first_reflection && new Date(firsts.first_reflection).getTime() === eventTime) {
                event.title = "First Reflection!";
                event.importance = 'high';
            } else if (event.type === 'habit' && firsts.first_habit && new Date(firsts.first_habit).getTime() === eventTime) {
                event.title = "First Habit Completed!";
                event.importance = 'high';
            } else if (event.type === 'goal' && firsts.first_goal && new Date(firsts.first_goal).getTime() === eventTime) {
                event.title = "First Goal Completed!";
                event.importance = 'high';
            }

            return event;
        });

        res.json({
            success: true,
            events: processedEvents
        });

    } catch (error) {
        console.error("Error fetching wellness journey:", error);
        res.status(500).json({ success: false, message: "Failed to fetch wellness journey." });
    }
});

module.exports = router;
