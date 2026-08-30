const db = require("./db");
require("dotenv").config();

const BASE_URL = "http://localhost:5000/api";

async function runTests() {
    console.log("=========================================");
    console.log("PHASE 11: GOALS & MILESTONES TEST SUITE");
    console.log("=========================================");

    let token1 = "", token2 = "";
    const userEmail1 = `goal1_${Date.now()}@test.com`;
    const userEmail2 = `goal2_${Date.now()}@test.com`;
    let goal1Id = null;
    let milestone1Id = null;

    try {
        // 1. Database Check
        const promiseDb = db.promise();
        await promiseDb.query("SELECT 1");
        console.log("✅ MySQL connected successfully!");

        // 2. Register users
        await fetch(`${BASE_URL}/auth/register`, { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ name: "Goal User 1", email: userEmail1, password: "password123" }) 
        });
        const login1Res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ email: userEmail1, password: "password123" }) 
        });
        const login1 = await login1Res.json();
        token1 = login1.token;

        await fetch(`${BASE_URL}/auth/register`, { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ name: "Goal User 2", email: userEmail2, password: "password123" }) 
        });
        const login2Res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ email: userEmail2, password: "password123" }) 
        });
        const login2 = await login2Res.json();
        token2 = login2.token;

        console.log("✅ Users registered.");

        // 3. Create Goal
        const createGoalRes = await fetch(`${BASE_URL}/goals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
            body: JSON.stringify({ 
                title: "Journal consistently", 
                category: "Journaling",
                priority: "high",
                target_value: 10,
                tracking_type: "manual"
            })
        });
        const createData = await createGoalRes.json();
        if (!createData.success || !createData.goal_id) throw new Error("Goal creation failed");
        goal1Id = createData.goal_id;
        console.log("✅ Manual Goal created.");

        // 4. Create Milestones
        const m1Res = await fetch(`${BASE_URL}/goals/${goal1Id}/milestones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
            body: JSON.stringify({ title: "3 journals", target_value: 3 })
        });
        const m1Data = await m1Res.json();
        if (!m1Data.success) throw new Error("Milestone creation failed");
        milestone1Id = m1Data.milestone_id;
        console.log("✅ Milestone created.");

        // 5. Update Progress manually and trigger milestone
        const putProgressRes = await fetch(`${BASE_URL}/goals/${goal1Id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
            body: JSON.stringify({ current_progress: 3 })
        });
        const putData = await putProgressRes.json();
        if (!putData.success) throw new Error("Progress update failed");

        // 6. Verify GET goals & milestone completion
        const getGoalsRes = await fetch(`${BASE_URL}/goals`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token1}` }
        });
        const getGoals = await getGoalsRes.json();
        const myGoal = getGoals.goals.find(g => g.id === goal1Id);
        
        if (myGoal.current_progress !== 3) throw new Error("Progress not saved");
        if (myGoal.status !== "IN_PROGRESS") throw new Error("Status incorrect");
        
        const myMilestone = myGoal.milestones.find(m => m.id === milestone1Id);
        if (!myMilestone || myMilestone.is_completed !== 1) throw new Error("Milestone not completed automatically");
        console.log("✅ Manual progress triggered milestone correctly.");

        // 7. Cross-user isolation
        const crossRes = await fetch(`${BASE_URL}/goals/${goal1Id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token2}` },
            body: JSON.stringify({ current_progress: 5 })
        });
        const crossData = await crossRes.json();
        if (crossData.success) throw new Error("Cross-user isolation failed (was able to edit another user's goal)");
        console.log("✅ Cross-user isolation verified.");

        // 8. Goal completion
        await fetch(`${BASE_URL}/goals/${goal1Id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
            body: JSON.stringify({ current_progress: 10 })
        });
        
        const summaryRes = await fetch(`${BASE_URL}/goals/summary`, {
            method: 'GET', headers: { 'Authorization': `Bearer ${token1}` }
        });
        const summary = await summaryRes.json();
        if (summary.completed !== 1) throw new Error("Summary didn't register completed goal");
        console.log("✅ Goal completion & summary verified.");

        // 9. Automatic Goal Progress Sync
        const autoGoalRes = await fetch(`${BASE_URL}/goals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
            body: JSON.stringify({ 
                title: "Journal Auto Goal", category: "Journaling", target_value: 5, tracking_type: "automatic"
            })
        });
        const autoGoalData = await autoGoalRes.json();
        const autoGoalId = autoGoalData.goal_id;

        // Insert a journal
        await fetch(`${BASE_URL}/journals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
            body: JSON.stringify({ content: "Testing auto tracking!" })
        });
        
        const autoGetRes = await fetch(`${BASE_URL}/goals/${autoGoalId}`, {
            method: 'GET', headers: { 'Authorization': `Bearer ${token1}` }
        });
        const autoGet = await autoGetRes.json();
        
        // Note: the singular GET /:id does not trigger sync in my implementation, 
        // GET / triggers sync!
        const autoGetAllRes = await fetch(`${BASE_URL}/goals`, {
            method: 'GET', headers: { 'Authorization': `Bearer ${token1}` }
        });
        const autoGetAll = await autoGetAllRes.json();
        const autoGoalStatus = autoGetAll.goals.find(g => g.id === autoGoalId);
        
        if (autoGoalStatus.current_progress !== 1) {
            console.error("Auto tracking failed, expected 1, got:", autoGoalStatus.current_progress);
            throw new Error("Automatic tracking failed");
        }
        console.log("✅ Automatic tracking verified.");

        console.log("=========================================");
        console.log("🎉 ALL GOAL TESTS PASSED!");
        console.log("=========================================");
        process.exit(0);

    } catch (err) {
        console.error("❌ TEST FAILED:", err.message);
        process.exit(1);
    }
}

runTests();
