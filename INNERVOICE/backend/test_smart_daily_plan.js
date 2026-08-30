// Built-in fetch will be used

const API_URL = 'http://localhost:5000/api';
let token = '';

async function runTests() {
    console.log("Starting Smart Daily Plan Tests...\n");

    // 1. Setup - register and login
    const userEmail = `smartplan_test_${Date.now()}@example.com`;
    await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Smart Plan Test User', email: userEmail, password: 'password123' })
    });

    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password: 'password123' })
    });
    const loginData = await loginRes.json();
    token = loginData.token;
    
    if (!token) {
        console.error("Failed to authenticate test user.");
        return;
    }
    console.log("✅ Authenticated successfully.\n");

    try {
        // 2. Generate Plan
        console.log("Generating Smart Daily Plan...");
        const planRes = await fetch(`${API_URL}/daily-plan/generate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const planData = await planRes.json();
        
        if (planData.success && planData.activities.length > 0) {
            console.log(`✅ Plan generated successfully. Activities found: ${planData.activities.length}`);
        } else {
            throw new Error("Plan generation failed or returned no activities.");
        }
        
        const firstItemId = planData.activities[0].id;
        const secondItemId = planData.activities.length > 1 ? planData.activities[1].id : null;

        // 3. Complete Task
        console.log(`Completing task ${firstItemId}...`);
        const compRes = await fetch(`${API_URL}/daily-plan/items/${firstItemId}/complete`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const compData = await compRes.json();
        
        if (compData.success && compData.completion_percentage > 0) {
            console.log(`✅ Task completed successfully. Progress: ${compData.completion_percentage}%`);
        } else {
            throw new Error("Task completion failed.");
        }

        // 4. Skip Task
        if (secondItemId) {
            console.log(`Skipping task ${secondItemId}...`);
            const skipRes = await fetch(`${API_URL}/daily-plan/items/${secondItemId}/skip`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const skipRaw = await skipRes.text();
            let skipData;
            try {
                skipData = JSON.parse(skipRaw);
            } catch (e) {
                console.error("RAW RESPONSE:", skipRaw);
                throw e;
            }
            
            if (skipData.success) {
                console.log(`✅ Task skipped successfully. New Progress: ${skipData.completion_percentage}%`);
            } else {
                throw new Error("Task skipping failed.");
            }
        }

        // 5. Get History
        console.log("Fetching Plan History...");
        const histRes = await fetch(`${API_URL}/daily-plan/history`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const histData = await histRes.json();
        
        if (histData.success && histData.history.length > 0) {
            console.log("✅ Plan history fetched successfully.");
        } else {
            throw new Error("Plan history failed.");
        }

        console.log("\n🎉 ALL SMART DAILY PLAN TESTS PASSED!\n");
        process.exit(0);

    } catch (e) {
        console.error("\n❌ TEST FAILED:", e.message);
        process.exit(1);
    }
}

runTests();
