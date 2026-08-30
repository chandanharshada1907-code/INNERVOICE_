const pool = require('./db');
const { generateWellnessInsight } = require('./services/wellnessAssistantService');

async function getPeriodStats(userId, startDate, endDate) {
    // 1. Mood Stats
    const [moods] = await pool.promise().query(
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
    const [habits] = await pool.promise().query(
        `SELECT COUNT(DISTINCT id) as active_habits FROM habits WHERE user_id = ?`,
        [userId]
    );
    const activeHabits = habits[0].active_habits || 0;
    const expectedHabitCompletions = activeHabits * 7; // Assuming daily habits

    const [habitCompletions] = await pool.promise().query(
        `SELECT COUNT(*) as count FROM habit_completions 
         WHERE user_id = ? AND DATE(completion_date) >= ? AND DATE(completion_date) <= ?`,
        [userId, startDate, endDate]
    );
    const habitCompletedCount = habitCompletions[0].count || 0;
    const habitCompletionRate = expectedHabitCompletions > 0 ? (habitCompletedCount / expectedHabitCompletions) * 100 : (habitCompletedCount > 0 ? 100 : null);

    // 3. Goal Stats
    const [goals] = await pool.promise().query(
        `SELECT COUNT(*) as active FROM goals WHERE user_id = ? AND completed = FALSE`,
        [userId]
    );
    const [completedGoals] = await pool.promise().query(
        `SELECT COUNT(*) as completed FROM goals 
         WHERE user_id = ? AND completed = TRUE AND DATE(completed_date) >= ? AND DATE(completed_date) <= ?`,
        [userId, startDate, endDate]
    );
    const [milestones] = await pool.promise().query(
        `SELECT COUNT(*) as count FROM goal_milestones gm
         JOIN goals g ON gm.goal_id = g.goal_id
         WHERE g.user_id = ? AND gm.is_completed = 1 AND DATE(gm.completed_at) >= ? AND DATE(gm.completed_at) <= ?`,
        [userId, startDate, endDate]
    );

    // 4. Daily Plan Stats
    const [dailyPlans] = await pool.promise().query(
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
        const [planItems] = await pool.promise().query(
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
    const [journals] = await pool.promise().query(
        `SELECT COUNT(*) as count FROM journals WHERE user_id = ? AND DATE(created_at) >= ? AND DATE(created_at) <= ?`,
        [userId, startDate, endDate]
    );
    const [reflections] = await pool.promise().query(
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

    if (stats.mood.checkIns > 0) {
        const moodScore = (stats.mood.average / 5) * 100;
        totalScore += moodScore * 0.3;
        maxWeight += 0.3;
    }

    if (stats.habits.completionRate !== null) {
        totalScore += stats.habits.completionRate * 0.25;
        maxWeight += 0.25;
    }

    if (stats.dailyPlan.completionRate !== null) {
        totalScore += stats.dailyPlan.completionRate * 0.25;
        maxWeight += 0.25;
    }

    const engagementCount = stats.journals.entries + stats.reflections.entries;
    if (engagementCount > 0) {
        const engagementScore = Math.min((engagementCount / 5) * 100, 100);
        totalScore += engagementScore * 0.20;
        maxWeight += 0.20;
    } else {
        maxWeight += 0.20; 
    }

    if (maxWeight === 0) return 0;
    return Math.round(totalScore / maxWeight);
}

async function testIt() {
    try {
        const [users] = await pool.promise().query('SELECT id, email FROM users LIMIT 1');
        if (users.length === 0) { console.log("No users found."); return; }
        const userId = users[0].id;
        
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

        console.log("Fetching current stats...");
        const currentStats = await getPeriodStats(userId, currentStart, currentEnd);
        console.log("Fetching previous stats...");
        const previousStats = await getPeriodStats(userId, previousStart, previousEnd);
        
        console.log("Calculating scores...");
        const currentScore = calculateScore(currentStats);
        const previousScore = calculateScore(previousStats);
        
        console.log("SUCCESS!");
        console.dir({ currentScore, previousScore }, { depth: null });
        
    } catch (err) {
        console.error("FATAL ERROR CAUGHT:");
        console.error(err.stack);
    } finally {
        pool.end();
        process.exit();
    }
}

require('dotenv').config({ path: './.env' });
testIt();
