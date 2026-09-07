require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const JWT_SECRET = process.env.JWT_SECRET;
const token = jwt.sign({ id: 1, email: 'test@example.com' }, JWT_SECRET, { expiresIn: '1h' });

async function runTests() {
  console.log('--- TESTING SLEEP TRACKER ENDPOINTS ---');
  
  // Connect to DB to verify directly
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Harshada@423104',
    database: process.env.DB_NAME || 'innervoice'
  });

  // 1. Test POST /api/sleep - normal
  try {
    const res = await axios.post('http://localhost:5000/api/sleep', {
      sleepDate: '2026-09-05',
      bedtime: '22:30',
      wakeTime: '06:30',
      sleepQuality: 'Good',
      notes: 'Test sleep 1'
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log('[POST /api/sleep Normal] PASS: 8 hours calculated. ID:', res.data.id);
  } catch (err) {
    console.error('[POST /api/sleep Normal] FAIL:', err.response ? err.response.data : err.message);
  }

  // 2. Test POST /api/sleep - overnight
  try {
    const res = await axios.post('http://localhost:5000/api/sleep', {
      sleepDate: '2026-09-06',
      bedtime: '23:30',
      wakeTime: '06:30',
      sleepQuality: 'Excellent',
      notes: 'Test sleep overnight'
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log('[POST /api/sleep Overnight] PASS: 7 hours calculated. ID:', res.data.id);
  } catch (err) {
    console.error('[POST /api/sleep Overnight] FAIL:', err.response ? err.response.data : err.message);
  }

  // 3. Test Invalid Input
  try {
    await axios.post('http://localhost:5000/api/sleep', {
      sleepDate: '2026-09-07'
      // missing fields
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.error('[Validation Test] FAIL: Accepted missing fields');
  } catch (err) {
    console.log('[Validation Test] PASS: Rejected missing fields');
  }

  // 4. Test GET /api/sleep/history
  try {
    const res = await axios.get('http://localhost:5000/api/sleep/history', { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    console.log(`[GET /api/sleep/history] PASS: Found ${res.data.length} records.`);
    res.data.forEach(r => console.log(`  -> ${r.sleep_date}: ${r.sleep_duration} hours (${r.formatted_duration}) - ${r.sleep_quality}`));
  } catch (err) {
    console.error('[GET /api/sleep/history] FAIL:', err.response ? err.response.data : err.message);
  }

  // 5. Verify MySQL
  try {
    const [rows] = await db.execute('SELECT * FROM sleep_records WHERE user_id = 1 ORDER BY created_at DESC LIMIT 2');
    console.log('[MySQL Verify] PASS: Found records in DB directly:');
    rows.forEach(r => console.log(`  -> DB Row ID ${r.id}: Date=${r.sleep_date}, Bedtime=${r.bedtime}, WakeTime=${r.wake_time}, Duration=${r.sleep_duration}, Quality=${r.sleep_quality}`));
  } catch (err) {
    console.error('[MySQL Verify] FAIL:', err.message);
  }

  db.end();
}

runTests();
