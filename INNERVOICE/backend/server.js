require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
const authRoutes        = require("./routes/auth");
const moodRoutes        = require("./routes/moods");
const journalRoutes     = require("./routes/journals");
const goalsRoutes       = require("./routes/goals");
const reflectionRoutes  = require("./routes/reflections");
const usersRoutes       = require("./routes/users");
const dashboardRoutes   = require("./routes/dashboard");
const chatRoutes            = require("./routes/chat");
const achievementRoutes     = require("./routes/achievements");
const recommendationRoutes  = require("./routes/recommendations");
const notificationRoutes    = require("./routes/notifications");
const wellnessScoreRoutes = require("./routes/wellness_scores");
const emergencyRoutes       = require("./routes/emergency");
const voiceJournalsRoutes = require("./routes/voice_journals");
const aiMemoryRoutes = require("./routes/ai_memory");
const emotionPatternsRoutes = require("./routes/emotion_patterns");
const focusModeRoutes = require("./routes/focus_mode");
const wellnessAnalyticsRoutes = require("./routes/analytics");
const dailyPlanRoutes       = require("./routes/daily_plan");
const weeklyReportRoutes    = require("./routes/weekly_report");
const habitsRoutes          = require("./routes/habits");
const wellnessInsightsRouter = require("./routes/wellness_insights");
const wellnessJourneyRouter = require("./routes/wellness_journey");
const weeklyInsightsV2Router = require("./routes/weekly_insights_v2");

const app = express();
const frontendRoot = path.resolve(__dirname, "..", "..");

app.use(cors());
app.use(express.json());
app.use(express.static(frontendRoot));


// AUTH ROUTES
app.use("/api/auth", authRoutes);

// MOOD ROUTES (JWT protected)
app.use("/api/moods", moodRoutes);

// JOURNAL ROUTES (JWT protected)
app.use("/api/journals", journalRoutes);

// GOALS & DAILY CHALLENGES ROUTES (JWT protected)
app.use("/api/goals", goalsRoutes);
app.use("/api/challenges", goalsRoutes);

// REFLECTION ROUTES (JWT protected)
app.use("/api/reflections", reflectionRoutes);

// USERS ROUTES — streak update (JWT protected)
app.use("/api/users", usersRoutes);

// DASHBOARD ROUTES (JWT protected)
app.use("/api/dashboard", dashboardRoutes);

// HABITS ROUTES (JWT protected)
app.use("/api/habits", habitsRoutes);

// CHAT ROUTES (JWT protected)
app.use("/api/chat", chatRoutes);

// ACHIEVEMENTS ROUTES (JWT protected)
app.use("/api/achievements", achievementRoutes);

// RECOMMENDATIONS ROUTES (JWT protected)
app.use("/api/recommendations", recommendationRoutes);

// NOTIFICATIONS & REMINDERS ROUTES (JWT protected)
app.use("/api/notifications", notificationRoutes);

// VOICE JOURNALS ROUTES (JWT protected)
app.use("/api/wellness-score", wellnessScoreRoutes);
app.use("/api/voice-journals", voiceJournalsRoutes);
app.use("/api/wellness-analytics", wellnessAnalyticsRoutes);
app.use('/api/wellness-insights', wellnessInsightsRouter);
app.use('/api/wellness-journey', wellnessJourneyRouter);
app.use('/api/insights', weeklyInsightsV2Router);

// AI MEMORY ROUTES (JWT protected)
app.use("/api/ai-memory", aiMemoryRoutes);

// DAILY PLAN ROUTES (JWT protected)
app.use("/api/daily-plan", dailyPlanRoutes);

// EMOTION PATTERNS ROUTES (JWT protected)
app.use("/api/emotion-patterns", emotionPatternsRoutes);

// FOCUS MODE ROUTES (JWT protected)
app.use("/api/focus", focusModeRoutes);

// WEEKLY REPORT ROUTES (JWT protected)
app.use("/api/weekly-report", weeklyReportRoutes);

// EMERGENCY & CRISIS SUPPORT (Public)
app.use("/api/emergency", emergencyRoutes);


// HOME
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendRoot, "index.html"));
});

// DATABASE TEST
app.get("/test-db", (req, res) => {
    db.query("SELECT 1 AS result", (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database connection failed",
                error: err.message
            });
        }

        res.json({
            success: true,
            message: "INNERVOICE MySQL Database is Connected!",
            result: result
        });
    });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("🌿 INNERVOICE SERVER UPDATED!");
    console.log("Server running on http://localhost:5000");
});