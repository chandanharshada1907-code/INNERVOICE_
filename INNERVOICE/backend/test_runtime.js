// Test emoji encoding directly from Node.js (no PowerShell encoding issues)
// Run from: INNERVOICE/backend directory
require('dotenv').config();
const http = require('http');

function apiCall(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const bodyBytes = body ? Buffer.from(JSON.stringify(body), 'utf8') : null;
        const opts = {
            hostname: 'localhost',
            port: process.env.PORT || 5000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json',
                ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
                ...(bodyBytes ? { 'Content-Length': bodyBytes.length } : {})
            }
        };
        const req = http.request(opts, res => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                const rawBody = Buffer.concat(chunks).toString('utf8');
                resolve({ status: res.statusCode, body: rawBody });
            });
        });
        req.on('error', reject);
        if (bodyBytes) req.write(bodyBytes);
        req.end();
    });
}

async function run() {
    // 1. Login
    const lr = await apiCall('POST', '/api/auth/login', { email: 'testuser@innervoice.test', password: 'Test123!' });
    const lj = JSON.parse(lr.body);
    const TOKEN = lj.token;
    console.log('LOGIN:', lr.status, TOKEN ? '✅ TOKEN_OK' : '❌ NO_TOKEN');

    // 2. Post mood with real emoji
    const mr = await apiCall('POST', '/api/moods', { mood: 'Happy', icon: '😊' }, TOKEN);
    const mj = JSON.parse(mr.body);
    console.log('\n=== EMOJI TEST ===');
    console.log('MOOD POST status:', mr.status);
    console.log('  icon in response:', mj.icon);
    console.log('  icon is correct emoji:', mj.icon === '😊' ? '✅ PASS' : '❌ FAIL (got: ' + mj.icon + ')');

    // 3. Get moods back - check icon stored correctly
    const gr = await apiCall('GET', '/api/moods', null, TOKEN);
    const gj = JSON.parse(gr.body);
    console.log('\nMOODS GET status:', gr.status);
    gj.moods.slice(0, 3).forEach(m => {
        const ok = m.icon && (m.icon.includes('😊') || m.icon.includes('dY') === false);
        console.log(`  id=${m.id} mood=${m.mood} icon="${m.icon}" ${m.icon === '😊' ? '✅' : '❌'}`);
    });

    // 4. Dashboard streak check
    const dr = await apiCall('GET', '/api/dashboard/summary', null, TOKEN);
    const dj = JSON.parse(dr.body);
    console.log('\n=== STREAK TEST ===');
    console.log('  streak:', dj.streak, dj.streak >= 1 ? '✅ PASS' : '❌ FAIL (should be >= 1)');
    console.log('  latestMood.mood:', dj.latestMood?.mood);
    console.log('  latestMood.icon:', dj.latestMood?.icon);
    console.log('  journalCount:', dj.journalCount);
    console.log('  reflectionCount:', dj.reflectionCount);

    // 5. Test goal progress update - correct route is PUT /api/goals/:id
    const goalR = await apiCall('GET', '/api/goals', null, TOKEN);
    const goalJ = JSON.parse(goalR.body);
    console.log('\n=== GOAL PROGRESS TEST ===');
    if (goalJ.goals && goalJ.goals.length > 0) {
        const goalId = goalJ.goals[0].id;
        console.log('  goal_id:', goalId, 'current_progress:', goalJ.goals[0].current_progress);
        const pu = await apiCall('PUT', `/api/goals/${goalId}`, { current_progress: 3 }, TOKEN);
        const puj = JSON.parse(pu.body);
        console.log('  PUT /api/goals/:id status:', pu.status, puj.success ? '✅ PASS' : '❌ FAIL');
        console.log('  response:', pu.body.substring(0, 200));
    } else {
        console.log('  No goals found');
    }

    // 6. Notifications - check no crash
    const nt = await apiCall('GET', '/api/notifications', null, TOKEN);
    const ntj = JSON.parse(nt.body);
    console.log('\n=== NOTIFICATIONS TEST ===');
    console.log('  status:', nt.status, ntj.success ? '✅ PASS' : '❌ FAIL');
    console.log('  unread_count:', ntj.unread_count);

    console.log('\n✅ All Node.js tests complete');
}

run().catch(e => console.error('❌ FATAL:', e.message));
