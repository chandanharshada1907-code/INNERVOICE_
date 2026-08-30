const http = require('http');

const PORT = 5000;
let token = '';

function runTest(name, testFn) {
    return new Promise(async (resolve) => {
        try {
            console.log(`\n--- Running Test: ${name} ---`);
            await testFn();
            console.log(`✅ Passed: ${name}`);
            resolve(true);
        } catch (err) {
            console.error(`❌ Failed: ${name}`);
            console.error(err);
            resolve(false);
        }
    });
}

function req(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch(e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function main() {
    // 1. Login to get token
    console.log("Logging in as test user...");
    const loginRes = await req('POST', '/api/auth/login', {
        email: "test@example.com",
        password: "password123"
    });
    
    if (loginRes.status === 200 && loginRes.data.token) {
        token = loginRes.data.token;
        console.log("✅ Login successful");
    } else {
        // If login fails, try registering
        console.log("Login failed, attempting to register test user...");
        await req('POST', '/api/auth/register', {
            username: "Test User",
            name: "Test User",
            email: "test@example.com",
            password: "password123"
        });
        const retryLogin = await req('POST', '/api/auth/login', {
            email: "test@example.com",
            password: "password123"
        });
        if (retryLogin.status === 200 && retryLogin.data.token) {
            token = retryLogin.data.token;
            console.log("✅ Registration & Login successful");
        } else {
            console.error("❌ Failed to get token. Cannot run tests.");
            process.exit(1);
        }
    }

    const authHeaders = { 'Authorization': `Bearer ${token}` };

    let passed = 0;
    let total = 0;

    total++;
    let success = await runTest("Get Calendar without month query", async () => {
        const res = await req('GET', '/api/moods/calendar', null, authHeaders);
        if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    });
    if (success) passed++;

    total++;
    success = await runTest("Get Calendar with invalid month format", async () => {
        const res = await req('GET', '/api/moods/calendar?month=08-2026', null, authHeaders);
        if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    });
    if (success) passed++;

    total++;
    success = await runTest("Get Calendar with valid month", async () => {
        const res = await req('GET', '/api/moods/calendar?month=2026-08', null, authHeaders);
        if (res.status !== 200) {
            console.error(res.data);
            throw new Error(`Expected 200, got ${res.status}`);
        }
        if (!res.data.success) throw new Error("Expected success: true");
        if (res.data.month !== 8 || res.data.year !== 2026) throw new Error("Returned wrong month/year");
        if (!Array.isArray(res.data.days)) throw new Error("Expected days array");
        if (!res.data.stats) throw new Error("Expected stats object");
        if (!res.data.streak) throw new Error("Expected streak object");
    });
    if (success) passed++;

    total++;
    success = await runTest("Get Calendar unauthorized", async () => {
        const res = await req('GET', '/api/moods/calendar?month=2026-08', null, {});
        if (res.status !== 401 && res.status !== 403) throw new Error(`Expected 401/403, got ${res.status}`);
    });
    if (success) passed++;

    console.log(`\n🎉 Test Summary: ${passed}/${total} passed.`);
    if (passed !== total) process.exit(1);
}

main().catch(console.error);
