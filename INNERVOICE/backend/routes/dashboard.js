const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");

const router = express.Router();


// ======================================
// MOOD SCORE MAPPING
// Converts a mood label to a numeric
// value for trend charting.
// ======================================

const MOOD_SCORES = {
    "Happy":    5,
    "Excited":  5,
    "Great":    5,
    "Good":     4,
    "Okay":     3,
    "Neutral":  3,
    "Tired":    2,
    "Sad":      2,
    "Anxious":  2,
    "Angry":    1,
    "Terrible": 1
};

function moodToScore(moodLabel) {
    if (!moodLabel) return 3;
    const key = Object.keys(MOOD_SCORES).find(
        k => k.toLowerCase() === moodLabel.toLowerCase()
    );
    return key ? MOOD_SCORES[key] : 3;
}


// ======================================
// RULE-BASED WEEKLY SUMMARY GENERATOR
// Analyses the user's recent data and
// produces a supportive, non-clinical
// wellness summary.
// ======================================

function generateWeeklySummary(moodHistory, journalCount, reflectionCount, goalsCompleted, streak) {

    const recentMoods = (moodHistory || []).slice(0, 7);
    const moodScores  = recentMoods.map(m => moodToScore(m.mood));

    const avgScore = moodScores.length > 0
        ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
        : null;

    // Determine overall trend
    let overallTrend = "You haven't tracked your mood this week yet.";
    let trendEmoji   = "🌱";

    if (avgScore !== null) {
        if (avgScore >= 4.0) {
            overallTrend = "Your emotional trend this week has been mostly positive and uplifting! 😊";
            trendEmoji   = "😊";
        } else if (avgScore >= 3.0) {
            overallTrend = "Your emotions have been balanced this week — some highs and some lows. 🌤️";
            trendEmoji   = "🌤️";
        } else {
            overallTrend = "It looks like this week has been emotionally challenging for you. 💙";
            trendEmoji   = "💙";
        }
    }

    // Positive progress points
    const positives = [];
    if (streak >= 3)            positives.push(`You've maintained a 🔥 ${streak}-day streak — that's real dedication!`);
    if (journalCount >= 1)      positives.push(`You've been writing in your journal (${journalCount} ${journalCount === 1 ? "entry" : "entries"}) — great for self-awareness!`);
    if (reflectionCount >= 1)   positives.push(`You completed ${reflectionCount} self-reflection ${reflectionCount === 1 ? "entry" : "entries"} — keep it up!`);
    if (goalsCompleted >= 1)    positives.push(`You've completed ${goalsCompleted} daily ${goalsCompleted === 1 ? "challenge" : "challenges"} — wonderful progress!`);
    if (recentMoods.length >= 3) positives.push(`You tracked your mood ${recentMoods.length} times — consistency is key!`);

    // Areas needing attention
    const attention = [];
    if (!moodHistory || moodHistory.length === 0) attention.push("Try logging your mood daily to spot emotional patterns.");
    if (journalCount === 0)                        attention.push("Consider writing even a short journal entry — it helps clarify your thoughts.");
    if (reflectionCount === 0)                     attention.push("Self-reflection questions can help you connect with your inner voice.");
    if (streak === 0)                              attention.push("Starting or restarting your streak today can build healthy momentum.");

    // Encouragement
    const encouragements = [
        "Remember: every small step toward self-awareness is meaningful. 🌿",
        "You're doing something most people never do — taking time for yourself. 💚",
        "Growth happens gradually. Be patient and kind with yourself. 🌱",
        "Your emotional wellbeing matters. Keep showing up for yourself! ✨"
    ];

    // Pick encouragement based on data
    let encouragement;
    if (avgScore !== null && avgScore < 3) {
        encouragement = "Difficult weeks pass. Your resilience brought you here — that already shows strength. 💙";
    } else if (streak >= 5) {
        encouragement = "Your consistency is inspiring! Keep up this wonderful self-care habit. 🔥🌿";
    } else {
        encouragement = encouragements[Math.floor(Date.now() / 86400000) % encouragements.length];
    }

    return {
        overallTrend,
        trendEmoji,
        positives:   positives.length   > 0 ? positives   : ["You're here — and that's a great start!"],
        attention:   attention.length   > 0 ? attention   : [],
        encouragement,
        dataPoints: {
            moodsTracked:      recentMoods.length,
            averageMoodScore:  avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
            journalCount,
            reflectionCount,
            goalsCompleted,
            streak
        }
    };
}


// ======================================
// GET /api/dashboard/summary
// Returns authenticated user's full
// dashboard data in one request.
// JWT protected — only the logged-in
// user's own data is returned.
//
// Response shape:
// {
//   success: true,
//   latestMood: { mood, icon, created_at } | null,
//   moodHistory: [ ... ],          // recent 14 entries, newest first
//   journalCount: number,
//   reflectionCount: number,
//   goalsCompleted: number,
//   streak: number,
//   recentActivity: [ ... ],       // newest 10 across all types
//   weeklySummary: { ... }
// }
// ======================================

router.get("/summary", verifyToken, (req, res) => {

    const userId = req.user.id;

    // We run 5 parallel queries and aggregate results
    let results = {};
    let errors  = 0;
    let done    = 0;
    const TOTAL = 5;

    function finish() {
        done++;
        if (done < TOTAL) return;

        if (errors > 0) {
            return res.status(500).json({
                success: false,
                message: "Failed to load some dashboard data"
            });
        }

        // ---- latest mood (first of moods array, already DESC) ----
        const latestMood = results.moods && results.moods.length > 0
            ? results.moods[0]
            : null;

        // ---- recent activity: merge all types, sort newest first ----
        const activities = [];

        (results.moods || []).slice(0, 5).forEach(m => {
            activities.push({
                type:  "mood",
                label: `Logged mood: ${m.mood} ${m.icon || ""}`.trim(),
                date:  m.created_at
            });
        });

        (results.journals || []).slice(0, 5).forEach(j => {
            const preview = j.text && j.text.length > 60
                ? j.text.substring(0, 60) + "..."
                : j.text || "";
            activities.push({
                type:  "journal",
                label: `Journal: ${preview}`,
                date:  j.created_at
            });
        });

        (results.reflections || []).slice(0, 5).forEach(r => {
            activities.push({
                type:  "reflection",
                label: `Reflection: ${(r.question || "Self-reflection").replace(/"/g, "")}`,
                date:  r.created_at
            });
        });

        (results.goals || []).slice(0, 5).forEach(g => {
            activities.push({
                type:  "goal",
                label: `Completed challenge: ${g.challenge}`,
                date:  g.completed_date || g.created_at
            });
        });

        // Sort newest first
        activities.sort((a, b) => {
            const da = a.date ? new Date(a.date) : new Date(0);
            const db_ = b.date ? new Date(b.date) : new Date(0);
            return db_ - da;
        });

        const recentActivity = activities.slice(0, 10);

        // ---- weekly summary ----
        const weeklySummary = generateWeeklySummary(
            results.moods,
            results.journalCount,
            results.reflectionCount,
            results.goalsCompleted,
            results.streak
        );

        res.status(200).json({
            success:         true,
            latestMood,
            moodHistory:     results.moods         || [],
            journalCount:    results.journalCount   || 0,
            reflectionCount: results.reflectionCount || 0,
            goalsCompleted:  results.goalsCompleted  || 0,
            streak:          results.streak          || 0,
            recentActivity,
            weeklySummary
        });
    }


    // ---- Query 1: mood history (14 most recent, DESC) ----
    db.query(
        `SELECT mood_id AS id, mood, mood_icon AS icon, mood_date, created_at
         FROM moods
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 14`,
        [userId],
        (err, rows) => {
            if (err) { console.error("Dashboard mood query error:", err); errors++; }
            else results.moods = rows;
            finish();
        }
    );


    // ---- Query 2: journal count ----
    db.query(
        `SELECT COUNT(*) AS cnt FROM journals WHERE user_id = ?`,
        [userId],
        (err, rows) => {
            if (err) { console.error("Dashboard journal count error:", err); errors++; }
            else results.journalCount = rows[0].cnt;
            finish();
        }
    );


    // ---- Query 3: reflection count ----
    db.query(
        `SELECT COUNT(*) AS cnt FROM reflections WHERE user_id = ?`,
        [userId],
        (err, rows) => {
            if (err) { console.error("Dashboard reflection count error:", err); errors++; }
            else results.reflectionCount = rows[0].cnt;
            finish();
        }
    );


    // ---- Query 4: recent goals for activity feed ----
    db.query(
        `SELECT goal_id AS id, title AS challenge, completed, target_date AS completed_date
         FROM goals
         WHERE user_id = ? AND completed = 1
         ORDER BY created_at DESC, goal_id DESC
         LIMIT 10`,
        [userId],
        (err, rows) => {
            if (err) { console.error("Dashboard goals query error:", err); errors++; }
            else {
                results.goals = rows;
            }
            finish();
        }
    );


    // ---- Query 5: goalsTotal + live streak + recent reflections & journals ----
    // Streak is calculated live from moods table (consecutive days with ≥1 mood).
    // This keeps the dashboard in sync with the mood calendar streak display.
    db.query(
        `SELECT (SELECT COUNT(*) FROM goals WHERE user_id = ? AND completed = 1) AS goalsTotal`,
        [userId],
        (err, rows) => {
            if (err) {
                console.error("Dashboard goals count error:", err);
                errors++;
                finish();
                return;
            }

            results.goalsCompleted = (rows && rows.length > 0) ? (rows[0].goalsTotal || 0) : 0;

            // Calculate live streak from mood_date entries
            db.query(
                `SELECT DISTINCT DATE(CONVERT_TZ(created_at, '+00:00', '+05:30')) AS mood_day
                 FROM moods
                 WHERE user_id = ?
                 ORDER BY mood_day DESC
                 LIMIT 365`,
                [userId],
                (sErr, sRows) => {
                    let streak = 0;
                    if (!sErr && sRows && sRows.length > 0) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        let checkDate = new Date(today);

                        for (const row of sRows) {
                            const moodDay = new Date(row.mood_day);
                            moodDay.setHours(0, 0, 0, 0);
                            if (moodDay.getTime() === checkDate.getTime()) {
                                streak++;
                                checkDate.setDate(checkDate.getDate() - 1);
                            } else if (moodDay < checkDate) {
                                // Gap found — stop counting
                                break;
                            }
                        }
                    }
                    results.streak = streak;

                    // Fetch recent reflections for activity feed
                    db.query(
                        `SELECT reflection_id AS id, question, created_at
                         FROM reflections WHERE user_id = ?
                         ORDER BY created_at DESC LIMIT 5`,
                        [userId],
                        (rErr, rRows) => {
                            results.reflections = (!rErr && rRows) ? rRows : [];

                            // Fetch recent journals for activity feed
                            db.query(
                                `SELECT journal_id AS id, content AS text, created_at
                                 FROM journals WHERE user_id = ?
                                 ORDER BY created_at DESC LIMIT 5`,
                                [userId],
                                (jErr, jRows) => {
                                    results.journals = (!jErr && jRows) ? jRows : [];
                                    finish();
                                }
                            );
                        }
                    );
                }
            );
        }
    );


});


module.exports = router;
