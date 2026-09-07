const http = require('http');

async function testAdminAPI() {
    // Step 1: Login as admin
    const loginPayload = JSON.stringify({ email: 'chandanharshada1907@gmail.com', password: 'harshada1907' });
    
    const loginRes = await new Promise((resolve, reject) => {
        const req = http.request('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginPayload) }
        }, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.on('error', reject);
        req.write(loginPayload);
        req.end();
    });

    console.log('Login Status:', loginRes.status);
    console.log('Login User Role:', loginRes.body.user ? loginRes.body.user.role : 'N/A');

    const token = loginRes.body.token;
    if (!token) {
        console.error('No token returned!');
        return;
    }

    // Step 2: Test GET /api/admin/stats
    const statsRes = await new Promise((resolve, reject) => {
        const req = http.request('http://localhost:5000/api/admin/stats', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        }, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.on('error', reject);
        req.end();
    });

    console.log('\n--- GET /api/admin/stats ---');
    console.log('Status:', statsRes.status);
    console.log('Stats Response:', JSON.stringify(statsRes.body, null, 2));

    // Step 3: Test GET /api/admin/users
    const usersRes = await new Promise((resolve, reject) => {
        const req = http.request('http://localhost:5000/api/admin/users?page=1&limit=15', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        }, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.on('error', reject);
        req.end();
    });

    console.log('\n--- GET /api/admin/users ---');
    console.log('Status:', usersRes.status);
    console.log('Users Count in Response:', usersRes.body.users ? usersRes.body.users.length : 0);
    console.log('Pagination:', JSON.stringify(usersRes.body.pagination));
    if (usersRes.body.users && usersRes.body.users.length > 0) {
        console.log('Sample User:', JSON.stringify(usersRes.body.users[0]));
    }
}

testAdminAPI().catch(err => console.error('API Test Error:', err));
