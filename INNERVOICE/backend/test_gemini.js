require('dotenv').config({ path: '.env' });
const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key present:', !!apiKey, apiKey ? ('length=' + apiKey.length + ', prefix=' + apiKey.substring(0,5)) : 'MISSING');

const models = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];

async function testModel(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = JSON.stringify({
    contents: [{role:'user', parts:[{text:'Say hello in exactly 5 words'}]}],
    generationConfig: { maxOutputTokens: 50 }
  });
  try {
    const resp = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body });
    const text = await resp.text();
    if (resp.ok) {
      const d = JSON.parse(text);
      const reply = d?.candidates?.[0]?.content?.parts?.[0]?.text || '(empty)';
      console.log(`  MODEL ${model} => HTTP ${resp.status} OK | Reply: ${reply.substring(0,60)}`);
      return true;
    } else {
      let errMsg = text.substring(0,120);
      try { const e = JSON.parse(text); errMsg = e?.error?.message || errMsg; } catch(x) {}
      console.log(`  MODEL ${model} => HTTP ${resp.status} FAIL | ${errMsg}`);
      return false;
    }
  } catch(e) {
    console.log(`  MODEL ${model} => NETWORK ERROR: ${e.message}`);
    return false;
  }
}

(async () => {
  console.log('--- Testing Gemini models ---');
  let found = null;
  for (const m of models) {
    const ok = await testModel(m);
    if (ok && !found) { found = m; }
  }
  if (found) {
    console.log(`\n=> WORKING model to use: ${found}`);
  } else {
    console.log('\n=> No model worked. API key may be invalid or expired.');
  }
})();
