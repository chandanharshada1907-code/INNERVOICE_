const path = require("path");
const dotenv = require("dotenv");
const envPath = path.resolve(__dirname, ".env");
const envResult = dotenv.config({ path: envPath });
if (envResult && envResult.error) {
    console.warn("Could not load backend .env file at:", envPath, envResult.error.message);
}

const express = require("express");
const cors = require("cors");
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
const adminRoutes             = require("./routes/admin");

const app = express();
const frontendRoot = path.resolve(__dirname, "..", "..");

// ─────────────────────────────────────────────────────────────
// CORS — Allow requests from any localhost origin so the
// frontend (opened as a file or dev server) can call the API.
// ─────────────────────────────────────────────────────────────
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (file://, Postman) and any localhost
        if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: "5mb" }));
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

// MENTAL WELLNESS ASSESSMENTS (PHQ-9 & GAD-7) (JWT protected)
const assessmentsRoutes = require("./routes/assessments");
app.use("/api/assessments", assessmentsRoutes);

// SLEEP TRACKER (JWT protected)
const sleepRoutes = require("./routes/sleep");
app.use("/api/sleep", sleepRoutes);

// PDF REPORT (JWT protected)
const pdfReportRoutes = require("./routes/pdfReport");
app.use("/api/reports/wellness", pdfReportRoutes);

// ADMIN DASHBOARD (JWT + admin role protected)
app.use("/api/admin", adminRoutes);


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
    console.log("─────────────────────────────────────────────");
    console.log("🌿 INNERVOICE SERVER STARTED");
    console.log("─────────────────────────────────────────────");
    console.log(`📡 Backend URL  : http://localhost:${PORT}`);
    console.log(`🌐 Frontend URL : http://localhost:${PORT}/index.html`);
    console.log(`🗄️  DB Test      : http://localhost:${PORT}/test-db`);
    const otpMode = (process.env.EMAIL_USER && process.env.EMAIL_USER !== "your_email@gmail.com")
        ? "✅ OTP enabled (real email/SMS)"
        : "⚡ DEV MODE — OTP auto-verified (no real email/SMS needed)";
    console.log(`🔐 Auth Mode    : ${otpMode}`);
    console.log("─────────────────────────────────────────────");
});