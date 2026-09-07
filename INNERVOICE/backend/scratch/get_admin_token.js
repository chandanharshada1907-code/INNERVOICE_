const path = require('path');
const dotenv = require(path.resolve(__dirname, '../node_modules/dotenv'));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const mysql = require(path.resolve(__dirname, '../node_modules/mysql2/promise'));
const jwt = require(path.resolve(__dirname, '../node_modules/jsonwebtoken'));

async function testAdminEndpoints() {
    const conn = await mysql.createConnection({
        host: '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'innervoice',
        port: parseInt(process.env.DB_PORT || '3306')
    });

    const [users] = await conn.execute("SELECT id, name, email, role FROM users WHERE email = 'chandanharshada1907@gmail.com'");
    if (users.length === 0) {
        console.error('Admin user not found!');
        await conn.end();
        return;
    }

    const adminUser = users[0];
    console.log('ADMIN USER FROM DB:', JSON.stringify(adminUser));

    const token = jwt.sign(
        {
            id: adminUser.id,
            user_id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    console.log('\nSIGN JWT TOKEN OK!');

    // Test GET /api/admin/stats via http request using token
    const http = require('http');
    const statsRes = await new Promise(resolve => {
        const req = http.request('http://127.0.0.1:5000/api/admin/stats', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        }, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.end();
    });

    console.log('\n--- GET /api/admin/stats ---');
    console.log('Status:', statsRes.status);
    console.log('Stats Response:', JSON.stringify(statsRes.body, null, 2));

    // Test GET /api/admin/users
    const usersRes = await new Promise(resolve => {
        const req = http.request('http://127.0.0.1:5000/api/admin/users?page=1&limit=15', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        }, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.end();
    });

    console.log('\n--- GET /api/admin/users ---');
    console.log('Status:', usersRes.status);
    console.log('Users Count in Response:', usersRes.body.users ? usersRes.body.users.length : 0);
    console.log('Pagination:', JSON.stringify(usersRes.body.pagination));
    if (usersRes.body.users && usersRes.body.users.length > 0) {
        console.log('Sample User:', JSON.stringify(usersRes.body.users[0]));
    }

    // Test GET /api/admin/users/:id
    const targetUserId = adminUser.id;
    const detailRes = await new Promise(resolve => {
        const req = http.request(`http://127.0.0.1:5000/api/admin/users/${targetUserId}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        }, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.end();
    });

    console.log(`\n--- GET /api/admin/users/${targetUserId} ---`);
    console.log('Status:', detailRes.status);
    console.log('User Detail Response:', JSON.stringify(detailRes.body, null, 2));

    // Test Forbidden for Non-Admin Token
    const normalToken = jwt.sign(
        { id: 9999, user_id: 9999, name: 'Normal', email: 'normal@test.com', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    const forbiddenRes = await new Promise(resolve => {
        const req = http.request('http://127.0.0.1:5000/api/admin/stats', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + normalToken }
        }, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.end();
    });

    console.log('\n--- GET /api/admin/stats (Non-Admin Token) ---');
    console.log('Status:', forbiddenRes.status, '(Expected 403)');
    console.log('Response:', JSON.stringify(forbiddenRes.body));

    await conn.end();
}

testAdminEndpoints().catch(err => console.error('TEST ERROR:', err));
