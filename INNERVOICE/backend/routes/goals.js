const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");
const { awardXP, evaluateAchievements } = require("../services/achievementService");

const router = express.Router();
const promiseDb = db.promise();

// ======================================
// DAILY CHALLENGES SUBSYSTEM
// ======================================

// Ensure user_daily_challenges table exists
async function initDailyChallengesTable() {
    try {
        await promiseDb.query(`
            CREATE TABLE IF NOT EXISTS user_daily_challenges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                challenge_code VARCHAR(100) DEFAULT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(50) DEFAULT 'Mindfulness',
                difficulty VARCHAR(20) DEFAULT 'Easy',
                xp_reward INT DEFAULT 20,
                target_value INT DEFAULT 1,
                current_progress INT DEFAULT 0,
                status ENUM('available', 'in_progress', 'completed') DEFAULT 'available',
                challenge_date DATE NOT NULL,
                completed_at TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY uq_user_challenge_day (user_id, challenge_code, challenge_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
    } catch (e) {
        console.warn("user_daily_challenges table init warning:", e.message);
    }
}
initDailyChallengesTable();

// Curated daily challenge pool by category
const DAILY_CHALLENGE_POOL = {
    "Mindfulness": [
        { code: "mindful_breath", title: "5-Minute Mindful Breath", description: "Complete a 5-minute breathing session to regulate and calm your nervous system.", difficulty: "Easy", xp: 20, target: 1 },
        { code: "body_scan", title: "Mindful Body Scan", description: "Practice a head-to-toe awareness meditation to release physical tension.", difficulty: "Medium", xp: 35, target: 1 },
        { code: "present_moment", title: "Present Moment Awareness", description: "Take 3 quiet minutes to observe your thoughts and surroundings without judgment.", difficulty: "Easy", xp: 20, target: 1 }
    ],
    "Fitness": [
        { code: "energy_stretch", title: "Morning Energy Stretch", description: "Perform a 5-minute gentle stretch to awaken your muscles and circulation.", difficulty: "Easy", xp: 20, target: 1 },
        { code: "outdoor_walk", title: "20-Minute Nature Walk", description: "Go for a brisk 20-minute walk outside in natural sunlight.", difficulty: "Medium", xp: 35, target: 1 },
        { code: "posture_reset", title: "Posture & Movement Reset", description: "Do 10 shoulder rolls and stand up to stretch after working.", difficulty: "Easy", xp: 20, target: 1 }
    ],
    "Gratitude": [
        { code: "three_gratitudes", title: "Three Gratitudes Journal", description: "Write down 3 specific things you are genuinely grateful for today.", difficulty: "Easy", xp: 20, target: 1 },
        { code: "appreciation_note", title: "Send an Appreciation Note", description: "Send a sincere message of encouragement or thanks to someone you care about.", difficulty: "Medium", xp: 35, target: 1 },
        { code: "self_compassion", title: "Self-Kindness Reflection", description: "Acknowledge one personal effort or win you made today with kindness.", difficulty: "Easy", xp: 20, target: 1 }
    ],
    "Productivity": [
        { code: "focus_session", title: "25-Minute Deep Focus Block", description: "Complete a distraction-free 25-minute Pomodoro focus session.", difficulty: "Medium", xp: 35, target: 1 },
        { code: "top_three", title: "Daily Top 3 Priorities", description: "Identify and complete your 3 most meaningful tasks for the day.", difficulty: "Easy", xp: 20, target: 1 },
        { code: "workspace_reset", title: "10-Minute Workspace Declutter", description: "Clear and organize your desk to create a calm working environment.", difficulty: "Easy", xp: 20, target: 1 }
    ],
    "Self-Care": [
        { code: "hydration_boost", title: "Hydration Boost (8 Glasses)", description: "Drink at least 2 liters (8 glasses) of water throughout the day.", difficulty: "Easy", xp: 20, target: 1 },
        { code: "screen_free_night", title: "1-Hour Screen-Free Wind Down", description: "Disconnect from all digital screens 1 hour before going to sleep.", difficulty: "Hard", xp: 50, target: 1 },
        { code: "relaxing_soundscape", title: "Evening Soundscape Relaxation", description: "Listen to a 10-minute calming music soundscape to quiet your mind.", difficulty: "Medium", xp: 35, target: 1 }
    ]
};

// Seed daily challenges for a user on a given date if not already seeded
async function seedDailyChallengesForUser(userId, dateStr) {
    const categories = Object.keys(DAILY_CHALLENGE_POOL);
    const daySeed = new Date(dateStr).getDate() || 1;

    for (let cat of categories) {
        const list = DAILY_CHALLENGE_POOL[cat];
        const template = list[(daySeed + categories.indexOf(cat)) % list.length];
        
        try {
            await promiseDb.query(`
                INSERT IGNORE INTO user_daily_challenges 
                (user_id, challenge_code, title, description, category, difficulty, xp_reward, target_value, current_progress, status, challenge_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'available', ?)
            `, [userId, template.code, template.title, template.description, cat, template.difficulty, template.xp, template.target, dateStr]);
        } catch (e) {
            console.error("Error seeding daily challenge:", e);
        }
    }
}

// ======================================
// GET /api/goals/challenges
// Get today's daily challenges (auto-seeds if new day)
// ======================================
router.get("/challenges", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const today = new Date().toISOString().slice(0, 10);

    try {
        await initDailyChallengesTable();

        // Check if challenges exist for today
        let [rows] = await promiseDb.query(`
            SELECT * FROM user_daily_challenges 
            WHERE user_id = ? AND challenge_date = ?
            ORDER BY 
                FIELD(status, 'in_progress', 'available', 'completed'),
                FIELD(difficulty, 'Easy', 'Medium', 'Hard'),
                id ASC
        `, [userId, today]);

        if (rows.length === 0) {
            await seedDailyChallengesForUser(userId, today);
            [rows] = await promiseDb.query(`
                SELECT * FROM user_daily_challenges 
                WHERE user_id = ? AND challenge_date = ?
                ORDER BY 
                    FIELD(status, 'in_progress', 'available', 'completed'),
                    FIELD(difficulty, 'Easy', 'Medium', 'Hard'),
                    id ASC
            `, [userId, today]);
        }

        // Calculate today's summary stats
        const total = rows.length;
        const completedCount = rows.filter(r => r.status === 'completed').length;
        const inProgressCount = rows.filter(r => r.status === 'in_progress').length;
        const xpEarnedToday = rows.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.xp_reward || 0), 0);

        // Fetch user streak & current total XP
        const [userRows] = await promiseDb.query("SELECT streak, xp, level FROM users WHERE id = ?", [userId]);
        const userStats = userRows[0] || { streak: 0, xp: 0, level: 1 };

        res.status(200).json({
            success: true,
            date: today,
            challenges: rows,
            stats: {
                total,
                completed: completedCount,
                inProgress: inProgressCount,
                xpEarnedToday,
                streak: userStats.streak,
                userXp: userStats.xp,
                userLevel: userStats.level
            }
        });
    } catch (err) {
        console.error("Error fetching daily challenges:", err);
        res.status(500).json({ success: false, message: "Failed to fetch daily challenges" });
    }
});

// ======================================
// POST /api/goals/challenges/:id/start
// Start a daily challenge
// ======================================
router.post("/challenges/:id/start", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const challengeId = parseInt(req.params.id, 10);

    if (isNaN(challengeId)) return res.status(400).json({ success: false, message: "Invalid challenge ID" });

    try {
        const [rows] = await promiseDb.query("SELECT * FROM user_daily_challenges WHERE id = ? AND user_id = ?", [challengeId, userId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Challenge not found" });

        const challenge = rows[0];
        if (challenge.status === 'completed') {
            return res.status(400).json({ success: false, message: "Challenge is already completed" });
        }

        await promiseDb.query("UPDATE user_daily_challenges SET status = 'in_progress' WHERE id = ?", [challengeId]);
        res.status(200).json({ success: true, message: "Challenge started! Give it your best." });
    } catch (err) {
        console.error("Error starting challenge:", err);
        res.status(500).json({ success: false, message: "Failed to start challenge" });
    }
});

// ======================================
// POST /api/goals/challenges/:id/complete
// Complete a daily challenge and award XP
// ======================================
router.post("/challenges/:id/complete", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const challengeId = parseInt(req.params.id, 10);

    if (isNaN(challengeId)) return res.status(400).json({ success: false, message: "Invalid challenge ID" });

    try {
        const [rows] = await promiseDb.query("SELECT * FROM user_daily_challenges WHERE id = ? AND user_id = ?", [challengeId, userId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Challenge not found" });

        const challenge = rows[0];

        // Idempotent protection against duplicate completions
        if (challenge.status === 'completed') {
            return res.status(200).json({ 
                success: true, 
                message: "Challenge already completed",
                alreadyCompleted: true,
                xpAwarded: 0
            });
        }

        // Mark challenge completed
        await promiseDb.query(`
            UPDATE user_daily_challenges 
            SET status = 'completed', current_progress = target_value, completed_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [challengeId]);

        // Award XP (Idempotent via achievementService)
        const xpAmount = challenge.xp_reward || 20;
        let xpResult = { awarded: true, amount: xpAmount };
        try {
            xpResult = await awardXP(userId, xpAmount, `Completed challenge: ${challenge.title}`, "daily_challenge", challengeId);
        } catch (xpErr) {
            console.warn("XP Award warning:", xpErr.message);
        }

        // Update user daily streak if this is the first challenge completed today
        const today = new Date().toISOString().slice(0, 10);
        try {
            const [completedTodayRows] = await promiseDb.query(`
                SELECT COUNT(*) as count FROM user_daily_challenges 
                WHERE user_id = ? AND challenge_date = ? AND status = 'completed'
            `, [userId, today]);

            if (completedTodayRows[0].count === 1) {
                // First completion today, check if streak should increment
                await promiseDb.query(`
                    UPDATE users 
                    SET streak = COALESCE(streak, 0) + 1 
                    WHERE id = ?
                `, [userId]);
            }
        } catch (streakErr) {
            console.warn("Streak update warning:", streakErr.message);
        }

        // Insert celebration notification
        try {
            await promiseDb.query(`
                INSERT INTO notifications (user_id, type, title, message, icon, link, priority)
                VALUES (?, 'challenge_completed', 'ðŸ† Daily Challenge Completed!', ?, 'ðŸŽ¯', '#goals', 'high')
            `, [userId, `You completed: ${challenge.title} (+${xpAmount} XP)`]);
        } catch (notifErr) { /* non-fatal */ }

        // Evaluate achievements
        try {
            evaluateAchievements(userId, () => {});
        } catch (achErr) { /* non-fatal */ }

        res.status(200).json({
            success: true,
            message: `ðŸŽ‰ Challenge completed! +${xpAmount} XP earned!`,
            xpAwarded: xpAmount,
            leveledUp: xpResult.leveledUp || false,
            newTotalXp: xpResult.newTotalXp
        });

    } catch (err) {
        console.error("Error completing challenge:", err);
        res.status(500).json({ success: false, message: "Failed to complete challenge" });
    }
});

// ======================================
// GET /api/goals/challenges/history
// Get challenge completion history
// ======================================
router.get("/challenges/history", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;

    try {
        await initDailyChallengesTable();
        const [rows] = await promiseDb.query(`
            SELECT id, title, description, category, difficulty, xp_reward, challenge_date, completed_at
            FROM user_daily_challenges
            WHERE user_id = ? AND status = 'completed'
            ORDER BY completed_at DESC, challenge_date DESC
            LIMIT 50
        `, [userId]);

        res.status(200).json({
            success: true,
            history: rows
        });
    } catch (err) {
        console.error("Error fetching challenge history:", err);
        res.status(500).json({ success: false, message: "Failed to fetch challenge history" });
    }
});

// ======================================
// POST /api/goals/challenges
// Create a custom daily challenge
// ======================================
router.post("/challenges", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    let { title, description, category, difficulty, xp_reward, target_value } = req.body;

    title = (title || "").trim();
    if (!title) return res.status(400).json({ success: false, message: "Title is required" });

    category = category || "Mindfulness";
    difficulty = difficulty || "Medium";
    xp_reward = parseInt(xp_reward, 10) || (difficulty === "Hard" ? 50 : difficulty === "Medium" ? 35 : 20);
    target_value = Math.max(1, parseInt(target_value, 10) || 1);
    const today = new Date().toISOString().slice(0, 10);
    const customCode = "custom_" + Date.now();

    try {
        await initDailyChallengesTable();
        const [result] = await promiseDb.query(`
            INSERT INTO user_daily_challenges 
            (user_id, challenge_code, title, description, category, difficulty, xp_reward, target_value, current_progress, status, challenge_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'available', ?)
        `, [userId, customCode, title, (description || "").trim(), category, difficulty, xp_reward, target_value, today]);

        res.status(201).json({
            success: true,
            message: "Custom daily challenge created!",
            challenge_id: result.insertId
        });
    } catch (err) {
        console.error("Error creating custom challenge:", err);
        res.status(500).json({ success: false, message: "Failed to create challenge" });
    }
});

// ======================================
// DELETE /api/goals/challenges/:id
// Delete a daily challenge
// ======================================
router.delete("/challenges/:id", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const challengeId = parseInt(req.params.id, 10);

    try {
        const [result] = await promiseDb.query("DELETE FROM user_daily_challenges WHERE id = ? AND user_id = ?", [challengeId, userId]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Challenge not found" });
        res.status(200).json({ success: true, message: "Challenge deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to delete challenge" });
    }
});


// ======================================
// WELLNESS GOALS SUBSYSTEM
// ======================================

// Helper: Calculate derived status
function getGoalStatus(goal) {
    if (goal.completed) return 'COMPLETED';
    const today = new Date().toISOString().split('T')[0];
    const target = goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : null;
    
    if (target && target < today) return 'OVERDUE';
    if (goal.current_progress > 0) return 'IN_PROGRESS';
    return 'NOT_STARTED';
}

// Helper: Auto-sync progress
async function syncAutomaticGoalProgress(goal, userId) {
    if (goal.tracking_type !== 'automatic') return goal.current_progress;
    
    const startDate = goal.created_at;
    let query = '';
    let params = [userId, startDate];
    
    const cat = (goal.category || '').toLowerCase();
    
    if (cat.includes('journal')) {
        query = `SELECT COUNT(*) as c FROM journals WHERE user_id = ? AND created_at >= ?`;
    } else if (cat.includes('mood')) {
        query = `SELECT COUNT(*) as c FROM moods WHERE user_id = ? AND created_at >= ?`;
    } else if (cat.includes('reflection')) {
        query = `SELECT COUNT(*) as c FROM reflections WHERE user_id = ? AND created_at >= ?`;
    } else if (cat.includes('focus')) {
        query = `SELECT COALESCE(SUM(duration), 0) as c FROM focus_sessions WHERE user_id = ? AND started_at >= ? AND completed = 1`;
    } else if (cat.includes('habit')) {
        query = `SELECT COUNT(*) as c FROM habit_completions WHERE user_id = ? AND completion_date >= DATE(?)`;
    }
    
    if (!query) return goal.current_progress;

    try {
        const [rows] = await promiseDb.query(query, params);
        return rows[0].c;
    } catch(err) {
        console.error("Error auto-syncing goal:", err);
        return goal.current_progress;
    }
}

// Helper: Evaluate milestones
async function checkMilestones(goalId, progress, userId) {
    const [milestones] = await promiseDb.query("SELECT * FROM goal_milestones WHERE goal_id = ?", [goalId]);
    let newlyCompleted = 0;
    
    for (const m of milestones) {
        if (!m.is_completed && progress >= m.target_value) {
            await promiseDb.query("UPDATE goal_milestones SET is_completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = ?", [m.id]);
            newlyCompleted++;
            
            const notifMsg = `You reached a milestone for your goal! Progress: ${progress}`;
            await promiseDb.query(`
                INSERT INTO notifications (user_id, type, title, message, icon, link, priority, reference_id)
                VALUES (?, 'goal_milestone', 'ðŸ† Milestone Reached', ?, 'ðŸ†', '#goals', 'medium', ?)
            `, [userId, notifMsg, `milestone_${m.id}`]);
        }
    }
    return newlyCompleted;
}

// ======================================
// GET /api/goals/summary
// Summary for Dashboard
// ======================================
router.get("/summary", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    try {
        const [goals] = await promiseDb.query("SELECT * FROM goals WHERE user_id = ?", [userId]);
        let total = goals.length;
        let active = 0, completed = 0, overdue = 0;
        
        goals.forEach(g => {
            const status = getGoalStatus(g);
            if (status === 'COMPLETED') completed++;
            else if (status === 'OVERDUE') overdue++;
            else active++;
        });

        res.json({
            success: true,
            total,
            active,
            completed,
            overdue,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching summary" });
    }
});

// ======================================
// GET /api/goals
// Get all goals + auto-sync progress + get milestones
// ======================================
router.get("/", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;

    try {
        const [goals] = await promiseDb.query(`
            SELECT goal_id AS id, goal_id, title AS challenge, title, description, 
                   category, priority, target_value, current_progress, tracking_type,
                   completed, target_date AS completed_date, target_date, created_at
            FROM goals
            WHERE user_id = ?
            ORDER BY completed ASC, target_date ASC, created_at DESC
        `, [userId]);

        const formattedGoals = [];
        for (let g of goals) {
            let newProgress = g.current_progress;
            
            // Auto Sync
            if (g.tracking_type === 'automatic' && !g.completed) {
                newProgress = await syncAutomaticGoalProgress(g, userId);
                if (newProgress !== g.current_progress) {
                    await promiseDb.query("UPDATE goals SET current_progress = ? WHERE goal_id = ?", [newProgress, g.goal_id]);
                    g.current_progress = newProgress;
                    await checkMilestones(g.goal_id, newProgress, userId);
                    
                    // Mark complete if target met
                    if (newProgress >= g.target_value && !g.completed) {
                        await promiseDb.query("UPDATE goals SET completed = 1, completed_date = CURRENT_TIMESTAMP WHERE goal_id = ?", [g.goal_id]);
                        g.completed = 1;
                        
                        await promiseDb.query(`
                            INSERT INTO notifications (user_id, type, title, message, icon, link, priority)
                            VALUES (?, 'goal_completed', 'ðŸŽ‰ Goal Completed', ?, 'ðŸŽ¯', '#goals', 'high')
                        `, [userId, `You completed your goal: ${g.title}`]);
                        
                        awardXP(userId, 25, "Goal completion", "goal", g.goal_id)
                            .then(() => evaluateAchievements(userId, () => {}))
                            .catch(e => console.error("XP award error:", e));
                    }
                }
            }

            g.status = getGoalStatus(g);
            
            // Get milestones
            const [milestones] = await promiseDb.query("SELECT * FROM goal_milestones WHERE goal_id = ? ORDER BY target_value ASC", [g.goal_id]);
            g.milestones = milestones;
            
            formattedGoals.push(g);
        }

        res.status(200).json({
            success: true,
            goals: formattedGoals
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to fetch goals" });
    }
});

// ======================================
// GET /api/goals/today
// ======================================
router.get("/today", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    try {
        const [results] = await promiseDb.query(`
            SELECT goal_id AS id, goal_id, title AS challenge, title, description, completed, target_date
            FROM goals WHERE user_id = ? AND (target_date = CURDATE() OR DATE(created_at) = CURDATE()) LIMIT 1
        `, [userId]);
        res.status(200).json({ success: true, completedToday: results.length > 0, goal: results[0] || null });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ======================================
// GET /api/goals/:id
// Get a single goal
// ======================================
router.get("/:id", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const goalId = parseInt(req.params.id, 10);
    if (isNaN(goalId)) return res.status(400).json({ success: false, message: "Invalid ID" });

    try {
        const [rows] = await promiseDb.query("SELECT * FROM goals WHERE goal_id = ? AND user_id = ?", [goalId, userId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Goal not found" });
        const goal = rows[0];
        
        goal.status = getGoalStatus(goal);
        const [milestones] = await promiseDb.query("SELECT * FROM goal_milestones WHERE goal_id = ? ORDER BY target_value ASC", [goalId]);
        goal.milestones = milestones;
        
        res.status(200).json({ success: true, goal });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch goal" });
    }
});

// ======================================
// POST /api/goals
// ======================================
router.post("/", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    let { title, challenge, description, category, priority, target_value, tracking_type, target_date } = req.body;

    title = (title || challenge || "").trim();
    if (!title) {
        return res.status(400).json({ success: false, message: "Goal title is required" });
    }

    category = category || "General";
    priority = priority || "medium";
    target_value = target_value ? parseInt(target_value) : 1;
    tracking_type = tracking_type || "manual";
    
    // Auto-detect target_date if missing (defaults to 7 days out)
    if (!target_date) {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        target_date = d.toISOString().split('T')[0];
    }

    const sql = `
        INSERT INTO goals (user_id, title, description, category, priority, target_value, tracking_type, target_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        const [result] = await promiseDb.query(sql, [
            userId,
            title,
            description || "",
            category,
            priority,
            target_value,
            tracking_type,
            target_date
        ]);

        res.status(201).json({
            success: true,
            message: "Goal created successfully!",
            goal_id: result.insertId,
            id: result.insertId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error saving goal" });
    }
});

// ======================================
// PUT /api/goals/:id
// Update progress or mark completed
// ======================================
router.put("/:id", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const goalId = parseInt(req.params.id, 10);
    if (isNaN(goalId)) return res.status(400).json({ success: false, message: "Invalid ID" });

    let { current_progress, completed, title, description, category, priority, target_value, target_date } = req.body;

    try {
        const [rows] = await promiseDb.query("SELECT * FROM goals WHERE goal_id = ? AND user_id = ?", [goalId, userId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Goal not found" });

        const existingGoal = rows[0];
        let newlyCompleted = false;

        // Build dynamic update
        let updates = [];
        let params = [];

        if (title !== undefined) { updates.push("title = ?"); params.push(title.trim()); }
        if (description !== undefined) { updates.push("description = ?"); params.push(description); }
        if (category !== undefined) { updates.push("category = ?"); params.push(category); }
        if (priority !== undefined) { updates.push("priority = ?"); params.push(priority); }
        if (target_value !== undefined) { updates.push("target_value = ?"); params.push(parseInt(target_value)); }
        if (target_date !== undefined) { updates.push("target_date = ?"); params.push(target_date); }

        if (current_progress !== undefined) {
            const prog = parseInt(current_progress);
            updates.push("current_progress = ?");
            params.push(prog);

            // Record progress history
            await promiseDb.query("INSERT INTO goal_progress_history (goal_id, progress_value, recorded_date) VALUES (?, ?, CURDATE()) ON DUPLICATE KEY UPDATE progress_value = ?", [goalId, prog, prog]);
            
            // Check milestones
            await checkMilestones(goalId, prog, userId);

            // Check if auto-completing
            if (prog >= existingGoal.target_value && !existingGoal.completed) {
                updates.push("completed = 1");
                updates.push("completed_date = CURRENT_TIMESTAMP");
                newlyCompleted = true;
            }
        }

        if (completed !== undefined) {
            const isComp = completed ? 1 : 0;
            updates.push("completed = ?");
            params.push(isComp);
            if (isComp && !existingGoal.completed) {
                updates.push("completed_date = CURRENT_TIMESTAMP");
                newlyCompleted = true;
            }
        }

        if (updates.length > 0) {
            params.push(goalId, userId);
            await promiseDb.query(`UPDATE goals SET ${updates.join(", ")} WHERE goal_id = ? AND user_id = ?`, params);
        }

        if (newlyCompleted) {
            await promiseDb.query(`
                INSERT INTO notifications (user_id, type, title, message, icon, link, priority)
                VALUES (?, 'goal_completed', 'ðŸŽ‰ Goal Completed', ?, 'ðŸŽ¯', '#goals', 'high')
            `, [userId, `You completed your goal: ${existingGoal.title}`]);

            awardXP(userId, 25, "Goal completion", "goal", goalId)
                .then(() => evaluateAchievements(userId, () => {}))
                .catch(e => console.error("XP award error:", e));
        }

        res.status(200).json({ success: true, message: "Goal updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to update goal" });
    }
});

// ======================================
// DELETE /api/goals/:id
// ======================================
router.delete("/:id", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const goalId = parseInt(req.params.id, 10);
    if (isNaN(goalId)) return res.status(400).json({ success: false, message: "Invalid ID" });

    try {
        const [result] = await promiseDb.query("DELETE FROM goals WHERE goal_id = ? AND user_id = ?", [goalId, userId]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Goal not found" });
        res.status(200).json({ success: true, message: "Goal deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to delete goal" });
    }
});

// ======================================
// POST /api/goals/:id/milestones
// ======================================
router.post("/:id/milestones", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const goalId = parseInt(req.params.id, 10);
    const { title, target_value } = req.body;
    
    if (!title || !target_value) return res.status(400).json({success: false, message: "Missing title or target"});

    try {
        const [rows] = await promiseDb.query("SELECT * FROM goals WHERE goal_id = ? AND user_id = ?", [goalId, userId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Goal not found" });

        const [result] = await promiseDb.query(
            "INSERT INTO goal_milestones (goal_id, title, target_value) VALUES (?, ?, ?)",
            [goalId, title.trim(), parseInt(target_value)]
        );
        res.status(201).json({ success: true, milestone_id: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// ======================================
// PUT /api/goals/milestones/:milestoneId/complete
// ======================================
router.put("/milestones/:milestoneId/complete", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;
    const milestoneId = parseInt(req.params.milestoneId, 10);

    try {
        const [rows] = await promiseDb.query(`
            SELECT m.* FROM goal_milestones m 
            JOIN goals g ON m.goal_id = g.goal_id 
            WHERE m.id = ? AND g.user_id = ?
        `, [milestoneId, userId]);
        
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Milestone not found" });

        await promiseDb.query("UPDATE goal_milestones SET is_completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = ?", [milestoneId]);
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

module.exports = router;
