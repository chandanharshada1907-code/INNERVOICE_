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
    console.log("Starting Daily Plan Tests...");

    try {
        // 1. Register & Login
        const uniqueEmail = `test_dp_${Date.now()}@example.com`;
        await makeRequest("/auth/register", "POST", { name: "DP Test", email: uniqueEmail, password: "password123" });
        const loginRes = await makeRequest("/auth/login", "POST", { email: uniqueEmail, password: "password123" });
        token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        
        console.log("Authentication successful.");

        // 2. Generate/Get Daily Plan
        console.log("\n2. Fetching Daily Plan...");
        const planRes = await makeRequest("/daily-plan", "GET", null, headers);
        console.log("Status:", planRes.status, "Success:", planRes.data.success);
        
        if (!planRes.data.success) throw new Error("Failed to generate plan");
        
        const planId = planRes.data.plan.id;
        const activity = planRes.data.activities[0];
        console.log(`Plan ID: ${planId}, Activities: ${planRes.data.totalActivities}`);

        // 3. Complete Activity
        console.log("\n3. Completing Activity ID", activity.id);
        const compRes = await makeRequest(`/daily-plan/items/${activity.id}/complete`, "PUT", null, headers);
        console.log("Status:", compRes.status, "Success:", compRes.data.success, "New Progress:", compRes.data.completion_percentage + "%");

        // 4. Uncomplete Activity
        console.log("\n4. Uncompleting Activity ID", activity.id);
        const uncompRes = await makeRequest(`/daily-plan/items/${activity.id}/uncomplete`, "PUT", null, headers);
        console.log("Status:", uncompRes.status, "Success:", uncompRes.data.success, "New Progress:", uncompRes.data.completion_percentage + "%");

        // 5. Generate specific new plan
        console.log("\n5. Regenerating Daily Plan...");
        const regenRes = await makeRequest("/daily-plan/generate", "POST", null, headers);
        console.log("Status:", regenRes.status, "Success:", regenRes.data.success, "Activities:", regenRes.data.activities.length);

        // 6. Fetch History
        console.log("\n6. Fetching Plan History...");
        const histRes = await makeRequest("/daily-plan/history", "GET", null, headers);
        console.log("Status:", histRes.status, "Success:", histRes.data.success, "History Length:", histRes.data.history.length);

        // 7. Unauthorized Access
        console.log("\n7. Testing Unauthorized Access...");
        const unauthRes = await makeRequest("/daily-plan", "GET");
        console.log("Status:", unauthRes.status);

        console.log("\n✅ All Daily Plan tests completed.");

    } catch (e) {
        console.error("Test failed:", e);
    }
}

runTests();
