const http = require('http');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

console.log("==================================================");
console.log("   INNERVOICE MASTER END-TO-END VERIFICATION   ");
console.log("==================================================");

const secret = process.env.JWT_SECRET || 'innervoice_secret_key_2026';

const adminToken = jwt.sign(
    { id: 1, user_id: 1, name: 'harshada chandan', email: 'chandanharshada1907@gmail.com', role: 'admin' },
    secret,
    { expiresIn: '1h' }
);

const normalToken = jwt.sign(
    { id: 2, user_id: 2, name: 'Normal Test User', email: 'normaluser@test.com', role: 'user' },
    secret,
    { expiresIn: '1h' }
);

function makeReq(urlPath, method = 'GET', bodyData = null, token = adminToken) {
    return new Promise((resolve) => {
        const payload = bodyData ? JSON.stringify(bodyData) : null;
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: urlPath,
            method: method,
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = {};
                try { parsed = JSON.parse(body); } catch(e){ parsed = { text: body }; }
                resolve({ status: res.statusCode, data: parsed });
            });
        });
        req.on('error', err => resolve({ status: 500, error: err }));
        if (payload) req.write(payload);
        req.end();
    });
}

async function runFullE2ETest() {
    const results = {};

    console.log("\n[A] AUTHENTICATION & ROLE ISOLATION");
    const adminProfile = await makeReq('/api/users/profile', 'GET', null, adminToken);
    const normalProfile = await makeReq('/api/users/profile', 'GET', null, normalToken);
    results.auth = (adminProfile.status === 200 && adminProfile.data.profile?.role === 'admin' &&
                    normalProfile.status === 200 && normalProfile.data.profile?.role === 'user');
    console.log("   Authentication & Roles:", results.auth ? "PASS ✅" : "FAIL ❌");

    console.log("\n[B] DASHBOARD SUMMARY");
    const dashboardData = await makeReq('/api/dashboard/summary', 'GET', null, adminToken);
    results.dashboard = (dashboardData.status === 200);
    console.log("   Dashboard Summary Status:", dashboardData.status, results.dashboard ? "PASS ✅" : "FAIL ❌");

    console.log("\n[C] MOOD TRACKER");
    const moodPost = await makeReq('/api/moods', 'POST', { mood: 'Good', intensity: 4, notes: 'Feeling productive' }, adminToken);
    const moodList = await makeReq('/api/moods', 'GET', null, adminToken);
    results.mood = (moodPost.status === 200 || moodPost.status === 201) && (moodList.status === 200);
    console.log("   Mood POST & GET Status:", moodPost.status, moodList.status, results.mood ? "PASS ✅" : "FAIL ❌");

    console.log("\n[D] JOURNAL & SENTIMENT");
    const journalPost = await makeReq('/api/journals', 'POST', { title: 'E2E Test Journal', content: 'Today was a great day with good progress.', mood: 'Good' }, adminToken);
    const journalList = await makeReq('/api/journals', 'GET', null, adminToken);
    results.journal = (journalPost.status === 200 || journalPost.status === 201) && (journalList.status === 200);
    console.log("   Journal POST & GET Status:", journalPost.status, journalList.status, results.journal ? "PASS ✅" : "FAIL ❌");

    console.log("\n[E] REFLECTIONS");
    const refPost = await makeReq('/api/reflections', 'POST', { prompt: 'What went well today?', content: 'Everything worked smoothly.' }, adminToken);
    const refList = await makeReq('/api/reflections', 'GET', null, adminToken);
    results.reflections = (refPost.status === 200 || refPost.status === 201) && (refList.status === 200);
    console.log("   Reflections Status:", refPost.status, refList.status, results.reflections ? "PASS ✅" : "FAIL ❌");

    console.log("\n[F] GOALS");
    const goalPost = await makeReq('/api/goals', 'POST', { title: 'Master Node.js', category: 'Growth', target_date: '2026-12-31' }, adminToken);
    const goalList = await makeReq('/api/goals', 'GET', null, adminToken);
    results.goals = (goalPost.status === 200 || goalPost.status === 201) && (goalList.status === 200);
    console.log("   Goals Status:", goalPost.status, goalList.status, results.goals ? "PASS ✅" : "FAIL ❌");

    console.log("\n[G] HABITS");
    const habitPost = await makeReq('/api/habits', 'POST', { title: 'Drink Water', frequency: 'daily' }, adminToken);
    const habitList = await makeReq('/api/habits', 'GET', null, adminToken);
    results.habits = (habitPost.status === 200 || habitPost.status === 201) && (habitList.status === 200);
    console.log("   Habits Status:", habitPost.status, habitList.status, results.habits ? "PASS ✅" : "FAIL ❌");

    console.log("\n[H] DAILY PLAN");
    const planRes = await makeReq('/api/daily-plan', 'GET', null, adminToken);
    results.dailyPlan = (planRes.status === 200);
    console.log("   Daily Plan Status:", planRes.status, results.dailyPlan ? "PASS ✅" : "FAIL ❌");

    console.log("\n[I] WELLNESS INSIGHTS & ANALYTICS");
    const insightsWeekly = await makeReq('/api/insights/weekly', 'GET', null, adminToken);
    const wellnessInsights = await makeReq('/api/wellness-insights', 'GET', null, adminToken);
    results.wellnessInsights = (insightsWeekly.status === 200 && wellnessInsights.status === 200);
    console.log("   Wellness Insights Status:", insightsWeekly.status, wellnessInsights.status, results.wellnessInsights ? "PASS ✅" : "FAIL ❌");

    console.log("\n[J] AI CHATBOT");
    const chatRes = await makeReq('/api/chat', 'POST', { message: 'Hello, how can you help me relax?' }, adminToken);
    results.chatbot = (chatRes.status === 200);
    console.log("   AI Chatbot Status:", chatRes.status, results.chatbot ? "PASS ✅" : "FAIL ❌");

    console.log("\n[K] EMOTION & TRIGGER PATTERNS");
    const triggerPost = await makeReq('/api/emotion-patterns', 'POST', { trigger_name: 'Traffic', emotion: 'Frustrated', intensity: 3 }, adminToken);
    const triggerList = await makeReq('/api/emotion-patterns', 'GET', null, adminToken);
    results.triggers = (triggerPost.status === 200 || triggerPost.status === 201) && (triggerList.status === 200);
    console.log("   Emotion Patterns Status:", triggerPost.status, triggerList.status, results.triggers ? "PASS ✅" : "FAIL ❌");

    console.log("\n[L] AI PERSONALIZATION MEMORY");
    const memoryPost = await makeReq('/api/ai-memory', 'POST', { category: 'Preference', fact: 'Prefers morning meditation' }, adminToken);
    const memoryList = await makeReq('/api/ai-memory', 'GET', null, adminToken);
    results.aiMemory = (memoryPost.status === 200 || memoryPost.status === 201) && (memoryList.status === 200);
    console.log("   AI Memory Status:", memoryPost.status, memoryList.status, results.aiMemory ? "PASS ✅" : "FAIL ❌");

    console.log("\n[M] FOCUS SESSIONS");
    const focusPost = await makeReq('/api/focus-mode/sessions', 'POST', { duration_minutes: 25, session_type: 'Work', completed: true }, adminToken);
    const focusList = await makeReq('/api/focus-mode/stats', 'GET', null, adminToken);
    results.focus = (focusPost.status === 200 || focusPost.status === 201) && (focusList.status === 200);
    console.log("   Focus Sessions Status:", focusPost.status, focusList.status, results.focus ? "PASS ✅" : "FAIL ❌");

    console.log("\n[N] VOICE JOURNAL");
    const voiceList = await makeReq('/api/voice-journals', 'GET', null, adminToken);
    results.voiceJournal = (voiceList.status === 200);
    console.log("   Voice Journal GET Status:", voiceList.status, results.voiceJournal ? "PASS ✅" : "FAIL ❌");

    console.log("\n[O] ACHIEVEMENTS");
    const achieveRes = await makeReq('/api/achievements', 'GET', null, adminToken);
    results.achievements = (achieveRes.status === 200);
    console.log("   Achievements Status:", achieveRes.status, results.achievements ? "PASS ✅" : "FAIL ❌");

    console.log("\n[P] RECOMMENDATIONS");
    const recRes = await makeReq('/api/recommendations', 'GET', null, adminToken);
    results.recommendations = (recRes.status === 200);
    console.log("   Recommendations Status:", recRes.status, results.recommendations ? "PASS ✅" : "FAIL ❌");

    console.log("\n[Q] NOTIFICATIONS");
    const notifRes = await makeReq('/api/notifications', 'GET', null, adminToken);
    results.notifications = (notifRes.status === 200);
    console.log("   Notifications Status:", notifRes.status, results.notifications ? "PASS ✅" : "FAIL ❌");

    console.log("\n[R] EMERGENCY HELP");
    const emergencyRes = await makeReq('/api/emergency', 'GET', null, adminToken);
    results.emergency = (emergencyRes.status === 200);
    console.log("   Emergency Help Status:", emergencyRes.status, results.emergency ? "PASS ✅" : "FAIL ❌");

    console.log("\n[S] SETTINGS / USER PROFILE");
    const userProfileRes = await makeReq('/api/users/profile', 'GET', null, adminToken);
    results.profile = (userProfileRes.status === 200);
    console.log("   User Profile Status:", userProfileRes.status, results.profile ? "PASS ✅" : "FAIL ❌");

    console.log("\n[T] ADMIN DASHBOARD & SECURITY");
    const adminStats = await makeReq('/api/admin/stats', 'GET', null, adminToken);
    const adminUsers = await makeReq('/api/admin/users?page=1&limit=5', 'GET', null, adminToken);
    const normalAdminDeny = await makeReq('/api/admin/stats', 'GET', null, normalToken);
    results.admin = (adminStats.status === 200 && adminUsers.status === 200 && normalAdminDeny.status === 403);
    console.log("   Admin Stats & Isolation Status:", adminStats.status, adminUsers.status, normalAdminDeny.status, results.admin ? "PASS ✅" : "FAIL ❌");

    console.log("\n==================================================");
    console.log("   SUMMARY OF ALL FEATURE DOMAINS VERIFIED   ");
    console.log("==================================================");

    const allPassed = Object.values(results).every(val => val === true);
    console.log("Overall System Health Status:", allPassed ? "100% HEALTHY ✅" : "ISSUES FOUND ❌");
}

runFullE2ETest().catch(console.error);
