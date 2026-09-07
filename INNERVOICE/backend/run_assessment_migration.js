const db = require('./db');

async function migrate() {
    try {
        console.log("Running migration for mental_wellness_assessments table...");
        const sql = `
            CREATE TABLE IF NOT EXISTS mental_wellness_assessments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                assessment_type VARCHAR(20) NOT NULL,
                total_score INT NOT NULL,
                severity VARCHAR(50) NOT NULL,
                answers JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `;
        await db.promise().query(sql);
        console.log("✓ mental_wellness_assessments table created successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
}

migrate();
