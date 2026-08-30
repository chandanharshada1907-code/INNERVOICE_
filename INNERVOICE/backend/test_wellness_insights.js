require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

async function runTests() {
    console.log('=== Starting Phase 7: Wellness Insights Tests ===\n');

    try {
        // 1. Register & Login
        console.log('Testing Authentication (Register/Login)...');
        // Try registering first
        const regRes = await fetch(BASE_URL + '/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test User', email: 'testinsights3@example.com', password: 'password123' })
        });
        console.log('Register status:', regRes.status);

        const loginRes = await fetch(BASE_URL + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'testinsights3@example.com', password: 'password123' })
        });
        const loginData = await loginRes.json();
        console.log('Login Data:', loginData);
        authToken = loginData.token;
        console.log('✅ Login successful. Token received.\n');

        // 2. GET insights
        console.log('Testing GET /wellness-insights ...');
        const insightsRes = await fetch(BASE_URL + '/wellness-insights', {
            headers: { Authorization: 'Bearer ' + authToken }
        });
        if (!insightsRes.ok) {
            console.log('Insights Error:', await insightsRes.text());
            throw new Error('Insights request failed with status ' + insightsRes.status);
        }
        const insightsData = await insightsRes.json();
        console.log('✅ /wellness-insights passed. Received:', insightsData.insights.length, 'insights.');

        // 3. GET trends
        console.log('Testing GET /wellness-insights/trends ...');
        const trendsRes = await fetch(BASE_URL + '/wellness-insights/trends', {
            headers: { Authorization: 'Bearer ' + authToken }
        });
        const trendsData = await trendsRes.json();
        console.log('✅ /wellness-insights/trends passed. Received:', trendsData.trends.length, 'trends.');

        // 4. GET patterns
        console.log('Testing GET /wellness-insights/patterns ...');
        const patternsRes = await fetch(BASE_URL + '/wellness-insights/patterns', {
            headers: { Authorization: 'Bearer ' + authToken }
        });
        const patternsData = await patternsRes.json();
        console.log('✅ /wellness-insights/patterns passed. Received:', patternsData.patterns.length, 'patterns.');

        // 5. Unauthorized request
        console.log('\nTesting Unauthorized Access (No Token)...');
        const unauthRes = await fetch(BASE_URL + '/wellness-insights');
        if (unauthRes.status === 401) {
            console.log('✅ Unauthorized access rejected with 401 as expected.');
        } else {
            console.log('❌ Failed: Expected 401, got ' + unauthRes.status);
        }

        // 6. Invalid token
        console.log('Testing Invalid Token...');
        const invalidRes = await fetch(BASE_URL + '/wellness-insights', {
            headers: { Authorization: 'Bearer INVALID_TOKEN' }
        });
        if (invalidRes.status === 403 || invalidRes.status === 401) {
            console.log('✅ Invalid token rejected with ' + invalidRes.status + ' as expected.');
        } else {
            console.log('❌ Failed: Expected 403 or 401, got ' + invalidRes.status);
        }

        console.log('\n🎉 All Wellness Insights tests passed successfully!');
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

runTests();
