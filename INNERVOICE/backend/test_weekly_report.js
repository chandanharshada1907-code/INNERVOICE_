const BASE_URL = "http://localhost:5000/api";
let token = "";

async function makeRequest(endpoint, method, data = null, headers = {}) {
    try {
        const config = { method, headers: { "Content-Type": "application/json", ...headers } };
        if (data) config.body = JSON.stringify(data);
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        const resData = await response.json();
        return { status: response.status, data: resData };
    } catch (error) {
        return { status: 500, data: { success: false, message: error.message } };
    }
}

async function runTests() {
    console.log("Starting Weekly Report Tests...");

    try {
        // 1. Register & Login
        const uniqueEmail = `test_wr_${Date.now()}@example.com`;
        await makeRequest("/auth/register", "POST", { name: "WR Test", email: uniqueEmail, password: "password123" });
        const loginRes = await makeRequest("/auth/login", "POST", { email: uniqueEmail, password: "password123" });
        token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        
        console.log("Authentication successful.");

        // 2. Fetch Weekly Report (Empty State)
        console.log("\n2. Fetching Weekly Report (Empty State)...");
        const wrEmptyRes = await makeRequest("/weekly-report", "GET", null, headers);
        console.log("Status:", wrEmptyRes.status, "Success:", wrEmptyRes.data.success);
        
        if (!wrEmptyRes.data.success) throw new Error("Failed to fetch report");
        
        const report = wrEmptyRes.data.report;
        console.log("Avg Wellness Score:", report.average_wellness_score);
        console.log("Total Moods:", report.total_moods);
        console.log("Journals:", report.journal_count);
        console.log("Consistency Score:", report.consistency_score + "%");

        // 3. Generate some data to see if it updates
        console.log("\n3. Generating test data...");
        // Log a mood
        await makeRequest("/moods/log", "POST", { mood: "happy", notes: "Feeling great", intensity: 8 }, headers);
        // Complete a daily plan item (forces daily plan generation)
        await makeRequest("/daily-plan/generate", "POST", null, headers);

        // 4. Fetch Weekly Report again
        console.log("\n4. Fetching Weekly Report (Populated)...");
        const wrPopRes = await makeRequest("/weekly-report", "GET", null, headers);
        console.log("Status:", wrPopRes.status, "Success:", wrPopRes.data.success);
        
        const popReport = wrPopRes.data.report;
        console.log("Total Moods:", popReport.total_moods);
        console.log("Positive Moods:", popReport.mood_distribution.positive);
        console.log("Strongest Day:", popReport.strongest_day);
        console.log("Consistency Score:", popReport.consistency_score + "%");
        console.log("Insight:", popReport.primary_insight);
        console.log("Recommendation:", popReport.next_week_recommendation);

        // 5. Unauthorized Access
        console.log("\n5. Testing Unauthorized Access...");
        const unauthRes = await makeRequest("/weekly-report", "GET");
        console.log("Status:", unauthRes.status);

        console.log("\n✅ All Weekly Report tests completed.");

    } catch (e) {
        console.error("Test failed:", e);
    }
}

runTests();
