

/* =========================================================
    INNERVOICE - COMPLETE JAVASCRIPT
    Works with the single-page HTML structure
========================================================= */

const BACKEND_URL = "http://localhost:5000";

function getToken() {
     return localStorage.getItem("innerVoiceToken") || null;
}

document.addEventListener("DOMContentLoaded", function () {



    console.log("🌿 INNERVOICE JavaScript Loaded");

    /* =====================================================
       1. LOCAL STORAGE SETUP
    ===================================================== */

    // =====================================================
    // BACKEND API URL — update this if your server changes
    // =====================================================
    const BACKEND_URL = "http://localhost:5000";

    let users = JSON.parse(localStorage.getItem("innerVoiceUsers")) || [];
    let currentUser = JSON.parse(localStorage.getItem("innerVoiceCurrentUser")) || null;

    let moods = JSON.parse(localStorage.getItem("innerVoiceMoods")) || [];
    let journals = JSON.parse(localStorage.getItem("innerVoiceJournals")) || [];
    let reflections = JSON.parse(localStorage.getItem("innerVoiceReflections")) || [];
    let goals = JSON.parse(localStorage.getItem("innerVoiceGoals")) || [];



    /* =====================================================
       2. HELPER FUNCTIONS
    ===================================================== */

    function saveData() {
        localStorage.setItem("innerVoiceUsers", JSON.stringify(users));
        localStorage.setItem("innerVoiceCurrentUser", JSON.stringify(currentUser));
        localStorage.setItem("innerVoiceMoods", JSON.stringify(moods));
        localStorage.setItem("innerVoiceJournals", JSON.stringify(journals));
        localStorage.setItem("innerVoiceReflections", JSON.stringify(reflections));
        localStorage.setItem("innerVoiceGoals", JSON.stringify(goals));
    }


    function getDate() {
        return new Date().toLocaleDateString();
    }


    function showMessage(message) {
        alert(message);
    }



    /* =====================================================
       3. REGISTER — calls backend API + localStorage fallback
    ===================================================== */

    const registerSection = document.querySelector("#register");

    if (registerSection) {

        const inputs = registerSection.querySelectorAll("input");
        const registerButton = registerSection.querySelector("button");

        if (registerButton) {

            registerButton.addEventListener("click", async function () {

                const name = inputs[0].value.trim();
                const email = inputs[1].value.trim();
                const password = inputs[2].value;
                const confirmPassword = inputs[3] ? inputs[3].value : password;


                // ---- Client-side validation ----
                if (!name || !email || !password || !confirmPassword) {
                    showMessage("Please fill all fields.");
                    return;
                }

                if (password !== confirmPassword) {
                    showMessage("Passwords do not match.");
                    return;
                }

                if (password.length < 6) {
                    showMessage("Password must contain at least 6 characters.");
                    return;
                }


                // ---- Call backend API ----
                try {

                    registerButton.disabled = true;
                    registerButton.textContent = "Creating account...";

                    const response = await fetch(BACKEND_URL + "/api/auth/register", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name, email, password })
                    });

                    const data = await response.json();

                    if (data.success) {

                        showMessage("🎉 Account created successfully!\n\nPlease login to continue.");

                        inputs.forEach(input => input.value = "");

                        history.pushState(null, null, "#login");
                        showSection("#login");

                    } else {

                        showMessage("❌ " + data.message);

                    }

                } catch (err) {

                    // Backend not running — fall back to localStorage
                    console.warn("Backend not reachable, using localStorage fallback.", err);

                    const existingUser = users.find(u => u.email === email);

                    if (existingUser) {
                        showMessage("An account with this email already exists.");
                        return;
                    }

                    const newUser = {
                        id: Date.now(),
                        name, email, password,
                        createdAt: getDate(),
                        streak: 0, journalCount: 0, goalCount: 0
                    };

                    users.push(newUser);
                    saveData();

                    showMessage("🎉 Account created! (offline mode)\n\nPlease login to continue.");

                    inputs.forEach(input => input.value = "");

                    history.pushState(null, null, "#login");
                    showSection("#login");

                } finally {

                    registerButton.disabled = false;
                    registerButton.textContent = "Create Account";

                }

            });
        }
    }



    /* =====================================================
       4. LOGIN — calls backend API + localStorage fallback
    ===================================================== */

    const loginSection = document.querySelector("#login");

    if (loginSection) {

        const inputs = loginSection.querySelectorAll("input");
        const loginButton = loginSection.querySelector("button");

        if (loginButton) {

            loginButton.addEventListener("click", async function () {

                const email = inputs[0].value.trim();
                const password = inputs[1].value;


                if (!email || !password) {
                    showMessage("Please enter email and password.");
                    return;
                }


                // ---- Call backend API ----
                try {

                    loginButton.disabled = true;
                    loginButton.textContent = "Logging in...";

                    const response = await fetch(BACKEND_URL + "/api/auth/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, password })
                    });

                    const data = await response.json();

                    if (data.success) {

                        // Store JWT token securely in localStorage
                        localStorage.setItem("innerVoiceToken", data.token);

                        // Set currentUser from backend response (no password field)
                        currentUser = {
                            id: data.user.id,
                            name: data.user.name,
                            email: data.user.email,
                            streak: data.user.streak || 0
                        };

                        saveData();

                        showMessage("🌿 Welcome back, " + currentUser.name + "!");

                        inputs.forEach(input => input.value = "");

                        history.pushState(null, null, "#dashboard");
                        showSection("#dashboard");

                        updateDashboard();
                        updateProfile();
                        updateLoginStatus();
                        loadMoodHistory();
                        loadMoodAnalytics();
                        loadJournalHistory();
                        loadGoalHistory();
                        if (typeof loadDailyChallenges === "function") loadDailyChallenges();
                        loadReflectionHistory();
                        loadDashboardSummary();
                        loadAchievements();
                        loadDailyRecommendations();
                        window.loadChatHistory();
                        if (typeof loadNotifications === "function") loadNotifications();
                        if (typeof window.loadVoiceJournals === "function") window.loadVoiceJournals();
                        if (typeof window.loadMoodsForTrigger === "function") window.loadMoodsForTrigger();
                        if (typeof window.loadEmotionPatterns === "function") window.loadEmotionPatterns();
                        if (typeof window.loadFocusStats === "function") window.loadFocusStats();
                        if (typeof window.loadAiMemories === "function") window.loadAiMemories();
                        if (typeof fetchWellnessInsights === "function") fetchWellnessInsights();
                        if (typeof fetchRecommendations === "function") fetchRecommendations();
                        if (typeof loadWellnessJourney === "function") loadWellnessJourney();
                        if (typeof initNotifications === "function") initNotifications();

                    } else {

                        showMessage("❌ " + data.message);

                    }

                } catch (err) {

                    // Backend not running — fall back to localStorage
                    console.warn("Backend not reachable, using localStorage fallback.", err);

                    const user = users.find(
                        u => u.email === email && u.password === password
                    );

                    if (!user) {
                        showMessage("❌ Invalid email or password.");
                        return;
                    }

                    currentUser = user;
                    saveData();

                    showMessage("🌿 Welcome back, " + user.name + "! (offline mode)");

                    inputs.forEach(input => input.value = "");

                    history.pushState(null, null, "#dashboard");
                    showSection("#dashboard");

                    updateDashboard();
                    updateProfile();
                    updateLoginStatus();
                    loadAchievements();
                    loadDailyRecommendations();
                    if (typeof fetchWellnessInsights === "function") fetchWellnessInsights();
                    if (typeof fetchRecommendations === "function") fetchRecommendations();
                    if (typeof loadWellnessJourney === "function") loadWellnessJourney();
                    if (typeof initNotifications === "function") initNotifications();

                } finally {

                    loginButton.disabled = false;
                    loginButton.textContent = "Login";

                }

            });
        }
    }



    /* =====================================================
       5. DASHBOARD
    ===================================================== */

    // Chart.js instance — kept in outer scope so we can destroy/recreate it
    let moodChartInstance = null;


    // ---- Mood value map for chart scoring ----
    const MOOD_SCORES = {
        "happy":    5, "excited":  5, "great":    5,
        "good":     4,
        "okay":     3, "neutral":  3,
        "tired":    2, "sad":      2, "anxious":  2,
        "angry":    1, "terrible": 1
    };

    function moodToScore(label) {
        if (!label) return 3;
        return MOOD_SCORES[label.toLowerCase()] || 3;
    }


    // ---- Persist streak to MySQL via PUT /api/users/streak ----
    async function persistStreak(newStreak) {
        const token = getToken();
        if (!token) return;   // offline — streak already in localStorage

        try {
            await fetch(BACKEND_URL + "/api/users/streak", {
                method:  "PUT",
                headers: {
                    "Content-Type":  "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ streak: newStreak })
            });
        } catch (err) {
            // Non-fatal — streak is already in localStorage
            console.warn("Could not persist streak to backend.", err);
        }
    }


    // ---- Render the Chart.js mood trend chart ----
    function renderMoodChart(moodHistory) {

        const panel  = document.getElementById("moodChartPanel");
        const canvas = document.getElementById("moodTrendChart");

        if (!panel || !canvas) return;

        // Need at least 2 data points for a meaningful chart
        if (!moodHistory || moodHistory.length < 2) {
            panel.style.display = "none";
            return;
        }

        panel.style.display = "block";

        // Reverse so chart goes oldest → newest (left → right)
        const ordered = [...moodHistory].reverse();

        const labels = ordered.map(function (m) {
            const d = m.created_at ? new Date(m.created_at) : null;
            if (!d) return "";
            return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        });

        const scores = ordered.map(function (m) {
            return moodToScore(m.mood);
        });

        // Destroy previous chart instance to avoid memory leak
        if (moodChartInstance) {
            moodChartInstance.destroy();
            moodChartInstance = null;
        }

        // Wait for Chart.js to be ready (it loads deferred)
        if (typeof Chart === "undefined") {
            panel.style.display = "none";
            return;
        }

        moodChartInstance = new Chart(canvas, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label:           "Mood Score",
                    data:            scores,
                    borderColor:     "#6c63ff",
                    backgroundColor: "rgba(108,99,255,0.08)",
                    borderWidth:     2.5,
                    pointBackgroundColor: "#6c63ff",
                    pointRadius:     4,
                    pointHoverRadius: 6,
                    fill:            true,
                    tension:         0.35
                }]
            },
            options: {
                responsive:          true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                const scoreLabels = {
                                    5: "😄 Very Happy",
                                    4: "😊 Good",
                                    3: "😐 Neutral",
                                    2: "😔 Low",
                                    1: "😞 Very Low"
                                };
                                return scoreLabels[ctx.parsed.y] || "Score: " + ctx.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 6,
                        ticks: {
                            stepSize: 1,
                            callback: function (val) {
                                const map = { 1: "😞", 2: "😔", 3: "😐", 4: "😊", 5: "😄" };
                                return map[val] || "";
                            }
                        },
                        grid: { color: "#f3f4f6" }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } }
                    }
                }
            }
        });
    }


    // ---- Render Recent Activity ----
    function renderRecentActivity(activities) {

        const panel = document.getElementById("recentActivityPanel");
        const list  = document.getElementById("recentActivityList");

        if (!panel || !list) return;

        if (!activities || activities.length === 0) {
            panel.style.display = "none";
            return;
        }

        panel.style.display = "block";

        const iconMap = {
            mood:       "😊",
            journal:    "📔",
            reflection: "🪞",
            goal:       "🎯"
        };

        list.innerHTML = activities.map(function (item) {

            const rawDate = item.date;
            let dateStr = "";
            if (rawDate) {
                try {
                    dateStr = new Date(rawDate).toLocaleDateString("en-IN", {
                        day:   "2-digit",
                        month: "short",
                        year:  "numeric"
                    });
                } catch (e) {
                    dateStr = String(rawDate).split("T")[0];
                }
            }

            const icon  = iconMap[item.type] || "🌱";
            const label = escapeHTMLSafe(item.label || "");

            return `
                <li class="activity-item">
                    <div class="activity-icon ${escapeHTMLSafe(item.type)}">${icon}</div>
                    <div class="activity-text">
                        <p>${label}</p>
                        <small>${dateStr}</small>
                    </div>
                </li>
            `;

        }).join("");
    }


    // ---- Render AI Weekly Summary ----
    function renderWeeklySummary(summary) {

        const panel   = document.getElementById("weeklySummaryPanel");
        const content = document.getElementById("weeklySummaryContent");

        if (!panel || !content || !summary) return;

        panel.style.display = "block";

        const positiveItems = (summary.positives || []).map(function (p) {
            return `<li>${escapeHTMLSafe(p)}</li>`;
        }).join("");

        const attentionItems = (summary.attention || []).map(function (a) {
            return `<li>${escapeHTMLSafe(a)}</li>`;
        }).join("");

        content.innerHTML = `
            <div class="summary-trend">${escapeHTMLSafe(summary.overallTrend || "")}</div>

            ${positiveItems ? `
                <p class="summary-section-title">✅ Positive Progress</p>
                <ul class="summary-list">${positiveItems}</ul>
            ` : ""}

            ${attentionItems ? `
                <p class="summary-section-title">💡 Areas to Explore</p>
                <ul class="summary-list attention">${attentionItems}</ul>
            ` : ""}

            <div class="summary-encouragement">${escapeHTMLSafe(summary.encouragement || "")}</div>
        `;
    }


    // ---- Helper: HTML-safe escape (also used by dashboard renderers) ----
    function escapeHTMLSafe(text) {
        const div = document.createElement("div");
        div.textContent = String(text || "");
        return div.innerHTML;
    }
    const escapeHTML = escapeHTMLSafe;


    // ---- Update the 5 stat card values ----
    function updateStatCards(data) {

        // Today's Mood — newest entry (index 0) since backend returns DESC
        const moodHistory = data.moodHistory || [];
        const latestMood  = data.latestMood || (moodHistory.length > 0 ? moodHistory[0] : null);

        const statMoodIcon  = document.getElementById("statMoodIcon");
        const statMoodLabel = document.getElementById("statMoodLabel");
        if (statMoodIcon)  statMoodIcon.textContent  = latestMood ? (latestMood.icon || "😊") : "😊";
        if (statMoodLabel) statMoodLabel.textContent = latestMood ? latestMood.mood : "Not recorded";

        // Journal count
        const statJournalCount = document.getElementById("statJournalCount");
        if (statJournalCount) statJournalCount.textContent = data.journalCount !== undefined ? data.journalCount : "—";

        // Reflection count
        const statReflectionCount = document.getElementById("statReflectionCount");
        if (statReflectionCount) statReflectionCount.textContent = data.reflectionCount !== undefined ? data.reflectionCount : "—";

        // Streak
        const statStreak = document.getElementById("statStreak");
        if (statStreak) statStreak.textContent = (data.streak !== undefined ? data.streak : (currentUser ? currentUser.streak || 0 : 0)) + " 🔥";

        // Goals completed
        const statGoals = document.getElementById("statGoalsCompleted");
        if (statGoals) statGoals.textContent = data.goalsCompleted !== undefined ? data.goalsCompleted : "—";
    }


    // ---- updateDashboard: lightweight update from localStorage (no API call) ----
    function updateDashboard() {

        if (!currentUser) return;

        const userMoods   = moods.filter(m => m.email === currentUser.email);
        const userJournals = journals.filter(j => j.email === currentUser.email);
        const userGoals    = goals.filter(g => g.email === currentUser.email);
        const userReflections = reflections.filter(r => r.email === currentUser.email);

        // FIX: moods array from backend is newest-first — use [0] not [length-1]
        const latestMood = userMoods.length > 0 ? userMoods[0] : null;

        updateStatCards({
            latestMood,
            moodHistory:     userMoods,
            journalCount:    userJournals.length,
            reflectionCount: userReflections.length,
            streak:          currentUser.streak || 0,
            goalsCompleted:  userGoals.filter(g => g.completed).length
        });
    }

    window.updateDashboard = updateDashboard;

    // ---- loadDashboardSummary: calls GET /api/dashboard/summary ----
    async function loadDashboardSummary() {

        const token = getToken();
        if (!token || !currentUser) {
            updateDashboard();
            return;
        }

        // Call the missing dashboard sections in parallel
        loadWeeklyInsights();
        loadTodayPlan();

        try {

            const res  = await fetch(BACKEND_URL + "/api/dashboard/summary", {
                headers: { "Authorization": "Bearer " + token }
            });

            const data = await res.json();

            if (!data.success) {
                console.warn("Dashboard summary returned error:", data.message);
                updateDashboard();
                return;
            }

            // Sync streak to currentUser from DB (authoritative source)
            if (data.streak !== undefined) {
                currentUser.streak = data.streak;
                saveData();
            }

            // Update stat cards
            updateStatCards(data);

            // Render mood trend chart
            renderMoodChart(data.moodHistory || []);

            // Render recent activity
            renderRecentActivity(data.recentActivity || []);

            // Render AI weekly summary
            if (data.weeklySummary) {
                renderWeeklySummary(data.weeklySummary);
            }

        } catch (err) {

            // Backend unavailable — fall back to localStorage
            console.warn("Could not load dashboard summary, using localStorage fallback.", err);
            updateDashboard();

        }
    }

    // ==========================================
    // PART 1: WEEKLY WELLNESS INSIGHTS
    // ==========================================
    async function loadWeeklyInsights() {
        const token = getToken();
        if (!token) return;

        const widget = document.getElementById("dashWeeklyInsightsWidget");
        const loading = document.getElementById("weeklyInsightsLoading");
        const content = document.getElementById("weeklyInsightsContent");
        const empty = document.getElementById("weeklyInsightsEmpty");

        if (widget) widget.style.display = "block";
        if (loading) loading.style.display = "block";
        if (content) content.style.display = "none";
        if (empty) empty.style.display = "none";

        try {
            const res = await fetch(BACKEND_URL + "/api/insights/weekly", {
                headers: { "Authorization": "Bearer " + token }
            });

            const data = await res.json();
            
            if (loading) loading.style.display = "none";

            if (!data.success || data.data.score.trend === "insufficient_data") {
                if (empty) empty.style.display = "block";
                return;
            }

            const stats = data.data;

            // Show content
            if (content) content.style.display = "block";

            // Populate elements
            const el = (id) => document.getElementById(id);

            if (el("weeklyScoreVal")) el("weeklyScoreVal").textContent = stats.score.current;
            if (el("weeklyScoreTrend")) {
                const diff = stats.score.difference;
                if (diff > 0) el("weeklyScoreTrend").innerHTML = `<span style="color:#10b981">↑ +${diff} points</span> vs last week`;
                else if (diff < 0) el("weeklyScoreTrend").innerHTML = `<span style="color:#ef4444">↓ ${diff} points</span> vs last week`;
                else el("weeklyScoreTrend").innerHTML = `<span style="color:var(--text-muted)">Stable</span> vs last week`;
            }

            if (el("weeklyAiSummary")) el("weeklyAiSummary").textContent = stats.aiInsight.summary;
            if (el("weeklyAiRecommendations")) {
                el("weeklyAiRecommendations").innerHTML = stats.aiInsight.recommendations.map(r => `<li>${escapeHTMLSafe(r)}</li>`).join("");
            }

            // Mood
            if (el("weeklyMoodAvg")) el("weeklyMoodAvg").textContent = stats.mood.average ? stats.mood.average.toFixed(1) + "/5" : "N/A";
            if (el("weeklyMoodTrend")) {
                const checkins = stats.mood.checkIns;
                el("weeklyMoodTrend").textContent = checkins > 0 ? `${checkins} check-ins, mostly ${stats.mood.mostFrequent}` : "No check-ins";
            }

            // Habits
            if (el("weeklyHabitRate")) {
                el("weeklyHabitRate").textContent = stats.habits.completionRate !== null ? Math.round(stats.habits.completionRate) + "%" : "N/A";
            }
            if (el("weeklyHabitDetails")) {
                el("weeklyHabitDetails").textContent = stats.habits.expected > 0 ? `${stats.habits.completed} of ${stats.habits.expected} completed` : "No active habits";
            }

            // Goals
            if (el("weeklyGoalsCompleted")) el("weeklyGoalsCompleted").textContent = stats.goals.completed;
            if (el("weeklyGoalsDetails")) el("weeklyGoalsDetails").textContent = `${stats.goals.active} active goals`;

            // Daily Plan
            if (el("weeklyDailyPlanRate")) {
                el("weeklyDailyPlanRate").textContent = stats.dailyPlan.completionRate !== null ? Math.round(stats.dailyPlan.completionRate) + "%" : "N/A";
            }
            if (el("weeklyDailyPlanDetails")) {
                el("weeklyDailyPlanDetails").textContent = stats.dailyPlan.total > 0 ? `${stats.dailyPlan.completed} tasks completed` : "No daily plan tasks";
            }

            // Journals
            if (el("weeklyJournalsTotal")) el("weeklyJournalsTotal").textContent = stats.journals.entries + stats.reflections.entries;

            // Render Chart if missing
            renderWeeklyMoodChart(); // Fetch history and render

        } catch (err) {
            console.error("Error loading weekly insights:", err);
            if (loading) loading.style.display = "none";
            if (empty) empty.style.display = "block";
        }
    }

    async function renderWeeklyMoodChart() {
        // Fetch the last 7 days mood history specifically for the chart
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(BACKEND_URL + "/api/dashboard/summary", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            
            if (data.success && data.moodHistory) {
                // Get the chart container
                let chartCanvas = document.getElementById("weeklyInsightsChart");
                if (!chartCanvas) {
                    const contentDiv = document.getElementById("weeklyInsightsContent");
                    if (contentDiv) {
                        const chartContainer = document.createElement("div");
                        chartContainer.className = "iv-card";
                        chartContainer.style.marginBottom = "20px";
                        chartContainer.style.boxShadow = "none";
                        chartContainer.style.border = "1px solid var(--border-color)";
                        chartContainer.innerHTML = `<h4 style="font-size:14px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:12px;">Mood Trend (Last 7 Days)</h4><div style="position: relative; height: 180px; width: 100%;"><canvas id="weeklyInsightsChart"></canvas></div>`;
                        // Insert after AI summary (index 1)
                        contentDiv.insertBefore(chartContainer, contentDiv.children[1]);
                        chartCanvas = document.getElementById("weeklyInsightsChart");
                    }
                }

                if (chartCanvas && window.Chart) {
                    // Generate last 7 days exact dates
                    const today = new Date();
                    const last7Dates = [];
                    for (let i = 6; i >= 0; i--) {
                        let d = new Date(today);
                        d.setDate(d.getDate() - i);
                        last7Dates.push(d);
                    }

                    const labels = last7Dates.map(d => d.toLocaleDateString("en-IN", { weekday: 'short' }));

                    // Group mood history by date string
                    const dailyMoods = {};
                    (data.moodHistory || []).forEach(m => {
                        const d = new Date(m.created_at);
                        const dateString = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
                        if (!dailyMoods[dateString]) {
                            dailyMoods[dateString] = { sum: 0, count: 0 };
                        }
                        dailyMoods[dateString].sum += moodToScore(m.mood);
                        dailyMoods[dateString].count += 1;
                    });

                    const scores = last7Dates.map(d => {
                        const dateString = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
                        if (dailyMoods[dateString]) {
                            return Math.round(dailyMoods[dateString].sum / dailyMoods[dateString].count);
                        }
                        return null;
                    });

                    if (window.weeklyInsightsChartInstance) {
                        window.weeklyInsightsChartInstance.destroy();
                    }

                    window.weeklyInsightsChartInstance = new Chart(chartCanvas, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Mood Score',
                                data: scores,
                                borderColor: '#6c63ff',
                                backgroundColor: 'rgba(108, 99, 255, 0.1)',
                                borderWidth: 2,
                                tension: 0.4,
                                fill: true,
                                pointBackgroundColor: '#6c63ff',
                                spanGaps: true
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    max: 5,
                                    ticks: {
                                        stepSize: 1,
                                        callback: function(value) {
                                            const map = {1: 'Awful', 2: 'Bad', 3: 'Okay', 4: 'Good', 5: 'Great'};
                                            return map[value] || '';
                                        }
                                    }
                                },
                                x: { grid: { display: false } }
                            },
                            plugins: { legend: { display: false } }
                        }
                    });
                }
            }
        } catch (e) {
            console.error("Chart error:", e);
        }
    }


    // ==========================================
    // PART 2: TODAY'S PLAN
    // ==========================================
    async function loadTodayPlan() {
        const token = getToken();
        if (!token) return;

        const list = document.getElementById("dashDailyPlanList");
        if (!list) return;

        try {
            const res = await fetch(BACKEND_URL + "/api/daily-plan", {
                headers: { "Authorization": "Bearer " + token }
            });

            const data = await res.json();
            
            if (!data.success || !data.activities || data.activities.length === 0) {
                list.innerHTML = `<li style="font-size:14px; color:var(--text-muted); text-align:center; padding:12px 0;">No activities planned for today yet.</li>`;
                return;
            }

            list.innerHTML = data.activities.map(act => {
                const isCompleted = act.completed ? "checked" : "";
                const isSkipped = act.skipped ? "skipped" : "";
                
                let btnHtml = "";
                if (act.completed) {
                    btnHtml = `<span style="color:#10b981; font-weight:bold; font-size:12px;">✓ Completed</span>`;
                } else if (act.skipped) {
                    btnHtml = `<span style="color:var(--text-muted); font-weight:bold; font-size:12px;">Skipped</span>`;
                } else {
                    let btnText = "Start";
                    let action = `completeDailyPlanItem(${act.id})`;
                    
                    if (act.activity_type.includes('mood')) { btnText = "Log Mood"; action = "showSection('#mood')"; }
                    else if (act.activity_type.includes('journal')) { btnText = "Write Journal"; action = "showSection('#journal')"; }
                    else if (act.activity_type.includes('reflection') || act.activity_type.includes('gratitude') || act.activity_type.includes('breathing') || act.title.toLowerCase().includes('gratitude')) { btnText = "Start"; action = "showSection('#reflection')"; }
                    else if (act.activity_type.includes('habit')) { btnText = "Complete"; action = `completeDailyPlanItem(${act.id})`; }
                    else if (act.activity_type.includes('focus')) { btnText = "Start Focus"; action = "showSection('#focusMode')"; }
                    
                    btnHtml = `<button type="button" class="iv-btn iv-btn-primary" style="padding:4px 10px; font-size:12px;" onclick="${action}">${btnText}</button>`;
                }

                return `
                    <li style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border-color); ${isSkipped ? 'opacity:0.6;' : ''}">
                        <div>
                            <div style="font-weight:600; font-size:14px; ${isCompleted ? 'text-decoration:line-through; color:var(--text-muted);' : ''}">
                                ${escapeHTMLSafe(act.title)}
                            </div>
                            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
                                ${escapeHTMLSafe(act.description)}
                            </div>
                        </div>
                        <div>
                            ${btnHtml}
                        </div>
                    </li>
                `;
            }).join("");

        } catch (err) {
            console.error("Error loading today's plan:", err);
            list.innerHTML = `<li style="font-size:14px; color:#ef4444; text-align:center; padding:12px 0;">Unable to load today's plan. Please try again.</li>`;
        }
    }

    // Expose a global function to complete an item directly from dashboard
    window.completeDailyPlanItem = async function(id) {
        const token = getToken();
        if (!token) return;
        
        try {
            const res = await fetch(BACKEND_URL + `/api/daily-plan/items/${id}/complete`, {
                method: "PUT",
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success) {
                // Refresh to show it as completed
                loadTodayPlan();
            }
        } catch (err) {
            console.error("Failed to complete plan item", err);
        }
    };


    /* =====================================================
       4B. PERSONAL WELLNESS PROFILE (Phase 2)
       - View & Edit Wellness Profile
       - Name, Email, Avatar, Goals, Activities, Preferences
       - Secure Backend JWT & MySQL Persistence
       - Responsive UI with Local Fallback
    ===================================================== */

    let currentProfileData = null;

    // Helper: format duration label
    function formatDurationLabel(mins) {
        return `${mins} Minute${mins === 1 ? "" : "s"}`;
    }

    // Helper: breathing label
    function formatBreathingLabel(style) {
        const map = {
            "box": "Box Breathing (4-4-4-4)",
            "relax": "4-7-8 Deep Relaxation",
            "belly": "Deep Belly Breathing"
        };
        return map[style] || "Box Breathing (4-4-4-4)";
    }

    // Helper: theme label
    function formatThemeLabel(t) {
        const map = {
            "light": "🌿 Default Light",
            "lavender": "💜 Lavender Calm",
            "mint": "🌱 Mint Fresh",
            "dark": "🌙 Dark Serenity"
        };
        return map[t] || "Light Theme";
    }

    // Helper: language label
    function formatLanguageLabel(l) {
        const map = {
            "en": "English",
            "hi": "हिंदी (Hindi)",
            "es": "Español (Spanish)",
            "fr": "Français (French)"
        };
        return map[l] || "English";
    }

    // ---- Render Profile View ----
    function renderProfileView(profile) {
        if (!profile) return;

        const avatarEl = document.getElementById("profileAvatarDisplay");
        const nameEl = document.getElementById("profileNameDisplay");
        const emailEl = document.getElementById("profileEmailDisplay");
        const streakEl = document.getElementById("profileStreakBadge");
        const memberEl = document.getElementById("profileMemberSinceBadge");
        const goalsListEl = document.getElementById("profileGoalsList");
        const actsListEl = document.getElementById("profileActivitiesList");
        const medDurEl = document.getElementById("profileMedDurationVal");
        const breathEl = document.getElementById("profileBreathingVal");
        const themeEl = document.getElementById("profileThemeVal");
        const langEl = document.getElementById("profileLanguageVal");

        if (avatarEl) avatarEl.textContent = profile.avatar || "🌸";
        if (nameEl) nameEl.textContent = profile.name || "Wellness Seeker";
        if (emailEl) emailEl.textContent = profile.email || "—";
        if (streakEl) streakEl.textContent = `🔥 ${profile.streak || 0} Day Streak`;

        if (memberEl) {
            if (profile.created_at) {
                const d = new Date(profile.created_at);
                const dateStr = !isNaN(d.getTime())
                    ? d.toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                    : "Recently";
                memberEl.textContent = `🌱 Member since ${dateStr}`;
            } else {
                memberEl.textContent = "🌱 Member";
            }
        }

        // Render Goals
        if (goalsListEl) {
            const goals = profile.wellness_goals && profile.wellness_goals.length > 0
                ? profile.wellness_goals
                : ["Reduce Daily Stress", "Build Daily Reflection Habit"];
            goalsListEl.innerHTML = goals.map(g => `<span class="profile-chip goal">🎯 ${escapeHTMLSafe(g)}</span>`).join("");
        }

        // Render Activities
        if (actsListEl) {
            const acts = profile.favorite_activities && profile.favorite_activities.length > 0
                ? profile.favorite_activities
                : ["Meditation Timer", "Breathing Exercises", "Journal Writing"];
            actsListEl.innerHTML = acts.map(a => `<span class="profile-chip activity">✨ ${escapeHTMLSafe(a)}</span>`).join("");
        }

        // Render Preference Cards
        if (medDurEl) medDurEl.textContent = formatDurationLabel(profile.meditation_duration || 5);
        if (breathEl) breathEl.textContent = formatBreathingLabel(profile.breathing_exercise || "box");
        if (themeEl) themeEl.textContent = formatThemeLabel(profile.theme || "light");
        if (langEl) langEl.textContent = formatLanguageLabel(profile.language || "en");

        const reminderEl = document.getElementById("profileReminderVal");
        if (reminderEl) {
            const remMap = {
                "none": "No Reminders",
                "morning": "🌅 Morning (8:00 AM)",
                "afternoon": "☀️ Afternoon (2:00 PM)",
                "evening": "🌙 Evening (8:00 PM)"
            };
            reminderEl.textContent = remMap[profile.reminder_preference || "none"] || "No Reminders";
        }

        // Sync Dashboard Welcome message
        const welcomeEl = document.getElementById("dashboardWelcome");
        if (welcomeEl && profile.name) {
            welcomeEl.textContent = `Welcome back, ${profile.name}! Take a moment to check in with yourself. 🌿`;
        }
    }

    // ---- Populate Profile Edit Form ----
    function populateProfileEditForm(profile) {
        if (!profile) return;

        const nameInput = document.getElementById("editProfileName");
        if (nameInput) nameInput.value = profile.name || "";

        // Avatar selector
        const curAvatar = profile.avatar || "🌸";
        document.querySelectorAll(".avatar-pick-btn").forEach(btn => {
            if (btn.dataset.avatar === curAvatar) {
                btn.classList.add("selected");
            } else {
                btn.classList.remove("selected");
            }
        });

        // Goals multi-selector
        const userGoals = profile.wellness_goals || [];
        document.querySelectorAll("#goalsChipSelector .chip-toggle-btn").forEach(btn => {
            if (userGoals.includes(btn.dataset.goal)) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // Activities multi-selector
        const userActs = profile.favorite_activities || [];
        document.querySelectorAll("#activitiesChipSelector .chip-toggle-btn").forEach(btn => {
            if (userActs.includes(btn.dataset.act)) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // Selects
        const durSelect = document.getElementById("editMedDuration");
        if (durSelect) durSelect.value = String(profile.meditation_duration || 5);

        const breathSelect = document.getElementById("editBreathingExercise");
        if (breathSelect) breathSelect.value = profile.breathing_exercise || "box";

        const themeSelect = document.getElementById("editTheme");
        if (themeSelect) themeSelect.value = profile.theme || "light";

        const langSelect = document.getElementById("editLanguage");
        if (langSelect) langSelect.value = profile.language || "en";

        const remSelect = document.getElementById("editReminder");
        if (remSelect) remSelect.value = profile.reminder_preference || "none";
    }

    // ---- Toggle Profile Edit Mode ----
    function toggleProfileEditMode(isEditing) {
        const viewCard = document.getElementById("profileViewCard");
        const editCard = document.getElementById("profileEditCard");
        if (!viewCard || !editCard) return;

        if (isEditing) {
            if (!currentUser) {
                showMessage("Please login to edit your profile.");
                document.querySelector("#login")?.scrollIntoView({ behavior: "smooth" });
                return;
            }
            populateProfileEditForm(currentProfileData || {
                name: currentUser.name,
                email: currentUser.email,
                avatar: "🌸",
                wellness_goals: ["Reduce Daily Stress", "Build Daily Reflection Habit"],
                favorite_activities: ["Meditation Timer", "Breathing Exercises", "Journal Writing"],
                meditation_duration: 5,
                breathing_exercise: "box",
                theme: "light",
                language: "en",
                reminder_preference: "none"
            });
            viewCard.style.display = "none";
            editCard.style.display = "block";
            editCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
        } else {
            editCard.style.display = "none";
            viewCard.style.display = "block";
        }
    }

    // ---- Load Profile from Backend ----
    async function loadUserProfile() {
        const token = getToken();

        if (!token || !currentUser) {
            // Unauthenticated default display
            renderProfileView({
                name: "Guest",
                email: "Please login to customize profile",
                avatar: "🌸",
                streak: 0,
                wellness_goals: ["Reduce Daily Stress", "Build Daily Reflection Habit"],
                favorite_activities: ["Meditation Timer", "Breathing Exercises", "Journal Writing"],
                meditation_duration: 5,
                breathing_exercise: "box",
                theme: "light",
                language: "en",
                reminder_preference: "none"
            });
            return;
        }

        try {
            const res = await fetch(BACKEND_URL + "/api/users/profile", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success && data.profile) {
                currentProfileData = data.profile;
                if (currentUser && data.profile.name) {
                    currentUser.name = data.profile.name;
                    saveData();
                }
                renderProfileView(currentProfileData);
                return;
            }
        } catch (err) {
            console.warn("Could not load profile from backend, using local data.", err);
        }

        // Offline / fallback profile
        const localSavedPrefs = JSON.parse(localStorage.getItem("innerVoicePrefs_" + currentUser.email) || "null");
        currentProfileData = localSavedPrefs || {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            streak: 0,
            avatar: "🌸",
            wellness_goals: ["Reduce Daily Stress", "Build Daily Reflection Habit"],
            favorite_activities: ["Meditation Timer", "Breathing Exercises", "Journal Writing"],
            meditation_duration: 5,
            breathing_exercise: "box",
            theme: "light",
            language: "en",
            reminder_preference: "none"
        };
        renderProfileView(currentProfileData);
    }

    const updateProfile = loadUserProfile;

    // ---- Wire up Profile Event Listeners ----
    const editTriggerBtn = document.getElementById("profileEditTriggerBtn");
    if (editTriggerBtn) {
        editTriggerBtn.addEventListener("click", function () {
            toggleProfileEditMode(true);
        });
    }

    const cancelEditBtn = document.getElementById("cancelProfileEditBtn");
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", function () {
            toggleProfileEditMode(false);
        });
    }

    // Avatar Picker clicks
    document.querySelectorAll(".avatar-pick-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".avatar-pick-btn").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
        });
    });

    // Chip Toggle clicks
    document.querySelectorAll(".chip-toggle-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            btn.classList.toggle("active");
        });
    });

    // Profile Form Submission
    const profileForm = document.getElementById("profileEditForm");
    if (profileForm) {
        profileForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const nameInput = document.getElementById("editProfileName");
            const newName = nameInput ? nameInput.value.trim() : "";

            if (!newName) {
                showMessage("❌ Please enter your name.");
                return;
            }

            const selectedAvatarBtn = document.querySelector(".avatar-pick-btn.selected");
            const avatar = selectedAvatarBtn ? selectedAvatarBtn.dataset.avatar : "🌸";

            const selectedGoals = [];
            document.querySelectorAll("#goalsChipSelector .chip-toggle-btn.active").forEach(b => {
                if (b.dataset.goal) selectedGoals.push(b.dataset.goal);
            });

            const selectedActs = [];
            document.querySelectorAll("#activitiesChipSelector .chip-toggle-btn.active").forEach(b => {
                if (b.dataset.act) selectedActs.push(b.dataset.act);
            });

            const medDur = parseInt(document.getElementById("editMedDuration")?.value || "5", 10);
            const breathing = document.getElementById("editBreathingExercise")?.value || "box";
            const theme = document.getElementById("editTheme")?.value || "light";
            const lang = document.getElementById("editLanguage")?.value || "en";
            const reminderPref = document.getElementById("editReminder")?.value || "none";

            const payload = {
                name: newName,
                avatar: avatar,
                wellness_goals: selectedGoals,
                favorite_activities: selectedActs,
                meditation_duration: medDur,
                breathing_exercise: breathing,
                theme: theme,
                language: lang,
                reminder_preference: reminderPref
            };

            const token = getToken();

            if (token) {
                try {
                    const saveBtn = document.getElementById("saveProfileBtn");
                    if (saveBtn) saveBtn.textContent = "Saving…";

                    const res = await fetch(BACKEND_URL + "/api/users/profile", {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + token
                        },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();
                    if (saveBtn) saveBtn.textContent = "💾 Save Changes";

                    if (data.success && data.profile) {
                        currentProfileData = {
                            ...currentProfileData,
                            ...data.profile,
                            name: newName,
                            email: currentUser.email
                        };
                        currentUser.name = newName;
                        saveData();
                        localStorage.setItem("innerVoicePrefs_" + currentUser.email, JSON.stringify(currentProfileData));

                        renderProfileView(currentProfileData);
                        toggleProfileEditMode(false);
                        showMessage("🌿 Profile updated successfully!");
                        if (typeof loadDailyRecommendations === "function") loadDailyRecommendations();
                        return;
                    } else {
                        showMessage("❌ Could not save profile: " + (data.message || "Unknown error"));
                    }
                } catch (err) {
                    console.warn("Backend error saving profile, saving locally.", err);
                }
            }

            // Offline / fallback save
            currentProfileData = {
                ...(currentProfileData || {}),
                ...payload,
                email: currentUser ? currentUser.email : ""
            };
            if (currentUser) {
                currentUser.name = newName;
                saveData();
                localStorage.setItem("innerVoicePrefs_" + currentUser.email, JSON.stringify(currentProfileData));
            }
            renderProfileView(currentProfileData);
            toggleProfileEditMode(false);
            showMessage("🌿 Profile updated (saved locally)!");
            if (typeof loadDailyRecommendations === "function") loadDailyRecommendations();
        });
    }



    /* =====================================================
       4C. ACHIEVEMENTS & BADGES (Phase 3)
       - 8 Wellness Badges with Live Progress Tracking
       - Automatic Unlock Detection Across All Features
       - Celebration Unlock Modal & Toast Notifications
       - Dashboard Summary & Filter Tabs
       - Secure Backend JWT & MySQL Persistence
    ===================================================== */

    let achievementsList = [];
    let currentAchFilter = "all";
    const shownUnlockKeys = new Set(JSON.parse(localStorage.getItem("innerVoiceShownBadges") || "[]"));

    function saveShownUnlockKey(code) {
        shownUnlockKeys.add(code);
        localStorage.setItem("innerVoiceShownBadges", JSON.stringify(Array.from(shownUnlockKeys)));
    }

    // Celebration modal trigger
    function triggerAchievementUnlockModal(badge) {
        if (!badge) return;
        const modal = document.getElementById("achievementUnlockModal");
        const iconEl = document.getElementById("unlockModalIcon");
        const nameEl = document.getElementById("unlockModalName");
        const descEl = document.getElementById("unlockModalDesc");

        if (iconEl) iconEl.textContent = badge.icon || "🏆";
        if (nameEl) nameEl.textContent = badge.name || "Achievement Unlocked";
        if (descEl) descEl.textContent = badge.description || "You completed a wellness milestone!";

        if (modal) {
            modal.style.display = "flex";
            saveShownUnlockKey(badge.code || badge.id);
        }
    }

    // Close celebration modal
    const closeUnlockModalBtn = document.getElementById("unlockModalContinueBtn");
    if (closeUnlockModalBtn) {
        closeUnlockModalBtn.addEventListener("click", function () {
            const modal = document.getElementById("achievementUnlockModal");
            if (modal) modal.style.display = "none";
        });
    }

    const unlockModalEl = document.getElementById("achievementUnlockModal");
    if (unlockModalEl) {
        unlockModalEl.addEventListener("click", function (e) {
            if (e.target === unlockModalEl) unlockModalEl.style.display = "none";
        });
    }

    // ---- Render Achievements Grid & Banner ----
    function renderAchievementsView() {
        const grid = document.getElementById("achievementsGrid");
        const titleEl = document.getElementById("achOverallTitle");
        const subEl = document.getElementById("achOverallSubtitle");
        const pctEl = document.getElementById("achOverallPct");
        const barEl = document.getElementById("achOverallProgressBar");
        const unlockedFilterEl = document.getElementById("unlockedFilterNum");
        const lockedFilterEl = document.getElementById("lockedFilterNum");
        const dashSummaryEl = document.getElementById("dashAchSummary");
        const dashBarEl = document.getElementById("dashAchProgressBar");
        const dashPanelEl = document.getElementById("dashboardAchievementsPanel");

        if (!grid || achievementsList.length === 0) return;

        const total = achievementsList.length;
        const unlockedCount = achievementsList.filter(a => a.is_unlocked).length;
        const lockedCount = total - unlockedCount;
        const overallPct = Math.round((unlockedCount / total) * 100);

        if (titleEl) titleEl.textContent = `🏆 ${unlockedCount} of ${total} Badges Unlocked`;
        if (subEl) {
            subEl.textContent = unlockedCount === total
                ? "🎉 Incredible! You've unlocked every single wellness achievement!"
                : `Keep exploring reflections, moods, journals, and mindful practices to earn more badges.`;
        }
        if (pctEl) pctEl.textContent = `${overallPct}%`;
        if (barEl) barEl.style.width = `${overallPct}%`;
        if (unlockedFilterEl) unlockedFilterEl.textContent = unlockedCount;
        if (lockedFilterEl) lockedFilterEl.textContent = lockedCount;

        // Sync Dashboard Panel
        if (dashPanelEl) dashPanelEl.style.display = "block";
        if (dashSummaryEl) dashSummaryEl.textContent = `Unlocked: ${unlockedCount} / ${total} Badges (${overallPct}%)`;
        if (dashBarEl) dashBarEl.style.width = `${overallPct}%`;

        // Filter list
        const filtered = achievementsList.filter(a => {
            if (currentAchFilter === "unlocked") return a.is_unlocked;
            if (currentAchFilter === "locked") return !a.is_unlocked;
            return true;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align:center; padding: 40px 20px; color:#9ca3af;">
                    <span style="font-size:32px;">🌿</span>
                    <p style="margin-top:8px;">No achievements match this filter.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(a => {
            const isDone = a.is_unlocked;
            const iconClass = isDone ? "unlocked" : "locked";
            const cardClass = isDone ? "unlocked" : "locked";
            const barClass = isDone ? "unlocked" : "locked";

            let dateBadge = "";
            if (isDone && a.unlocked_at) {
                const d = new Date(a.unlocked_at);
                const dateStr = !isNaN(d.getTime())
                    ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                    : "Completed";
                dateBadge = `Unlocked ${dateStr}`;
            } else if (isDone) {
                dateBadge = "✓ Unlocked";
            } else {
                dateBadge = "🔒 In Progress";
            }

            return `
                <div class="ach-card ${cardClass}">
                    <div>
                        <div class="ach-card-top">
                            <div class="ach-icon ${iconClass}">
                                ${isDone ? a.icon : "🔒"}
                            </div>
                            <div style="flex:1;">
                                <h4 class="ach-name">${escapeHTMLSafe(a.name)}</h4>
                                <p class="ach-desc">${escapeHTMLSafe(a.description)}</p>
                            </div>
                        </div>

                        <div style="margin-top:14px;">
                            <div class="ach-progress-row">
                                <span style="color:#6b7280; font-weight:600;">Progress</span>
                                <span style="color:#202124; font-weight:700;">${a.current} / ${a.target}</span>
                            </div>
                            <div class="ach-bar-bg">
                                <div class="ach-bar-fill ${barClass}" style="width: ${a.percentage}%;"></div>
                            </div>
                        </div>
                    </div>

                    <div class="ach-footer">
                        <span style="color:#6b7280; font-size:11px; max-width:65%; line-height:1.3;">
                            ${escapeHTMLSafe(a.helper_text || "")}
                        </span>
                        <span class="ach-badge-pill ${iconClass}">
                            ${dateBadge}
                        </span>
                    </div>
                </div>
            `;
        }).join("");
    }

    // Filter Buttons
    document.querySelectorAll(".ach-filter-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".ach-filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentAchFilter = btn.dataset.filter || "all";
            renderAchievementsView();
        });
    });

    // ---- Load Achievements from Backend ----
    async function loadAchievements(checkUnlock = false) {
        // In Phase 5, we delegate this to our new comprehensive functions
        if (typeof window.loadAchievementSummary === 'function') {
            await window.loadAchievementSummary();
        }
        if (typeof window.loadAchievementsPage === 'function') {
            await window.loadAchievementsPage('all');
        }
        
        // Let's also check for newly unlocked achievements if requested
        if (checkUnlock) {
            const token = getToken();
            if (token) {
                try {
                    const res = await fetch(BACKEND_URL + "/api/achievements/evaluate", {
                        method: "POST",
                        headers: { "Authorization": "Bearer " + token }
                    });
                    const data = await res.json();
                    if (data.success && data.newlyUnlocked && data.newlyUnlocked.length > 0) {
                        data.newlyUnlocked.forEach(badge => {
                            if (!shownUnlockKeys.has(badge.code) && !shownUnlockKeys.has(badge.id)) {
                                triggerAchievementUnlockModal(badge);
                                shownUnlockKeys.add(badge.code || badge.id);
                            }
                        });
                        // Refresh to show newly unlocked badges
                        if (typeof window.loadAchievementSummary === 'function') await window.loadAchievementSummary();
                        if (typeof window.loadAchievementsPage === 'function') await window.loadAchievementsPage('all');
                    }
                } catch(e) {
                    console.error("Failed to evaluate achievements:", e);
                }
            }
        }
    }

    // ---- Log Mindful Activity (Meditation, Breathing, etc.) ----
    async function logWellnessActivity(activityType, activityName) {
        if (!currentUser) return;
        const userEmail = currentUser.email;

        // Save locally
        const localActs = JSON.parse(localStorage.getItem("innerVoiceActs_" + userEmail) || "[]");
        localActs.push({ type: activityType, name: activityName, timestamp: new Date().toISOString() });
        localStorage.setItem("innerVoiceActs_" + userEmail, JSON.stringify(localActs));

        const token = getToken();
        if (token) {
            try {
                const res = await fetch(BACKEND_URL + "/api/achievements/log-activity", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    },
                    body: JSON.stringify({ activity_type: activityType, activity_name: activityName })
                });
                const data = await res.json();
                if (data.success && data.newlyUnlocked && data.newlyUnlocked.length > 0) {
                    data.newlyUnlocked.forEach(badge => {
                        if (!shownUnlockKeys.has(badge.code) && !shownUnlockKeys.has(badge.id)) {
                            triggerAchievementUnlockModal(badge);
                        }
                    });
                }
            } catch (err) {
                console.warn("Backend error logging wellness activity, saved locally.", err);
            }
        }

        loadAchievements(true);
    }

    // Unified helper for wellness done
    async function markWellnessDone(activityName) {
        if (!activityName) return;
        const nameLower = activityName.toLowerCase();
        let type = "relaxation";
        if (nameLower.includes("meditat")) type = "meditation";
        else if (nameLower.includes("breath") || nameLower.includes("478") || nameLower.includes("box") || nameLower.includes("belly")) type = "breathing";
        else if (nameLower.includes("journal")) type = "journal";
        else if (nameLower.includes("reflect")) type = "reflection";
        else if (nameLower.includes("mood")) type = "mood";

        // 1. Update local tracker
        try {
            const done = getWellnessDone();
            if (!done.includes(activityName)) {
                done.push(activityName);
                localStorage.setItem(wellnessTrackKey(), JSON.stringify(done));
            }
        } catch (e) { /* non-fatal */ }
        renderWellnessTracker();

        // 2. Log activity in backend and refresh achievements
        await logWellnessActivity(type, activityName);

        // 3. Immediately refresh recommendations
        if (typeof loadDailyRecommendations === "function") {
            await loadDailyRecommendations();
        }
    }



    /* =====================================================
       4D. SMART DAILY RECOMMENDATIONS (Phase 4)
       - Today's Wellness Plan & Dynamic Daily Recommendations
       - Non-Clinical Daily Wellness Score & Checklist
       - Personalized Focus Prompt with Reflection Integration
       - Action Handlers with Automatic Tool Navigation & Tab Switch
       - Real-Time Recalculation on Any Mindful Action
    ===================================================== */

    let currentDailyRecommendations = [];

    // ---- Render Daily Recommendations View ----
    function renderDailyRecommendationsView(data) {
        if (!data) return;

        const grid = document.getElementById("recommendationsGrid");
        const promptEl = document.getElementById("dailyPromptText");
        const scoreBadge = document.getElementById("dailyScorePctBadge");
        const altScoreBadge = document.getElementById("dailyScore");
        const scoreBar = document.getElementById("dailyScoreProgressBar");
        const altScoreBar = document.getElementById("dailyScoreBar");
        const scoreSub = document.getElementById("dailyScoreSubtitle");
        const dashRecSummary = document.getElementById("dashRecSummary");
        const dashRecPanel = document.getElementById("dashboardRecommendationsPanel");

        // 1. Daily Reflection Focus Prompt
        if (promptEl && data.dailyPrompt) {
            promptEl.textContent = `“${data.dailyPrompt}”`;
        }

        // 2. Daily Wellness Score & Progress (0% -> 20% -> 40% -> 60% -> 80% -> 100%)
        const prog = data.wellnessProgress || { percentage: 0, completedCount: 0, totalPlanned: 5, completedItems: {} };
        const items = prog.completedItems || {};

        const calculatedCount = [
            Boolean(items.mood),
            Boolean(items.journal),
            Boolean(items.reflection),
            Boolean(items.meditation),
            Boolean(items.breathing)
        ].filter(Boolean).length;

        const finalCount = calculatedCount;
        const pct = Math.min(100, Math.round((finalCount / 5) * 100));

        if (scoreBadge) scoreBadge.textContent = `${pct}%`;
        if (altScoreBadge) altScoreBadge.textContent = `${pct}%`;
        if (scoreBar) scoreBar.style.width = `${pct}%`;
        if (altScoreBar) altScoreBar.style.width = `${pct}%`;
        if (scoreSub) {
            scoreSub.textContent = finalCount === 0
                ? "Completed 0 of 5 mindful practices today. One small step is enough! 🌱"
                : (finalCount >= 5
                    ? "Incredible! You have completed all 5 mindful practices today! 🎉"
                    : `Completed ${finalCount} of 5 mindful practices today ✨`);
        }

        // Checklist chips
        const chkMap = {
            "chk-mood": { key: "mood", label: "Mood Check-in" },
            "chk-journal": { key: "journal", label: "Journal Entry" },
            "chk-reflection": { key: "reflection", label: "Self Reflection" },
            "chk-meditation": { key: "meditation", label: "Meditation Session" },
            "chk-breathing": { key: "breathing", label: "Breathing Practice" }
        };

        Object.keys(chkMap).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const isDone = Boolean(items[chkMap[id].key]);
                el.className = `checklist-chip ${isDone ? "done" : "pending"}`;
                el.textContent = `${isDone ? "✓" : "○"} ${chkMap[id].label}`;
            }
        });

        // 3. Dashboard Recommendations Panel
        if (dashRecPanel) dashRecPanel.style.display = "block";
        if (dashRecSummary) {
            const uncompletedRecs = (data.recommendations || []).filter(r => !r.is_completed).length;
            dashRecSummary.textContent = `${uncompletedRecs} personalized recommendation${uncompletedRecs === 1 ? "" : "s"} ready | Today's Progress: ${pct}%`;
        }

        // 4. Recommendations Cards Grid
        if (!grid) return;
        currentDailyRecommendations = data.recommendations || [];

        if (currentDailyRecommendations.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align:center; padding: 40px 20px; color:#9ca3af;">
                    <span style="font-size:32px;">🌿</span>
                    <p style="margin-top:8px;">All caught up! You've completed your wellness recommendations for today.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = currentDailyRecommendations.map(rec => {
            const isDone = Boolean(rec.is_completed);
            const cardClass = isDone ? "completed" : "";

            return `
                <div class="rec-card ${cardClass}" id="recCard_${rec.id}">
                    <div>
                        <div class="rec-top">
                            <div class="rec-title-row">
                                <span class="rec-icon">${rec.icon}</span>
                                <div>
                                    <h4 style="margin:0 0 2px; font-size:16px; font-weight:800; color:#111827;">${escapeHTMLSafe(rec.title)}</h4>
                                    <span style="font-size:11px; color:#6b7280; text-transform:capitalize;">${escapeHTMLSafe(rec.category)}</span>
                                </div>
                            </div>
                            <span class="rec-dur-pill">⏱️ ${escapeHTMLSafe(rec.duration || "2 min")}</span>
                        </div>

                        <p class="rec-desc">${escapeHTMLSafe(rec.description)}</p>

                        <div class="rec-reason-box">
                            <strong>💡 Why recommended:</strong> ${escapeHTMLSafe(rec.reason || "")}
                        </div>
                    </div>

                    <div class="rec-actions">
                        <button type="button" class="btn primary rec-start-btn" data-target="${rec.target_section}" data-tab="${rec.tab_name || ""}" style="margin:0; flex:1; padding:9px 14px; font-size:13px;" ${isDone ? "disabled" : ""}>
                            ${isDone ? "✓ Completed" : (rec.start_label || "Start")}
                        </button>
                        ${!isDone ? `
                            <button type="button" class="btn secondary rec-done-btn" data-id="${rec.id}" data-category="${rec.category}" data-title="${escapeHTMLSafe(rec.title)}" style="margin:0; width:auto; padding:9px 14px; font-size:12px;" title="Mark as Done">
                                ✓ Done
                            </button>
                        ` : ""}
                    </div>
                </div>
            `;
        }).join("");

        // Wire up Start button clicks
        grid.querySelectorAll(".rec-start-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                const target = btn.dataset.target;
                const tab = btn.dataset.tab;

                if (target) {
                    const sec = document.querySelector(target);
                    if (sec) sec.scrollIntoView({ behavior: "smooth" });

                    // If tab specified, activate tab in wellness resources
                    if (tab) {
                        const tabBtn = document.querySelector(`.res-tab[data-tab="${tab}"]`) || document.querySelector(`.resource-tab[data-tab="${tab}"]`);
                        if (tabBtn) tabBtn.click();
                    }
                }
            });
        });

        // Wire up Mark as Done button clicks
        grid.querySelectorAll(".rec-done-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                const recId = btn.dataset.id;
                const cat = btn.dataset.category;
                const title = btn.dataset.title;

                btn.textContent = "✓ Completed";
                btn.disabled = true;
                const card = document.getElementById("recCard_" + recId);
                if (card) card.classList.add("completed");

                markWellnessDone(title || cat);
                showMessage(`🌿 Completed: ${title || cat}! Well done.`);
            });
        });
    }

    // ---- Load Recommendations from Backend ----
    async function loadDailyRecommendations() {
        const token = getToken();

        if (!token || !currentUser) {
            // Default unauthenticated guest plan
            const guestPlan = {
                recommendations: [
                    { id: "rec_mood", icon: "😊", title: "Daily Mood Check-in", description: "Take a moment to pause and notice how you're feeling right now.", duration: "1 min", reason: "Because tracking your mood builds emotional awareness.", category: "mood", target_section: "#mood", is_completed: false, start_label: "Check In" },
                    { id: "rec_breathing", icon: "🌬️", title: "Box Breathing Focus", description: "Follow the gentle rhythmic expanding circle to regulate your breath.", duration: "2 min", reason: "Gentle breathing centers the mind and releases tension.", category: "breathing", target_section: "#resources", tab_name: "breathing", is_completed: false, start_label: "Start Breathing" },
                    { id: "rec_meditation", icon: "🧘", title: "5-Minute Meditation", description: "A quiet space with interval cues to rest your focus and center thoughts.", duration: "5 min", reason: "Regular meditation nurtures emotional balance.", category: "meditation", target_section: "#resources", tab_name: "meditation", is_completed: false, start_label: "Start Timer" },
                    { id: "rec_journal", icon: "📔", title: "Mindful Journal Entry", description: "Express your honest thoughts freely in your private journal space.", duration: "4 min", reason: "Writing helps untangle swirling thoughts and release stress.", category: "journal", target_section: "#journal", is_completed: false, start_label: "Open Journal" }
                ],
                wellnessProgress: { percentage: 0, completedCount: 0, totalPlanned: 5, completedItems: { mood: false, journal: false, reflection: false, meditation: false, breathing: false } },
                dailyPrompt: "What is one small thing that helped you feel grounded today?",
                reasons: ["Start your day with self-awareness."]
            };
            renderDailyRecommendationsView(guestPlan);
            return;
        }

        try {
            const res = await fetch(BACKEND_URL + "/api/recommendations/today", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();

            if (data.success && Array.isArray(data.recommendations)) {
                renderDailyRecommendationsView(data);
                return;
            }
        } catch (err) {
            console.warn("Could not load recommendations from backend, calculating locally.", err);
        }

        // Offline local fallback calculation with robust date matching
        function isDateToday(dateVal) {
            if (!dateVal) return false;
            const d = new Date(dateVal);
            if (!isNaN(d.getTime())) {
                return d.toDateString() === new Date().toDateString();
            }
            const s = String(dateVal);
            const now = new Date();
            const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            const iso = now.toISOString().slice(0, 10);
            const loc = now.toLocaleDateString();
            return s.includes(iso) || s.includes(loc) || s.includes(localDateStr);
        }

        const userEmail = currentUser ? currentUser.email : "";
        const uMoods = moods.filter(m => !userEmail || m.email === userEmail);
        const uJournals = journals.filter(j => !userEmail || j.email === userEmail);
        const uReflections = reflections.filter(r => !userEmail || r.email === userEmail);
        const uWellnessActs = JSON.parse(localStorage.getItem("innerVoiceActs_" + userEmail) || "[]");

        const todayMood = uMoods.find(m => isDateToday(m.date || m.created_at || m.mood_date));
        const todayJournals = uJournals.filter(j => isDateToday(j.date || j.created_at || j.journal_date));
        const todayReflections = uReflections.filter(r => isDateToday(r.date || r.created_at || r.reflection_date));
        const todayMed = uWellnessActs.filter(a => (a.type === "meditation" || String(a.type).includes("meditat") || String(a.name).toLowerCase().includes("meditat")) && isDateToday(a.timestamp || a.created_at));
        const todayBreath = uWellnessActs.filter(a => (a.type === "breathing" || String(a.type).includes("breath") || String(a.name).toLowerCase().includes("breath") || String(a.name).includes("478") || String(a.name).includes("Box")) && isDateToday(a.timestamp || a.created_at));

        const completedChecks = {
            mood: Boolean(todayMood),
            journal: todayJournals.length > 0,
            reflection: todayReflections.length > 0,
            meditation: todayMed.length > 0,
            breathing: todayBreath.length > 0
        };

        const compCount = [
            completedChecks.mood,
            completedChecks.journal,
            completedChecks.reflection,
            completedChecks.meditation,
            completedChecks.breathing
        ].filter(Boolean).length;
        const localScorePct = Math.min(100, Math.round((compCount / 5) * 100));

        const fallbackRecs = [
            { id: "rec_mood", icon: "😊", title: "Daily Mood Check-in", description: "Notice how you are feeling right now.", duration: "1 min", reason: "Because tracking your mood builds emotional awareness.", category: "mood", target_section: "#mood", is_completed: completedChecks.mood, start_label: completedChecks.mood ? "Completed ✓" : "Check In" },
            { id: "rec_breathing", icon: "🌬️", title: "Box Breathing Practice", description: "Follow rhythmic breathing cues to release stress.", duration: "2 min", reason: "Because breathing exercises calm the body.", category: "breathing", target_section: "#resources", tab_name: "breathing", is_completed: completedChecks.breathing, start_label: completedChecks.breathing ? "Completed ✓" : "Start Breathing" },
            { id: "rec_meditation", icon: "🧘", title: "5-Minute Meditation", description: "A quiet space to rest your focus.", duration: "5 min", reason: "Regular meditation nurtures emotional balance.", category: "meditation", target_section: "#resources", tab_name: "meditation", is_completed: completedChecks.meditation, start_label: completedChecks.meditation ? "Completed ✓" : "Start Timer" },
            { id: "rec_journal", icon: "📔", title: "Mindful Journal Entry", description: "Write down your thoughts in a private space.", duration: "4 min", reason: "Because expressing thoughts brings clarity.", category: "journal", target_section: "#journal", is_completed: completedChecks.journal, start_label: completedChecks.journal ? "Completed ✓" : "Open Journal" }
        ];

        renderDailyRecommendationsView({
            recommendations: fallbackRecs,
            wellnessProgress: { percentage: localScorePct, completedCount: compCount, totalPlanned: 5, completedItems: completedChecks },
            dailyPrompt: "What is one small thing that helped you feel grounded today?",
            reasons: ["Build self-awareness and mindful calm."]
        });
    }



    /* =====================================================
       6. MOOD TRACKER — Backend integrated
    ===================================================== */

    const moodSection = document.querySelector("#mood");


    // ---- Helper: get JWT token from localStorage ----
    function getToken() {
        return localStorage.getItem("innerVoiceToken") || null;
    }


    // ---- Render mood history cards into #moodHistoryList ----
    function renderMoodHistory(moodsArray) {

        const historyPanel = document.getElementById("moodHistory");
        const historyList  = document.getElementById("moodHistoryList");

        if (!historyPanel || !historyList) return;

        if (!moodsArray || moodsArray.length === 0) {
            historyPanel.style.display = "none";
            return;
        }

        historyPanel.style.display = "block";

        historyList.innerHTML = moodsArray.map(function (entry) {

            // Format date nicely
            const date = entry.created_at
                ? new Date(entry.created_at).toLocaleDateString("en-IN", {
                    day:   "2-digit",
                    month: "short",
                    year:  "numeric"
                  })
                : entry.date || "";

            const icon = entry.icon || "";

            return `
                <div style="
                    background: white;
                    border-radius: 18px;
                    padding: 18px 15px;
                    text-align: center;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.06);
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                    <div style="font-size:30px; margin-bottom:8px;">${icon}</div>
                    <strong style="display:block; color:#202124;">${entry.mood}</strong>
                    <small style="color:#6b7280;">${date}</small>
                </div>
            `;

        }).join("");
    }


    // ---- Load mood history from backend ----
    async function loadMoodHistory() {

        const token = getToken();

        if (!token || !currentUser) return;

        try {

            const res = await fetch(BACKEND_URL + "/api/moods", {
                headers: { "Authorization": "Bearer " + token }
            });

            const data = await res.json();

            if (data.success) {

                // Also sync to localStorage for dashboard
                moods = data.moods.map(function (m) {
                    return {
                        id:    m.id,
                        email: currentUser.email,
                        mood:  m.mood,
                        icon:  m.icon,
                        date:  m.created_at
                    };
                });

                saveData();

                renderMoodHistory(data.moods);

                updateDashboard();

            }

        } catch (err) {

            // Backend not reachable — show localStorage moods instead
            console.warn("Could not load mood history from backend.", err);

            const localMoods = moods.filter(
                m => m.email === (currentUser ? currentUser.email : "")
            );

            renderMoodHistory(localMoods);

        }
    }


    // ---- Core: save mood (calls backend, falls back to localStorage) ----
    async function saveMood(moodName, moodIcon) {

        const token = getToken();

        if (!token) {

            // localStorage-only fallback
            const moodData = {
                id:    Date.now(),
                email: currentUser.email,
                mood:  moodName,
                icon:  moodIcon,
                date:  getDate()
            };

            moods.push(moodData);
            saveData();

            showMessage(moodIcon + " Mood saved: " + moodName);
            updateDashboard();

            renderMoodHistory(
                moods.filter(m => m.email === currentUser.email)
            );

            return;
        }

        try {

            const res = await fetch(BACKEND_URL + "/api/moods", {
                method:  "POST",
                headers: {
                    "Content-Type":  "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ mood: moodName, icon: moodIcon })
            });

            const data = await res.json();

            if (data.success) {

                // Also save to localStorage for offline dashboard
                moods.push({
                    id:    data.mood_id,
                    email: currentUser.email,
                    mood:  moodName,
                    icon:  moodIcon,
                    date:  data.created_at || getDate()
                });

                saveData();
                updateDashboard();

                // Refresh history & analytics from DB & Daily Recommendations immediately
                loadMoodHistory();
                loadMoodAnalytics();
                loadAchievements(true);
                await loadDailyRecommendations();

                showMessage(moodIcon + " Mood saved: " + moodName);

            } else {

                showMessage("\u274c Could not save mood: " + data.message);

            }

        } catch (err) {

            console.warn("Backend not reachable, saving mood to localStorage.", err);

            const moodData = {
                id:    Date.now(),
                email: currentUser.email,
                mood:  moodName,
                icon:  moodIcon,
                date:  getDate()
            };

            moods.push(moodData);
            saveData();

            showMessage(moodIcon + " Mood saved (offline): " + moodName);
            updateDashboard();

            renderMoodHistory(
                moods.filter(m => m.email === currentUser.email)
            );
            loadMoodAnalytics();

        }
    }


    // ---- Wire up mood card Select buttons ----
    if (moodSection) {

        const moodButtons =
            moodSection.querySelectorAll(".card button");


        moodButtons.forEach(button => {

            button.addEventListener("click", async function (e) {

                if (!currentUser) {

                    showMessage(
                        "Please login first to save your mood."
                    );

                    document.querySelector("#login")
                        ?.scrollIntoView({ behavior: "smooth" });

                    return;
                }

                // UI feedback
                moodSection.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));
                const card     = button.closest(".card");
                card.classList.add("selected");
                
                const originalText = button.textContent;
                button.textContent = "Saving...";
                button.disabled = true;

                const moodName = card.querySelector("h3").textContent.trim();
                const moodIcon = card.querySelector(".card-icon").textContent.trim();

                await saveMood(moodName, moodIcon);
                
                button.textContent = "Saved \u2714";
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);

            });

        });
    }



    /* =====================================================
       6B. ADVANCED MOOD ANALYTICS (Phase 1)
       - Monthly Mood Calendar with Month Navigation
       - Day Detail Modal (Mood, Journal, Reflection, Goals)
       - Mood Statistics (Most Common, Average Score, Best/Difficult Days)
       - Mood Distribution Breakdown
       - Interactive Multi-Period Trends Chart (7d, 30d, all)
       - Supportive Non-Clinical Insights
    ===================================================== */

    let calYear = new Date().getFullYear();
    let calMonth = new Date().getMonth();
    let analyticsChartInstance = null;
    let currentTrendPeriod = "7d";
    let cachedAnalyticsData = null;

    // Helper: score to label
    function getScoreLabel(score) {
        if (score >= 4.5) return "Very Uplifting";
        if (score >= 3.8) return "Predominantly Positive";
        if (score >= 3.0) return "Balanced";
        if (score >= 2.0) return "Emotionally Demanding";
        return "Difficult Period";
    }

    // ---- Render Mood Calendar ----
    async function loadMoodCalendar(year, month) {
        const grid = document.getElementById("moodCalendarGrid");
        if (grid) grid.innerHTML = '<div class="dashboard-loading" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">Loading calendar...</div>';
        
        const mStr = String(month + 1).padStart(2, "0");
        const monthParam = `${year}-${mStr}`;
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(BACKEND_URL + "/api/moods/calendar?month=" + monthParam, {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success) {
                renderMoodCalendar(year, month, data);
                renderMoodMonthStats(data.stats, data.streak);
            } else {
                if (grid) grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #ff6b6b;">Failed to load calendar.</div>';
            }
        } catch (err) {
            console.error("Error loading mood calendar", err);
            if (grid) grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #ff6b6b;">Error loading calendar.</div>';
        }
    }

    function renderMoodCalendar(year, month, data) {
        const grid = document.getElementById("moodCalendarGrid");
        const monthTitle = document.getElementById("calMonthYearDisplay");
        if (!grid || !monthTitle) return;

        monthTitle.textContent = new Date(year, month, 1).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric"
        });

        grid.innerHTML = "";

        const firstDayIdx = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
        const todayDateNum = today.getDate();

        // 1. Empty offset cells before day 1
        for (let i = 0; i < firstDayIdx; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "cal-day empty";
            grid.appendChild(emptyCell);
        }

        // 2. Day cells for current month
        for (let day = 1; day <= daysInMonth; day++) {
            const mStr = String(month + 1).padStart(2, "0");
            const dStr = String(day).padStart(2, "0");
            const dateKey = `${year}-${mStr}-${dStr}`;

            const isToday = isCurrentMonth && day === todayDateNum;
            const isFuture = (year > today.getFullYear()) || 
                             (year === today.getFullYear() && month > today.getMonth()) ||
                             (isCurrentMonth && day > todayDateNum);

            const dayData = data.days.find(d => d.date === dateKey);

            const dayCell = document.createElement("div");
            dayCell.className = "cal-day" +
                (isToday ? " today" : "") +
                (dayData ? " has-mood" : "") + 
                (isFuture ? " empty" : "");
                
            if (!isFuture) {
                dayCell.title = `View details for ${dateKey}`;
                dayCell.style.cursor = "pointer";
                dayCell.addEventListener("click", function () {
                    window.openDayDetailModal(dateKey);
                });
            } else {
                dayCell.title = "Future date";
            }

            let dotsHtml = "";
            if (dayData) {
                if (dayData.hasJournal) dotsHtml += '<span class="cal-dot journal" title="Journal logged"></span>';
                if (dayData.hasReflection) dotsHtml += '<span class="cal-dot reflection" title="Reflection recorded"></span>';
                if (dayData.hasGoal) dotsHtml += '<span class="cal-dot goal" title="Goal completed"></span>';
            }

            dayCell.innerHTML = `
                <span class="cal-day-num">${day}</span>
                <span class="cal-day-icon">${dayData ? (dayData.icon || "😊") : ""}</span>
                <div class="cal-day-dots">${dotsHtml}</div>
            `;

            grid.appendChild(dayCell);
        }
    }
    
    function renderMoodMonthStats(stats, streak) {
        document.getElementById("statMostCommonMood").textContent = stats.mostCommonMood ? `${stats.mostCommonMood.icon} ${stats.mostCommonMood.mood}` : "—";
        document.getElementById("statMostCommonMoodCount").textContent = stats.mostCommonMood ? `${stats.mostCommonMood.count} days` : "No entries yet";
        
        document.getElementById("statAvgMoodScore").textContent = stats.averageScore > 0 ? stats.averageScore.toFixed(1) : "—";
        document.getElementById("statAvgMoodScoreLabel").textContent = stats.averageScore > 0 ? getScoreLabel(stats.averageScore) : "out of 5.0";
        
        document.getElementById("statBestMoodDay").textContent = `${stats.positiveDays} Days`;
        document.getElementById("statBestMoodDayScore").textContent = "Positive mood";
        
        document.getElementById("statDifficultMoodDay").textContent = `${stats.negativeDays} Days`;
        document.getElementById("statDifficultMoodDayScore").textContent = "Difficult mood";
        
        // Distribution Bars
        const distContainer = document.getElementById("moodDistributionBars");
        if (distContainer) {
            const total = stats.positiveDays + stats.neutralDays + stats.negativeDays;
            if (total === 0) {
                distContainer.innerHTML = "<p style='color:#6b7280; font-size:13px;'>No moods logged this month.</p>";
            } else {
                const pPct = Math.round((stats.positiveDays / total) * 100);
                const nPct = Math.round((stats.neutralDays / total) * 100);
                const negPct = Math.round((stats.negativeDays / total) * 100);
                
                distContainer.innerHTML = `
                    <div style="margin-bottom:8px;">
                        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                            <span>Positive (${pPct}%)</span>
                            <span>${stats.positiveDays} d</span>
                        </div>
                        <div style="background:#e5e7eb; height:8px; border-radius:4px; overflow:hidden;">
                            <div style="background:#10b981; height:100%; width:${pPct}%;"></div>
                        </div>
                    </div>
                    <div style="margin-bottom:8px;">
                        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                            <span>Neutral (${nPct}%)</span>
                            <span>${stats.neutralDays} d</span>
                        </div>
                        <div style="background:#e5e7eb; height:8px; border-radius:4px; overflow:hidden;">
                            <div style="background:#f59e0b; height:100%; width:${nPct}%;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                            <span>Difficult (${negPct}%)</span>
                            <span>${stats.negativeDays} d</span>
                        </div>
                        <div style="background:#e5e7eb; height:8px; border-radius:4px; overflow:hidden;">
                            <div style="background:#ef4444; height:100%; width:${negPct}%;"></div>
                        </div>
                    </div>
                `;
            }
        }
        
        // Insights
        const insightsList = document.getElementById("moodInsightsList");
        if (insightsList) {
            insightsList.innerHTML = "";
            if (stats.totalCount === 0) {
                insightsList.innerHTML = "<li>Log your moods to discover patterns over time.</li>";
            } else {
                if (stats.positiveDays > stats.negativeDays) {
                    insightsList.innerHTML += "<li>You've had more positive days than difficult ones this month. Great job!</li>";
                }
                if (streak.current >= 3) {
                    insightsList.innerHTML += `<li>You are on a <strong>${streak.current}-day</strong> check-in streak. Keep it up!</li>`;
                }
                if (stats.averageScore >= 4.0) {
                    insightsList.innerHTML += "<li>Your overall mood score is excellent this month.</li>";
                } else if (stats.averageScore <= 2.5) {
                    insightsList.innerHTML += "<li>It seems like a challenging month. Remember to be gentle with yourself.</li>";
                }
                if (streak.longest > 0 && streak.current < streak.longest) {
                     insightsList.innerHTML += `<li>Your longest streak this month was ${streak.longest} days.</li>`;
                }
                if (insightsList.innerHTML === "") {
                    insightsList.innerHTML = "<li>Consistent reflection helps build emotional awareness.</li>";
                }
            }
        }
    }

    // ---- Day Detail Modal ----
    window.openDayDetailModal = async function (dateKey) {
        const modal = document.getElementById("dayDetailModal");
        const titleEl = document.getElementById("dayModalTitle");
        const bodyEl = document.getElementById("dayModalBody");
        if (!modal || !titleEl || !bodyEl) return;

        // Pretty date format
        let prettyDate = dateKey;
        try {
            const parts = dateKey.split("-");
            const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            prettyDate = d.toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            });
        } catch (e) {}

        titleEl.textContent = "📅 " + prettyDate;
        bodyEl.innerHTML = '<div class="dashboard-loading">Loading day activities…</div>';
        modal.style.display = "flex";

        const token = getToken();
        let dayData = { moods: [], journals: [], reflections: [], goals: [] };

        if (token) {
            try {
                const res = await fetch(BACKEND_URL + "/api/moods/day-details?date=" + dateKey, {
                    headers: { "Authorization": "Bearer " + token }
                });
                const data = await res.json();
                if (data.success) {
                    dayData = data;
                }
            } catch (err) {
                console.warn("Could not fetch day details from backend, falling back to local data.", err);
            }
        }

        // If backend returned empty or was offline, fallback to local data
        if (dayData.moods.length === 0 && dayData.journals.length === 0 && dayData.reflections.length === 0 && dayData.goals.length === 0) {
            const userEmail = currentUser ? currentUser.email : "";
            function matchDate(dateVal) {
                if (!dateVal) return false;
                if (typeof dateVal === "string" && dateVal.startsWith(dateKey)) return true;
                try {
                    const d = new Date(dateVal);
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    return `${y}-${m}-${day}` === dateKey;
                } catch (e) { return false; }
            }

            dayData.moods = moods.filter(m => (!userEmail || m.email === userEmail) && matchDate(m.date || m.created_at));
            dayData.journals = journals.filter(j => (!userEmail || j.email === userEmail) && matchDate(j.date || j.created_at));
            dayData.reflections = reflections.filter(r => (!userEmail || r.email === userEmail) && matchDate(r.date || r.created_at));
            dayData.goals = goals.filter(g => (!userEmail || g.email === userEmail) && matchDate(g.completed_date || g.date || g.created_at));
        }

        const hasAny = (dayData.moods && dayData.moods.length > 0) ||
                       (dayData.journals && dayData.journals.length > 0) ||
                       (dayData.reflections && dayData.reflections.length > 0) ||
                       (dayData.goals && dayData.goals.length > 0);

        if (!hasAny) {
            bodyEl.innerHTML = `
                <div class="day-empty-state">
                    <span style="font-size:36px;">🌱</span>
                    <p style="margin-top:10px; font-weight:600; color:#374151;">No activities recorded on this date.</p>
                    <p style="font-size:13px; color:#9ca3af; margin-top:4px;">Check in daily to build your personal timeline!</p>
                </div>
            `;
            return;
        }

        let html = "";

        // Moods
        (dayData.moods || []).forEach(m => {
            html += `
                <div class="day-item-block mood-block">
                    <div class="day-item-type">😊 Mood Logged</div>
                    <div style="font-size:16px; font-weight:700; color:#202124;">
                        ${escapeHTMLSafe(m.icon || "")} ${escapeHTMLSafe(m.mood || "")}
                    </div>
                </div>
            `;
        });

        // Journals
        (dayData.journals || []).forEach(j => {
            html += `
                <div class="day-item-block journal-block">
                    <div class="day-item-type">📔 Journal Entry</div>
                    <p style="font-size:14px; color:#374151; line-height:1.6; margin:0;">${escapeHTMLSafe(j.text || "")}</p>
                </div>
            `;
        });

        // Reflections
        (dayData.reflections || []).forEach(r => {
            html += `
                <div class="day-item-block reflection-block">
                    <div class="day-item-type">🪞 Self Reflection</div>
                    ${r.question ? `<strong style="font-size:13px; color:#92400e; display:block; margin-bottom:4px;">${escapeHTMLSafe(r.question.replace(/"/g, ""))}</strong>` : ""}
                    <p style="font-size:14px; color:#374151; line-height:1.6; margin:0;">${escapeHTMLSafe(r.answer || "")}</p>
                </div>
            `;
        });

        // Goals
        (dayData.goals || []).forEach(g => {
            html += `
                <div class="day-item-block goal-block">
                    <div class="day-item-type">🎯 Daily Challenge Completed</div>
                    <p style="font-size:14px; color:#1e3a8a; font-weight:600; margin:0;">✓ ${escapeHTMLSafe(g.challenge || "")}</p>
                </div>
            `;
        });

        bodyEl.innerHTML = html;
    };

    function closeDayDetailModal() {
        const modal = document.getElementById("dayDetailModal");
        if (modal) modal.style.display = "none";
    }

    // Modal close listeners
    const modalCloseBtn = document.getElementById("dayModalCloseBtn");
    if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeDayDetailModal);

    const dayModalEl = document.getElementById("dayDetailModal");
    if (dayModalEl) {
        dayModalEl.addEventListener("click", function (e) {
            if (e.target === dayModalEl) closeDayDetailModal();
        });
    }
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeDayDetailModal();
    });

    // Calendar Navigation
    const calPrevBtn = document.getElementById("calPrevMonthBtn");
    const calNextBtn = document.getElementById("calNextMonthBtn");
    const calTodayBtn = document.getElementById("calTodayBtn");

    if (calPrevBtn) {
        calPrevBtn.addEventListener("click", function () {
            calMonth--;
            if (calMonth < 0) { calMonth = 11; calYear--; }
            loadMoodCalendar(calYear, calMonth);
        });
    }
    if (calNextBtn) {
        calNextBtn.addEventListener("click", function () {
            calMonth++;
            if (calMonth > 11) { calMonth = 0; calYear++; }
            loadMoodCalendar(calYear, calMonth);
        });
    }
    if (calTodayBtn) {
        calTodayBtn.addEventListener("click", function () {
            const t = new Date();
            calYear = t.getFullYear();
            calMonth = t.getMonth();
            loadMoodCalendar(calYear, calMonth);
        });
    }

    // ---- Render Mood Statistics ----
    function renderMoodStatistics(stats) {
        if (!stats) return;

        const commonEl = document.getElementById("statMostCommonMood");
        const commonSubEl = document.getElementById("statMostCommonMoodCount");
        const avgEl = document.getElementById("statAvgMoodScore");
        const avgSubEl = document.getElementById("statAvgMoodScoreLabel");
        const bestEl = document.getElementById("statBestMoodDay");
        const bestSubEl = document.getElementById("statBestMoodDayScore");
        const diffEl = document.getElementById("statDifficultMoodDay");
        const diffSubEl = document.getElementById("statDifficultMoodDayScore");

        if (commonEl) {
            commonEl.textContent = stats.mostCommonMood ? `${stats.mostCommonMood.icon} ${stats.mostCommonMood.mood}` : "—";
            if (commonSubEl) commonSubEl.textContent = stats.mostCommonMood ? `${stats.mostCommonMood.count} ${stats.mostCommonMood.count === 1 ? "entry" : "entries"}` : "No entries yet";
        }

        if (avgEl) {
            avgEl.textContent = stats.averageScore !== null && stats.averageScore !== undefined ? `${stats.averageScore} / 5.0` : "—";
            if (avgSubEl) avgSubEl.textContent = stats.averageScore !== null && stats.averageScore !== undefined ? getScoreLabel(stats.averageScore) : "out of 5.0";
        }

        if (bestEl) {
            bestEl.textContent = stats.bestDayOfWeek ? stats.bestDayOfWeek.day : "—";
            if (bestSubEl) bestSubEl.textContent = stats.bestDayOfWeek ? `Avg: ${stats.bestDayOfWeek.avgScore} / 5.0` : "Highest score";
        }

        if (diffEl) {
            diffEl.textContent = stats.difficultDayOfWeek ? stats.difficultDayOfWeek.day : "—";
            if (diffSubEl) diffSubEl.textContent = stats.difficultDayOfWeek ? `Avg: ${stats.difficultDayOfWeek.avgScore} / 5.0` : "Lower energy";
        }
    }

    // ---- Render Mood Distribution Bars ----
    function renderMoodDistribution(distribution, totalCount) {
        const container = document.getElementById("moodDistributionBars");
        if (!container) return;

        if (!distribution || Object.keys(distribution).length === 0 || !totalCount) {
            container.innerHTML = '<p style="font-size:13px; color:#9ca3af; text-align:center; padding:10px 0;">No mood data to distribute yet.</p>';
            return;
        }

        const iconMapping = {
            "Happy": "😄", "Excited": "🤩", "Great": "✨",
            "Good": "😊", "Okay": "😐", "Neutral": "😐",
            "Tired": "🥱", "Sad": "😔", "Anxious": "😰",
            "Angry": "😠", "Terrible": "😞"
        };

        const sortedMoods = Object.entries(distribution).sort((a, b) => b[1] - a[1]);

        container.innerHTML = sortedMoods.map(([moodName, count]) => {
            const pct = Math.round((count / totalCount) * 100);
            const icon = iconMapping[moodName] || "😊";
            return `
                <div class="dist-item">
                    <div class="dist-header">
                        <span>${icon} ${escapeHTMLSafe(moodName)}</span>
                        <span>${count} (${pct}%)</span>
                    </div>
                    <div class="dist-bar-bg">
                        <div class="dist-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                </div>
            `;
        }).join("");
    }

    // ---- Render Supportive Non-Clinical Insights ----
    function renderMoodInsights(insights) {
        const listEl = document.getElementById("moodInsightsList");
        if (!listEl) return;

        if (!insights || insights.length === 0) {
            listEl.innerHTML = '<li>Log your mood daily to discover patterns and emotional balance.</li>';
            return;
        }

        listEl.innerHTML = insights.map(item => `<li>${escapeHTMLSafe(item)}</li>`).join("");
    }

    // ---- Render Multi-Period Trend Chart ----
    function renderAnalyticsTrendChart(trendsData, period) {
        const canvas = document.getElementById("moodAnalyticsChart");
        if (!canvas) return;

        if (typeof Chart === "undefined") return;

        let entries = [];
        if (trendsData) {
            if (period === "7d") entries = trendsData.sevenDay || [];
            else if (period === "30d") entries = trendsData.thirtyDay || [];
            else entries = trendsData.allTime || [];
        }

        if (analyticsChartInstance) {
            analyticsChartInstance.destroy();
            analyticsChartInstance = null;
        }

        if (entries.length === 0) {
            return;
        }

        const labels = entries.map(m => {
            const d = m.created_at || m.date ? new Date(m.created_at || m.date) : null;
            if (!d || isNaN(d.getTime())) return "";
            return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        });

        const scores = entries.map(m => moodToScore(m.mood));

        analyticsChartInstance = new Chart(canvas, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Mood Score",
                    data: scores,
                    borderColor: "#6c63ff",
                    backgroundColor: "rgba(108, 99, 255, 0.12)",
                    borderWidth: 3,
                    pointBackgroundColor: "#6c63ff",
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    fill: true,
                    tension: 0.35
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                const scoreLabels = {
                                    5: "😄 Very Happy",
                                    4: "😊 Good",
                                    3: "😐 Neutral",
                                    2: "😔 Low",
                                    1: "😞 Very Low"
                                };
                                return scoreLabels[ctx.parsed.y] || "Score: " + ctx.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 6,
                        ticks: {
                            stepSize: 1,
                            callback: function (val) {
                                const map = { 1: "😞", 2: "😔", 3: "😐", 4: "😊", 5: "😄" };
                                return map[val] || "";
                            }
                        },
                        grid: { color: "#f3f4f6" }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } }
                    }
                }
            }
        });
    }

    // Trend Period Buttons
    document.querySelectorAll(".trend-period-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".trend-period-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentTrendPeriod = btn.dataset.period || "7d";
            if (cachedAnalyticsData) {
                renderAnalyticsTrendChart(cachedAnalyticsData.trends, currentTrendPeriod);
            }
        });
    });

    // ---- Load Mood Analytics from Backend ----
    async function loadMoodAnalytics() {
        const wrap = document.getElementById("advancedMoodAnalytics");
        if (!wrap) return;

        wrap.style.display = "block";
        loadMoodCalendar(calYear, calMonth);

        const token = getToken();

        if (token) {
            try {
                const res = await fetch(BACKEND_URL + "/api/moods/analytics", {
                    headers: { "Authorization": "Bearer " + token }
                });
                const data = await res.json();
                if (data.success) {
                    cachedAnalyticsData = data;
                    renderAnalyticsTrendChart(data.trends, currentTrendPeriod);
                    return;
                }
            } catch (err) {
                console.warn("Could not load mood analytics trend from backend, computing locally.", err);
            }
        }

        // Since calendar handles stats now, we just skip trends fallback or implement a basic one
        renderAnalyticsTrendChart([], currentTrendPeriod);
    }


    /* =====================================================
       7. JOURNAL — Backend integrated
    ===================================================== */

    const journalSection =
        document.querySelector("#journal");


    // ---- Global map to store current journal entries for toggle & edit ----
    window.journalEntriesMap = {};

    // ---- Render journal history cards ----
    function renderJournalHistory(entriesArray) {

        const historyPanel = document.getElementById("journalHistory");
        const historyList  = document.getElementById("journalHistoryList");

        if (!historyPanel || !historyList) return;

        window.journalEntriesMap = {};

        if (!entriesArray || entriesArray.length === 0) {
            historyPanel.style.display = "block";
            historyList.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:20px; font-style:italic;">No journal entries yet. Write your first reflection above!</p>`;
            return;
        }

        historyPanel.style.display = "block";

        historyList.innerHTML = entriesArray.map(function (entry) {
            const entryId = entry.id || "";
            if (entryId) {
                window.journalEntriesMap[entryId] = entry;
            }

            // Format date
            const date = entry.created_at
                ? new Date(entry.created_at).toLocaleDateString("en-IN", {
                    day:   "2-digit",
                    month: "short",
                    year:  "numeric"
                  })
                : entry.date || "";

            const isLong = entry.text && entry.text.length > 120;
            // Truncate preview to 120 characters if long
            const preview = isLong
                ? entry.text.substring(0, 120) + "..."
                : (entry.text || "");

            return `
                <div id="journal-entry-${entryId}" style="
                    background: white;
                    border-radius: 20px;
                    padding: 22px 25px;
                    margin-bottom: 16px;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.06);
                    border-left: 4px solid #6c63ff;
                    transition: all 0.3s ease;
                ">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
                        <small style="color:#6b7280; font-weight:600;">📅 ${date}</small>
                        <div style="display:flex; gap:8px;">
                            ${entryId ? `
                                <button
                                    type="button"
                                    onclick="editJournalEntry(${entryId})"
                                    style="
                                        background: #f3f4f6;
                                        border: 1px solid #d1d5db;
                                        color: #374151;
                                        padding: 4px 12px;
                                        border-radius: 20px;
                                        cursor: pointer;
                                        font-size: 13px;
                                        font-weight: 500;
                                    "
                                >✏️ Edit</button>
                                <button
                                    type="button"
                                    onclick="deleteJournalEntry(${entryId})"
                                    style="
                                        background: none;
                                        border: 1px solid #fca5a5;
                                        color: #ef4444;
                                        padding: 4px 12px;
                                        border-radius: 20px;
                                        cursor: pointer;
                                        font-size: 13px;
                                        font-weight: 500;
                                    "
                                >🗑️ Delete</button>
                            ` : ""}
                        </div>
                    </div>
                    <div id="journal-content-${entryId}">
                        <p id="journal-text-${entryId}" style="color:#374151; line-height:1.6; font-size:15px; white-space:pre-wrap; margin:0;">${escapeHTMLSafe(isLong ? preview : (entry.text || ""))}</p>
                        ${isLong ? `
                            <button
                                type="button"
                                id="journal-toggle-btn-${entryId}"
                                onclick="toggleJournalReadMore(${entryId})"
                                style="
                                    background: none;
                                    border: none;
                                    color: #6c63ff;
                                    font-weight: 600;
                                    font-size: 13px;
                                    cursor: pointer;
                                    padding: 6px 0 0 0;
                                    display: inline-block;
                                "
                            >Read More ▾</button>
                        ` : ""}
                    </div>
                </div>
            `;

        }).join("");
    }


    // ---- Toggle Read More / Show Less for full journal entry ----
    window.toggleJournalReadMore = function (entryId) {
        const entry = window.journalEntriesMap[entryId];
        if (!entry) return;

        const textEl = document.getElementById(`journal-text-${entryId}`);
        const btnEl  = document.getElementById(`journal-toggle-btn-${entryId}`);
        if (!textEl || !btnEl) return;

        if (btnEl.textContent.includes("Read More")) {
            textEl.textContent = entry.text;
            btnEl.textContent = "Show Less ▴";
        } else {
            const preview = entry.text && entry.text.length > 120
                ? entry.text.substring(0, 120) + "..."
                : (entry.text || "");
            textEl.textContent = preview;
            btnEl.textContent = "Read More ▾";
        }
    };


    // ---- Inline Edit Mode for Journal Entry ----
    window.editJournalEntry = function (entryId) {
        const entry = window.journalEntriesMap[entryId];
        if (!entry) return;

        const contentDiv = document.getElementById(`journal-content-${entryId}`);
        if (!contentDiv) return;

        contentDiv.innerHTML = `
            <div style="margin-top: 8px;">
                <textarea
                    id="journal-edit-input-${entryId}"
                    style="
                        width: 100%;
                        border: 1.5px solid #6c63ff;
                        border-radius: 12px;
                        padding: 12px;
                        font-family: inherit;
                        font-size: 15px;
                        line-height: 1.6;
                        color: #1f2937;
                        resize: vertical;
                        min-height: 100px;
                        outline: none;
                        box-sizing: border-box;
                    "
                >${escapeHTMLSafe(entry.text || "")}</textarea>
                <div style="display: flex; gap: 10px; margin-top: 10px; justify-content: flex-end;">
                    <button
                        type="button"
                        onclick="cancelEditJournal(${entryId})"
                        style="
                            background: #f3f4f6;
                            border: 1px solid #d1d5db;
                            color: #4b5563;
                            padding: 6px 16px;
                            border-radius: 10px;
                            cursor: pointer;
                            font-size: 13px;
                            font-weight: 600;
                        "
                    >Cancel</button>
                    <button
                        type="button"
                        id="journal-save-edit-btn-${entryId}"
                        onclick="saveEditJournal(${entryId})"
                        style="
                            background: #6c63ff;
                            border: none;
                            color: white;
                            padding: 6px 18px;
                            border-radius: 10px;
                            cursor: pointer;
                            font-size: 13px;
                            font-weight: 600;
                        "
                    >Save Changes</button>
                </div>
            </div>
        `;

        const textarea = document.getElementById(`journal-edit-input-${entryId}`);
        if (textarea) {
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
    };


    // ---- Cancel Edit Mode ----
    window.cancelEditJournal = function (entryId) {
        loadJournalHistory();
    };


    // ---- Save Edited Journal to Backend ----
    window.saveEditJournal = async function (entryId) {
        const textarea = document.getElementById(`journal-edit-input-${entryId}`);
        const saveBtn  = document.getElementById(`journal-save-edit-btn-${entryId}`);
        if (!textarea || !saveBtn) return;

        const newText = textarea.value.trim();
        if (!newText) {
            showMessage("❌ Journal text cannot be empty.");
            textarea.focus();
            return;
        }

        saveBtn.disabled    = true;
        saveBtn.textContent = "Saving...";

        const token = getToken();

        if (!token) {
            // LocalStorage fallback update
            const item = journals.find(j => j.id === entryId);
            if (item) {
                item.text = newText;
                saveData();
            }
            saveBtn.textContent = "Updated ✔";
            saveBtn.style.background = "#10b981";
            showMessage("📓 Journal entry updated (offline)!");
            setTimeout(async () => {
                await loadJournalHistory();
            }, 800);
            return;
        }

        try {
            const res = await fetch(`${BACKEND_URL}/api/journals/${entryId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ text: newText })
            });

            const data = await res.json();

            if (data.success) {
                saveBtn.textContent = "Updated ✔";
                saveBtn.style.background = "#10b981";
                showMessage("📓 Journal entry updated!");

                // Update local memory if present
                const item = journals.find(j => j.id === entryId);
                if (item) {
                    item.text = newText;
                    saveData();
                }

                setTimeout(async () => {
                    await loadJournalHistory();
                }, 800);
            } else {
                saveBtn.disabled    = false;
                saveBtn.textContent = "Error — Try Again";
                saveBtn.style.background = "#ef4444";
                showMessage("❌ Could not update: " + data.message);
            }
        } catch (err) {
            console.error("Failed to update journal entry", err);
            saveBtn.disabled    = false;
            saveBtn.textContent = "Error — Try Again";
            saveBtn.style.background = "#ef4444";
            showMessage("❌ Network error updating journal.");
        }
    };


    // ---- Delete a journal entry by ID ----
    window.deleteJournalEntry = async function (entryId) {

        if (!confirm("Delete this journal entry? This cannot be undone.")) return;

        const token = getToken();

        if (!token) {
            // localStorage fallback deletion
            journals = journals.filter(j => j.id !== entryId);
            saveData();
            renderJournalHistory(journals.filter(j => j.email === currentUser.email));
            updateDashboard();
            return;
        }

        try {

            const res = await fetch(BACKEND_URL + "/api/journals/" + entryId, {
                method:  "DELETE",
                headers: { "Authorization": "Bearer " + token }
            });

            const data = await res.json();

            if (data.success) {

                // Remove the card from the DOM immediately
                const card = document.getElementById("journal-entry-" + entryId);
                if (card) card.remove();

                // Also remove from local journals array
                journals = journals.filter(j => j.id !== entryId);
                saveData();

                updateDashboard();

                showMessage("\uD83D\uDDD1\uFE0F Journal entry deleted.");

                // Re-render in case list is now empty
                await loadJournalHistory();

            } else {

                showMessage("\u274c Could not delete: " + data.message);

            }

        } catch (err) {

            console.warn("Backend not reachable, deleting from localStorage.", err);

            journals = journals.filter(j => j.id !== entryId);
            saveData();

            const card = document.getElementById("journal-entry-" + entryId);
            if (card) card.remove();

            updateDashboard();

        }
    };


    // ---- Load journal history from backend ----
    async function loadJournalHistory() {

        const token = getToken();

        if (!token || !currentUser) return;

        try {

            const res = await fetch(BACKEND_URL + "/api/journals", {
                headers: { "Authorization": "Bearer " + token }
            });

            const data = await res.json();

            if (data.success) {

                // Sync to localStorage for dashboard count
                journals = data.journals.map(function (j) {
                    return {
                        id:    j.id,
                        email: currentUser.email,
                        text:  j.text,
                        date:  j.created_at
                    };
                });

                saveData();

                renderJournalHistory(data.journals);

                updateDashboard();

            }

        } catch (err) {

            console.warn("Could not load journal history from backend.", err);

            // Fall back to localStorage entries
            const localEntries = journals.filter(
                j => j.email === (currentUser ? currentUser.email : "")
            );

            renderJournalHistory(localEntries);

        }
    }


    // ---- Core: save journal (calls backend, falls back to localStorage) ----
    async function saveJournal(text) {

        const token = getToken();

        if (!token) {

            // localStorage-only fallback
            const journal = {
                id:    Date.now(),
                email: currentUser.email,
                text:  text,
                date:  getDate()
            };

            journals.push(journal);

            currentUser.journalCount = (currentUser.journalCount || 0) + 1;
            users = users.map(u => u.email === currentUser.email ? currentUser : u);

            saveData();

            updateDashboard();

            renderJournalHistory(
                journals.filter(j => j.email === currentUser.email)
            );

            if (typeof loadDailyRecommendations === "function") {
                loadDailyRecommendations();
            }

            showMessage("📓 Your reflection has been saved! (offline)");
            showAIReflection(text);

            return true;
        }

        try {

            const res = await fetch(BACKEND_URL + "/api/journals", {
                method:  "POST",
                headers: {
                    "Content-Type":  "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ text })
            });

            const data = await res.json();

            if (data.success) {

                // Also save to localStorage for offline fallback
                const journal = {
                    id:    data.journal_id || Date.now(),
                    email: currentUser.email,
                    text:  text,
                    date:  data.created_at || getDate()
                };
                journals.push(journal);

                // Update localStorage count
                currentUser.journalCount = (currentUser.journalCount || 0) + 1;
                users = users.map(u => u.email === currentUser.email ? currentUser : u);
                saveData();

                updateDashboard();

                // Refresh history list from DB & Daily Recommendations immediately
                loadJournalHistory();
                loadAchievements(true);
                if (typeof loadDailyRecommendations === "function") {
                    await loadDailyRecommendations();
                }

                showMessage("📓 Your reflection has been saved!");
                showAIReflection(text);
                
                return true;

            } else {

                showMessage("❌ Could not save journal: " + data.message);
                
                return false;

            }

        } catch (err) {

            console.warn("Backend not reachable, saving journal to localStorage.", err);

            const journal = {
                id:    Date.now(),
                email: currentUser.email,
                text:  text,
                date:  getDate()
            };

            journals.push(journal);

            currentUser.journalCount = (currentUser.journalCount || 0) + 1;
            users = users.map(u => u.email === currentUser.email ? currentUser : u);

            saveData();

            updateDashboard();

            renderJournalHistory(
                journals.filter(j => j.email === currentUser.email)
            );

            if (typeof loadDailyRecommendations === "function") {
                loadDailyRecommendations();
            }

            showMessage("📓 Reflection saved (offline)!");
            showAIReflection(text);

            return true;
        }
    }


    // ---- Wire up the Save Reflection button ----
    if (journalSection) {

        const textarea   = journalSection.querySelector("textarea");
        const saveButton = journalSection.querySelector(".journal-box > button");


        if (saveButton) {

            saveButton.addEventListener("click", async function () {

                if (!currentUser) {

                    showMessage(
                        "Please login before writing a journal."
                    );

                    document.querySelector("#login")
                        ?.scrollIntoView({ behavior: "smooth" });

                    return;
                }


                const text = textarea.value.trim();


                if (!text) {

                    showMessage(
                        "Please write something first."
                    );

                    textarea.focus();

                    return;
                }


                saveButton.disabled    = true;
                saveButton.textContent = "Saving...";

                const success = await saveJournal(text);

                if (success) {
                    textarea.value = "";
                    saveButton.textContent = "Saved \u2714";
                } else {
                    saveButton.textContent = "Error \u2014 Try Again";
                }

                setTimeout(() => {
                    saveButton.disabled    = false;
                    saveButton.textContent = "Save Reflection";
                }, 2000);

            });
        }
    }



    /* =====================================================
       8. AI JOURNAL INSIGHT
    ===================================================== */

    // ---- showAIReflection(text, targetSelector?) ----
    // Calls backend POST /api/journals/analyze
    // If AI service is unavailable / not configured, renders a clean informative banner.
    async function showAIReflection(text, targetSelector) {

        const selector = targetSelector || "#journal .reflection-box";
        const reflectionBox = document.querySelector(selector);

        if (!reflectionBox) return;

        reflectionBox.style.display = "block";
        reflectionBox.innerHTML = `
            <h3>✨ AI Reflection Insight</h3>
            <p style="color:var(--text-muted); margin-top:8px; font-size:14px;">Analyzing reflection with AI service...</p>
        `;

        const token = getToken();

        if (!token) {
            const unavailableHtml = `
                <div style="background:#fef2f2; border:1px solid #fecdd3; border-radius:12px; padding:14px 18px; margin-top:12px;">
                    <p style="color: #b91c1c; font-weight:600; margin:0 0 6px 0; font-size:14px;">
                        ⚠️ AI Journal Analysis is currently unavailable.
                    </p>
                    <p style="color: #4b5563; font-size: 13px; line-height: 1.5; margin:0;">
                        Please log in to use authenticated AI reflection features.
                    </p>
                </div>
            `;
            if (selector === "#reflectionAIBox") {
                const contentEl = document.getElementById("reflectionAIContent");
                if (contentEl) contentEl.innerHTML = unavailableHtml;
            } else {
                reflectionBox.innerHTML = `<h3>✨ AI Reflection Insight</h3>${unavailableHtml}`;
            }
            return;
        }

        try {
            const res = await fetch(`${BACKEND_URL}/api/journals/analyze`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ text })
            });

            const data = await res.json();

            let displayHtml = "";

            if (data.success && data.available && data.analysis) {
                // If real AI analysis is returned
                displayHtml = `
                    <div style="margin-top:12px;">
                        <p style="font-size:15px; color:#1f2937; margin-bottom:8px;"><strong>Overall Sentiment:</strong> ${escapeHTMLSafe(data.analysis.sentiment || "Reflective")}</p>
                        <p style="color:#4b5563; line-height:1.6; font-size:14px;">${escapeHTMLSafe(data.analysis.insight || "")}</p>
                    </div>
                `;
            } else {
                // Service not configured / unavailable
                displayHtml = `
                    <div style="background:#fef2f2; border:1px solid #fecdd3; border-radius:12px; padding:14px 18px; margin-top:12px;">
                        <p style="color: #b91c1c; font-weight:600; margin:0 0 6px 0; font-size:14px;">
                            ⚠️ AI Journal Analysis is currently unavailable.
                        </p>
                        <p style="color: #4b5563; font-size: 13px; line-height: 1.5; margin:0;">
                            ${escapeHTMLSafe(data.message || "AI sentiment service is not configured in the backend environment.")}
                        </p>
                    </div>
                `;
            }

            if (selector === "#reflectionAIBox") {
                const contentEl = document.getElementById("reflectionAIContent");
                if (contentEl) contentEl.innerHTML = displayHtml;
            } else {
                reflectionBox.innerHTML = `<h3>✨ AI Reflection Insight</h3>${displayHtml}`;
            }

        } catch (err) {
            console.error("AI Reflection Analysis fetch error:", err);
            const errHtml = `
                <div style="background:#fef2f2; border:1px solid #fecdd3; border-radius:12px; padding:14px 18px; margin-top:12px;">
                    <p style="color: #b91c1c; font-weight:600; margin:0 0 6px 0; font-size:14px;">
                        ⚠️ AI Journal Analysis is currently unavailable.
                    </p>
                    <p style="color: #4b5563; font-size: 13px; line-height: 1.5; margin:0;">
                        Could not reach the backend analysis service.
                    </p>
                </div>
            `;
            if (selector === "#reflectionAIBox") {
                const contentEl = document.getElementById("reflectionAIContent");
                if (contentEl) contentEl.innerHTML = errHtml;
            } else {
                reflectionBox.innerHTML = `<h3>✨ AI Reflection Insight</h3>${errHtml}`;
            }
        }
    }



    /* =====================================================
       9. AI CHATBOT — Full implementation
       - Crisis detection with emergency resources
       - Real AI integration with graceful service-unavailable fallback
       - Quick prompt chips support
       - Typing indicator with animated dots
       - Scrollable message area
       - Conversation persistence (backend + localStorage fallback)
       - Clear Chat with backend delete
       - All user content escaped before rendering
    ===================================================== */

    // ---- DOM references ----
    const chatMessagesEl    = document.getElementById("chatMessages");
    const chatInputEl       = document.getElementById("chatInput");
    const chatSendBtnEl     = document.getElementById("chatSendBtn");
    const clearChatBtnEl    = document.getElementById("clearChatBtn");
    const typingIndicatorEl = document.getElementById("typingIndicator");

    // ---- localStorage key (per-user offline fallback) ----
    function chatStorageKey() {
        return currentUser ? "innerVoiceChat_" + currentUser.email : null;
    }

    // ---- Helper to detect crisis content safely ----
    function isCrisisContent(text) {
        if (!text || typeof text !== 'string') return false;
        const lower = text.toLowerCase();
        return lower.includes("112") || lower.includes("tele-manas") || lower.includes("14416") || lower.includes("kiran mental health") || lower.includes("1800-599-0019");
    }

    // ---- Scroll chat messages to bottom ----
    function scrollChatToBottom() {
        if (chatMessagesEl) {
            chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        }
    }

    // ---- Update welcome/empty state visibility ----
    function updateChatWelcome() {
        const welcome = document.getElementById("chatWelcome");
        if (!welcome || !chatMessagesEl) return;
        const hasMessages = chatMessagesEl.querySelectorAll(".message").length > 0;
        welcome.style.display = hasMessages ? "none" : "block";
    }

    // ---- Show/hide typing indicator ----
    function showTypingIndicator() {
        if (typingIndicatorEl) typingIndicatorEl.style.display = "flex";
        scrollChatToBottom();
    }
    function hideTypingIndicator() {
        if (typingIndicatorEl) typingIndicatorEl.style.display = "none";
    }

    // ---- Format timestamp ----
    function formatChatTime(dateStr) {
        try {
            const d = dateStr ? new Date(dateStr) : new Date();
            return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        } catch (e) { return ""; }
    }

    // ---- Render one message bubble ----
    function renderChatMessage(role, content, timestamp, isCrisis) {
        if (!chatMessagesEl) return;
        const div       = document.createElement("div");
        div.className   = "message " + (isCrisis ? "crisis" : role);
        const label     = role === "user" ? "You" : "INNERVOICE AI";
        const timeStr   = formatChatTime(timestamp);

        const safeFormatted = escapeHTMLSafe(content).replace(/\n/g, "<br>");

        let crisisActions = "";
        if (isCrisis) {
            crisisActions = `
                <div style="margin-top:12px; display:flex; flex-wrap:wrap; gap:8px;">
                    <a href="tel:112" style="background:#e11d48; color:white; font-size:12px; font-weight:700; padding:6px 14px; border-radius:10px; text-decoration:none; display:inline-flex; align-items:center; gap:5px; box-shadow:0 2px 8px rgba(225,29,72,0.3);">📞 Call 112</a>
                    <a href="tel:14416" style="background:#2563eb; color:white; font-size:12px; font-weight:700; padding:6px 14px; border-radius:10px; text-decoration:none; display:inline-flex; align-items:center; gap:5px;">📞 Tele-MANAS (14416)</a>
                    <button type="button" onclick="window.openEmergencyModal()" style="background:#fee2e2; color:#b91c1c; border:1px solid #fecaca; font-size:12px; font-weight:700; padding:6px 14px; border-radius:10px; cursor:pointer; width:auto; margin:0;">🆘 Open Emergency Help</button>
                </div>
            `;
        }

        // Both label and content escaped — prevents XSS
        div.innerHTML   = `<strong>${escapeHTMLSafe(label)}:</strong><br>${safeFormatted}${crisisActions}<span class="message-meta">${timeStr}</span>`;
        chatMessagesEl.appendChild(div);
        updateChatWelcome();
        scrollChatToBottom();
    }

    // ---- Load chat history (backend → localStorage fallback) ----
    window.loadChatHistory = async function () {
        const messagesEl = document.getElementById("chatMessages");
        if (!messagesEl) return;

        // Reset message area but keep welcome element
        messagesEl.innerHTML = "";
        const welcomeDiv = document.createElement("div");
        welcomeDiv.id        = "chatWelcome";
        welcomeDiv.className = "chat-welcome";
        welcomeDiv.innerHTML = `<div style="font-size:42px; margin-bottom:12px;">🌿</div><p><strong>Hi there! I'm your INNERVOICE AI companion.</strong></p><p style="margin-top:8px; color:#9ca3af; font-size:14px;">Type a message below or click a quick prompt to start our conversation. Everything you share stays private.</p>`;
        messagesEl.appendChild(welcomeDiv);

        const token = getToken();

        if (!token || !currentUser) {
            // Offline fallback
            const key = chatStorageKey();
            if (key) {
                try {
                    const stored = JSON.parse(localStorage.getItem(key) || "[]");
                    stored.forEach(function (msg) {
                        const isCrisis = msg.role === "ai" && isCrisisContent(msg.content);
                        renderChatMessage(msg.role, msg.content, msg.created_at, isCrisis);
                    });
                } catch (e) { /* empty */ }
            }
            updateChatWelcome();
            scrollChatToBottom();
            return;
        }

        try {
            const res  = await fetch(BACKEND_URL + "/api/chat/history", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.messages)) {
                data.messages.forEach(function (msg) {
                    const isCrisis = msg.role === "ai" && isCrisisContent(msg.content);
                    renderChatMessage(msg.role, msg.content, msg.created_at, isCrisis);
                });
                // Sync to localStorage cache
                const key = chatStorageKey();
                if (key) {
                    try { localStorage.setItem(key, JSON.stringify(data.messages)); } catch (e) { /* non-fatal */ }
                }
            }
        } catch (err) {
            console.warn("Could not load chat history from backend, using localStorage.", err);
            const key = chatStorageKey();
            if (key) {
                try {
                    const stored = JSON.parse(localStorage.getItem(key) || "[]");
                    stored.forEach(function (msg) {
                        const isCrisis = msg.role === "ai" && isCrisisContent(msg.content);
                        renderChatMessage(msg.role, msg.content, msg.created_at, isCrisis);
                    });
                } catch (e) { /* empty */ }
            }
        }
        updateChatWelcome();
        scrollChatToBottom();
    };

    // ---- Clear chat (DOM + backend + localStorage) ----
    async function clearChatHistory() {
        if (!confirm("Clear your entire conversation? This cannot be undone.")) return;
        const messagesEl = document.getElementById("chatMessages");
        if (messagesEl) {
            messagesEl.innerHTML = "";
            const w = document.createElement("div");
            w.id        = "chatWelcome";
            w.className = "chat-welcome";
            w.innerHTML = `<div style="font-size:42px; margin-bottom:12px;">🌿</div><p><strong>Hi there! I'm your INNERVOICE AI companion.</strong></p><p style="margin-top:8px; color:#9ca3af; font-size:14px;">Type a message below or click a quick prompt to start our conversation.</p>`;
            messagesEl.appendChild(w);
        }
        const key = chatStorageKey();
        if (key) { try { localStorage.removeItem(key); } catch (e) { /* non-fatal */ } }
        const token = getToken();
        if (token) {
            try {
                await fetch(BACKEND_URL + "/api/chat/history", {
                    method:  "DELETE",
                    headers: { "Authorization": "Bearer " + token }
                });
            } catch (err) { console.warn("Could not clear chat from backend.", err); }
        }
        showMessage("💬 Conversation cleared.");
    }

    // ---- Quick Prompt Handler ----
    function useQuickPrompt(promptText) {
        if (!promptText) return;
        const inputEl = document.getElementById("chatInput");
        if (inputEl) {
            if (inputEl.disabled) return;
            inputEl.value = promptText;
            sendChatMessage();
        }
    }

    // ---- Main send handler ----
    async function sendChatMessage() {
        const inputEl   = document.getElementById("chatInput");
        const sendBtnEl = document.getElementById("chatSendBtn");
        const messagesEl = document.getElementById("chatMessages");
        if (!inputEl || !messagesEl) return;
        if (inputEl.disabled) return; // Prevent duplicate execution

        const message = inputEl.value.trim();
        if (!message) {
            inputEl.focus();
            return;
        }

        // Clear + disable input immediately to prevent duplicate requests
        inputEl.value    = "";
        inputEl.disabled = true;
        if (sendBtnEl) { sendBtnEl.disabled = true; sendBtnEl.textContent = "..."; }

        // Render user message
        renderChatMessage("user", message, new Date().toISOString(), false);

        // Show typing indicator
        showTypingIndicator();

        const token = getToken();
        if (!token) {
            hideTypingIndicator();
            renderChatMessage("ai", "Please log in to chat with the AI companion.", new Date().toISOString(), false);
            inputEl.disabled = false;
            if (sendBtnEl) { sendBtnEl.disabled = false; sendBtnEl.textContent = "Send →"; }
            inputEl.focus();
            return;
        }

        try {
            const res = await fetch(BACKEND_URL + "/api/chat/message", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body: JSON.stringify({ message })
            });
            const data = await res.json();
            hideTypingIndicator();
            
            if (data.success) {
                const replyText = data.reply || (data.available === false ? "AI service is currently unavailable." : "I'm here to listen.");
                const isCrisis = !!data.isCrisis || isCrisisContent(replyText);
                renderChatMessage("ai", replyText, new Date().toISOString(), isCrisis);
            } else {
                const errMsg = data.message || "AI service is currently unavailable.";
                renderChatMessage("ai", errMsg, new Date().toISOString(), false);
            }
        } catch (err) {
            console.error("Error communicating with AI Assistant:", err);
            hideTypingIndicator();
            renderChatMessage("ai", "Unable to connect to the backend server. Please ensure the backend server is running. 🌿", new Date().toISOString(), false);
        } finally {
            inputEl.disabled = false;
            if (sendBtnEl) { sendBtnEl.disabled = false; sendBtnEl.textContent = "Send →"; }
            inputEl.focus();
            scrollChatToBottom();
        }
    }

    // Expose global functions
    window.useQuickPrompt = useQuickPrompt;
    window.sendChatMessage = sendChatMessage;
    window.clearChat = clearChatHistory;
    window.clearChatHistory = clearChatHistory;

    // ---- Wire up events ----
    if (chatSendBtnEl) {
        chatSendBtnEl.addEventListener("click", sendChatMessage);
    }
    if (chatInputEl) {
        chatInputEl.addEventListener("keypress", function (event) {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendChatMessage();
            }
        });
    }
    if (clearChatBtnEl) {
        clearChatBtnEl.addEventListener("click", clearChatHistory);
    }



    /* =====================================================
       10. SELF REFLECTION — Backend integrated
    ===================================================== */

    const reflectionSection =
        document.querySelector("#reflection");


    // ---- Render reflection history cards ----
    function renderReflectionHistory(entriesArray) {

        const historyPanel = document.getElementById("reflectionHistory");
        const historyList  = document.getElementById("reflectionHistoryList");

        if (!historyPanel || !historyList) return;

        if (!entriesArray || entriesArray.length === 0) {
            historyPanel.style.display = "none";
            return;
        }

        historyPanel.style.display = "block";

        historyList.innerHTML = entriesArray.map(function (entry) {

            const rawDate = entry.created_at || entry.date || "";

            let dateStr = "";
            if (rawDate) {
                try {
                    dateStr = new Date(rawDate).toLocaleDateString("en-IN", {
                        day:   "2-digit",
                        month: "short",
                        year:  "numeric"
                    });
                } catch (e) {
                    dateStr = String(rawDate).split("T")[0];
                }
            }

            const entryId = entry.id || "";

            // Truncate answer preview to 140 chars
            const preview = entry.answer && entry.answer.length > 140
                ? entry.answer.substring(0, 140) + "..."
                : (entry.answer || "");

            // Truncate question display
            const questionDisplay = entry.question
                ? escapeHTMLSafe(entry.question.replace(/"/g, ""))
                : "Reflection";

            return `
                <div id="reflection-entry-${entryId}" style="
                    background: white;
                    border-radius: 20px;
                    padding: 22px 25px;
                    margin-bottom: 16px;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.06);
                    border-left: 4px solid #9c8fef;
                ">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <small style="color:#6b7280; font-weight:600;">📅 ${dateStr}</small>
                        ${entryId ? `<button
                            onclick="deleteReflectionEntry(${entryId})"
                            style="
                                background: none;
                                border: 1px solid #fca5a5;
                                color: #ef4444;
                                padding: 4px 12px;
                                border-radius: 20px;
                                cursor: pointer;
                                font-size: 13px;
                                width: auto;
                                margin: 0;
                            "
                        >Delete</button>` : ""}
                    </div>
                    <p style="color:#6c63ff; font-size:13px; font-weight:600; margin-bottom:6px;">${questionDisplay}</p>
                    <p style="color:#374151; line-height:1.6; font-size:15px;">${escapeHTMLSafe(preview)}</p>
                </div>
            `;

        }).join("");
    }


    // ---- Delete a reflection entry ----
    window.deleteReflectionEntry = async function (entryId) {

        if (!confirm("Delete this reflection? This cannot be undone.")) return;

        const token = getToken();

        if (!token) {
            reflections = reflections.filter(r => r.id !== entryId);
            saveData();
            renderReflectionHistory(reflections.filter(r => r.email === currentUser.email));
            return;
        }

        try {

            const res = await fetch(BACKEND_URL + "/api/reflections/" + entryId, {
                method:  "DELETE",
                headers: { "Authorization": "Bearer " + token }
            });

            const data = await res.json();

            if (data.success) {

                const card = document.getElementById("reflection-entry-" + entryId);
                if (card) card.remove();

                reflections = reflections.filter(r => r.id !== entryId);
                saveData();

                showMessage("\uD83D\uDDD1\uFE0F Reflection deleted.");

                await loadReflectionHistory();

            } else {

                showMessage("\u274c Could not delete: " + data.message);

            }

        } catch (err) {

            console.warn("Backend not reachable, deleting from localStorage.", err);

            reflections = reflections.filter(r => r.id !== entryId);
            saveData();

            const card = document.getElementById("reflection-entry-" + entryId);
            if (card) card.remove();

        }
    };


    // ---- Load reflection history from backend ----
    async function loadReflectionHistory() {

        const token = getToken();

        if (!token || !currentUser) return;

        try {

            const res = await fetch(BACKEND_URL + "/api/reflections", {
                headers: { "Authorization": "Bearer " + token }
            });

            const data = await res.json();

            if (data.success) {

                // Sync to localStorage
                reflections = data.reflections.map(function (r) {
                    return {
                        id:       r.id,
                        email:    currentUser.email,
                        question: r.question,
                        answer:   r.answer,
                        date:     r.created_at
                    };
                });

                saveData();

                renderReflectionHistory(data.reflections);

            }

        } catch (err) {

            console.warn("Could not load reflections from backend.", err);

            const local = reflections.filter(
                r => r.email === (currentUser ? currentUser.email : "")
            );

            renderReflectionHistory(local);

        }
    }


    // ---- Core: save reflection (backend + localStorage fallback) ----
    async function saveReflection(question, answer) {

        const token = getToken();

        if (!token) {

            // localStorage-only fallback
            const reflection = {
                id:       Date.now(),
                email:    currentUser.email,
                question: question,
                answer:   answer,
                date:     getDate()
            };

            reflections.push(reflection);
            saveData();

            renderReflectionHistory(
                reflections.filter(r => r.email === currentUser.email)
            );

            if (typeof loadDailyRecommendations === "function") {
                loadDailyRecommendations();
            }

            showMessage("🌱 Reflection saved! (offline)");
            showAIReflection(answer, "#reflectionAIBox");

            return;
        }

        try {

            const res = await fetch(BACKEND_URL + "/api/reflections", {
                method:  "POST",
                headers: {
                    "Content-Type":  "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ question, answer })
            });

            const data = await res.json();

            if (data.success) {

                // Sync to localStorage
                const reflection = {
                    id:       data.reflection_id || Date.now(),
                    email:    currentUser.email,
                    question: question,
                    answer:   answer,
                    date:     data.created_at || getDate()
                };

                reflections.push(reflection);
                saveData();

                // Refresh history from DB & Daily Recommendations immediately
                loadReflectionHistory();
                loadAchievements(true);
                if (typeof loadDailyRecommendations === "function") {
                    await loadDailyRecommendations();
                }

                showMessage("🌱 Reflection saved!");
                showAIReflection(answer, "#reflectionAIBox");

            } else {

                showMessage("❌ Could not save: " + data.message);

            }

        } catch (err) {

            console.warn("Backend not reachable, saving reflection to localStorage.", err);

            const reflection = {
                id:       Date.now(),
                email:    currentUser.email,
                question: question,
                answer:   answer,
                date:     getDate()
            };

            reflections.push(reflection);
            saveData();

            renderReflectionHistory(
                reflections.filter(r => r.email === currentUser.email)
            );

            if (typeof loadDailyRecommendations === "function") {
                loadDailyRecommendations();
            }

            showMessage("🌱 Reflection saved (offline)!");
            showAIReflection(answer, "#reflectionAIBox");

        }
    }


    // ---- Wire up the Save & Reflect button ----
    if (reflectionSection) {

        const saveReflectionButton =
            reflectionSection.querySelector("button");

        const reflectionTextarea =
            document.querySelector("#reflectionAnswer");


        if (saveReflectionButton) {

            saveReflectionButton.addEventListener(
                "click",
                async function () {

                    if (!currentUser) {

                        showMessage("Please login first.");

                        document.querySelector("#login")
                            ?.scrollIntoView({ behavior: "smooth" });

                        return;

                    }


                    const answer = reflectionTextarea
                        ? reflectionTextarea.value.trim()
                        : "";


                    if (!answer) {

                        showMessage(
                            "Please write your reflection before saving."
                        );

                        reflectionTextarea?.focus();

                        return;

                    }


                    const question =
                        reflectionSection
                            .querySelector(".question h3")
                            ?.textContent.trim() || "";


                    saveReflectionButton.disabled    = true;
                    saveReflectionButton.textContent = "Saving...";

                    await saveReflection(question, answer);

                    if (reflectionTextarea) reflectionTextarea.value = "";

                    saveReflectionButton.disabled    = false;
                    saveReflectionButton.textContent = "Save & Reflect";

                }
            );

        }

    }




    /* =====================================================
    /* =====================================================
       11. DAILY CHALLENGES & WELLNESS GOALS — Backend integrated
    ===================================================== */

    const goalsSection = document.querySelector("#goals");
    let currentGoalFilter = 'all';
    let currentDailyChallenges = [];
    let currentChallengeFilter = 'all';

    // Tab switching: challenges, goals, history
    window.switchChallengeSectionTab = function(tab) {
        const tabChallengesBtn = document.getElementById("tabChallengesBtn");
        const tabGoalsBtn = document.getElementById("tabGoalsBtn");
        const tabHistoryBtn = document.getElementById("tabHistoryBtn");

        const panelChallenges = document.getElementById("panelChallenges");
        const panelGoals = document.getElementById("panelGoals");
        const panelHistory = document.getElementById("panelHistory");

        if (tabChallengesBtn) tabChallengesBtn.classList.toggle("active", tab === 'challenges');
        if (tabGoalsBtn) tabGoalsBtn.classList.toggle("active", tab === 'goals');
        if (tabHistoryBtn) tabHistoryBtn.classList.toggle("active", tab === 'history');

        if (panelChallenges) panelChallenges.style.display = tab === 'challenges' ? 'block' : 'none';
        if (panelGoals) panelGoals.style.display = tab === 'goals' ? 'block' : 'none';
        if (panelHistory) panelHistory.style.display = tab === 'history' ? 'block' : 'none';

        if (tab === 'challenges') {
            loadDailyChallenges();
        } else if (tab === 'goals') {
            loadGoalHistory();
        } else if (tab === 'history') {
            loadChallengeHistory();
        }
    };

    window.openCreateChallengeModal = function () {
        const modal = document.getElementById("goalModal");
        const titleEl = document.getElementById("goalModalTitle");
        const typeSelect = document.getElementById("goalItemType");
        if (titleEl) titleEl.textContent = "🔥 Create Custom Daily Challenge";
        if (typeSelect) {
            typeSelect.value = "challenge";
            onGoalItemTypeChange("challenge");
        }
        if (modal) modal.style.display = "flex";
    };

    window.openGoalModal = function () {
        const modal = document.getElementById("goalModal");
        const titleEl = document.getElementById("goalModalTitle");
        const typeSelect = document.getElementById("goalItemType");
        if (titleEl) titleEl.textContent = "🎯 Create Long-Term Wellness Goal";
        if (typeSelect) {
            typeSelect.value = "goal";
            onGoalItemTypeChange("goal");
        }
        if (modal) modal.style.display = "flex";
    };

    window.closeGoalModal = function () {
        const modal = document.getElementById("goalModal");
        if (modal) modal.style.display = "none";
    };

    window.onGoalItemTypeChange = function(type) {
        const dueDateGroup = document.getElementById("goalDueDateGroup");
        const trackingModeGroup = document.getElementById("goalTrackingModeGroup");
        const priorityLabel = document.querySelector("#createGoalForm label[for='goalPriority']") || null;

        if (type === "challenge") {
            if (dueDateGroup) dueDateGroup.style.display = "none";
            if (trackingModeGroup) trackingModeGroup.style.display = "none";
        } else {
            if (dueDateGroup) dueDateGroup.style.display = "block";
            if (trackingModeGroup) trackingModeGroup.style.display = "block";
        }
    };

    // ----------------------------------------------------
    // DAILY CHALLENGES CLIENT LOGIC
    // ----------------------------------------------------

    window.loadDailyChallenges = async function () {
        const token = getToken();
        if (!token || !currentUser) return;

        const listEl = document.getElementById("dailyChallengesList");
        if (listEl && currentDailyChallenges.length === 0) {
            listEl.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px; color:#6b7280;">Loading today's challenges...</div>`;
        }

        try {
            const res = await fetch(BACKEND_URL + "/api/goals/challenges", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();

            if (data.success) {
                currentDailyChallenges = data.challenges || [];

                // Format today's date
                const dateEl = document.getElementById("challengeTodayDate");
                if (dateEl && data.date) {
                    const d = new Date(data.date + "T00:00:00");
                    const dateFormatted = d.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
                    dateEl.textContent = dateFormatted;
                }

                // Update Stats
                const stats = data.stats || {};
                const compStatEl = document.getElementById("challengeCompletedStat");
                const xpStatEl = document.getElementById("challengeXpEarnedStat");
                const streakEl = document.getElementById("challengeStreakBadge");

                if (compStatEl) compStatEl.textContent = `${stats.completed || 0} / ${stats.total || currentDailyChallenges.length}`;
                if (xpStatEl) xpStatEl.textContent = `+${stats.xpEarnedToday || 0} XP`;
                if (streakEl) streakEl.textContent = `${stats.streak || 0} Days`;

                // Render challenges
                renderDailyChallenges(currentDailyChallenges);

                // Sync global user stats if returned
                if (stats.userXp !== undefined && currentUser) {
                    currentUser.xp = stats.userXp;
                    if (stats.userLevel) currentUser.level = stats.userLevel;
                    if (stats.streak !== undefined) currentUser.streak = stats.streak;
                    updateProfile();
                    updateDashboard();
                }
            }
        } catch (err) {
            console.error("Error loading daily challenges:", err);
            if (listEl) {
                listEl.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px; color:#ef4444;">⚠️ Could not load challenges. Please refresh or try again.</div>`;
            }
        }
    };

    window.filterChallengeCategory = function(cat) {
        currentChallengeFilter = cat;
        document.querySelectorAll(".music-filter-chips [data-challenge-filter]").forEach(chip => {
            chip.classList.toggle("active", chip.dataset.challengeFilter === cat);
        });
        renderDailyChallenges(currentDailyChallenges);
    };

    window.renderDailyChallenges = function(challengesArray) {
        const listEl = document.getElementById("dailyChallengesList");
        const emptyEl = document.getElementById("dailyChallengesEmpty");
        if (!listEl) return;

        let filtered = challengesArray || [];
        if (currentChallengeFilter === "completed") {
            filtered = filtered.filter(c => c.status === "completed");
        } else if (currentChallengeFilter !== "all") {
            filtered = filtered.filter(c => (c.category || "").toLowerCase() === currentChallengeFilter.toLowerCase());
        }

        if (filtered.length === 0) {
            listEl.innerHTML = "";
            if (emptyEl) emptyEl.style.display = "block";
            return;
        }

        if (emptyEl) emptyEl.style.display = "none";

        listEl.innerHTML = filtered.map(c => {
            const isCompleted = c.status === "completed";
            const isInProgress = c.status === "in_progress";
            const catClass = (c.category || "mindfulness").toLowerCase().replace(/[^a-z0-9]/g, "-");
            const diffClass = (c.difficulty || "easy").toLowerCase();
            const cardClass = isCompleted ? "completed" : isInProgress ? "in-progress" : "";

            let actionButtonHtml = "";
            if (isCompleted) {
                actionButtonHtml = `<button type="button" class="challenge-btn done" disabled>✅ Completed (+${c.xp_reward || 20} XP)</button>`;
            } else if (isInProgress) {
                actionButtonHtml = `
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <span style="font-size:11px; font-weight:700; color:#2563eb; background:#dbeafe; padding:4px 8px; border-radius:8px;">⏳ In Progress</span>
                        <button type="button" class="challenge-btn complete" onclick="window.completeDailyChallenge(${c.id})">✓ Complete (+${c.xp_reward || 20} XP)</button>
                    </div>
                `;
            } else {
                actionButtonHtml = `
                    <button type="button" class="challenge-btn start" onclick="window.startDailyChallenge(${c.id})">▶ Start Challenge</button>
                `;
            }

            const isCustom = c.challenge_code && c.challenge_code.startsWith("custom_");

            return `
                <div class="challenge-card ${cardClass}" id="challenge-card-${c.id}">
                    <div>
                        <div class="challenge-card-header">
                            <div class="challenge-badge-group">
                                <span class="challenge-cat-badge ${catClass}">${escapeHTMLSafe(c.category || 'Mindfulness')}</span>
                                <span class="challenge-diff-badge ${diffClass}">${escapeHTMLSafe(c.difficulty || 'Easy')}</span>
                            </div>
                            <span class="challenge-xp-pill">💎 +${c.xp_reward || 20} XP</span>
                        </div>

                        <h4 class="challenge-title">${escapeHTMLSafe(c.title)}</h4>
                        <p class="challenge-desc">${escapeHTMLSafe(c.description || '')}</p>
                    </div>

                    <div class="challenge-footer">
                        <div>
                            <span style="font-size:12px; font-weight:600; color:#6b7280;">Progress: ${isCompleted ? c.target_value : c.current_progress} / ${c.target_value}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            ${actionButtonHtml}
                            ${isCustom ? `
                                <button type="button" onclick="window.deleteChallenge(${c.id})" style="background:transparent; border:none; color:#9ca3af; cursor:pointer; font-size:14px;" title="Delete Custom Challenge">🗑️</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    window.startDailyChallenge = async function(challengeId) {
        const token = getToken();
        if (!token) { showMessage("Please login first."); return; }

        try {
            const res = await fetch(BACKEND_URL + `/api/goals/challenges/${challengeId}/start`, {
                method: "POST",
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success) {
                showMessage("🚀 Challenge started! Give it your best focus.");
                await loadDailyChallenges();
            } else {
                showMessage("❌ " + (data.message || "Could not start challenge"));
            }
        } catch (err) {
            console.error(err);
            showMessage("❌ Connection error.");
        }
    };

    window.completeDailyChallenge = async function(challengeId) {
        const token = getToken();
        if (!token) { showMessage("Please login first."); return; }

        try {
            const res = await fetch(BACKEND_URL + `/api/goals/challenges/${challengeId}/complete`, {
                method: "POST",
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();

            if (data.success) {
                if (data.alreadyCompleted) {
                    showMessage("ℹ️ Challenge is already completed!");
                } else {
                    showMessage(data.message || `🎉 Challenge completed! +${data.xpAwarded} XP!`);
                    if (data.leveledUp) {
                        setTimeout(() => showMessage("🌟 Level Up! Congratulations on your milestone!"), 1500);
                    }
                }

                await loadDailyChallenges();
                if (typeof loadAchievements === "function") loadAchievements(true);
                updateProfile();
                updateDashboard();
            } else {
                showMessage("❌ " + (data.message || "Could not complete challenge"));
            }
        } catch (err) {
            console.error(err);
            showMessage("❌ Connection error.");
        }
    };

    window.loadChallengeHistory = async function() {
        const token = getToken();
        if (!token) return;

        const listEl = document.getElementById("challengeHistoryList");
        const emptyEl = document.getElementById("challengeHistoryEmpty");
        if (!listEl) return;

        listEl.innerHTML = `<div style="text-align:center; padding:30px; color:#6b7280;">Loading history...</div>`;

        try {
            const res = await fetch(BACKEND_URL + "/api/goals/challenges/history", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();

            if (data.success) {
                const history = data.history || [];
                if (history.length === 0) {
                    listEl.innerHTML = "";
                    if (emptyEl) emptyEl.style.display = "block";
                    return;
                }

                if (emptyEl) emptyEl.style.display = "none";

                listEl.innerHTML = history.map(item => {
                    const dateStr = item.completed_at ? new Date(item.completed_at).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (item.challenge_date || "");
                    const catClass = (item.category || "mindfulness").toLowerCase().replace(/[^a-z0-9]/g, "-");
                    return `
                        <div style="background:white; border-radius:16px; padding:16px 20px; box-shadow:0 4px 15px rgba(0,0,0,0.04); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-left:4px solid #10b981;">
                            <div>
                                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                                    <span style="font-size:16px;">🏆</span>
                                    <h4 style="font-size:15px; font-weight:700; color:#111827; margin:0;">${escapeHTMLSafe(item.title)}</h4>
                                    <span class="challenge-cat-badge ${catClass}">${escapeHTMLSafe(item.category || 'Mindfulness')}</span>
                                </div>
                                <div style="font-size:12px; color:#6b7280;">Completed on ${dateStr}</div>
                            </div>
                            <span class="challenge-xp-pill">💎 +${item.xp_reward || 20} XP</span>
                        </div>
                    `;
                }).join('');
            }
        } catch (err) {
            console.error("Error loading challenge history:", err);
            if (listEl) listEl.innerHTML = `<div style="text-align:center; padding:30px; color:#ef4444;">⚠️ Could not load history.</div>`;
        }
    };

    window.deleteChallenge = async function(challengeId) {
        if (!confirm("Delete this custom challenge?")) return;
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(BACKEND_URL + `/api/goals/challenges/${challengeId}`, {
                method: "DELETE",
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success) {
                showMessage("🗑️ Challenge deleted.");
                await loadDailyChallenges();
            } else {
                showMessage("❌ " + (data.message || "Failed to delete"));
            }
        } catch (err) {
            showMessage("❌ Connection error.");
        }
    };

    // ----------------------------------------------------
    // WELLNESS GOALS CLIENT LOGIC (Preserved & Enhanced)
    // ----------------------------------------------------

    window.loadGoalHistory = async function () {
        const token = getToken();
        if (!token || !currentUser) return;
        try {
            const [goalsRes, summaryRes] = await Promise.all([
                fetch(BACKEND_URL + "/api/goals", {
                    headers: { "Authorization": "Bearer " + token }
                }),
                fetch(BACKEND_URL + "/api/goals/summary", {
                    headers: { "Authorization": "Bearer " + token }
                }).catch(() => null)
            ]);

            const data = await goalsRes.json();
            if (data.success) {
                // Update local storage representation just for compatibility
                goals = (data.goals || []).map(g => ({
                    id: g.id || g.goal_id,
                    email: currentUser.email,
                    title: g.title,
                    completed: g.completed,
                    completed_date: g.completed_date || g.target_date,
                    date: g.completed_date || g.target_date,
                    ...g
                }));
                saveData();
                renderWellnessGoals(data.goals || []);
                updateDashboard();
                updateProfile();
            }

            if (summaryRes) {
                const sData = await summaryRes.json();
                if (sData.success) {
                    const totalEl = document.getElementById("goalsStatTotal");
                    const activeEl = document.getElementById("goalsStatActive");
                    const compEl = document.getElementById("goalsStatCompleted");
                    const rateEl = document.getElementById("goalsStatRate");
                    if (totalEl) totalEl.textContent = sData.total;
                    if (activeEl) activeEl.textContent = sData.active;
                    if (compEl) compEl.textContent = sData.completed;
                    if (rateEl) rateEl.textContent = sData.completionRate + "%";
                }
            }
        } catch (err) {
            console.warn("Could not load goals from backend.", err);
        }
    };

    function renderWellnessGoals(goalsArray) {
        const listEl = document.getElementById("wellnessGoalsList");
        const emptyEl = document.getElementById("wellnessGoalsEmpty");
        
        if (!listEl) return;
        
        let filtered = goalsArray;
        if (currentGoalFilter === 'active') {
            filtered = goalsArray.filter(g => getGoalStatus(g) === 'IN_PROGRESS' || getGoalStatus(g) === 'NOT_STARTED');
        } else if (currentGoalFilter === 'completed') {
            filtered = goalsArray.filter(g => getGoalStatus(g) === 'COMPLETED');
        } else if (currentGoalFilter === 'overdue') {
            filtered = goalsArray.filter(g => getGoalStatus(g) === 'OVERDUE');
        }

        if (filtered.length === 0) {
            listEl.innerHTML = "";
            if (emptyEl) emptyEl.style.display = "block";
            return;
        }

        if (emptyEl) emptyEl.style.display = "none";
        
        listEl.innerHTML = filtered.map(goal => {
            const status = getGoalStatus(goal);
            const progressPct = goal.target_value > 0 ? Math.min(100, Math.round((goal.current_progress / goal.target_value) * 100)) : 0;
            const isCompleted = status === 'COMPLETED' || !!goal.completed;
            
            let badgeColor = "#3b82f6";
            let badgeText = "In Progress";
            if (isCompleted) { badgeColor = "#10b981"; badgeText = "Completed"; }
            else if (status === 'OVERDUE') { badgeColor = "#ef4444"; badgeText = "Overdue"; }
            
            let dateStr = "";
            if (goal.target_date) {
                dateStr = new Date(goal.target_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
            }

            return `
                <div id="goal-entry-${goal.goal_id}" style="
                    background: white;
                    border-radius: 20px;
                    padding: 22px 25px;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.06);
                    border-left: 4px solid ${badgeColor};
                    transition: all 0.3s ease;
                ">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
                        <div>
                            <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                                <span style="font-size:22px;">🎯</span>
                                <h3 style="font-size:18px; font-weight:700; margin:0; color:#1f2937;">${escapeHTMLSafe(goal.title)}</h3>
                            </div>
                            <div style="display:flex; gap:8px; flex-wrap:wrap; font-size:12px; font-weight:600; color:#6b7280;">
                                <span style="background:#f3f4f6; padding:3px 10px; border-radius:12px;">📁 ${escapeHTMLSafe(goal.category || 'General')}</span>
                                <span style="background:#f3f4f6; padding:3px 10px; border-radius:12px;">⚡ Priority: ${escapeHTMLSafe(goal.priority || 'medium')}</span>
                                <span style="background:#f3f4f6; padding:3px 10px; border-radius:12px;">${goal.tracking_type === 'automatic' ? '🤖 Auto Sync' : '🖐️ Manual'}</span>
                                ${dateStr ? `<span style="background:#f3f4f6; padding:3px 10px; border-radius:12px;">📅 Due ${dateStr}</span>` : ''}
                            </div>
                        </div>
                        <span style="font-size:12px; font-weight:700; color:${badgeColor}; background:${badgeColor}18; padding:5px 12px; border-radius:20px;">
                            ${badgeText}
                        </span>
                    </div>

                    ${goal.description ? `
                        <p style="color:#4b5563; font-size:14px; line-height:1.5; margin:0 0 14px 0;">${escapeHTMLSafe(goal.description)}</p>
                    ` : ''}

                    <div style="margin-bottom:15px;">
                        <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600; margin-bottom:6px;">
                            <span style="color:#4b5563;">Progress: ${goal.current_progress} / ${goal.target_value}</span>
                            <span style="color:${badgeColor}; font-weight:700;">${progressPct}%</span>
                        </div>
                        <div style="height:10px; background:#e5e7eb; border-radius:5px; overflow:hidden;">
                            <div style="height:100%; width:${progressPct}%; background:${badgeColor}; transition:width 0.4s ease;"></div>
                        </div>
                    </div>
                    
                    ${goal.milestones && goal.milestones.length > 0 ? `
                        <div style="margin-top:15px; background:#f9fafb; padding:12px 15px; border-radius:12px;">
                            <h4 style="font-size:13px; color:#4b5563; margin-bottom:10px; font-weight:700;">Milestones</h4>
                            <ul style="list-style:none; padding:0; margin:0; font-size:13px;">
                                ${goal.milestones.map(m => `
                                    <li style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
                                        <span>${m.is_completed ? '✅' : '⏳'}</span>
                                        <span style="${m.is_completed ? 'text-decoration:line-through; color:#9ca3af;' : 'color:#374151;'}">
                                            ${escapeHTMLSafe(m.title)} (${m.target_value})
                                        </span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    <div style="display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap; margin-top:12px;">
                        ${!isCompleted ? `
                            ${goal.tracking_type === 'manual' ? `
                                <button type="button" onclick="window.updateGoalProgress(${goal.goal_id}, ${goal.current_progress + 1})" style="background:#6c63ff; color:white; border:none; padding:6px 14px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer;">+1 Progress</button>
                            ` : ''}
                            <button type="button" onclick="window.completeGoal(${goal.goal_id})" style="background:#10b981; color:white; border:none; padding:6px 14px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer;">Complete ✓</button>
                        ` : `
                            <span style="font-size:13px; color:#10b981; font-weight:600; align-self:center;">✅ Goal Completed</span>
                        `}
                        <button type="button" onclick="window.deleteGoalEntry(${goal.goal_id})" style="background:transparent; border:1px solid #fca5a5; color:#ef4444; padding:6px 14px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer;">🗑️ Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function getGoalStatus(goal) {
        if (goal.completed) return 'COMPLETED';
        if (goal.target_date && new Date(goal.target_date) < new Date()) return 'OVERDUE';
        return 'IN_PROGRESS';
    }

    window.updateGoalProgress = async function (goalId, newProgress) {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(BACKEND_URL + "/api/goals/" + goalId, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body: JSON.stringify({ current_progress: newProgress })
            });
            const data = await res.json();
            if (data.success) {
                showMessage("🎯 Progress updated!");
                await loadGoalHistory();
                if (typeof loadAchievements === "function") loadAchievements(true);
            } else {
                showMessage("❌ Failed to update progress: " + data.message);
            }
        } catch (err) {
            console.error(err);
            showMessage("❌ Network error.");
        }
    };

    window.completeGoal = async function (goalId) {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(BACKEND_URL + "/api/goals/" + goalId, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body: JSON.stringify({ completed: true })
            });
            const data = await res.json();
            if (data.success) {
                showMessage("🎉 Goal completed!");
                await loadGoalHistory();
                if (typeof loadAchievements === "function") loadAchievements(true);
            } else {
                showMessage("❌ Failed to complete goal: " + data.message);
            }
        } catch (err) {
            console.error(err);
            showMessage("❌ Network error.");
        }
    };

    window.deleteGoalEntry = async function (goalId) {
        if (!confirm("Delete this wellness goal? This cannot be undone.")) return;
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(BACKEND_URL + "/api/goals/" + goalId, {
                method:  "DELETE",
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success) {
                showMessage("🗑️ Goal deleted.");
                await loadGoalHistory();
            } else {
                showMessage("❌ Could not delete goal: " + data.message);
            }
        } catch (err) {
            console.warn(err);
            showMessage("❌ Network error.");
        }
    };

    // Unified Modal Form Submit (handles both challenges & goals)
    const createGoalFormEl = document.getElementById("createGoalForm");
    if (createGoalFormEl) {
        createGoalFormEl.addEventListener("submit", async function(e) {
            e.preventDefault();
            const token = getToken();
            if (!token) { showMessage("Please login first."); return; }

            const itemType = document.getElementById("goalItemType") ? document.getElementById("goalItemType").value : "challenge";
            const title = document.getElementById("goalTitle").value.trim();
            const description = document.getElementById("goalDesc") ? document.getElementById("goalDesc").value.trim() : "";
            const category = document.getElementById("goalCategory").value;
            const priority = document.getElementById("goalPriority").value;
            const target_value = document.getElementById("goalTargetValue").value;

            if (!title) {
                showMessage("❌ Please enter a title.");
                return;
            }

            const btn = document.getElementById("saveWellnessGoalBtn");
            const originalText = btn ? btn.textContent : "Save Item";
            if (btn) {
                btn.textContent = "Saving...";
                btn.disabled = true;
            }

            try {
                if (itemType === "challenge") {
                    // Create Daily Challenge
                    const xp_reward = priority === "Hard" ? 50 : priority === "Medium" ? 35 : 20;
                    const res = await fetch(BACKEND_URL + "/api/goals/challenges", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                        body: JSON.stringify({
                            title,
                            description,
                            category,
                            difficulty: priority,
                            xp_reward,
                            target_value: Math.max(1, parseInt(target_value) || 1)
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        if (btn) btn.textContent = "Saved ✓";
                        showMessage("🔥 Custom challenge created for today!");
                        createGoalFormEl.reset();
                        setTimeout(() => {
                            window.closeGoalModal();
                            if (btn) { btn.textContent = originalText; btn.disabled = false; }
                        }, 600);
                        await loadDailyChallenges();
                    } else {
                        if (btn) { btn.textContent = originalText; btn.disabled = false; }
                        showMessage("❌ " + (data.message || "Failed to create challenge"));
                    }
                } else {
                    // Create Long-Term Goal
                    const target_date = document.getElementById("goalTargetDate") ? document.getElementById("goalTargetDate").value : null;
                    const tracking_type = document.getElementById("goalTrackingType") ? document.getElementById("goalTrackingType").value : "manual";

                    const payload = { 
                        title, 
                        description, 
                        category, 
                        priority: priority.toLowerCase(), 
                        target_value: Math.max(1, parseInt(target_value) || 1), 
                        tracking_type 
                    };
                    if (target_date) payload.target_date = target_date;

                    const res = await fetch(BACKEND_URL + "/api/goals", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (data.success) {
                        if (btn) btn.textContent = "Saved ✓";
                        showMessage("🎯 Goal created successfully!");
                        createGoalFormEl.reset();
                        setTimeout(() => {
                            window.closeGoalModal();
                            if (btn) { btn.textContent = originalText; btn.disabled = false; }
                        }, 600);
                        await loadGoalHistory();
                    } else {
                        if (btn) { btn.textContent = originalText; btn.disabled = false; }
                        showMessage("❌ " + data.message);
                    }
                }
            } catch (err) {
                console.error(err);
                if (btn) { btn.textContent = originalText; btn.disabled = false; }
                showMessage("❌ Connection error.");
            }
        });
    }

    // Filter buttons for goals tab
    document.querySelectorAll(".goal-filters .ai-filter-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            document.querySelectorAll(".goal-filters .ai-filter-btn").forEach(b => {
                b.classList.remove("active");
                b.style.background = "white";
                b.style.color = "#4b5563";
            });
            this.classList.add("active");
            this.style.background = "#6c63ff";
            this.style.color = "white";
            currentGoalFilter = this.dataset.goalFilter || 'all';
            loadGoalHistory();
        });
    });

    // Auto-load daily challenges when user views goals section
    const originalLoadUserInitialData = window.loadUserInitialData;
    if (typeof originalLoadUserInitialData === "function") {
        window.loadUserInitialData = function() {
            originalLoadUserInitialData();
            loadDailyChallenges();
        };
    } else {
        setTimeout(loadDailyChallenges, 1000);
    }
    
    function renderDashboardGoalWidget() {
        const widgetContainer = document.getElementById("dashGoalWidgetContent");
        if (!widgetContainer) return;
        
        const activeGoals = goals.filter(g => g.status === 'IN_PROGRESS' || (!g.status && !g.completed));
        if (activeGoals.length === 0) {
            widgetContainer.innerHTML = `<div style="font-size:14px; color:var(--text-muted); text-align:center;">No active goals. <a href="#goals" style="color:var(--primary); font-weight:600;">Create one!</a></div>`;
            return;
        }
        
        const topGoal = activeGoals[0]; // Just take the first active one
        const progressPct = topGoal.target_value > 0 ? Math.min(100, Math.round((topGoal.current_progress / topGoal.target_value) * 100)) : 0;
        
        widgetContainer.innerHTML = `
            <div style="margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="font-weight:600; font-size:14px;">🎯 ${escapeHTMLSafe(topGoal.title)}</span>
                    <span style="font-weight:600; font-size:14px; color:var(--primary);">${progressPct}%</span>
                </div>
                <div style="height:8px; background:var(--bg-color); border-radius:4px; overflow:hidden;">
                    <div style="height:100%; background:var(--primary); width:${progressPct}%; transition:width 0.4s ease;"></div>
                </div>
                <div style="text-align:right; margin-top:4px; font-size:12px; color:var(--text-muted);">
                    ${topGoal.current_progress} / ${topGoal.target_value}
                </div>
            </div>
        `;
    }

    const originalUpdateDashboard = updateDashboard;
    updateDashboard = function() {
        if (originalUpdateDashboard) originalUpdateDashboard();
        renderDashboardGoalWidget();
    };





    /* =====================================================
       12. PROFILE & PROFILE EDIT (Managed by Section 4B)
    ===================================================== */



    
    /* =====================================================
       14. SPA ROUTING (NEW ARCHITECTURE)
    ===================================================== */
    function showSection(sectionId) {
        // Handle public vs private routing
        const publicSections = ['#home', '#features', '#how-it-works', '#resources-preview', '#about', '#login', '#register'];
        const isPublic = publicSections.includes(sectionId);
        
        if (isPublic) {
            document.body.classList.add('public-view');
            document.body.classList.remove('private-view');
        } else {
            // Require login for private sections
            if (!currentUser) {
                showSection('#login');
                return;
            }
            document.body.classList.add('private-view');
            document.body.classList.remove('public-view');
            
            // Close mobile sidebar if open
            document.body.classList.remove('sidebar-open');
        }

        // Handle alias routes for resources
        let activeTabToOpen = null;
        if (sectionId === '#meditation') {
            sectionId = '#resources';
            activeTabToOpen = 'meditation';
        } else if (sectionId === '#music') {
            sectionId = '#resources';
            activeTabToOpen = 'music';
        }

        // Clean up running meditation timer if leaving resources
        if (sectionId !== '#resources' && typeof medPause === 'function') {
            medPause();
        }

        // Hide all sections
        document.querySelectorAll('section').forEach(s => {
            s.style.display = 'none';
        });

        // Show target section
        const target = document.querySelector(sectionId);
        if (target) {
            target.style.display = 'block';
            if (typeof loadDailyRecommendations === "function") loadDailyRecommendations();
            if (typeof fetchWellnessInsights === "function") fetchWellnessInsights();
            if (typeof fetchRecommendations === "function") fetchRecommendations();
            if (typeof loadWellnessJourney === "function") loadWellnessJourney();
            if (typeof initNotifications === "function") initNotifications();
            if (typeof loadAssistantDailyMessage === "function") loadAssistantDailyMessage();
            if (['#home', '#features', '#how-it-works', '#resources-preview', '#about'].includes(sectionId)) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.scrollTo(0, 0);
            }
        }

        // Switch to requested resource tab if specified
        if (sectionId === '#resources' && activeTabToOpen) {
            const tabBtn = document.getElementById("tab-" + activeTabToOpen);
            if (tabBtn) tabBtn.click();
        }

        // Update active sidebar link
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === sectionId || (sectionId === '#resources' && (href === '#meditation' || href === '#music'))) {
                link.classList.add('active');
            }
        });

        // Special triggers
        if (sectionId === '#dailyPlan' && typeof window.loadDailyPlan === 'function') {
            window.loadDailyPlan();
        }
        if (sectionId === '#goals') {
            if (typeof loadGoalHistory === 'function') loadGoalHistory();
            if (typeof loadHabits === 'function') loadHabits();
        }
        if (sectionId === '#dashboard') {
            if (typeof loadGoalHistory === 'function') loadGoalHistory();
            if (typeof loadHabits === 'function') loadHabits();
            if (typeof fetchWeeklyWellnessInsights === 'function') fetchWeeklyWellnessInsights();
        }
        if (sectionId === '#resources') {
            if (typeof renderMusicPlaylist === 'function') renderMusicPlaylist();
            if (typeof renderWellnessTracker === 'function') renderWellnessTracker();
        }
        if (sectionId === '#chatbot') {
            if (typeof loadChatHistory === 'function') loadChatHistory();
            setTimeout(() => {
                const input = document.getElementById("chatInput");
                if (input) input.focus();
            }, 100);
        }
        if (sectionId === '#aiInsights' && typeof initAiInsights === 'function') {
            initAiInsights();
        }
    }

    // Intercept all hash links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", function(event) {
            const targetID = this.getAttribute("href");
            if (targetID === "#") return;
            
            event.preventDefault();
            history.pushState(null, null, targetID);
            showSection(targetID);
        });
    });

    // Handle back/forward browser buttons
    window.addEventListener('popstate', () => {
        const hash = window.location.hash || '#home';
        showSection(hash);
    });

    // Mobile Hamburger
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-open');
        });
    }

    // Initialize initial route
    window.addEventListener('DOMContentLoaded', () => {
        const hash = window.location.hash || '#home';
        showSection(hash);
    });


/* =====================================================
       15. START YOUR JOURNEY
    ===================================================== */

    document.querySelectorAll(
        'a[href="#register"]'
    ).forEach(button => {

        button.addEventListener(
            "click",
            function () {

                setTimeout(function () {

                    const firstInput =
                        document.querySelector(
                            "#register input"
                        );


                    firstInput?.focus();

                }, 700);

            }
        );

    });



    /* =====================================================
       16. LOGGED-IN STATUS
    ===================================================== */

    function updateLoginStatus() {

        if (!currentUser) return;


        const loginButton =
            document.querySelector(
                '.nav-buttons a[href="#login"]'
            );


        if (loginButton) {

            loginButton.textContent =
                "Logout";


            loginButton.href = "#";


            loginButton.onclick =
                function (event) {

                    event.preventDefault();


                    const confirmLogout =
                        confirm(
                            "Do you want to logout?"
                        );


                    if (!confirmLogout) return;


                    currentUser = null;

                    localStorage.removeItem("innerVoiceToken");

                    saveData();


                    showMessage(
                        "You have been logged out."
                    );


                    location.reload();

                };

        }

    }



    /* =====================================================
       17. WELLNESS RESOURCE CLICK
    ===================================================== */

    document.querySelectorAll(
        ".resource"
    ).forEach(resource => {

        resource.style.cursor = "pointer";


        resource.addEventListener(
            "click",
            function () {

                const title =
                    resource.querySelector("h3")
                        ?.textContent;


                showMessage(
                    "🌿 " +
                    title +
                    "\n\nResource page coming soon."
                );

            }
        );

    });



    /* =====================================================
       18. MOOD HOVER EFFECT
    ===================================================== */

    document.querySelectorAll(
        ".mood"
    ).forEach(mood => {

        mood.style.cursor = "pointer";


        mood.addEventListener(
            "click",
            async function () {

                const moodText =
                    mood.querySelector("small")
                        ?.textContent.trim();


                if (!currentUser) {

                    showMessage(
                        "Please login to save your mood."
                    );

                    return;

                }


                // Use saveMood() which handles both backend + localStorage
                const iconMap = { "Happy": "😊", "Okay": "😐", "Sad": "😔" };
                const icon   = iconMap[moodText] || "";

                await saveMood(moodText, icon);

            }
        );

    });



    /* =====================================================
       PHASE 7. AI WELLNESS INSIGHTS
    ===================================================== */
    
    // Mock Data Structure
    const mockWellnessInsights = [
        {
            id: 'ai-1',
            category: 'Overall Wellness',
            title: 'Consistency appears to be your strongest wellness pattern.',
            description: 'Your overall wellness activity is becoming more consistent.',
            date: '2026-08-20',
            confidence: 'High Confidence',
            evidence: '<ul><li>✓ Logged mood 5 days in a row</li><li>✓ Completed 3 habits daily</li></ul>',
            recommendation: 'Continue your current daily routine.',
            priority: true
        },
        {
            id: 'ai-2',
            category: 'Mood',
            title: 'Mood check-ins are highly consistent.',
            description: 'Your mood check-ins have been more consistent this week.',
            date: '2026-08-20',
            confidence: 'High Confidence',
            evidence: '<ul><li>✓ 6 mood entries logged this week</li><li>✓ Average mood score 4.2</li></ul>',
            recommendation: 'Keep tracking to maintain emotional awareness.',
            priority: false
        },
        {
            id: 'ai-3',
            category: 'Habits',
            title: 'Habit routine maintained effectively.',
            description: 'You completed your wellness habits on most days this week.',
            date: '2026-08-19',
            confidence: 'Medium Confidence',
            evidence: '<ul><li>✓ 6 completed days</li><li>✓ 2 active habits</li><li>✓ 1 current streak</li></ul>',
            recommendation: 'Try adding a new habit next week.',
            priority: false
        },
        {
            id: 'ai-4',
            category: 'Journaling',
            title: 'Journaling activity increased.',
            description: 'Your journaling activity increased compared with the previous week.',
            date: '2026-08-18',
            confidence: 'High Confidence',
            evidence: '<ul><li>✓ 3 journal entries this week (vs 1 last week)</li></ul>',
            recommendation: 'Reflect on what triggered this positive change.',
            priority: false
        },
        {
            id: 'ai-5',
            category: 'Goals',
            title: 'Steady progress on goals.',
            description: 'You are making steady progress toward your current goals.',
            date: '2026-08-17',
            confidence: 'Medium Confidence',
            evidence: '<ul><li>✓ 1 goal completed</li><li>✓ 2 goals in progress</li></ul>',
            recommendation: 'Review your next goal steps.',
            priority: false
        },
        {
            id: 'ai-6',
            category: 'Focus',
            title: 'Focus correlates with consistency.',
            description: 'Your focus sessions were strongest during your most consistent days.',
            date: '2026-08-16',
            confidence: 'Low Confidence',
            evidence: '<ul><li>✓ 2 focus sessions completed on high-activity days</li></ul>',
            recommendation: 'Schedule focus sessions after completing habits.',
            priority: false
        },
        {
            id: 'ai-7',
            category: 'Achievements',
            title: 'New milestone reached.',
            description: 'You recently reached a new achievement milestone.',
            date: '2026-08-15',
            confidence: 'High Confidence',
            evidence: '<ul><li>✓ "Consistent Checker" badge unlocked</li></ul>',
            recommendation: 'Check out the new badges you can earn.',
            priority: false
        }
    ];

    let currentAiFilter = 'All';
    let aiSearchQuery = '';
    let favoriteInsights = JSON.parse(localStorage.getItem('favInsights')) || [];
    let loadedInsights = [];

    // Service Layer
    async function loadWellnessInsights() {
        const token = getToken();
        if (!token) return [];
        
        try {
            const [insightsRes, trendsRes, patternsRes] = await Promise.all([
                fetch(BACKEND_URL + '/api/wellness-insights', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(BACKEND_URL + '/api/wellness-insights/trends', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(BACKEND_URL + '/api/wellness-insights/patterns', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            let allInsights = [];
            
            if (insightsRes.ok) {
                const data = await insightsRes.json();
                allInsights = allInsights.concat(data.insights || []);
            }
            if (trendsRes.ok) {
                const data = await trendsRes.json();
                allInsights = allInsights.concat(data.trends || []);
            }
            if (patternsRes.ok) {
                const data = await patternsRes.json();
                allInsights = allInsights.concat(data.patterns || []);
            }

            // Map dynamic fields so they fit the AI Insights UI schema
            return allInsights.map((insight, idx) => {
                return {
                    id: insight.id || `ai-${idx}`,
                    category: insight.category || 'Overall Wellness',
                    title: insight.title || 'Wellness Pattern Observed',
                    description: insight.description || 'Consistency in your daily routine supports overall well-being.',
                    date: insight.date || new Date().toISOString().slice(0, 10),
                    confidence: insight.importance ? `${insight.importance} Importance` : 'Medium Confidence',
                    evidence: insight.evidence || `<ul><li>✓ Observed pattern in recent records</li></ul>`,
                    recommendation: insight.recommendation || 'Continue logging daily activities.',
                    priority: insight.importance === 'HIGH'
                };
            });
        } catch (err) {
            console.error('Failed to load real AI insights:', err);
            return [];
        }
    }

    async function fetchWeeklyStatsForAiInsights() {
        const token = getToken();
        if (!token) return null;
        try {
            const res = await fetch(BACKEND_URL + "/api/insights/weekly", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success && data.data) {
                return data.data;
            }
        } catch (e) {
            console.error("Failed to fetch weekly stats for AI Insights:", e);
        }
        return null;
    }

    // Initialize UI
    async function initAiInsights() {
        // Show loading state
        const feedContainer = document.getElementById('aiInsightsFeed');
        if(feedContainer) feedContainer.innerHTML = '<div class="ai-loading-state"><div class="ai-dots"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div></div>Analyzing wellness data...</div>';
        
        const weeklyData = await fetchWeeklyStatsForAiInsights();
        loadedInsights = await loadWellnessInsights();
        
        renderAiSummary(weeklyData);
        renderAiWeeklyComparison(weeklyData);
        renderAiTopInsight();
        renderAiRecommendations(weeklyData);
        renderAiInsightsFeed();
    }

    function renderAiSummary(weeklyData) {
        const container = document.getElementById('aiSummaryContent');
        if(!container) return;
        
        if (!weeklyData) {
            container.innerHTML = `
                <div class="ai-stat-row"><span class="ai-stat-label">Overall Wellness</span><span class="ai-stat-val" style="color:#6c63ff;">82%</span></div>
                <div class="ai-stat-row"><span class="ai-stat-label">Mood Stability</span><span class="ai-stat-val">76%</span></div>
                <div class="ai-stat-row"><span class="ai-stat-label">Habit Consistency</span><span class="ai-stat-val">88%</span></div>
                <div class="ai-stat-row"><span class="ai-stat-label">Reflection Activity</span><span class="ai-stat-val">71%</span></div>
                <div class="ai-stat-row"><span class="ai-stat-label">Goal Progress</span><span class="ai-stat-val">80%</span></div>
                <div class="ai-stat-row"><span class="ai-stat-label">Focus Consistency</span><span class="ai-stat-val">74%</span></div>
            `;
            return;
        }

        const overall = weeklyData.score.current;
        const mood = weeklyData.mood.average ? Math.round(weeklyData.mood.average * 20) : 0;
        const habits = Math.round(weeklyData.habits.completionRate || 0);
        
        const reflectionCount = (weeklyData.journals.entries || 0) + (weeklyData.reflections.entries || 0);
        const reflection = Math.min(100, Math.round((reflectionCount / 5) * 100));
        
        const goalsCompleted = weeklyData.goals.completed || 0;
        const goalsActive = weeklyData.goals.active || 0;
        const goalsTotal = goalsCompleted + goalsActive;
        const goals = goalsTotal > 0 ? Math.round((goalsCompleted / goalsTotal) * 100) : 0;
        
        const focus = Math.round(weeklyData.dailyPlan.completionRate || 0);

        container.innerHTML = `
            <div class="ai-stat-row">
                <span class="ai-stat-label">Overall Wellness</span>
                <span class="ai-stat-val" style="color:#6c63ff;">${overall}%</span>
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Mood Stability</span>
                <span class="ai-stat-val">${mood}%</span>
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Habit Consistency</span>
                <span class="ai-stat-val">${habits}%</span>
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Reflection Activity</span>
                <span class="ai-stat-val">${reflection}%</span>
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Goal Progress</span>
                <span class="ai-stat-val">${goals}%</span>
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Focus Consistency</span>
                <span class="ai-stat-val">${focus}%</span>
            </div>
        `;
    }

    function getTrendHtml(val) {
        const rounded = Math.round(val);
        if (rounded > 0) {
            return `<span class="ai-stat-val trend-up">↑ ${rounded}%</span>`;
        } else if (rounded < 0) {
            return `<span class="ai-stat-val trend-down">↓ ${Math.abs(rounded)}%</span>`;
        } else {
            return `<span class="ai-stat-val trend-stable">→ 0%</span>`;
        }
    }

    function getCountTrendHtml(val) {
        if (val > 0) {
            return `<span class="ai-stat-val trend-up">↑ +${val}</span>`;
        } else if (val < 0) {
            return `<span class="ai-stat-val trend-down">↓ ${val}</span>`;
        } else {
            return `<span class="ai-stat-val trend-stable">→ 0</span>`;
        }
    }

    function renderAiWeeklyComparison(weeklyData) {
        const container = document.getElementById('aiWeeklyComparisonContent');
        if(!container) return;
        
        if (!weeklyData || !weeklyData.previousStats) {
            container.innerHTML = `
                <div class="ai-stat-row"><span class="ai-stat-label">Mood</span><span class="ai-stat-val trend-up">↑ 12%</span></div>
                <div class="ai-stat-row"><span class="ai-stat-label">Journaling</span><span class="ai-stat-val trend-up">↑ 20%</span></div>
                <div class="ai-stat-row"><span class="ai-stat-label">Habits</span><span class="ai-stat-val trend-up">↑ 8%</span></div>
                <div class="ai-stat-row"><span class="ai-stat-label">Goals</span><span class="ai-stat-val trend-stable">→ 0%</span></div>
                <div class="ai-stat-row"><span class="ai-stat-label">Focus</span><span class="ai-stat-val trend-down">↓ 5%</span></div>
            `;
            return;
        }

        const prev = weeklyData.previousStats;
        
        const moodDiff = (weeklyData.mood.average || 0) - (prev.mood.average || 0);
        const moodPct = Math.round(moodDiff * 20);
        
        const currJournal = (weeklyData.journals.entries || 0) + (weeklyData.reflections.entries || 0);
        const prevJournal = (prev.journals.entries || 0) + (prev.reflections.entries || 0);
        const journalDiff = currJournal - prevJournal;
        
        const habitDiff = (weeklyData.habits.completionRate || 0) - (prev.habits.completionRate || 0);
        
        const goalDiff = (weeklyData.goals.completed || 0) - (prev.goals.completed || 0);
        
        const focusDiff = (weeklyData.dailyPlan.completionRate || 0) - (prev.dailyPlan.completionRate || 0);

        container.innerHTML = `
            <div class="ai-stat-row">
                <span class="ai-stat-label">Mood</span>
                ${getTrendHtml(moodPct)}
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Journaling</span>
                ${getCountTrendHtml(journalDiff)}
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Habits</span>
                ${getTrendHtml(habitDiff)}
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Goals</span>
                ${getCountTrendHtml(goalDiff)}
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Focus</span>
                ${getTrendHtml(focusDiff)}
            </div>
        `;
    }

    function renderAiTopInsight() {
        const container = document.getElementById('aiFeaturedInsightContent');
        if(!container) return;
        
        if (loadedInsights.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:20px; color:var(--text-muted); font-size:13px;">
                    🌱 Log more moods, habits, and journals to generate your most important AI insight.
                </div>
            `;
            return;
        }

        const topInsight = loadedInsights.find(i => i.priority) || loadedInsights[0];
        
        container.innerHTML = `
            <div class="ai-top-quote">"${topInsight.title}"</div>
            <div style="font-weight:600; font-size:13px; color:#4b5563; margin-bottom:5px;">Why this matters</div>
            <div class="ai-why-matters">${topInsight.description}</div>
            <div style="font-weight:600; font-size:13px; color:#4b5563; margin-bottom:5px;">Recommended action:</div>
            <div style="font-size:13px; color:#6b7280; margin-bottom:15px;">${topInsight.recommendation}</div>
            <button class="btn primary" style="width:100%; padding: 8px;" onclick="showToast('Added to Daily Plan (Mock)')">Add to Daily Plan</button>
        `;
    }

    function renderAiRecommendations(weeklyData) {
        const container = document.getElementById('aiRecommendationsContent');
        if(!container) return;
        
        container.innerHTML = `
            <div class="ai-rec-card">
                <div class="ai-rec-header">
                    <span class="ai-rec-icon">🧘</span>
                    <span class="ai-rec-title">Breathing Break</span>
                    <span class="ai-rec-time">5 min</span>
                </div>
                <div class="ai-rec-desc">Take a short pause and reset your attention.</div>
                <button class="btn secondary" style="width:100%; padding:6px; font-size:12px;" onclick="showToast('Started (Mock)')">Start</button>
            </div>
            <div class="ai-rec-card">
                <div class="ai-rec-header">
                    <span class="ai-rec-icon">📝</span>
                    <span class="ai-rec-title">Short Journal</span>
                    <span class="ai-rec-time">3 min</span>
                </div>
                <div class="ai-rec-desc">Write down what's on your mind right now.</div>
                <button class="btn secondary" style="width:100%; padding:6px; font-size:12px;" onclick="showToast('Started (Mock)')">Start</button>
            </div>
            <div class="ai-rec-card">
                <div class="ai-rec-header">
                    <span class="ai-rec-icon">🎯</span>
                    <span class="ai-rec-title">Review Goal</span>
                    <span class="ai-rec-time">2 min</span>
                </div>
                <div class="ai-rec-desc">Check progress on one active goal.</div>
                <button class="btn secondary" style="width:100%; padding:6px; font-size:12px;" onclick="showToast('Started (Mock)')">Start</button>
            </div>
        `;
    }

    function getBadgeClass(cat) {
        if(cat.includes('Mood')) return 'mood';
        if(cat.includes('Habit')) return 'habits';
        if(cat.includes('Journal')) return 'journaling';
        if(cat.includes('Goal')) return 'goals';
        if(cat.includes('Focus')) return 'focus';
        if(cat.includes('Achievement')) return 'achievements';
        return 'overall';
    }

    function renderAiInsightsFeed() {
        const feedContainer = document.getElementById('aiInsightsFeed');
        if(!feedContainer) return;
        
        let filtered = loadedInsights;
        
        if (currentAiFilter !== 'All') {
            filtered = filtered.filter(i => i.category === currentAiFilter);
        }
        
        if (aiSearchQuery.trim() !== '') {
            const q = aiSearchQuery.toLowerCase();
            filtered = filtered.filter(i => 
                i.title.toLowerCase().includes(q) || 
                i.description.toLowerCase().includes(q) || 
                i.category.toLowerCase().includes(q)
            );
        }

        if (filtered.length === 0) {
            feedContainer.innerHTML = `
                <div class="ai-empty-state">
                    <div class="ai-empty-icon">🌱</div>
                    <div style="font-weight:600; color:#4b5563; margin-bottom:8px;">Your Insights Are Growing</div>
                    <div style="font-size:13px; line-height:1.4;">Continue checking in, journaling, and tracking your habits to unlock personalized wellness insights.</div>
                </div>
            `;
            return;
        }

        let html = '';
        filtered.forEach(insight => {
            const isFav = favoriteInsights.includes(insight.id);
            const badgeClass = getBadgeClass(insight.category);
            html += `
                <div class="ai-insight-item" data-id="${insight.id}">
                    <div class="ai-insight-header">
                        <span class="ai-badge ${badgeClass}">${insight.category}</span>
                        <span class="ai-insight-date">${insight.date}</span>
                    </div>
                    <div class="ai-insight-text">"${insight.description}"</div>
                    <div class="ai-insight-footer">
                        <span class="ai-confidence">✓ ${insight.confidence}</span>
                        <div class="ai-actions">
                            <button class="ai-action-btn fav ${isFav ? 'active' : ''}" data-id="${insight.id}" onclick="toggleAiFav('${insight.id}', event)">
                                ${isFav ? '★' : '☆'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        feedContainer.innerHTML = html;

        // Add click listeners for the modal
        const items = feedContainer.querySelectorAll('.ai-insight-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                if(e.target.closest('.ai-action-btn')) return; // ignore clicks on favorite button
                openAiModal(item.dataset.id);
            });
        });
    }

    function toggleAiFav(id, event) {
        event.stopPropagation();
        if (favoriteInsights.includes(id)) {
            favoriteInsights = favoriteInsights.filter(i => i !== id);
        } else {
            favoriteInsights.push(id);
        }
        localStorage.setItem('favInsights', JSON.stringify(favoriteInsights));
        renderAiInsightsFeed();
    }

    function openAiModal(id) {
        const insight = loadedInsights.find(i => i.id === id);
        if(!insight) return;
        
        document.getElementById('aiModalCategory').textContent = insight.category;
        document.getElementById('aiModalCategory').className = 'ai-badge ' + getBadgeClass(insight.category);
        document.getElementById('aiModalDate').textContent = insight.date;
        document.getElementById('aiModalText').textContent = '"' + insight.description + '"';
        document.getElementById('aiModalEvidence').innerHTML = insight.evidence;
        document.getElementById('aiModalRecommendation').textContent = insight.recommendation;
        
        const copyBtn = document.getElementById('btnAiModalCopy');
        copyBtn.onclick = () => {
            const textToCopy = `Insight: ${insight.description}\\nRecommendation: ${insight.recommendation}`;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => { copyBtn.textContent = 'Copy Insight'; }, 2000);
                }).catch(() => {
                    showToast('Failed to copy text');
                });
            } else {
                showToast('Clipboard API not available');
            }
        };

        document.getElementById('aiInsightModal').style.display = 'flex';
    }

    // Event Listeners for Filters, Search, Modal
    document.addEventListener('DOMContentLoaded', () => {
        const filterContainer = document.getElementById('aiFiltersContainer');
        if(filterContainer) {
            filterContainer.addEventListener('click', (e) => {
                if(e.target.classList.contains('ai-filter-btn')) {
                    document.querySelectorAll('.ai-filter-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    currentAiFilter = e.target.dataset.category;
                    renderAiInsightsFeed();
                }
            });
        }

        const searchInput = document.getElementById('aiSearchInput');
        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                aiSearchQuery = e.target.value;
                renderAiInsightsFeed();
            });
        }

        const closeBtn = document.getElementById('closeAiInsightModal');
        if(closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('aiInsightModal').style.display = 'none';
            });
        }
        
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            const m = document.getElementById('aiInsightModal');
            if (e.target === m) {
                m.style.display = "none";
            }
        });

        const genBtn = document.getElementById('btnGenerateMockInsight');
        if(genBtn) {
            genBtn.addEventListener('click', () => {
                const feedContainer = document.getElementById('aiInsightsFeed');
                feedContainer.innerHTML = '<div class="ai-loading-state"><div class="ai-dots"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div></div>Generating insight...</div>';
                
                setTimeout(() => {
                    const newInsight = {
                        id: 'ai-mock-' + Date.now(),
                        category: 'Overall Wellness',
                        title: 'New AI Insight Generated',
                        description: 'Your wellness data suggests a new positive trend starting today.',
                        date: new Date().toISOString().split('T')[0],
                        confidence: 'Medium Confidence',
                        evidence: '<ul><li>✓ Mock evidence generated dynamically</li></ul>',
                        recommendation: 'Keep up the good work.',
                        priority: false
                    };
                    loadedInsights.unshift(newInsight);
                    showToast('✨ New insight generated');
                    renderAiInsightsFeed();
                }, 1500);
            });
        }
    });

    /* =====================================================
       19. INITIALIZE APPLICATION
    ===================================================== */

    updateDashboard();

    updateProfile();

    updateLoginStatus();

    // Always load daily recommendations on start
    loadDailyRecommendations();

    // Load all history from DB if user is already logged in
    if (currentUser) {
        loadMoodHistory();
        loadMoodAnalytics();
        loadJournalHistory();
        loadGoalHistory();
        loadReflectionHistory();
        loadDashboardSummary();
        loadAchievements();
        initAiInsights();
        window.loadChatHistory();
        if (typeof loadNotifications === "function") loadNotifications();
    }


    console.log("\u2705 INNERVOICE is ready!");


    /* =====================================================
       20. WELLNESS RESOURCES (MEDITATION & MUSIC)
       - Procedural Ambient Soundscapes (Web Audio API)
       - HTML5 Audio Player Engine with error handling
       - Guided Meditation Sessions (5 types)
       - Accurate countdown timer with Pause / Resume / Reset
       - SVG Circular Progress Ring
       - Calming Music & Ambient Soundscapes Player
       - Playlist Search & Category Filtering
       - Favorites system with localStorage persistence
       - Activity completion tracking
    ===================================================== */

    // ── Wellness activity tracking via localStorage ──────────────────
    function wellnessTrackKey() {
        const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const uid     = currentUser ? currentUser.email : "anon";
        return "innerVoiceWellness_" + uid + "_" + dateStr;
    }

    function getWellnessDone() {
        try {
            return JSON.parse(localStorage.getItem(wellnessTrackKey()) || "[]");
        } catch (e) { return []; }
    }

    function renderWellnessTracker() {
        const listEl = document.getElementById("wellnessDoneList");
        if (!listEl) return;
        const done = getWellnessDone();
        if (done.length === 0) {
            listEl.innerHTML = "<span class='tracker-done'>None yet — try one below!</span>";
        } else {
            listEl.innerHTML = done.map(function (a) {
                return "<span class='tracker-tag'>" + escapeHTMLSafe(a) + "</span>";
            }).join(" ");
        }
    }

    function markWellnessDone(activityName) {
        if (!activityName) return;
        const done = getWellnessDone();
        if (!done.includes(activityName)) {
            done.push(activityName);
            try {
                localStorage.setItem(wellnessTrackKey(), JSON.stringify(done));
            } catch (e) { /* non-fatal */ }
            renderWellnessTracker();
            if (typeof loadAchievements === "function") loadAchievements(true);
        }
    }

    // Render tracker on load
    renderWellnessTracker();

    // Wire up all "Mark done" buttons (relax cards + tip done btn)
    document.querySelectorAll(".relax-done-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            const activity = btn.dataset.activity;
            if (!activity) return;
            markWellnessDone(activity);
            btn.textContent = "✓ Done!";
            btn.classList.add("done");
            btn.disabled = true;
        });
    });

    // ── Tab switching ─────────────────────────────────────────────────
    document.querySelectorAll(".res-tab").forEach(function (tab) {
        tab.addEventListener("click", function () {
            // Deactivate all
            document.querySelectorAll(".res-tab").forEach(function (t) {
                t.classList.remove("active");
                t.setAttribute("aria-selected", "false");
            });
            document.querySelectorAll(".res-panel").forEach(function (p) {
                p.classList.remove("active");
            });
            // Activate selected
            tab.classList.add("active");
            tab.setAttribute("aria-selected", "true");
            const panelId = "panel-" + tab.dataset.tab;
            const panel   = document.getElementById(panelId);
            if (panel) panel.classList.add("active");

            // Pause meditation if switching away from meditation tab
            if (tab.dataset.tab !== "meditation" && medRunning) {
                medPause();
            }
        });
    });


    // =================================================================
    // PROCEDURAL AUDIO SYNTHESIZER & SOUNDSCAPE ENGINE
    // Works 100% offline using the Web Audio API without missing audio files
    // =================================================================
    let audioCtx = null;
    let masterGainNode = null;
    let activeSynthNodes = [];

    function initAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
                masterGainNode = audioCtx.createGain();
                masterGainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
                masterGainNode.connect(audioCtx.destination);
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function stopAllSynthAudio() {
        activeSynthNodes.forEach(node => {
            try {
                if (typeof node.stop === 'function') node.stop();
                if (typeof node.disconnect === 'function') node.disconnect();
            } catch (e) { /* non-fatal */ }
        });
        activeSynthNodes = [];
    }

    function createNoiseBuffer(ctx, type) {
        const bufferSize = ctx.sampleRate * 4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            if (type === 'pink') {
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                b6 = white * 0.115926;
            } else if (type === 'brown') {
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5;
            } else {
                data[i] = white * 0.2;
            }
        }
        return buffer;
    }

    // Play Tibetan Singing Bowl Bell Chime
    function playSingingBowlChime(pitchMultiplier = 1.0) {
        const ctx = initAudioContext();
        if (!ctx) return;

        const baseFreq = 216 * pitchMultiplier;
        const harmonics = [1, 2.76, 5.4, 8.9];
        const gains = [0.6, 0.3, 0.15, 0.08];

        harmonics.forEach((h, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq * h, ctx.currentTime);

            // Subtle pitch modulation / vibrato
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.setValueAtTime(2.8 + idx * 0.3, ctx.currentTime);
            lfoGain.gain.setValueAtTime(1.5, ctx.currentTime);
            lfo.connect(osc.frequency);
            lfo.start();

            // Exponential decay envelope
            gain.gain.setValueAtTime(0.001, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(gains[idx] * (musicMasterVolume || 0.8), ctx.currentTime + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 6.0);

            osc.connect(gain);
            gain.connect(masterGainNode);

            osc.start();
            osc.stop(ctx.currentTime + 6.0);
            lfo.stop(ctx.currentTime + 6.0);
        });
    }

    // Procedural soundscape generators
    function startProceduralSoundscape(type) {
        const ctx = initAudioContext();
        if (!ctx) return;
        stopAllSynthAudio();

        if (type === 'rain') {
            // Pink noise through dual resonant bandpass filters
            const noiseBuffer = createNoiseBuffer(ctx, 'pink');
            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;

            const filter1 = ctx.createBiquadFilter();
            filter1.type = 'lowpass';
            filter1.frequency.setValueAtTime(900, ctx.currentTime);

            const filter2 = ctx.createBiquadFilter();
            filter2.type = 'peaking';
            filter2.frequency.setValueAtTime(2200, ctx.currentTime);
            filter2.gain.setValueAtTime(4, ctx.currentTime);

            const rainGain = ctx.createGain();
            rainGain.gain.setValueAtTime(0.7, ctx.currentTime);

            noiseSource.connect(filter1);
            filter1.connect(filter2);
            filter2.connect(rainGain);
            rainGain.connect(masterGainNode);

            noiseSource.start();
            activeSynthNodes.push(noiseSource, filter1, filter2, rainGain);

        } else if (type === 'ocean') {
            // Brown/pink noise with oscillating surf swell LFO
            const noiseBuffer = createNoiseBuffer(ctx, 'pink');
            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, ctx.currentTime);

            const swellGain = ctx.createGain();
            swellGain.gain.setValueAtTime(0.3, ctx.currentTime);

            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.setValueAtTime(0.1, ctx.currentTime); // 10s wave period
            lfoGain.gain.setValueAtTime(0.35, ctx.currentTime);

            lfo.connect(swellGain.gain);
            lfo.connect(filter.frequency);

            noiseSource.connect(filter);
            filter.connect(swellGain);
            swellGain.connect(masterGainNode);

            noiseSource.start();
            lfo.start();
            activeSynthNodes.push(noiseSource, filter, swellGain, lfo, lfoGain);

        } else if (type === 'forest') {
            // Gentle ambient air + soft warm background
            const noiseBuffer = createNoiseBuffer(ctx, 'pink');
            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1400, ctx.currentTime);
            filter.Q.setValueAtTime(0.8, ctx.currentTime);

            const airGain = ctx.createGain();
            airGain.gain.setValueAtTime(0.25, ctx.currentTime);

            noiseSource.connect(filter);
            filter.connect(airGain);
            airGain.connect(masterGainNode);
            noiseSource.start();
            activeSynthNodes.push(noiseSource, filter, airGain);

            // Periodic ambient birds / chime notes
            const birdInterval = setInterval(() => {
                if (!musicPlaying) { clearInterval(birdInterval); return; }
                if (Math.random() > 0.4) {
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.type = 'sine';
                    const pitch = 2400 + Math.random() * 1200;
                    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(pitch + 400, ctx.currentTime + 0.12);
                    g.gain.setValueAtTime(0.05, ctx.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                    osc.connect(g);
                    g.connect(masterGainNode);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.25);
                }
            }, 1800);

        } else if (type === 'zen-bowl') {
            // Continuous singing bowl drone + periodic strikes
            const baseFreq = 216;
            [1, 2.76, 5.4].forEach((h, i) => {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(baseFreq * h, ctx.currentTime);
                g.gain.setValueAtTime(0.2 / (i + 1), ctx.currentTime);
                osc.connect(g);
                g.connect(masterGainNode);
                osc.start();
                activeSynthNodes.push(osc, g);
            });

        } else if (type === 'om-drone') {
            // Cosmic Om (136.1 Hz Earth / Om frequency) with lush detuned harmonics
            const omFreq = 136.1;
            const detunes = [-6, 0, 6, 12];
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(420, ctx.currentTime);

            const droneGain = ctx.createGain();
            droneGain.gain.setValueAtTime(0.35, ctx.currentTime);

            detunes.forEach(det => {
                const osc = ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(omFreq, ctx.currentTime);
                osc.detune.setValueAtTime(det, ctx.currentTime);
                osc.connect(filter);
                osc.start();
                activeSynthNodes.push(osc);
            });

            // Fifth harmonic (204.15 Hz)
            const fifthOsc = ctx.createOscillator();
            fifthOsc.type = 'sine';
            fifthOsc.frequency.setValueAtTime(omFreq * 1.5, ctx.currentTime);
            fifthOsc.connect(filter);
            fifthOsc.start();
            activeSynthNodes.push(fifthOsc);

            filter.connect(droneGain);
            droneGain.connect(masterGainNode);
            activeSynthNodes.push(filter, droneGain);

        } else if (type === 'focus' || type === 'binaural') {
            // Alpha wave binaural beats (200Hz Left, 210Hz Right -> 10Hz Alpha difference)
            const merger = ctx.createChannelMerger(2);
            const oscL = ctx.createOscillator();
            const oscR = ctx.createOscillator();

            oscL.type = 'sine';
            oscL.frequency.setValueAtTime(200, ctx.currentTime);
            oscR.type = 'sine';
            oscR.frequency.setValueAtTime(210, ctx.currentTime); // 10Hz Alpha

            const gainL = ctx.createGain();
            const gainR = ctx.createGain();
            gainL.gain.setValueAtTime(0.25, ctx.currentTime);
            gainR.gain.setValueAtTime(0.25, ctx.currentTime);

            oscL.connect(gainL);
            oscR.connect(gainR);
            gainL.connect(merger, 0, 0);
            gainR.connect(merger, 0, 1);
            merger.connect(masterGainNode);

            oscL.start();
            oscR.start();
            activeSynthNodes.push(oscL, oscR, gainL, gainR, merger);

        } else if (type === 'piano' || type === 'calm-piano') {
            // Warm ambient drone + gentle repeating pentatonic chords
            const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C D E G A C
            let noteIdx = 0;

            const pianoInterval = setInterval(() => {
                if (!musicPlaying) { clearInterval(pianoInterval); return; }
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(notes[noteIdx % notes.length], ctx.currentTime);
                g.gain.setValueAtTime(0.001, ctx.currentTime);
                g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
                g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.2);

                osc.connect(g);
                g.connect(masterGainNode);
                osc.start();
                osc.stop(ctx.currentTime + 3.5);
                noteIdx = (noteIdx + 1 + Math.floor(Math.random() * 2)) % notes.length;
            }, 1200);

            // Ambient bed
            const bedOsc = ctx.createOscillator();
            const bedGain = ctx.createGain();
            bedOsc.type = 'sine';
            bedOsc.frequency.setValueAtTime(130.81, ctx.currentTime);
            bedGain.gain.setValueAtTime(0.15, ctx.currentTime);
            bedOsc.connect(bedGain);
            bedGain.connect(masterGainNode);
            bedOsc.start();
            activeSynthNodes.push(bedOsc, bedGain);

        } else if (type === 'sleep' || type === 'delta') {
            // Deep Delta wave bed (108Hz carrier, 110Hz -> 2Hz Delta) + warm pink noise
            const noiseBuffer = createNoiseBuffer(ctx, 'pink');
            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(220, ctx.currentTime);

            const sleepGain = ctx.createGain();
            sleepGain.gain.setValueAtTime(0.3, ctx.currentTime);

            const deltaOsc = ctx.createOscillator();
            deltaOsc.type = 'sine';
            deltaOsc.frequency.setValueAtTime(108, ctx.currentTime);

            noiseSource.connect(filter);
            filter.connect(sleepGain);
            deltaOsc.connect(sleepGain);
            sleepGain.connect(masterGainNode);

            noiseSource.start();
            deltaOsc.start();
            activeSynthNodes.push(noiseSource, filter, deltaOsc, sleepGain);
        }
    }


    // =================================================================
    // GUIDED MEDITATION CONTROLLER
    // =================================================================
    const MEDITATION_SESSIONS = {
        "body-scan": {
            title: "🌿 Mindful Body Scan",
            defaultDuration: 2,
            icon: "🌿",
            steps: [
                "Sit or lie down in a comfortable, relaxed position.",
                "Close your eyes gently and take three slow, deep breaths.",
                "Notice any areas of tension in your body — from head to toe.",
                "With each calm exhale, let the tension soften and dissolve.",
                "When the completion bell sounds, open your eyes slowly."
            ]
        },
        "stress-relief": {
            title: "🧘 Deep Stress Relief",
            defaultDuration: 5,
            icon: "🧘",
            steps: [
                "Unclench your jaw, drop your shoulders, and relax your hands.",
                "Inhale gently through your nose for 4 counts.",
                "Hold the calm breath comfortably for 4 counts.",
                "Exhale slowly and completely for 6 counts.",
                "Feel a wave of peaceful stillness washing over your mind."
            ]
        },
        "morning-focus": {
            title: "🌅 Morning Clarity & Focus",
            defaultDuration: 5,
            icon: "🌅",
            steps: [
                "Sit upright with an alert, open posture.",
                "Bring your awareness to the present moment and the sensations of morning light.",
                "Set a gentle intention for how you wish to feel and act today.",
                "Breathe in clarity and purpose; breathe out distraction.",
                "Carry this centered calm into your day."
            ]
        },
        "evening-sleep": {
            title: "🌙 Evening Wind-Down",
            defaultDuration: 10,
            icon: "🌙",
            steps: [
                "Dim the lights and settle comfortably into bed or a restful chair.",
                "Acknowledge everything that happened today and give yourself permission to let it rest.",
                "Slow down your breathing, feeling your body grow heavy and peaceful.",
                "Allow each thought to drift away like clouds across the night sky.",
                "Rest deeply knowing you are safe."
            ]
        },
        "self-compassion": {
            title: "🕊️ Self-Compassion & Healing",
            defaultDuration: 5,
            icon: "🕊️",
            steps: [
                "Place a comforting hand gently over your heart.",
                "Silently say to yourself: 'May I be kind to myself in this moment.'",
                "Recognize that struggle and imperfection are part of our shared human experience.",
                "Breathe in warmth and acceptance for who you are right now.",
                "Let go of harsh judgments and embrace yourself with kindness."
            ]
        }
    };

    let currentMedSessionKey = "body-scan";
    let medMinutes           = 2;
    let medSeconds           = 120;
    let medTotalSeconds      = 120;
    let medInterval          = null;
    let medRunning           = false;
    let medPaused            = false;
    let medAmbientSound      = "none";
    let medVolume            = 0.7;

    const medTimerDisplayEl = document.getElementById("medTimerDisplay");
    const medTimerLabelEl   = document.getElementById("medTimerLabel");
    const medCircleEl       = document.getElementById("medCircle");
    const medSvgProgressEl  = document.getElementById("medSvgProgress");
    const medStartBtnEl     = document.getElementById("medStartBtn");
    const medPauseBtnEl     = document.getElementById("medPauseBtn");
    const medResumeBtnEl    = document.getElementById("medResumeBtn");
    const medResetBtnEl     = document.getElementById("medResetBtn");
    const medInstrTitleEl   = document.getElementById("medInstructionTitle");
    const medInstrStepsEl   = document.getElementById("medInstructionSteps");

    function medFormatTime(secs) {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    }

    function updateMedSvgRing(remainingSecs, totalSecs) {
        if (!medSvgProgressEl) return;
        const circumference = 2 * Math.PI * 90; // ~565.48
        const fraction = totalSecs > 0 ? (remainingSecs / totalSecs) : 0;
        const offset = circumference * (1 - fraction);
        medSvgProgressEl.style.strokeDashoffset = offset;
    }

    window.selectMeditationSession = function(sessionKey) {
        const session = MEDITATION_SESSIONS[sessionKey];
        if (!session) return;

        if (medRunning) {
            medReset();
        }

        currentMedSessionKey = sessionKey;

        // Update cards active UI
        document.querySelectorAll(".med-session-card").forEach(card => {
            card.classList.toggle("active", card.dataset.session === sessionKey);
        });

        // Update instructions
        if (medInstrTitleEl) medInstrTitleEl.textContent = session.title;
        if (medInstrStepsEl) {
            medInstrStepsEl.innerHTML = session.steps.map(step => `<li>${escapeHTMLSafe(step)}</li>`).join("");
        }

        // Set duration
        medSetDuration(session.defaultDuration);
    };

    function medSetDuration(min) {
        if (medRunning) return;
        medMinutes      = min;
        medTotalSeconds = min * 60;
        medSeconds      = medTotalSeconds;
        if (medTimerDisplayEl) medTimerDisplayEl.textContent = medFormatTime(medSeconds);
        if (medTimerLabelEl)   medTimerLabelEl.textContent   = "Ready";
        if (medCircleEl)       medCircleEl.classList.remove("running");
        updateMedSvgRing(medSeconds, medTotalSeconds);

        // Update duration buttons
        document.querySelectorAll(".med-dur-btn").forEach(btn => {
            btn.classList.toggle("active", parseInt(btn.dataset.min) === min);
        });
    }

    window.setMeditationAmbient = function(soundType) {
        medAmbientSound = soundType;
        document.querySelectorAll(".med-ambient-chip").forEach(chip => {
            chip.classList.toggle("active", chip.dataset.sound === soundType);
        });

        if (medRunning && !medPaused) {
            if (soundType !== "none") {
                startProceduralSoundscape(soundType);
            } else {
                stopAllSynthAudio();
            }
        }
    };

    window.setMeditationVolume = function(val) {
        medVolume = parseFloat(val);
        if (masterGainNode && audioCtx) {
            masterGainNode.gain.setValueAtTime(medVolume, audioCtx.currentTime);
        }
    };

    window.medStart = function() {
        if (medRunning && !medPaused) return;

        initAudioContext();
        medRunning = true;
        medPaused  = false;

        if (medCircleEl)    medCircleEl.classList.add("running");
        if (medStartBtnEl)  medStartBtnEl.style.display  = "none";
        if (medPauseBtnEl)  medPauseBtnEl.style.display  = "inline-block";
        if (medResumeBtnEl) medResumeBtnEl.style.display = "none";
        if (medResetBtnEl)  medResetBtnEl.style.display  = "inline-block";
        if (medTimerLabelEl) medTimerLabelEl.textContent = "Meditating…";

        // Play opening chime
        playSingingBowlChime(1.0);

        // Start ambient sound if selected
        if (medAmbientSound !== "none") {
            startProceduralSoundscape(medAmbientSound);
        }

        clearInterval(medInterval);
        medInterval = setInterval(function () {
            medSeconds--;
            if (medTimerDisplayEl) medTimerDisplayEl.textContent = medFormatTime(medSeconds);
            updateMedSvgRing(medSeconds, medTotalSeconds);

            const pct = medSeconds / medTotalSeconds;
            if (pct > 0.66) {
                if (medTimerLabelEl) medTimerLabelEl.textContent = "Settle in…";
            } else if (pct > 0.33) {
                if (medTimerLabelEl) medTimerLabelEl.textContent = "Breathing…";
            } else {
                if (medTimerLabelEl) medTimerLabelEl.textContent = "Returning…";
            }

            if (medSeconds <= 0) {
                clearInterval(medInterval);
                medRunning = false;
                medPaused  = false;
                stopAllSynthAudio();
                playSingingBowlChime(1.2); // Closing completion chime

                if (medCircleEl)     medCircleEl.classList.remove("running");
                if (medTimerLabelEl) medTimerLabelEl.textContent = "Complete! 🌿";
                if (medStartBtnEl) {
                    medStartBtnEl.style.display = "inline-block";
                    medStartBtnEl.textContent   = "▶ Start Again";
                }
                if (medPauseBtnEl)  medPauseBtnEl.style.display  = "none";
                if (medResumeBtnEl) medResumeBtnEl.style.display = "none";

                const session = MEDITATION_SESSIONS[currentMedSessionKey];
                const activityName = "Meditation: " + (session ? session.title : "Mindful Session") + " (" + medMinutes + "m)";
                markWellnessDone(activityName);
                showMessage("🧘 Meditation complete! Mindful awareness recorded.");
            }
        }, 1000);
    };

    window.medPause = function() {
        if (!medRunning || medPaused) return;
        clearInterval(medInterval);
        medPaused = true;
        stopAllSynthAudio();

        if (medCircleEl)    medCircleEl.classList.remove("running");
        if (medTimerLabelEl) medTimerLabelEl.textContent = "Paused";
        if (medPauseBtnEl)  medPauseBtnEl.style.display  = "none";
        if (medResumeBtnEl) medResumeBtnEl.style.display = "inline-block";
    };

    window.medResume = function() {
        if (!medRunning || !medPaused) return;
        medPaused = false;

        if (medCircleEl)    medCircleEl.classList.add("running");
        if (medTimerLabelEl) medTimerLabelEl.textContent = "Meditating…";
        if (medPauseBtnEl)  medPauseBtnEl.style.display  = "inline-block";
        if (medResumeBtnEl) medResumeBtnEl.style.display = "none";

        if (medAmbientSound !== "none") {
            startProceduralSoundscape(medAmbientSound);
        }

        medInterval = setInterval(function () {
            medSeconds--;
            if (medTimerDisplayEl) medTimerDisplayEl.textContent = medFormatTime(medSeconds);
            updateMedSvgRing(medSeconds, medTotalSeconds);

            const pct = medSeconds / medTotalSeconds;
            if (pct > 0.66) {
                if (medTimerLabelEl) medTimerLabelEl.textContent = "Settle in…";
            } else if (pct > 0.33) {
                if (medTimerLabelEl) medTimerLabelEl.textContent = "Breathing…";
            } else {
                if (medTimerLabelEl) medTimerLabelEl.textContent = "Returning…";
            }

            if (medSeconds <= 0) {
                clearInterval(medInterval);
                medRunning = false;
                medPaused  = false;
                stopAllSynthAudio();
                playSingingBowlChime(1.2);

                if (medCircleEl)     medCircleEl.classList.remove("running");
                if (medTimerLabelEl) medTimerLabelEl.textContent = "Complete! 🌿";
                if (medStartBtnEl) {
                    medStartBtnEl.style.display = "inline-block";
                    medStartBtnEl.textContent   = "▶ Start Again";
                }
                if (medPauseBtnEl)  medPauseBtnEl.style.display  = "none";
                if (medResumeBtnEl) medResumeBtnEl.style.display = "none";

                const session = MEDITATION_SESSIONS[currentMedSessionKey];
                const activityName = "Meditation: " + (session ? session.title : "Mindful Session") + " (" + medMinutes + "m)";
                markWellnessDone(activityName);
                showMessage("🧘 Meditation complete! Mindful awareness recorded.");
            }
        }, 1000);
    };

    window.medReset = function() {
        clearInterval(medInterval);
        medRunning = false;
        medPaused  = false;
        medSeconds = medTotalSeconds;
        stopAllSynthAudio();

        if (medCircleEl)       medCircleEl.classList.remove("running");
        if (medTimerDisplayEl) medTimerDisplayEl.textContent = medFormatTime(medSeconds);
        if (medTimerLabelEl)   medTimerLabelEl.textContent   = "Ready";
        updateMedSvgRing(medSeconds, medTotalSeconds);

        if (medStartBtnEl) {
            medStartBtnEl.style.display = "inline-block";
            medStartBtnEl.textContent   = "▶ Start Meditation";
        }
        if (medPauseBtnEl)  medPauseBtnEl.style.display  = "none";
        if (medResumeBtnEl) medResumeBtnEl.style.display = "none";
        if (medResetBtnEl)  medResetBtnEl.style.display  = "none";
    };

    // Wire up meditation events
    document.querySelectorAll(".med-dur-btn").forEach(btn => {
        btn.addEventListener("click", function () { medSetDuration(parseInt(btn.dataset.min)); });
    });
    if (medStartBtnEl)  medStartBtnEl.addEventListener("click", window.medStart);
    if (medPauseBtnEl)  medPauseBtnEl.addEventListener("click", window.medPause);
    if (medResumeBtnEl) medResumeBtnEl.addEventListener("click", window.medResume);
    if (medResetBtnEl)  medResetBtnEl.addEventListener("click", window.medReset);


    // =================================================================
    // CALMING MUSIC & SOUNDSCAPES CONTROLLER
    // =================================================================
    const MUSIC_PLAYLIST = [
        { id: 1, title: "Gentle Rain & Distant Thunder", category: "nature", icon: "🌧️", duration: "05:00", durationSec: 300, soundType: "rain", desc: "Soothing natural rainfall filter for deep peace." },
        { id: 2, title: "Ocean Waves & Coastal Breeze", category: "nature", icon: "🌊", duration: "05:00", durationSec: 300, soundType: "ocean", desc: "Rhythmic oceanic surf swells to release stress." },
        { id: 3, title: "Morning Forest Birds & Stream", category: "nature", icon: "🌲", duration: "05:00", durationSec: 300, soundType: "forest", desc: "Gentle woodland ambient with bird chimes." },
        { id: 4, title: "Tibetan Singing Bowl Resonance", category: "meditation", icon: "🧘", duration: "10:00", durationSec: 600, soundType: "zen-bowl", desc: "Harmonic bell frequencies for mental stillness." },
        { id: 5, title: "Cosmic Om Meditative Drone", category: "meditation", icon: "🕉️", duration: "10:00", durationSec: 600, soundType: "om-drone", desc: "136.1Hz Earth frequency harmonic chord." },
        { id: 6, title: "Binaural Alpha Waves (Focus)", category: "focus", icon: "🧠", duration: "08:00", durationSec: 480, soundType: "focus", desc: "10Hz differential stereo waves for concentration." },
        { id: 7, title: "Midnight Calm Lofi Piano", category: "focus", icon: "🎹", duration: "04:30", durationSec: 270, soundType: "piano", desc: "Gentle repetitive pentatonic melody for study." },
        { id: 8, title: "Deep Delta Sleep Soundscape", category: "sleep", icon: "🌙", duration: "15:00", durationSec: 900, soundType: "sleep", desc: "2Hz restorative brainwave sleep frequency." }
    ];

    let currentMusicTrackIdx = 0;
    let musicPlaying         = false;
    let musicCurrentSeconds  = 0;
    let musicTimerInterval   = null;
    let musicMasterVolume    = 0.8;
    let musicMuted           = false;
    let musicActiveCategory  = "all";
    let musicSearchQuery     = "";

    function musicFavoritesKey() {
        return currentUser ? "innerVoiceMusicFavs_" + currentUser.email : "innerVoiceMusicFavs_anon";
    }

    function getMusicFavorites() {
        try {
            return JSON.parse(localStorage.getItem(musicFavoritesKey()) || "[]");
        } catch (e) { return []; }
    }

    function isMusicFavorite(id) {
        return getMusicFavorites().includes(id);
    }

    window.toggleMusicFavorite = function(trackId, event) {
        if (event) event.stopPropagation();
        const favs = getMusicFavorites();
        const idx = favs.indexOf(trackId);
        if (idx >= 0) {
            favs.splice(idx, 1);
            showMessage("Removed from Favorites.");
        } else {
            favs.push(trackId);
            showMessage("❤️ Added to Favorites.");
        }
        try {
            localStorage.setItem(musicFavoritesKey(), JSON.stringify(favs));
        } catch (e) { /* non-fatal */ }
        renderMusicPlaylist();
        updatePlayerBarUI();
    };

    window.toggleCurrentMusicFavorite = function() {
        const track = MUSIC_PLAYLIST[currentMusicTrackIdx];
        if (track) {
            window.toggleMusicFavorite(track.id);
        }
    };

    window.filterMusicCategory = function(category) {
        musicActiveCategory = category;
        document.querySelectorAll(".music-chip").forEach(chip => {
            chip.classList.toggle("active", chip.dataset.cat === category);
        });
        renderMusicPlaylist();
    };

    window.onMusicSearch = function(query) {
        musicSearchQuery = (query || "").toLowerCase().trim();
        renderMusicPlaylist();
    };

    function renderMusicPlaylist() {
        const gridEl = document.getElementById("musicPlaylistGrid");
        if (!gridEl) return;

        const favs = getMusicFavorites();
        let filtered = MUSIC_PLAYLIST.filter(track => {
            // Category filter
            if (musicActiveCategory === "favorites") {
                if (!favs.includes(track.id)) return false;
            } else if (musicActiveCategory !== "all") {
                if (track.category !== musicActiveCategory) return false;
            }
            // Search filter
            if (musicSearchQuery) {
                const matchTitle = track.title.toLowerCase().includes(musicSearchQuery);
                const matchDesc = track.desc.toLowerCase().includes(musicSearchQuery);
                const matchCat = track.category.toLowerCase().includes(musicSearchQuery);
                if (!matchTitle && !matchDesc && !matchCat) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            gridEl.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:36px 16px; color:#9ca3af;">
                    <div style="font-size:32px; margin-bottom:8px;">🎵</div>
                    <p style="font-size:15px; font-weight:600; color:#4b5563;">No soundscapes found</p>
                    <p style="font-size:13px;">Try adjusting your search or category filter.</p>
                </div>
            `;
            return;
        }

        gridEl.innerHTML = filtered.map(track => {
            const isPlayingThis = musicPlaying && currentMusicTrackIdx === MUSIC_PLAYLIST.findIndex(t => t.id === track.id);
            const isFav = favs.includes(track.id);
            const originalIndex = MUSIC_PLAYLIST.findIndex(t => t.id === track.id);

            return `
                <div class="music-card ${isPlayingThis ? 'playing' : ''}" id="music-card-${track.id}" onclick="playMusicTrack(${originalIndex})">
                    <div class="music-card-header">
                        <div class="music-icon-wrap">${track.icon}</div>
                        <button type="button" class="music-fav-btn ${isFav ? 'favorited' : ''}" onclick="toggleMusicFavorite(${track.id}, event)" title="Favorite">
                            ${isFav ? '❤️' : '🤍'}
                        </button>
                    </div>
                    <div>
                        <h4 class="music-card-title">${escapeHTMLSafe(track.title)}</h4>
                        <div class="music-card-cat">${escapeHTMLSafe(track.category.toUpperCase())} · ${escapeHTMLSafe(track.desc)}</div>
                    </div>
                    <div class="music-card-footer">
                        <span class="music-card-dur">⏱️ ${track.duration}</span>
                        <button type="button" class="music-card-play-btn" title="${isPlayingThis ? 'Pause' : 'Play'}">
                            ${isPlayingThis ? '⏸' : '▶'}
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    }

    function updatePlayerBarUI() {
        const track = MUSIC_PLAYLIST[currentMusicTrackIdx];
        if (!track) return;

        const iconEl   = document.getElementById("playerTrackIcon");
        const titleEl  = document.getElementById("playerTrackTitle");
        const subEl    = document.getElementById("playerTrackSub");
        const playBtn  = document.getElementById("playerPlayBtn");
        const favBtn   = document.getElementById("playerFavBtn");
        const curTimeEl= document.getElementById("musicCurrentTime");
        const durTimeEl= document.getElementById("musicDuration");
        const seekEl   = document.getElementById("musicSeekSlider");

        if (iconEl)  iconEl.textContent  = track.icon;
        if (titleEl) titleEl.textContent = track.title;
        if (subEl)   subEl.textContent   = `${track.category.toUpperCase()} · ${musicPlaying ? 'Playing' : 'Paused'}`;
        if (playBtn) playBtn.textContent = musicPlaying ? "⏸" : "▶";
        if (favBtn)  favBtn.textContent  = isMusicFavorite(track.id) ? "❤️" : "🤍";

        if (curTimeEl) curTimeEl.textContent = medFormatTime(musicCurrentSeconds);
        if (durTimeEl) durTimeEl.textContent = track.duration;

        if (seekEl) {
            const pct = (musicCurrentSeconds / track.durationSec) * 100;
            seekEl.value = Math.min(100, Math.max(0, pct));
        }
    }

    window.playMusicTrack = function(index) {
        if (index < 0 || index >= MUSIC_PLAYLIST.length) return;

        // If clicking same track that's already playing, toggle pause
        if (currentMusicTrackIdx === index && musicPlaying) {
            window.pauseMusicTrack();
            return;
        }

        currentMusicTrackIdx = index;
        const track = MUSIC_PLAYLIST[currentMusicTrackIdx];

        initAudioContext();
        stopAllSynthAudio();

        musicPlaying = true;
        musicCurrentSeconds = 0;

        startProceduralSoundscape(track.soundType);

        clearInterval(musicTimerInterval);
        musicTimerInterval = setInterval(() => {
            musicCurrentSeconds++;
            if (musicCurrentSeconds >= track.durationSec) {
                // Loop or go to next
                musicCurrentSeconds = 0;
                markWellnessDone("Soundscape: " + track.title);
            }
            updatePlayerBarUI();
        }, 1000);

        updatePlayerBarUI();
        renderMusicPlaylist();
    };

    window.pauseMusicTrack = function() {
        if (!musicPlaying) return;
        musicPlaying = false;
        clearInterval(musicTimerInterval);
        stopAllSynthAudio();
        updatePlayerBarUI();
        renderMusicPlaylist();
    };

    window.resumeMusicTrack = function() {
        if (musicPlaying) return;
        const track = MUSIC_PLAYLIST[currentMusicTrackIdx];
        if (!track) return;

        initAudioContext();
        musicPlaying = true;
        startProceduralSoundscape(track.soundType);

        clearInterval(musicTimerInterval);
        musicTimerInterval = setInterval(() => {
            musicCurrentSeconds++;
            if (musicCurrentSeconds >= track.durationSec) {
                musicCurrentSeconds = 0;
                markWellnessDone("Soundscape: " + track.title);
            }
            updatePlayerBarUI();
        }, 1000);

        updatePlayerBarUI();
        renderMusicPlaylist();
    };

    window.toggleMusicPlay = function() {
        if (musicPlaying) {
            window.pauseMusicTrack();
        } else {
            window.resumeMusicTrack();
        }
    };

    window.nextMusicTrack = function() {
        const nextIdx = (currentMusicTrackIdx + 1) % MUSIC_PLAYLIST.length;
        window.playMusicTrack(nextIdx);
    };

    window.prevMusicTrack = function() {
        const prevIdx = (currentMusicTrackIdx - 1 + MUSIC_PLAYLIST.length) % MUSIC_PLAYLIST.length;
        window.playMusicTrack(prevIdx);
    };

    window.stopMusicTrack = function() {
        window.pauseMusicTrack();
        musicCurrentSeconds = 0;
        updatePlayerBarUI();
    };

    window.seekMusicTrack = function(val) {
        const track = MUSIC_PLAYLIST[currentMusicTrackIdx];
        if (!track) return;
        const pct = parseFloat(val) / 100;
        musicCurrentSeconds = Math.round(pct * track.durationSec);
        updatePlayerBarUI();
    };

    window.setMusicVolume = function(val) {
        musicMasterVolume = parseFloat(val);
        if (!musicMuted && masterGainNode && audioCtx) {
            masterGainNode.gain.setValueAtTime(musicMasterVolume, audioCtx.currentTime);
        }
        const muteBtn = document.getElementById("musicMuteBtn");
        if (muteBtn) muteBtn.textContent = musicMasterVolume === 0 ? "🔇" : "🔊";
    };

    window.toggleMusicMute = function() {
        musicMuted = !musicMuted;
        const muteBtn = document.getElementById("musicMuteBtn");
        if (masterGainNode && audioCtx) {
            masterGainNode.gain.setValueAtTime(musicMuted ? 0 : musicMasterVolume, audioCtx.currentTime);
        }
        if (muteBtn) muteBtn.textContent = musicMuted ? "🔇" : "🔊";
    };

    // Initial render for music playlist
    renderMusicPlaylist();
    updatePlayerBarUI();


    // ── BREATHING GUIDE ───────────────────────────────────────────────
    // Technique definitions: array of { label, seconds }
    var BREATH_TECHNIQUES = {
        "478": {
            name: "4-7-8 Breathing",
            desc: "<strong>4-7-8 Breathing</strong> \u2014 Inhale 4s \u00b7 Hold 7s \u00b7 Exhale 8s. Calms the nervous system quickly.",
            phases: [
                { label: "Inhale",  secs: 4,  scale: 1.35 },
                { label: "Hold",    secs: 7,  scale: 1.35 },
                { label: "Exhale",  secs: 8,  scale: 1.0  }
            ]
        },
        "box": {
            name: "Box Breathing",
            desc: "<strong>Box Breathing</strong> \u2014 Inhale 4s \u00b7 Hold 4s \u00b7 Exhale 4s \u00b7 Hold 4s. Builds calm focus.",
            phases: [
                { label: "Inhale",  secs: 4,  scale: 1.35 },
                { label: "Hold",    secs: 4,  scale: 1.35 },
                { label: "Exhale",  secs: 4,  scale: 1.0  },
                { label: "Hold",    secs: 4,  scale: 1.0  }
            ]
        },
        "44": {
            name: "4-4 Breathing",
            desc: "<strong>4-4 Breathing</strong> \u2014 Inhale 4s \u00b7 Exhale 4s. Simple and beginner-friendly.",
            phases: [
                { label: "Inhale",  secs: 4,  scale: 1.35 },
                { label: "Exhale",  secs: 4,  scale: 1.0  }
            ]
        }
    };

    var breathTechnique   = "478";
    var breathPhaseIdx    = 0;
    var breathPhaseSecond = 0;
    var breathCycles      = 0;
    var breathTimer       = null;
    var breathRunning     = false;

    var breathCircleEl    = document.getElementById("breathCircle");
    var breathOuterEl     = document.getElementById("breathOuterRing");
    var breathPhaseEl     = document.getElementById("breathPhaseLabel");
    var breathCountdownEl = document.getElementById("breathCountdown");
    var breathCycleEl     = document.getElementById("breathCycleCount");
    var breathStartBtnEl  = document.getElementById("breathStartBtn");
    var breathStopBtnEl   = document.getElementById("breathStopBtn");
    var breathDescTextEl  = document.getElementById("breathDescText");

    function breathSelectTechnique(key) {
        if (breathRunning) breathStop();
        breathTechnique = key;
        document.querySelectorAll(".breath-sel-btn").forEach(function (b) {
            b.classList.toggle("active", b.dataset.technique === key);
        });
        if (breathDescTextEl && BREATH_TECHNIQUES[key]) {
            breathDescTextEl.innerHTML = BREATH_TECHNIQUES[key].desc;
        }
        if (breathPhaseEl)    breathPhaseEl.textContent    = "Press Start";
        if (breathCountdownEl) breathCountdownEl.textContent = "";
        if (breathCycleEl)    breathCycleEl.textContent    = "Cycles: 0";
        breathCycles = 0;
        breathPhaseIdx = 0;
        breathPhaseSecond = 0;
        // Reset circle size
        if (breathCircleEl) breathCircleEl.style.transform = "scale(1)";
        if (breathOuterEl)  breathOuterEl.style.transform  = "scale(1)";
    }

    function breathTick() {
        var tech   = BREATH_TECHNIQUES[breathTechnique];
        var phases = tech.phases;
        var phase  = phases[breathPhaseIdx];

        var secsLeft = phase.secs - breathPhaseSecond;

        if (breathPhaseEl)     breathPhaseEl.textContent    = phase.label;
        if (breathCountdownEl) breathCountdownEl.textContent = secsLeft;

        // Animate scale smoothly
        var progress = breathPhaseSecond / phase.secs;
        var scale;
        if (phase.label === "Inhale") {
            scale = 1.0 + (phase.scale - 1.0) * progress;
        } else if (phase.label === "Exhale") {
            scale = phase.scale + (1.0 - phase.scale) * progress;
        } else {
            scale = phase.scale; // Hold
        }
        if (breathCircleEl) breathCircleEl.style.transform = "scale(" + scale.toFixed(3) + ")";
        if (breathOuterEl)  breathOuterEl.style.transform  = "scale(" + (1 + (scale - 1) * 0.4).toFixed(3) + ")";

        breathPhaseSecond++;

        if (breathPhaseSecond >= phase.secs) {
            breathPhaseSecond = 0;
            breathPhaseIdx++;
            if (breathPhaseIdx >= phases.length) {
                breathPhaseIdx = 0;
                breathCycles++;
                if (breathCycleEl) breathCycleEl.textContent = "Cycles: " + breathCycles;
                if (breathCycles === 3) {
                    // Auto-mark done after 3 cycles
                    markWellnessDone(tech.name);
                }
            }
        }
    }

    function breathStart() {
        if (breathRunning) return;
        breathRunning     = true;
        breathPhaseIdx    = 0;
        breathPhaseSecond = 0;
        breathCycles      = 0;
        if (breathStartBtnEl) breathStartBtnEl.style.display = "none";
        if (breathStopBtnEl)  breathStopBtnEl.style.display  = "inline-block";
        breathTimer = setInterval(breathTick, 1000);
        breathTick(); // immediate first tick
    }

    function breathStop() {
        clearInterval(breathTimer);
        breathRunning = false;
        if (breathStartBtnEl) breathStartBtnEl.style.display = "inline-block";
        if (breathStopBtnEl)  breathStopBtnEl.style.display  = "none";
        if (breathPhaseEl)    breathPhaseEl.textContent    = "Press Start";
        if (breathCountdownEl) breathCountdownEl.textContent = "";
        if (breathCircleEl)   breathCircleEl.style.transform = "scale(1)";
        if (breathOuterEl)    breathOuterEl.style.transform  = "scale(1)";
    }

    document.querySelectorAll(".breath-sel-btn").forEach(function (btn) {
        btn.addEventListener("click", function () { breathSelectTechnique(btn.dataset.technique); });
    });
    if (breathStartBtnEl) breathStartBtnEl.addEventListener("click", breathStart);
    if (breathStopBtnEl)  breathStopBtnEl.addEventListener("click", breathStop);


    // ── RELAXATION CARD TOGGLES ──────────────────────────────────────
    document.querySelectorAll(".relax-toggle-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var cardNum  = btn.dataset.card;
            var bodyEl   = document.getElementById("relaxBody" + cardNum);
            var isOpen   = bodyEl && bodyEl.style.display !== "none";
            if (bodyEl) bodyEl.style.display = isOpen ? "none" : "block";
            btn.textContent = isOpen ? "Show exercise \u2193" : "Hide exercise \u2191";
        });
    });


    // ── POSITIVE QUOTES ───────────────────────────────────────────────
    var QUOTES = [
        { text: "You don't have to be positive all the time. It's perfectly okay to feel sad, angry, annoyed, frustrated, scared and anxious.", author: "Lori Deschene" },
        { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
        { text: "You are enough, just as you are.", author: "Meghan Markle" },
        { text: "The present moment always will have been.", author: "Eckhart Tolle" },
        { text: "Be gentle with yourself. You are a child of the universe, no less than the trees and the stars.", author: "Max Ehrmann" },
        { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
        { text: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne" },
        { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott" },
        { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
        { text: "Growth is the only evidence of life.", author: "John Henry Newman" },
        { text: "Self-care is not self-indulgence. It is self-preservation.", author: "Audre Lorde" },
        { text: "You have been criticizing yourself for years and it hasn't worked. Try approving of yourself and see what happens.", author: "Louise L. Hay" },
        { text: "The most common form of despair is not being who you are.", author: "Soren Kierkegaard" },
        { text: "It's okay to not be okay, as long as you are not giving up.", author: "Karen Salmansohn" },
        { text: "Every day may not be good… but there's something good in every day.", author: "Alice Morse Earle" },
        { text: "Nothing is permanent. Don't stress yourself too much, because no matter how bad the situation is, it will change.", author: "Unknown" },
        { text: "You matter. Your feelings matter. Your story matters.", author: "INNERVOICE" },
        { text: "Rest when you're weary. Refresh and renew yourself, your body, your mind, your spirit.", author: "Ralph Marston" },
        { text: "The act of taking the first step is what separates the winners from the losers.", author: "Brian Tracy" },
        { text: "Sometimes the most productive thing you can do is rest.", author: "Mark Black" }
    ];

    var currentQuoteIdx = 0;

    function showQuote(idx) {
        var quoteTextEl   = document.getElementById("quoteText");
        var quoteAuthorEl = document.getElementById("quoteAuthor");
        var quoteCardEl   = document.getElementById("quoteCard");

        if (!quoteTextEl) return;

        if (quoteCardEl) { quoteCardEl.style.opacity = "0"; }

        setTimeout(function () {
            currentQuoteIdx  = ((idx % QUOTES.length) + QUOTES.length) % QUOTES.length;
            var q            = QUOTES[currentQuoteIdx];
            if (quoteTextEl)   quoteTextEl.textContent   = q.text;
            if (quoteAuthorEl) quoteAuthorEl.textContent = "\u2014 " + q.author;
            if (quoteCardEl)   quoteCardEl.style.opacity = "1";
        }, 200);
    }

    // Seed first quote based on day-of-year for variety
    var dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    showQuote(dayOfYear % QUOTES.length);

    var newQuoteBtnEl  = document.getElementById("newQuoteBtn");
    var quoteShareBtn  = document.getElementById("quoteShareBtn");
    var quoteCopiedEl  = document.getElementById("quoteCopied");

    if (newQuoteBtnEl) {
        newQuoteBtnEl.addEventListener("click", function () {
            showQuote(currentQuoteIdx + 1);
        });
    }

    if (quoteShareBtn) {
        quoteShareBtn.addEventListener("click", function () {
            var q = QUOTES[currentQuoteIdx];
            var text = "\u201c" + q.text + "\u201d \u2014 " + q.author;
            try {
                navigator.clipboard.writeText(text).then(function () {
                    if (quoteCopiedEl) {
                        quoteCopiedEl.style.display = "block";
                        setTimeout(function () { quoteCopiedEl.style.display = "none"; }, 2500);
                    }
                }).catch(function () { /* clipboard not available */ });
            } catch (e) { /* non-fatal */ }
        });
    }


    // ── DAILY WELLNESS TIPS ───────────────────────────────────────────
    var TIPS = [
        { icon: "\uD83D\uDCAA", title: "Move your body for 10 minutes", body: "A short walk, gentle stretching, or dancing to one song can shift your mood and energy significantly. You don't need a full workout.", category: "Movement" },
        { icon: "\uD83D\uDCA7", title: "Drink a glass of water right now", body: "Mild dehydration affects concentration and mood. Keep a water bottle visible as a simple reminder to stay hydrated throughout the day.", category: "Physical Health" },
        { icon: "\uD83D\uDCA4", title: "Protect your sleep tonight", body: "Put your phone away 30 minutes before bed. The blue light suppresses melatonin. Try reading or gentle stretching instead.", category: "Sleep" },
        { icon: "\uD83E\uDD1D", title: "Reach out to one person today", body: "Send a message to someone you haven't spoken to recently — even a simple \"thinking of you\" can strengthen connections and lift both of your moods.", category: "Connection" },
        { icon: "\u270F\uFE0F", title: "Write three things you're grateful for", body: "Gratitude practice trains the brain to notice positives. They don't need to be big — a good cup of tea counts.", category: "Mindset" },
        { icon: "\u23F8\uFE0F", title: "Take a 5-minute break every hour", body: "Stand up, stretch, look away from your screen, and take five slow breaths. Regular microbreaks improve focus and reduce burnout.", category: "Productivity" },
        { icon: "\uD83C\uDF3F", title: "Spend time in nature today", body: "Even 10 minutes outdoors — in a garden, park, or just near a window with sunlight — can reduce cortisol levels and improve mood.", category: "Nature" },
        { icon: "\uD83C\uDFB5", title: "Listen to music that uplifts you", body: "Curate a playlist of songs that make you feel energised or calm. Music is one of the most effective and accessible mood regulators.", category: "Mood" },
        { icon: "\uD83D\uDE4F", title: "Practice self-compassion today", body: "When you notice self-critical thoughts, ask: 'Would I say this to a friend?' Offer yourself the same kindness you would offer someone you care about.", category: "Mindset" },
        { icon: "\uD83C\uDF7D\uFE0F", title: "Eat one nourishing meal mindfully", body: "Put away your phone during one meal today. Eat slowly, notice flavours, and let your body register fullness. Mindful eating supports both digestion and satisfaction.", category: "Nourishment" },
        { icon: "\uD83D\uDCDA", title: "Read for 15 minutes", body: "Reading fiction especially has been shown to increase empathy and reduce stress. Any genre you enjoy works — this is self-care, not homework.", category: "Rest" },
        { icon: "\uD83E\uDDE0", title: "Notice your thoughts without judging them", body: "You are not your thoughts. They are just mental events. When a difficult thought arises, try saying: 'I notice I'm thinking...' — it creates helpful distance.", category: "Mindfulness" },
        { icon: "\uD83D\uDEBF", title: "Take a warm shower or bath", body: "Warmth relaxes muscles, activates the parasympathetic nervous system, and is associated with feelings of social warmth. A simple act of physical self-care.", category: "Self-Care" },
        { icon: "\uD83D\uDCDD", title: "Write down one worry — then set it aside", body: "Externalising a worry onto paper reduces its power over your thoughts. After writing it down, close the notebook. You've acknowledged it — now give yourself permission to rest.", category: "Emotional Health" },
        { icon: "\uD83C\uDF1F", title: "Celebrate one small win today", body: "Did you get up? Send a difficult message? Drink enough water? That counts. Acknowledge your small efforts — they add up to real progress.", category: "Motivation" }
    ];

    var currentTipIdx = 0;

    function showTip(idx) {
        var tipTitleEl    = document.getElementById("tipTitle");
        var tipBodyEl     = document.getElementById("tipBody");
        var tipIconEl     = document.getElementById("tipIcon");
        var tipCategoryEl = document.getElementById("tipCategory");
        var tipCardEl     = document.getElementById("tipCard");

        if (!tipTitleEl) return;

        currentTipIdx = ((idx % TIPS.length) + TIPS.length) % TIPS.length;
        var tip       = TIPS[currentTipIdx];

        if (tipCardEl) { tipCardEl.style.opacity = "0"; }
        setTimeout(function () {
            if (tipIconEl)     tipIconEl.textContent     = tip.icon;
            if (tipTitleEl)    tipTitleEl.textContent    = tip.title;
            if (tipBodyEl)     tipBodyEl.textContent     = tip.body;
            if (tipCategoryEl) tipCategoryEl.textContent = tip.category;
            if (tipCardEl)     tipCardEl.style.opacity   = "1";
        }, 180);
    }

    // Seed daily tip by day-of-year (consistent within same day)
    showTip(dayOfYear % TIPS.length);

    var nextTipBtnEl = document.getElementById("nextTipBtn");
    var tipDoneBtnEl = document.getElementById("tipDoneBtn");

    if (nextTipBtnEl) {
        nextTipBtnEl.addEventListener("click", function () {
            showTip(currentTipIdx + 1);
            // Reset done button if user browses to a new tip
            if (tipDoneBtnEl) {
                tipDoneBtnEl.textContent  = "Mark as done \u2713";
                tipDoneBtnEl.classList.remove("done");
                tipDoneBtnEl.disabled = false;
            }
        });
    }


    /* =====================================================
       21. NOTIFICATIONS & REMINDERS
       - In-app reminder generation & persistence
       - Unread badge counter & panel dropdown
       - Mark as read, mark all, delete
       - Direct activity navigation
    ===================================================== */

    function formatNotifTime(dateStr) {
        if (!dateStr) return "Today";
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now - date;
            const diffMin = Math.floor(diffMs / 60000);
            const diffHr = Math.floor(diffMin / 60);

            if (diffMin < 1) return "Just now";
            if (diffMin < 60) return diffMin + "m ago";
            if (diffHr < 24) return diffHr + "h ago";
            return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        } catch (e) {
            return "Recently";
        }
    }

    window.loadDropdownNotificationsLegacy = async function () {
        const notifBadge = document.getElementById("notifBadge");
        const notifList  = document.getElementById("notifList");
        const token = getToken();

        if (!token || !currentUser) {
            if (notifBadge) notifBadge.style.display = "none";
            if (notifList) {
                notifList.innerHTML = `
                    <div style="padding:28px 16px; text-align:center; color:#9ca3af; font-size:13px;">
                        <p>Please login to view notifications.</p>
                    </div>
                `;
            }
            return;
        }

        try {
            const res = await fetch(BACKEND_URL + "/api/notifications", {
                headers: { "Authorization": "Bearer " + token }
            });

            const data = await res.json();

            if (data.success) {
                const unreadCount = data.unreadCount || 0;
                if (notifBadge) {
                    if (unreadCount > 0) {
                        notifBadge.textContent = unreadCount > 99 ? "99+" : unreadCount;
                        notifBadge.style.display = "block";
                    } else {
                        notifBadge.style.display = "none";
                    }
                }

                if (notifList) {
                    if (!data.notifications || data.notifications.length === 0) {
                        notifList.innerHTML = `
                            <div style="padding:28px 16px; text-align:center; color:#9ca3af; font-size:13px;">
                                <div style="font-size:24px; margin-bottom:6px;">🌿</div>
                                <strong style="color:#4b5563;">You're all caught up!</strong>
                                <p style="margin-top:4px; font-size:12px; color:#9ca3af;">No pending reminders right now.</p>
                            </div>
                        `;
                        return;
                    }

                    notifList.innerHTML = data.notifications.map(function (n) {
                        const isUnread = !n.is_read || n.is_read === 0;
                        const icon = n.icon || "🔔";
                        const timeText = formatNotifTime(n.created_at);

                        return `
                            <div id="notif-item-${n.id}" class="notif-item" style="
                                padding: 12px 16px;
                                border-bottom: 1px solid #f3f4f6;
                                background: ${isUnread ? '#f8faff' : '#ffffff'};
                                display: flex;
                                gap: 12px;
                                align-items: flex-start;
                                transition: background 0.15s ease;
                                position: relative;
                            ">
                                <span style="font-size: 20px; line-height: 1.2; margin-top: 2px;">${icon}</span>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                                        <strong style="font-size: 13px; color: ${isUnread ? '#1e1b4b' : '#374151'}; font-weight: 700;">
                                            ${escapeHTMLSafe(n.title)}
                                        </strong>
                                        ${isUnread ? '<span style="display:inline-block; width:7px; height:7px; background:#6c63ff; border-radius:50%; flex-shrink:0;"></span>' : ''}
                                    </div>
                                    <p style="font-size: 12px; color: #4b5563; margin: 4px 0 6px; line-height: 1.4;">
                                        ${escapeHTMLSafe(n.message)}
                                    </p>
                                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #9ca3af;">
                                        <span>${timeText}</span>
                                        <div style="display: flex; gap: 8px; align-items: center;">
                                            ${n.link ? `<a href="${n.link}" onclick="window.handleNotifAction(${n.id}, '${n.link}')" style="color:#6c63ff; font-weight:600; text-decoration:none; font-size:11px;">Open →</a>` : ''}
                                            ${isUnread ? `<button type="button" onclick="window.markNotifRead(${n.id})" style="background:none; border:none; color:#10b981; cursor:pointer; padding:0; margin:0; width:auto; font-size:11px; font-weight:600;">✓ Read</button>` : ''}
                                            <button type="button" onclick="window.deleteNotif(${n.id})" title="Delete reminder" style="background:none; border:none; color:#9ca3af; cursor:pointer; padding:0; margin:0; width:auto; font-size:11px;">✕</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join("");
                }
            }
        } catch (err) {
            console.warn("Could not load notifications from backend", err);
        }
    };

    window.markNotifRead = async function (notifId) {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(BACKEND_URL + "/api/notifications/" + notifId + "/read", {
                method: "PUT",
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success) {
                await window.loadDropdownNotificationsLegacy();
            }
        } catch (err) {
            console.warn("Could not mark notification read", err);
        }
    };

    window.markAllNotifsRead = async function () {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(BACKEND_URL + "/api/notifications/read-all", {
                method: "PUT",
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success) {
                await window.loadDropdownNotificationsLegacy();
            }
        } catch (err) {
            console.warn("Could not mark all notifications read", err);
        }
    };

    window.deleteNotif = async function (notifId) {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(BACKEND_URL + "/api/notifications/" + notifId, {
                method: "DELETE",
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success) {
                await window.loadDropdownNotificationsLegacy();
            }
        } catch (err) {
            console.warn("Could not delete notification", err);
        }
    };

    window.handleNotifAction = async function (notifId, link) {
        await window.markNotifRead(notifId);
        const dropdown = document.getElementById("notifDropdown");
        if (dropdown) dropdown.style.display = "none";
        if (link && link.startsWith("#")) {
            const target = document.querySelector(link);
            if (target) {
                target.scrollIntoView({ behavior: "smooth" });
            }
        }
    };

    // Wire up Bell Button & Dropdown Toggle
    const notifBellBtn = document.getElementById("notifBellBtn");
    const notifDropdown = document.getElementById("notifDropdown");
    const markAllNotifsBtn = document.getElementById("markAllNotifsBtn");

    notifBellBtn?.addEventListener("click", function (e) {
        e.stopPropagation();
        if (!currentUser) {
            showMessage("Please login to view notifications.");
            document.querySelector("#login")?.scrollIntoView({ behavior: "smooth" });
            return;
        }
        if (notifDropdown) {
            const isShown = notifDropdown.style.display === "block";
            notifDropdown.style.display = isShown ? "none" : "block";
            if (!isShown) {
                window.loadDropdownNotificationsLegacy();
            }
        }
    });

    markAllNotifsBtn?.addEventListener("click", function (e) {
        e.stopPropagation();
        window.markAllNotifsRead();
    });

    document.addEventListener("click", function (e) {
        if (notifDropdown && notifDropdown.style.display === "block") {
            if (!notifDropdown.contains(e.target) && e.target !== notifBellBtn) {
                notifDropdown.style.display = "none";
            }
        }
    });


    /* =====================================================
       22. EMERGENCY HELP & CRISIS SUPPORT MODAL
       - Open / Close emergency modal
       - Smooth accessibility and backdrop click dismiss
       - ESC key to close
    ===================================================== */

    window.openEmergencyModal = function () {
        const modal = document.getElementById("emergencyModal");
        if (modal) {
            modal.style.display = "flex";
            document.body.style.overflow = "hidden";
        }
    };

    window.closeEmergencyModal = function () {
        const modal = document.getElementById("emergencyModal");
        if (modal) {
            modal.style.display = "none";
            document.body.style.overflow = "";
        }
    };

    // Close on backdrop click
    const emergencyModal = document.getElementById("emergencyModal");
    if (emergencyModal) {
        emergencyModal.addEventListener("click", function (e) {
            if (e.target === emergencyModal) {
                window.closeEmergencyModal();
            }
        });
    }

    // Close on Escape key press
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            const emergencyModal = document.getElementById("emergencyModal");
            if (emergencyModal && emergencyModal.style.display === "flex") {
                window.closeEmergencyModal();
            }
            const notifDropdown = document.getElementById("notifDropdown");
            if (notifDropdown && notifDropdown.style.display === "block") {
                notifDropdown.style.display = "none";
            }
        }
    });

    /* =====================================================
       NEW FEATURES (Added)
    ===================================================== */
    
    // 1. VOICE JOURNAL
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        const startVoiceJournalBtn = document.getElementById("startVoiceJournalBtn");
        const stopVoiceJournalBtn = document.getElementById("stopVoiceJournalBtn");
        const voiceJournalText = document.getElementById("voiceJournalText");
        const voiceJournalStatus = document.getElementById("voiceJournalStatus");
        const saveVoiceJournalBtn = document.getElementById("saveVoiceJournalBtn");
        const voiceJournalHistoryList = document.getElementById("voiceJournalHistoryList");
        
        let finalTranscript = '';
        
        startVoiceJournalBtn?.addEventListener("click", () => {
            finalTranscript = '';
            voiceJournalText.value = '';
            recognition.start();
            startVoiceJournalBtn.style.display = 'none';
            stopVoiceJournalBtn.style.display = 'inline-block';
            voiceJournalStatus.textContent = 'Listening...';
        });
        
        stopVoiceJournalBtn?.addEventListener("click", () => {
            recognition.stop();
            startVoiceJournalBtn.style.display = 'inline-block';
            stopVoiceJournalBtn.style.display = 'none';
            voiceJournalStatus.textContent = 'Recording stopped.';
        });
        
        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            voiceJournalText.value = finalTranscript + interimTranscript;
        };
        
        saveVoiceJournalBtn?.addEventListener("click", async () => {
            const token = localStorage.getItem("innerVoiceToken");
            const text = voiceJournalText.value.trim();
            if (!token || !text) {
                showMessage("Please log in and speak something to save.");
                return;
            }
            try {
                saveVoiceJournalBtn.disabled = true;
                const res = await fetch(BACKEND_URL + "/api/voice-journals", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                    body: JSON.stringify({ transcript: text })
                });
                const data = await res.json();
                if (data.success) {
                    showMessage("Voice journal saved!");
                    voiceJournalText.value = '';
                    finalTranscript = '';
                    voiceJournalStatus.textContent = '';
                    window.loadVoiceJournals();
                } else {
                    showMessage(data.message);
                }
            } catch (err) {
                console.error(err);
            } finally {
                saveVoiceJournalBtn.disabled = false;
            }
        });
        
        window.loadVoiceJournals = async function() {
            const token = localStorage.getItem("innerVoiceToken");
            if(!token || !voiceJournalHistoryList) return;
            try {
                const res = await fetch(BACKEND_URL + "/api/voice-journals", {
                    headers: { "Authorization": "Bearer " + token }
                });
                const data = await res.json();
                if (data.success && data.journals) {
                    voiceJournalHistoryList.innerHTML = data.journals.map(j => `
                        <div style="background: #f9fafb; padding: 15px; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid #6c63ff;">
                            <p style="font-size: 14px; margin-bottom: 5px;">${escapeHTMLSafe(j.transcript)}</p>
                            <small style="color: #9ca3af;">${new Date(j.created_at).toLocaleString()}</small>
                        </div>
                    `).join("");
                }
            } catch (e) {
                console.error(e);
            }
        };
    } else {
        const btn = document.getElementById("startVoiceJournalBtn");
        if(btn) btn.textContent = "Speech Recognition Not Supported";
    }

    // 2. EMOTION PATTERNS
    const triggerMoodSelect = document.getElementById("triggerMoodSelect");
    const triggerInput = document.getElementById("triggerInput");
    const saveTriggerBtn = document.getElementById("saveTriggerBtn");
    
    window.loadMoodsForTrigger = async function() {
        const token = localStorage.getItem("innerVoiceToken");
        if(!token || !triggerMoodSelect) return;
        try {
            triggerMoodSelect.innerHTML = '<option value="">Loading your mood check-ins...</option>';
            const res = await fetch(BACKEND_URL + "/api/moods", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to load moods");
            }

            if (data.moods && data.moods.length > 0) {
                triggerMoodSelect.innerHTML = '<option value="">Select a mood check-in</option>' + data.moods.map(m => `
                    <option value="${m.id}">${m.icon || ""} ${m.mood} (${new Date(m.created_at || m.mood_date).toLocaleDateString()})</option>
                `).join("");
            } else {
                triggerMoodSelect.innerHTML = '<option value="">Log a mood first</option>';
            }
        } catch(e) {
            console.error(e);
            triggerMoodSelect.innerHTML = '<option value="">Unable to load moods</option>';
        }
    };
    
    let emotionPatternsChartInstance = null;
    
    window.loadEmotionPatterns = async function() {
        const token = localStorage.getItem("innerVoiceToken");
        if(!token) return;
        try {
            const res = await fetch(BACKEND_URL + "/api/emotion-patterns/patterns", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to load trigger patterns");
            }

            const patterns = data.frequencies || [];
            const canvas = document.getElementById("emotionPatternsChart");
            if(!canvas) return;

            if (emotionPatternsChartInstance) {
                emotionPatternsChartInstance.destroy();
                emotionPatternsChartInstance = null;
            }

            const existingEmptyMessage = canvas.closest('.dashboard-panel')?.querySelector('.trigger-analysis-empty');
            if (patterns.length === 0) {
                const chartCard = canvas.closest('.dashboard-panel');
                if (chartCard) {
                    canvas.style.display = 'none';
                    if (existingEmptyMessage) {
                        existingEmptyMessage.style.display = 'block';
                    } else {
                        const emptyMessage = document.createElement('p');
                        emptyMessage.className = 'trigger-analysis-empty';
                        emptyMessage.style.cssText = 'color:var(--text-muted); text-align:center; padding:30px 0;';
                        emptyMessage.textContent = 'No trigger data yet. Add your first emotional trigger below.';
                        chartCard.appendChild(emptyMessage);
                    }
                }
                return;
            }

            if(patterns.length > 0) {
                canvas.style.display = 'block';
                if (existingEmptyMessage) existingEmptyMessage.style.display = 'none';
                const labels = patterns.map(p => p.name || p.trigger_name || "Other");
                const counts = patterns.map(p => Number(p.count) || 0);
                
                if (typeof Chart !== "undefined") {
                    emotionPatternsChartInstance = new Chart(canvas, {
                        type: 'doughnut',
                        data: {
                            labels: labels,
                            datasets: [{
                                data: counts,
                                backgroundColor: ['#6c63ff', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']
                            }]
                        }
                    });
                } else {
                    const chartCard = canvas.closest('.dashboard-panel');
                    if (chartCard) {
                        chartCard.innerHTML = '<h3>🎯 Trigger Analysis</h3><p style="color:var(--text-muted); text-align:center; padding:30px 0;">Chart tools are unavailable. Your trigger data is saved successfully.</p>';
                    }
                }
            }
        } catch(e) {
            console.error(e);
            const canvas = document.getElementById("emotionPatternsChart");
            const chartCard = canvas?.closest('.dashboard-panel');
            if (chartCard) {
                if (canvas) canvas.style.display = 'none';
                let errorMessage = chartCard.querySelector('.trigger-analysis-error');
                if (!errorMessage) {
                    errorMessage = document.createElement('p');
                    errorMessage.className = 'trigger-analysis-error';
                    errorMessage.style.cssText = 'color:#b91c1c; text-align:center; padding:30px 0;';
                    chartCard.appendChild(errorMessage);
                }
                errorMessage.textContent = 'Unable to load trigger analysis right now.';
            }
        }
    };
    
    saveTriggerBtn?.addEventListener("click", async () => {
        const token = localStorage.getItem("innerVoiceToken");
        const moodId = triggerMoodSelect.value;
        const note = triggerInput.value.trim();
        if(!token || !moodId || !note) {
            showMessage("Please select a mood and enter a trigger note.");
            return;
        }
        try {
            const res = await fetch(BACKEND_URL + "/api/emotion-patterns", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body: JSON.stringify({ mood_id: moodId, custom_trigger_name: note, category: "Personal", context_note: note })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showMessage("Trigger saved!");
                triggerInput.value = '';
                window.loadEmotionPatterns();
            } else {
                showMessage(data.message || "Unable to save trigger.");
            }
        } catch(e) {
            console.error(e);
            showMessage("Unable to save trigger. Please try again.");
        }
    });

    // 3. FOCUS MODE
    let focusInterval;
    let focusTimeRemaining = 25 * 60; // 25 mins
    let isFocusRunning = false;
    const focusTimerDisplay = document.getElementById("focusTimerDisplay");
    const startFocusBtn = document.getElementById("startFocusBtn");
    const pauseFocusBtn = document.getElementById("pauseFocusBtn");
    const resetFocusBtn = document.getElementById("resetFocusBtn");
    const totalFocusTimeLabel = document.getElementById("totalFocusTimeLabel");
    const totalFocusSessionsLabel = document.getElementById("totalFocusSessionsLabel");
    
    function updateFocusDisplay() {
        if(!focusTimerDisplay) return;
        const m = Math.floor(focusTimeRemaining / 60).toString().padStart(2, '0');
        const s = (focusTimeRemaining % 60).toString().padStart(2, '0');
        focusTimerDisplay.textContent = `${m}:${s}`;
    }
    
    startFocusBtn?.addEventListener("click", () => {
        if(isFocusRunning) return;
        isFocusRunning = true;
        startFocusBtn.style.display = 'none';
        pauseFocusBtn.style.display = 'inline-block';
        focusInterval = setInterval(async () => {
            focusTimeRemaining--;
            updateFocusDisplay();
            if(focusTimeRemaining <= 0) {
                clearInterval(focusInterval);
                isFocusRunning = false;
                showMessage("Focus session complete! Take a break.");
                const token = localStorage.getItem("innerVoiceToken");
                if(token) {
                    await fetch(BACKEND_URL + "/api/focus/complete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                        body: JSON.stringify({ duration: 25, task_name: 'Deep Work' })
                    });
                    window.loadFocusStats();
                }
                focusTimeRemaining = 25 * 60;
                updateFocusDisplay();
                startFocusBtn.style.display = 'inline-block';
                pauseFocusBtn.style.display = 'none';
            }
        }, 1000);
    });
    
    pauseFocusBtn?.addEventListener("click", () => {
        clearInterval(focusInterval);
        isFocusRunning = false;
        startFocusBtn.style.display = 'inline-block';
        pauseFocusBtn.style.display = 'none';
    });
    
    resetFocusBtn?.addEventListener("click", () => {
        clearInterval(focusInterval);
        isFocusRunning = false;
        focusTimeRemaining = 25 * 60;
        updateFocusDisplay();
        startFocusBtn.style.display = 'inline-block';
        pauseFocusBtn.style.display = 'none';
    });
    
    window.loadFocusStats = async function() {
        const token = localStorage.getItem("innerVoiceToken");
        if(!token || !totalFocusTimeLabel) return;
        try {
            const res = await fetch(BACKEND_URL + "/api/focus/stats", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if(data.success && data.stats) {
                totalFocusTimeLabel.textContent = (data.stats.total_minutes || 0) + " mins";
                totalFocusSessionsLabel.textContent = data.stats.total_sessions || 0;
            }
        } catch(e) {
            console.error(e);
        }
    };

    // 4. AI MEMORY
    const aiMemoryInput = document.getElementById("aiMemoryInput");
    const saveAiMemoryBtn = document.getElementById("saveAiMemoryBtn");
    const aiMemoryList = document.getElementById("aiMemoryList");
    
    window.loadAiMemories = async function() {
        const token = localStorage.getItem("innerVoiceToken");
        if(!token || !aiMemoryList) return;
        try {
            const res = await fetch(BACKEND_URL + "/api/ai-memory", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if(data.success && data.memories) {
                aiMemoryList.innerHTML = data.memories.map(m => `
                    <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #eee;">
                        <span style="font-size: 14px;"><strong>${escapeHTMLSafe(m.memory_key)}:</strong> ${escapeHTMLSafe(m.memory_value)}</span>
                        <button onclick="window.deleteAiMemory(${m.id})" class="btn secondary" style="padding: 5px 10px; font-size: 12px; width: auto; margin: 0;">Delete</button>
                    </div>
                `).join("");
            }
        } catch(e) {
            console.error(e);
        }
    };
    
    saveAiMemoryBtn?.addEventListener("click", async () => {
        const token = localStorage.getItem("innerVoiceToken");
        const mem = aiMemoryInput.value.trim();
        if(!token || !mem) {
            showMessage("Please enter a memory.");
            return;
        }
        try {
            const res = await fetch(BACKEND_URL + "/api/ai-memory", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body: JSON.stringify({ memory_key: 'User Note', memory_value: mem })
            });
            const data = await res.json();
            if(data.success) {
                aiMemoryInput.value = '';
                window.loadAiMemories();
            }
        } catch(e) {
            console.error(e);
        }
    });
    
    window.deleteAiMemory = async function(id) {
        const token = localStorage.getItem("innerVoiceToken");
        if(!token) return;
        try {
            const res = await fetch(BACKEND_URL + "/api/ai-memory/" + id, {
                method: "DELETE",
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if(data.success) {
                window.loadAiMemories();
            }
        } catch(e) {
            console.error(e);
        }
    };
    
    // Initial load for active session if already logged in
    const existingToken = localStorage.getItem("innerVoiceToken");
    if (existingToken) {
        if (typeof window.loadVoiceJournals === "function") window.loadVoiceJournals();
        if (typeof window.loadMoodsForTrigger === "function") window.loadMoodsForTrigger();
        if (typeof window.loadEmotionPatterns === "function") window.loadEmotionPatterns();
        if (typeof window.loadFocusStats === "function") window.loadFocusStats();
        if (typeof window.loadAiMemories === "function") window.loadAiMemories();
        if (typeof window.loadWellnessScore === "function") window.loadWellnessScore();
        if (typeof window.loadDailyPlan === "function") window.loadDailyPlan();
        if (typeof window.loadWeeklyReport === "function") window.loadWeeklyReport();
        if (typeof window.loadHabits === "function") window.loadHabits();
    }
    
    // --- Wellness Score (Phase 1) ---
    let wellnessChartInstance = null;
    
    window.loadWellnessScore = async function() {
        const token = localStorage.getItem("innerVoiceToken");
        if (!token) return;
        
        try {
            // Calculate and get today's score
            const calcRes = await fetch(BACKEND_URL + "/api/wellness-score/calculate", {
                method: "POST",
                headers: { "Authorization": "Bearer " + token }
            });
            const calcData = await calcRes.json();
            
            if (calcData.success) {
                document.getElementById("statWellnessScore").textContent = calcData.score;
                document.getElementById("statWellnessReason").textContent = calcData.reason;
            }
            
            // Get history to render chart
            const histRes = await fetch(BACKEND_URL + "/api/wellness-score", {
                headers: { "Authorization": "Bearer " + token }
            });
            const histData = await histRes.json();
            
            if (histData.success && histData.history.length > 0) {
                document.getElementById("wellnessChartPanel").style.display = "block";
                
                const labels = histData.history.map(item => new Date(item.score_date).toLocaleDateString()).reverse();
                const scores = histData.history.map(item => item.score).reverse();
                
                const ctx = document.getElementById("wellnessTrendChart");
                if (!ctx) return;
                
                if (wellnessChartInstance) {
                    wellnessChartInstance.destroy();
                }
                
                wellnessChartInstance = new Chart(ctx, {
                    type: "line",
                    data: {
                        labels: labels,
                        datasets: [{
                            label: "Wellness Score",
                            data: scores,
                            borderColor: "#4ecdc4",
                            backgroundColor: "rgba(78, 205, 196, 0.2)",
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: { min: 0, max: 100 }
                        }
                    }
                });
            }
        } catch (e) {
            console.error(e);
        }
    };
    
    // --- Daily Plan (Phase 2) ---
    
    window.loadDailyPlan = async function() {
        const token = localStorage.getItem("innerVoiceToken");
        if (!token) return;
        
        try {
            const res = await fetch(BACKEND_URL + "/api/daily-plan", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            
            if (data.success && data.plan) {
                renderDailyPlan(data.plan, data.activities);
            }
        } catch(e) {
            console.error("Failed to load daily plan:", e);
        }
    };
    
    window.generateDailyPlan = async function() {
        const token = localStorage.getItem("innerVoiceToken");
        if (!token) return;
        
        try {
            document.getElementById("dailyPlanContainer").innerHTML = "<div class='dashboard-loading'>Generating your new plan...</div>";
            const res = await fetch(BACKEND_URL + "/api/daily-plan/generate", {
                method: "POST",
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            
            if (data.success && data.plan) {
                renderDailyPlan(data.plan, data.activities);
            }
        } catch(e) {
            console.error("Failed to generate daily plan:", e);
        }
    };
    
    window.renderDailyPlan = function(plan, activities) {
        const container = document.getElementById("dailyPlanContainer");
        if (!container) return;
        
        let progressHtml = `
            <div style="margin-bottom: 20px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <strong>Progress</strong>
                    <strong id="dailyPlanProgressText">${plan.completion_percentage}%</strong>
                </div>
                <div style="background:#e5e7eb; border-radius:5px; height:10px; overflow:hidden;">
                    <div id="dailyPlanProgressBar" style="background:#10b981; width:${plan.completion_percentage}%; height:10px; transition: width 0.3s;"></div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>Today's Focus: ${plan.primary_focus}</h3>
                <p style="color:#4b5563; font-style:italic;">"${plan.plan_summary}"</p>
                <button class="btn secondary" onclick="window.generateDailyPlan()" style="padding:4px 8px; font-size:12px;">Regenerate Plan</button>
            </div>
            
            <div class="rec-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;">
        `;
        
        let allCompleted = true;
        
        if (activities && activities.length > 0) {
            activities.forEach(act => {
                if (!act.completed) allCompleted = false;
                
                let priorityColor = act.priority === 'HIGH' ? '#ef4444' : (act.priority === 'MEDIUM' ? '#f59e0b' : '#3b82f6');
                
                progressHtml += `
                    <div style="background:white; border:1px solid #e5e7eb; border-radius:8px; padding:15px; display:flex; flex-direction:column; justify-content:space-between;">
                        <div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                                <span style="background:${priorityColor}20; color:${priorityColor}; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">${act.priority}</span>
                                <span style="font-size:12px; color:#6b7280;">~${act.estimated_minutes} min</span>
                            </div>
                            <h4 style="margin:0 0 5px 0;">${act.title}</h4>
                            <p style="font-size:13px; color:#4b5563; margin-bottom:10px;">${act.description}</p>
                            <div style="background:#f9fafb; padding:8px; border-radius:4px; font-size:11px; color:#6b7280; margin-bottom:15px; border-left:2px solid #d1d5db;">
                                <em>Why?</em> ${act.reason}
                            </div>
                        </div>
                        <div>
                            ${act.completed ? 
                                `<button class="btn" style="width:100%; background:#10b981; color:white; border:none; padding:8px; border-radius:4px;" onclick="window.uncompleteDailyPlanItem(${act.id})">✓ Completed (Undo)</button>` :
                                (act.skipped ?
                                    `<button class="btn" style="width:100%; background:#9ca3af; color:white; border:none; padding:8px; border-radius:4px;" disabled>Skipped</button>` :
                                    `<div style="display:flex; gap:10px;">
                                        <button class="btn primary" style="flex:1; padding:8px; border-radius:4px;" onclick="window.completeDailyPlanItem(${act.id})">Mark Complete</button>
                                        <button class="btn secondary" style="flex:1; padding:8px; border-radius:4px;" onclick="window.skipDailyPlanItem(${act.id})">Skip</button>
                                    </div>`
                                )
                            }
                        </div>
                    </div>
                `;
            });
        } else {
            progressHtml += `<div style="grid-column:1/-1; padding:20px; text-align:center;">No activities planned for today.</div>`;
        }
        
        progressHtml += `</div>`;
        
        if (allCompleted && activities && activities.length > 0) {
            progressHtml = `<div style="background:#ecfdf5; padding:15px; border-radius:8px; color:#065f46; margin-bottom:20px; text-align:center; font-weight:bold;">🎉 Great job! You completed today's plan.</div>` + progressHtml;
        }
        
        container.innerHTML = progressHtml;
    };
    
    window.completeDailyPlanItem = async function(id) {
        const token = localStorage.getItem("innerVoiceToken");
        if (!token) return;
        
        try {
            const res = await fetch(BACKEND_URL + "/api/daily-plan/items/" + id + "/complete", {
                method: "PUT",
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success) {
                window.loadDailyPlan();
            }
        } catch(e) {
            console.error("Failed to complete item:", e);
        }
    };
    
    window.uncompleteDailyPlanItem = async function(id) {
        const token = localStorage.getItem("innerVoiceToken");
        if (!token) return;
        
        try {
            const res = await fetch(BACKEND_URL + "/api/daily-plan/items/" + id + "/uncomplete", {
                method: "PUT",
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success) {
                window.loadDailyPlan();
            }
        } catch(e) {
            console.error("Failed to uncomplete item:", e);
        }
    };

    window.skipDailyPlanItem = async function(id) {
        const token = localStorage.getItem("innerVoiceToken");
        if (!token) return;

        try {
            const res = await fetch(BACKEND_URL + "/api/daily-plan/items/" + id + "/skip", {
                method: "PUT",
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success) {
                window.loadDailyPlan();
            }
        } catch(e) {
            console.error("Failed to skip item:", e);
        }
    };

    // --- Weekly Wellness Report (Phase 3) ---
    
    window.loadWeeklyReport = async function() {
        const token = localStorage.getItem("innerVoiceToken");
        if (!token) return;
        
        try {
            const res = await fetch(BACKEND_URL + "/api/weekly-report", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            
            if (data.success && data.report) {
                renderWeeklyReport(data.report);
            } else {
                document.getElementById("weeklyReportContainer").style.display = "block";
                document.getElementById("weeklyReportDates").innerText = "Not enough data to generate your weekly report yet.";
            }
        } catch(e) {
            console.error("Failed to load weekly report:", e);
        }
    };
    
    window.renderWeeklyReport = function(report) {
        document.getElementById("weeklyReportContainer").style.display = "block";
        document.getElementById("weeklyReportContent").style.display = "block";
        
        // Dates
        const start = new Date(report.week_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const end = new Date(report.week_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        document.getElementById("weeklyReportDates").innerText = `${start} - ${end}`;
        
        // Overall Wellness
        document.getElementById("weeklyReportAvgScore").innerText = report.average_wellness_score + "/100";
        document.getElementById("weeklyReportInsight").innerText = report.primary_insight || "";
        
        // Moods
        document.getElementById("weeklyMoodPos").innerText = report.mood_distribution.positive;
        document.getElementById("weeklyMoodNeu").innerText = report.mood_distribution.neutral;
        document.getElementById("weeklyMoodNeg").innerText = report.mood_distribution.negative;
        
        // Activity
        document.getElementById("weeklyStatJournals").innerText = report.journal_count;
        document.getElementById("weeklyStatReflections").innerText = report.reflection_count;
        document.getElementById("weeklyStatGoals").innerText = report.goals_completed;
        document.getElementById("weeklyStatPlanPct").innerText = report.daily_plan_completion + "%";
        document.getElementById("weeklyStatFocus").innerText = report.focus_minutes + " min";
        
        // Consistency
        document.getElementById("weeklyStatConsistencyText").innerText = report.consistency_score + "%";
        document.getElementById("weeklyStatConsistencyBar").style.width = report.consistency_score + "%";
        
        // Strongest Day
        document.getElementById("weeklyStatStrongestDay").innerText = report.strongest_day || "Not enough data";
        
        // Recommendation
        document.getElementById("weeklyReportRecommendation").innerText = report.next_week_recommendation || "";
    };

    // --- Smart Habit Tracker (Phase 4) ---
    
    window.loadHabits = async function() {
        const token = localStorage.getItem("innerVoiceToken");
        if (!token) return;
        
        try {
            document.getElementById("habitTrackerSection").style.display = "block";
            
            const [habitsRes, summaryRes] = await Promise.all([
                fetch(BACKEND_URL + "/api/habits", { headers: { "Authorization": "Bearer " + token } }),
                fetch(BACKEND_URL + "/api/habits/summary", { headers: { "Authorization": "Bearer " + token } })
            ]);
            
            const habitsData = await habitsRes.json();
            const summaryData = await summaryRes.json();
            
            if (habitsData.success) {
                renderHabits(habitsData.habits);
            }
            if (summaryData.success) {
                document.getElementById("habitSummaryText").innerText = `${summaryData.completed_today} / ${summaryData.total_active} habits completed today`;
                document.getElementById("habitSummaryPercent").innerText = summaryData.completion_percentage + "%";
                document.getElementById("habitSummaryBar").style.width = summaryData.completion_percentage + "%";
            }
        } catch(e) {
            console.error("Failed to load habits:", e);
        }
    };
    
    window.renderHabits = function(habits) {
        const container = document.getElementById("habitListContainer");
        if (!container) return;
        container.innerHTML = "";
        
        if (habits.length === 0) {
            container.innerHTML = `<div style="padding: 2rem 1.5rem; text-align: center; color: #6b7280; background: white; border-radius: 16px; border: 1.5px dashed #d1d5db; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                <div style="font-size: 32px; margin-bottom: 8px;">🌱</div>
                <h4 style="margin: 0 0 6px; color: #1f2937; font-size: 16px;">Build a routine that works for you</h4>
                <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">Start with one simple, daily wellness habit.</p>
                <button type="button" class="btn btn-primary" onclick="openHabitModal()" style="padding: 8px 18px; border-radius: 10px; font-size: 13px;">+ Add Habit</button>
            </div>`;
            return;
        }
        
        habits.forEach(habit => {
            const isCompleted = !!habit.completed_today;
            const bg = isCompleted ? "#f0fdf4" : "#ffffff";
            const border = isCompleted ? "1.5px solid #86efac" : "1.5px solid #e5e7eb";
            const btnText = isCompleted ? "✓ Completed" : "Mark Complete";
            const btnStyle = isCompleted 
                ? "background: #10b981; color: white; border: none;" 
                : "background: #6c63ff; color: white; border: none;";
            const freqText = habit.frequency_type === 'daily' ? 'Daily' : `${habit.target_count}x/week`;
            
            const card = document.createElement("div");
            card.style.cssText = `background: ${bg}; border: ${border}; border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; position: relative; box-shadow: 0 4px 15px rgba(0,0,0,0.04); transition: all 0.3s ease;`;
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap;">
                    <div>
                        <h4 style="margin: 0 0 4px; color: #1f2937; font-size: 17px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                            ${escapeHTMLSafe(habit.name)}
                            <span style="font-size: 12px; background: rgba(108,99,255,0.1); color: #6c63ff; padding: 2px 8px; border-radius: 12px; font-weight: 600;">${escapeHTMLSafe(freqText)}</span>
                        </h4>
                        <div style="display: flex; gap: 15px; margin-top: 6px; align-items: center;">
                            <span style="color: #ef4444; font-size: 13px; font-weight: 700;">🔥 ${habit.current_streak} day streak</span>
                            <span style="color: #6b7280; font-size: 13px; font-weight: 500;">🏆 Best: ${habit.longest_streak || habit.current_streak} days</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button type="button" class="btn" onclick="window.toggleHabit(${habit.id}, ${isCompleted})" style="${btnStyle} padding: 7px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;">${btnText}</button>
                        <button type="button" onclick="window.deleteHabit(${habit.id})" title="Delete Habit" style="background: transparent; border: 1px solid #fca5a5; color: #ef4444; border-radius: 10px; padding: 7px 12px; cursor: pointer; font-size: 13px;">🗑️</button>
                    </div>
                </div>
                <div style="margin-top: 4px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="font-size: 12px; color: #6b7280; font-weight: 600;">Weekly Target Progress</span>
                        <span style="font-size: 12px; color: #10b981; font-weight: 700;">${habit.weekly_progress}%</span>
                    </div>
                    <div style="width: 100%; background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden;">
                        <div style="height: 100%; width: ${habit.weekly_progress}%; background: linear-gradient(90deg, #10b981, #059669); border-radius: 10px; transition: width 0.4s ease;"></div>
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
    };
    
    window.toggleHabit = async function(id, currentlyCompleted) {
        const token = localStorage.getItem("innerVoiceToken");
        if (!token) return;
        const endpoint = currentlyCompleted ? `/api/habits/${id}/uncomplete` : `/api/habits/${id}/complete`;
        try {
            const res = await fetch(BACKEND_URL + endpoint, {
                method: "POST",
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success) {
                showMessage(currentlyCompleted ? "Habit marked incomplete." : "🎉 Habit completed!");
                await loadHabits();
                if (typeof loadAchievements === "function") loadAchievements(true);
            } else {
                showMessage("❌ " + (data.message || "Failed to update habit"));
            }
        } catch(e) {
            console.error(e);
            showMessage("❌ Failed to update habit.");
        }
    };
    
    window.deleteHabit = async function(id) {
        if (!confirm("Delete this habit? This cannot be undone.")) return;
        const token = localStorage.getItem("innerVoiceToken");
        if (!token) return;
        try {
            const res = await fetch(BACKEND_URL + `/api/habits/${id}`, {
                method: "DELETE",
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success) {
                showMessage("🗑️ Habit deleted.");
                await loadHabits();
            } else {
                showMessage("❌ Could not delete habit: " + data.message);
            }
        } catch(e) {
            console.error(e);
            showMessage("❌ Network error deleting habit.");
        }
    };
    
    const habitForm = document.getElementById("habitForm");
    if (habitForm) {
        habitForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const token = localStorage.getItem("innerVoiceToken");
            if (!token) {
                showMessage("Please log in first.");
                return;
            }
            
            const name = document.getElementById("habitName").value.trim();
            if (!name) {
                showMessage("❌ Habit name is required.");
                return;
            }

            const payload = {
                name: name,
                category: document.getElementById("habitCategory").value,
                frequency_type: document.getElementById("habitFreq").value,
                target_count: parseInt(document.getElementById("habitTarget").value, 10) || 1
            };

            const submitBtn = habitForm.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent : "Save Habit";
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Saving...";
            }
            
            try {
                const res = await fetch(BACKEND_URL + "/api/habits", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    if (submitBtn) submitBtn.textContent = "Saved ✓";
                    showMessage("🌱 Habit created successfully!");
                    habitForm.reset();
                    document.getElementById("habitTargetContainer").style.display = "none";
                    setTimeout(() => {
                        closeHabitModal();
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = originalText;
                        }
                    }, 800);
                    await loadHabits();
                } else {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = "Error — Try Again";
                    }
                    showMessage("❌ " + (data.message || "Failed to create habit"));
                }
            } catch(err) {
                console.error(err);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Error — Try Again";
                }
                showMessage("❌ Error creating habit.");
            }
        });
    }

    // --- Phase 5: Achievements & Levels ---
    
    window.loadAchievementSummary = async function() {
        const token = localStorage.getItem("innerVoiceToken");
        if (!token) return;
        
        try {
            const res = await fetch(BACKEND_URL + "/api/achievements/summary", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            
            if (data.success && data.levelInfo) {
                // Update Dashboard Level Card
                const levelPanel = document.getElementById("levelCardPanel");
                if(levelPanel) {
                    levelPanel.style.display = "block";
                    document.getElementById("dashUserLevel").innerText = data.levelInfo.level;
                    document.getElementById("dashUserTitle").innerText = data.levelInfo.title;
                    document.getElementById("dashUserXp").innerText = data.xp;
                    document.getElementById("dashXpToNext").innerText = data.levelInfo.xpToNext;
                    document.getElementById("dashLevelProgressBar").style.width = data.levelInfo.progressPercent + "%";
                }
                
                // Update Achievements summary section
                if(document.getElementById("dashAchSummary")) {
                    document.getElementById("dashAchSummary").innerText = `Unlocked: ${data.stats.unlocked} / ${data.stats.total} Badges (${data.stats.percentage}%)`;
                    document.getElementById("dashAchProgressBar").style.width = data.stats.percentage + "%";
                    document.getElementById("dashboardAchievementsPanel").style.display = "block";
                }
            }
            
            // Load XP History
            const histRes = await fetch(BACKEND_URL + "/api/achievements/history", {
                headers: { "Authorization": "Bearer " + token }
            });
            const histData = await histRes.json();
            
            if (histData.success && histData.transactions) {
                const txContainer = document.getElementById("recentXpTransactions");
                if (txContainer) {
                    txContainer.innerHTML = "";
                    histData.transactions.slice(0, 3).forEach(tx => {
                        const div = document.createElement("div");
                        div.style.marginBottom = "5px";
                        div.innerHTML = `<strong>+${tx.xp_amount} XP</strong>: ${tx.description}`;
                        txContainer.appendChild(div);
                    });
                }
            }
        } catch(e) {
            console.error("Failed to load achievement summary:", e);
        }
    };
    
    window.loadAchievementsPage = async function(filter = 'all') {
        const token = localStorage.getItem("innerVoiceToken");
        if (!token) return;
        
        try {
            const res = await fetch(BACKEND_URL + "/api/achievements", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            
            if (data.success) {
                const grid = document.getElementById("achievementsGrid");
                if(!grid) return;
                grid.innerHTML = "";
                
                document.getElementById("achOverallTitle").innerText = `🏆 ${data.stats.unlocked} of ${data.stats.total} Badges Unlocked`;
                document.getElementById("achOverallPct").innerText = data.stats.percentage + "%";
                document.getElementById("achOverallProgressBar").style.width = data.stats.percentage + "%";
                
                document.getElementById("unlockedFilterNum").innerText = data.stats.unlocked;
                document.getElementById("lockedFilterNum").innerText = data.stats.total - data.stats.unlocked;
                
                let filtered = data.achievements;
                if (filter === 'unlocked') filtered = filtered.filter(a => a.is_unlocked);
                if (filter === 'locked') filtered = filtered.filter(a => !a.is_unlocked);
                
                if (filtered.length === 0) {
                    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #6b7280;">No achievements found.</p>`;
                    return;
                }
                
                filtered.forEach(ach => {
                    const card = document.createElement("div");
                    const unlockedClass = ach.is_unlocked ? "unlocked" : "locked";
                    const bg = ach.is_unlocked ? "white" : "#f9fafb";
                    const border = ach.is_unlocked ? "2px solid #a7f3d0" : "2px solid #f3f4f6";
                    const tierColors = { 'Bronze': '#b45309', 'Silver': '#4b5563', 'Gold': '#b45309', 'Platinum': '#4338ca' };
                    const tierColor = tierColors[ach.tier] || '#6b7280';
                    
                    card.style.cssText = `background: ${bg}; border: ${border}; border-radius: 16px; padding: 20px; text-align: center; position: relative; transition: transform 0.2s;`;
                    card.className = `ach-card ${unlockedClass}`;
                    
                    card.innerHTML = `
                        <div style="font-size: 40px; margin-bottom: 10px; ${ach.is_unlocked ? '' : 'filter: grayscale(100%) opacity(0.5);'}">${ach.icon}</div>
                        <h4 style="margin: 0 0 5px; color: #111827;">${ach.name}</h4>
                        <p style="font-size: 13px; color: #6b7280; margin-bottom: 15px; min-height: 38px;">${ach.description}</p>
                        
                        <div style="font-size: 11px; font-weight: 700; color: ${tierColor}; background: ${ach.is_unlocked ? '#f0fdf4' : '#f3f4f6'}; padding: 4px 8px; border-radius: 12px; display: inline-block; margin-bottom: 15px;">
                            ${ach.tier} &bull; ${ach.xp_reward} XP
                        </div>
                        
                        <div style="text-align: left;">
                            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #4b5563; margin-bottom: 4px;">
                                <span>Progress</span>
                                <span>${ach.current} / ${ach.target}</span>
                            </div>
                            <div style="height: 6px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; width: ${ach.percentage}%; background: ${ach.is_unlocked ? '#34d399' : '#6c63ff'};"></div>
                            </div>
                        </div>
                        
                        ${ach.is_unlocked ? `<div style="position: absolute; top: -10px; right: -10px; font-size: 24px;">✨</div>` : ''}
                    `;
                    grid.appendChild(card);
                });
            }
        } catch(e) {
            console.error("Failed to load achievements page:", e);
        }
    };
    
    // Attach filter listeners
    const achFilterBtns = document.querySelectorAll(".ach-filter-btn");
    achFilterBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            achFilterBtns.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            loadAchievementsPage(e.target.getAttribute("data-filter"));
        });
    });

    // ==========================================
    // EXPOSE GLOBAL FUNCTIONS FOR INLINE ONCLICK
    // ==========================================
    window.showSection = showSection;
    
    window.logout = function() {
        const confirmLogout = confirm("Do you want to logout?");
        if (!confirmLogout) return;

        currentUser = null;
        localStorage.removeItem("innerVoiceToken");
        localStorage.removeItem("innerVoiceCurrentUser");
        saveData();

        if (typeof showMessage === 'function') {
            showMessage("You have been logged out.");
        }
        location.reload();
    };

    window.toggleTheme = function() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('innerVoiceTheme', isDark ? 'dark' : 'light');
    };
    
    if (localStorage.getItem('innerVoiceTheme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    window.openHabitModal = function() {
        const modal = document.getElementById("habitModal");
        if (modal) modal.style.display = "flex";
    };

    window.closeHabitModal = function() {
        const modal = document.getElementById("habitModal");
        if (modal) modal.style.display = "none";
    };

});



// =====================================================
// PHASE 7: SMART WELLNESS INSIGHTS
// =====================================================

let currentInsights = [];

// showToast: alias for showMessage so inline HTML onclick handlers work
window.showToast = function(msg) {
    if (typeof showMessage === 'function') showMessage(msg);
    else console.log('[Toast]', msg);
};

async function fetchWellnessInsights() {
    const token = localStorage.getItem('innerVoiceToken') || localStorage.getItem('token');
    if (!token) return;

    try {
        const [insightsRes, trendsRes, patternsRes] = await Promise.all([
            fetch(BACKEND_URL + '/api/wellness-insights', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(BACKEND_URL + '/api/wellness-insights/trends', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(BACKEND_URL + '/api/wellness-insights/patterns', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        let allInsights = [];
        
        if (insightsRes.ok) {
            const data = await insightsRes.json();
            allInsights = allInsights.concat(data.insights || []);
        }
        if (trendsRes.ok) {
            const data = await trendsRes.json();
            allInsights = allInsights.concat(data.trends || []);
        }
        if (patternsRes.ok) {
            const data = await patternsRes.json();
            allInsights = allInsights.concat(data.patterns || []);
        }

        currentInsights = allInsights;
        
        // Update Dashboard Widget
        const dashInsight = document.getElementById('dashTopInsight');
        if (dashInsight) {
            if (allInsights.length > 0) {
                dashInsight.textContent = allInsights[0].description;
            } else {
                dashInsight.textContent = "Keep logging your mood and habits to generate smart insights.";
            }
        }

        renderInsights(allInsights);
        
    } catch (error) {
        console.error('Error fetching wellness insights:', error);
        const container = document.getElementById('insightsContainer');
        if (container) container.innerHTML = '<div class="iv-card" style="color:var(--danger);">Failed to load insights.</div>';
    }
}

function renderInsights(insights) {
    const container = document.getElementById('insightsContainer');
    if (!container) return;
    
    if (insights.length === 0) {
        container.innerHTML = `
            <div class="iv-card" style="grid-column: 1 / -1; text-align:center; padding:40px;">
                <div style="font-size:40px; margin-bottom:16px;">🌱</div>
                <h3 style="font-size:20px; font-weight:700;">Not enough data yet</h3>
                <p style="color:var(--text-muted); max-width:400px; margin:0 auto;">
                    We need a bit more data to identify patterns. Keep logging your mood, habits, and journals!
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = insights.map(insight => {
        let icon = '💡';
        if (insight.category.includes('MOOD')) icon = '😌';
        if (insight.category.includes('HABIT')) icon = '🔥';
        if (insight.category.includes('JOURNAL')) icon = '📝';
        if (insight.category.includes('TREND') || insight.category.includes('WELLNESS')) icon = '📊';
        
        return `
            <div class="iv-card" style="display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                        <span style="background:var(--primary-light); color:var(--primary); font-size:11px; font-weight:700; padding:4px 8px; border-radius:12px;">${insight.category}</span>
                        ${insight.importance === 'HIGH' ? '<span style="color:#ef4444; font-size:12px; font-weight:700;">HIGH IMPORTANCE</span>' : ''}
                    </div>
                    <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:12px;">
                        <div style="font-size:24px;">${icon}</div>
                        <h3 style="font-size:18px; font-weight:700; margin:0;">${insight.title}</h3>
                    </div>
                    <p style="color:var(--text-dark); margin-bottom:16px; font-size:15px; line-height:1.5;">${insight.description}</p>
                </div>
                <div style="background:var(--bg-color); padding:12px; border-radius:12px; border:1px solid var(--border-color);">
                    <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">Recommendation</div>
                    <p style="margin:0; font-size:14px; color:var(--primary);">${insight.recommendation}</p>
                </div>
            </div>
        `;
    }).join('');
}

function filterInsights(category) {
    if (category === 'ALL') {
        renderInsights(currentInsights);
    } else {
        const filtered = currentInsights.filter(i => i.category.includes(category));
        renderInsights(filtered);
    }
}

// =====================================================
// PHASE 8: PERSONALIZED RECOMMENDATIONS
// =====================================================

let currentRecommendations = [];

async function fetchRecommendations() {
    const token = localStorage.getItem('innerVoiceToken') || localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch(BACKEND_URL + '/api/recommendations', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            currentRecommendations = data.recommendations || [];
            
            // Update Dashboard Widget
            const dashRec = document.getElementById('dashTopRecommendation');
            const dashRecPriority = document.getElementById('dashRecPriority');
            if (dashRec && dashRecPriority) {
                if (currentRecommendations.length > 0) {
                    const topRec = currentRecommendations[0];
                    dashRec.textContent = topRec.action;
                    dashRecPriority.textContent = topRec.priority.toUpperCase();
                    
                    if (topRec.priority === 'HIGH') {
                        dashRecPriority.style.background = '#fee2e2';
                        dashRecPriority.style.color = '#b91c1c';
                    } else if (topRec.priority === 'MEDIUM') {
                        dashRecPriority.style.background = '#fef3c7';
                        dashRecPriority.style.color = '#b45309';
                    } else {
                        dashRecPriority.style.background = '#dcfce7';
                        dashRecPriority.style.color = '#166534';
                    }
                    dashRecPriority.style.display = 'inline-block';
                } else {
                    dashRec.textContent = "Keep logging your mood and habits to receive personalized recommendations.";
                    dashRecPriority.style.display = 'none';
                }
            }

            renderRecommendations(currentRecommendations);
        }
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        const container = document.getElementById('recommendationsContainer');
        if (container) container.innerHTML = '<div class="day-empty-state" style="color:var(--danger);">Failed to load recommendations.</div>';
    }
}

function renderRecommendations(recommendations) {
    const container = document.getElementById('recommendationsContainer');
    if (!container) return;
    
    if (recommendations.length === 0) {
        container.innerHTML = `
            <div class="day-empty-state" style="grid-column: 1 / -1; padding:40px; background:white; border-radius:12px; text-align:center;">
                <div style="font-size:40px; margin-bottom:16px;">🌱</div>
                <h3 style="font-size:20px; font-weight:700;">No Recommendations Yet</h3>
                <p style="color:var(--text-muted); max-width:400px; margin:0 auto;">
                    Your recommendations will become more personalized as you continue to log your mood, journal, and complete habits.
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recommendations.map(rec => {
        let priorityStyle = 'background:#dcfce7; color:#166534;'; // LOW
        if (rec.priority === 'HIGH') priorityStyle = 'background:#fee2e2; color:#b91c1c;';
        if (rec.priority === 'MEDIUM') priorityStyle = 'background:#fef3c7; color:#b45309;';
        
        let sectionTarget = '#dailyPlan';
        if (rec.category === 'Mood') sectionTarget = '#mood';
        if (rec.category === 'Journal') sectionTarget = '#journal';
        if (rec.category === 'Habit') sectionTarget = '#habitTrackerSection';
        if (rec.category === 'Focus') sectionTarget = '#focusMode';

        return `
            <div class="iv-card" style="display:flex; flex-direction:column; justify-content:space-between; background:white; transition:transform 0.2s; box-shadow:0 8px 30px rgba(0,0,0,0.05);">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                        <span style="font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">${rec.category}</span>
                        <span style="font-size:11px; font-weight:700; padding:4px 8px; border-radius:12px; ${priorityStyle}">${rec.priority}</span>
                    </div>
                    <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:12px;">
                        <div style="font-size:24px;">${rec.icon || '✨'}</div>
                        <h3 style="font-size:18px; font-weight:700; margin:0;">${rec.title}</h3>
                    </div>
                    <p style="color:var(--text-dark); margin-bottom:16px; font-size:14px; line-height:1.5;">${rec.reasoning}</p>
                </div>
                <div style="margin-top:auto;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px; font-size:13px; color:var(--text-muted); font-weight:600;">
                        <span>⏱️ ${rec.estimated_minutes} min</span>
                    </div>
                    <a href="${sectionTarget}" onclick="if(typeof showSection === 'function') showSection('${sectionTarget}')" class="iv-btn iv-btn-primary" style="display:block; text-align:center; text-decoration:none; padding:12px; box-sizing:border-box;">
                        ${rec.action}
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

function filterRecs(priority) {
    if (priority === 'ALL') {
        renderRecommendations(currentRecommendations);
    } else {
        const filtered = currentRecommendations.filter(r => r.priority === priority);
        renderRecommendations(filtered);
    }
}

/* =====================================================
   PHASE 9: WELLNESS JOURNEY TIMELINE
===================================================== */
let currentWellnessJourney = [];
let currentJourneyFilter = 'ALL';

async function loadWellnessJourney() {
    const token = getToken();
    if (!token) return;

    const range = document.getElementById('journeyRangeSelect')?.value || '30';
    let url = BACKEND_URL + "/api/wellness-journey";
    
    if (range !== 'all') {
        const today = new Date();
        const fromDate = new Date();
        fromDate.setDate(today.getDate() - parseInt(range, 10));
        url += `?from=${fromDate.toISOString().split('T')[0]}&to=${today.toISOString().split('T')[0]}`;
    }

    try {
        const res = await fetch(url, {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await res.json();
        
        if (data.success) {
            currentWellnessJourney = data.events || [];
            renderJourneyTimeline();
            updateDashboardJourneyWidget(currentWellnessJourney);
        }
    } catch (err) {
        console.error("Failed to fetch wellness journey:", err);
    }
}

function updateDashboardJourneyWidget(events) {
    const dashContainer = document.getElementById('dashJourneyContainer');
    if (!dashContainer) return;

    if (!events || events.length === 0) {
        dashContainer.innerHTML = `<p style="font-size:13px; color:var(--text-muted); margin:0;">No journey events in this range.</p>`;
        return;
    }

    const latest = events.slice(0, 3);
    dashContainer.innerHTML = latest.map(e => `
        <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:24px; height:24px; border-radius:50%; background:var(--primary-light); display:flex; align-items:center; justify-content:center; font-size:12px;">
                ${e.icon}
            </div>
            <div style="flex:1; min-width:0;">
                <p style="margin:0; font-size:13px; font-weight:600; color:var(--text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${e.title}</p>
                <p style="margin:0; font-size:11px; color:var(--text-muted);">${new Date(e.date).toLocaleDateString('en-IN', {month:'short', day:'numeric'})}</p>
            </div>
        </div>
    `).join('');
}

function filterJourney(type, btnEl) {
    currentJourneyFilter = type;
    document.querySelectorAll('.journey-filter-btn').forEach(btn => btn.classList.remove('iv-btn-primary', 'iv-btn-secondary'));
    document.querySelectorAll('.journey-filter-btn').forEach(btn => btn.classList.add('iv-btn-secondary'));
    
    if (btnEl) {
        btnEl.classList.remove('iv-btn-secondary');
        btnEl.classList.add('iv-btn-primary');
    }
    
    renderJourneyTimeline();
}

function renderJourneyTimeline() {
    const container = document.getElementById('journeyEventsList');
    if (!container) return;

    let events = currentWellnessJourney;

    if (currentJourneyFilter !== 'ALL') {
        events = events.filter(e => e.type === currentJourneyFilter);
    }

    const sortOrder = document.getElementById('journeySortSelect')?.value || 'desc';
    events.sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        return sortOrder === 'desc' ? db - da : da - db;
    });

    if (events.length === 0) {
        container.innerHTML = `<div class="day-empty-state" style="position:relative; z-index:2; background:#fff; border:1px solid var(--border-color); border-radius:12px; padding:24px; text-align:center;">
            No events found in this range. Keep building your journey! 🌱
        </div>`;
        return;
    }

    container.innerHTML = events.map(e => {
        const isHigh = e.importance === 'high';
        const d = new Date(e.date);
        const dateStr = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute:'2-digit' });

        return `
            <div style="display:flex; gap:16px; position:relative; align-items:flex-start;">
                <!-- Timeline Dot -->
                <div style="position:relative; z-index:2; margin-top:8px;">
                    <div style="width:20px; height:20px; border-radius:50%; background:${isHigh ? 'var(--primary)' : '#fff'}; border:4px solid ${isHigh ? '#e0e7ff' : 'var(--primary)'}; flex-shrink:0;"></div>
                </div>
                
                <!-- Event Card -->
                <div class="iv-card" style="flex:1; margin:0; padding:16px; background:${isHigh ? 'linear-gradient(to right, #f8fafc, #fff)' : '#fff'}; border:${isHigh ? '1px solid var(--primary)' : '1px solid var(--border-color)'}; box-shadow:${isHigh ? '0 4px 12px rgba(108, 99, 255, 0.08)' : 'none'}; border-radius:12px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="font-size:12px; font-weight:700; color:var(--primary); text-transform:uppercase; letter-spacing:0.5px;">${e.type.replace('_', ' ')}</span>
                        <span style="font-size:12px; color:var(--text-muted);">${dateStr}, ${timeStr}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="font-size:24px;">${e.icon}</div>
                        <div>
                            <h4 style="margin:0; font-size:16px; font-weight:700; color:var(--text-dark);">${e.title}</h4>
                            ${e.description ? `<p style="margin:4px 0 0 0; font-size:14px; color:var(--text-muted); line-height:1.4;">${e.description}</p>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/* =====================================================
   PHASE 10: SMART NOTIFICATION & REMINDER CENTER
===================================================== */

let currentNotifications = [];

async function initNotifications() {
    const token = getToken();
    if (!token) return;
    await fetchNotifications('all');
}

async function fetchNotifications(filterStr = 'all') {
    const token = getToken();
    if (!token) return;

    try {
        const res = await fetch(`${BACKEND_URL}/api/notifications?filter=${filterStr}`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await res.json();
        if (data.success) {
            currentNotifications = data.notifications;
            updateNotifBadge(data.unread_count);
            renderNotifications();
            renderNotifDropdown();
            renderNotifDashboard();
        }
    } catch (err) {
        console.error("Error fetching notifications", err);
    }
}

function updateNotifBadge(count) {
    const badge = document.getElementById('notifBadge');
    const dashCount = document.getElementById('dashNotifUnreadCount');
    
    if (badge) {
        if (count > 0) {
            badge.style.display = 'inline-block';
            badge.textContent = count > 99 ? '99+' : count;
        } else {
            badge.style.display = 'none';
        }
    }
    
    if (dashCount) {
        dashCount.textContent = `${count} unread`;
    }
}

window.toggleNotifDropdown = function toggleNotifDropdown() {
    const dd = document.getElementById('notifDropdown');
    if (dd) {
        dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
        if (dd.style.display === 'block') {
            fetchNotifications('all'); // Refresh notifications when opening
        }
    }
}

// Click outside to close notification dropdown
document.addEventListener('click', function(event) {
    const dd = document.getElementById('notifDropdown');
    const btn = document.getElementById('notifBellBtn2');
    if (dd && dd.style.display === 'block') {
        if (!dd.contains(event.target) && (!btn || !btn.contains(event.target))) {
            dd.style.display = 'none';
        }
    }
});

function loadNotifications(filterStr, btnEl) {
    document.querySelectorAll('.notif-filter-btn').forEach(b => {
        b.classList.remove('iv-btn-primary');
        b.classList.add('iv-btn-secondary');
    });
    if (btnEl) {
        btnEl.classList.remove('iv-btn-secondary');
        btnEl.classList.add('iv-btn-primary');
    }
    fetchNotifications(filterStr);
}

function getPriorityStyle(priority) {
    if (priority === 'high') return 'color:#ef4444; background:#fee2e2; border:1px solid #fca5a5;';
    if (priority === 'medium') return 'color:#f59e0b; background:#fef3c7; border:1px solid #fcd34d;';
    return 'color:#3b82f6; background:#eff6ff; border:1px solid #bfdbfe;';
}

function renderNotifications() {
    const list = document.getElementById('notificationList');
    if (!list) return;

    if (currentNotifications.length === 0) {
        list.innerHTML = `<div class="iv-card" style="text-align:center; padding:40px;">
            <div style="font-size:40px; margin-bottom:16px;">🔔</div>
            <h3 style="margin-bottom:8px;">You're all caught up!</h3>
            <p style="color:var(--text-muted);">No new wellness notifications right now.</p>
        </div>`;
        return;
    }

    list.innerHTML = currentNotifications.map(n => `
        <div class="iv-card" style="display:flex; gap:16px; align-items:flex-start; ${n.is_read ? 'opacity:0.7;' : 'border-left:4px solid var(--primary);'} cursor:pointer;" onclick="handleNotifClick(${n.id}, '${n.link}')">
            <div style="font-size:32px; padding-top:4px;">${n.icon}</div>
            <div style="flex:1;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="font-size:12px; font-weight:700; text-transform:uppercase; padding:2px 6px; border-radius:4px; ${getPriorityStyle(n.priority)}">${n.priority} Priority</span>
                    <span style="font-size:12px; color:var(--text-muted);">${new Date(n.created_at).toLocaleString('en-IN', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                </div>
                <h4 style="margin:0 0 4px 0; font-size:16px; font-weight:700; color:var(--text-dark);">${n.title}</h4>
                <p style="margin:0; font-size:14px; color:var(--text-muted);">${n.message}</p>
                ${!n.is_read ? `<div style="margin-top:12px;"><span style="font-size:13px; font-weight:600; color:var(--primary);">Take Action →</span></div>` : ''}
            </div>
            <button onclick="event.stopPropagation(); deleteNotification(${n.id})" style="background:none; border:none; color:#ef4444; cursor:pointer; padding:4px;" title="Delete">🗑️</button>
        </div>
    `).join('');
}

function renderNotifDropdown() {
    const list = document.getElementById('notifDropdownList');
    if (!list) return;

    if (currentNotifications.length === 0) {
        list.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-muted); font-size:13px;">No new notifications! 🔔</div>`;
        return;
    }

    const latest = currentNotifications.slice(0, 5);
    list.innerHTML = latest.map(n => `
        <div style="padding:12px 16px; border-bottom:1px solid var(--border-color); display:flex; gap:12px; cursor:pointer; background:${n.is_read ? '#fff' : '#f0f4ff'};" onclick="handleNotifClick(${n.id}, '${n.link}')">
            <div style="font-size:24px;">${n.icon}</div>
            <div>
                <h4 style="margin:0; font-size:14px; font-weight:600; color:var(--text-dark);">${n.title}</h4>
                <p style="margin:4px 0 0 0; font-size:12px; color:var(--text-muted);">${n.message}</p>
                <div style="margin-top:4px; font-size:11px; color:var(--text-light);">${new Date(n.created_at).toLocaleString('en-IN', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
            </div>
        </div>
    `).join('');
}

function renderNotifDashboard() {
    const container = document.getElementById('dashNotifContainer');
    if (!container) return;

    if (currentNotifications.length === 0) {
        container.innerHTML = `<p style="font-size:13px; color:var(--text-muted); margin:0;">No new notifications right now.</p>`;
        return;
    }

    const unread = currentNotifications.filter(n => !n.is_read).slice(0, 3);
    const toShow = unread.length > 0 ? unread : currentNotifications.slice(0, 3);
    
    container.innerHTML = toShow.map(n => `
        <div style="display:flex; align-items:center; gap:8px; cursor:pointer;" onclick="handleNotifClick(${n.id}, '${n.link}')">
            <div style="width:24px; height:24px; border-radius:50%; background:${n.is_read ? 'var(--bg-color)' : '#dbeafe'}; display:flex; align-items:center; justify-content:center; font-size:12px;">
                ${n.icon}
            </div>
            <div style="flex:1; min-width:0;">
                <p style="margin:0; font-size:13px; font-weight:${n.is_read ? '500' : '700'}; color:var(--text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${n.title}</p>
            </div>
        </div>
    `).join('');
}

async function handleNotifClick(id, link) {
    if (link && typeof showSection === 'function') {
        showSection(link);
    }
    document.getElementById('notifDropdown').style.display = 'none';
    
    // Mark read
    const n = currentNotifications.find(x => x.id === id);
    if (n && !n.is_read) {
        await markNotificationRead(id);
    }
}

async function markNotificationRead(id) {
    const token = getToken();
    try {
        await fetch(`${BACKEND_URL}/api/notifications/${id}/read`, {
            method: 'PUT',
            headers: { "Authorization": "Bearer " + token }
        });
        const n = currentNotifications.find(x => x.id === id);
        if (n) n.is_read = 1;
        
        // Re-render
        renderNotifications();
        renderNotifDropdown();
        renderNotifDashboard();
        
        // Update badge
        const unreadCount = currentNotifications.filter(x => !x.is_read).length;
        updateNotifBadge(unreadCount);
    } catch(err) {
        console.error("Error marking read:", err);
    }
}

window.markAllNotificationsRead = async function markAllNotificationsRead() {
    const token = getToken();
    try {
        await fetch(`${BACKEND_URL}/api/notifications/read-all`, {
            method: 'PUT',
            headers: { "Authorization": "Bearer " + token }
        });
        currentNotifications.forEach(n => n.is_read = 1);
        renderNotifications();
        renderNotifDropdown();
        renderNotifDashboard();
        updateNotifBadge(0);
    } catch(err) {
        console.error("Error marking all read:", err);
    }
}

async function deleteNotification(id) {
    const token = getToken();
    try {
        await fetch(`${BACKEND_URL}/api/notifications/${id}`, {
            method: 'DELETE',
            headers: { "Authorization": "Bearer " + token }
        });
        currentNotifications = currentNotifications.filter(x => x.id !== id);
        renderNotifications();
        renderNotifDropdown();
        renderNotifDashboard();
        const unreadCount = currentNotifications.filter(x => !x.is_read).length;
        updateNotifBadge(unreadCount);
    } catch(err) {
        console.error("Error deleting notification:", err);
    }
}

// =====================================================
// PHASE 12: PERSONAL WELLNESS PROGRESS & ANALYTICS CENTER
// =====================================================

let analyticsScoreChart = null;
let analyticsMoodChart = null;

async function loadWellnessAnalytics(period = '30') {
    const token = getToken();
    if (!token || !currentUser) {
        showMessage("Please login to view analytics.");
        return;
    }

    try {
        const res = await fetch(`${BACKEND_URL}/api/wellness-analytics?period=${period}`, {
            headers: { "Authorization": "Bearer " + token }
        });
        
        const data = await res.json();
        
        if (data.success) {
            renderAnalyticsCenter(data);
        } else {
            console.warn("Analytics Error:", data.message);
            document.getElementById("analyticsContent").style.display = "none";
            document.getElementById("analyticsEmptyState").style.display = "block";
        }
    } catch (err) {
        console.error("Error fetching analytics:", err);
        document.getElementById("analyticsContent").style.display = "none";
        document.getElementById("analyticsEmptyState").style.display = "block";
    }
}

function renderAnalyticsCenter(data) {
    const content = document.getElementById("analyticsContent");
    const emptyState = document.getElementById("analyticsEmptyState");
    
    // Check for empty data condition
    if (!data.wellnessScore.current && data.mood.history.length === 0 && data.journals.total === 0 && data.goals.completed === 0) {
        content.style.display = "none";
        emptyState.style.display = "block";
        return;
    }
    
    content.style.display = "block";
    emptyState.style.display = "none";

    // 1. Summary & Strengths
    document.getElementById("analyticsSummary").textContent = data.summary || "Keep tracking to generate insights.";
    
    const strengthsEl = document.getElementById("analyticsStrengths");
    strengthsEl.innerHTML = (data.strengths || []).map(s => `<li>${escapeHTMLSafe(s)}</li>`).join('');
    
    const improvementsEl = document.getElementById("analyticsImprovements");
    improvementsEl.innerHTML = (data.improvements || []).map(s => `<li>${escapeHTMLSafe(s)}</li>`).join('');

    // 2. Main Metrics
    document.getElementById("analyticsScore").textContent = data.wellnessScore.current || "--";
    const changeEl = document.getElementById("analyticsScoreChange");
    if (data.wellnessScore.change > 0) {
        changeEl.textContent = `+${data.wellnessScore.change} points`;
        changeEl.style.color = "#10b981";
    } else if (data.wellnessScore.change < 0) {
        changeEl.textContent = `${data.wellnessScore.change} points`;
        changeEl.style.color = "#ef4444";
    } else {
        changeEl.textContent = "No change";
        changeEl.style.color = "#6b7280";
    }

    document.getElementById("analyticsMoodAvg").textContent = data.mood.avgScore > 0 ? data.mood.avgScore : "--";
    document.getElementById("analyticsMoodFreq").textContent = data.mood.mostFrequent || "--";
    document.getElementById("analyticsMoodStats").textContent = `${data.mood.positivePct}% Positive | ${data.mood.consistency}% Consistent`;

    document.getElementById("analyticsGoalPct").textContent = `${data.goals.completionPct}%`;
    document.getElementById("analyticsHabitPct").textContent = `${data.habits.consistency}%`;
    document.getElementById("analyticsGoalStats").textContent = `${data.goals.completed} Goals Done | ${data.habits.completed} Habits Done`;

    // 3. Personal Bests
    const bestsEl = document.getElementById("analyticsBests");
    let bestsHTML = "";
    if (data.personalBests.highestWellnessScore > 0) bestsHTML += `<div style="text-align:center; padding:10px; background:#f3f4f6; border-radius:12px;"><div style="font-size:24px; font-weight:800; color:var(--primary);">${data.personalBests.highestWellnessScore}</div><div style="font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase;">Best Score</div></div>`;
    if (data.personalBests.longestStreak > 0) bestsHTML += `<div style="text-align:center; padding:10px; background:#f3f4f6; border-radius:12px;"><div style="font-size:24px; font-weight:800; color:var(--primary);">${data.personalBests.longestStreak}🔥</div><div style="font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase;">Best Streak</div></div>`;
    if (data.personalBests.mostGoals > 0) bestsHTML += `<div style="text-align:center; padding:10px; background:#f3f4f6; border-radius:12px;"><div style="font-size:24px; font-weight:800; color:var(--primary);">${data.personalBests.mostGoals}</div><div style="font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase;">Goals Done</div></div>`;
    if (data.personalBests.highestLevel > 0) bestsHTML += `<div style="text-align:center; padding:10px; background:#f3f4f6; border-radius:12px;"><div style="font-size:24px; font-weight:800; color:var(--primary);">Lvl ${data.personalBests.highestLevel}</div><div style="font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase;">Highest Level</div></div>`;
    
    bestsEl.innerHTML = bestsHTML || "<div style='color:#6b7280; font-size:14px;'>No personal bests yet.</div>";

    // 4. Charts
    renderAnalyticsCharts(data);
}

function renderAnalyticsCharts(data) {
    // Score Chart
    if (analyticsScoreChart) analyticsScoreChart.destroy();
    const scoreCtx = document.getElementById('analyticsScoreChart');
    if (scoreCtx && data.wellnessScore.history.length > 0) {
        const labels = data.wellnessScore.history.map(s => new Date(s.score_date).toLocaleDateString('en-IN', {month:'short', day:'numeric'}));
        const points = data.wellnessScore.history.map(s => s.score);
        
        analyticsScoreChart = new Chart(scoreCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Wellness Score',
                    data: points,
                    borderColor: '#6c63ff',
                    backgroundColor: 'rgba(108, 99, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { min: 0, max: 100 } }
            }
        });
    }

    // Mood Chart
    if (analyticsMoodChart) analyticsMoodChart.destroy();
    const moodCtx = document.getElementById('analyticsMoodChart');
    if (moodCtx && data.mood.history.length > 0) {
        // We aggregate moods by date if there are multiple per day to make a cleaner line chart
        const dailyMoods = {};
        data.mood.history.forEach(m => {
            const d = new Date(m.mood_date).toLocaleDateString('en-IN', {month:'short', day:'numeric'});
            if (!dailyMoods[d]) dailyMoods[d] = [];
            dailyMoods[d].push(m.mood);
        });
        
        const labels = Object.keys(dailyMoods);
        const points = labels.map(l => {
            const arr = dailyMoods[l];
            let total = 0;
            // Assuming moodToScore is available in global scope if not re-declare here:
            const M_SCORES = {"Happy":5, "Excited":5, "Great":5, "Good":4, "Okay":3, "Neutral":3, "Tired":2, "Sad":2, "Anxious":2, "Angry":1, "Terrible":1};
            arr.forEach(mood => {
                const s = Object.keys(M_SCORES).find(k => k.toLowerCase() === mood.toLowerCase());
                total += s ? M_SCORES[s] : 3;
            });
            return total / arr.length;
        });

        analyticsMoodChart = new Chart(moodCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Avg Mood Score',
                    data: points,
                    backgroundColor: '#10b981',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 } } }
            }
        });
    }
}

// Add click listeners to filter buttons
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll(".analytics-period-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            document.querySelectorAll(".analytics-period-btn").forEach(b => b.classList.replace('iv-btn-primary', 'iv-btn-secondary'));
            this.classList.replace('iv-btn-secondary', 'iv-btn-primary');
            const period = this.dataset.period;
            loadWellnessAnalytics(period);
        });
    });
    
    // Automatically load analytics preview on dashboard load
    const origNav = window.navigateTo;
    if(origNav) {
        window.navigateTo = function(sectionId) {
            origNav(sectionId);
            if(sectionId === 'dashboard') {
                loadAnalyticsPreview();
            }
        };
    }
});

async function loadAnalyticsPreview() {
    const token = getToken();
    if (!token) return;
    try {
        const res = await fetch(`${BACKEND_URL}/api/wellness-analytics?period=7`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await res.json();
        if(data.success) {
            document.getElementById('dashPreviewMood').textContent = data.mood.avgScore > 0 ? data.mood.avgScore : '--';
            document.getElementById('dashPreviewGoals').textContent = `${data.goals.completionPct}%`;
            document.getElementById('dashPreviewHabits').textContent = `${data.habits.consistency}%`;
        }
    } catch(e) {
        console.error("Error loading analytics preview", e);
    }
}

window.loadAssistantDailyMessage = async function() {
    const dashMsgEl = document.getElementById("dashAssistantDailyMsg");
    if (!dashMsgEl) return;
    const token = getToken();
    if (!token) {
        dashMsgEl.textContent = "Please log in to receive personalized wellness tips.";
        return;
    }
    try {
        const res = await fetch(BACKEND_URL + "/api/chat/daily-message", {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await res.json();
        if (data.success && data.message) {
            dashMsgEl.textContent = data.message;
        } else {
            dashMsgEl.textContent = "Take a deep breath and start your day with positivity. 🌿";
        }
    } catch (err) {
        dashMsgEl.textContent = "Start your day with a moment of calm. 🌿";
    }
}

/* =====================================================
   PHASE 15: WEEKLY WELLNESS INSIGHTS
===================================================== */

async function fetchWeeklyWellnessInsights() {
    const dashWeeklyInsightsWidget = document.getElementById("dashWeeklyInsightsWidget");
    if (!dashWeeklyInsightsWidget) return;

    const token = getToken();
    if (!token) {
        dashWeeklyInsightsWidget.style.display = "none";
        return;
    }

    dashWeeklyInsightsWidget.style.display = "block";
    const loading = document.getElementById("weeklyInsightsLoading");
    const content = document.getElementById("weeklyInsightsContent");
    const empty = document.getElementById("weeklyInsightsEmpty");

    if (loading) loading.style.display = "block";
    if (content) content.style.display = "none";
    if (empty) empty.style.display = "none";

    try {
        const response = await fetch(`${BACKEND_URL}/api/insights/weekly`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await response.json();

        if (data.success && data.data) {
            renderWeeklyWellnessInsights(data.data);
        } else {
            if (loading) loading.style.display = "none";
            if (empty) empty.style.display = "block";
        }
    } catch (err) {
        console.error("Error fetching weekly wellness insights:", err);
        if (loading) loading.style.display = "none";
        if (empty) empty.style.display = "block";
    }
}

function renderWeeklyWellnessInsights(data) {
    const loading = document.getElementById("weeklyInsightsLoading");
    const content = document.getElementById("weeklyInsightsContent");
    const empty = document.getElementById("weeklyInsightsEmpty");

    if (loading) loading.style.display = "none";

    if (data.score.trend === "insufficient_data") {
        if (empty) empty.style.display = "block";
        if (content) content.style.display = "none";
        return;
    }

    if (content) content.style.display = "block";
    if (empty) empty.style.display = "none";

    // Score
    const scoreVal = document.getElementById("weeklyScoreVal");
    const scoreTrend = document.getElementById("weeklyScoreTrend");
    if (scoreVal) scoreVal.textContent = data.score.current;
    
    if (scoreTrend) {
        let diffStr = data.score.difference > 0 ? "+" + data.score.difference : data.score.difference;
        if (data.score.trend === 'improving') {
            scoreTrend.innerHTML = `<span style="color:#10b981;">↑ ${diffStr}</span> from last week`;
        } else if (data.score.trend === 'declining') {
            scoreTrend.innerHTML = `<span style="color:#ef4444;">↓ ${diffStr}</span> from last week`;
        } else {
            scoreTrend.innerHTML = `<span style="color:var(--text-muted);">Stable</span> from last week`;
        }
    }

    // AI Insight
    const aiSummary = document.getElementById("weeklyAiSummary");
    const aiRecs = document.getElementById("weeklyAiRecommendations");
    if (aiSummary) aiSummary.textContent = data.aiInsight.summary;
    if (aiRecs) {
        aiRecs.innerHTML = data.aiInsight.recommendations.map(r => `<li>${r}</li>`).join("");
    }

    // Mood
    const moodAvg = document.getElementById("weeklyMoodAvg");
    const moodTrend = document.getElementById("weeklyMoodTrend");
    if (moodAvg) moodAvg.textContent = data.mood.average ? data.mood.average.toFixed(1) + " / 5" : "--";
    if (moodTrend) {
        if (data.mood.trend === 'improving') moodTrend.innerHTML = `<span style="color:#10b981;">↑ Improved</span>`;
        else if (data.mood.trend === 'declining') moodTrend.innerHTML = `<span style="color:#ef4444;">↓ Declined</span>`;
        else if (data.mood.trend === 'stable') moodTrend.innerHTML = "Stable";
        else moodTrend.innerHTML = "Not enough data";
    }

    // Habits
    const habitRate = document.getElementById("weeklyHabitRate");
    const habitDetails = document.getElementById("weeklyHabitDetails");
    if (habitRate) habitRate.textContent = data.habits.completionRate !== null ? Math.round(data.habits.completionRate) + "%" : "--%";
    if (habitDetails) habitDetails.textContent = `${data.habits.completed} / ${data.habits.expected} completed`;

    // Goals
    const goalsComp = document.getElementById("weeklyGoalsCompleted");
    const goalsDetails = document.getElementById("weeklyGoalsDetails");
    if (goalsComp) goalsComp.textContent = data.goals.completed;
    if (goalsDetails) goalsDetails.textContent = `${data.goals.milestonesCompleted} milestones hit`;

    // Daily Plan
    const planRate = document.getElementById("weeklyDailyPlanRate");
    const planDetails = document.getElementById("weeklyDailyPlanDetails");
    if (planRate) planRate.textContent = data.dailyPlan.completionRate !== null ? Math.round(data.dailyPlan.completionRate) + "%" : "--%";
    if (planDetails) planDetails.textContent = `${data.dailyPlan.completed} done, ${data.dailyPlan.skipped} skipped`;

    // Journals & Reflections
    const journalsTotal = document.getElementById("weeklyJournalsTotal");
    if (journalsTotal) journalsTotal.textContent = data.journals.entries + data.reflections.entries;
}

// Hook into existing dashboard load (adding it globally)
const originalLoadDashboard = window.updateDashboard;
if (originalLoadDashboard) {
    window.updateDashboard = function() {
        originalLoadDashboard();
        fetchWeeklyWellnessInsights();
    }
} else {
    // If updateDashboard is not available, try adding to DOMContentLoaded
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(fetchWeeklyWellnessInsights, 1000); // delay to let auth initialize
    });
}
