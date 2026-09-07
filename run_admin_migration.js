const path   = require('path');
const dotenv = require('./INNERVOICE/backend/node_modules/dotenv');
dotenv.config({ path: path.resolve(__dirname, 'INNERVOICE/backend/.env') });

const mysql = require('./INNERVOICE/backend/node_modules/mysql2');

const c = mysql.createConnection({
    host:               process.env.DB_HOST     || 'localhost',
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'innervoice',
    port:               parseInt(process.env.DB_PORT || '3306', 10),
    multipleStatements: true
});

c.connect(err => {
    if (err) { console.error('Connect fail:', err.message); process.exit(1); }
    console.log('Connected to MySQL database:', process.env.DB_NAME || 'innervoice');

    // Step 1: Add role column
    c.query(
        "ALTER TABLE users ADD COLUMN `role` ENUM('user','admin') NOT NULL DEFAULT 'user'",
        (e) => {
            if (e && e.code !== 'ER_DUP_FIELDNAME') console.error('ALTER error:', e.message);
            else console.log('✅ role column added (or already exists)');

            // Step 2: Promote test admin
            c.query(
                "UPDATE users SET `role` = 'admin' WHERE email = 'pdftest_verify@innervoice.test'",
                (e2, r) => {
                    if (e2)              console.error('Promote error:', e2.message);
                    else if (r.affectedRows > 0) console.log('✅ pdftest_verify@innervoice.test promoted to admin');
                    else                console.log('ℹ️  Test admin account not in DB yet (will be promoted on next run after register)');

                    // Step 3: Show current users + roles
                    c.query('SELECT id, name, email, `role`, created_at FROM users ORDER BY id', (e3, rows) => {
                        if (e3) { console.error('Select error:', e3.message); }
                        else {
                            console.log('\nCurrent users in DB:');
                            rows.forEach(u => console.log(`  [${String(u.role).padEnd(5)}] id=${u.id}  ${u.email}`));
                        }
                        c.end();
                        console.log('\n✅ Migration complete.');
                    });
                }
            );
        }
    );
});
