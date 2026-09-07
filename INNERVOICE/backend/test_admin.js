// =====================================================
// INNERVOICE — Admin Dashboard API Test Suite
// 
// Tests at minimum:
//  1. No JWT  → 401
//  2. Invalid JWT → 401/403
//  3. Normal user JWT → 403
//  4. Admin JWT → 200
//  5. GET /api/admin/stats → real data
//  6. GET /api/admin/users → real users
//  7. User details endpoint → works
//  8. Sensitive fields are NOT returned
//  9. Existing user APIs still work
// 10. Application starts successfully
//
// ADDITIONAL TESTS (req. §9):
// - Invalid JWT token rejected
// - Admin self-deletion prevented
// - Delete without confirm=true rejected
// - Delete with confirm=true succeeds
// - Pagination works
// - Search filter works
// =====================================================

const path   = require('path');
const dotenv = require(path.resolve(__dirname, 'node_modules/dotenv'));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────
// HTTP Helper
// ─────────────────────────────────────────────────────────────
function request(method, reqPath, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(reqPath, BASE_URL);
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(url, { method, headers }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, text: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// ─────────────────────────────────────────────────────────────
// Test Runner
// ─────────────────────────────────────────────────────────────
async function runTests() {
    console.log('==================================================');
    console.log('🛡️  INNERVOICE ADMIN DASHBOARD — COMPREHENSIVE TEST SUITE');
    console.log('==================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(condition, testName, detail = '') {
        if (condition) {
            console.log(`✅ PASS: ${testName}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${testName}${detail ? ' — ' + detail : ''}`);
            failed++;
        }
    }

    try {

        // ─────────────────────────────────────────────────────────────
        // SETUP: Create normal user & get token
        // ─────────────────────────────────────────────────────────────
        const ts = Date.now();
        const normalEmail = `norm_admin_test_${ts}@test.com`;
        await request('POST', '/api/auth/register', {
            name: 'Normal User',
            email: normalEmail,
            password: 'Password123!'
        });
        const normalLoginRes = await request('POST', '/api/auth/login', {
            email: normalEmail,
            password: 'Password123!'
        });
        const normalToken = normalLoginRes.body?.token;
        assert(!!normalToken, 'SETUP: Normal user registered and logged in', `Got token: ${!!normalToken}`);

        // ─────────────────────────────────────────────────────────────
        // SETUP: Create admin user
        // ─────────────────────────────────────────────────────────────
        const adminEmail = `admin_test_${ts}@innervoice.test`;
        const adminPassword = 'AdminPassword123!';
        await request('POST', '/api/auth/register', {
            name: 'Admin Test Runner',
            email: adminEmail,
            password: adminPassword
        });

        // Promote to admin directly in DB
        const mysql = require('./node_modules/mysql2/promise');
        const dbConn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'innervoice',
            port: parseInt(process.env.DB_PORT || '3306', 10)
        });
        await dbConn.execute("UPDATE users SET `role` = 'admin' WHERE email = ?", [adminEmail]);
        await dbConn.end();

        const adminLoginRes = await request('POST', '/api/auth/login', {
            email: adminEmail,
            password: adminPassword
        });
        const adminToken = adminLoginRes.body?.token;
        const adminUserId = adminLoginRes.body?.user?.id;
        assert(!!adminToken && adminLoginRes.body?.user?.role === 'admin',
            'SETUP: Admin user created, promoted, and logged in with role=admin in JWT',
            `token=${!!adminToken}, role=${adminLoginRes.body?.user?.role}`);

        // ─────────────────────────────────────────────────────────────
        // SETUP: Create a target user for deletion test
        // ─────────────────────────────────────────────────────────────
        const targetEmail = `delete_target_${ts}@test.com`;
        const targetRegRes = await request('POST', '/api/auth/register', {
            name: 'Target Delete User',
            email: targetEmail,
            password: 'Password123!'
        });
        const targetUserId = targetRegRes.body?.user_id || targetRegRes.body?.user?.id;

        // ─────────────────────────────────────────────────────────────
        // TEST 1: No JWT → 401
        // ─────────────────────────────────────────────────────────────
        const res1 = await request('GET', '/api/admin/stats');
        assert(res1.status === 401, 'Test 1: Unauthenticated request returns 401', `status=${res1.status}`);

        // ─────────────────────────────────────────────────────────────
        // TEST 2: Invalid/garbage JWT → 403 (verifyToken returns 403 for bad tokens)
        // ─────────────────────────────────────────────────────────────
        const res2 = await request('GET', '/api/admin/stats', null, 'this_is_not_a_valid_jwt_token');
        assert(res2.status === 403, 'Test 2: Invalid/garbage JWT returns 403', `status=${res2.status}`);

        // ─────────────────────────────────────────────────────────────
        // TEST 3: Normal user JWT → 403 Forbidden
        // ─────────────────────────────────────────────────────────────
        const res3 = await request('GET', '/api/admin/stats', null, normalToken);
        assert(res3.status === 403 && res3.body?.message?.toLowerCase().includes('admin'),
            'Test 3: Normal authenticated user receives 403 from admin endpoint', `status=${res3.status}`);

        // ─────────────────────────────────────────────────────────────
        // TEST 4: Admin JWT → 200 on /api/admin/stats
        // ─────────────────────────────────────────────────────────────
        const res4 = await request('GET', '/api/admin/stats', null, adminToken);
        assert(res4.status === 200 && res4.body?.success === true,
            'Test 4: Admin JWT returns 200 on /api/admin/stats', `status=${res4.status}`);

        // ─────────────────────────────────────────────────────────────
        // TEST 5: Stats contains real data (total users > 0)
        // ─────────────────────────────────────────────────────────────
        const stats = res4.body?.stats;
        assert(
            stats && stats.users && stats.users.total > 0
            && typeof stats.activity.totalMoods === 'number'
            && typeof stats.activity.totalJournals === 'number'
            && typeof stats.activity.totalGoals === 'number'
            && typeof stats.activity.totalSleep === 'number'
            && typeof stats.activity.totalAssessments === 'number',
            'Test 5: GET /api/admin/stats returns real platform-wide aggregate data',
            `users=${stats?.users?.total}, moods=${stats?.activity?.totalMoods}`
        );

        // Print summary of stats
        console.log(`        📊 Platform Stats: ${stats.users.total} users (${stats.users.admins} admin), ` +
            `${stats.activity.totalMoods} moods, ${stats.activity.totalJournals} journals, ` +
            `${stats.activity.totalGoals} goals, ${stats.activity.totalSleep} sleep records`);

        // ─────────────────────────────────────────────────────────────
        // TEST 6: GET /api/admin/users → real users, NO passwords
        // ─────────────────────────────────────────────────────────────
        const res6 = await request('GET', '/api/admin/users', null, adminToken);
        const usersList = res6.body?.users;
        const hasSensitiveFields = Array.isArray(usersList) && usersList.some(u =>
            u.password || u.password_hash || u.email_otp_hash || u.phone_otp_hash ||
            u.email_otp_expires_at || u.phone_otp_expires_at
        );
        assert(
            res6.status === 200 && Array.isArray(usersList) && usersList.length > 0 && !hasSensitiveFields,
            'Test 6: GET /api/admin/users returns real users WITHOUT sensitive fields (passwords/OTP secrets)',
            `status=${res6.status}, count=${usersList?.length}, sensitiveFields=${hasSensitiveFields}`
        );

        // ─────────────────────────────────────────────────────────────
        // TEST 7: GET /api/admin/users?search=<term> filtering works
        // ─────────────────────────────────────────────────────────────
        const res7 = await request('GET', '/api/admin/users?search=admin&page=1&limit=20', null, adminToken);
        assert(res7.status === 200 && Array.isArray(res7.body?.users) && res7.body.users.length >= 1,
            'Test 7: GET /api/admin/users?search= filtering works correctly',
            `Found ${res7.body?.users?.length} users matching "admin"`
        );

        // ─────────────────────────────────────────────────────────────
        // TEST 8: GET /api/admin/users/:id returns user details + activity
        // ─────────────────────────────────────────────────────────────
        const res8 = await request('GET', `/api/admin/users/${adminUserId}`, null, adminToken);
        const userDetail = res8.body;
        assert(
            res8.status === 200 && userDetail?.success &&
            userDetail?.user?.id === adminUserId &&
            typeof userDetail?.activity?.moodCount === 'number' &&
            typeof userDetail?.activity?.journalCount === 'number' &&
            !userDetail?.user?.password &&
            !userDetail?.user?.email_otp_hash,
            'Test 8: GET /api/admin/users/:id returns user detail + activity WITHOUT sensitive fields',
            `status=${res8.status}, id=${userDetail?.user?.id}`
        );

        // ─────────────────────────────────────────────────────────────
        // TEST 9: Non-existent user → 404
        // ─────────────────────────────────────────────────────────────
        const res9 = await request('GET', '/api/admin/users/999999999', null, adminToken);
        assert(res9.status === 404, 'Test 9: Non-existent user ID returns 404', `status=${res9.status}`);

        // ─────────────────────────────────────────────────────────────
        // TEST 10: Admin self-deletion blocked
        // ─────────────────────────────────────────────────────────────
        const res10 = await request('DELETE', `/api/admin/users/${adminUserId}?confirm=true`, null, adminToken);
        assert(res10.status === 400 && res10.body?.message?.toLowerCase().includes('cannot delete'),
            'Test 10: Admin self-deletion is blocked (400 Bad Request)', `status=${res10.status}`);

        // ─────────────────────────────────────────────────────────────
        // TEST 11: Delete without confirm=true → 400
        // ─────────────────────────────────────────────────────────────
        if (targetUserId) {
            const res11 = await request('DELETE', `/api/admin/users/${targetUserId}`, null, adminToken);
            assert(res11.status === 400 && res11.body?.message?.toLowerCase().includes('confirm'),
                'Test 11: DELETE without confirm=true parameter returns 400', `status=${res11.status}`);

            // ─────────────────────────────────────────────────────────────
            // TEST 12: Delete with confirm=true → 200
            // ─────────────────────────────────────────────────────────────
            const res12 = await request('DELETE', `/api/admin/users/${targetUserId}?confirm=true`, null, adminToken);
            assert(res12.status === 200 && res12.body?.success === true,
                'Test 12: DELETE with confirm=true permanently removes user (200 OK)', `status=${res12.status}`);
        } else {
            console.log('  ⚠️  Skipping Tests 11-12: Could not get target user ID from registration response');
        }

        // ─────────────────────────────────────────────────────────────
        // TEST 13: Existing /api/auth/login still works (existing features intact)
        // ─────────────────────────────────────────────────────────────
        const res13 = await request('POST', '/api/auth/login', {
            email: adminEmail,
            password: adminPassword
        });
        assert(res13.status === 200 && res13.body?.success && res13.body?.token,
            'Test 13: Existing login API (/api/auth/login) still works after admin changes', `status=${res13.status}`);

        // ─────────────────────────────────────────────────────────────
        // TEST 14: Existing /api/dashboard/summary still works (not broken by admin changes)
        // ─────────────────────────────────────────────────────────────
        const res14 = await request('GET', '/api/dashboard/summary', null, adminToken);
        assert(res14.status !== 404 && res14.status !== 500,
            'Test 14: Existing /api/dashboard/summary route still responds (not broken)', `status=${res14.status}`);

        // ─────────────────────────────────────────────────────────────
        // TEST 15: Pagination metadata is correct
        // ─────────────────────────────────────────────────────────────
        const res15 = await request('GET', '/api/admin/users?page=1&limit=5', null, adminToken);
        const pg = res15.body?.pagination;
        assert(
            res15.status === 200 && pg && pg.page === 1 && pg.limit === 5 && pg.total > 0 && pg.totalPages >= 1,
            'Test 15: Pagination metadata is correct (page/limit/total/totalPages)',
            `page=${pg?.page}, limit=${pg?.limit}, total=${pg?.total}, totalPages=${pg?.totalPages}`
        );

        // ─────────────────────────────────────────────────────────────
        // TEST 16: Normal user cannot access /api/admin/users
        // ─────────────────────────────────────────────────────────────
        const res16 = await request('GET', '/api/admin/users', null, normalToken);
        assert(res16.status === 403,
            'Test 16: Normal authenticated user is denied access to /api/admin/users (403)',
            `status=${res16.status}`
        );

        // ─────────────────────────────────────────────────────────────
        // TEST 17: Normal user cannot access /api/admin/users/:id
        // ─────────────────────────────────────────────────────────────
        const res17 = await request('GET', `/api/admin/users/${adminUserId}`, null, normalToken);
        assert(res17.status === 403,
            'Test 17: Normal user is denied user-detail admin endpoint (403)',
            `status=${res17.status}`
        );

        // ─────────────────────────────────────────────────────────────
        // TEST 18: Server is running and DB connected
        // ─────────────────────────────────────────────────────────────
        const res18 = await request('GET', '/test-db');
        assert(res18.status === 200 && res18.body?.success,
            'Test 18: Server is running and MySQL database is connected',
            `status=${res18.status}`
        );

        // ─────────────────────────────────────────────────────────────
        // RESULTS
        // ─────────────────────────────────────────────────────────────
        console.log('\n==================================================');
        console.log(`📋 RESULTS: ${passed} Passed  |  ${failed} Failed`);
        console.log('==================================================');

        if (failed === 0) {
            console.log('🎉 ALL TESTS PASSED — Admin Dashboard is fully functional!');
        } else {
            console.log(`⚠️  ${failed} test(s) failed. Review output above.`);
        }

        process.exit(failed > 0 ? 1 : 0);

    } catch (err) {
        console.error('\n💥 Fatal error during test run:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

runTests();
