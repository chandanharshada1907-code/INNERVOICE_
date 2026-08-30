const mysql = require("mysql2/promise");
require("dotenv").config();

async function migrate() {
    console.log("=========================================");
    console.log("MIGRATING DATABASE FOR PHASE 11: GOALS");
    console.log("=========================================");

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "innervoice"
    });

    try {
        console.log("✅ Connected to MySQL Database");

        // 1. Extend `goals` table
        console.log("-> Extending `goals` table...");

        const addColumn = async (column, def) => {
            try {
                await connection.query(`ALTER TABLE goals ADD COLUMN ${column} ${def}`);
                console.log(`   Added ${column} column.`);
            } catch (err) {
                if (err.code === "ER_DUP_FIELDNAME") {
                    console.log(`   ${column} column already exists, skipping.`);
                } else {
                    throw err;
                }
            }
        };

        await addColumn('category', "VARCHAR(50) DEFAULT 'General'");
        await addColumn('priority', "VARCHAR(20) DEFAULT 'medium'");
        await addColumn('target_value', "INT DEFAULT 1");
        await addColumn('current_progress', "INT DEFAULT 0");
        await addColumn('tracking_type', "VARCHAR(20) DEFAULT 'manual'");
        await addColumn('completed_date', "TIMESTAMP NULL DEFAULT NULL");

        // 2. Create `goal_milestones` table
        console.log("-> Creating `goal_milestones` table...");
        const createMilestonesSQL = `
            CREATE TABLE IF NOT EXISTS goal_milestones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                goal_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                target_value INT NOT NULL,
                is_completed TINYINT(1) DEFAULT 0,
                completed_at TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE
            )
        `;
        await connection.query(createMilestonesSQL);
        console.log("   `goal_milestones` table created/verified.");

        // 3. Create `goal_progress_history` table
        console.log("-> Creating `goal_progress_history` table...");
        const createHistorySQL = `
            CREATE TABLE IF NOT EXISTS goal_progress_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                goal_id INT NOT NULL,
                progress_value INT NOT NULL,
                recorded_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE,
                UNIQUE KEY (goal_id, recorded_date)
            )
        `;
        await connection.query(createHistorySQL);
        console.log("   `goal_progress_history` table created/verified.");

        console.log("=========================================");
        console.log("🎉 GOAL MIGRATION COMPLETED SUCCESSFULLY");
        console.log("=========================================");
    } catch (error) {
        console.error("❌ MIGRATION FAILED:", error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

migrate();
