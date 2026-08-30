const db = require("./db");

async function runMigration() {
    console.log("🚀 Starting Phase 5 Achievements & XP Migration...");

    try {
        const promiseDb = db.promise();

        // 1. Alter Users Table
        console.log("Checking users table for XP columns...");
        try {
            await promiseDb.query("ALTER TABLE users ADD COLUMN xp INT DEFAULT 0");
            console.log("✅ Added xp column to users.");
        } catch(e) {
            if(e.code === 'ER_DUP_FIELDNAME') console.log("xp column already exists, skipping.");
            else throw e;
        }

        try {
            await promiseDb.query("ALTER TABLE users ADD COLUMN level INT DEFAULT 1");
            console.log("✅ Added level column to users.");
        } catch(e) {
            if(e.code === 'ER_DUP_FIELDNAME') console.log("level column already exists, skipping.");
            else throw e;
        }

        // 2. Alter Achievements Table
        console.log("Checking achievements table for tier/reward columns...");
        try {
            await promiseDb.query("ALTER TABLE achievements ADD COLUMN tier VARCHAR(20) DEFAULT 'Bronze'");
            console.log("✅ Added tier column to achievements.");
        } catch(e) {
            if(e.code === 'ER_DUP_FIELDNAME') console.log("tier column already exists, skipping.");
            else throw e;
        }

        try {
            await promiseDb.query("ALTER TABLE achievements ADD COLUMN xp_reward INT DEFAULT 50");
            console.log("✅ Added xp_reward column to achievements.");
        } catch(e) {
            if(e.code === 'ER_DUP_FIELDNAME') console.log("xp_reward column already exists, skipping.");
            else throw e;
        }

        // 3. Create XP Transactions Table
        console.log("Creating achievement_xp_transactions table...");
        const createTxTable = `
            CREATE TABLE IF NOT EXISTS achievement_xp_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                source_type VARCHAR(50) NOT NULL,
                source_id INT NOT NULL,
                xp_amount INT NOT NULL,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_xp_source (user_id, source_type, source_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        await promiseDb.query(createTxTable);
        console.log("✅ achievement_xp_transactions table created/verified.");

        // 4. Seed New Tiered Achievements
        console.log("Seeding tiered achievements...");
        // Clear old achievements to prevent dupes and clean slate
        await promiseDb.query("DELETE FROM achievements");
        
        const newAchievements = [
            ['first_step', 'First Step', 'Complete first wellness activity.', '🌱', 'Bronze', 25, 'general', 1],
            ['reflective_mind', 'Reflective Mind', 'Write 5 journal entries.', '📝', 'Bronze', 50, 'journal', 5],
            ['deep_reflection', 'Deep Reflection', 'Complete 10 reflections.', '💭', 'Silver', 75, 'reflection', 10],
            ['week_strong', 'Week Strong', 'Maintain a 7-day activity streak.', '🔥', 'Silver', 100, 'streak', 7],
            ['mindful_routine', 'Mindful Routine', 'Complete 20 focus/meditation activities.', '🧘', 'Silver', 100, 'focus', 20],
            ['habit_builder', 'Habit Builder', 'Complete 25 habit activities.', '🌱', 'Silver', 100, 'habit', 25],
            ['habit_master', 'Habit Master', 'Maintain a 30-day habit streak.', '🏆', 'Gold', 250, 'habit_streak', 30],
            ['goal_getter', 'Goal Getter', 'Complete 5 goals.', '🎯', 'Gold', 150, 'goal', 5],
            ['wellness_explorer', 'Wellness Explorer', 'Generate 4 weekly wellness reports.', '📊', 'Silver', 100, 'weekly_report', 4],
            ['consistency_champion', 'Consistency Champion', 'Achieve 80%+ consistency for 4 weeks.', '💎', 'Gold', 250, 'consistency', 4],
            ['innervoice_champion', 'InnerVoice Champion', 'Reach Level 8.', '👑', 'Platinum', 500, 'level', 8]
        ];

        const insertAch = `INSERT INTO achievements (code, name, description, icon, tier, xp_reward, category, target) VALUES ?`;
        await promiseDb.query(insertAch, [newAchievements]);
        console.log("✅ 11 Tiered achievements seeded successfully.");

        console.log("🎉 Phase 5 Migration Completed Successfully.");
        process.exit(0);

    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}

runMigration();
