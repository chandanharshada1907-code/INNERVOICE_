const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

function calculateConsistencyScore(metrics) {
    let score = 0;
    const maxScore = 100;
    
    // Evaluate based on 7 days
    // Mood tracked on active days (max 20)
    score += Math.min(20, (metrics.activeMoodDays / 7) * 20);
    // Journals (max 20)
    score += Math.min(20, (metrics.journalCount / 3) * 20);
    // Reflections (max 15)
    score += Math.min(15, (metrics.reflectionCount / 3) * 15);
    // Daily Plan Completion (max 25)
    score += Math.min(25, (metrics.dailyPlanCompletionPct / 100) * 25);
    // Goals or Focus (max 20)
    score += Math.min(20, ((metrics.goalsCompleted + (metrics.focusMinutes/30)) / 4) * 20);
    
    return Math.round(score);
}

function determineStrongestDay(scoresData) {
    if (!scoresData || scoresData.length === 0) return "Not enough data";
    
    let bestDay = null;
    let maxScore = -1;
    
    scoresData.forEach(s => {
        if (s.score > maxScore) {
            maxScore = s.score;
            bestDay = s.score_date;
        }
    });
    
    if (bestDay) {
        return new Date(bestDay).toLocaleDateString('en-US', { weekday: 'long' });
    }
    return "Not enough data";
}

function generateInsights(metrics) {
    let insight = "";
    let recommendation = "";
    
    if (metrics.avgWellnessScore >= 70) {
        insight = "Your wellness score was consistently high this week. Keep the routines that helped you finish the week strongly.";
        recommendation = "Maintain your current routine and gradually increase one goal.";
    } else if (metrics.avgWellnessScore > 0) {
        insight = "Your wellness score shows steady progress. Consistency is key.";
        recommendation = "Prioritize short calming activities and regular reflection.";
    } else {
        insight = "Your activity was lighter this week.";
        recommendation = "Start next week with one small daily wellness habit.";
    }
    
    if (metrics.journalCount >= 3) {
        insight = "You consistently used journaling this week. Continuing this habit may help you maintain self-reflection.";
    } else if (metrics.journalCount === 0) {
        recommendation = "Try writing for 5 minutes on three days next week.";
    }
    
    if (metrics.dailyPlanCompletionPct >= 70) {
        insight = "You completed most of your personalized daily activities. Your consistency is becoming a strong part of your routine.";
    } else if (metrics.dailyPlanCompletionPct > 0 && metrics.dailyPlanCompletionPct < 50) {
        recommendation = "Start with the highest-priority activity each morning.";
    }
    
    if (metrics.focusMinutes < 30) {
        recommendation = "Add two short focus sessions next week.";
    }
    
    if (!insight) insight = "You're taking steps towards better wellness. Keep it up!";
    if (!recommendation) recommendation = "Set one small wellness goal for the upcoming week.";
    
    return { insight, recommendation };
}

router.get("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const todayObj = new Date();
        const pastWeekObj = new Date();
        pastWeekObj.setDate(todayObj.getDate() - 6); // Last 7 days inclusive
        
        const todayStr = todayObj.toISOString().slice(0, 10);
        const pastWeekStr = pastWeekObj.toISOString().slice(0, 10);
        
        // 1. Wellness Scores
        const [wellnessScores] = await db.promise().query(
            "SELECT score_date, score FROM wellness_scores WHERE user_id = ? AND score_date BETWEEN ? AND ? ORDER BY score_date ASC",
            [userId, pastWeekStr, todayStr]
        );
        let avgWellnessScore = 0;
        if (wellnessScores.length > 0) {
            const sum = wellnessScores.reduce((acc, val) => acc + val.score, 0);
            avgWellnessScore = Math.round(sum / wellnessScores.length);
        }
        
        // 2. Moods
        const [moods] = await db.promise().query(
            "SELECT mood, mood_date, created_at FROM moods WHERE user_id = ? AND (mood_date BETWEEN ? AND ? OR DATE(created_at) BETWEEN ? AND ?)",
            [userId, pastWeekStr, todayStr, pastWeekStr, todayStr]
        );
        
        const moodDist = { positive: 0, neutral: 0, negative: 0 };
        const activeMoodDaysSet = new Set();
        
        moods.forEach(m => {
            const moodName = (m.mood || "").toLowerCase();
            if (["happy", "great", "excited", "good"].includes(moodName)) moodDist.positive++;
            else if (["anxious", "angry", "terrible", "sad", "tired", "low"].includes(moodName)) moodDist.negative++;
            else moodDist.neutral++;
            
            const dateStr = m.mood_date ? m.mood_date.toISOString().slice(0,10) : m.created_at.toISOString().slice(0,10);
            activeMoodDaysSet.add(dateStr);
        });
        
        // 3. Journals
        const [journals] = await db.promise().query(
            "SELECT journal_id FROM journals WHERE user_id = ? AND DATE(created_at) BETWEEN ? AND ?",
            [userId, pastWeekStr, todayStr]
        );
        
        // 4. Reflections
        const [reflections] = await db.promise().query(
            "SELECT reflection_id FROM reflections WHERE user_id = ? AND DATE(created_at) BETWEEN ? AND ?",
            [userId, pastWeekStr, todayStr]
        );
        
        // 5. Goals completed
        const [goals] = await db.promise().query(
            "SELECT goal_id FROM goals WHERE user_id = ? AND completed = 1 AND DATE(target_date) BETWEEN ? AND ?",
            [userId, pastWeekStr, todayStr]
        );
        
        // 6. Daily Plans
        const [dailyPlans] = await db.promise().query(
            "SELECT completion_percentage FROM daily_plans WHERE user_id = ? AND plan_date BETWEEN ? AND ?",
            [userId, pastWeekStr, todayStr]
        );
        
        let avgPlanPct = 0;
        if (dailyPlans.length > 0) {
            const sum = dailyPlans.reduce((acc, val) => acc + val.completion_percentage, 0);
            avgPlanPct = Math.round(sum / dailyPlans.length);
        }
        
        // 7. Focus Sessions
        const [focus] = await db.promise().query(
            "SELECT duration FROM focus_sessions WHERE user_id = ? AND completed = 1 AND DATE(started_at) BETWEEN ? AND ?",
            [userId, pastWeekStr, todayStr]
        );
        const focusMinutes = focus.reduce((acc, val) => acc + val.duration, 0);
        
        // 8. Streak
        const [userRow] = await db.promise().query("SELECT streak FROM users WHERE id = ?", [userId]);
        const streak = userRow[0]?.streak || 0;
        
        // Metrics object
        const metrics = {
            activeMoodDays: activeMoodDaysSet.size,
            journalCount: journals.length,
            reflectionCount: reflections.length,
            goalsCompleted: goals.length,
            dailyPlanCompletionPct: avgPlanPct,
            focusMinutes: focusMinutes,
            avgWellnessScore: avgWellnessScore
        };
        
        const consistencyScore = calculateConsistencyScore(metrics);
        const strongestDay = determineStrongestDay(wellnessScores);
        const { insight, recommendation } = generateInsights(metrics);
        
        // Construct full report
        const report = {
            week_start: pastWeekStr,
            week_end: todayStr,
            average_wellness_score: avgWellnessScore,
            wellness_score_history: wellnessScores,
            mood_distribution: moodDist,
            total_moods: moods.length,
            journal_count: journals.length,
            reflection_count: reflections.length,
            goals_completed: goals.length,
            daily_plan_completion: avgPlanPct,
            focus_minutes: focusMinutes,
            streak: streak,
            consistency_score: consistencyScore,
            strongest_day: strongestDay,
            primary_insight: insight,
            next_week_recommendation: recommendation
        };
        
        res.json({
            success: true,
            report: report
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error generating weekly report." });
    }
});

module.exports = router;
