const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");
const { awardXP, evaluateAchievements } = require("../services/achievementService");

const router = express.Router();


// ======================================
// POST /api/moods
// Save a mood entry (JWT protected)
// ======================================

router.post("/", verifyToken, async (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const { mood, icon } = req.body;

    if (!mood) {
        return res.status(400).json({
            success: false,
            message: "Mood is required"
        });
    }

    const sql = `
        INSERT INTO moods (user_id, mood, mood_icon, mood_date)
        VALUES (?, ?, ?, CURDATE())
    `;

    db.query(sql, [userId, mood, icon || ""], async (err, result) => {

        if (err) {
            console.error("Error saving mood:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to save mood: " + (err.sqlMessage || err.message)
            });
        }

        // Award XP for mood check-in (5 XP)
        try {
            await awardXP(userId, 5, "Mood check-in", "mood", result.insertId);
            // Evaluate achievements
            evaluateAchievements(userId, () => {});
        } catch(e) {
            console.error("XP award error in moods:", e);
        }

        res.status(201).json({
            success: true,
            message: "Mood saved!",
            mood_id: result.insertId,
            mood: mood,
            icon: icon || "",
            created_at: new Date().toISOString()
        });

    });

});


// ======================================
// GET /api/moods
// Get all moods for the logged-in user
// Returns newest first (limit 20)
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
        SELECT mood_id AS id, mood, mood_icon AS icon, mood_date, created_at
        FROM moods
        WHERE user_id = ?
        ORDER BY created_at DESC, mood_id DESC
        LIMIT 20
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("Error fetching moods:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch moods: " + (err.sqlMessage || err.message)
            });
        }

        res.status(200).json({
            success: true,
            moods: results || []
        });

    });

});


// ======================================
// GET /api/moods/today
// Get today's mood for the logged-in user
// ======================================

router.get("/today", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const sql = `
        SELECT mood_id AS id, mood, mood_icon AS icon, mood_date, created_at
        FROM moods
        WHERE user_id = ?
          AND (mood_date = CURDATE() OR DATE(created_at) = CURDATE())
        ORDER BY created_at DESC, mood_id DESC
        LIMIT 1
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("Error fetching today's mood:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch today's mood: " + (err.sqlMessage || err.message)
            });
        }

        res.status(200).json({
            success: true,
            mood: results.length > 0 ? results[0] : null
        });

    });

});


// ======================================
// MOOD SCORE MAPPING & ANALYTICS HELPER
// ======================================

const MOOD_SCORES = {
    "happy":    5, "excited":  5, "great":    5,
    "good":     4,
    "okay":     3, "neutral":  3,
    "tired":    2, "sad":      2, "anxious":  2,
    "angry":    1, "terrible": 1
};

function getScoreForMood(mood) {
    if (!mood) return 3;
    const lower = mood.toLowerCase();
    return MOOD_SCORES[lower] || 3;
}

// Day of week names
const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];


// ======================================
// GET /api/moods/analytics
// Comprehensive mood analytics, stats,
// multi-period trends, and insights.
// JWT protected.
// ======================================

router.get("/analytics", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const sql = `
        SELECT mood_id AS id, mood, mood_icon AS icon, mood_date, created_at
        FROM moods
        WHERE user_id = ?
        ORDER BY created_at DESC, mood_id DESC
        LIMIT 300
    `;

    db.query(sql, [userId], (err, rows) => {

        if (err) {
            console.error("Error fetching mood analytics:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to load mood analytics: " + (err.sqlMessage || err.message)
            });
        }

        const totalCount = rows.length;

        if (totalCount === 0) {
            return res.status(200).json({
                success: true,
                stats: {
                    totalCount: 0,
                    averageScore: null,
                    mostCommonMood: null,
                    bestDayOfWeek: null,
                    difficultDayOfWeek: null,
                    moodDistribution: {}
                },
                trends: {
                    sevenDay: [],
                    thirtyDay: [],
                    allTime: []
                },
                insights: [
                    "Welcome to Mood Analytics! Log your mood regularly to see trends, patterns, and insights over time."
                ],
                moods: []
            });
        }

        // 1. Mood distribution & scores
        const distribution = {};
        const iconMap = {};
        let totalScore = 0;
        const dayScores = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

        rows.forEach(entry => {
            const m = entry.mood || "Okay";
            distribution[m] = (distribution[m] || 0) + 1;
            if (entry.icon) iconMap[m] = entry.icon;

            const score = getScoreForMood(m);
            totalScore += score;

            const d = new Date(entry.created_at);
            if (!isNaN(d.getDay())) {
                dayScores[d.getDay()].push(score);
            }
        });

        // Most common mood
        let mostCommonMood = null;
        let maxCount = 0;
        for (const [mood, count] of Object.entries(distribution)) {
            if (count > maxCount) {
                maxCount = count;
                mostCommonMood = { mood, count, icon: iconMap[mood] || "😊" };
            }
        }

        // Average score
        const averageScore = Math.round((totalScore / totalCount) * 10) / 10;

        // Best and difficult days of week
        let bestDay = null;
        let bestDayAvg = -1;
        let difficultDay = null;
        let difficultDayAvg = 999;

        for (let i = 0; i < 7; i++) {
            const scores = dayScores[i];
            if (scores.length >= 1) {
                const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                if (avg > bestDayAvg) {
                    bestDayAvg = avg;
                    bestDay = { day: DAYS_OF_WEEK[i], avgScore: Math.round(avg * 10) / 10, count: scores.length };
                }
                if (avg < difficultDayAvg) {
                    difficultDayAvg = avg;
                    difficultDay = { day: DAYS_OF_WEEK[i], avgScore: Math.round(avg * 10) / 10, count: scores.length };
                }
            }
        }

        // 2. Multi-period trends (oldest -> newest for charting)
        const chronological = [...rows].reverse();

        // 7-day trend
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 86400000;
        const thirtyDaysAgo = now - 30 * 86400000;

        const sevenDay = chronological.filter(m => new Date(m.created_at).getTime() >= sevenDaysAgo);
        const thirtyDay = chronological.filter(m => new Date(m.created_at).getTime() >= thirtyDaysAgo);
        const allTime = chronological.slice(-60); // most recent 60 points chronological

        // 3. Supportive, non-clinical insights
        const insights = [];

        if (totalCount >= 7) {
            insights.push(`You have tracked your mood ${totalCount} times — establishing a meaningful self-awareness habit! 🌱`);
        } else {
            insights.push(`You've recorded ${totalCount} mood ${totalCount === 1 ? "entry" : "entries"}. Keep checking in daily to discover patterns.`);
        }

        if (averageScore >= 4.0) {
            insights.push(`Your overall mood trend is predominantly positive (${averageScore} / 5.0). Notice the activities that uplift you! ✨`);
        } else if (averageScore >= 3.0) {
            insights.push(`Your emotions have maintained a balanced rhythm (${averageScore} / 5.0), experiencing natural everyday variations.`);
        } else if (averageScore > 0) {
            insights.push(`You've navigated some emotionally heavier moments recently (${averageScore} / 5.0). Remember to treat yourself with patience and kindness. 💙`);
        }

        if (bestDay && bestDay.count >= 2) {
            insights.push(`${bestDay.day}s tend to be your brightest days on average (avg score: ${bestDay.avgScore}/5).`);
        }

        if (difficultDay && difficultDay.count >= 2 && difficultDay.day !== (bestDay ? bestDay.day : "")) {
            insights.push(`${difficultDay.day}s show lower energy levels — consider scheduling gentle self-care or breathing exercises on these days.`);
        }

        if (mostCommonMood) {
            const pct = Math.round((mostCommonMood.count / totalCount) * 100);
            insights.push(`Your most frequent emotional state is "${mostCommonMood.mood}" ${mostCommonMood.icon}, representing ${pct}% of your logged check-ins.`);
        }

        res.status(200).json({
            success: true,
            stats: {
                totalCount,
                averageScore,
                mostCommonMood,
                bestDayOfWeek: bestDay,
                difficultDayOfWeek: difficultDay,
                moodDistribution: distribution
            },
            trends: {
                sevenDay,
                thirtyDay,
                allTime
            },
            insights,
            moods: rows
        });

    });

});


// ======================================
// GET /api/moods/day-details
// Returns all activities (mood, journals,
// reflections, goals) on a specific date.
// Query: ?date=YYYY-MM-DD
// JWT protected.
// ======================================

router.get("/day-details", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
            success: false,
            message: "Valid date query parameter (YYYY-MM-DD) is required"
        });
    }

    const results = {
        date,
        moods: [],
        journals: [],
        reflections: [],
        goals: []
    };

    let done = 0;
    let errors = 0;
    const TOTAL = 4;

    function checkFinish() {
        done++;
        if (done < TOTAL) return;

        if (errors > 0) {
            return res.status(500).json({
                success: false,
                message: "Failed to load some day details"
            });
        }

        res.status(200).json({
            success: true,
            ...results
        });
    }

    // 1. Moods on that date
    db.query(
        `SELECT mood_id AS id, mood, mood_icon AS icon, mood_date, created_at
         FROM moods
         WHERE user_id = ? AND (mood_date = ? OR DATE(created_at) = ?)
         ORDER BY created_at DESC`,
        [userId, date, date],
        (err, rows) => {
            if (err) { console.error("Day mood query error:", err); errors++; }
            else results.moods = rows || [];
            checkFinish();
        }
    );

    // 2. Journals on that date
    db.query(
        `SELECT journal_id AS id, title, content AS text, journal_date, created_at
         FROM journals
         WHERE user_id = ? AND (journal_date = ? OR DATE(created_at) = ?)
         ORDER BY created_at DESC`,
        [userId, date, date],
        (err, rows) => {
            if (err) { console.error("Day journal query error:", err); errors++; }
            else results.journals = rows || [];
            checkFinish();
        }
    );

    // 3. Reflections on that date
    db.query(
        `SELECT reflection_id AS id, question, answer, reflection_date, created_at
         FROM reflections
         WHERE user_id = ? AND (reflection_date = ? OR DATE(created_at) = ?)
         ORDER BY created_at DESC`,
        [userId, date, date],
        (err, rows) => {
            if (err) { console.error("Day reflection query error:", err); errors++; }
            else results.reflections = rows || [];
            checkFinish();
        }
    );

    // 4. Goals on that date
    db.query(
        `SELECT goal_id AS id, title AS challenge, completed, target_date, created_at
         FROM goals
         WHERE user_id = ? AND (target_date = ? OR DATE(created_at) = ?)`,
        [userId, date, date],
        (err, rows) => {
            if (err) { console.error("Day goals query error:", err); errors++; }
            else results.goals = rows || [];
            checkFinish();
        }
    );

});


// ======================================
// GET /api/moods/calendar
// Monthly mood calendar view
// Query: ?month=YYYY-MM
// JWT protected.
// ======================================

router.get("/calendar", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({
            success: false,
            message: "Valid month query parameter (YYYY-MM) is required"
        });
    }

    const results = {
        month: parseInt(month.split('-')[1], 10),
        year: parseInt(month.split('-')[0], 10),
        days: [],
        stats: {
            totalCount: 0,
            mostCommonMood: null,
            positiveDays: 0,
            neutralDays: 0,
            negativeDays: 0,
            averageScore: 0
        },
        streak: {
            current: 0,
            longest: 0
        }
    };

    let done = 0;
    let errors = 0;
    const TOTAL = 4;
    
    // We'll gather all arrays here
    let monthMoods = [];
    let monthJournals = [];
    let monthReflections = [];
    let monthGoals = [];

    function checkFinish() {
        done++;
        if (done < TOTAL) return;

        if (errors > 0) {
            return res.status(500).json({
                success: false,
                message: "Failed to load calendar data"
            });
        }
        
        // Aggregate data
        const daysMap = {};
        let distribution = {};
        let totalScore = 0;
        let daysWithMood = 0;
        
        // 1. Process Moods
        monthMoods.forEach(m => {
            const dateKey = m.actual_date;
            if (!daysMap[dateKey]) {
                const score = getScoreForMood(m.mood);
                daysMap[dateKey] = {
                    date: dateKey,
                    mood: m.mood,
                    icon: m.mood_icon || "😊",
                    score: score,
                    entryCount: 1,
                    hasJournal: false,
                    hasReflection: false,
                    hasGoal: false
                };
            } else {
                // Since we ordered by created_at ASC, latest overwrites
                const score = getScoreForMood(m.mood);
                daysMap[dateKey].mood = m.mood;
                daysMap[dateKey].icon = m.mood_icon || "😊";
                daysMap[dateKey].score = score;
                daysMap[dateKey].entryCount += 1;
            }
        });
        
        // 2. Add indicators
        monthJournals.forEach(j => {
            if (daysMap[j.actual_date]) daysMap[j.actual_date].hasJournal = true;
        });
        monthReflections.forEach(r => {
            if (daysMap[r.actual_date]) daysMap[r.actual_date].hasReflection = true;
        });
        monthGoals.forEach(g => {
            if (daysMap[g.actual_date]) daysMap[g.actual_date].hasGoal = true;
        });

        // 3. Compute stats
        const daysArray = Object.values(daysMap);
        daysArray.forEach(day => {
            results.stats.totalCount += day.entryCount;
            totalScore += day.score;
            daysWithMood++;
            
            const m = day.mood.toLowerCase();
            distribution[m] = (distribution[m] || 0) + 1;
            
            if (day.score >= 4) results.stats.positiveDays++;
            else if (day.score === 3) results.stats.neutralDays++;
            else results.stats.negativeDays++;
        });
        
        if (daysWithMood > 0) {
            results.stats.averageScore = Math.round((totalScore / daysWithMood) * 10) / 10;
        }
        
        let maxCount = 0;
        let mostCommon = null;
        for (const [m, count] of Object.entries(distribution)) {
            if (count > maxCount) {
                maxCount = count;
                mostCommon = m;
            }
        }
        if (mostCommon) {
            // Find icon for most common
            const sample = daysArray.find(d => d.mood.toLowerCase() === mostCommon);
            results.stats.mostCommonMood = { mood: mostCommon, count: maxCount, icon: sample ? sample.icon : "😊" };
        }
        
        // 4. Calculate Streaks based on date keys
        const sortedDates = Object.keys(daysMap).sort();
        let currentStreak = 0;
        let longestStreak = 0;
        
        if (sortedDates.length > 0) {
            let tempStreak = 1;
            for (let i = 1; i < sortedDates.length; i++) {
                const prevD = new Date(sortedDates[i-1]);
                const currD = new Date(sortedDates[i]);
                const diffTime = Math.abs(currD - prevD);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                if (diffDays === 1) {
                    tempStreak++;
                } else {
                    if (tempStreak > longestStreak) longestStreak = tempStreak;
                    tempStreak = 1;
                }
            }
            if (tempStreak > longestStreak) longestStreak = tempStreak;
            
            // Check if current streak extends to today or yesterday
            const today = new Date();
            const y = today.getFullYear();
            const mStr = String(today.getMonth() + 1).padStart(2, "0");
            const dStr = String(today.getDate()).padStart(2, "0");
            const todayKey = `${y}-${mStr}-${dStr}`;
            
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yY = yesterday.getFullYear();
            const ymStr = String(yesterday.getMonth() + 1).padStart(2, "0");
            const ydStr = String(yesterday.getDate()).padStart(2, "0");
            const yesterdayKey = `${yY}-${ymStr}-${ydStr}`;
            
            const lastDate = sortedDates[sortedDates.length - 1];
            if (lastDate === todayKey || lastDate === yesterdayKey) {
                currentStreak = tempStreak;
            } else {
                currentStreak = 0;
            }
        }
        results.streak.current = currentStreak;
        results.streak.longest = longestStreak;
        
        results.days = daysArray;

        res.status(200).json({
            success: true,
            ...results
        });
    }

    // 1. Moods
    db.query(
        `SELECT mood, mood_icon, DATE_FORMAT(IFNULL(mood_date, DATE(created_at)), '%Y-%m-%d') as actual_date
         FROM moods
         WHERE user_id = ? AND DATE_FORMAT(IFNULL(mood_date, DATE(created_at)), '%Y-%m') = ?
         ORDER BY created_at ASC, mood_id ASC`,
        [userId, month],
        (err, rows) => {
            if (err) { console.error("Calendar mood query error:", err); errors++; }
            else monthMoods = rows || [];
            checkFinish();
        }
    );

    // 2. Journals
    db.query(
        `SELECT DATE_FORMAT(IFNULL(journal_date, DATE(created_at)), '%Y-%m-%d') as actual_date
         FROM journals
         WHERE user_id = ? AND DATE_FORMAT(IFNULL(journal_date, DATE(created_at)), '%Y-%m') = ?`,
        [userId, month],
        (err, rows) => {
            if (err) { console.error("Calendar journal query error:", err); errors++; }
            else monthJournals = rows || [];
            checkFinish();
        }
    );

    // 3. Reflections
    db.query(
        `SELECT DATE_FORMAT(IFNULL(reflection_date, DATE(created_at)), '%Y-%m-%d') as actual_date
         FROM reflections
         WHERE user_id = ? AND DATE_FORMAT(IFNULL(reflection_date, DATE(created_at)), '%Y-%m') = ?`,
        [userId, month],
        (err, rows) => {
            if (err) { console.error("Calendar reflection query error:", err); errors++; }
            else monthReflections = rows || [];
            checkFinish();
        }
    );

    // 4. Goals
    db.query(
        `SELECT DATE_FORMAT(IFNULL(target_date, DATE(created_at)), '%Y-%m-%d') as actual_date
         FROM goals
         WHERE user_id = ? AND completed = 1 AND DATE_FORMAT(IFNULL(target_date, DATE(created_at)), '%Y-%m') = ?`,
        [userId, month],
        (err, rows) => {
            if (err) { console.error("Calendar goals query error:", err); errors++; }
            else monthGoals = rows || [];
            checkFinish();
        }
    );

});

module.exports = router;
