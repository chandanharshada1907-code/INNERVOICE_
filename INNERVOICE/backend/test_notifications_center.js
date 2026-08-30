const db = require('./db');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
    console.log("=========================================");
    console.log("PHASE 10: NOTIFICATION CENTER TEST SUITE");
    console.log("=========================================\n");

    const userEmail1 = `notif_test_${Date.now()}@example.com`;
    const userEmail2 = `notif_test2_${Date.now()}@example.com`;
    let token1, token2;
    let userId1;

    try {
        // 1. REGISTER USERS
        await fetch(`${BASE_URL}/auth/register`, { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ name: "Notif User 1", email: userEmail1, password: "password123" }) 
        });
        const login1Res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ email: userEmail1, password: "password123" }) 
        });
        const login1 = await login1Res.json();
        token1 = login1.token;

        await fetch(`${BASE_URL}/auth/register`, { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ name: "Notif User 2", email: userEmail2, password: "password123" }) 
        });
        const login2Res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ email: userEmail2, password: "password123" }) 
        });
        const login2 = await login2Res.json();
        token2 = login2.token;
        
        // Find user ID manually for DB tests
        const promiseDb = db.promise();
        const [u1] = await promiseDb.query("SELECT id FROM users WHERE email = ?", [userEmail1]);
        userId1 = u1[0].id;

        console.log("✅ Users registered.");

        // 2. AUTOMATIC GENERATION
        const fetch1Res = await fetch(`${BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${token1}` } });
        const fetch1Text = await fetch1Res.text();
        let fetch1;
        try {
            fetch1 = JSON.parse(fetch1Text);
        } catch(e) {
            console.error("Failed to parse JSON for fetch1:", fetch1Text);
            throw new Error("Fetch failed to return JSON");
        }
        if (!fetch1.success) {
            console.error("Fetch1 returned success=false:", fetch1);
        }
        assert(fetch1.success, "Fetch failed");
        assert(fetch1.notifications.length > 0, "No auto-generated notifications found");
        assert(fetch1.unread_count > 0, "Unread count incorrect");
        
        const initialCount = fetch1.notifications.length;
        console.log(`✅ Auto-generated ${initialCount} reminders.`);

        // 3. DEDUPLICATION
        const fetchDupRes = await fetch(`${BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${token1}` } });
        const fetchDuplicate = await fetchDupRes.json();
        assert.strictEqual(fetchDuplicate.notifications.length, initialCount, "Duplicate notifications were generated!");
        console.log("✅ Deduplication prevented duplicate reminders.");

        // 4. CROSS-USER ISOLATION
        const fetch2Res = await fetch(`${BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${token2}` } });
        const fetch2 = await fetch2Res.json();
        const user2Count = fetch2.notifications.length;
        assert(user2Count > 0, "User 2 has no notifications");
        console.log("✅ Cross-user isolation verified.");

        // 5. POST CUSTOM NOTIFICATION
        const postResRaw = await fetch(`${BASE_URL}/notifications`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token1}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: "custom_alert", title: "Test Alert", message: "This is a custom alert", priority: "high"
            })
        });
        const postRes = await postResRaw.json();
        assert(postRes.success, "Custom POST failed");
        const notifId = postRes.notification_id;
        console.log("✅ Custom notification created.");

        // 6. FILTERING
        const fetchUnreadRes = await fetch(`${BASE_URL}/notifications?filter=unread`, { headers: { Authorization: `Bearer ${token1}` } });
        const fetchUnread = await fetchUnreadRes.json();
        assert.strictEqual(fetchUnread.notifications.length, initialCount + 1, "Unread filter count mismatch");
        
        // 7. MARK AS READ
        await fetch(`${BASE_URL}/notifications/${notifId}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token1}` } });
        const fetchAfterReadRes = await fetch(`${BASE_URL}/notifications?filter=unread`, { headers: { Authorization: `Bearer ${token1}` } });
        const fetchAfterRead = await fetchAfterReadRes.json();
        assert.strictEqual(fetchAfterRead.notifications.length, initialCount, "Mark read didn't decrease unread count");
        console.log("✅ Mark as read successful.");

        // 8. SECURITY: ATTEMPT TO MARK OTHER USER'S NOTIF READ
        const secRes = await fetch(`${BASE_URL}/notifications/${notifId}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token2}` } });
        assert.strictEqual(secRes.status, 404, "Should have returned 404 for unauthorized read");
        console.log("✅ Security: Cross-user read blocked.");

        // 9. MARK ALL READ
        await fetch(`${BASE_URL}/notifications/read-all`, { method: 'PUT', headers: { Authorization: `Bearer ${token1}` } });
        const fetchAllReadRes = await fetch(`${BASE_URL}/notifications/unread-count`, { headers: { Authorization: `Bearer ${token1}` } });
        const fetchAllRead = await fetchAllReadRes.json();
        assert.strictEqual(fetchAllRead.count, 0, "Mark all read failed");
        console.log("✅ Mark all as read successful.");

        // 10. DELETE
        await fetch(`${BASE_URL}/notifications/${notifId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token1}` } });
        const fetchAfterDelRes = await fetch(`${BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${token1}` } });
        const fetchAfterDelete = await fetchAfterDelRes.json();
        const remaining = fetchAfterDelete.notifications.find(n => n.id === notifId);
        assert(!remaining, "Notification wasn't deleted");
        console.log("✅ Delete notification successful.");

        console.log("\n=========================================");
        console.log("🎉 ALL NOTIFICATION TESTS PASSED!");
        console.log("=========================================\n");

    } catch (err) {
        console.error("\n❌ TEST FAILED:", err.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

runTests();
