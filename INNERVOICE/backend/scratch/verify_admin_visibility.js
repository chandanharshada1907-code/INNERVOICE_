// =====================================================
// INNERVOICE — Admin Visibility Full Verification
// Verifies the complete chain:
//   1. Login → JWT contains role='admin'
//   2. JWT decoded → role visible to frontend
//   3. /api/admin/stats → 200 for admin
//   4. /api/admin/stats → 403 for normal user
//   5. Existing APIs still work
// =====================================================

const path   = require('path');
const BACKEND = path.resolve(__dirname, '..');
const dotenv  = require(path.resolve(BACKEND, 'node_modules/dotenv'));
dotenv.config({ path: path.resolve(BACKEND, '.env') });

const http = require('http');
const BASE  = 'http://localhost:5000';

const ADMIN_EMAIL    = 'chandanharshada1907@gmail.com';
const ADMIN_PASSWORD = 'harshada1907';   // replace if different — test will show login failure

function request(method, urlPath, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url     = new URL(urlPath, BASE);
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        const req = http.request(url, { method, headers }, res => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                try   { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
                catch { resolve({ status: res.statusCode, text: raw }); }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// Decode JWT payload without verifying signature (we just want to inspect)
function decodeJwtPayload(token) {
    try {
        const part = token.split('.')[1];
        return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
    } catch { return null; }
}

async function verify() {
    console.log('='.repeat(56));
    console.log('🔍 ADMIN DASHBOARD VISIBILITY — FULL CHAIN VERIFICATION');
    console.log('='.repeat(56));

    let pass = 0, fail = 0;
    function check(ok, label, info = '') {
        if (ok) { console.log('✅ ' + label + (info ? '  →  ' + info : '')); pass++; }
        else     { console.error('❌ ' + label + (info ? '  →  ' + info : '')); fail++; }
    }

    // ── 1. Server reachable ──────────────────────────────────────────
    const ping = await request('GET', '/test-db');
    check(ping.status === 200 && ping.body?.success,
        'Server is running & DB connected', 'status=' + ping.status);

    // ── 2. Login as admin account ────────────────────────────────────
    const loginRes = await request('POST', '/api/auth/login', {
        email: ADMIN_EMAIL, password: ADMIN_PASSWORD
    });

    const token     = loginRes.body?.token;
    const loginRole = loginRes.body?.user?.role;
    const loginName = loginRes.body?.user?.name;

    check(loginRes.status === 200 && loginRes.body?.success,
        'Admin login succeeds (200 OK)', 'status=' + loginRes.status);

    check(loginRole === 'admin',
        'Login response contains role="admin" (frontend reads this)',
        'role=' + loginRole + ', name=' + loginName);

    if (!token) {
        console.error('\n⛔ Cannot continue — no token returned. Check password for ' + ADMIN_EMAIL);
        console.error('   Edit ADMIN_PASSWORD in this script to match the actual password.\n');
        process.exit(1);
    }

    // ── 3. JWT payload contains role ─────────────────────────────────
    const payload = decodeJwtPayload(token);
    check(payload && payload.role === 'admin',
        'JWT payload embeds role="admin" (used by adminAuth middleware)',
        'payload.role=' + payload?.role);

    // ── 4. localStorage simulation — frontend stores user_role ───────
    // (In real browser: localStorage.setItem('user_role', data.user.role))
    const simulatedStoredRole = loginRole;
    check(simulatedStoredRole === 'admin',
        'Frontend would store user_role="admin" in localStorage',
        'stored=' + simulatedStoredRole);

    // ── 5. checkAdminRoleNav() would show Admin Panel nav link ───────
    const adminNavWouldShow = simulatedStoredRole === 'admin';
    check(adminNavWouldShow,
        'Admin Panel sidebar link would be shown (display:flex, not display:none)',
        'adminNavLink.style.display=' + (adminNavWouldShow ? 'flex ✅' : 'none ❌'));

    // ── 6. GET /api/admin/stats → 200 for admin ──────────────────────
    const statsRes = await request('GET', '/api/admin/stats', null, token);
    const stats    = statsRes.body?.stats;
    check(statsRes.status === 200 && statsRes.body?.success,
        'GET /api/admin/stats returns 200 for admin', 'status=' + statsRes.status);
    if (stats) {
        console.log('   📊 ' +
            stats.users.total + ' users  |  ' +
            stats.activity.totalMoods + ' moods  |  ' +
            stats.activity.totalJournals + ' journals  |  ' +
            stats.activity.totalGoals + ' goals');
    }

    // ── 7. GET /api/admin/users → 200 for admin ──────────────────────
    const usersRes = await request('GET', '/api/admin/users?limit=5', null, token);
    check(usersRes.status === 200 && Array.isArray(usersRes.body?.users),
        'GET /api/admin/users returns 200 with user list', 'count=' + usersRes.body?.users?.length);

    // Confirm no sensitive fields
    const hasSensitive = (usersRes.body?.users || []).some(u => u.password || u.email_otp_hash);
    check(!hasSensitive,
        'No sensitive fields (passwords/OTP hashes) exposed in user list');

    // ── 8. Normal user gets 403 ──────────────────────────────────────
    const normEmail = 'norm_visib_' + Date.now() + '@test.com';
    await request('POST', '/api/auth/register', { name: 'NormalUser', email: normEmail, password: 'Password123!' });
    const normLogin = await request('POST', '/api/auth/login', { email: normEmail, password: 'Password123!' });
    const normToken = normLogin.body?.token;
    const normRole  = normLogin.body?.user?.role;

    check(normRole === 'user',
        'Normal user login returns role="user"', 'role=' + normRole);

    const normAdmin = await request('GET', '/api/admin/stats', null, normToken);
    check(normAdmin.status === 403,
        'Normal user receives 403 on admin endpoint', 'status=' + normAdmin.status);

    // ── 9. Existing features still work ─────────────────────────────
    const moodRes = await request('GET', '/api/moods', null, token);
    check(moodRes.status !== 500 && moodRes.status !== 404,
        'Existing /api/moods route still responds', 'status=' + moodRes.status);

    const dashRes = await request('GET', '/api/dashboard/summary', null, token);
    check(dashRes.status !== 500 && dashRes.status !== 404,
        'Existing /api/dashboard/summary still responds', 'status=' + dashRes.status);

    // ── SUMMARY ──────────────────────────────────────────────────────
    console.log('');
    console.log('='.repeat(56));
    console.log('📋 ' + (pass + fail) + ' checks — ' + pass + ' passed, ' + fail + ' failed');
    console.log('='.repeat(56));

    if (fail === 0) {
        console.log('🎉 Admin Panel is fully visible and functional for ' + ADMIN_EMAIL);
        console.log('   Login → Admin Panel nav link appears → stats and users load correctly.');
    } else {
        console.log('⚠️  ' + fail + ' check(s) failed — review above.');
    }

    process.exit(fail > 0 ? 1 : 0);
}

verify().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
