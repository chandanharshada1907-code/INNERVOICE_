require('dotenv').config();
const http = require('http');
const db = require('./db');

async function run() {
    // Login first
    const loginBody = JSON.stringify({ email: 'audituser99@inner.com', password: 'Test1234!' });
    const token = await new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
        }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                const parsed = JSON.parse(data);
                resolve(parsed.token);
            });
        });
        req.on('error', reject);
        req.write(loginBody);
        req.end();
    });

    console.log('Token:', token ? 'OK' : 'FAILED');

    // Test wellness-journey directly
    const result = await new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost', port: 5000, path: '/api/wellness-journey', method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.end();
    });

    console.log('Wellness Journey status:', result.status);
    console.log('Body:', result.body.substring(0, 300));

    // Also directly test the SQL causing the issue
    db.query(`SHOW COLUMNS FROM habit_completions`, (err, rows) => {
        if (err) console.log('habit_completions error:', err.message);
        else {
            console.log('\nhab_completions cols:');
            rows.forEach(r => console.log(' ', r.Field, r.Type, 'Null:', r.Null, 'Default:', r.Default));
        }
        setTimeout(() => process.exit(0), 500);
    });
}

run().catch(e => { console.error(e); process.exit(1); });
