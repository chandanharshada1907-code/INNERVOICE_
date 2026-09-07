const path = require('path');
const dotenv = require(path.resolve(__dirname, '../node_modules/dotenv'));
const envResult = dotenv.config({ path: path.resolve(__dirname, '../.env') });
console.log('Env load result:', envResult.error ? envResult.error.message : 'OK');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);

const mysql = require(path.resolve(__dirname, '../node_modules/mysql2/promise'));

async function check() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'innervoice',
        port: parseInt(process.env.DB_PORT || '3306')
    });

    // Check role column definition
    const [roleCol] = await conn.query('SHOW COLUMNS FROM users WHERE Field = "role"');
    console.log('\nRole column definition:', JSON.stringify(roleCol, null, 2));

    // Get all users with their roles
    const [allUsers] = await conn.execute('SELECT id, name, email, role FROM users ORDER BY id');
    console.log('\nAll users with roles:');
    allUsers.forEach(u => console.log('  id=' + u.id + '  role=' + (u.role || 'NULL') + '  email=' + u.email));
    console.log('\nTotal users: ' + allUsers.length);

    await conn.end();
}

check().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
