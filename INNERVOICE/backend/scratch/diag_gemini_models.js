const path = require('path');
require('dotenv').config({ path: 'c:/Users/HP/Downloads/INNERVOICE_updated/INNERVOICE_updated/INNERVOICE/backend/.env' });

const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

console.log('Gemini Key present:', !!geminiKey);
console.log('OpenAI Key present:', !!openaiKey);

async function testGeminiModels() {
    if (!geminiKey) return;
    
    // First, list available models using Gemini REST API
    try {
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`;
        const res = await fetch(listUrl);
        console.log('List models HTTP status:', res.status);
        if (res.ok) {
            const data = await res.json();
            console.log('Available Gemini models:');
            if (data.models) {
                data.models.forEach(m => {
                    if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                        console.log(' - ' + m.name);
                    }
                });
            }
        } else {
            const err = await res.text();
            console.log('List models error:', res.status, err);
        }
    } catch (e) {
        console.error('List models exception:', e.message);
    }
}

testGeminiModels();
