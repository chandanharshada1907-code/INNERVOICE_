const db = require('./db');

async function migrate() {
    try {
        await db.promise().query('ALTER TABLE daily_plan_items ADD COLUMN skipped BOOLEAN DEFAULT FALSE;');
        console.log('Migration successful');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists');
        } else {
            console.error('Migration failed:', e);
        }
    } finally {
        db.end();
    }
}
migrate();
