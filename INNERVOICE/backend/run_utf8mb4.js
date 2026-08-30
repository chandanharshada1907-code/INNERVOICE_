// Run utf8mb4 migration via the existing db.js pool
require('dotenv').config();
const db = require('./db');

const migrations = [
    "ALTER DATABASE innervoice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    "ALTER TABLE moods CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    "ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    "ALTER TABLE journals CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    "ALTER TABLE reflections CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    "ALTER TABLE goals CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    "ALTER TABLE notifications CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    "ALTER TABLE chat_messages CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    "ALTER TABLE user_preferences CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    "ALTER TABLE emotion_triggers CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    "ALTER TABLE mood_triggers CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
];

let idx = 0;
function runNext() {
    if (idx >= migrations.length) {
        console.log('✅ UTF8MB4 migration complete!');
        // Test emoji round-trip
        db.query("SELECT '😊' AS emoji_test, '🎯' AS target_test", (err, rows) => {
            if (err) { console.log('Emoji test error:', err.message); }
            else { console.log('Emoji round-trip test:', rows[0]); }
            process.exit(0);
        });
        return;
    }
    const sql = migrations[idx++];
    db.query(sql, (err) => {
        if (err && !err.message.includes("already")) {
            console.warn(`WARN [${idx}]: ${err.message} (skipping)`);
        } else {
            console.log(`OK [${idx}]: ${sql.substring(0,60)}...`);
        }
        runNext();
    });
}

// Wait for pool to be ready
setTimeout(runNext, 1000);
