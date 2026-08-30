const http = require("http");

const BACKEND_HOST = "localhost";
const BACKEND_PORT = 5000;

function makeRequest(method, path, headers = {}, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BACKEND_HOST,
            port: BACKEND_PORT,
            path: path,
            method: method,
            headers: {
                "Content-Type": "application/json",
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on("error", (err) => reject(err));
        if (body) {
            req.write(typeof body === "string" ? body : JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log("==================================================");
    console.log("🧪 INNERVOICE DAILY CHALLENGES END-TO-END TEST SUITE");
    console.log("==================================================\n");

    const testEmailA = `challenger_a_${Date.now()}@test.com`;
    const testEmailB = `challenger_b_${Date.now()}@test.com`;
    const testPassword = "Password123!";

    let tokenA = null;
    let tokenB = null;

    try {
        // 1. Register and Login User A
        console.log("▶ Step 1: Registering & Logging in User A...");
        const regARes = await makeRequest("POST", "/api/auth/register", {}, {
            name: "Challenger A",
            email: testEmailA,
            password: testPassword
        });
        if (regARes.status !== 201 && regARes.status !== 200) {
            throw new Error(`User A Registration failed: ${JSON.stringify(regARes.data)}`);
        }
        const loginARes = await makeRequest("POST", "/api/auth/login", {}, {
            email: testEmailA,
            password: testPassword
        });
        if (loginARes.status !== 200 || !loginARes.data.token) {
            throw new Error(`User A Login failed: ${JSON.stringify(loginARes.data)}`);
        }
        tokenA = loginARes.data.token;
        console.log("  ✅ User A registered and logged in with JWT token.\n");

        // 2. Register and Login User B
        console.log("▶ Step 2: Registering & Logging in User B...");
        const regBRes = await makeRequest("POST", "/api/auth/register", {}, {
            name: "Challenger B",
            email: testEmailB,
            password: testPassword
        });
        if (regBRes.status !== 201 && regBRes.status !== 200) {
            throw new Error(`User B Registration failed: ${JSON.stringify(regBRes.data)}`);
        }
        const loginBRes = await makeRequest("POST", "/api/auth/login", {}, {
            email: testEmailB,
            password: testPassword
        });
        if (loginBRes.status !== 200 || !loginBRes.data.token) {
            throw new Error(`User B Login failed: ${JSON.stringify(loginBRes.data)}`);
        }
        tokenB = loginBRes.data.token;
        console.log("  ✅ User B registered and logged in with JWT token.\n");

        // 3. Fetch Today's Challenges for User A
        console.log("▶ Step 3: Fetching today's daily challenges for User A (GET /api/goals/challenges)...");
        const challengesRes = await makeRequest("GET", "/api/goals/challenges", {
            "Authorization": `Bearer ${tokenA}`
        });
        console.log(`  Response status: ${challengesRes.status}`);
        if (challengesRes.status !== 200 || !challengesRes.data.success) {
            throw new Error(`Failed to fetch daily challenges: ${JSON.stringify(challengesRes.data)}`);
        }

        const challenges = challengesRes.data.challenges;
        const stats = challengesRes.data.stats;
        console.log(`  ✅ Loaded ${challenges.length} daily challenges for today (${challengesRes.data.date}).`);
        console.log(`  Stats: Total: ${stats.total}, Completed: ${stats.completed}, InProgress: ${stats.inProgress}, Streak: ${stats.streak}`);

        if (challenges.length < 5) {
            throw new Error(`Expected at least 5 seeded challenges, got ${challenges.length}`);
        }

        const categories = [...new Set(challenges.map(c => c.category))];
        console.log(`  Categories present: ${categories.join(", ")}`);

        const firstChallenge = challenges[0];
        console.log(`  Target Challenge: [ID: ${firstChallenge.id}] "${firstChallenge.title}" (${firstChallenge.category}, ${firstChallenge.difficulty}, +${firstChallenge.xp_reward} XP)`);

        // 4. Start Challenge
        console.log(`\n▶ Step 4: Starting Challenge #1 (POST /api/goals/challenges/${firstChallenge.id}/start)...`);
        const startRes = await makeRequest("POST", `/api/goals/challenges/${firstChallenge.id}/start`, {
            "Authorization": `Bearer ${tokenA}`
        });
        console.log(`  Status: ${startRes.status}, Message: ${startRes.data.message}`);
        if (startRes.status !== 200 || !startRes.data.success) {
            throw new Error(`Failed to start challenge: ${JSON.stringify(startRes.data)}`);
        }

        // Verify status transitioned to in_progress
        const verifyStartRes = await makeRequest("GET", "/api/goals/challenges", {
            "Authorization": `Bearer ${tokenA}`
        });
        const updatedFirst = verifyStartRes.data.challenges.find(c => c.id === firstChallenge.id);
        if (updatedFirst.status !== "in_progress") {
            throw new Error(`Expected status 'in_progress', got '${updatedFirst.status}'`);
        }
        console.log("  ✅ Challenge status successfully transitioned to 'in_progress'.");

        // 5. Complete Challenge and Verify XP Award
        console.log(`\n▶ Step 5: Completing Challenge #1 (POST /api/goals/challenges/${firstChallenge.id}/complete)...`);
        const completeRes = await makeRequest("POST", `/api/goals/challenges/${firstChallenge.id}/complete`, {
            "Authorization": `Bearer ${tokenA}`
        });
        console.log(`  Status: ${completeRes.status}, Message: ${completeRes.data.message}, XP: +${completeRes.data.xpAwarded}`);
        if (completeRes.status !== 200 || !completeRes.data.success) {
            throw new Error(`Failed to complete challenge: ${JSON.stringify(completeRes.data)}`);
        }
        console.log("  ✅ Challenge completed successfully and XP awarded.");

        // 6. Test Idempotency: Complete the same challenge again
        console.log(`\n▶ Step 6: Testing Idempotency (Completing Challenge #1 AGAIN)...`);
        const repeatCompleteRes = await makeRequest("POST", `/api/goals/challenges/${firstChallenge.id}/complete`, {
            "Authorization": `Bearer ${tokenA}`
        });
        console.log(`  Status: ${repeatCompleteRes.status}, AlreadyCompleted: ${repeatCompleteRes.data.alreadyCompleted}, XP Awarded: ${repeatCompleteRes.data.xpAwarded}`);
        if (!repeatCompleteRes.data.alreadyCompleted || repeatCompleteRes.data.xpAwarded !== 0) {
            throw new Error(`Idempotency check failed! Repeated complete awarded XP or failed: ${JSON.stringify(repeatCompleteRes.data)}`);
        }
        console.log("  ✅ Idempotency verified: Duplicate completion safely ignored and awarded 0 additional XP.");

        // 7. Verify Challenge History
        console.log(`\n▶ Step 7: Verifying Challenge History (GET /api/goals/challenges/history)...`);
        const historyRes = await makeRequest("GET", "/api/goals/challenges/history", {
            "Authorization": `Bearer ${tokenA}`
        });
        if (historyRes.status !== 200 || !historyRes.data.success) {
            throw new Error(`Failed to fetch challenge history: ${JSON.stringify(historyRes.data)}`);
        }
        const historyItems = historyRes.data.history;
        console.log(`  ✅ Challenge history contains ${historyItems.length} completed records.`);
        const foundInHistory = historyItems.find(h => h.id === firstChallenge.id);
        if (!foundInHistory) {
            throw new Error("Completed challenge not found in history!");
        }
        console.log(`  Found in history: "${foundInHistory.title}" completed at ${foundInHistory.completed_at}`);

        // 8. Create Custom Daily Challenge
        console.log(`\n▶ Step 8: Creating Custom Daily Challenge (POST /api/goals/challenges)...`);
        const customRes = await makeRequest("POST", "/api/goals/challenges", {
            "Authorization": `Bearer ${tokenA}`
        }, {
            title: "Custom 30-min Reading",
            description: "Read a wellness or personal growth book for 30 minutes.",
            category: "Self-Care",
            difficulty: "Medium",
            xp_reward: 35,
            target_value: 1
        });
        if (customRes.status !== 201 || !customRes.data.success) {
            throw new Error(`Failed to create custom challenge: ${JSON.stringify(customRes.data)}`);
        }
        console.log(`  ✅ Custom challenge created! ID: ${customRes.data.challenge_id}`);

        // 9. Security & User Scoping Check
        console.log(`\n▶ Step 9: Testing Security & User Isolation (User B attempting to complete User A's challenge)...`);
        const unauthorizedRes = await makeRequest("POST", `/api/goals/challenges/${firstChallenge.id}/complete`, {
            "Authorization": `Bearer ${tokenB}`
        });
        console.log(`  User B status code on User A challenge: ${unauthorizedRes.status}`);
        if (unauthorizedRes.status !== 404) {
            throw new Error(`Security breach: User B was able to access User A's challenge! Status: ${unauthorizedRes.status}`);
        }
        console.log("  ✅ Security verified: Cross-user access blocked.");

        // 10. Test Route Alias (/api/challenges)
        console.log(`\n▶ Step 10: Testing Route Alias (/api/challenges/challenges)...`);
        const aliasRes = await makeRequest("GET", "/api/challenges/challenges", {
            "Authorization": `Bearer ${tokenA}`
        });
        if (aliasRes.status !== 200 || !aliasRes.data.success) {
            throw new Error(`Alias route failed: ${JSON.stringify(aliasRes.data)}`);
        }
        console.log("  ✅ Alias route /api/challenges works seamlessly.");

        console.log("\n==================================================");
        console.log("🎉 ALL 10 DAILY CHALLENGE TESTS PASSED SUCCESSFULLY!");
        console.log("==================================================");

    } catch (err) {
        console.error("\n❌ TEST FAILED:", err.message);
        process.exit(1);
    }
}

runTests();
