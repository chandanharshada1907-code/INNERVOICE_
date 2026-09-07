const path = require('path');
const BACKEND = path.resolve(__dirname, '..');
const dotenv = require(path.resolve(BACKEND, 'node_modules/dotenv'));
dotenv.config({ path: path.resolve(BACKEND, '.env') });
const mysql = require(path.resolve(BACKEND, 'node_modules/mysql2/promise'));

async function check() {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'innervoice',
            port: parseInt(process.env.DB_PORT || '3306')
        });
        const [users] = await conn.execute('SELECT id, name, email, role FROM users');
        console.log('USERS_QUERY_RESULT:', JSON.stringify(users));
        await conn.end();
    } catch (err) {
        console.error('DB_ERROR:', err.message);
    }
}
check();
