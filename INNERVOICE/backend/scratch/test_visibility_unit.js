// Unit verification of checkAdminRoleNav logic
const assert = require('assert');

function runTests() {
    let mockElement = { style: { display: 'none', setProperty(prop, val) { this.display = val; } } };
    
    let mockLocalStorage = {};

    function checkAdminRoleNav(mockWin) {
        const adminNavLink = mockElement;
        if (!adminNavLink) return;

        let role = mockLocalStorage['user_role'];

        if (!role) {
            try {
                const savedUser = JSON.parse(mockLocalStorage['innerVoiceCurrentUser']);
                if (savedUser && savedUser.role) {
                    role = savedUser.role;
                }
            } catch (e) {}
        }

        if (!role) {
            try {
                const token = mockLocalStorage['innerVoiceToken'];
                if (token) {
                    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
                    if (payload && payload.role) {
                        role = payload.role;
                    }
                }
            } catch (e) {}
        }

        if (!role && mockWin.currentUser && mockWin.currentUser.role) {
            role = mockWin.currentUser.role;
        }

        if (role === 'admin') {
            adminNavLink.style.setProperty('display', 'flex', 'important');
        } else {
            adminNavLink.style.setProperty('display', 'none', 'important');
        }
    }

    console.log('--- RUNNING ADMIN NAV VISIBILITY UNIT TESTS ---');

    // Test 1: Role 'admin' in user_role
    mockLocalStorage = { 'user_role': 'admin' };
    checkAdminRoleNav({});
    assert.strictEqual(mockElement.style.display, 'flex', 'Test 1 Failed');
    console.log('✅ Test 1 Passed: user_role = "admin" -> nav display: flex');

    // Test 2: Role 'admin' in innerVoiceCurrentUser fallback
    mockLocalStorage = { 'innerVoiceCurrentUser': JSON.stringify({ name: 'Admin User', role: 'admin' }) };
    checkAdminRoleNav({});
    assert.strictEqual(mockElement.style.display, 'flex', 'Test 2 Failed');
    console.log('✅ Test 2 Passed: innerVoiceCurrentUser role = "admin" -> nav display: flex');

    // Test 3: Role 'admin' in JWT token fallback
    const fakeTokenHeader = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
    const fakeTokenPayload = Buffer.from(JSON.stringify({ id: 1, email: 'admin@test.com', role: 'admin' })).toString('base64');
    const fakeToken = `${fakeTokenHeader}.${fakeTokenPayload}.signature`;
    mockLocalStorage = { 'innerVoiceToken': fakeToken };
    checkAdminRoleNav({});
    assert.strictEqual(mockElement.style.display, 'flex', 'Test 3 Failed');
    console.log('✅ Test 3 Passed: JWT innerVoiceToken payload role = "admin" -> nav display: flex');

    // Test 4: Regular user ('user') -> display: none
    mockLocalStorage = { 'user_role': 'user', 'innerVoiceCurrentUser': JSON.stringify({ role: 'user' }) };
    checkAdminRoleNav({});
    assert.strictEqual(mockElement.style.display, 'none', 'Test 4 Failed');
    console.log('✅ Test 4 Passed: Regular user role = "user" -> nav display: none');

    // Test 5: Unauthenticated user -> display: none
    mockLocalStorage = {};
    checkAdminRoleNav({});
    assert.strictEqual(mockElement.style.display, 'none', 'Test 5 Failed');
    console.log('✅ Test 5 Passed: No user logged in -> nav display: none');

    console.log('\n🎉 ALL 5 NAV VISIBILITY TESTS PASSED SUCCESSFULLY!');
}

runTests();
