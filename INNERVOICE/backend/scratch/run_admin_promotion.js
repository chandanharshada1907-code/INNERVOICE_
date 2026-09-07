// =====================================================
// INNERVOICE — Admin Role Promotion & Verification
// Runs the admin_migration.sql logic via Node.js
// so we can see output clearly.
// =====================================================

const path   = require('path');
const BACKEND = path.resolve(__dirname, '..');
const dotenv  = require(path.resolve(BACKEND, 'node_modules/dotenv'));
dotenv.config({ path: path.resolve(BACKEND, '.env') });

const mysql = require(path.resolve(BACKEND, 'node_modules/mysql2/promise'));

const TARGET_EMAIL = 'chandanharshada1907@gmail.com';

async function run() {
    const conn = await mysql.createConnection({
        host:     process.env.DB_HOST     || 'localhost',
        user:     process.env.DB_USER     || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME     || 'innervoice',
        port:     parseInt(process.env.DB_PORT || '3306')
    });

    console.log('✅ Connected to MySQL:', process.env.DB_NAME);
    console.log('');

    // Step 1: Confirm role column exists
    const [cols] = await conn.execute('SHOW COLUMNS FROM users WHERE Field = "role"');
    if (cols.length === 0) {
        console.log('⚠️  role column does NOT exist — adding it now...');
        await conn.execute(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS role ENUM('user','admin') NOT NULL DEFAULT 'user'
            COMMENT 'User role: user = normal, admin = administrator'
        `);
        console.log('✅ role column added.');
    } else {
        console.log('✅ role column already exists:', JSON.stringify(cols[0]));
    }
    console.log('');

    // Step 2: Check current state of target account
    const [before] = await conn.execute(
        'SELECT id, name, email, role, created_at FROM users WHERE email = ?',
        [TARGET_EMAIL]
    );

    if (before.length === 0) {
        console.log(`❌ User with email "${TARGET_EMAIL}" was NOT found in the database.`);
        console.log('   Cannot promote a non-existent user.');
        await conn.end();
        return;
    }

    const user = before[0];
    console.log('--- Target User BEFORE migration ---');
    console.log(`  id:    ${user.id}`);
    console.log(`  name:  ${user.name}`);
    console.log(`  email: ${user.email}`);
    console.log(`  role:  ${user.role}   ← ${user.role === 'admin' ? '(already admin)' : '(will be changed to admin)'}`);
    console.log('');

    // Step 3: Promote to admin
    const [result] = await conn.execute(
        "UPDATE users SET role = 'admin' WHERE email = ?",
        [TARGET_EMAIL]
    );
    console.log(`✅ UPDATE executed. Rows affected: ${result.affectedRows}`);
    console.log('');

    // Step 4: Verify after update
    const [after] = await conn.execute(
        'SELECT id, name, email, role, created_at FROM users WHERE email = ?',
        [TARGET_EMAIL]
    );
    const updated = after[0];
    console.log('--- Target User AFTER migration ---');
    console.log(`  id:    ${updated.id}`);
    console.log(`  name:  ${updated.name}`);
    console.log(`  email: ${updated.email}`);
    console.log(`  role:  ${updated.role}   ← ${updated.role === 'admin' ? '✅ ADMIN' : '❌ STILL NOT ADMIN'}`);
    console.log('');

    // Step 5: Show total admins
    const [adminCount] = await conn.execute("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'");
    const [totalCount] = await conn.execute('SELECT COUNT(*) AS c FROM users');
    console.log(`📊 Total users: ${totalCount[0].c} | Admin accounts: ${adminCount[0].c} | Regular: ${totalCount[0].c - adminCount[0].c}`);
    console.log('');

    // Step 6: Show all admin accounts
    const [admins] = await conn.execute("SELECT id, name, email, role FROM users WHERE role = 'admin' ORDER BY id");
    console.log('--- All Admin Accounts ---');
    admins.forEach(a => console.log(`  [admin] id=${a.id}  ${a.email}`));

    await conn.end();
    console.log('');
    console.log('✅ Migration complete. Login with chandanharshada1907@gmail.com to see the Admin Panel.');
}

run().catch(err => {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
});
