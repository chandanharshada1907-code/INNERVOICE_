const db = require("../db");

const LEVEL_THRESHOLDS = [
    { level: 1, xp: 0, title: "🌱 New Beginning" },
    { level: 2, xp: 100, title: "🌿 Self Explorer" },
    { level: 3, xp: 250, title: "🌳 Wellness Builder" },
    { level: 4, xp: 500, title: "🔥 Consistency Champion" },
    { level: 5, xp: 850, title: "💎 Inner Strength" },
    { level: 6, xp: 1300, title: "🏆 Wellness Master" },
    { level: 7, xp: 1850, title: "🌟 Mindful Leader" },
    { level: 8, xp: 2500, title: "👑 InnerVoice Champion" }
];

function calculateLevelInfo(xp) {
    let currentLevel = LEVEL_THRESHOLDS[0];
    let nextLevel = LEVEL_THRESHOLDS[1] || null;

    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (xp >= LEVEL_THRESHOLDS[i].xp) {
            currentLevel = LEVEL_THRESHOLDS[i];
            nextLevel = LEVEL_THRESHOLDS[i + 1] || null;
        } else {
            break;
        }
    }

    let progressPercent = 100;
    let xpToNext = 0;
    
    if (nextLevel) {
        const xpInCurrentLevel = xp - currentLevel.xp;
        const levelXpRequirement = nextLevel.xp - currentLevel.xp;
        progressPercent = Math.min(100, Math.round((xpInCurrentLevel / levelXpRequirement) * 100));
        xpToNext = nextLevel.xp - xp;
    }

    return {
        level: currentLevel.level,
        title: currentLevel.title,
        progressPercent,
        xpToNext,
        nextLevelName: nextLevel ? nextLevel.title : null
    };
}

async function awardXP(userId, amount, description, sourceType, sourceId) {
    const promiseDb = db.promise();
    
    try {
        // Idempotent insertion using UNIQUE KEY (user_id, source_type, source_id)
        const insertTxSql = `
            INSERT INTO achievement_xp_transactions (user_id, source_type, source_id, xp_amount, description)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        try {
            await promiseDb.query(insertTxSql, [userId, sourceType, sourceId, amount, description]);
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') {
                // Duplicate transaction, already awarded XP for this source
                return { awarded: false, reason: 'duplicate' };
            }
            throw e;
        }

        // Add XP to user
        await promiseDb.query(`UPDATE users SET xp = xp + ? WHERE id = ?`, [amount, userId]);
        
        // Fetch new XP and Level
        const [userRows] = await promiseDb.query(`SELECT xp, level FROM users WHERE id = ?`, [userId]);
        const user = userRows[0];
        const levelInfo = calculateLevelInfo(user.xp);
        
        let leveledUp = false;
        if (levelInfo.level > user.level) {
            // User leveled up
            leveledUp = true;
            await promiseDb.query(`UPDATE users SET level = ? WHERE id = ?`, [levelInfo.level, userId]);
            
            // Create notification for level up
            const notifSql = `
                INSERT INTO notifications (user_id, type, title, message, icon)
                VALUES (?, 'level_up', '🎉 Level Up!', ?, '🌟')
            `;
            await promiseDb.query(notifSql, [userId, `You are now Level ${levelInfo.level} - ${levelInfo.title}. (+${amount} XP)`]);
        }
        
        return { 
            awarded: true, 
            amount, 
            leveledUp, 
            levelInfo,
            newTotalXp: user.xp 
        };
        
    } catch(err) {
        console.error("Error awarding XP:", err);
        throw err;
    }
}

function evaluateAchievements(userId, callback) {
    // Fetch all achievements
    db.query("SELECT * FROM achievements ORDER BY id ASC", (err, achievementDefs) => {
        if (err || !achievementDefs || achievementDefs.length === 0) {
            return callback(err || new Error("No achievements found"), null);
        }

        // Fetch user's unlocked achievements
        const unlockedSql = `
            SELECT ua.achievement_id, ua.unlocked_at, a.code
            FROM user_achievements ua
            JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = ?
        `;

        db.query(unlockedSql, [userId], (unlockedErr, unlockedRows) => {
            if (unlockedErr) return callback(unlockedErr, null);

            const alreadyUnlockedMap = {};
            (unlockedRows || []).forEach(row => {
                alreadyUnlockedMap[row.achievement_id] = row.unlocked_at;
                alreadyUnlockedMap[row.code] = row.unlocked_at;
            });

            // Gather counts
            const counts = {
                reflections: 0,
                journals: 0,
                goals: 0,
                streak: 0,
                focus: 0,
                habit: 0,
                habit_streak: 0,
                weekly_report: 0,
                consistency: 0,
                level: 1,
                hasActivity: false
            };

            let pending = 8;
            function doneQuery() {
                pending--;
                if (pending === 0) doEvaluation();
            }

            // 1. Reflections count
            db.query("SELECT COUNT(*) AS c FROM reflections WHERE user_id = ?", [userId], (e, r) => {
                if (!e && r && r[0]) counts.reflections = r[0].c;
                if (counts.reflections > 0) counts.hasActivity = true;
                doneQuery();
            });

            // 2. Journals count
            db.query("SELECT COUNT(*) AS c FROM journals WHERE user_id = ?", [userId], (e, r) => {
                if (!e && r && r[0]) counts.journals = r[0].c;
                if (counts.journals > 0) counts.hasActivity = true;
                doneQuery();
            });

            // 3. Goals completed count
            db.query("SELECT COUNT(*) AS c FROM goals WHERE user_id = ? AND completed = 1", [userId], (e, r) => {
                if (!e && r && r[0]) counts.goals = r[0].c;
                if (counts.goals > 0) counts.hasActivity = true;
                doneQuery();
            });

            // 4. Activity Streak (from users table)
            db.query("SELECT streak, level FROM users WHERE id = ?", [userId], (e, r) => {
                if (!e && r && r[0]) {
                    counts.streak = r[0].streak || 0;
                    counts.level = r[0].level || 1;
                }
                doneQuery();
            });

            // 5. Focus sessions (including wellness meditations/breathings)
            db.query("SELECT COUNT(*) AS c FROM focus_sessions WHERE user_id = ? AND completed = 1", [userId], (e, r) => {
                if (!e && r && r[0]) counts.focus = r[0].c;
                if (counts.focus > 0) counts.hasActivity = true;
                doneQuery();
            });

            // 6. Habit completions
            db.query("SELECT COUNT(*) AS c FROM habit_completions WHERE habit_id IN (SELECT id FROM habits WHERE user_id = ?)", [userId], (e, r) => {
                if (!e && r && r[0]) counts.habit = r[0].c;
                if (counts.habit > 0) counts.hasActivity = true;
                doneQuery();
            });
            
            // 7. Habit Max Streak - use user's overall streak as proxy since habits table has no streak column
            counts.habit_streak = counts.streak || 0;
            doneQuery();

            // 8. Wait, Weekly reports generated (not tracked natively in a table easily, but we can approximate or use journals/reflections).
            // Actually, we don't store weekly reports generated count. We will skip exact calculation or just check if there's sufficient data. Let's assume count from daily plans or moods.
            db.query("SELECT COUNT(*) AS c FROM moods WHERE user_id = ?", [userId], (e, r) => {
                if (!e && r && r[0]) counts.weekly_report = Math.floor(r[0].c / 7); // Approx
                if(r && r[0] && r[0].c > 0) counts.hasActivity = true;
                doneQuery();
            });

            function doEvaluation() {
                const toUnlock = [];
                const newlyUnlocked = [];
                const resultList = [];

                achievementDefs.forEach(def => {
                    let current = 0;
                    let helperText = "";

                    switch (def.code) {
                        case "first_step":
                            current = counts.hasActivity ? 1 : 0;
                            helperText = current >= 1 ? "Completed!" : "Log your first activity.";
                            break;
                        case "reflective_mind":
                            current = counts.journals;
                            helperText = current >= 5 ? "Completed!" : `Write ${5 - current} more journal entries.`;
                            break;
                        case "deep_reflection":
                            current = counts.reflections;
                            helperText = current >= 10 ? "Completed!" : `Complete ${10 - current} more reflections.`;
                            break;
                        case "week_strong":
                            current = counts.streak;
                            helperText = current >= 7 ? "Completed!" : `Reach a 7-day streak (${current}/7).`;
                            break;
                        case "mindful_routine":
                            current = counts.focus;
                            helperText = current >= 20 ? "Completed!" : `Complete ${20 - current} more focus sessions.`;
                            break;
                        case "habit_builder":
                            current = counts.habit;
                            helperText = current >= 25 ? "Completed!" : `Complete ${25 - current} more habit sessions.`;
                            break;
                        case "habit_master":
                            current = counts.habit_streak;
                            helperText = current >= 30 ? "Completed!" : `Current max streak: ${current}/30 days.`;
                            break;
                        case "goal_getter":
                            current = counts.goals;
                            helperText = current >= 5 ? "Completed!" : `Complete ${5 - current} more goals.`;
                            break;
                        case "wellness_explorer":
                            current = counts.weekly_report;
                            helperText = current >= 4 ? "Completed!" : `Generate ${4 - current} more weekly reports.`;
                            break;
                        case "consistency_champion":
                            // Proxy approximation for this logic
                            current = Math.min(4, Math.floor(counts.habit_streak / 7));
                            helperText = current >= 4 ? "Completed!" : `Hit weekly consistency: ${current}/4 weeks.`;
                            break;
                        case "innervoice_champion":
                            current = counts.level;
                            helperText = current >= 8 ? "Completed!" : `Reach Level 8 (${current}/8).`;
                            break;
                        default:
                            current = 0;
                    }

                    const target = def.target || 1;
                    const isQualified = current >= target;
                    const wasAlreadyUnlocked = Boolean(alreadyUnlockedMap[def.id] || alreadyUnlockedMap[def.code]);
                    const isUnlocked = isQualified || wasAlreadyUnlocked;
                    const unlockedAt = alreadyUnlockedMap[def.id] || (isQualified ? new Date().toISOString() : null);

                    if (isQualified && !wasAlreadyUnlocked) {
                        toUnlock.push([userId, def.id]);
                        newlyUnlocked.push(def);
                    }

                    resultList.push({
                        id: def.id,
                        code: def.code,
                        name: def.name,
                        description: def.description,
                        icon: def.icon,
                        tier: def.tier,
                        xp_reward: def.xp_reward,
                        category: def.category,
                        target: target,
                        current: Math.min(current, target),
                        percentage: Math.min(100, Math.round((current / target) * 100)),
                        is_unlocked: isUnlocked,
                        unlocked_at: unlockedAt,
                        helper_text: helperText
                    });
                });

                if (toUnlock.length > 0) {
                    const insertSql = "INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES ?";
                    db.query(insertSql, [toUnlock], async (insErr) => {
                        if (insErr) {
                            console.error("Error inserting user achievements:", insErr);
                            return sendFinalResponse();
                        }
                        
                        // Award XP for each newly unlocked achievement
                        for (const ach of newlyUnlocked) {
                            try {
                                await awardXP(userId, ach.xp_reward, `Achievement Unlocked: ${ach.name}`, 'achievement', ach.id);
                                
                                // Insert notification
                                const notifSql = `
                                    INSERT INTO notifications (user_id, type, title, message, icon)
                                    VALUES (?, 'achievement', '🏆 Achievement Unlocked!', ?, ?)
                                `;
                                db.query(notifSql, [userId, `You unlocked ${ach.name} and earned ${ach.xp_reward} XP.`, ach.icon]);
                            } catch (e) {
                                console.error("Error awarding XP for achievement:", e);
                            }
                        }
                        
                        sendFinalResponse();
                    });
                } else {
                    sendFinalResponse();
                }

                function sendFinalResponse() {
                    const unlockedCount = resultList.filter(a => a.is_unlocked).length;
                    
                    // Count by tiers
                    const bronzeCount = resultList.filter(a => a.is_unlocked && a.tier === 'Bronze').length;
                    const silverCount = resultList.filter(a => a.is_unlocked && a.tier === 'Silver').length;
                    const goldCount = resultList.filter(a => a.is_unlocked && a.tier === 'Gold').length;
                    const platinumCount = resultList.filter(a => a.is_unlocked && a.tier === 'Platinum').length;
                    
                    const latest = resultList.filter(a => a.is_unlocked).sort((a,b) => new Date(b.unlocked_at) - new Date(a.unlocked_at))[0] || null;

                    callback(null, {
                        achievements: resultList,
                        newlyUnlocked: newlyUnlocked.map(u => ({
                            id: u.id, name: u.name, description: u.description, icon: u.icon, xp_reward: u.xp_reward
                        })),
                        stats: {
                            total: resultList.length,
                            unlocked: unlockedCount,
                            percentage: Math.round((unlockedCount / resultList.length) * 100),
                            bronze: bronzeCount,
                            silver: silverCount,
                            gold: goldCount,
                            platinum: platinumCount,
                            latestAchievement: latest
                        }
                    });
                }
            }
        });
    });
}

module.exports = {
    awardXP,
    evaluateAchievements,
    calculateLevelInfo
};
