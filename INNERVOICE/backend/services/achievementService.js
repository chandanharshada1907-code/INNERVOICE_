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
                moods: 0,
                reflections: 0,
                journals: 0,
                goals: 0,
                goals_created: 0,
                streak: 0,
                focus: 0,
                habit: 0,
                habit_streak: 0,
                weekly_report: 0,
                consistency: 0,
                chat: 0,
                user_xp: 0,
                level: 1,
                hasActivity: false
            };

            let pending = 9;
            function doneQuery() {
                pending--;
                if (pending === 0) doEvaluation();
            }

            // 1. Moods count
            db.query("SELECT COUNT(*) AS c FROM moods WHERE user_id = ?", [userId], (e, r) => {
                if (!e && r && r[0]) counts.moods = r[0].c;
                if (counts.moods > 0) counts.hasActivity = true;
                doneQuery();
            });

            // 2. Reflections count
            db.query("SELECT COUNT(*) AS c FROM reflections WHERE user_id = ?", [userId], (e, r) => {
                if (!e && r && r[0]) counts.reflections = r[0].c;
                if (counts.reflections > 0) counts.hasActivity = true;
                doneQuery();
            });

            // 3. Journals count
            db.query("SELECT COUNT(*) AS c FROM journals WHERE user_id = ?", [userId], (e, r) => {
                if (!e && r && r[0]) counts.journals = r[0].c;
                if (counts.journals > 0) counts.hasActivity = true;
                doneQuery();
            });

            // 4. Goals completed count
            db.query("SELECT COUNT(*) AS c FROM goals WHERE user_id = ? AND completed = 1", [userId], (e, r) => {
                if (!e && r && r[0]) counts.goals = r[0].c;
                if (counts.goals > 0) counts.hasActivity = true;
                doneQuery();
            });

            // 5. Goals created count
            db.query("SELECT COUNT(*) AS c FROM goals WHERE user_id = ?", [userId], (e, r) => {
                if (!e && r && r[0]) counts.goals_created = r[0].c;
                if (counts.goals_created > 0) counts.hasActivity = true;
                doneQuery();
            });

            // 6. User streak, xp, level
            db.query("SELECT streak, xp, level FROM users WHERE id = ?", [userId], (e, r) => {
                if (!e && r && r[0]) {
                    counts.streak = r[0].streak || 0;
                    counts.user_xp = r[0].xp || 0;
                    counts.level = r[0].level || 1;
                }
                doneQuery();
            });

            // 7. Focus sessions
            db.query("SELECT COUNT(*) AS c FROM focus_sessions WHERE user_id = ? AND completed = 1", [userId], (e, r) => {
                if (!e && r && r[0]) counts.focus = r[0].c;
                if (counts.focus > 0) counts.hasActivity = true;
                doneQuery();
            });

            // 8. Habit completions
            db.query("SELECT COUNT(*) AS c FROM habit_completions WHERE habit_id IN (SELECT id FROM habits WHERE user_id = ?)", [userId], (e, r) => {
                if (!e && r && r[0]) counts.habit = r[0].c;
                if (counts.habit > 0) counts.hasActivity = true;
                counts.habit_streak = counts.streak || 0;
                doneQuery();
            });

            // 9. AI Chat messages
            db.query("SELECT COUNT(*) AS c FROM chat_messages WHERE user_id = ?", [userId], (e, r) => {
                if (!e && r && r[0]) counts.chat = r[0].c;
                if (counts.chat > 0) counts.hasActivity = true;
                doneQuery();
            });

            function doEvaluation() {
                const toUnlock = [];
                const newlyUnlocked = [];
                const resultList = [];

                const META_BY_CODE = {
                    first_mood:       { name: 'First Feeling',    description: 'Log your very first mood',                  target: 1,   tier: 'Bronze', xp_reward: 20,  category: 'mood',        icon: '😊' },
                    mood_7:           { name: 'Week of Feelings', description: 'Log mood 7 days in a row',                  target: 7,   tier: 'Silver', xp_reward: 50,  category: 'mood',        icon: '🌈' },
                    mood_30:          { name: 'Mood Master',      description: 'Log mood for 30 days',                      target: 30,  tier: 'Gold',   xp_reward: 150, category: 'mood',        icon: '🏆' },
                    first_journal:    { name: 'Dear Diary',       description: 'Write your first journal entry',             target: 1,   tier: 'Bronze', xp_reward: 20,  category: 'journal',     icon: '📔' },
                    journal_10:       { name: 'Reflective Mind',  description: 'Write 10 journal entries',                   target: 10,  tier: 'Silver', xp_reward: 75,  category: 'journal',     icon: '✍️' },
                    first_goal:       { name: 'Goal Setter',      description: 'Create your first goal',                     target: 1,   tier: 'Bronze', xp_reward: 20,  category: 'goal',        icon: '🎯' },
                    goals_5:          { name: 'Achiever',         description: 'Complete 5 goals',                           target: 5,   tier: 'Silver', xp_reward: 50,  category: 'goal',        icon: '⭐' },
                    streak_3:         { name: 'Three-Day Streak', description: 'Maintain a 3-day wellness streak',           target: 3,   tier: 'Bronze', xp_reward: 30,  category: 'streak',      icon: '🔥' },
                    streak_7:         { name: 'Week Warrior',     description: 'Maintain a 7-day wellness streak',           target: 7,   tier: 'Silver', xp_reward: 70,  category: 'streak',      icon: '💪' },
                    streak_30:        { name: 'Monthly Champion', description: 'Maintain a 30-day wellness streak',          target: 30,  tier: 'Gold',   xp_reward: 200, category: 'streak',      icon: '👑' },
                    first_reflection: { name: 'Inner Voice',      description: 'Complete your first self-reflection',        target: 1,   tier: 'Bronze', xp_reward: 25,  category: 'reflection',  icon: '🪞' },
                    first_chat:       { name: 'Wellness Chat',    description: 'Have your first chat with the AI assistant', target: 1,   tier: 'Bronze', xp_reward: 20,  category: 'chat',        icon: '🤖' },
                    xp_100:           { name: 'XP Milestone',     description: 'Earn 100 XP through wellness activities',    target: 100, tier: 'Bronze', xp_reward: 50,  category: 'xp',          icon: '⚡' },
                    xp_500:           { name: 'XP Champion',      description: 'Earn 500 XP through wellness activities',    target: 500, tier: 'Silver', xp_reward: 100, category: 'xp',          icon: '💫' }
                };

                achievementDefs.forEach(def => {
                    let current = 0;
                    let helperText = "";

                    switch (def.code) {
                        case "first_mood":
                        case "first_step":
                            current = counts.moods >= 1 || counts.hasActivity ? 1 : 0;
                            helperText = current >= 1 ? "Completed!" : "Log your first mood.";
                            break;
                        case "mood_7":
                            current = Math.min(7, counts.moods);
                            helperText = current >= 7 ? "Completed!" : `Log mood 7 days (${current}/7).`;
                            break;
                        case "mood_30":
                            current = Math.min(30, counts.moods);
                            helperText = current >= 30 ? "Completed!" : `Log mood for 30 days (${current}/30).`;
                            break;

                        case "first_journal":
                            current = counts.journals >= 1 ? 1 : 0;
                            helperText = current >= 1 ? "Completed!" : "Write your first journal entry.";
                            break;
                        case "journal_10":
                        case "reflective_mind":
                            current = Math.min(10, counts.journals);
                            helperText = current >= 10 ? "Completed!" : `Write 10 journal entries (${current}/10).`;
                            break;

                        case "first_goal":
                            current = (counts.goals_created || counts.goals) >= 1 ? 1 : 0;
                            helperText = current >= 1 ? "Completed!" : "Create your first goal.";
                            break;
                        case "goals_5":
                        case "goal_getter":
                            current = Math.min(5, counts.goals);
                            helperText = current >= 5 ? "Completed!" : `Complete 5 goals (${current}/5).`;
                            break;

                        case "streak_3":
                            current = Math.min(3, counts.streak);
                            helperText = current >= 3 ? "Completed!" : `Reach a 3-day streak (${current}/3).`;
                            break;
                        case "streak_7":
                        case "week_strong":
                            current = Math.min(7, counts.streak);
                            helperText = current >= 7 ? "Completed!" : `Reach a 7-day streak (${current}/7).`;
                            break;
                        case "streak_30":
                        case "habit_master":
                            current = Math.min(30, counts.streak);
                            helperText = current >= 30 ? "Completed!" : `Reach a 30-day streak (${current}/30).`;
                            break;

                        case "first_reflection":
                        case "deep_reflection":
                            current = counts.reflections >= 1 ? 1 : 0;
                            helperText = current >= 1 ? "Completed!" : "Complete your first self-reflection.";
                            break;

                        case "first_chat":
                            current = counts.chat >= 1 ? 1 : 0;
                            helperText = current >= 1 ? "Completed!" : "Have your first AI chat.";
                            break;

                        case "xp_100":
                            current = Math.min(100, counts.user_xp);
                            helperText = current >= 100 ? "Completed!" : `Earn 100 XP (${current}/100).`;
                            break;
                        case "xp_500":
                        case "innervoice_champion":
                            current = Math.min(500, counts.user_xp);
                            helperText = current >= 500 ? "Completed!" : `Earn 500 XP (${current}/500).`;
                            break;

                        case "mindful_routine":
                            current = counts.focus;
                            helperText = current >= 20 ? "Completed!" : `Complete focus sessions (${current}/20).`;
                            break;
                        case "habit_builder":
                            current = counts.habit;
                            helperText = current >= 25 ? "Completed!" : `Complete habit sessions (${current}/25).`;
                            break;
                        case "wellness_explorer":
                            current = counts.weekly_report;
                            helperText = current >= 4 ? "Completed!" : `Generate weekly reports (${current}/4).`;
                            break;
                        case "consistency_champion":
                            current = Math.min(4, Math.floor(counts.habit_streak / 7));
                            helperText = current >= 4 ? "Completed!" : `Hit weekly consistency (${current}/4).`;
                            break;

                        default:
                            current = 0;
                            helperText = "In Progress";
                    }

                    const meta = META_BY_CODE[def.code] || {};
                    const name = def.name || meta.name;
                    const description = (def.code === 'streak_30' ? 'Maintain a 30-day wellness streak' : (def.description || meta.description));
                    const target = (def.code === 'streak_30' ? 30 : (def.target || meta.target || 1));
                    const tier = (def.code === 'streak_30' ? 'Gold' : (def.tier || meta.tier || 'Bronze'));
                    const xp_reward = (def.code === 'streak_30' ? 200 : (def.xp_reward || meta.xp_reward || (target * 10)));
                    const category = def.category || meta.category || 'general';

                    // Ensure icon is valid UTF-8 emoji and not corrupted mojibake
                    let icon = def.icon;
                    if (!icon || /[ƒÿèîêÅå?]/.test(icon) || meta.icon) {
                        icon = meta.icon || icon || "🏆";
                    }

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
                        name: name,
                        description: description,
                        icon: icon,
                        tier: tier,
                        xp_reward: xp_reward,
                        category: category,
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
