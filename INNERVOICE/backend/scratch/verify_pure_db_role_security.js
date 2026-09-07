const http = require('http');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

console.log("=== COMPREHENSIVE ADMIN SECURITY & ROLE VERIFICATION ===");

// 1. Check script.js for hardcoded email checks
const scriptPath = path.join(__dirname, '..', '..', 'script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

const hasEmailCheckInScript = scriptContent.includes('chandanharshada1907@gmail.com');
console.log("1. Hardcoded admin email in script.js:", hasEmailCheckInScript ? "❌ FOUND" : "✅ NONE (REMOVED)");

if (hasEmailCheckInScript) {
    console.error("FAIL: script.js still contains hardcoded email!");
    process.exit(1);
}

// 2. Test Live HTTP requests to backend for Admin vs Non-Admin users
const secret = process.env.JWT_SECRET || 'innervoice_secret_key_2026';

const adminToken = jwt.sign(
    { id: 1, user_id: 1, name: 'Admin User', email: 'admin@test.com', role: 'admin' },
    secret,
    { expiresIn: '1h' }
);

const normalToken = jwt.sign(
    { id: 2, user_id: 2, name: 'Normal User', email: 'user@test.com', role: 'user' },
    secret,
    { expiresIn: '1h' }
);

function makeReq(urlPath, token) {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: urlPath,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = {};
                try { parsed = JSON.parse(body); } catch(e){}
                resolve({ status: res.statusCode, data: parsed });
            });
        });
        req.on('error', err => resolve({ status: 500, error: err }));
        req.end();
    });
}

async function runSecurityTests() {
    console.log("\n2. Testing /api/users/profile response structure:");
    const adminProfile = await makeReq('/api/users/profile', adminToken);
    console.log("   Admin profile status:", adminProfile.status);
    console.log("   Admin profile payload contains role:", adminProfile.data.profile?.role === 'admin' ? "✅ YES ('admin')" : "❌ NO");

    const normalProfile = await makeReq('/api/users/profile', normalToken);
    console.log("   Normal profile status:", normalProfile.status);
    console.log("   Normal profile payload contains role:", normalProfile.data.profile?.role === 'user' ? "✅ YES ('user')" : "❌ NO");

    console.log("\n3. Testing /api/admin/stats authorization:");
    const adminStats = await makeReq('/api/admin/stats', adminToken);
    console.log("   Admin access status:", adminStats.status, adminStats.status === 200 ? "✅ 200 OK" : "❌ FAIL");

    const normalStats = await makeReq('/api/admin/stats', normalToken);
    console.log("   Normal user access status:", normalStats.status, normalStats.status === 403 ? "✅ 403 Forbidden (Blocked)" : "❌ FAIL");

    console.log("\n4. Testing /api/admin/users authorization:");
    const adminUsers = await makeReq('/api/admin/users?page=1&limit=5', adminToken);
    console.log("   Admin access status:", adminUsers.status, adminUsers.status === 200 ? "✅ 200 OK" : "❌ FAIL");

    const normalUsers = await makeReq('/api/admin/users?page=1&limit=5', normalToken);
    console.log("   Normal user access status:", normalUsers.status, normalUsers.status === 403 ? "✅ 403 Forbidden (Blocked)" : "❌ FAIL");

    if (
        !hasEmailCheckInScript &&
        adminProfile.data.profile?.role === 'admin' &&
        adminStats.status === 200 &&
        normalStats.status === 403 &&
        adminUsers.status === 200 &&
        normalUsers.status === 403
    ) {
        console.log("\n🎉 ALL SECURITY AND ROLE VERIFICATIONS PASSED 100%!");
    } else {
        console.error("\n❌ Security test failed!");
        process.exit(1);
    }
}

runSecurityTests().catch(console.error);
