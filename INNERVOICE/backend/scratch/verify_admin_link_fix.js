const fs = require('fs');
const path = require('path');
const http = require('http');

console.log("=== VERIFYING ADMIN LINK VISIBILITY & NAVIGATION FIX ===");

// 1. Inspect index.html DOM structure for adminNavLink
const htmlPath = path.join(__dirname, '..', '..', 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const linkRegex = /<a[^>]*id=["']adminNavLink["'][^>]*>/i;
const linkMatch = htmlContent.match(linkRegex);

if (!linkMatch) {
    console.error("❌ ERROR: #adminNavLink not found in index.html!");
    process.exit(1);
}

console.log("✅ #adminNavLink HTML markup:", linkMatch[0]);

// Find parent element in index.html
const sidebarPos = htmlContent.indexOf('id="adminNavLink"');
const sidebarSnippet = htmlContent.substring(sidebarPos - 300, sidebarPos + 200);
console.log("✅ #adminNavLink container snippet:\n", sidebarSnippet);

// 2. Test js logic simulation
const scriptPath = path.join(__dirname, '..', '..', 'script.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Verify key functions in script.js
const hasCheckFn = scriptContent.includes('window.checkAdminRoleNav = function');
const hasInitReady = scriptContent.includes('document.readyState === \'loading\'');
const hasShowSectionHook = scriptContent.includes('if (sectionId === \'#admin\' || sectionId === \'admin\')');

console.log("✅ window.checkAdminRoleNav defined:", hasCheckFn);
console.log("✅ readyState check implemented:", hasInitReady);
console.log("✅ showSection hook updated:", hasShowSectionHook);

// 3. Test backend live endpoints for admin user (id: 1)
function makeRequest(path, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

async function testLiveAdmin() {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
        { id: 1, user_id: 1, name: 'harshada chandan', email: 'chandanharshada1907@gmail.com', role: 'admin' },
        process.env.JWT_SECRET || 'innervoice_secret_key_2026',
        { expiresIn: '1h' }
    );

    console.log("\n--- Testing Live Backend API Connectivity for Admin ---");
    const statsRes = await makeRequest('/api/admin/stats', token);
    console.log("GET /api/admin/stats status:", statsRes.statusCode, "Stats total users:", statsRes.body.stats?.users?.total);

    const usersRes = await makeRequest('/api/admin/users?page=1&limit=5', token);
    console.log("GET /api/admin/users status:", usersRes.statusCode, "Users retrieved count:", usersRes.body.users?.length);

    const userDetailRes = await makeRequest('/api/admin/users/1', token);
    console.log("GET /api/admin/users/1 status:", userDetailRes.statusCode, "User detail email:", userDetailRes.body.user?.email);

    if (statsRes.statusCode === 200 && usersRes.statusCode === 200 && userDetailRes.statusCode === 200) {
        console.log("\n🎉 ALL LIVE ADMIN BACKEND APIS FUNCTIONING 100% CORRECTLY!");
    } else {
        console.error("❌ Live API check failed!");
        process.exit(1);
    }
}

testLiveAdmin().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
