// Run OTP verification migration via the existing db.js pool
require('dotenv').config();
const db = require('./db');

const migrations = [
    { sql: "SELECT 1", desc: "Check database connection" },
    { sql: "ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) DEFAULT NULL", desc: "Add phone_number column" },
    { sql: "ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE", desc: "Add email_verified column" },
    { sql: "ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE", desc: "Add phone_verified column" },
    { sql: "ALTER TABLE users ADD COLUMN email_otp_hash VARCHAR(255) DEFAULT NULL", desc: "Add email_otp_hash column" },
    { sql: "ALTER TABLE users ADD COLUMN email_otp_expires_at DATETIME DEFAULT NULL", desc: "Add email_otp_expires_at column" },
    { sql: "ALTER TABLE users ADD COLUMN phone_otp_hash VARCHAR(255) DEFAULT NULL", desc: "Add phone_otp_hash column" },
    { sql: "ALTER TABLE users ADD COLUMN phone_otp_expires_at DATETIME DEFAULT NULL", desc: "Add phone_otp_expires_at column" },
    { sql: "ALTER TABLE users ADD COLUMN email_otp_attempts INT DEFAULT 0", desc: "Add email_otp_attempts column" },
    { sql: "ALTER TABLE users ADD COLUMN phone_otp_attempts INT DEFAULT 0", desc: "Add phone_otp_attempts column" },
    { sql: "ALTER TABLE users ADD COLUMN email_otp_sent_at DATETIME DEFAULT NULL", desc: "Add email_otp_sent_at column" },
    { sql: "ALTER TABLE users ADD COLUMN phone_otp_sent_at DATETIME DEFAULT NULL", desc: "Add phone_otp_sent_at column" },
    { sql: "UPDATE users SET email_verified = TRUE, phone_verified = TRUE WHERE email_otp_hash IS NULL AND phone_otp_hash IS NULL AND email_verified = FALSE AND phone_verified = FALSE", desc: "Preserve legacy users as verified" },
];

let idx = 0;
function runNext() {
    if (idx >= migrations.length) {
        console.log('✅ OTP verification migration complete!');
        console.log('\nNew users table schema:');
        db.query("DESCRIBE users", (err, rows) => {
            if (err) {
                console.error('Error describing table:', err.message);
            } else {
                console.table(rows.map(r => ({
                    Field: r.Field,
                    Type: r.Type,
                    Null: r.Null,
                    Key: r.Key,
                    Default: r.Default || '-'
                })));
            }
            process.exit(0);
        });
        return;
    }

    const migration = migrations[idx++];
    const { sql, desc } = migration;

    db.query(sql, (err) => {
        if (err) {
            // Check if error is because column already exists
            if (err.message.includes("Duplicate column name")) {
                console.log(`✓ [${idx}]: ${desc} (already exists)`);
            } else {
                console.error(`✗ [${idx}]: ${desc}`);
                console.error(`   Error: ${err.message}`);
            }
        } else {
            console.log(`✓ [${idx}]: ${desc}`);
        }
        runNext();
    });
}

// Wait for pool to be ready
setTimeout(runNext, 1000);

