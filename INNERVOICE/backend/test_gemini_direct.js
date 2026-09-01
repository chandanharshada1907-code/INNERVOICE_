/**
 * test_gemini_direct.js
 * Makes ONE direct call to Gemini API to verify the key works.
 * NEVER prints the key. Shows only status code + error message from Google.
 */
require('dotenv').config();

const key = process.env.GEMINI_API_KEY || '';

console.log('=== GEMINI API DIRECT TEST ===\n');
console.log('Key present:', !!key);
console.log('Key length:', key.length);
console.log('First 4 chars:', JSON.stringify(key.substring(0, 4)));
console.log('Starts with AIza:', key.startsWith('AIza'));
console.log('');

if (!key || key === 'PASTE_YOUR_AIza_KEY_HERE') {
    console.log('ERROR: No valid key in .env. Exiting.');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`;

fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Say hello in one word.' }] }],
        generationConfig: { maxOutputTokens: 10 }
    })
})
.then(async res => {
    const body = await res.text();
    let parsed;
    try { parsed = JSON.parse(body); } catch(e) { parsed = body; }

    console.log('HTTP Status:', res.status, res.statusText);

    if (res.ok) {
        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('RESULT: SUCCESS — Gemini responded:', text.trim());
        console.log('\nKey is VALID. The chatbot will work.');
    } else {
        console.log('RESULT: FAILED');
        console.log('Error code:', parsed?.error?.code);
        console.log('Error status:', parsed?.error?.status);
        console.log('Error message:', parsed?.error?.message);

        if (parsed?.error?.status === 'UNAUTHENTICATED') {
            console.log('\nDIAGNOSIS: Key type is WRONG.');
            console.log('This is an OAuth access token, not a Gemini API key.');
            console.log('Gemini API keys from AI Studio start with "AIza" and are 39 chars.');
        } else if (parsed?.error?.status === 'PERMISSION_DENIED') {
            console.log('\nDIAGNOSIS: Key format may be correct but API is not enabled for this project.');
        } else if (parsed?.error?.status === 'INVALID_ARGUMENT') {
            console.log('\nDIAGNOSIS: Key format issue or request format issue.');
        }
    }
})
.catch(err => {
    console.log('NETWORK ERROR:', err.message);
});
