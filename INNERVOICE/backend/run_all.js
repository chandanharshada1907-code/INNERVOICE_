const { execSync } = require('child_process');
const tests = [
    'test_api.js', 'test_daily_plan.js', 'test_goal_milestones.js', 
    'test_habits.js', 'test_mood_calendar.js', 'test_notifications_center.js', 
    'test_recommendations.js', 'test_weekly_report.js', 
    'test_wellness_insights.js', 'test_wellness_journey.js'
];
let passed = 0;
let failed = 0;
for (const t of tests) {
    console.log(`Running ${t}...`);
    try {
        execSync(`node ${t}`, { stdio: 'inherit' });
        passed++;
    } catch (e) {
        console.error(`${t} FAILED`);
        failed++;
    }
}
console.log(`\nResults: ${passed} passed, ${failed} failed`);
