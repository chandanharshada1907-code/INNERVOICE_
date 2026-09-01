/**
 * test_chatbot_live.js
 * Tests the INNERVOICE AI chatbot endpoint with real messages.
 * Run: node test_chatbot_live.js  (backend must be running on port 5000)
 */
const http = require('http');

function httpReq(method, path, headers, body) {
    return new Promise((resolve, reject) => {
        const opts = {
            hostname: 'localhost',
            port: 5000,
            path,
            method,
            headers: { 'Content-Type': 'application/json', ...headers }
        };
        const req = http.request(opts, resp => {
            let d = '';
            resp.on('data', c => d += c);
            resp.on('end', () => {
                try { resolve({ status: resp.statusCode, data: JSON.parse(d) }); }
                catch (e) { resolve({ status: resp.statusCode, data: d }); }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTest() {
    console.log('==============================================');
    console.log('🤖 INNERVOICE CHATBOT LIVE AI RESPONSE TEST');
    console.log('==============================================\n');

    const ts = Date.now();
    const email = `chattest${ts}@innervoice.test`;
    const password = 'TestPass123!';

    // 1. Register
    const reg = await httpReq('POST', '/api/auth/register', {}, { name: 'ChatTestUser', email, password });
    console.log(`[1] Register:  HTTP ${reg.status} | success=${reg.data.success}`);
    if (reg.status !== 201) {
        console.error('ERROR: Registration failed. Is the server running on port 5000?');
        process.exit(1);
    }

    // 2. Login
    const login = await httpReq('POST', '/api/auth/login', {}, { email, password });
    console.log(`[2] Login:     HTTP ${login.status} | token=${!!login.data.token}`);
    if (!login.data.token) {
        console.error('ERROR: Login failed.');
        process.exit(1);
    }
    const token = login.data.token;
    const authHeader = { 'Authorization': `Bearer ${token}` };

    // 3. Test chatbot messages
    const testMessages = [
        'Give me motivation',
        'I am feeling stressed about college',
        'How can I relax?',
        'I had a difficult day today',
        'What can I do to improve my mood?'
    ];

    console.log('\n--- CHATBOT RESPONSE TESTS ---');
    let allPassed = true;

    for (let i = 0; i < testMessages.length; i++) {
        const msg = testMessages[i];
        const start = Date.now();
        const r = await httpReq('POST', '/api/chat/message', authHeader, { message: msg });
        const elapsed = Date.now() - start;

        const success = r.status === 200 && r.data.success === true && !!r.data.reply;
        const available = r.data.available !== false;
        const reply = r.data.reply || '';
        const isFallback = reply.includes('cloud AI connection is offline') ||
                           reply.includes('AI service is currently unavailable') ||
                           reply.includes('AI service is not configured') ||
                           reply.includes('offline wellness reflection mode') ||
                           reply.includes('trouble connecting right now');

        const icon = (success && available && !isFallback) ? 'PASS' : 'FAIL';
        if (!success || !available || isFallback) allPassed = false;

        console.log(`\n[${icon}] Test ${i+1}: "${msg}"`);
        console.log(`   HTTP: ${r.status} | success: ${r.data.success} | available: ${available} | time: ${elapsed}ms`);
        console.log(`   Reply: ${reply.substring(0, 200)}${reply.length > 200 ? '...' : ''}`);
        if (isFallback) console.log('   WARNING: Fallback/offline response detected!');
    }

    // 4. Journal analyze test
    console.log('\n--- JOURNAL ANALYZE TEST ---');
    const journalR = await httpReq('POST', '/api/journals/analyze', authHeader, {
        text: 'Today was really tough. I felt overwhelmed at work and could not focus on anything.'
    });
    const journalOk = journalR.status === 200 && journalR.data.success && journalR.data.analysis;
    console.log(`[${journalOk ? 'PASS' : 'FAIL'}] Journal Analyze: HTTP ${journalR.status} | success=${journalR.data.success} | available=${journalR.data.available}`);
    if (journalOk) {
        console.log(`   Sentiment: ${journalR.data.analysis.sentiment}`);
        console.log(`   Insight: ${(journalR.data.analysis.insight||'').substring(0,200)}`);
    } else {
        console.log(`   Message: ${journalR.data.message || 'No message'}`);
    }

    console.log('\n==============================================');
    console.log(allPassed ? 'ALL CHATBOT TESTS PASSED - Real AI responses confirmed!' : 'SOME TESTS FAILED - Check server logs.');
    console.log('==============================================\n');
    process.exit(allPassed ? 0 : 1);
}

runTest().catch(err => {
    console.error('Fatal error:', err.message);
    console.error('Make sure the backend server is running: node server.js');
    process.exit(1);
});
