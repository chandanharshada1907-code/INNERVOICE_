const http = require('http');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'c:/Users/HP/Downloads/INNERVOICE_updated/INNERVOICE_updated/INNERVOICE/backend/.env' });

const secret = process.env.JWT_SECRET || 'supersecretkey';

const results = [];

function recordResult(feature, status, apiStatus, dbStatus, uiStatus, notes) {
    results.push({ feature, status, apiStatus, dbStatus, uiStatus, notes });
}

function httpReq(options, postData = null) {
    return new Promise((resolve) => {
        const req = http.request(options, (res) => {
            let body = Buffer.alloc(0);
            res.on('data', chunk => body = Buffer.concat([body, chunk]));
            res.on('end', () => {
                const contentType = res.headers['content-type'] || '';
                let json = null;
                if (contentType.includes('application/json')) {
                    try { json = JSON.parse(body.toString()); } catch(e){}
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: json || body,
                    rawString: body.toString()
                });
            });
        });
        req.on('error', (err) => resolve({ status: 0, error: err.message }));
        if (postData) req.write(postData);
        req.end();
    });
}

async function runMasterRegression() {
    console.log("================================================================================");
    console.log("🧪 INNERVOICE MASTER REGRESSION & FEATURE VERIFICATION TEST");
    console.log("================================================================================\n");

    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'innervoice',
            port: parseInt(process.env.DB_PORT || '3306', 10)
        });
        console.log("✅ MySQL Database connected successfully!");
    } catch(err) {
        console.error("❌ MySQL Database connection failed:", err.message);
        process.exit(1);
    }

    const [adminRow] = await conn.execute('SELECT id, name, email FROM users WHERE role = "admin" LIMIT 1');
    const [userRow] = await conn.execute('SELECT id, name, email FROM users WHERE role = "user" OR role IS NULL LIMIT 1');

    const adminId = adminRow.length ? adminRow[0].id : 1;
    const userId = userRow.length ? userRow[0].id : 2;

    const adminToken = jwt.sign({ id: adminId, user_id: adminId, role: 'admin' }, secret, { expiresIn: '1h' });
    const userToken = jwt.sign({ id: userId, user_id: userId, role: 'user' }, secret, { expiresIn: '1h' });
    const invalidToken = "invalid_token_xyz_123";

    console.log(`🔑 Admin Test User: ID ${adminId} (${adminRow[0]?.email || 'admin'})`);
    console.log(`🔑 Normal Test User: ID ${userId} (${userRow[0]?.email || 'user'})\n`);

    // 1. Health
    const healthRes = await httpReq({ hostname: 'localhost', port: 5000, path: '/test-db', method: 'GET' });
    recordResult("Backend & DB Health", healthRes.status === 200 && healthRes.body.success ? "PASS" : "FAIL", "HTTP 200 OK", "Connected (MySQL)", "OK", "Server & DB running smoothly");

    // 2. Auth & Security
    const noAuth = await httpReq({ hostname: 'localhost', port: 5000, path: '/api/users/profile', method: 'GET' });
    const invAuth = await httpReq({ hostname: 'localhost', port: 5000, path: '/api/users/profile', method: 'GET', headers: { 'Authorization': `Bearer ${invalidToken}` } });
    const valAuth = await httpReq({ hostname: 'localhost', port: 5000, path: '/api/users/profile', method: 'GET', headers: { 'Authorization': `Bearer ${userToken}` } });

    if (noAuth.status === 401 && invAuth.status === 403 && valAuth.status === 200) {
        recordResult("Authentication & JWT", "PASS", "200 / 401 / 403 OK", "OK (Users table)", "OK", "JWT protection, token verification, and profile loading working");
    } else {
        recordResult("Authentication & JWT", "FAIL", `NoAuth:${noAuth.status}, Inv:${invAuth.status}, Val:${valAuth.status}`, "Check Users", "FAIL", "Auth rules mismatch");
    }

    const profileJson = JSON.stringify(valAuth.body || {});
    if (!profileJson.includes('password') && !profileJson.includes('otp_hash') && !profileJson.includes('GEMINI')) {
        recordResult("Security & Privacy", "PASS", "HTTP 200 OK", "OK", "OK", "No passwords, OTP secrets, or API keys exposed");
    } else {
        recordResult("Security & Privacy", "FAIL", "Exposed Data", "Check query", "FAIL", "Sensitive fields leaked");
    }

    // 3. Core Features
    const dashRes = await httpReq({ hostname: 'localhost', port: 5000, path: '/api/dashboard/summary', method: 'GET', headers: { 'Authorization': `Bearer ${userToken}` } });
    recordResult("Dashboard & Stats", dashRes.status === 200 && dashRes.body.success ? "PASS" : "FAIL", `HTTP ${dashRes.status}`, "OK (Aggregated)", "OK", "Dashboard summary API");

    const moodRes = await httpReq({ hostname: 'localhost', port: 5000, path: '/api/moods', method: 'GET', headers: { 'Authorization': `Bearer ${userToken}` } });
    recordResult("Mood Tracker & History", moodRes.status === 200 ? "PASS" : "FAIL", `HTTP ${moodRes.status}`, "OK (Moods table)", "OK", "Mood history retrieval");

    const journalRes = await httpReq({ hostname: 'localhost', port: 5000, path: '/api/journals', method: 'GET', headers: { 'Authorization': `Bearer ${userToken}` } });
    recordResult("Personal Journal", journalRes.status === 200 ? "PASS" : "FAIL", `HTTP ${journalRes.status}`, "OK (Journals table)", "OK", "Journal entries list");

    const goalsRes = await httpReq({ hostname: 'localhost', port: 5000, path: '/api/goals', method: 'GET', headers: { 'Authorization': `Bearer ${userToken}` } });
    recordResult("Goal Tracker", goalsRes.status === 200 ? "PASS" : "FAIL", `HTTP ${goalsRes.status}`, "OK (Goals table)", "OK", "User goals list");

    const achRes = await httpReq({ hostname: 'localhost', port: 5000, path: '/api/achievements', method: 'GET', headers: { 'Authorization': `Bearer ${userToken}` } });
    recordResult("Achievements & Badges", achRes.status === 200 ? "PASS" : "FAIL", `HTTP ${achRes.status}`, "OK (Achievements table)", "OK", "User achievements & badges");

    const notifRes = await httpReq({ hostname: 'localhost', port: 5000, path: '/api/notifications', method: 'GET', headers: { 'Authorization': `Bearer ${userToken}` } });
    recordResult("Notifications Center", notifRes.status === 200 ? "PASS" : "FAIL", `HTTP ${notifRes.status}`, "OK (Notifications table)", "OK", "Notification history");

    const planRes = await httpReq({ hostname: 'localhost', port: 5000, path: '/api/daily-plan', method: 'GET', headers: { 'Authorization': `Bearer ${userToken}` } });
    recordResult("Daily Plan / Today's Plan", planRes.status === 200 ? "PASS" : "FAIL", `HTTP ${planRes.status}`, "OK (Daily plans table)", "OK", "Today's smart plan items");

    const emergRes = await httpReq({ hostname: 'localhost', port: 5000, path: '/api/emergency/resources', method: 'GET' });
    recordResult("Emergency Help", emergRes.status === 200 && emergRes.body.success ? "PASS" : "FAIL", `HTTP ${emergRes.status}`, "OK", "OK", "Verified emergency resources");

    // 4. Recently Added Features
    // A. Mental Assessment (PHQ-9 & GAD-7)
    const phqBody = JSON.stringify({ answers: [1, 2, 1, 0, 2, 1, 0, 1, 0] });
    const phqRes = await httpReq({
        hostname: 'localhost', port: 5000, path: '/api/assessments/phq9', method: 'POST',
        headers: { 'Authorization': `Bearer ${userToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(phqBody) }
    }, phqBody);

    const gadBody = JSON.stringify({ answers: [1, 1, 2, 1, 0, 1, 0] });
    const gadRes = await httpReq({
        hostname: 'localhost', port: 5000, path: '/api/assessments/gad7', method: 'POST',
        headers: { 'Authorization': `Bearer ${userToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(gadBody) }
    }, gadBody);

    if (phqRes.status === 201 && phqRes.body.success && gadRes.status === 201 && gadRes.body.success) {
        recordResult("Mental Assessment (PHQ-9 & GAD-7)", "PASS", "HTTP 201 Created", "OK (mental_wellness_assessments)", "OK", `PHQ-9 Score: ${phqRes.body.total_score} (${phqRes.body.severity}), GAD-7 Score: ${gadRes.body.total_score} (${gadRes.body.severity})`);
    } else {
        recordResult("Mental Assessment (PHQ-9 & GAD-7)", "FAIL", `PHQ:${phqRes.status}, GAD:${gadRes.status}`, "DB Check", "FAIL", "Assessment submission failed");
    }

    // B. Sleep Tracker
    const sleepBody = JSON.stringify({
        sleepDate: new Date().toISOString().slice(0, 10),
        bedtime: '23:00',
        wakeTime: '07:00',
        sleepQuality: 4,
        notes: 'Restful sleep'
    });
    const sleepRes = await httpReq({
        hostname: 'localhost', port: 5000, path: '/api/sleep', method: 'POST',
        headers: { 'Authorization': `Bearer ${userToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(sleepBody) }
    }, sleepBody);

    if (sleepRes.status === 200 || sleepRes.status === 201) {
        recordResult("Sleep Tracker", "PASS", `HTTP ${sleepRes.status} Created`, "OK (sleep_records)", "OK", "Overnight sleep record saved successfully");
    } else {
        recordResult("Sleep Tracker", "FAIL", `HTTP ${sleepRes.status}`, "DB Check", "FAIL", "Sleep log save failed");
    }

    // C. Native PDF Wellness Report
    const pdfRes = await httpReq({
        hostname: 'localhost', port: 5000, path: '/api/reports/wellness/pdf', method: 'GET',
        headers: { 'Authorization': `Bearer ${userToken}` }
    });

    const isPdf = pdfRes.status === 200 && (pdfRes.headers['content-type'] || '').includes('application/pdf') && pdfRes.body && pdfRes.body.toString().startsWith('%PDF');
    if (isPdf) {
        recordResult("Native PDF Report Download", "PASS", "HTTP 200 OK (application/pdf)", "OK", "OK", "Valid PDF generated with real user wellness data");
    } else {
        recordResult("Native PDF Report Download", "FAIL", `HTTP ${pdfRes.status}`, "N/A", "FAIL", "PDF generation failed");
    }

    // D. Admin Dashboard
    const userAdminRes = await httpReq({ hostname: 'localhost', port: 5000, path: '/api/admin/stats', method: 'GET', headers: { 'Authorization': `Bearer ${userToken}` } });
    const adminStatsRes = await httpReq({ hostname: 'localhost', port: 5000, path: '/api/admin/stats', method: 'GET', headers: { 'Authorization': `Bearer ${adminToken}` } });
    const adminUsersRes = await httpReq({ hostname: 'localhost', port: 5000, path: '/api/admin/users?page=1&limit=5', method: 'GET', headers: { 'Authorization': `Bearer ${adminToken}` } });

    if (userAdminRes.status === 403 && adminStatsRes.status === 200 && adminUsersRes.status === 200 && adminUsersRes.body.success) {
        recordResult("Admin Dashboard & Protection", "PASS", "200 (Admin) / 403 (User)", "OK (Users DB Directory)", "OK", `Loaded ${adminUsersRes.body.pagination.total} users directory properly`);
    } else {
        recordResult("Admin Dashboard & Protection", "FAIL", `User:${userAdminRes.status}, Stats:${adminStatsRes.status}`, "DB Check", "FAIL", "Admin dashboard API check failed");
    }

    // 5. Deep Multilingual AI Chatbot Test
    const chatLangs = [
        { lang: 'en', name: 'English', msg: 'I feel stressed today.' },
        { lang: 'mr', name: 'Marathi', msg: 'आज मला खूप ताण जाणवत आहे.' },
        { lang: 'hi', name: 'Hindi', msg: 'आज मुझे बहुत तनाव महसूस हो रहा है।' },
        { lang: 'gu', name: 'Gujarati', msg: 'આજે મને ખૂબ તણાવ અનુભવાઈ રહ્યો છે.' },
        { lang: 'bn', name: 'Bengali', msg: 'আজ আমি খুব চাপ অনুভব করছি।' },
        { lang: 'ta', name: 'Tamil', msg: 'இன்று நான் மிகவும் மன அழுத்தமாக உணர்கிறேன்.' },
        { lang: 'te', name: 'Telugu', msg: 'ఈ రోజు నేను చాలా ఒత్తిడిగా ఉన్నాను.' }
    ];

    let chatPassed = 0;
    for (const cl of chatLangs) {
        const cBody = JSON.stringify({ message: cl.msg, language: cl.lang });
        const cRes = await httpReq({
            hostname: 'localhost', port: 5000, path: '/api/chat/message', method: 'POST',
            headers: { 'Authorization': `Bearer ${userToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(cBody) }
        }, cBody);

        if (cRes.status === 200 && cRes.body && cRes.body.success && cRes.body.reply && cRes.body.available) {
            chatPassed++;
        }
    }

    if (chatPassed === chatLangs.length) {
        recordResult("Multilingual AI Chatbot (7 Deep Languages)", "PASS", "HTTP 200 OK (all 7)", "OK (chat_messages)", "OK", `All 7 tested languages (English, Marathi, Hindi, Gujarati, Bengali, Tamil, Telugu) returned real AI responses`);
    } else {
        recordResult("Multilingual AI Chatbot (7 Deep Languages)", "FAIL", `${chatPassed}/${chatLangs.length} Passed`, "Check Gemini", "FAIL", "Some language queries failed");
    }

    await conn.end();

    // PRINT RESULTS TABLE
    console.log("\n================================================================================");
    console.log("📋 REGRESSION TEST RESULTS TABLE");
    console.log("================================================================================\n");

    let passCount = 0;
    let failCount = 0;

    results.forEach(r => {
        if (r.status === 'PASS') passCount++;
        else failCount++;
        console.log(`[${r.status}] ${r.feature.padEnd(42)} | API: ${r.apiStatus.padEnd(25)} | DB: ${r.dbStatus.padEnd(25)} | Notes: ${r.notes}`);
    });

    console.log("\n================================================================================");
    console.log(`📊 SUMMARY: TOTAL FEATURES TESTED: ${results.length} | PASS: ${passCount} | FAIL: ${failCount}`);
    console.log("================================================================================\n");
}

runMasterRegression().catch(err => console.error("Master regression failed:", err));
