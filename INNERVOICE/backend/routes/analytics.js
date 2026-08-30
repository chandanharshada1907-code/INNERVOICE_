const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// Helper to convert mood to score
const MOOD_SCORES = {
    "Happy": 5, "Excited": 5, "Great": 5,
    "Good": 4,
    "Okay": 3, "Neutral": 3,
    "Tired": 2, "Sad": 2, "Anxious": 2,
    "Angry": 1, "Terrible": 1
};

function moodToScore(moodLabel) {
    if (!moodLabel) return 3;
    const key = Object.keys(MOOD_SCORES).find(k => k.toLowerCase() === moodLabel.toLowerCase());
    return key ? MOOD_SCORES[key] : 3;
}

// GET /api/wellness-analytics
// Returns comprehensive wellness analytics for a given period
router.get("/", verifyToken, async (req, res) => {
    const userId = req.user.id;
    let period = req.query.period || '30'; // 7, 30, 90, all
    
    // Validate period
    if (!['7', '30', '90', 'all'].includes(period)) {
        return res.status(400).json({ success: false, message: "Invalid period. Must be 7, 30, 90, or 'all'." });
    }

    try {
        const promiseDb = db.promise();
        
        let dateFilter = "";
        let prevDateFilter = "";
        let params = [userId];
        let prevParams = [userId];
        
        // Helper to generate date filters for specific columns
        const getFilter = (col) => {
            if (period === 'all') return "";
            const days = parseInt(period, 10);
            return `AND ${col} >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`;
        };
        const getPrevFilter = (col) => {
            if (period === 'all') return "";
            const days = parseInt(period, 10);
            return `AND ${col} >= DATE_SUB(CURDATE(), INTERVAL ${days * 2} DAY) AND ${col} < DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`;
        };

        // 1. User & XP/Level
        const [[user]] = await promiseDb.query("SELECT streak, xp, level FROM users WHERE id = ?", [userId]);
        
        // 2. Wellness Scores
        const [scores] = await promiseDb.query(`SELECT score, score_date FROM wellness_scores WHERE user_id = ? ${getFilter('score_date')} ORDER BY score_date ASC`, [userId]);
        const [prevScores] = period !== 'all' ? await promiseDb.query(`SELECT score FROM wellness_scores WHERE user_id = ? ${getPrevFilter('score_date')} ORDER BY score_date DESC LIMIT 1`, [userId]) : [[]];
        
        let currentScore = scores.length > 0 ? scores[scores.length - 1].score : 0;
        let prevScore = prevScores.length > 0 ? prevScores[0].score : (scores.length > 1 ? scores[0].score : 0);
        let scoreChange = currentScore - prevScore;
        let scoreChangePct = prevScore > 0 ? Math.round((scoreChange / prevScore) * 100) : 0;

        // 3. Mood Analytics
        const [moods] = await promiseDb.query(`SELECT mood, mood_date FROM moods WHERE user_id = ? ${getFilter('mood_date')} ORDER BY mood_date ASC`, [userId]);
        
        let moodAvg = 0, mostFrequentMood = "None", positivePct = 0, negativePct = 0, bestMoodDay = "N/A", worstMoodDay = "N/A", moodConsistency = 0;
        let moodCounts = {};
        
        if (moods.length > 0) {
            let totalScore = 0;
            let positiveCount = 0;
            let negativeCount = 0;
            let highestScore = -1;
            let lowestScore = 10;
            
            moods.forEach(m => {
                const s = moodToScore(m.mood);
                totalScore += s;
                moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
                
                if (s >= 4) positiveCount++;
                if (s <= 2) negativeCount++;
                
                if (s > highestScore) { highestScore = s; bestMoodDay = m.mood_date; }
                if (s < lowestScore) { lowestScore = s; worstMoodDay = m.mood_date; }
            });
            
            moodAvg = (totalScore / moods.length).toFixed(1);
            mostFrequentMood = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b, "None");
            positivePct = Math.round((positiveCount / moods.length) * 100);
            negativePct = Math.round((negativeCount / moods.length) * 100);
            
            const daysInPeriod = period === 'all' ? (moods.length > 0 ? Math.max(1, Math.ceil((new Date() - new Date(moods[0].mood_date)) / (1000 * 60 * 60 * 24))) : 1) : parseInt(period, 10);
            const uniqueDays = new Set(moods.map(m => new Date(m.mood_date).toDateString())).size;
            moodConsistency = Math.round((uniqueDays / daysInPeriod) * 100);
        }

        // 4. Habits Analytics
        let activeHabits = 0, completedHabits = 0, habitConsistency = 0;
        try {
            const [habits] = await promiseDb.query(`SELECT * FROM habits WHERE user_id = ? AND is_active = 1`, [userId]);
            activeHabits = habits.length;
            const [completions] = await promiseDb.query(`SELECT * FROM habit_completions WHERE user_id = ? ${getFilter('completion_date')} AND completed = 1`, [userId]);
            completedHabits = completions.length;
            
            if (activeHabits > 0) {
                const daysInPeriod = period === 'all' ? 30 : parseInt(period, 10);
                const expected = activeHabits * daysInPeriod;
                habitConsistency = expected > 0 ? Math.min(100, Math.round((completedHabits / expected) * 100)) : 0;
            }
        } catch (e) {
            console.warn("Habits table issue:", e.message);
        }

        // 5. Goals Analytics
        const [goals] = await promiseDb.query(`SELECT * FROM goals WHERE user_id = ? ${getFilter('created_at')}`, [userId]);
        let activeGoals = goals.filter(g => !g.completed).length;
        let goalsDone = goals.filter(g => g.completed).length;
        let goalCompletionPct = goals.length > 0 ? Math.round((goalsDone / goals.length) * 100) : 0;
        let overdueGoals = goals.filter(g => !g.completed && g.target_date && new Date(g.target_date) < new Date()).length;

        let milestonesAchieved = 0, upcomingMilestones = 0;
        try {
            const [milestones] = await promiseDb.query(`SELECT m.is_completed FROM goal_milestones m JOIN goals g ON m.goal_id = g.goal_id WHERE g.user_id = ?`, [userId]);
            milestonesAchieved = milestones.filter(m => m.is_completed).length;
            upcomingMilestones = milestones.filter(m => !m.is_completed).length;
        } catch(e) {}

        // 6. Journals & Reflections
        const [journals] = await promiseDb.query(`SELECT journal_date FROM journals WHERE user_id = ? ${getFilter('journal_date')}`, [userId]);
        const [reflections] = await promiseDb.query(`SELECT reflection_date FROM reflections WHERE user_id = ? ${getFilter('reflection_date')}`, [userId]);
        
        let journalsThisWeek = 0;
        if (period !== '7' && period !== 'all') {
            const [journals7] = await promiseDb.query(`SELECT journal_date FROM journals WHERE user_id = ? AND journal_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`, [userId]);
            journalsThisWeek = journals7.length;
        } else if (period === '7') {
            journalsThisWeek = journals.length;
        }

        // 7. Daily Plans
        let plansGenerated = 0, plansCompleted = 0, avgPlanCompletion = 0;
        try {
            const [plans] = await promiseDb.query(`SELECT completion_percentage FROM daily_plans WHERE user_id = ? ${getFilter('plan_date')}`, [userId]);
            plansGenerated = plans.length;
            plansCompleted = plans.filter(p => p.completion_percentage >= 100).length;
            avgPlanCompletion = plans.length > 0 ? Math.round(plans.reduce((a, b) => a + (b.completion_percentage || 0), 0) / plans.length) : 0;
        } catch(e) {}

        // 8. Achievements
        let unlockedAch = 0;
        try {
            const [achs] = await promiseDb.query(`SELECT * FROM user_achievements WHERE user_id = ?`, [userId]);
            unlockedAch = achs.length;
        } catch(e) {}
        
        const xp = user ? (user.xp || 0) : 0;
        const level = user ? (user.level || 1) : 1;
        const streak = user ? (user.streak || 0) : 0;

        // 9. Personal Bests (All time stats)
        let personalBests = {
            highestWellnessScore: 0,
            longestStreak: streak,
            mostGoals: 0,
            highestLevel: level
        };
        const [allScores] = await promiseDb.query(`SELECT MAX(score) as max_score FROM wellness_scores WHERE user_id = ?`, [userId]);
        if (allScores.length > 0 && allScores[0].max_score) personalBests.highestWellnessScore = allScores[0].max_score;
        const [allGoals] = await promiseDb.query(`SELECT COUNT(*) as c FROM goals WHERE user_id = ? AND completed = 1`, [userId]);
        if (allGoals.length > 0) personalBests.mostGoals = allGoals[0].c;

        // 10. Strengths & Areas to Improve
        let strengths = [];
        let improvements = [];
        
        if (moodConsistency >= 70) strengths.push("Consistent Mood Tracking");
        else if (moodConsistency < 30 && period !== 'all') improvements.push("Irregular Mood Tracking");
        
        if (habitConsistency >= 70) strengths.push("Strong Habit Consistency");
        else if (habitConsistency < 40 && activeHabits > 0) improvements.push("Low Habit Consistency");
        
        if (journals.length >= 3) strengths.push("Active Journaling");
        else improvements.push("Few Journal Entries");
        
        if (goalCompletionPct >= 50) strengths.push("High Goal Completion Rate");
        else if (activeGoals > 0 && goalCompletionPct < 20) improvements.push("Goals Stalling");
        
        if (overdueGoals > 0) improvements.push(`${overdueGoals} Overdue Goals`);
        if (streak >= 3) strengths.push(`${streak}-Day Streak Active!`);
        else if (streak === 0) improvements.push("No Active Streak");
        
        if (strengths.length === 0) strengths.push("Building foundation");
        if (improvements.length === 0) improvements.push("Keep up the great work!");

        // 11. Personalized Summary
        let summaryText = "";
        if (moods.length === 0 && journals.length === 0 && goals.length === 0) {
            summaryText = "Keep using INNERVOICE to build enough activity for personalized progress insights.";
        } else {
            let sParts = [];
            if (streak >= 7) sParts.push(`You have maintained a fantastic ${streak}-day streak.`);
            else if (streak > 0) sParts.push(`You are on a ${streak}-day streak.`);
            
            if (scoreChange > 0) sParts.push(`Your wellness score improved by ${scoreChangePct}% compared to the previous period.`);
            else if (scoreChange < 0) sParts.push(`Your wellness score has dipped slightly, which is completely normal.`);
            
            if (positivePct >= 60) sParts.push("Your overall mood has been highly positive.");
            else if (negativePct >= 50) sParts.push("You've experienced a high number of difficult days, consider exploring your reflections.");
            
            if (goalCompletionPct > 0) sParts.push(`You've successfully completed ${goalsDone} goals.`);
            
            summaryText = sParts.join(" ") || "You are making steady progress on your wellness journey.";
        }

        // Return Aggregate Data
        res.status(200).json({
            success: true,
            period,
            wellnessScore: {
                current: currentScore,
                previous: prevScore,
                change: scoreChange,
                changePct: scoreChangePct,
                history: scores
            },
            mood: {
                avgScore: moodAvg,
                mostFrequent: mostFrequentMood,
                positivePct,
                negativePct,
                consistency: moodConsistency,
                bestDay: bestMoodDay,
                worstDay: worstMoodDay,
                history: moods
            },
            habits: {
                active: activeHabits,
                completed: completedHabits,
                consistency: habitConsistency,
                streak: streak
            },
            goals: {
                active: activeGoals,
                completed: goalsDone,
                completionPct: goalCompletionPct,
                overdue: overdueGoals,
                milestonesAchieved,
                upcomingMilestones
            },
            journals: {
                total: journals.length,
                thisWeek: journalsThisWeek,
                reflections: reflections.length
            },
            dailyPlan: {
                generated: plansGenerated,
                completed: plansCompleted,
                avgCompletion: avgPlanCompletion
            },
            achievements: {
                level,
                xp,
                unlocked: unlockedAch
            },
            personalBests,
            strengths: strengths.slice(0, 3), // max 3
            improvements: improvements.slice(0, 3),
            summary: summaryText
        });

    } catch (err) {
        console.error("Error generating wellness analytics:", err);
        res.status(500).json({ success: false, message: "Internal server error calculating analytics" });
    }
});

module.exports = router;
