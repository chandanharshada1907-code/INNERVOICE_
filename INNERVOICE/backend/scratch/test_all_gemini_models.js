const path = require('path');
require('dotenv').config({ path: 'c:/Users/HP/Downloads/INNERVOICE_updated/INNERVOICE_updated/INNERVOICE/backend/.env' });

const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

const candidateModels = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-3-flash-preview",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.7-flash"
];

async function testModels() {
    console.log("Testing candidate models for rate limits & responses...\n");
    for (const model of candidateModels) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: "Hello" }] }]
                })
            });
            if (res.ok) {
                const data = await res.json();
                const text = data.candidates[0].content.parts[0].text.trim();
                console.log(`✅ [${model}] SUCCESS! Response: "${text.substring(0, 40)}..."`);
            } else {
                const err = await res.text();
                console.log(`❌ [${model}] HTTP ${res.status}: ${err.substring(0, 100)}`);
            }
        } catch (e) {
            console.log(`❌ [${model}] EXCEPTION: ${e.message}`);
        }
    }
}

testModels();
