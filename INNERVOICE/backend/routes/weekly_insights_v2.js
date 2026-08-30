const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');
const { generateWellnessInsight } = require('../services/wellnessAssistantService');

// Helper to get stats for a specific 7-day period
async function getPeriodStats(userId, startDate, endDate) {
    // 1. Mood Stats
    const [moods] = await db.promise().query(
        `SELECT mood, 
         CASE 
            WHEN mood IN ('happy', 'great', 'excited', 'joyful', 'proud') THEN 5
            WHEN mood IN ('good', 'calm', 'motivated') THEN 4
            WHEN mood IN ('okay', 'neutral', 'tired') THEN 3
            WHEN mood IN ('sad', 'low', 'lonely') THEN 2
            WHEN mood IN ('anxious', 'angry', 'terrible', 'stressed', 'frustrated', 'overwhelmed') THEN 1
            ELSE 3 
         END as score 
         FROM moods 
         WHERE user_id = ? AND DATE(created_at) >= ? AND DATE(created_at) <= ?`,
        [userId, startDate, endDate]
    );

    let moodSum = 0;
    const moodCounts = {};
    let highestScore = 0;
    let lowestScore = 6;
    let mostFrequentMood = null;

    moods.forEach(m => {
        moodSum += m.score;
        moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
        if (m.score > highestScore) highestScore = m.score;
        if (m.score < lowestScore) lowestScore = m.score;
    });

    for (const m in moodCounts) {
        if (!mostFrequentMood || moodCounts[m] > moodCounts[mostFrequentMood]) {
            mostFrequentMood = m;
        }
    }

    const moodAverage = moods.length > 0 ? (moodSum / moods.length) : 0;
    const moodCheckIns = moods.length;

    // 2. Habit Stats
    const [habits] = await db.promise().query(
        `SELECT COUNT(DISTINCT id) as active_habits FROM habits WHERE user_id = ?`,
        [userId]
    );
    const activeHabits = habits[0].active_habits || 0;
    const expectedHabitCompletions = activeHabits * 7; // Assuming daily habits

    const [habitCompletions] = await db.promise().query(
        `SELECT COUNT(*) as count FROM habit_completions 
         WHERE user_id = ? AND DATE(completion_date) >= ? AND DATE(completion_date) <= ?`,
        [userId, startDate, endDate]
    );
    const habitCompletedCount = habitCompletions[0].count || 0;
    const habitCompletionRate = expectedHabitCompletions > 0 ? (habitCompletedCount / expectedHabitCompletions) * 100 : (habitCompletedCount > 0 ? 100 : null);

    // 3. Goal Stats
    const [goals] = await db.promise().query(
        `SELECT COUNT(*) as active FROM goals WHERE user_id = ? AND completed = FALSE`,
        [userId]
    );
    const [completedGoals] = await db.promise().query(
        `SELECT COUNT(*) as completed FROM goals 
         WHERE user_id = ? AND completed = TRUE AND DATE(completed_date) >= ? AND DATE(completed_date) <= ?`,
        [userId, startDate, endDate]
    );
    const [milestones] = await db.promise().query(
        `SELECT COUNT(*) as count FROM goal_milestones gm
         JOIN goals g ON gm.goal_id = g.goal_id
         WHERE g.user_id = ? AND gm.is_completed = 1 AND DATE(gm.completed_at) >= ? AND DATE(gm.completed_at) <= ?`,
        [userId, startDate, endDate]
    );

    // 4. Daily Plan Stats
    const [dailyPlans] = await db.promise().query(
        `SELECT id, completion_percentage FROM daily_plans 
         WHERE user_id = ? AND plan_date >= ? AND plan_date <= ?`,
        [userId, startDate, endDate]
    );
    
    let dailyPlanSum = 0;
    let totalItems = 0;
    let completedItems = 0;
    let skippedItems = 0;
    
    if (dailyPlans.length > 0) {
        const planIds = dailyPlans.map(p => p.id);
        const [planItems] = await db.promise().query(
            `SELECT completed, skipped FROM daily_plan_items WHERE daily_plan_id IN (?)`,
            [planIds]
        );
        totalItems = planItems.length;
        completedItems = planItems.filter(i => i.completed).length;
        skippedItems = planItems.filter(i => i.skipped).length;
        
        dailyPlanSum = dailyPlans.reduce((sum, p) => sum + (p.completion_percentage || 0), 0);
    }
    const dailyPlanCompletionRate = dailyPlans.length > 0 ? (dailyPlanSum / dailyPlans.length) : null;
    const pendingItems = totalItems - completedItems - skippedItems;

    // 5. Journal and Reflection Stats
    const [journals] = await db.promise().query(
        `SELECT COUNT(*) as count FROM journals WHERE user_id = ? AND DATE(created_at) >= ? AND DATE(created_at) <= ?`,
        [userId, startDate, endDate]
    );
    const [reflections] = await db.promise().query(
        `SELECT COUNT(*) as count FROM reflections WHERE user_id = ? AND DATE(created_at) >= ? AND DATE(created_at) <= ?`,
        [userId, startDate, endDate]
    );

    return {
        mood: {
            checkIns: moodCheckIns,
            average: moodAverage, // 0 to 5
            mostFrequent: mostFrequentMood,
            highestScore: highestScore <= 5 ? highestScore : null,
            lowestScore: lowestScore >= 1 && lowestScore <= 5 ? lowestScore : null
        },
        habits: {
            active: activeHabits,
            expected: expectedHabitCompletions,
            completed: habitCompletedCount,
            completionRate: habitCompletionRate
        },
        goals: {
            active: goals[0] ? goals[0].active : 0,
            completed: completedGoals[0] ? completedGoals[0].completed : 0,
            milestonesCompleted: milestones[0] ? milestones[0].count : 0
        },
        dailyPlan: {
            days: dailyPlans.length,
            total: totalItems,
            completed: completedItems,
            skipped: skippedItems,
            pending: pendingItems,
            completionRate: dailyPlanCompletionRate
        },
        journals: { entries: journals[0] ? journals[0].count : 0 },
        reflections: { entries: reflections[0] ? reflections[0].count : 0 }
    };
}

function calculateScore(stats) {
    let totalScore = 0;
    let maxWeight = 0;

    // Mood (0 to 5) -> 0 to 100 (Weight: 30%)
    if (stats.mood.checkIns > 0) {
        const moodScore = (stats.mood.average / 5) * 100;
        totalScore += moodScore * 0.3;
        maxWeight += 0.3;
    }

    // Habits (Weight: 25%)
    if (stats.habits.completionRate !== null) {
        totalScore += stats.habits.completionRate * 0.25;
        maxWeight += 0.25;
    }

    // Daily Plan (Weight: 25%)
    if (stats.dailyPlan.completionRate !== null) {
        totalScore += stats.dailyPlan.completionRate * 0.25;
        maxWeight += 0.25;
    }

    // Journals & Reflections (Weight: 20%)
    const engagementCount = stats.journals.entries + stats.reflections.entries;
    if (engagementCount > 0) {
        // Cap engagement at 5 entries for max score
        const engagementScore = Math.min((engagementCount / 5) * 100, 100);
        totalScore += engagementScore * 0.20;
        maxWeight += 0.20;
    } else {
        // No entries, count out of 0-100? Let's just give 0 for this 20%
        maxWeight += 0.20; 
    }

    if (maxWeight === 0) return 0; // Insufficient data

    return Math.round(totalScore / maxWeight);
}

// GET /api/insights/weekly
router.get("/weekly", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        
        // Use timezone-safe date calculations
        const today = new Date();
        
        const currentEnd = today.toISOString().slice(0, 10);
        const currentStartDate = new Date(today);
        currentStartDate.setDate(currentStartDate.getDate() - 6);
        const currentStart = currentStartDate.toISOString().slice(0, 10);
        
        const previousEndDate = new Date(currentStartDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);
        const previousEnd = previousEndDate.toISOString().slice(0, 10);
        
        const previousStartDate = new Date(previousEndDate);
        previousStartDate.setDate(previousStartDate.getDate() - 6);
        const previousStart = previousStartDate.toISOString().slice(0, 10);

        const currentStats = await getPeriodStats(userId, currentStart, currentEnd);
        const previousStats = await getPeriodStats(userId, previousStart, previousEnd);

        const currentScore = calculateScore(currentStats);
        const previousScore = calculateScore(previousStats);
        
        let trend = "stable";
        let difference = currentScore - previousScore;
        
        // If no data in current week, handle gracefully
        if (currentStats.mood.checkIns === 0 && currentStats.habits.completed === 0 && currentStats.dailyPlan.days === 0 && currentStats.journals.entries === 0 && currentStats.reflections.entries === 0) {
            trend = "insufficient_data";
            difference = 0;
        } else if (currentScore > previousScore + 5) {
            trend = "improving";
        } else if (currentScore < previousScore - 5) {
            trend = "declining";
        }

        let moodTrend = "stable";
        if (currentStats.mood.checkIns > 0 && previousStats.mood.checkIns > 0) {
            if (currentStats.mood.average > previousStats.mood.average + 0.3) moodTrend = "improving";
            else if (currentStats.mood.average < previousStats.mood.average - 0.3) moodTrend = "declining";
        } else if (currentStats.mood.checkIns === 0) {
            moodTrend = "insufficient_data";
        }

        // Generate AI Insight
        let aiInsight = {
            summary: "Not enough data for a personalized insight this week. Check in daily to get AI summaries!",
            recommendations: []
        };
        
        if (trend !== "insufficient_data") {
            try {
                // Call existing wellness assistant service to generate summary
                const aiPrompt = `Analyze the user's weekly wellness data. Current Score: ${currentScore}. Previous Score: ${previousScore}. Trend: ${trend}.
                Mood check-ins: ${currentStats.mood.checkIns}, Average Mood: ${currentStats.mood.average}, Most frequent: ${currentStats.mood.mostFrequent}.
                Habits completed: ${currentStats.habits.completed}/${currentStats.habits.expected}.
                Daily plan completion: ${Math.round(currentStats.dailyPlan.completionRate || 0)}%.
                Journals: ${currentStats.journals.entries}, Reflections: ${currentStats.reflections.entries}.
                Provide a short encouraging paragraph (2-3 sentences) observing their week. Include 1 or 2 short practical recommendations. Do not make medical claims. Write directly to the user (e.g. "You were...").`;
                
                const aiResponse = await generateWellnessInsight(aiPrompt, userId);
                if (aiResponse) {
                    aiInsight.summary = aiResponse.split(/(?=Here are|I recommend|Try to)/i)[0].trim();
                    const recs = aiResponse.match(/-(.*)|(?<=\d\.\s)(.*)/g);
                    if (recs) {
                        aiInsight.recommendations = recs.map(r => r.replace(/^-|^\d\.\s/, '').trim());
                    } else {
                        aiInsight.recommendations = ["Continue logging your daily activities.", "Try a new breathing exercise if you feel overwhelmed."];
                    }
                }
            } catch (err) {
                console.error("AI Insight generation failed, using fallback.", err);
                aiInsight.summary = `Your wellness score this week is ${currentScore}. ${trend === 'improving' ? 'Great job improving!' : (trend === 'declining' ? 'Take it easy next week.' : 'Consistent effort!')}`;
                aiInsight.recommendations = ["Keep up the daily check-ins."];
            }
        }

        res.json({
            success: true,
            data: {
                period: { start: currentStart, end: currentEnd },
                score: {
                    current: currentScore,
                    previous: previousScore,
                    difference: difference,
                    trend: trend
                },
                previousStats: previousStats,
                mood: { ...currentStats.mood, trend: moodTrend },
                habits: currentStats.habits,
                goals: currentStats.goals,
                dailyPlan: currentStats.dailyPlan,
                journals: currentStats.journals,
                reflections: currentStats.reflections,
                aiInsight: aiInsight
            }
        });
    } catch (err) {
        console.error("Weekly Insights Error:", err);
        res.status(500).json({ success: false, message: "Error retrieving weekly insights." });
    }
});

module.exports = router;
