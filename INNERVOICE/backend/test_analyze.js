require('dotenv').config({ path: '.env' });
const apiKey = process.env.GEMINI_API_KEY;

// Test exact code from journals.js analyze endpoint to find the real failure
async function testAnalyzeCall() {
  console.log('Testing exact POST /api/journals/analyze Gemini call...\n');
  
  const journalText = "Today I was feeling stressed because I had many assignments, but I completed most of them and now I feel a little better.";
  const systemPrompt = `You are a compassionate wellness journal analysis assistant for INNERVOICE.
Analyze the following journal entry. Return ONLY a JSON object with exactly two keys:
- "sentiment": one of Positive, Negative, Mixed, Neutral, Reflective
- "insight": a warm, supportive 2-3 sentence reflection on the journal entry`;

  // Test 1: Exact current code (gemini-3.6-flash WITH responseMimeType)
  console.log('TEST 1: Current code (gemini-3.6-flash + responseMimeType=application/json)');
  const url1 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  try {
    const r1 = await fetch(url1, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nJournal Entry:\n${journalText}` }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 400,
          responseMimeType: 'application/json'
        }
      })
    });
    const text1 = await r1.text();
    if (r1.ok) {
      const d = JSON.parse(text1);
      console.log('  HTTP 200 OK! Raw reply:', JSON.stringify(d?.candidates?.[0]?.content?.parts?.[0]?.text || d).substring(0, 200));
    } else {
      let msg = text1;
      try { msg = JSON.parse(text1)?.error?.message; } catch(e) {}
      console.log(`  HTTP ${r1.status} FAIL: ${msg}`);
    }
  } catch(e) { console.log('  NETWORK ERROR:', e.message); }

  // Test 2: gemini-3.6-flash WITHOUT responseMimeType (plain text + manual JSON extraction)
  console.log('\nTEST 2: gemini-3.6-flash WITHOUT responseMimeType (plain text JSON)');
  const url2 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  try {
    const r2 = await fetch(url2, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nJournal Entry:\n${journalText}\n\nIMPORTANT: Respond with ONLY a valid JSON object, no other text.` }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 400
        }
      })
    });
    const text2 = await r2.text();
    if (r2.ok) {
      const d = JSON.parse(text2);
      const rawText = d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('  HTTP 200 OK! Raw reply text:', rawText.substring(0, 300));
      // Try JSON parse
      try {
        const stripped = rawText.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim();
        const parsed = JSON.parse(stripped);
        console.log('  Parsed JSON:', JSON.stringify(parsed));
      } catch(e) {
        console.log('  JSON parse failed:', e.message);
        // Try extracting { } block
        const s = text2.indexOf('{'), en = text2.lastIndexOf('}');
        if (s >= 0 && en > s) {
          try {
            const p = JSON.parse(rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}')+1));
            console.log('  Extracted JSON:', JSON.stringify(p));
          } catch(e2) { console.log('  Extraction also failed'); }
        }
      }
    } else {
      let msg = text2;
      try { msg = JSON.parse(text2)?.error?.message; } catch(e) {}
      console.log(`  HTTP ${r2.status} FAIL: ${msg}`);
    }
  } catch(e) { console.log('  NETWORK ERROR:', e.message); }

  // Test 3: gemini-flash-latest WITHOUT responseMimeType
  console.log('\nTEST 3: gemini-flash-latest WITHOUT responseMimeType (plain text JSON)');
  const url3 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
  try {
    const r3 = await fetch(url3, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nJournal Entry:\n${journalText}\n\nRespond ONLY with valid JSON.` }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 400 }
      })
    });
    const text3 = await r3.text();
    if (r3.ok) {
      const d = JSON.parse(text3);
      const rawText = d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('  HTTP 200 OK! Raw reply:', rawText.substring(0, 300));
    } else {
      let msg = text3;
      try { msg = JSON.parse(text3)?.error?.message; } catch(e) {}
      console.log(`  HTTP ${r3.status} FAIL: ${msg}`);
    }
  } catch(e) { console.log('  NETWORK ERROR:', e.message); }
}

testAnalyzeCall().catch(console.error);
