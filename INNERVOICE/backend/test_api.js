const http = require("http");

const BASE_URL = "http://localhost:5000/api";
let token = "";

async function makeRequest(path, method = "GET", body = null, useToken = true) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: `/api${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (useToken && token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = "";
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log("Starting API Tests...");
    const testEmail = `testuser_${Date.now()}@test.com`;
    const testPassword = "password123";

    try {
        // 1. Test Registration
        console.log("1. Testing Registration...");
        const regRes = await makeRequest("/auth/register", "POST", {
            name: "Test User",
            email: testEmail,
            password: testPassword
        }, false);
        console.log("Registration Response:", regRes.status, regRes.data.success);

        // 2. Test Login
        console.log("2. Testing Login...");
        const loginRes = await makeRequest("/auth/login", "POST", {
            email: testEmail,
            password: testPassword
        }, false);
        console.log("Login Response:", loginRes.status, loginRes.data.success);
        
        if (loginRes.data.token) {
            token = loginRes.data.token;
        } else {
            throw new Error("Failed to get token");
        }

        // 3. Test Add Mood
        console.log("3. Testing Add Mood...");
        const moodRes = await makeRequest("/moods", "POST", {
            mood: "happy",
            icon: "😊"
        });
        console.log("Add Mood Response:", moodRes.status, moodRes.data.success);

        // 4. Test Get Mood History
        console.log("4. Testing Get Mood History...");
        const getMoodsRes = await makeRequest("/moods", "GET");
        console.log("Get Moods Response:", getMoodsRes.status, getMoodsRes.data.success, "Count:", getMoodsRes.data.moods?.length);

        // 5. Test Dashboard Summary
        console.log("5. Testing Dashboard Summary...");
        const dashRes = await makeRequest("/dashboard/summary", "GET");
        console.log("Dashboard Response:", dashRes.status, dashRes.data.success);

        // 6. Test Voice Journal
        console.log("6. Testing Voice Journal...");
        const vjRes = await makeRequest("/voice-journals", "POST", { transcript: "Test transcript", duration: "01:23" });
        console.log("Create Voice Journal:", vjRes.status, vjRes.data.success);
        const getVjRes = await makeRequest("/voice-journals", "GET");
        console.log("Get Voice Journals:", getVjRes.status, getVjRes.data.success);
        if (getVjRes.data.journals && getVjRes.data.journals.length > 0) {
            const delVjRes = await makeRequest(`/voice-journals/${getVjRes.data.journals[0].id}`, "DELETE");
            console.log("Delete Voice Journal:", delVjRes.status, delVjRes.data.success);
        }

        // 7. Test Emotion Patterns
        console.log("7. Testing Emotion Patterns...");
        const getTriggersRes = await makeRequest("/emotion-patterns/triggers", "GET");
        console.log("Get Triggers:", getTriggersRes.status, getTriggersRes.data.success, getTriggersRes.data.triggers?.length);
        
        let moodId = 1;
        if (getMoodsRes.data.moods && getMoodsRes.data.moods.length > 0) {
            moodId = getMoodsRes.data.moods[0].id;
        }
        
        const logTriggerRes = await makeRequest("/emotion-patterns", "POST", { 
            mood_id: moodId, 
            custom_trigger_name: "Testing Custom Trigger", 
            context_note: "Just testing" 
        });
        console.log("Log Trigger:", logTriggerRes.status, logTriggerRes.data.success);
        const epHistoryRes = await makeRequest("/emotion-patterns/history", "GET");
        console.log("Get Emotion Patterns History:", epHistoryRes.status, epHistoryRes.data.success);
        const epPatternsRes = await makeRequest("/emotion-patterns/patterns", "GET");
        console.log("Get Emotion Patterns:", epPatternsRes.status, epPatternsRes.data.success);
        if (epHistoryRes.data.history && epHistoryRes.data.history.length > 0) {
            const delTriggerRes = await makeRequest(`/emotion-patterns/${epHistoryRes.data.history[0].id}`, "DELETE");
            console.log("Delete Trigger:", delTriggerRes.status, delTriggerRes.data.success);
        }

        // 8. Test Focus Mode
        console.log("8. Testing Focus Mode...");
        const fmStartRes = await makeRequest("/focus/start", "POST", { task_name: "Testing Focus", duration: 25 });
        console.log("Start Focus Mode:", fmStartRes.status, fmStartRes.data.success);
        if (fmStartRes.data.session_id) {
            const fmCompleteRes = await makeRequest("/focus/complete", "POST", { session_id: fmStartRes.data.session_id });
            console.log("Complete Focus Mode:", fmCompleteRes.status, fmCompleteRes.data.success);
        }
        const fmHistoryRes = await makeRequest("/focus/history", "GET");
        console.log("Get Focus History:", fmHistoryRes.status, fmHistoryRes.data.success);
        const fmStatsRes = await makeRequest("/focus/stats", "GET");
        console.log("Get Focus Stats:", fmStatsRes.status, fmStatsRes.data.success);

        // 9. Test AI Memory
        console.log("9. Testing AI Memory...");
        const memCreateRes = await makeRequest("/ai-memory", "POST", { memory_key: "test_key", memory_value: "test_value" });
        console.log("Create AI Memory:", memCreateRes.status, memCreateRes.data.success);
        const memGetRes = await makeRequest("/ai-memory", "GET");
        console.log("Get AI Memory:", memGetRes.status, memGetRes.data.success);
        if (memCreateRes.data.id) {
            const memUpdateRes = await makeRequest(`/ai-memory/${memCreateRes.data.id}`, "PUT", { memory_value: "updated_test_value" });
            console.log("Update AI Memory:", memUpdateRes.status, memUpdateRes.data.success);
            const memDelRes = await makeRequest(`/ai-memory/${memCreateRes.data.id}`, "DELETE");
            console.log("Delete AI Memory:", memDelRes.status, memDelRes.data.success);
        }
        const memClearRes = await makeRequest("/ai-memory", "DELETE");
        console.log("Clear All AI Memory:", memClearRes.status, memClearRes.data.success);

        // 10. Test Wellness Score
        console.log("10. Testing Wellness Score...");
        const wsCalcRes = await makeRequest("/wellness-score/calculate", "POST");
        console.log("Calculate Wellness Score:", wsCalcRes.status, wsCalcRes.data.success, "Score:", wsCalcRes.data.score);
        const wsHistoryRes = await makeRequest("/wellness-score", "GET");
        console.log("Get Wellness History:", wsHistoryRes.status, wsHistoryRes.data.success, "Count:", wsHistoryRes.data.history?.length);

        // 11. Testing Unauthorized Access
        console.log("11. Testing Unauthorized Access...");
        const unauthVjRes = await makeRequest("/voice-journals", "GET", null, false);
        console.log("Unauthorized Voice Journal:", unauthVjRes.status);
        const unauthMemRes = await makeRequest("/ai-memory", "GET", null, false);
        console.log("Unauthorized AI Memory:", unauthMemRes.status);

        console.log("✅ All API tests executed successfully!");

    } catch (e) {
        console.error("Test execution failed:", e.message);
    }
}

runTests();
