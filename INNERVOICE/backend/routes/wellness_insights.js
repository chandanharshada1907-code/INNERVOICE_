const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

/**
 * Helper to fetch general insights dynamically
 */
async function generateInsights(userId) {
    const insights = [];

    // 1. Habit Pattern: Consistency
    const [habitLogs] = await db.promise().query(
        `SELECT COUNT(*) as daysWithHabits FROM (
            SELECT DISTINCT DATE(completion_date) 
            FROM habit_completions 
            WHERE user_id = ? AND completion_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ) as recent_days`, [userId]
    );
    const daysWithHabits = habitLogs[0].daysWithHabits || 0;
    
    if (daysWithHabits >= 5) {
        insights.push({
            category: 'HABIT PATTERN',
            title: 'Your consistency is improving',
            description: `You completed wellness habits on ${daysWithHabits} of the last 7 days.`,
            importance: 'MEDIUM',
            recommendation: 'Continue your current routine for another week.'
        });
    } else if (daysWithHabits > 0) {
        insights.push({
            category: 'HABIT PATTERN',
            title: 'Building consistency',
            description: `You completed habits on ${daysWithHabits} of the last 7 days.`,
            importance: 'LOW',
            recommendation: 'Try to complete at least one habit daily to build momentum.'
        });
    } else {
        insights.push({
            category: 'HABIT PATTERN',
            title: 'Time to start fresh',
            description: 'You haven\'t logged any habits in the past week.',
            importance: 'HIGH',
            recommendation: 'Start with just one simple habit today.'
        });
    }

    // 2. Mood Pattern: Weekend vs Weekday
    const [moodStats] = await db.promise().query(
        `SELECT 
            DAYOFWEEK(created_at) as dow, 
            AVG(CASE 
                WHEN mood = 'Great' THEN 5
                WHEN mood = 'Good' THEN 4
                WHEN mood = 'Okay' THEN 3
                WHEN mood = 'Sad' THEN 2
                WHEN mood = 'Angry' THEN 1
                ELSE 3 END) as avg_mood
         FROM moods 
         WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         GROUP BY dow`, [userId]
    );

    let weekendAvg = 0; let weekendCount = 0;
    let weekdayAvg = 0; let weekdayCount = 0;
    
    moodStats.forEach(stat => {
        if (stat.dow === 1 || stat.dow === 7) {
            weekendAvg += parseFloat(stat.avg_mood);
            weekendCount++;
        } else {
            weekdayAvg += parseFloat(stat.avg_mood);
            weekdayCount++;
        }
    });
    
    if (weekendCount > 0 && weekdayCount > 0) {
        weekendAvg = weekendAvg / weekendCount;
        weekdayAvg = weekdayAvg / weekdayCount;
        
        if (weekendAvg > weekdayAvg + 0.5) {
            insights.push({
                category: 'MOOD PATTERN',
                title: 'Weekend Relaxation',
                description: 'Your mood tends to be significantly higher on weekends.',
                importance: 'MEDIUM',
                recommendation: 'Try to bring a bit of your weekend relaxation routine into your weekdays.'
            });
        } else if (weekdayAvg > weekendAvg + 0.5) {
            insights.push({
                category: 'MOOD PATTERN',
                title: 'Weekday Structure',
                description: 'You seem to feel better during the structured weekdays.',
                importance: 'MEDIUM',
                recommendation: 'Consider adding some light structure or routines to your weekends.'
            });
        }
    }

    // 3. Journal Pattern
    const [journalStats] = await db.promise().query(
        `SELECT COUNT(*) as count FROM journals WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`, [userId]
    );
    if (journalStats[0].count >= 3) {
        insights.push({
            category: 'JOURNAL PATTERN',
            title: 'Active Reflection',
            description: 'You\'ve been journaling frequently this week.',
            importance: 'LOW',
            recommendation: 'Your active reflection is great for emotional clarity.'
        });
    }

    return insights;
}

// GET /api/wellness-insights
router.get('/', authenticateToken, async (req, res) => {
    try {
        const insights = await generateInsights(req.user.id || req.user.user_id);
        res.json({ insights });
    } catch (error) {
        console.error('Error fetching wellness insights:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/wellness-insights/trends
router.get('/trends', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.user_id;
        const trends = [];
        
        // Example Trend: Wellness Score over the last 2 weeks
        const [scores] = await db.promise().query(
            `SELECT score, score_date 
             FROM wellness_scores 
             WHERE user_id = ? AND score_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
             ORDER BY score_date ASC`, [userId]
        );
        
        if (scores.length >= 2) {
            const firstScore = scores[0].score;
            const lastScore = scores[scores.length - 1].score;
            if (lastScore > firstScore) {
                trends.push({
                    category: 'WELLNESS TREND',
                    title: 'Upward Trajectory',
                    description: `Your wellness score has increased from ${firstScore} to ${lastScore} over the last 2 weeks.`,
                    importance: 'HIGH',
                    recommendation: 'Whatever you are doing is working. Keep it up!'
                });
            } else if (lastScore < firstScore) {
                trends.push({
                    category: 'WELLNESS TREND',
                    title: 'Slight Dip in Wellness',
                    description: `Your wellness score has dropped from ${firstScore} to ${lastScore}.`,
                    importance: 'HIGH',
                    recommendation: 'Take it easy and prioritize self-care over the next few days.'
                });
            }
        }
        
        res.json({ trends });
    } catch (error) {
        console.error('Error fetching trends:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/wellness-insights/patterns
router.get('/patterns', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.user_id;
        const patterns = [];
        
        // Example Pattern: Does mood correlate with journaling?
        const [moodDays] = await db.promise().query(
            `SELECT DATE(created_at) as date, mood 
             FROM moods 
             WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`, [userId]
        );
        
        const [journalDays] = await db.promise().query(
            `SELECT DISTINCT DATE(created_at) as date 
             FROM journals 
             WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`, [userId]
        );
        
        const journalSet = new Set(journalDays.map(j => j.date));
        
        let goodMoodWithJournal = 0;
        let totalJournalDays = 0;
        
        moodDays.forEach(m => {
            if (journalSet.has(m.date)) {
                totalJournalDays++;
                if (m.mood === 'Great' || m.mood === 'Good') {
                    goodMoodWithJournal++;
                }
            }
        });
        
        if (totalJournalDays >= 3 && (goodMoodWithJournal / totalJournalDays) >= 0.6) {
            patterns.push({
                category: 'CONSISTENCY PATTERN',
                title: 'Journaling boosts mood',
                description: 'On days you journal, your mood tends to be positive.',
                importance: 'MEDIUM',
                recommendation: 'Make journaling a daily habit for better emotional balance.'
            });
        }
        
        res.json({ patterns });
    } catch (error) {
        console.error('Error fetching patterns:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
