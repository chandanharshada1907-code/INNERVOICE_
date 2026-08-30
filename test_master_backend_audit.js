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

async function runMasterAudit() {
    console.log("==================================================");
    console.log("🔍 INNERVOICE MASTER BACKEND INTEGRATION AUDIT");
    console.log("==================================================\n");

    const auditResults = [];

    function record(moduleName, testName, passed, details = "") {
        auditResults.push({ moduleName, testName, passed, details });
        const icon = passed ? "✅" : "❌";
        console.log(`  ${icon} [${moduleName}] ${testName} ${details ? "(" + details + ")" : ""}`);
    }

    const testEmail = `audit_user_${Date.now()}@test.com`;
    const testPassword = "Password123!";
    let token = null;
    let userId = null;

    try {
        // 1. AUTHENTICATION MODULE
        console.log("\n▶ 1. AUDITING AUTHENTICATION MODULE...");
        const regRes = await makeRequest("POST", "/api/auth/register", {}, {
            name: "Audit User",
            email: testEmail,
            password: testPassword
        });
        record("Auth", "Registration", regRes.status === 201 && regRes.data.success, `status: ${regRes.status}`);

        const loginRes = await makeRequest("POST", "/api/auth/login", {}, {
            email: testEmail,
            password: testPassword
        });
        record("Auth", "Login with valid credentials", loginRes.status === 200 && !!loginRes.data.token, `status: ${loginRes.status}`);
        token = loginRes.data.token;
        userId = loginRes.data.user.id;

        const badLoginRes = await makeRequest("POST", "/api/auth/login", {}, {
            email: testEmail,
            password: "WrongPassword"
        });
        record("Auth", "Reject invalid credentials", badLoginRes.status === 401, `status: ${badLoginRes.status}`);

        const authHeader = { "Authorization": `Bearer ${token}` };

        const unauthRes = await makeRequest("GET", "/api/dashboard/summary", {});
        record("Auth", "Reject unauthenticated request", unauthRes.status === 401, `status: ${unauthRes.status}`);

        const badTokenRes = await makeRequest("GET", "/api/dashboard/summary", { "Authorization": "Bearer invalid_token_123" });
        record("Auth", "Reject invalid token", badTokenRes.status === 403, `status: ${badTokenRes.status}`);

        // 2. DASHBOARD MODULE
        console.log("\n▶ 2. AUDITING DASHBOARD MODULE...");
        const dashRes = await makeRequest("GET", "/api/dashboard/summary", authHeader);
        record("Dashboard", "GET /api/dashboard/summary", dashRes.status === 200 && dashRes.data.success, `status: ${dashRes.status}`);

        // 3. MOOD TRACKER MODULE
        console.log("\n▶ 3. AUDITING MOOD TRACKER MODULE...");
        const saveMoodRes = await makeRequest("POST", "/api/moods", authHeader, {
            mood: "Happy",
            icon: "😊"
        });
        record("Moods", "POST /api/moods (Save mood)", saveMoodRes.status === 201 && saveMoodRes.data.success, `status: ${saveMoodRes.status}`);

        const getMoodsRes = await makeRequest("GET", "/api/moods", authHeader);
        record("Moods", "GET /api/moods (List moods)", getMoodsRes.status === 200 && Array.isArray(getMoodsRes.data.moods), `count: ${getMoodsRes.data.moods?.length}`);

        const todayMoodRes = await makeRequest("GET", "/api/moods/today", authHeader);
        record("Moods", "GET /api/moods/today (Today's mood)", todayMoodRes.status === 200 && todayMoodRes.data.success, `mood: ${todayMoodRes.data.mood?.mood}`);

        const moodAnalyticsRes = await makeRequest("GET", "/api/moods/analytics", authHeader);
        record("Moods", "GET /api/moods/analytics (Mood analytics & charts)", moodAnalyticsRes.status === 200 && moodAnalyticsRes.data.success, `status: ${moodAnalyticsRes.status}`);

        const monthStr = new Date().toISOString().slice(0, 7);
        const moodCalendarRes = await makeRequest("GET", `/api/moods/calendar?month=${monthStr}`, authHeader);
        record("Moods", "GET /api/moods/calendar (Mood calendar)", moodCalendarRes.status === 200 && moodCalendarRes.data.success, `status: ${moodCalendarRes.status}`);

        // 4. JOURNAL MODULE
        console.log("\n▶ 4. AUDITING JOURNAL MODULE...");
        const saveJournalRes = await makeRequest("POST", "/api/journals", authHeader, {
            title: "Morning Clarity",
            text: "Today is a great day for mindful inner reflection."
        });
        record("Journals", "POST /api/journals (Create journal)", saveJournalRes.status === 201 && saveJournalRes.data.success, `id: ${saveJournalRes.data.journal_id}`);
        const journalId = saveJournalRes.data.journal_id;

        const getJournalsRes = await makeRequest("GET", "/api/journals", authHeader);
        record("Journals", "GET /api/journals (List journals)", getJournalsRes.status === 200 && Array.isArray(getJournalsRes.data.journals), `count: ${getJournalsRes.data.journals?.length}`);

        const getSingleJournalRes = await makeRequest("GET", `/api/journals/${journalId}`, authHeader);
        record("Journals", "GET /api/journals/:id (Get single journal)", getSingleJournalRes.status === 200 && getSingleJournalRes.data.success, `status: ${getSingleJournalRes.status}`);

        const updateJournalRes = await makeRequest("PUT", `/api/journals/${journalId}`, authHeader, {
            title: "Morning Clarity (Updated)",
            text: "Updated mindful reflection text."
        });
        record("Journals", "PUT /api/journals/:id (Update journal)", updateJournalRes.status === 200 && updateJournalRes.data.success, `status: ${updateJournalRes.status}`);

        const analyzeJournalRes = await makeRequest("POST", "/api/journals/analyze", authHeader, {
            text: "Reflecting on resilience and mindfulness."
        });
        record("Journals", "POST /api/journals/analyze (Sentiment endpoint response)", analyzeJournalRes.status === 200, `status: ${analyzeJournalRes.status}`);

        // 5. REFLECTIONS MODULE
        console.log("\n▶ 5. AUDITING REFLECTIONS MODULE...");
        const saveReflRes = await makeRequest("POST", "/api/reflections", authHeader, {
            question: "What brought you peace today?",
            answer: "Taking 5 quiet minutes to breathe deeply."
        });
        record("Reflections", "POST /api/reflections (Save reflection)", saveReflRes.status === 201 && saveReflRes.data.success, `id: ${saveReflRes.data.reflection_id}`);
        const reflectionId = saveReflRes.data.reflection_id;

        const getReflRes = await makeRequest("GET", "/api/reflections", authHeader);
        record("Reflections", "GET /api/reflections (List reflections)", getReflRes.status === 200 && Array.isArray(getReflRes.data.reflections), `count: ${getReflRes.data.reflections?.length}`);

        const getSingleReflRes = await makeRequest("GET", `/api/reflections/${reflectionId}`, authHeader);
        record("Reflections", "GET /api/reflections/:id (Get single reflection)", getSingleReflRes.status === 200 && getSingleReflRes.data.success, `status: ${getSingleReflRes.status}`);

        // 6. GOALS & DAILY CHALLENGES
        console.log("\n▶ 6. AUDITING GOALS & DAILY CHALLENGES...");
        const createGoalRes = await makeRequest("POST", "/api/goals", authHeader, {
            title: "Meditate 10 minutes daily",
            description: "Practice mindfulness meditation every morning",
            category: "Mindfulness",
            target_value: 7
        });
        record("Goals", "POST /api/goals (Create wellness goal)", createGoalRes.status === 201 && createGoalRes.data.success, `id: ${createGoalRes.data.goal_id}`);
        const goalId = createGoalRes.data.goal_id;

        const getGoalsRes = await makeRequest("GET", "/api/goals", authHeader);
        record("Goals", "GET /api/goals (List goals)", getGoalsRes.status === 200 && Array.isArray(getGoalsRes.data.goals), `count: ${getGoalsRes.data.goals?.length}`);

        const updateGoalRes = await makeRequest("PUT", `/api/goals/${goalId}`, authHeader, {
            current_progress: 3
        });
        record("Goals", "PUT /api/goals/:id (Update goal progress)", updateGoalRes.status === 200 && updateGoalRes.data.success, `status: ${updateGoalRes.status}`);

        const goalsSummaryRes = await makeRequest("GET", "/api/goals/summary", authHeader);
        record("Goals", "GET /api/goals/summary (Goals summary stats)", goalsSummaryRes.status === 200 && goalsSummaryRes.data.success, `status: ${goalsSummaryRes.status}`);

        const dailyChallengesRes = await makeRequest("GET", "/api/goals/challenges", authHeader);
        record("Daily Challenges", "GET /api/goals/challenges (Today's challenges)", dailyChallengesRes.status === 200 && dailyChallengesRes.data.success, `count: ${dailyChallengesRes.data.challenges?.length}`);

        const challengesHistoryRes = await makeRequest("GET", "/api/goals/challenges/history", authHeader);
        record("Daily Challenges", "GET /api/goals/challenges/history (Challenge history)", challengesHistoryRes.status === 200 && challengesHistoryRes.data.success, `status: ${challengesHistoryRes.status}`);

        // 7. HABITS MODULE
        console.log("\n▶ 7. AUDITING HABITS MODULE...");
        const createHabitRes = await makeRequest("POST", "/api/habits", authHeader, {
            name: "Morning Sunlight",
            category: "Wellness",
            frequency_type: "daily",
            target_count: 1
        });
        record("Habits", "POST /api/habits (Create habit)", createHabitRes.status === 200 && createHabitRes.data.success, `id: ${createHabitRes.data.habit_id}`);
        const habitId = createHabitRes.data.habit_id;

        const getHabitsRes = await makeRequest("GET", "/api/habits", authHeader);
        record("Habits", "GET /api/habits (List habits)", getHabitsRes.status === 200 && Array.isArray(getHabitsRes.data.habits), `count: ${getHabitsRes.data.habits?.length}`);

        const completeHabitRes = await makeRequest("POST", `/api/habits/${habitId}/complete`, authHeader);
        record("Habits", "POST /api/habits/:id/complete (Complete habit)", completeHabitRes.status === 200 && completeHabitRes.data.success, `status: ${completeHabitRes.status}`);

        const habitSummaryRes = await makeRequest("GET", "/api/habits/summary", authHeader);
        record("Habits", "GET /api/habits/summary (Habit summary)", habitSummaryRes.status === 200 && habitSummaryRes.data.success, `status: ${habitSummaryRes.status}`);

        // 8. AI CHATBOT MODULE
        console.log("\n▶ 8. AUDITING AI CHATBOT MODULE...");
        const chatMsgRes = await makeRequest("POST", "/api/chat/message", authHeader, {
            message: "Hello! How can I reduce stress today?"
        });
        record("Chatbot", "POST /api/chat/message (Send message & receive response)", chatMsgRes.status === 200 && chatMsgRes.data.success && !!chatMsgRes.data.reply, `status: ${chatMsgRes.status}`);

        const chatHistRes = await makeRequest("GET", "/api/chat/history", authHeader);
        record("Chatbot", "GET /api/chat/history (Fetch conversation history)", chatHistRes.status === 200 && Array.isArray(chatHistRes.data.messages), `count: ${chatHistRes.data.messages?.length}`);

        const dailyMsgRes = await makeRequest("GET", "/api/chat/daily-message", authHeader);
        record("Chatbot", "GET /api/chat/daily-message (Daily assistant message)", dailyMsgRes.status === 200 && dailyMsgRes.data.success, `status: ${dailyMsgRes.status}`);

        // 9. RECOMMENDATIONS & QUOTES MODULE
        console.log("\n▶ 9. AUDITING RECOMMENDATIONS MODULE...");
        const recsRes = await makeRequest("GET", "/api/recommendations", authHeader);
        record("Recommendations", "GET /api/recommendations (Personalized recommendations)", recsRes.status === 200 && Array.isArray(recsRes.data.recommendations), `count: ${recsRes.data.recommendations?.length}`);

        // 10. ACHIEVEMENTS & XP MODULE
        console.log("\n▶ 10. AUDITING ACHIEVEMENTS MODULE...");
        const achRes = await makeRequest("GET", "/api/achievements", authHeader);
        record("Achievements", "GET /api/achievements (Live achievements progress)", achRes.status === 200 && achRes.data.success, `status: ${achRes.status}`);

        const achSummaryRes = await makeRequest("GET", "/api/achievements/summary", authHeader);
        record("Achievements", "GET /api/achievements/summary (XP & Level info)", achSummaryRes.status === 200 && achSummaryRes.data.success, `xp: ${achSummaryRes.data.xp}`);

        const achHistRes = await makeRequest("GET", "/api/achievements/history", authHeader);
        record("Achievements", "GET /api/achievements/history (XP transaction history)", achHistRes.status === 200 && Array.isArray(achHistRes.data.transactions), `count: ${achHistRes.data.transactions?.length}`);

        // 11. NOTIFICATIONS MODULE
        console.log("\n▶ 11. AUDITING NOTIFICATIONS MODULE...");
        const notifsRes = await makeRequest("GET", "/api/notifications", authHeader);
        record("Notifications", "GET /api/notifications (Fetch notifications)", notifsRes.status === 200 && Array.isArray(notifsRes.data.notifications), `count: ${notifsRes.data.notifications?.length}`);

        const unreadCountRes = await makeRequest("GET", "/api/notifications/unread-count", authHeader);
        record("Notifications", "GET /api/notifications/unread-count (Unread badge count)", unreadCountRes.status === 200 && unreadCountRes.data.success, `unread: ${unreadCountRes.data.count}`);

        const readAllRes = await makeRequest("PUT", "/api/notifications/read-all", authHeader);
        record("Notifications", "PUT /api/notifications/read-all (Mark all read)", readAllRes.status === 200 && readAllRes.data.success, `status: ${readAllRes.status}`);

        // 12. EMERGENCY CRISIS MODULE
        console.log("\n▶ 12. AUDITING EMERGENCY RESOURCES MODULE...");
        const emergencyRes = await makeRequest("GET", "/api/emergency/resources", {});
        record("Emergency", "GET /api/emergency/resources (Public 24/7 crisis lines)", emergencyRes.status === 200 && Array.isArray(emergencyRes.data.resources), `count: ${emergencyRes.data.resources?.length}`);

        // 13. USER PROFILE & PREFERENCES MODULE
        console.log("\n▶ 13. AUDITING USER PROFILE MODULE...");
        const profileRes = await makeRequest("GET", "/api/users/profile", authHeader);
        record("Profile", "GET /api/users/profile (User info & preferences)", profileRes.status === 200 && profileRes.data.success, `name: ${profileRes.data.profile?.name}`);

        const updateProfileRes = await makeRequest("PUT", "/api/users/profile", authHeader, {
            name: "Audit User Updated",
            avatar: "🌱",
            theme: "dark",
            language: "en"
        });
        record("Profile", "PUT /api/users/profile (Update preferences)", updateProfileRes.status === 200 && updateProfileRes.data.success, `status: ${updateProfileRes.status}`);

        const updateStreakRes = await makeRequest("PUT", "/api/users/streak", authHeader, { streak: 5 });
        record("Profile", "PUT /api/users/streak (Update streak directly)", updateStreakRes.status === 200 && updateStreakRes.data.success, `streak: ${updateStreakRes.data.streak}`);

        // 14. EXTENDED WELLNESS MODULES
        console.log("\n▶ 14. AUDITING EXTENDED WELLNESS MODULES...");
        const wellnessScoreRes = await makeRequest("GET", "/api/wellness-score", authHeader);
        record("Wellness Score", "GET /api/wellness-score", wellnessScoreRes.status === 200 && wellnessScoreRes.data.success, `score: ${wellnessScoreRes.data.score || wellnessScoreRes.data.wellness_score}`);

        const wellnessInsightsRes = await makeRequest("GET", "/api/wellness-insights", authHeader);
        record("Wellness Insights", "GET /api/wellness-insights", wellnessInsightsRes.status === 200, `status: ${wellnessInsightsRes.status}`);

        const wellnessJourneyRes = await makeRequest("GET", "/api/wellness-journey", authHeader);
        record("Wellness Journey", "GET /api/wellness-journey", wellnessJourneyRes.status === 200, `status: ${wellnessJourneyRes.status}`);

        const emotionPatternsRes = await makeRequest("GET", "/api/emotion-patterns", authHeader);
        record("Emotion Patterns", "GET /api/emotion-patterns", emotionPatternsRes.status === 200, `status: ${emotionPatternsRes.status}`);

        const focusStatsRes = await makeRequest("GET", "/api/focus/stats", authHeader);
        record("Focus Mode", "GET /api/focus/stats", focusStatsRes.status === 200, `status: ${focusStatsRes.status}`);

        const aiMemoriesRes = await makeRequest("GET", "/api/ai-memory", authHeader);
        record("AI Memory", "GET /api/ai-memory", aiMemoriesRes.status === 200, `status: ${aiMemoriesRes.status}`);

        const voiceJournalsRes = await makeRequest("GET", "/api/voice-journals", authHeader);
        record("Voice Journals", "GET /api/voice-journals", voiceJournalsRes.status === 200, `status: ${voiceJournalsRes.status}`);

        const dailyPlanRes = await makeRequest("GET", "/api/daily-plan", authHeader);
        record("Daily Plan", "GET /api/daily-plan", dailyPlanRes.status === 200, `status: ${dailyPlanRes.status}`);

        const weeklyReportRes = await makeRequest("GET", "/api/weekly-report", authHeader);
        record("Weekly Report", "GET /api/weekly-report", weeklyReportRes.status === 200, `status: ${weeklyReportRes.status}`);

        console.log("\n==================================================");
        const total = auditResults.length;
        const passed = auditResults.filter(r => r.passed).length;
        const failed = total - passed;
        console.log(`📊 AUDIT SUMMARY: Total: ${total}, Passed: ${passed}, Failed: ${failed}`);
        console.log("==================================================");

        if (failed > 0) {
            console.log("\n❌ FAILED TESTS:");
            auditResults.filter(r => !r.passed).forEach(r => {
                console.log(`  - [${r.moduleName}] ${r.testName}: ${r.details}`);
            });
            process.exit(1);
        } else {
            console.log("\n🎉 ALL BACKEND MODULES PASSED 100%!");
            process.exit(0);
        }

    } catch (err) {
        console.error("\n❌ FATAL AUDIT ERROR:", err);
        process.exit(1);
    }
}

runMasterAudit();
