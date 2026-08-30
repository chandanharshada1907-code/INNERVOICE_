const BASE_URL = "http://localhost:5000/api";
let token = "";
let habitId = null;

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
    console.log("Starting Habits API Tests...");

    try {
        // 1. Register & Login
        const uniqueEmail = `test_habit_${Date.now()}@example.com`;
        await makeRequest("/auth/register", "POST", { name: "Habit Test", email: uniqueEmail, password: "password123" });
        const loginRes = await makeRequest("/auth/login", "POST", { email: uniqueEmail, password: "password123" });
        token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        
        console.log("1. Authentication successful.");

        // 2. Fetch Habits (Empty)
        const emptyRes = await makeRequest("/habits", "GET", null, headers);
        console.log("2. Fetch Habits (Empty):", emptyRes.data.habits.length === 0 ? "PASS" : "FAIL");

        // 3. Create Habit
        const createRes = await makeRequest("/habits", "POST", {
            name: "Test Morning Meditation",
            description: "10 mins",
            category: "Mindfulness",
            frequency_type: "daily",
            target_count: 7
        }, headers);
        console.log("3. Create Habit:", createRes.data.success ? "PASS" : "FAIL");
        habitId = createRes.data.habit_id;

        // 4. Complete Habit
        const completeRes = await makeRequest(`/habits/${habitId}/complete`, "POST", null, headers);
        console.log("4. Complete Habit:", completeRes.data.success ? "PASS" : "FAIL");

        // 5. Complete Habit (Duplicate check - should not fail, just return success or handle unique silently)
        // With ON DUPLICATE KEY UPDATE, it should succeed
        const dupRes = await makeRequest(`/habits/${habitId}/complete`, "POST", null, headers);
        console.log("5. Duplicate Completion handled:", dupRes.data.success ? "PASS" : "FAIL");

        // 6. Fetch Habits (Populated)
        const popRes = await makeRequest("/habits", "GET", null, headers);
        const fetchedHabit = popRes.data.habits[0];
        console.log("6. Fetch Habits (Populated):", fetchedHabit.name === "Test Morning Meditation" ? "PASS" : "FAIL");
        console.log("   - Completed Today:", fetchedHabit.completed_today ? "PASS" : "FAIL");
        console.log("   - Current Streak:", fetchedHabit.current_streak > 0 ? "PASS" : "FAIL");

        // 7. Habit Summary
        const summaryRes = await makeRequest("/habits/summary", "GET", null, headers);
        console.log("7. Habit Summary:", summaryRes.data.total_active === 1 ? "PASS" : "FAIL");

        // 8. Undo Completion
        const undoRes = await makeRequest(`/habits/${habitId}/uncomplete`, "POST", null, headers);
        console.log("8. Undo Completion:", undoRes.data.success ? "PASS" : "FAIL");

        const unpopRes = await makeRequest("/habits", "GET", null, headers);
        console.log("   - Completed Today:", unpopRes.data.habits[0].completed_today === false ? "PASS" : "FAIL");

        // 9. Soft Delete
        const deleteRes = await makeRequest(`/habits/${habitId}`, "DELETE", null, headers);
        console.log("9. Delete Habit:", deleteRes.data.success ? "PASS" : "FAIL");

        // 10. Fetch Habits (Empty again)
        const finalRes = await makeRequest("/habits", "GET", null, headers);
        console.log("10. Fetch Habits after Delete:", finalRes.data.habits.length === 0 ? "PASS" : "FAIL");

        // 11. Unauthorized Access
        const unauthRes = await makeRequest("/habits", "GET");
        console.log("11. Unauthorized Access:", unauthRes.status === 401 ? "PASS" : "FAIL");

        console.log("\n✅ All Habits tests completed.");

    } catch (e) {
        console.error("Test failed:", e);
    }
}

runTests();
