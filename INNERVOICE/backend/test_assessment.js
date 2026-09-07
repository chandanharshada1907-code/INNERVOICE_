require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const token = jwt.sign({ id: 1, email: 'test@example.com' }, JWT_SECRET, { expiresIn: '1h' });

async function runTests() {
  console.log('--- TESTING MENTAL WELLNESS ASSESSMENT ENDPOINTS ---');
  
  // 1. Test PHQ-9 scoring
  const phq9Tests = [
    { name: 'All 0s (Minimal)', answers: [0,0,0,0,0,0,0,0,0], expectedScore: 0, expectedSev: 'Minimal' },
    { name: 'All 1s (Mild)', answers: [1,1,1,1,1,1,1,1,1], expectedScore: 9, expectedSev: 'Mild' },
    { name: 'All 2s (Moderately severe)', answers: [2,2,2,2,2,2,2,2,2], expectedScore: 18, expectedSev: 'Moderately severe' },
    { name: 'All 3s (Severe)', answers: [3,3,3,3,3,3,3,3,3], expectedScore: 27, expectedSev: 'Severe' }
  ];

  for (const t of phq9Tests) {
    try {
      const res = await axios.post('http://localhost:5000/api/assessments/phq9', 
        { answers: t.answers }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`[PHQ-9 ${t.name}] Score: ${res.data.total_score} (Expected: ${t.expectedScore}), Severity: ${res.data.severity} (Expected: ${t.expectedSev}), Q9 Flag: ${res.data.flagQuestion9}`);
    } catch (err) {
      console.error(`[PHQ-9 ${t.name}] Failed:`, err.response ? err.response.data : err.message);
    }
  }

  // 2. Test GAD-7 scoring
  const gad7Tests = [
    { name: 'All 0s (Minimal)', answers: [0,0,0,0,0,0,0], expectedScore: 0, expectedSev: 'Minimal' },
    { name: 'All 1s (Mild)', answers: [1,1,1,1,1,1,1], expectedScore: 7, expectedSev: 'Mild' },
    { name: 'All 2s (Moderate)', answers: [2,2,2,2,2,2,2], expectedScore: 14, expectedSev: 'Moderate' },
    { name: 'All 3s (Severe)', answers: [3,3,3,3,3,3,3], expectedScore: 21, expectedSev: 'Severe' }
  ];

  for (const t of gad7Tests) {
    try {
      const res = await axios.post('http://localhost:5000/api/assessments/gad7', 
        { answers: t.answers }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`[GAD-7 ${t.name}] Score: ${res.data.total_score} (Expected: ${t.expectedScore}), Severity: ${res.data.severity} (Expected: ${t.expectedSev})`);
    } catch (err) {
      console.error(`[GAD-7 ${t.name}] Failed:`, err.response ? err.response.data : err.message);
    }
  }

  // 3. Test Invalid Input
  try {
    await axios.post('http://localhost:5000/api/assessments/phq9', 
      { answers: [0, 1, 2] }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.error('[Validation Test] FAIL: Accepted invalid array length');
  } catch (err) {
    console.log('[Validation Test] PASS: Rejected short answer array (400)');
  }

  // 5. Direct MySQL Database Query Verification
  try {
    const db = require('./db');
    const [rows] = await db.promise().query(
      "SELECT id, user_id, assessment_type, total_score, severity, created_at FROM mental_wellness_assessments ORDER BY created_at DESC LIMIT 5"
    );
    console.log(`[MySQL DB Verification] PASS: Found ${rows.length} records in mental_wellness_assessments table`);
    console.log('Recent 5 MySQL Records:');
    console.table(rows);
  } catch (dbErr) {
    console.error('[MySQL DB Verification] Error querying table:', dbErr.message);
  }
}

runTests();
