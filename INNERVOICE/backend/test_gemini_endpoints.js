/**
 * test_gemini_endpoints.js
 * Tests different Gemini API versions/endpoints to find which one works
 * with the current credential. Never prints the key.
 */
require('dotenv').config();

const key = process.env.GEMINI_API_KEY || '';
console.log('=== GEMINI ENDPOINT DISCOVERY TEST ===\n');
console.log('Key present:', !!key, '| Length:', key.length, '| First4:', JSON.stringify(key.substring(0,4)));
console.log('');

const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: 'Say hello in one word.' }] }],
    generationConfig: { maxOutputTokens: 20 }
});

// Test every known Gemini endpoint + model combination
const endpoints = [
    // v1beta endpoints
    { label: 'v1beta gemini-1.5-flash',     url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}` },
    { label: 'v1beta gemini-1.5-pro',       url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${key}` },
    { label: 'v1beta gemini-pro',           url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}` },
    { label: 'v1beta gemini-2.0-flash',     url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}` },
    { label: 'v1beta gemini-2.0-flash-exp', url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}` },
    { label: 'v1beta gemini-2.5-flash',     url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}` },
    // v1 endpoints
    { label: 'v1 gemini-1.5-flash',         url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}` },
    { label: 'v1 gemini-pro',               url: `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${key}` },
    { label: 'v1 gemini-2.0-flash',         url: `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${key}` },
];

// Also test: list available models
const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

async function run() {
    // First: list available models
    console.log('--- Testing: List Available Models ---');
    try {
        const r = await fetch(listUrl);
        const b = await r.text();
        let p; try { p = JSON.parse(b); } catch(e) { p = b; }
        console.log('HTTP:', r.status);
        if (r.ok && p.models) {
            console.log('Available models:');
            p.models.slice(0, 10).forEach(m => console.log(' -', m.name, '| methods:', (m.supportedGenerationMethods||[]).join(',')));
        } else {
            console.log('Error:', p?.error?.status, '|', p?.error?.message?.substring(0, 100));
        }
    } catch(e) { console.log('Network error:', e.message); }

    console.log('');
    console.log('--- Testing generateContent endpoints ---');

    for (const ep of endpoints) {
        try {
            const r = await fetch(ep.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body
            });
            const b = await r.text();
            let p; try { p = JSON.parse(b); } catch(e) { p = b; }

            if (r.ok) {
                const text = p?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                console.log(`[SUCCESS] ${ep.label} → "${text.trim()}"`);
                console.log(`\n✅ WORKING ENDPOINT FOUND: ${ep.label}`);
                return ep.label;
            } else {
                const status = p?.error?.status || r.status;
                const msg = (p?.error?.message || '').substring(0, 80);
                console.log(`[${r.status}] ${ep.label} → ${status}: ${msg}`);
            }
        } catch(e) {
            console.log(`[ERR] ${ep.label} → ${e.message}`);
        }
    }
    console.log('\n❌ No working endpoint found with this key.');
}

run().catch(e => console.error('Fatal:', e.message));
