const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");

const router = express.Router();


// =====================================================
// DETERMINISTIC RECOMMENDATION ENGINE
// Generates 3–5 personalized, non-clinical wellness recommendations
// =====================================================

function buildDailyRecommendations(userId, callback) {

    const todayDateStr = new Date().toISOString().slice(0, 10);
    const hour = new Date().getHours();

    // Time of day label
    const timeOfDay = hour < 12 ? "morning" : (hour < 17 ? "afternoon" : "evening");

    // Queries to gather user context
    const queries = {
        user: null,
        prefs: null,
        todayMood: null,
        recentMoods: [],
        todayJournalCount: 0,
        todayReflectionCount: 0,
        todayGoalCount: 0,
        todayMeditationCount: 0,
        todayBreathingCount: 0,
        todayRelaxCount: 0,
        achievementsProgress: []
    };

    let pending = 8;
    function queryDone() {
        pending--;
        if (pending === 0) runEngine();
    }

    // 1. User details & streak
    db.query("SELECT id AS user_id, name, email FROM users WHERE id = ?", [userId], (e, r) => {
        if (!e && r && r[0]) queries.user = r[0];
        queryDone();
    });

    // 2. Preferences
    db.query("SELECT * FROM user_preferences WHERE user_id = ?", [userId], (e, r) => {
        if (!e && r && r[0]) {
            const row = r[0];
            try { row.wellness_goals = JSON.parse(row.wellness_goals || "[]"); } catch (err) { row.wellness_goals = []; }
            try { row.favorite_activities = JSON.parse(row.favorite_activities || "[]"); } catch (err) { row.favorite_activities = []; }
            queries.prefs = row;
        }
        queryDone();
    });

    // 3. Moods (latest & recent 7 days + today's mood)
    const moodSql = `
        SELECT
            mood_id AS id,
            mood,
            mood_icon AS icon,
            mood_date,
            created_at,
            (CASE WHEN (mood_date = CURDATE() OR DATE(created_at) = CURDATE()) THEN 1 ELSE 0 END) AS is_today
        FROM moods
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 10
    `;
    db.query(moodSql, [userId], (e, r) => {
        if (!e && r && r.length > 0) {
            queries.recentMoods = r;
            // Check if latest mood was logged today
            const todayItem = r.find(item => item.is_today === 1 || Number(item.is_today) === 1);
            if (todayItem) {
                queries.todayMood = todayItem;
            } else {
                const now = new Date();
                const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                const first = r[0];
                const mDate = first.mood_date ? (typeof first.mood_date === "string" ? first.mood_date.slice(0, 10) : `${first.mood_date.getFullYear()}-${String(first.mood_date.getMonth() + 1).padStart(2, "0")}-${String(first.mood_date.getDate()).padStart(2, "0")}`) : "";
                const cDate = first.created_at ? (typeof first.created_at === "string" ? first.created_at.slice(0, 10) : `${first.created_at.getFullYear()}-${String(first.created_at.getMonth() + 1).padStart(2, "0")}-${String(first.created_at.getDate()).padStart(2, "0")}`) : "";
                if (mDate === todayLocal || cDate === todayLocal || mDate === todayDateStr || cDate === todayDateStr) {
                    queries.todayMood = first;
                }
            }
        }
        queryDone();
    });

    // 4. Journals logged today
    const journalSql = `
        SELECT journal_id AS id, journal_date, created_at,
               (CASE WHEN (journal_date = CURDATE() OR DATE(created_at) = CURDATE()) THEN 1 ELSE 0 END) AS is_today
        FROM journals
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 20
    `;
    db.query(journalSql, [userId], (e, r) => {
        if (!e && r) {
            const now = new Date();
            const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            const todayJournals = r.filter(item => {
                if (item.is_today === 1 || Number(item.is_today) === 1) return true;
                const jDate = item.journal_date ? (typeof item.journal_date === "string" ? item.journal_date.slice(0, 10) : `${item.journal_date.getFullYear()}-${String(item.journal_date.getMonth() + 1).padStart(2, "0")}-${String(item.journal_date.getDate()).padStart(2, "0")}`) : "";
                const cDate = item.created_at ? (typeof item.created_at === "string" ? item.created_at.slice(0, 10) : `${item.created_at.getFullYear()}-${String(item.created_at.getMonth() + 1).padStart(2, "0")}-${String(item.created_at.getDate()).padStart(2, "0")}`) : "";
                return jDate === todayLocal || cDate === todayLocal || jDate === todayDateStr || cDate === todayDateStr;
            });
            queries.todayJournalCount = todayJournals.length;
        }
        queryDone();
    });

    // 5. Reflections logged today
    const refSql = `
        SELECT reflection_id AS id, reflection_date, created_at,
               (CASE WHEN (reflection_date = CURDATE() OR DATE(created_at) = CURDATE()) THEN 1 ELSE 0 END) AS is_today
        FROM reflections
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 20
    `;
    db.query(refSql, [userId], (e, r) => {
        if (!e && r) {
            const now = new Date();
            const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            const todayRefs = r.filter(item => {
                if (item.is_today === 1 || Number(item.is_today) === 1) return true;
                const rDate = item.reflection_date ? (typeof item.reflection_date === "string" ? item.reflection_date.slice(0, 10) : `${item.reflection_date.getFullYear()}-${String(item.reflection_date.getMonth() + 1).padStart(2, "0")}-${String(item.reflection_date.getDate()).padStart(2, "0")}`) : "";
                const cDate = item.created_at ? (typeof item.created_at === "string" ? item.created_at.slice(0, 10) : `${item.created_at.getFullYear()}-${String(item.created_at.getMonth() + 1).padStart(2, "0")}-${String(item.created_at.getDate()).padStart(2, "0")}`) : "";
                return rDate === todayLocal || cDate === todayLocal || rDate === todayDateStr || cDate === todayDateStr;
            });
            queries.todayReflectionCount = todayRefs.length;
        }
        queryDone();
    });

    // 6. Goals completed today
    db.query("SELECT COUNT(*) AS c FROM goals WHERE user_id = ? AND completed = 1 AND (target_date = CURDATE() OR DATE(created_at) = CURDATE() OR completed_date = CURDATE())", [userId], (e, r) => {
        if (!e && r && r[0]) queries.todayGoalCount = r[0].c;
        queryDone();
    });

    // 7. Wellness activities logged today
    const actSql = `
        SELECT id, activity_type, activity_name, created_at,
               (CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS is_today
        FROM wellness_activity_log
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 40
    `;
    db.query(actSql, [userId], (e, r) => {
        if (!e && r) {
            const now = new Date();
            const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            r.forEach(row => {
                const type = String(row.activity_type || "").toLowerCase().trim();
                const name = String(row.activity_name || "").toLowerCase().trim();
                const rowDate = row.created_at ? (typeof row.created_at === "string" ? row.created_at.slice(0, 10) : `${row.created_at.getFullYear()}-${String(row.created_at.getMonth() + 1).padStart(2, "0")}-${String(row.created_at.getDate()).padStart(2, "0")}`) : "";
                const isToday = row.is_today === 1 || Number(row.is_today) === 1 || rowDate === todayLocal || rowDate === todayDateStr;
                if (isToday) {
                    if (type === "meditation" || type.includes("meditat") || name.includes("meditat")) queries.todayMeditationCount++;
                    if (type === "breathing" || type.includes("breath") || type.includes("478") || type.includes("box") || name.includes("breath")) queries.todayBreathingCount++;
                    if (type === "relaxation" || type.includes("relax") || name.includes("relax")) queries.todayRelaxCount++;
                }
            });
        }
        queryDone();
    });

    // 8. Achievements total counts for proximity checks
    const achCountsSql = `
        SELECT
            (SELECT COUNT(*) FROM reflections WHERE user_id = ?) AS reflections,
            (SELECT COUNT(*) FROM journals WHERE user_id = ?) AS journals,
            (SELECT COUNT(*) FROM goals WHERE user_id = ? AND completed = 1) AS goals,
            (SELECT COUNT(*) FROM wellness_activity_log WHERE user_id = ? AND activity_type = 'meditation') AS meditations,
            (SELECT COUNT(*) FROM wellness_activity_log WHERE user_id = ? AND activity_type = 'breathing') AS breathings
    `;
    db.query(achCountsSql, [userId, userId, userId, userId, userId], (e, r) => {
        if (!e && r && r[0]) queries.achCounts = r[0];
        queryDone();
    });

    function runEngine() {
        const streak = queries.user ? (queries.user.streak || 0) : 0;
        const prefs = queries.prefs || {};
        const favActs = Array.isArray(prefs.favorite_activities) ? prefs.favorite_activities.map(a => a.toLowerCase()) : [];
        const goalsList = Array.isArray(prefs.wellness_goals) ? prefs.wellness_goals : [];
        const medDuration = prefs.meditation_duration || 5;
        const breathingStyle = prefs.breathing_exercise || "box";

        const todayMood = queries.todayMood;
        const recentMoods = queries.recentMoods || [];
        const achCounts = queries.achCounts || { reflections: 0, journals: 0, goals: 0, meditations: 0, breathings: 0 };

        // Determine mood category
        let moodCategory = "none";
        let moodName = "";
        if (todayMood && todayMood.mood) {
            moodName = todayMood.mood.toLowerCase();
            if (["happy", "great", "excited", "good"].includes(moodName)) moodCategory = "positive";
            else if (["anxious", "angry", "terrible"].includes(moodName)) moodCategory = "anxious";
            else if (["sad", "tired", "neutral", "okay"].includes(moodName)) moodCategory = "low";
            else moodCategory = "neutral";
        } else if (recentMoods.length > 0) {
            const lastMoodName = (recentMoods[0].mood || "").toLowerCase();
            if (["happy", "great", "excited", "good"].includes(lastMoodName)) moodCategory = "positive";
            else if (["anxious", "angry", "terrible"].includes(lastMoodName)) moodCategory = "anxious";
            else if (["sad", "tired"].includes(lastMoodName)) moodCategory = "low";
        }

        // Today checklist calculation for the 5 core activities:
        // 1. Mood Check-in
        // 2. Journal Entry
        // 3. Self Reflection
        // 4. Meditation Session
        // 5. Breathing Practice
        const completedChecks = {
            mood: Boolean(queries.todayMood),
            journal: queries.todayJournalCount > 0,
            reflection: queries.todayReflectionCount > 0,
            meditation: queries.todayMeditationCount > 0,
            breathing: queries.todayBreathingCount > 0
        };

        const totalPlannedActivities = 5;
        const completedTotal = [
            completedChecks.mood,
            completedChecks.journal,
            completedChecks.reflection,
            completedChecks.meditation,
            completedChecks.breathing
        ].filter(Boolean).length;
        const dailyScorePct = Math.min(100, completedTotal * 20); // 0% -> 20% -> 40% -> 60% -> 80% -> 100%

        // Candidate Pool of Recommendations
        const candidatePool = [];

        // Rule 1: Mood Check-in
        if (!completedChecks.mood) {
            candidatePool.push({
                id: "rec_mood",
                icon: "😊",
                title: "Daily Mood Check-in",
                description: "Take a moment to pause and notice how you're feeling right now.",
                estimated_minutes: "1 min",
                reason: "Because you haven't recorded your mood check-in today.",
                category: "mood",
                target_section: "#mood",
                is_completed: false,
                action: "Check In",
                priority: (moodCategory === "anxious" || moodCategory === "low") ? "HIGH" : "MEDIUM"
            });
        }

        // Rule 2: Breathing Exercise
        let breathTitle = breathingStyle === "478" ? "4-7-8 Deep Relaxation Breathing" : "Box Breathing Focus";
        let breathReason = "To help create mental clarity and calm your nervous system.";
        let breathPriority = "LOW";
        if (moodCategory === "anxious") {
            breathReason = "Because your mood was marked as tense/anxious today — rhythmic breathing relieves physical tension.";
            breathPriority = "HIGH";
        } else if (achCounts.breathings === 4) {
            breathReason = "1 more breathing session to unlock the Breathing Pro badge! 🌬️";
            breathPriority = "MEDIUM";
        } else if (favActs.some(a => a.includes("breath"))) {
            breathReason = "Because breathing exercises are in your favorite wellness activities.";
            breathPriority = "LOW";
        }

        candidatePool.push({
            id: "rec_breathing",
            icon: "🌬️",
            title: breathTitle,
            description: "Follow the gentle rhythmic expanding circle to regulate your breath.",
            estimated_minutes: "2 min",
            reason: breathReason,
            category: "self-care",
            target_section: "#resources",
            tab_name: "breathing",
            is_completed: completedChecks.breathing,
            action: completedChecks.breathing ? "Completed ✓" : "Start Breathing",
            priority: breathPriority
        });

        // Rule 3: Meditation Session
        let medTitle = `${medDuration}-Minute Mindful Meditation`;
        let medReason = "A quiet pause to center your thoughts and restore energy.";
        let medPriority = "LOW";
        if (achCounts.meditations === 4) {
            medReason = "1 more meditation session to unlock the Calm Mind badge! 🧘";
            medPriority = "MEDIUM";
        } else if (favActs.some(a => a.includes("meditat"))) {
            medReason = "Because meditation is one of your preferred mindful activities.";
            medPriority = "LOW";
        } else if (streak >= 1 && completedTotal === 0) {
            medReason = "Keep your streak going 🌱 One short meditation today is enough.";
            medPriority = "MEDIUM";
        }

        candidatePool.push({
            id: "rec_meditation",
            icon: "🧘",
            title: medTitle,
            description: `A gentle ${medDuration}-minute meditation with soothing interval cues.`,
            estimated_minutes: `${medDuration} min`,
            reason: medReason,
            category: "focus",
            target_section: "#resources",
            tab_name: "meditation",
            is_completed: completedChecks.meditation,
            action: completedChecks.meditation ? "Completed ✓" : "Start Timer",
            priority: medPriority
        });

        // Rule 4: Self Reflection Prompt
        let refReason = "To check in with your inner self and foster gratitude.";
        let refTitle = "Daily Self-Reflection";
        let refPriority = "LOW";
        if (moodCategory === "low") {
            refReason = "Because you've been feeling down recently — gentle self-compassion helps lighten the weight.";
            refTitle = "Self-Compassion Reflection";
            refPriority = "HIGH";
        } else if (moodCategory === "positive") {
            refReason = "Because you're in a great space today — reflect on what brought you joy!";
            refTitle = "Joy & Gratitude Reflection";
            refPriority = "MEDIUM";
        } else if (achCounts.reflections === 0) {
            refReason = "Complete your first reflection to unlock the First Reflection badge! 🌱";
            refPriority = "MEDIUM";
        }

        candidatePool.push({
            id: "rec_reflection",
            icon: "🌱",
            title: refTitle,
            description: "Answer a short thoughtful prompt to gain perspective on your day.",
            estimated_minutes: "3 min",
            reason: refReason,
            category: "reflection",
            target_section: "#reflection",
            is_completed: completedChecks.reflection,
            action: completedChecks.reflection ? "Completed ✓" : "Reflect Now",
            priority: refPriority
        });

        // Rule 5: Mindful Journaling
        let journalReason = "Writing helps untangle swirling thoughts and release stress.";
        let journalPriority = "MEDIUM";
        if (achCounts.journals === 4) {
            journalReason = "Write 1 more journal entry to unlock the Journal Keeper badge! 📔";
            journalPriority = "MEDIUM";
        } else if (favActs.some(a => a.includes("journal"))) {
            journalReason = "Because journaling is listed in your profile preferences.";
            journalPriority = "LOW";
        }

        candidatePool.push({
            id: "rec_journal",
            icon: "📔",
            title: "Mindful Journal Entry",
            description: "Express your honest thoughts freely in your private, encrypted journal.",
            estimated_minutes: "4 min",
            reason: journalReason,
            category: "journal",
            target_section: "#journal",
            is_completed: completedChecks.journal,
            action: completedChecks.journal ? "Completed ✓" : "Open Journal",
            priority: journalPriority
        });

        // Rule 6: Daily Wellness Goal / Challenge
        if (!completedChecks.goal) {
            candidatePool.push({
                id: "rec_goal",
                icon: "🎯",
                title: "Daily Wellness Challenge",
                description: "Complete one small micro-goal to build momentum and maintain your streak.",
                estimated_minutes: "2 min",
                reason: streak >= 3 ? `Because you are maintaining an awesome ${streak}-day streak! 🔥` : "Small daily actions create long-term well-being.",
                category: "goals",
                target_section: "#goals",
                is_completed: false,
                action: "View Challenge",
                priority: "MEDIUM"
            });
        }

        // Rule 7: Evening Relaxation / Sound (if evening)
        if (timeOfDay === "evening" || moodCategory === "anxious") {
            candidatePool.push({
                id: "rec_relaxation",
                icon: "✨",
                title: "Evening Tension Release",
                description: "Gentle progressive muscle relaxation and calming exercises to prepare for rest.",
                estimated_minutes: "3 min",
                reason: "Because evening is an ideal time to release somatic tension and improve sleep.",
                category: "self-care",
                target_section: "#resources",
                tab_name: "relaxation",
                is_completed: queries.todayRelaxCount > 0,
                action: (queries.todayRelaxCount > 0) ? "Completed ✓" : "Relax Now",
                priority: moodCategory === "anxious" ? "HIGH" : "MEDIUM"
            });
        }

        // Sort candidates: uncompleted high-priority first, prioritize user favorites
        candidatePool.sort((a, b) => {
            if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
            
            // Prioritize by HIGH > MEDIUM > LOW
            const priorityScore = { "HIGH": 3, "MEDIUM": 2, "LOW": 1 };
            if (priorityScore[a.priority] !== priorityScore[b.priority]) {
                return priorityScore[b.priority] - priorityScore[a.priority];
            }

            // Prioritize favorite activity
            const aFav = favActs.some(f => a.category.includes(f));
            const bFav = favActs.some(f => b.category.includes(f));
            if (aFav !== bFav) return aFav ? -1 : 1;
            return 0;
        });

        // Final candidate pool
        const allRecommendations = [...candidatePool];
        const topRecommendations = candidatePool.slice(0, 4);

        // Generate tailored Daily Reflection Prompt
        let dailyPrompt = "What is one small thing that helped you feel grounded today?";
        if (moodCategory === "anxious") {
            dailyPrompt = "What is one worry you can give yourself permission to set down this evening?";
        } else if (moodCategory === "low") {
            dailyPrompt = "What is one kind, compassionate thing you can say to yourself right now?";
        } else if (moodCategory === "positive") {
            dailyPrompt = "What made you smile or feel energized today, and how can you celebrate it?";
        } else if (timeOfDay === "morning") {
            dailyPrompt = "What is your main intention for how you want to feel throughout today?";
        } else if (timeOfDay === "evening") {
            dailyPrompt = "What is one thing you handled well today, no matter how small?";
        }

        const reasonsSummary = topRecommendations.map(r => r.reason);

        callback(null, {
            recommendations: allRecommendations,
            topRecommendations: topRecommendations,
            wellnessProgress: {
                percentage: dailyScorePct,
                completedCount: completedTotal,
                totalPlanned: totalPlannedActivities,
                completedItems: completedChecks,
                streak: streak,
                timeOfDay: timeOfDay,
                moodName: moodName || "Not recorded yet"
            },
            dailyPrompt: dailyPrompt,
            reasons: reasonsSummary
        });
    }

}


// =====================================================
// GET /api/recommendations/today
// Returns personalized daily plan
// JWT protected.
// =====================================================

router.get("/today", verifyToken, (req, res) => {

    const userId = req.user.id;

    buildDailyRecommendations(userId, (err, data) => {

        if (err) {
            console.error("Error building daily recommendations:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to generate recommendations"
            });
        }

        // Returns top 3 recommendations for the widget
        res.status(200).json({
            success: true,
            recommendations: data.topRecommendations.slice(0, 3)
        });

    });

});


// =====================================================
// GET /api/recommendations
// Returns all personalized recommendations
// JWT protected.
// =====================================================

router.get("/", verifyToken, (req, res) => {
    
    const userId = req.user.id;

    buildDailyRecommendations(userId, (err, data) => {

        if (err) {
            console.error("Error building recommendations:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to generate recommendations"
            });
        }

        res.status(200).json({
            success: true,
            recommendations: data.recommendations
        });

    });

});


// =====================================================
// POST /api/recommendations/:id/complete
// Since actual completion is handled by actual endpoints (e.g. logging a mood)
// This endpoint is just a generic passthrough if needed
// =====================================================
router.post("/:id/complete", verifyToken, (req, res) => {
    res.status(200).json({ success: true, message: "Recommendation action recorded." });
});


module.exports = router;
