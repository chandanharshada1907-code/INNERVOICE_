const db = require('./db');

async function migrate() {
    const promiseDb = db.promise();
    console.log("Starting DB migration for Phase 10...");

    try {
        await promiseDb.query(`ALTER TABLE notifications ADD COLUMN priority VARCHAR(20) DEFAULT 'low'`);
        console.log("Added priority column to notifications.");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column priority already exists.");
        } else {
            console.error("Error adding priority column:", e.message);
        }
    }

    try {
        await promiseDb.query(`ALTER TABLE notifications ADD COLUMN reference_id VARCHAR(100) DEFAULT NULL`);
        console.log("Added reference_id column to notifications.");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column reference_id already exists.");
        } else {
            console.error("Error adding reference_id column:", e.message);
        }
    }

    console.log("Migration complete.");
    process.exit(0);
}

migrate();
