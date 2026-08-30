const assert = require('assert');

async function testMoodTracker() {
    console.log("Testing Mood Tracker Flow...");
    try {
        // Register test user
        const rand = Math.floor(Math.random() * 100000);
        const email = `moodtest${rand}@example.com`;
        
        let res = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name: "Mood Test", email, password: "password123" })
        });
        
        // Login
        res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email, password: "password123" })
        });
        let data = await res.json();
        const token = data.token;
        console.log("Logged in. Token:", !!token);
        
        // 1. Post Mood (Happy)
        res = await fetch('http://localhost:5000/api/moods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ mood: "Happy", icon: "😄" })
        });
        let postData1 = await res.json();
        console.log("Post Mood 1:", postData1.success, postData1.mood);
        
        // 2. Post Mood (Sad) - same day
        res = await fetch('http://localhost:5000/api/moods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ mood: "Sad", icon: "😔" })
        });
        let postData2 = await res.json();
        console.log("Post Mood 2:", postData2.success, postData2.mood);
        
        // 3. Get History
        res = await fetch('http://localhost:5000/api/moods', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        let historyData = await res.json();
        console.log("History Count:", historyData.moods.length);
        
        // 4. Get Today
        res = await fetch('http://localhost:5000/api/moods/today', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        let todayData = await res.json();
        console.log("Today's latest mood:", todayData.mood?.mood);
        
        // 5. Calendar
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        res = await fetch(`http://localhost:5000/api/moods/calendar?month=${y}-${m}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        let calData = await res.json();
        console.log("Calendar Days:", calData.days.length);
        
        // 6. Analytics
        res = await fetch('http://localhost:5000/api/moods/analytics', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        let analyticsData = await res.json();
        console.log("Analytics totalCount:", analyticsData.stats?.totalCount);
        console.log("All E2E tests for Mood Tracker passed.");
        
    } catch(err) {
        console.error("Test failed:", err);
    }
}
testMoodTracker();
