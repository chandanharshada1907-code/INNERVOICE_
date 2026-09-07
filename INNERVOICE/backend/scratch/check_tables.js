const path = require('path');
const dotenv = require(path.resolve(__dirname, '../node_modules/dotenv'));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const mysql = require(path.resolve(__dirname, '../node_modules/mysql2/promise'));

async function check() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'innervoice',
        port: parseInt(process.env.DB_PORT || '3306')
    });

    // Show all tables
    const [tables] = await conn.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('All tables:', tableNames.join(', '));

    // Check sleep_records
    if (tableNames.includes('sleep_records')) {
        const [cols] = await conn.execute('SHOW COLUMNS FROM sleep_records');
        console.log('\nsleep_records columns:', cols.map(c => c.Field).join(', '));
        const [count] = await conn.execute('SELECT COUNT(*) as c FROM sleep_records');
        console.log('sleep_records count:', count[0].c);
    } else {
        console.log('\nNOTE: sleep_records table does NOT exist');
    }

    // Count key tables
    for (const tbl of ['users', 'moods', 'journals', 'reflections', 'goals', 'mental_wellness_assessments', 'habits', 'user_achievements', 'chat_messages', 'notifications', 'focus_sessions']) {
        if (tableNames.includes(tbl)) {
            const [cnt] = await conn.execute('SELECT COUNT(*) AS c FROM ' + tbl);
            console.log(tbl + ':', cnt[0].c, 'records');
        } else {
            console.log(tbl + ': TABLE NOT FOUND');
        }
    }

    await conn.end();
}

check().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
