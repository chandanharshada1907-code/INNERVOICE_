const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");

const router = express.Router();


// ======================================
// PUT /api/users/streak
// Update the authenticated user's streak
// in MySQL. JWT protected.
// Body: { streak }
// Only the logged-in user's own streak
// can be updated — user_id comes from
// the verified JWT payload, not the body.
// ======================================

router.put("/streak", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const { streak } = req.body;

    if (streak === undefined || isNaN(parseInt(streak, 10))) {
        return res.status(400).json({
            success: false,
            message: "streak (number) is required"
        });
    }

    const streakValue = parseInt(streak, 10);

    if (streakValue < 0) {
        return res.status(400).json({
            success: false,
            message: "streak cannot be negative"
        });
    }

    const sql = "UPDATE users SET streak = ? WHERE id = ?";

    db.query(sql, [streakValue, userId], (err, result) => {

        if (err) {
            console.error("Error updating streak:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to update streak: " + (err.sqlMessage || err.message)
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Streak updated",
            streak:  streakValue
        });

    });

});


// ======================================
// ENSURE user_preferences TABLE EXISTS
// ======================================

const CREATE_PREFERENCES_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS user_preferences (
        id                  INT AUTO_INCREMENT PRIMARY KEY,
        user_id             INT          NOT NULL UNIQUE,
        avatar              VARCHAR(100) DEFAULT '🌸',
        wellness_goals      TEXT,
        favorite_activities TEXT,
        meditation_duration INT          DEFAULT 5,
        breathing_exercise  VARCHAR(100) DEFAULT 'box',
        theme               VARCHAR(50)  DEFAULT 'light',
        language            VARCHAR(50)  DEFAULT 'en',
        reminder_preference VARCHAR(50)  DEFAULT 'none',
        created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
`;

db.query(CREATE_PREFERENCES_TABLE_SQL, (err) => {
    if (err) {
        console.error("Could not ensure user_preferences table:", err.message);
    } else {
        // Soft migration for existing tables
        db.query("ALTER TABLE user_preferences ADD COLUMN reminder_preference VARCHAR(50) DEFAULT 'none'", () => {});
        // user_preferences table ready
    }
});


// ======================================
// GET /api/users/profile
// Get authenticated user's profile & preferences
// JWT protected.
// ======================================

router.get("/profile", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const userSql = `
        SELECT id AS user_id, name, email, streak, created_at
        FROM users
        WHERE id = ?
    `;

    db.query(userSql, [userId], (err, userRows) => {

        if (err) {
            console.error("Error fetching user profile:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to load user profile: " + (err.sqlMessage || err.message)
            });
        }

        if (!userRows || userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = userRows[0];

        const prefSql = `
            SELECT avatar, wellness_goals, favorite_activities,
                   meditation_duration, breathing_exercise, theme, language, reminder_preference
            FROM user_preferences
            WHERE user_id = ?
        `;

        db.query(prefSql, [userId], (prefErr, prefRows) => {

            const prefs = (prefRows && prefRows.length > 0) ? prefRows[0] : {};

            let goals = [];
            if (prefs.wellness_goals) {
                try {
                    goals = JSON.parse(prefs.wellness_goals);
                } catch (e) {
                    goals = prefs.wellness_goals.split(",").map(s => s.trim()).filter(Boolean);
                }
            } else {
                goals = ["Reduce Daily Stress", "Build Daily Reflection Habit"];
            }

            let activities = [];
            if (prefs.favorite_activities) {
                try {
                    activities = JSON.parse(prefs.favorite_activities);
                } catch (e) {
                    activities = prefs.favorite_activities.split(",").map(s => s.trim()).filter(Boolean);
                }
            } else {
                activities = ["Meditation Timer", "Breathing Exercises", "Journal Writing"];
            }

            res.status(200).json({
                success: true,
                profile: {
                    id: user.user_id,
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email,
                    streak: user.streak || 0,
                    created_at: user.created_at,
                    avatar: prefs.avatar || "🌸",
                    wellness_goals: goals,
                    favorite_activities: activities,
                    meditation_duration: prefs.meditation_duration || 5,
                    breathing_exercise: prefs.breathing_exercise || "box",
                    theme: prefs.theme || "light",
                    language: prefs.language || "en",
                    reminder_preference: prefs.reminder_preference || "none"
                }
            });

        });

    });

});


// ======================================
// PUT /api/users/profile
// Update user profile and preferences
// JWT protected.
// ======================================

router.put("/profile", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const {
        name,
        avatar,
        wellness_goals,
        favorite_activities,
        meditation_duration,
        breathing_exercise,
        theme,
        language,
        reminder_preference
    } = req.body;

    if (name !== undefined && (!name || typeof name !== "string" || !name.trim())) {
        return res.status(400).json({
            success: false,
            message: "Name cannot be empty"
        });
    }

    const cleanName = name ? name.trim() : null;
    const cleanAvatar = avatar || "🌸";
    const cleanGoals = Array.isArray(wellness_goals) ? JSON.stringify(wellness_goals) : (wellness_goals || "[]");
    const cleanActivities = Array.isArray(favorite_activities) ? JSON.stringify(favorite_activities) : (favorite_activities || "[]");
    const cleanDuration = parseInt(meditation_duration, 10) || 5;
    const cleanBreathing = breathing_exercise || "box";
    const cleanTheme = theme || "light";
    const cleanLanguage = language || "en";
    const cleanReminder = reminder_preference || "none";

    // 1. Update user name if provided
    function savePreferences() {
        const upsertSql = `
            INSERT INTO user_preferences (
                user_id, avatar, wellness_goals, favorite_activities,
                meditation_duration, breathing_exercise, theme, language, reminder_preference
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                avatar = VALUES(avatar),
                wellness_goals = VALUES(wellness_goals),
                favorite_activities = VALUES(favorite_activities),
                meditation_duration = VALUES(meditation_duration),
                breathing_exercise = VALUES(breathing_exercise),
                theme = VALUES(theme),
                language = VALUES(language),
                reminder_preference = VALUES(reminder_preference)
        `;

        db.query(
            upsertSql,
            [userId, cleanAvatar, cleanGoals, cleanActivities, cleanDuration, cleanBreathing, cleanTheme, cleanLanguage, cleanReminder],
            (err) => {
                if (err) {
                    console.error("Error saving user preferences:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Failed to save user preferences: " + (err.sqlMessage || err.message)
                    });
                }

                let parsedGoals = [];
                try { parsedGoals = JSON.parse(cleanGoals); } catch (e) { parsedGoals = []; }

                let parsedActivities = [];
                try { parsedActivities = JSON.parse(cleanActivities); } catch (e) { parsedActivities = []; }

                res.status(200).json({
                    success: true,
                    message: "Profile updated successfully! 🌿",
                    profile: {
                        id: userId,
                        user_id: userId,
                        name: cleanName || req.user.name,
                        avatar: cleanAvatar,
                        wellness_goals: parsedGoals,
                        favorite_activities: parsedActivities,
                        meditation_duration: cleanDuration,
                        breathing_exercise: cleanBreathing,
                        theme: cleanTheme,
                        language: cleanLanguage,
                        reminder_preference: cleanReminder
                    }
                });
            }
        );
    }

    if (cleanName) {
        db.query("UPDATE users SET name = ? WHERE id = ?", [cleanName, userId], (err) => {
            if (err) {
                console.error("Error updating user name:", err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to update profile name: " + (err.sqlMessage || err.message)
                });
            }
            savePreferences();
        });
    } else {
        savePreferences();
    }

});


module.exports = router;
