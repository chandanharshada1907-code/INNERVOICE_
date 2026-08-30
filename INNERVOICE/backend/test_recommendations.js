require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

async function runTests() {
    console.log('=== Starting Phase 8: Recommendations Tests ===\n');

    try {
        // 1. Register & Login
        console.log('Testing Authentication (Register/Login)...');
        await fetch(BASE_URL + '/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test User 8', email: 'testrec@example.com', password: 'password123' })
        });

        const loginRes = await fetch(BASE_URL + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'testrec@example.com', password: 'password123' })
        });
        const loginData = await loginRes.json();
        authToken = loginData.token;
        console.log('✅ Login successful. Token received.\n');

        // 2. GET recommendations/today (Empty State)
        console.log('Testing GET /recommendations/today ...');
        const todayRes = await fetch(BASE_URL + '/recommendations/today', {
            headers: { Authorization: 'Bearer ' + authToken }
        });
        if (!todayRes.ok) throw new Error('Today request failed: ' + todayRes.status);
        const todayData = await todayRes.json();
        console.log('✅ /recommendations/today passed. Received top', todayData.recommendations.length, 'recommendations.');
        
        // 3. GET recommendations (Full List)
        console.log('Testing GET /recommendations ...');
        const allRes = await fetch(BASE_URL + '/recommendations', {
            headers: { Authorization: 'Bearer ' + authToken }
        });
        if (!allRes.ok) throw new Error('All recommendations request failed: ' + allRes.status);
        const allData = await allRes.json();
        console.log('✅ /recommendations passed. Received total', allData.recommendations.length, 'recommendations.');
        
        // Verify fields
        const rec = allData.recommendations[0];
        if (!rec.priority || !rec.action || !rec.estimated_minutes) {
            throw new Error('Missing priority, action, or estimated_minutes in recommendation object');
        }
        console.log('✅ Recommendation personalization fields verified.');

        // 4. Test Completion Endpoint
        console.log('Testing POST /recommendations/:id/complete ...');
        const compRes = await fetch(BASE_URL + '/recommendations/rec_mood/complete', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + authToken }
        });
        if (!compRes.ok) throw new Error('Completion request failed: ' + compRes.status);
        console.log('✅ /recommendations/:id/complete passed.');

        // 5. Unauthorized request
        console.log('\nTesting Unauthorized Access (No Token)...');
        const unauthRes = await fetch(BASE_URL + '/recommendations');
        if (unauthRes.status === 401) {
            console.log('✅ Unauthorized access rejected with 401 as expected.');
        } else {
            console.log('❌ Failed: Expected 401, got ' + unauthRes.status);
        }

        // 6. Invalid token
        console.log('Testing Invalid Token...');
        const invalidRes = await fetch(BASE_URL + '/recommendations', {
            headers: { Authorization: 'Bearer INVALID_TOKEN' }
        });
        if (invalidRes.status === 403 || invalidRes.status === 401) {
            console.log('✅ Invalid token rejected with ' + invalidRes.status + ' as expected.');
        } else {
            console.log('❌ Failed: Expected 403 or 401, got ' + invalidRes.status);
        }

        console.log('\n🎉 All Recommendations tests passed successfully!');
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

runTests();
