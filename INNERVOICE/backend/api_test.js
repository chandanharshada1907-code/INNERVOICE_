const http = require('http');

function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch(e) { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function test() {
    // Test register
    const regData = JSON.stringify({ name: 'Audit User', email: 'audituser99@inner.com', password: 'audit12345' });
    const reg = await makeRequest({
        hostname: 'localhost', port: 5000,
        path: '/api/auth/register', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(regData) }
    }, regData);
    console.log('REGISTER:', JSON.stringify(reg));

    // Test login
    const loginData = JSON.stringify({ email: 'audituser99@inner.com', password: 'audit12345' });
    const login = await makeRequest({
        hostname: 'localhost', port: 5000,
        path: '/api/auth/login', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
    }, loginData);
    console.log('LOGIN:', JSON.stringify(login));
    
    if (login.body && login.body.token) {
        const token = login.body.token;
        
        // Test dashboard
        const dash = await makeRequest({
            hostname: 'localhost', port: 5000,
            path: '/api/dashboard/summary', method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        console.log('DASHBOARD status=' + dash.status + ':', JSON.stringify(dash.body).substring(0, 300));
        
        // Test mood post
        const moodData = JSON.stringify({ mood: 'Happy', icon: String.fromCodePoint(0x1F604) });
        const mood = await makeRequest({
            hostname: 'localhost', port: 5000,
            path: '/api/moods', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(moodData), 'Authorization': 'Bearer ' + token }
        }, moodData);
        console.log('MOOD POST status=' + mood.status + ':', JSON.stringify(mood.body));
        
        // Test moods get
        const moods = await makeRequest({
            hostname: 'localhost', port: 5000,
            path: '/api/moods', method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        console.log('MOODS GET status=' + moods.status + ':', JSON.stringify(moods.body).substring(0, 200));
        
        // Test mood analytics
        const analytics = await makeRequest({
            hostname: 'localhost', port: 5000,
            path: '/api/moods/analytics', method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        console.log('ANALYTICS status=' + analytics.status + ':', JSON.stringify(analytics.body).substring(0, 300));
        
        // Test achievements 
        const ach = await makeRequest({
            hostname: 'localhost', port: 5000,
            path: '/api/achievements', method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        console.log('ACHIEVEMENTS status=' + ach.status + ':', JSON.stringify(ach.body).substring(0, 300));
        
        // Test chat message
        const chatData = JSON.stringify({ message: 'Hello, how are you today?' });
        const chat = await makeRequest({
            hostname: 'localhost', port: 5000,
            path: '/api/chat/message', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(chatData), 'Authorization': 'Bearer ' + token }
        }, chatData);
        console.log('CHAT status=' + chat.status + ':', JSON.stringify(chat.body).substring(0, 300));
        
        // Test chat history
        const chatHist = await makeRequest({
            hostname: 'localhost', port: 5000,
            path: '/api/chat/history', method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        console.log('CHAT HISTORY status=' + chatHist.status + ':', JSON.stringify(chatHist.body).substring(0, 300));
        
        // Test recommendations
        const recs = await makeRequest({
            hostname: 'localhost', port: 5000,
            path: '/api/recommendations/today', method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        console.log('RECS status=' + recs.status + ':', JSON.stringify(recs.body).substring(0, 400));
        
        // Test journal post
        const journalData = JSON.stringify({ text: 'Today was a good day. I felt calm and focused.' });
        const journal = await makeRequest({
            hostname: 'localhost', port: 5000,
            path: '/api/journals', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(journalData), 'Authorization': 'Bearer ' + token }
        }, journalData);
        console.log('JOURNAL POST status=' + journal.status + ':', JSON.stringify(journal.body));
        
        // Test journal get
        const journals = await makeRequest({
            hostname: 'localhost', port: 5000,
            path: '/api/journals', method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        console.log('JOURNALS GET status=' + journals.status + ':', JSON.stringify(journals.body).substring(0, 200));
        
        // Test reflections post
        const refData = JSON.stringify({ question: 'What am I grateful for?', answer: 'I am grateful for my health and family.' });
        const ref = await makeRequest({
            hostname: 'localhost', port: 5000,
            path: '/api/reflections', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(refData), 'Authorization': 'Bearer ' + token }
        }, refData);
        console.log('REFLECTION POST status=' + ref.status + ':', JSON.stringify(ref.body));
        
        // Test goals post
        const goalsData = JSON.stringify({ title: 'Journal Daily', category: 'journal', target_value: 10, tracking_type: 'automatic' });
        const goals = await makeRequest({
            hostname: 'localhost', port: 5000,
            path: '/api/goals', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(goalsData), 'Authorization': 'Bearer ' + token }
        }, goalsData);
        console.log('GOALS POST status=' + goals.status + ':', JSON.stringify(goals.body));

        // Test user profile GET
        const profile = await makeRequest({
            hostname: 'localhost', port: 5000,
            path: '/api/users/profile', method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        console.log('PROFILE GET status=' + profile.status + ':', JSON.stringify(profile.body).substring(0, 300));
        
        // Test notifications
        const notif = await makeRequest({
            hostname: 'localhost', port: 5000,
            path: '/api/notifications', method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        console.log('NOTIFICATIONS status=' + notif.status + ':', JSON.stringify(notif.body).substring(0, 300));
    } else {
        console.log('Login FAILED - cannot test authenticated endpoints');
    }
}

test().catch(err => console.error('TEST ERROR:', err.message));
