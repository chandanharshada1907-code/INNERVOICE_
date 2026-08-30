const db = require('./db');

async function testGenerate() {
    const userId = 9999;
    
    // Create dummy user
    await db.promise().query("INSERT IGNORE INTO users (id, name, email, password) VALUES (?, 'test', 'test_isolated_9999@example.com', 'pwd')", [userId]);
    
    const today = new Date().toISOString().slice(0, 10);
    const score = 50;
    const primaryFocus = "Steady Progress";
    const summary = "Let's check in with ourselves and maintain steady habits today.";

    try {
        await db.promise().query(
            `INSERT INTO daily_plans (user_id, plan_date, wellness_score, primary_focus, plan_summary, completion_percentage) 
             VALUES (?, ?, ?, ?, ?, 0) 
             ON DUPLICATE KEY UPDATE 
             wellness_score = VALUES(wellness_score), 
             primary_focus = VALUES(primary_focus), 
             plan_summary = VALUES(plan_summary), 
             completion_percentage = 0`,
            [userId, today, score, primaryFocus, summary]
        );
        console.log("Insert daily_plans SUCCESS");

        const [planRes] = await db.promise().query("SELECT id FROM daily_plans WHERE user_id = ? AND plan_date = ?", [userId, today]);
        const planId = planRes[0].id;
        console.log("Plan ID:", planId);

        await db.promise().query("DELETE FROM daily_plan_items WHERE daily_plan_id = ?", [planId]);
        console.log("Delete items SUCCESS");

        const candidateActivities = [{
            activity_type: "mood",
            title: "Daily Mood Check-in",
            description: "Take a moment to pause and notice how you're feeling.",
            priority: "HIGH",
            estimated_minutes: 1,
            reason: "Consistent check-ins build emotional awareness."
        }];

        for (let act of candidateActivities) {
            await db.promise().query(
                `INSERT INTO daily_plan_items (daily_plan_id, user_id, activity_type, title, description, priority, estimated_minutes, reason, completed)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
                [planId, userId, act.activity_type, act.title, act.description, act.priority, act.estimated_minutes, act.reason]
            );
        }
        console.log("Insert items SUCCESS");
    } catch(e) {
        console.error("ERROR:", e);
    }
    process.exit(0);
}
testGenerate();
