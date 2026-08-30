const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");
const { awardXP, evaluateAchievements } = require("../services/achievementService");

const router = express.Router();

// HELPER: Generate Smart Adaptive Daily Plan
async function generatePlanForUser(userId) {
    const today = new Date().toISOString().slice(0, 10);
    
    // 1. Get user data
    const [userRow] = await db.promise().query("SELECT streak FROM users WHERE id = ?", [userId]);
    const streak = userRow[0]?.streak || 0;
    
    // 2. Get latest mood
    const [moodRow] = await db.promise().query(
        "SELECT mood FROM moods WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", [userId]
    );
    const lastMood = moodRow[0]?.mood?.toLowerCase() || "neutral";
    
    let moodCategory = "neutral";
    if (["happy", "great", "excited", "good", "calm", "joyful", "motivated", "proud"].includes(lastMood)) moodCategory = "positive";
    else if (["anxious", "angry", "terrible", "stressed", "frustrated", "overwhelmed"].includes(lastMood)) moodCategory = "anxious";
    else if (["sad", "tired", "low", "lonely"].includes(lastMood)) moodCategory = "low";
    
    // 3. Get today's wellness score (or recent)
    const [scoreRow] = await db.promise().query(
        "SELECT score FROM wellness_scores WHERE user_id = ? ORDER BY score_date DESC LIMIT 1", [userId]
    );
    const score = scoreRow[0]?.score || 50;
    
    // 4. Get active habits (filter completed today)
    const [habits] = await db.promise().query(
        `SELECT h.*, 
         (SELECT COUNT(*) FROM habit_completions hl WHERE hl.habit_id = h.id AND DATE(hl.completion_date) = ?) as completed_today 
         FROM habits h WHERE h.user_id = ?`, [today, userId]
    );
    const pendingHabits = habits.filter(h => h.completed_today === 0);
    
    // 5. Get active goals
    const [goals] = await db.promise().query(
        "SELECT * FROM goals WHERE user_id = ? AND completed = FALSE ORDER BY FIELD(priority, 'High', 'Medium', 'Low') ASC", [userId]
    );
    
    // 6. Focus session check
    const [focus] = await db.promise().query(
        "SELECT COUNT(*) as count FROM focus_sessions WHERE user_id = ? AND DATE(started_at) = ?", [userId, today]
    );
    const hasFocusToday = focus[0].count > 0;
    
    // 7. Journals & Reflections check
    const [journals] = await db.promise().query(
        "SELECT journal_id FROM journals WHERE user_id = ? AND DATE(created_at) >= DATE_SUB(?, INTERVAL 2 DAY)", [userId, today]
    );
    const recentJournal = journals.length > 0;

    // BUILD PLAN
    let primaryFocus = "Balanced Wellness";
    let summary = "A balanced approach to maintain your streak and well-being.";
    
    const candidateActivities = [];
    
    // ----- MORNING -----
    candidateActivities.push({
        activity_type: "morning_mood",
        title: "Morning Mood Check-in",
        description: "Take a moment to pause and notice how you're feeling today.",
        priority: "HIGH",
        estimated_minutes: 1,
        reason: "Consistent check-ins build emotional awareness."
    });

    if (score < 40 || moodCategory === "low" || moodCategory === "anxious") {
        primaryFocus = "Gentle Reset";
        summary = "Based on your recent wellness state, let's prioritize gentle activities and a calmer routine today.";
        candidateActivities.push({
            activity_type: "morning_breathing",
            title: "5-minute Breathing Break",
            description: "Follow the gentle rhythm to regulate your breath.",
            priority: "HIGH",
            estimated_minutes: 5,
            reason: "Your recent indicators suggest taking a short, calming break."
        });
    } else {
        if (score > 70 || moodCategory === "positive") {
            primaryFocus = "Momentum & Growth";
            summary = "You're in a great space! Let's build habits, achieve goals, and challenge yourself.";
        } else {
            primaryFocus = "Steady Progress";
            summary = "Let's check in with ourselves and maintain steady habits today.";
        }
        candidateActivities.push({
            activity_type: "morning_hydration",
            title: "Hydration & Prep",
            description: "Drink a glass of water and review your priorities.",
            priority: "MEDIUM",
            estimated_minutes: 2,
            reason: "Start the day fresh."
        });
    }

    // ----- AFTERNOON -----
    if (goals.length > 0) {
        let topGoal = goals[0];
        let p = topGoal.priority ? topGoal.priority.toUpperCase() : "MEDIUM";
        candidateActivities.push({
            activity_type: "afternoon_goal",
            title: topGoal.title,
            description: `Goal progress: ${topGoal.current_progress} / ${topGoal.target_value}. Take the next step!`,
            priority: p,
            estimated_minutes: 15,
            reason: "Small daily actions create long-term success."
        });
    }

    if (pendingHabits.length > 0) {
        let topHabit = pendingHabits[0];
        candidateActivities.push({
            activity_type: "afternoon_habit",
            title: topHabit.name,
            description: "Complete your habit for today.",
            priority: "HIGH",
            estimated_minutes: 5,
            reason: topHabit.streak > 0 ? `You are on a streak of ${topHabit.streak} days! 🔥` : "Building new habits takes consistency."
        });
    }

    if (!hasFocusToday) {
        if (score < 40 || moodCategory === "low") {
            candidateActivities.push({
                activity_type: "afternoon_focus",
                title: "5-Minute Light Focus",
                description: "Just a short 5-minute burst to get one small thing done without overwhelm.",
                priority: "LOW",
                estimated_minutes: 5,
                reason: "Taking it easy while staying slightly productive."
            });
        } else {
            let mins = (score > 70 || moodCategory === "positive") ? 25 : 10;
            candidateActivities.push({
                activity_type: "afternoon_focus",
                title: `${mins}-Minute Focus Session`,
                description: "Use the timer to concentrate deeply on an important task.",
                priority: "MEDIUM",
                estimated_minutes: mins,
                reason: "Perfect time for a focused deep-work block."
            });
        }
    }

    // ----- EVENING -----
    if (!recentJournal) {
        candidateActivities.push({
            activity_type: "evening_journal",
            title: "Write what's on your mind",
            description: "Express your honest thoughts freely in your journal.",
            priority: "HIGH",
            estimated_minutes: 10,
            reason: "Writing helps untangle swirling thoughts."
        });
    } else {
        candidateActivities.push({
            activity_type: "evening_reflection",
            title: "Meaningful Follow-up Reflection",
            description: "Answer a short thoughtful prompt to gain perspective on your recent entries.",
            priority: "MEDIUM",
            estimated_minutes: 5,
            reason: "Deepen your understanding of your recent thoughts."
        });
    }
    
    candidateActivities.push({
        activity_type: "evening_gratitude",
        title: "Gratitude & Tomorrow Prep",
        description: "Think of one good thing from today and mentally prepare for tomorrow.",
        priority: "LOW",
        estimated_minutes: 3,
        reason: "End the day with positive framing."
    });
    
    // Always insert/update the daily plan for today
    await db.promise().query(
        `INSERT INTO daily_plans (user_id, plan_date, wellness_score, primary_focus, plan_summary, completion_percentage) 
         VALUES (?, ?, ?, ?, ?, 0) 
         ON DUPLICATE KEY UPDATE 
         wellness_score = VALUES(wellness_score), 
         primary_focus = VALUES(primary_focus), 
         plan_summary = VALUES(plan_summary)`,
        [userId, today, score, primaryFocus, summary]
    );
    
    const [planRes] = await db.promise().query("SELECT id FROM daily_plans WHERE user_id = ? AND plan_date = ?", [userId, today]);
    const planId = planRes[0].id;
    
    // Delete old items if regenerating
    await db.promise().query("DELETE FROM daily_plan_items WHERE daily_plan_id = ?", [planId]);
    
    // Insert new items
    for (let act of candidateActivities) {
        await db.promise().query(
            `INSERT INTO daily_plan_items (daily_plan_id, user_id, activity_type, title, description, priority, estimated_minutes, reason, completed)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
            [planId, userId, act.activity_type, act.title, act.description, act.priority, act.estimated_minutes, act.reason]
        );
    }
    
    await updatePlanProgress(planId);
    return planId;
}

// Helper for completing/uncompleting items
async function updatePlanProgress(planId) {
    const [items] = await db.promise().query("SELECT completed, skipped FROM daily_plan_items WHERE daily_plan_id = ?", [planId]);
    const activeItems = items.filter(i => !i.skipped);
    if (activeItems.length === 0) return 0;
    
    const completedCount = activeItems.filter(i => i.completed).length;
    const percentage = Math.round((completedCount / activeItems.length) * 100);
    
    await db.promise().query("UPDATE daily_plans SET completion_percentage = ? WHERE id = ?", [percentage, planId]);
    return percentage;
}

// GET /api/daily-plan
router.get("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().slice(0, 10);
        
        let [planRes] = await db.promise().query("SELECT * FROM daily_plans WHERE user_id = ? AND plan_date = ?", [userId, today]);
        
        if (planRes.length === 0) {
            const newPlanId = await generatePlanForUser(userId);
            [planRes] = await db.promise().query("SELECT * FROM daily_plans WHERE id = ?", [newPlanId]);
        }
        
        const plan = planRes[0];
        
        const [items] = await db.promise().query("SELECT * FROM daily_plan_items WHERE daily_plan_id = ? ORDER BY id ASC", [plan.id]);
        
        res.json({
            success: true,
            plan: plan,
            activities: items,
            totalActivities: items.length,
            completedActivities: items.filter(i => i.completed).length
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error retrieving daily plan: " + err.message, stack: err.stack });
    }
});

// POST /api/daily-plan/generate
router.post("/generate", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        await generatePlanForUser(userId);
        
        const today = new Date().toISOString().slice(0, 10);
        const [planRes] = await db.promise().query("SELECT * FROM daily_plans WHERE user_id = ? AND plan_date = ?", [userId, today]);
        const plan = planRes[0];
        const [items] = await db.promise().query("SELECT * FROM daily_plan_items WHERE daily_plan_id = ? ORDER BY id ASC", [plan.id]);
        
        res.json({
            success: true,
            plan: plan,
            activities: items
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error generating daily plan." });
    }
});

// PUT /api/daily-plan/items/:id/complete
router.put("/items/:id/complete", verifyToken, async (req, res) => {
    try {
        const itemId = req.params.id;
        const userId = req.user.id;
        
        const [itemCheck] = await db.promise().query("SELECT daily_plan_id FROM daily_plan_items WHERE id = ? AND user_id = ?", [itemId, userId]);
        if (itemCheck.length === 0) return res.status(404).json({ success: false, message: "Activity not found." });
        
        const planId = itemCheck[0].daily_plan_id;
        
        await db.promise().query("UPDATE daily_plan_items SET completed = TRUE, completed_at = CURRENT_TIMESTAMP WHERE id = ?", [itemId]);
        const newProgress = await updatePlanProgress(planId);
        
        try {
            await awardXP(userId, 5, "Daily Plan activity", "daily_plan_activity", itemId);
            if (newProgress === 100) {
                await awardXP(userId, 20, "Daily Plan fully completed", "daily_plan_full", planId);
            }
            evaluateAchievements(userId, () => {});
        } catch(e) {
            console.error("XP award error in daily plan:", e);
        }
        
        res.json({ success: true, completion_percentage: newProgress });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error completing item." });
    }
});

// PUT /api/daily-plan/items/:id/uncomplete
router.put("/items/:id/uncomplete", verifyToken, async (req, res) => {
    try {
        const itemId = req.params.id;
        const userId = req.user.id;
        
        const [itemCheck] = await db.promise().query("SELECT daily_plan_id FROM daily_plan_items WHERE id = ? AND user_id = ?", [itemId, userId]);
        if (itemCheck.length === 0) return res.status(404).json({ success: false, message: "Activity not found." });
        
        const planId = itemCheck[0].daily_plan_id;
        
        await db.promise().query("UPDATE daily_plan_items SET completed = FALSE, completed_at = NULL WHERE id = ?", [itemId]);
        const newProgress = await updatePlanProgress(planId);
        
        res.json({ success: true, completion_percentage: newProgress });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error uncompleting item." });
    }
});

// PUT /api/daily-plan/items/:id/skip
router.put("/items/:id/skip", verifyToken, async (req, res) => {
    try {
        const itemId = req.params.id;
        const userId = req.user.id;
        
        const [itemCheck] = await db.promise().query("SELECT daily_plan_id FROM daily_plan_items WHERE id = ? AND user_id = ?", [itemId, userId]);
        if (itemCheck.length === 0) return res.status(404).json({ success: false, message: "Activity not found." });
        
        const planId = itemCheck[0].daily_plan_id;
        
        // Skip by marking skipped = TRUE so it no longer counts against progress but remains for analytics
        await db.promise().query("UPDATE daily_plan_items SET skipped = TRUE WHERE id = ?", [itemId]);
        const newProgress = await updatePlanProgress(planId);
        
        res.json({ success: true, completion_percentage: newProgress });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error skipping item." });
    }
});

// GET /api/daily-plan/history
router.get("/history", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [history] = await db.promise().query(
            "SELECT * FROM daily_plans WHERE user_id = ? ORDER BY plan_date DESC LIMIT 30", 
            [userId]
        );
        res.json({ success: true, history: history });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error retrieving daily plan history." });
    }
});

module.exports = router;
