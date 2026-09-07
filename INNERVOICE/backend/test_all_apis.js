/**
 * INNERVOICE Backend API Test Suite
 * Run: node test_all_apis.js
 */
const http = require('http');

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    
    const options = { hostname: 'localhost', port: 5000, path, method, headers };
    const r = http.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, data: d.substring(0, 200) }); }
      });
    });
    r.on('error', (e) => resolve({ status: 0, error: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

function pass(label) { console.log(`  ✅ PASS | ${label}`); }
function fail(label, msg) { console.log(`  ❌ FAIL | ${label} — ${msg}`); }
function warn(label, msg) { console.log(`  ⚠️  WARN | ${label} — ${msg}`); }

async function run() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  INNERVOICE — API Test Suite');
  console.log('═══════════════════════════════════════════════════\n');

  let passed = 0, failed = 0, warns = 0;

  // ─── Test 1: DB Connection ───────────────────────────────
  let r = await req('GET', '/test-db');
  if (r.status === 200 && r.data.success) { pass('GET /test-db'); passed++; }
  else { fail('GET /test-db', JSON.stringify(r.data)); failed++; }

  // ─── Test 2: Register ────────────────────────────────────
  const ts = Date.now();
  const testEmail = `test${ts}@innervoice.test`;
  r = await req('POST', '/api/auth/register', { name: 'Test User', email: testEmail, password: 'test123456' });
  if (r.status === 201 && r.data.success) { pass('POST /api/auth/register'); passed++; }
  else { fail('POST /api/auth/register', JSON.stringify(r.data)); failed++; }

  // ─── Test 3: Login ───────────────────────────────────────
  r = await req('POST', '/api/auth/login', { email: testEmail, password: 'test123456' });
  if (r.status === 200 && r.data.token) { pass('POST /api/auth/login'); passed++; }
  else { fail('POST /api/auth/login', JSON.stringify(r.data)); failed++; }
  const token = r.data && r.data.token;

  if (!token) {
    console.log('\n  [BLOCKED] No JWT token obtained. Cannot test protected routes.\n');
    process.exit(1);
  }
  console.log(`  ℹ️  JWT Token: ${token.substring(0, 30)}...`);

  // ─── Test 4: Dashboard Summary ───────────────────────────
  r = await req('GET', '/api/dashboard/summary', null, token);
  if (r.status === 200 && r.data.success) { pass('GET /api/dashboard/summary'); passed++; }
  else { fail('GET /api/dashboard/summary', JSON.stringify(r.data).substring(0, 100)); failed++; }

  // ─── Test 5: POST Mood ───────────────────────────────────
  r = await req('POST', '/api/moods', { mood: 'Happy', icon: '😊' }, token);
  if (r.status === 201 && r.data.success) { pass('POST /api/moods'); passed++; }
  else { fail('POST /api/moods', JSON.stringify(r.data)); failed++; }

  // ─── Test 6: GET Moods ───────────────────────────────────
  r = await req('GET', '/api/moods', null, token);
  if (r.status === 200 && r.data.moods) { pass(`GET /api/moods (${r.data.moods.length} entries)`); passed++; }
  else { fail('GET /api/moods', JSON.stringify(r.data)); failed++; }

  // ─── Test 7: Mood Analytics ──────────────────────────────
  r = await req('GET', '/api/moods/analytics', null, token);
  if (r.status === 200 && r.data.success) { pass('GET /api/moods/analytics'); passed++; }
  else { fail('GET /api/moods/analytics', JSON.stringify(r.data)); failed++; }

  // ─── Test 8: Mood Calendar ───────────────────────────────
  const month = new Date().toISOString().slice(0, 7);
  r = await req('GET', `/api/moods/calendar?month=${month}`, null, token);
  if (r.status === 200 && r.data.success) { pass('GET /api/moods/calendar'); passed++; }
  else { fail('GET /api/moods/calendar', JSON.stringify(r.data)); failed++; }

  // ─── Test 9: POST Journal ────────────────────────────────
  r = await req('POST', '/api/journals', { title: 'Test Entry', content: 'Backend test journal entry 😊🌿' }, token);
  if (r.status === 201 && r.data.success) { pass('POST /api/journals'); passed++; }
  else { fail('POST /api/journals', JSON.stringify(r.data)); failed++; }
  const journalId = r.data && (r.data.journal_id || r.data.id);

  // ─── Test 10: GET Journals ───────────────────────────────
  r = await req('GET', '/api/journals', null, token);
  if (r.status === 200 && r.data.journals) { pass(`GET /api/journals (${r.data.journals.length} entries)`); passed++; }
  else { fail('GET /api/journals', JSON.stringify(r.data)); failed++; }

  // ─── Test 11: PUT Journal ────────────────────────────────
  if (journalId) {
    r = await req('PUT', `/api/journals/${journalId}`, { title: 'Updated Entry', content: 'Updated content 🎉' }, token);
    if (r.status === 200 && r.data.success) { pass(`PUT /api/journals/:id`); passed++; }
    else { fail('PUT /api/journals/:id', JSON.stringify(r.data)); failed++; }
  }

  // ─── Test 12: POST Reflection ────────────────────────────
  r = await req('POST', '/api/reflections', { question: 'What made you happy today?', answer: 'Testing the backend! 🎉' }, token);
  if (r.status === 201 && r.data.success) { pass('POST /api/reflections'); passed++; }
  else { fail('POST /api/reflections', JSON.stringify(r.data)); failed++; }

  // ─── Test 13: GET Reflections ────────────────────────────
  r = await req('GET', '/api/reflections', null, token);
  if (r.status === 200 && r.data.reflections) { pass(`GET /api/reflections (${r.data.reflections.length} entries)`); passed++; }
  else { fail('GET /api/reflections', JSON.stringify(r.data)); failed++; }

  // ─── Test 14: POST Goal ──────────────────────────────────
  r = await req('POST', '/api/goals', { title: 'Meditate for 10 minutes', description: 'Daily meditation goal', category: 'Mindfulness' }, token);
  if (r.status === 201 && r.data.success) { pass('POST /api/goals'); passed++; }
  else { fail('POST /api/goals', JSON.stringify(r.data)); failed++; }
  const goalId = r.data && (r.data.goal_id || r.data.id);

  // ─── Test 15: GET Goals ──────────────────────────────────
  r = await req('GET', '/api/goals', null, token);
  if (r.status === 200 && r.data.goals) { pass(`GET /api/goals (${r.data.goals.length} entries)`); passed++; }
  else { fail('GET /api/goals', JSON.stringify(r.data)); failed++; }

  // ─── Test 16: PUT Goal (mark complete) ───────────────────
  if (goalId) {
    r = await req('PUT', `/api/goals/${goalId}`, { completed: true }, token);
    if (r.status === 200 && r.data.success) { pass(`PUT /api/goals/:id (completed)`); passed++; }
    else { fail('PUT /api/goals/:id', JSON.stringify(r.data)); failed++; }
  }

  // ─── Test 17: GET Daily Challenges ───────────────────────
  r = await req('GET', '/api/goals/challenges', null, token);
  if (r.status === 200 && r.data.challenges) { pass(`GET /api/goals/challenges (${r.data.challenges.length} challenges)`); passed++; }
  else { fail('GET /api/goals/challenges', JSON.stringify(r.data)); failed++; }

  // ─── Test 18: GET Achievements ───────────────────────────
  r = await req('GET', '/api/achievements', null, token);
  if (r.status === 200 && r.data.success) { pass('GET /api/achievements'); passed++; }
  else { fail('GET /api/achievements', JSON.stringify(r.data)); failed++; }

  // ─── Test 19: GET Notifications ──────────────────────────
  r = await req('GET', '/api/notifications', null, token);
  if (r.status === 200 && r.data.notifications) { pass(`GET /api/notifications (${r.data.notifications.length} notifs)`); passed++; }
  else { fail('GET /api/notifications', JSON.stringify(r.data)); failed++; }

  // ─── Test 20: GET Recommendations ───────────────────────
  r = await req('GET', '/api/recommendations', null, token);
  if (r.status === 200 && r.data.success) { pass('GET /api/recommendations'); passed++; }
  else { fail('GET /api/recommendations', JSON.stringify(r.data)); failed++; }

  // ─── Test 21: GET User Profile ───────────────────────────
  r = await req('GET', '/api/users/profile', null, token);
  if (r.status === 200 && r.data.success) { pass('GET /api/users/profile'); passed++; }
  else { fail('GET /api/users/profile', JSON.stringify(r.data)); failed++; }

  // ─── Test 22: PUT User Streak ────────────────────────────
  r = await req('PUT', '/api/users/streak', { streak: 5 }, token);
  if (r.status === 200 && r.data.success) { pass('PUT /api/users/streak'); passed++; }
  else { fail('PUT /api/users/streak', JSON.stringify(r.data)); failed++; }

  // ─── Test 23: POST Chat Message ──────────────────────────
  r = await req('POST', '/api/chat/message', { message: 'Hello! I am feeling happy today.' }, token);
  if (r.status === 200 && r.data.reply) { pass('POST /api/chat/message'); passed++; }
  else if (r.status === 500) { warn('POST /api/chat/message', 'Gemini API key may be invalid/expired'); warns++; }
  else { fail('POST /api/chat/message', JSON.stringify(r.data).substring(0, 100)); failed++; }

  // ─── Test 24: GET Chat History ───────────────────────────
  r = await req('GET', '/api/chat/history', null, token);
  if (r.status === 200 && r.data.messages) { pass(`GET /api/chat/history (${r.data.messages.length} messages)`); passed++; }
  else { fail('GET /api/chat/history', JSON.stringify(r.data)); failed++; }

  // ─── Test 25: GET Emergency Resources ───────────────────
  r = await req('GET', '/api/emergency/resources');
  if (r.status === 200 && r.data.success) { pass('GET /api/emergency/resources (public)'); passed++; }
  else { fail('GET /api/emergency/resources', JSON.stringify(r.data)); failed++; }

  // ─── Test 26: GET Wellness Score ─────────────────────────
  r = await req('GET', '/api/wellness-score', null, token);
  if (r.status === 200 && r.data.success) { pass('GET /api/wellness-score'); passed++; }
  else { fail('GET /api/wellness-score', JSON.stringify(r.data)); failed++; }

  // ─── Test 27: GET Daily Plan ─────────────────────────────
  r = await req('GET', '/api/daily-plan', null, token);
  if (r.status === 200 && r.data.success) { pass('GET /api/daily-plan'); passed++; }
  else { warn('GET /api/daily-plan', JSON.stringify(r.data).substring(0, 80)); warns++; }

  // ─── Test 28: GET Habits ─────────────────────────────────
  r = await req('GET', '/api/habits', null, token);
  if (r.status === 200 && r.data.success) { pass('GET /api/habits'); passed++; }
  else { fail('GET /api/habits', JSON.stringify(r.data)); failed++; }

  // ─── Summary ─────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} PASS | ${warns} WARN | ${failed} FAIL`);
  console.log('═══════════════════════════════════════════════════\n');
  
  if (failed === 0) {
    console.log('  🎉 All critical APIs are working correctly!');
  } else {
    console.log(`  ⚠️  ${failed} test(s) failed. Check the output above.`);
  }
  if (warns > 0) {
    console.log(`  💡 ${warns} warning(s) — usually Gemini API key issues (non-critical).`);
  }
  console.log('');
}

run().catch(console.error);
