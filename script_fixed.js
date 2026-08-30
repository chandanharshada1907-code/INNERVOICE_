

/* =========================================================
   INNERVOICE - COMPLETE JAVASCRIPT
   Works with the single-page HTML structure
========================================================= */

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
                const confirmPassword = inputs[3].value;


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

                        document.querySelector("#login")
                            ?.scrollIntoView({ behavior: "smooth" });

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

                    document.querySelector("#login")
                        ?.scrollIntoView({ behavior: "smooth" });

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

                        document.querySelector("#dashboard")
                            ?.scrollIntoView({ behavior: "smooth" });

                        updateDashboard();
                        updateProfile();
                        updateLoginStatus();
                        loadMoodHistory();
                        loadMoodAnalytics();
                        loadJournalHistory();
                        loadGoalHistory();
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

                    document.querySelector("#dashboard")
                        ?.scrollIntoView({ behavior: "smooth" });

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


    // ---- loadDashboardSummary: calls GET /api/dashboard/summary ----
    async function loadDashboardSummary() {

        const token = getToken();
        if (!token || !currentUser) {
            updateDashboard();
            return;
        }

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

            button.addEventListener("click", async function () {

                if (!currentUser) {

                    showMessage(
                        "Please login first to save your mood."
                    );

                    document.querySelector("#login")
                        ?.scrollIntoView({ behavior: "smooth" });

                    return;
                }


                const card     = button.closest(".card");
                const moodName = card.querySelector("h3").textContent.trim();
                const moodIcon = card.querySelector(".card-icon").textContent.trim();

                await saveMood(moodName, moodIcon);

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


    // ---- Render journal history cards ----
    function renderJournalHistory(entriesArray) {

        const historyPanel = document.getElementById("journalHistory");
        const historyList  = document.getElementById("journalHistoryList");

        if (!historyPanel || !historyList) return;

        if (!entriesArray || entriesArray.length === 0) {
            historyPanel.style.display = "none";
            return;
        }

        historyPanel.style.display = "block";

        historyList.innerHTML = entriesArray.map(function (entry) {

            // Format date
            const date = entry.created_at
                ? new Date(entry.created_at).toLocaleDateString("en-IN", {
                    day:   "2-digit",
                    month: "short",
                    year:  "numeric"
                  })
                : entry.date || "";

            // Truncate preview to 120 characters
            const preview = entry.text && entry.text.length > 120
                ? entry.text.substring(0, 120) + "..."
                : (entry.text || "");

            const entryId = entry.id || "";

            return `
                <div id="journal-entry-${entryId}" style="
                    background: white;
                    border-radius: 20px;
                    padding: 22px 25px;
                    margin-bottom: 16px;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.06);
                    border-left: 4px solid #6c63ff;
                ">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <small style="color:#6b7280; font-weight:600;">📅 ${date}</small>
                        ${entryId ? `<button
                            onclick="deleteJournalEntry(${entryId})"
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
                    <p style="color:#374151; line-height:1.6; font-size:15px;">${escapeHTMLSafe(preview)}</p>
                </div>
            `;

        }).join("");
    }


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

            return;
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

            } else {

                showMessage("❌ Could not save journal: " + data.message);

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

                await saveJournal(text);

                textarea.value         = "";
                saveButton.disabled    = false;
                saveButton.textContent = "Save Reflection";

            });
        }
    }



    /* =====================================================
       8. AI JOURNAL INSIGHT
    ===================================================== */

    // ---- showAIReflection(text, targetSelector?) ----
    // targetSelector defaults to '#journal .reflection-box' so the
    // Journal section continues to work exactly as before.
    // Pass '#reflectionAIBox' to show insight in Self Reflection section.
    function showAIReflection(text, targetSelector) {

        const selector = targetSelector || "#journal .reflection-box";

        const reflectionBox = document.querySelector(selector);

        if (!reflectionBox) return;


        let insights = [];


        const lowerText = text.toLowerCase();


        if (
            lowerText.includes("stress") ||
            lowerText.includes("exam") ||
            lowerText.includes("worried") ||
            lowerText.includes("pressure")
        ) {
            insights.push("Stress");
        }


        if (
            lowerText.includes("confused") ||
            lowerText.includes("uncertain") ||
            lowerText.includes("don't know")
        ) {
            insights.push("Uncertainty");
        }


        if (
            lowerText.includes("happy") ||
            lowerText.includes("hope") ||
            lowerText.includes("good")
        ) {
            insights.push("Hope");
        }


        if (lowerText.includes("myself") || lowerText.includes("feel")) {
            insights.push("Self-awareness");
        }


        if (insights.length === 0) {
            insights.push("Self-reflection", "Personal thoughts");
        }


        const html = `
            <p>Your entry may express:</p>
            <ul style="margin:15px 0 15px 20px;">
                ${insights.map(item => `<li>${item}</li>`).join("")}
            </ul>
            <strong>Reflection Prompt:</strong>
            <p>"What is one thing within your control right now?"</p>
        `;

        // Special handling for the Self Reflection section box
        if (selector === "#reflectionAIBox") {

            const contentEl = document.getElementById("reflectionAIContent");
            if (contentEl) contentEl.innerHTML = html;

            reflectionBox.style.display = "block";

        } else {

            // Journal section: write full content including heading
            reflectionBox.innerHTML = `
                <h3>\u2728 AI Reflection Insight</h3>
                ${html}
            `;

        }
    }



    /* =====================================================
       9. AI CHATBOT — Full implementation
       - Crisis detection with emergency resources
       - 12-category expanded keyword engine
       - Personalized responses (name, mood, journal context)
       - Typing indicator with animated dots
       - Scrollable message area (max-height on container)
       - Conversation persistence (backend + localStorage fallback)
       - Clear Chat with backend delete
       - All user content escaped before rendering
       - Removed duplicate escapeHTML (uses escapeHTMLSafe)
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

    // ---- Save one message to backend (non-blocking) ----
    async function saveChatMessage(role, content) {
        const key = chatStorageKey();
        // Always update localStorage cache
        if (key) {
            try {
                const stored = JSON.parse(localStorage.getItem(key) || "[]");
                stored.push({ role, content, created_at: new Date().toISOString() });
                if (stored.length > 100) stored.splice(0, stored.length - 100);
                localStorage.setItem(key, JSON.stringify(stored));
            } catch (e) { /* non-fatal */ }
        }
        const token = getToken();
        if (!token) return;
        try {
            await fetch(BACKEND_URL + "/api/chat/message", {
                method:  "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body:    JSON.stringify({ role, content })
            });
        } catch (err) {
            console.warn("Could not save chat message to backend.", err);
        }
    }

    // ---- Load chat history (backend → localStorage fallback) ----
    window.loadChatHistory = async function () {
        if (!chatMessagesEl) return;

        // Reset message area but keep welcome element
        chatMessagesEl.innerHTML = "";
        const welcomeDiv = document.createElement("div");
        welcomeDiv.id        = "chatWelcome";
        welcomeDiv.className = "chat-welcome";
        welcomeDiv.innerHTML = `<div style="font-size:42px; margin-bottom:12px;">\uD83C\uDF3F</div><p><strong>Hi there! I'm your INNERVOICE AI companion.</strong></p><p style="margin-top:8px; color:#9ca3af; font-size:14px;">Type a message below to start our conversation. Everything you share stays private.</p>`;
        chatMessagesEl.appendChild(welcomeDiv);

        const token = getToken();

        if (!token || !currentUser) {
            // Offline fallback
            const key = chatStorageKey();
            if (key) {
                try {
                    const stored = JSON.parse(localStorage.getItem(key) || "[]");
                    stored.forEach(function (msg) {
                        renderChatMessage(msg.role, msg.content, msg.created_at, false);
                    });
                } catch (e) { /* empty */ }
            }
            updateChatWelcome();
            return;
        }

        try {
            const res  = await fetch(BACKEND_URL + "/api/chat/history", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success && data.messages) {
                data.messages.forEach(function (msg) {
                    const isCrisis = msg.role === "ai" && (isCrisisMessage(msg.content) || msg.content.includes("112"));
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
                        renderChatMessage(msg.role, msg.content, msg.created_at, false);
                    });
                } catch (e) { /* empty */ }
            }
        }
        updateChatWelcome();
    };

    // ---- Clear chat (DOM + backend + localStorage) ----
    async function clearChatHistory() {
        if (!confirm("Clear your entire conversation? This cannot be undone.")) return;
        if (chatMessagesEl) {
            chatMessagesEl.innerHTML = "";
            const w = document.createElement("div");
            w.id        = "chatWelcome";
            w.className = "chat-welcome";
            w.innerHTML = `<div style="font-size:42px; margin-bottom:12px;">\uD83C\uDF3F</div><p><strong>Hi there! I'm your INNERVOICE AI companion.</strong></p><p style="margin-top:8px; color:#9ca3af; font-size:14px;">Type a message below to start our conversation.</p>`;
            chatMessagesEl.appendChild(w);
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
        showMessage("\uD83D\uDCAC Conversation cleared.");
    }

    // Backend now handles AI intelligence and crisis detection.
    
    // ---- Main send handler ----
    async function sendChatMessage() {
        if (!chatInputEl || !chatMessagesEl) return;
        const message = chatInputEl.value.trim();
        if (!message) return;

        // Clear + disable input immediately
        chatInputEl.value    = "";
        chatInputEl.disabled = true;
        if (chatSendBtnEl) { chatSendBtnEl.disabled = true; chatSendBtnEl.textContent = "..."; }

        // Render user message
        renderChatMessage("user", message, new Date().toISOString(), false);

        // Show typing indicator
        showTypingIndicator();

        const token = getToken();
        if (!token) {
            hideTypingIndicator();
            renderChatMessage("ai", "Please log in to use the Wellness Assistant.", new Date().toISOString(), false);
            chatInputEl.disabled = false;
            if (chatSendBtnEl) { chatSendBtnEl.disabled = false; chatSendBtnEl.textContent = "Send \u2192"; }
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
                // Crisis is evaluated backend-side, but we can also detect '112' for UI buttons
                const crisis = data.reply.includes("112");
                renderChatMessage("ai", data.reply, new Date().toISOString(), crisis);
            } else {
                renderChatMessage("ai", "I'm sorry, I couldn't generate a response. Please try again.", new Date().toISOString(), false);
            }
        } catch (err) {
            console.error("Error communicating with AI Assistant:", err);
            hideTypingIndicator();
            renderChatMessage("ai", "I'm here for you, but something went wrong connecting to the server. Please check your connection and try again. 🌿", new Date().toISOString(), false);
        }

        chatInputEl.disabled = false;
        if (chatSendBtnEl) { chatSendBtnEl.disabled = false; chatSendBtnEl.textContent = "Send \u2192"; }
        chatInputEl.focus();
    }

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
       11. DAILY CHALLENGE / GOALS — Backend integrated
    ===================================================== */

    const goalsSection = document.querySelector("#goals");
    let currentGoalFilter = 'all';

    async function loadGoalHistory() {
        const token = getToken();
        if (!token || !currentUser) return;
        try {
            const res = await fetch(BACKEND_URL + "/api/goals", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
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
        } catch (err) {
            console.warn("Could not load goals from backend.", err);
        }
    }

    function renderWellnessGoals(goalsArray) {
        const listEl = document.getElementById("wellnessGoalsList");
        const emptyEl = document.getElementById("wellnessGoalsEmpty");
        
        if (!listEl) return;
        
        let filtered = goalsArray;
        if (currentGoalFilter === 'active') {
            filtered = goalsArray.filter(g => getGoalStatus(g) === 'IN_PROGRESS');
        } else if (currentGoalFilter === 'completed') {
            filtered = goalsArray.filter(g => getGoalStatus(g) === 'COMPLETED');
        } else if (currentGoalFilter === 'overdue') {
            filtered = goalsArray.filter(g => getGoalStatus(g) === 'OVERDUE');
        }

        if (filtered.length === 0) {
            listEl.innerHTML = "";
            emptyEl.style.display = "block";
            return;
        }

        emptyEl.style.display = "none";
        
        listEl.innerHTML = filtered.map(goal => {
            const status = getGoalStatus(goal);
            const progressPct = goal.target_value > 0 ? Math.min(100, Math.round((goal.current_progress / goal.target_value) * 100)) : 0;
            const isCompleted = status === 'COMPLETED';
            
            let badgeColor = "#3b82f6";
            let badgeText = "In Progress";
            if (status === 'COMPLETED') { badgeColor = "#10b981"; badgeText = "Completed"; }
            if (status === 'OVERDUE') { badgeColor = "#ef4444"; badgeText = "Overdue"; }
            
            let dateStr = "";
            if (goal.target_date) {
                dateStr = new Date(goal.target_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
            }

            return `
                <div id="goal-entry-${goal.goal_id}" class="iv-card" style="border-left: 4px solid ${badgeColor}; padding: 20px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
                        <div>
                            <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                                <span style="font-size:24px;">🎯</span>
                                <h3 style="font-size:18px; font-weight:700; margin:0; color:#1f2937;">${escapeHTMLSafe(goal.title)}</h3>
                            </div>
                            <div style="display:flex; gap:10px; flex-wrap:wrap; font-size:12px; font-weight:600; color:#6b7280;">
                                <span style="background:#f3f4f6; padding:3px 8px; border-radius:6px;">${escapeHTMLSafe(goal.category)}</span>
                                <span style="background:#f3f4f6; padding:3px 8px; border-radius:6px;">${goal.tracking_type === 'automatic' ? '🤖 Auto' : '🖐️ Manual'}</span>
                                ${dateStr ? `<span style="background:#f3f4f6; padding:3px 8px; border-radius:6px;">📅 Due ${dateStr}</span>` : ''}
                            </div>
                        </div>
                        <span style="font-size:12px; font-weight:700; color:${badgeColor}; background:${badgeColor}22; padding:4px 10px; border-radius:12px;">
                            ${badgeText}
                        </span>
                    </div>

                    <div style="margin-bottom:15px;">
                        <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:600; margin-bottom:6px;">
                            <span style="color:#4b5563;">Progress: ${goal.current_progress} / ${goal.target_value}</span>
                            <span style="color:${badgeColor};">${progressPct}%</span>
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

                    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:15px;">
                        ${!isCompleted && goal.tracking_type === 'manual' ? `
                            <button onclick="updateGoalProgress(${goal.goal_id}, ${goal.current_progress + 1})" class="btn primary" style="padding:6px 14px; font-size:13px; margin:0;">+1 Progress</button>
                            <button onclick="updateGoalProgress(${goal.goal_id}, ${goal.target_value})" class="btn" style="background:#10b981; color:white; padding:6px 14px; font-size:13px; margin:0;">Complete</button>
                        ` : ''}
                        <button onclick="deleteGoalEntry(${goal.goal_id})" class="btn" style="background:transparent; border:1px solid #fca5a5; color:#ef4444; padding:6px 14px; font-size:13px; margin:0;">Delete</button>
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

    window.updateGoalProgress = async function(goalId, newProgress) {
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
                showMessage("Progress updated!");
                loadGoalHistory();
                loadAchievements(true);
            } else {
                showMessage("Failed to update progress: " + data.message);
            }
        } catch (err) {
            console.error(err);
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
                showMessage("\uD83D\uDDD1\uFE0F Goal deleted.");
                loadGoalHistory();
            }
        } catch (err) {
            console.warn(err);
        }
    };

    if (goalsSection) {
        // Goal Form Submit
        const createForm = document.getElementById("createGoalForm");
        createForm?.addEventListener("submit", async function(e) {
            e.preventDefault();
            const token = getToken();
            if (!token) { showMessage("Please login first."); return; }

            const title = document.getElementById("goalTitle").value.trim();
            const category = document.getElementById("goalCategory").value;
            const priority = document.getElementById("goalPriority").value;
            const target_value = document.getElementById("goalTargetValue").value;
            const target_date = document.getElementById("goalTargetDate").value;
            const tracking_type = document.getElementById("goalTrackingType").value;

            if (!title) return;

            const btn = document.getElementById("saveWellnessGoalBtn");
            const originalText = btn.textContent;
            btn.textContent = "Saving...";
            btn.disabled = true;

            try {
                const payload = { title, category, priority, target_value: parseInt(target_value), tracking_type };
                if (target_date) payload.target_date = target_date;

                const res = await fetch(BACKEND_URL + "/api/goals", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    showMessage("🎯 Goal created successfully!");
                    createForm.reset();
                    loadGoalHistory();
                } else {
                    showMessage("❌ " + data.message);
                }
            } catch (err) {
                console.error(err);
                showMessage("❌ Connection error.");
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });

        // Filter buttons
        document.querySelectorAll(".goal-filters .ai-filter-btn").forEach(btn => {
            btn.addEventListener("click", function() {
                document.querySelectorAll(".goal-filters .ai-filter-btn").forEach(b => b.classList.remove("active"));
                this.classList.add("active");
                currentGoalFilter = this.dataset.goalFilter || 'all';
                loadGoalHistory(); // This will just use the current cached goals in memory if we optimized it, but reloading is fine.
            });
        });
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
        const publicSections = ['#home', '#login', '#register'];
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
            window.scrollTo(0, 0);
        }

        // Update active sidebar link
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === sectionId) {
                link.classList.add('active');
            }
        });

        // Special triggers
        if (sectionId === '#dailyPlan' && typeof loadDailyRecommendations === 'function') {
            loadDailyRecommendations();
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
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([...mockWellnessInsights]);
            }, 800); // simulate network delay
        });
    }

    // Initialize UI
    async function initAiInsights() {
        // Show loading state
        const feedContainer = document.getElementById('aiInsightsFeed');
        if(feedContainer) feedContainer.innerHTML = '<div class="ai-loading-state"><div class="ai-dots"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div></div>Analyzing wellness data...</div>';
        
        loadedInsights = await loadWellnessInsights();
        renderAiSummary();
        renderAiWeeklyComparison();
        renderAiTopInsight();
        renderAiRecommendations();
        renderAiInsightsFeed();
    }

    function renderAiSummary() {
        const container = document.getElementById('aiSummaryContent');
        if(!container) return;
        container.innerHTML = `
            <div class="ai-stat-row">
                <span class="ai-stat-label">Overall Wellness</span>
                <span class="ai-stat-val" style="color:#6c63ff;">82%</span>
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Mood Stability</span>
                <span class="ai-stat-val">76%</span>
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Habit Consistency</span>
                <span class="ai-stat-val">88%</span>
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Reflection Activity</span>
                <span class="ai-stat-val">71%</span>
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Goal Progress</span>
                <span class="ai-stat-val">80%</span>
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Focus Consistency</span>
                <span class="ai-stat-val">74%</span>
            </div>
        `;
    }

    function renderAiWeeklyComparison() {
        const container = document.getElementById('aiWeeklyComparisonContent');
        if(!container) return;
        container.innerHTML = `
            <div class="ai-stat-row">
                <span class="ai-stat-label">Mood</span>
                <span class="ai-stat-val trend-up">↑ 12%</span>
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Journaling</span>
                <span class="ai-stat-val trend-up">↑ 20%</span>
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Habits</span>
                <span class="ai-stat-val trend-up">↑ 8%</span>
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Goals</span>
                <span class="ai-stat-val trend-stable">→ 0%</span>
            </div>
            <div class="ai-stat-row">
                <span class="ai-stat-label">Focus</span>
                <span class="ai-stat-val trend-down">↓ 5%</span>
            </div>
        `;
    }

    function renderAiTopInsight() {
        const container = document.getElementById('aiFeaturedInsightContent');
        if(!container) return;
        const topInsight = loadedInsights.find(i => i.priority) || loadedInsights[0];
        
        container.innerHTML = `
            <div class="ai-top-quote">"${topInsight.title}"</div>
            <div style="font-weight:600; font-size:13px; color:#4b5563; margin-bottom:5px;">Why this matters</div>
            <div class="ai-why-matters">Small repeated actions can make it easier to maintain a healthy self-reflection routine.</div>
            <div style="font-weight:600; font-size:13px; color:#4b5563; margin-bottom:5px;">Recommended action:</div>
            <div style="font-size:13px; color:#6b7280; margin-bottom:15px;">${topInsight.recommendation}</div>
            <button class="btn primary" style="width:100%; padding: 8px;" onclick="showToast('Added to Daily Plan (Mock)')">Add to Daily Plan</button>
        `;
    }

    function renderAiRecommendations() {
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

        document.getElementById('aiInsightModal').style.display = 'block';
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
       20. WELLNESS RESOURCES
       - Tab navigation
       - Meditation countdown timer (2 / 5 / 10 min)
       - Animated breathing guide (4-7-8 / Box / 4-4)
       - Relaxation card expand/collapse
       - Activity completion tracking (localStorage)
       - Rotating quotes (20 quotes)
       - Daily wellness tip (day-seeded + manual override)
    ===================================================== */

    // ── Wellness activity tracking via localStorage ──────────────────
    function wellnessTrackKey() {
        const dateStr = new Date().toISOString().slice(0, 10);          // YYYY-MM-DD
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
        });
    });


    // ── MEDITATION TIMER ─────────────────────────────────────────────
    var medMinutes      = 2;
    var medSeconds      = 0;
    var medTotalSeconds = 120;
    var medInterval     = null;
    var medRunning      = false;

    var medTimerDisplayEl = document.getElementById("medTimerDisplay");
    var medTimerLabelEl   = document.getElementById("medTimerLabel");
    var medCircleEl       = document.getElementById("medCircle");
    var medStartBtnEl     = document.getElementById("medStartBtn");
    var medResetBtnEl     = document.getElementById("medResetBtn");

    function medFormatTime(secs) {
        var m = Math.floor(secs / 60);
        var s = secs % 60;
        return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    }

    function medSetDuration(min) {
        if (medRunning) return;
        medMinutes      = min;
        medTotalSeconds = min * 60;
        medSeconds      = medTotalSeconds;
        if (medTimerDisplayEl) medTimerDisplayEl.textContent = medFormatTime(medSeconds);
        if (medTimerLabelEl)   medTimerLabelEl.textContent   = "Ready";
        if (medCircleEl)       medCircleEl.classList.remove("running");
        // Update button styles
        document.querySelectorAll(".med-dur-btn").forEach(function (b) {
            b.classList.toggle("active", parseInt(b.dataset.min) === min);
        });
    }

    function medStart() {
        if (medRunning) return;
        medRunning = true;
        if (medCircleEl)   medCircleEl.classList.add("running");
        if (medStartBtnEl) medStartBtnEl.style.display = "none";
        if (medResetBtnEl) medResetBtnEl.style.display = "inline-block";
        if (medTimerLabelEl) medTimerLabelEl.textContent = "Meditating…";

        medInterval = setInterval(function () {
            medSeconds--;
            if (medTimerDisplayEl) medTimerDisplayEl.textContent = medFormatTime(medSeconds);

            // Phase label based on time remaining
            var pct = medSeconds / medTotalSeconds;
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
                if (medCircleEl)     medCircleEl.classList.remove("running");
                if (medTimerLabelEl) medTimerLabelEl.textContent = "Complete! 🌿";
                if (medStartBtnEl)   medStartBtnEl.style.display = "inline-block";
                if (medStartBtnEl)   medStartBtnEl.textContent   = "▶ Start Again";
                markWellnessDone("Meditation " + medMinutes + " min");
                showMessage("\uD83E\uDDD8 Meditation complete! Well done.");
            }
        }, 1000);
    }

    function medReset() {
        clearInterval(medInterval);
        medRunning = false;
        medSeconds = medTotalSeconds;
        if (medCircleEl)     medCircleEl.classList.remove("running");
        if (medTimerDisplayEl) medTimerDisplayEl.textContent = medFormatTime(medSeconds);
        if (medTimerLabelEl)   medTimerLabelEl.textContent   = "Ready";
        if (medStartBtnEl)   { medStartBtnEl.style.display = "inline-block"; medStartBtnEl.textContent = "▶ Start Meditation"; }
        if (medResetBtnEl)     medResetBtnEl.style.display = "none";
    }

    // Init meditation timer display
    if (medTimerDisplayEl) medTimerDisplayEl.textContent = medFormatTime(medTotalSeconds);

    document.querySelectorAll(".med-dur-btn").forEach(function (btn) {
        btn.addEventListener("click", function () { medSetDuration(parseInt(btn.dataset.min)); });
    });
    if (medStartBtnEl) medStartBtnEl.addEventListener("click", medStart);
    if (medResetBtnEl) medResetBtnEl.addEventListener("click", medReset);


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

    window.loadNotifications = async function () {
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
                await window.loadNotifications();
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
                await window.loadNotifications();
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
                await window.loadNotifications();
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
                window.loadNotifications();
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
            const res = await fetch(BACKEND_URL + "/api/moods/history", {
                headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            if (data.success && data.moods) {
                triggerMoodSelect.innerHTML = data.moods.map(m => `
                    <option value="${m.id}">${m.icon} ${m.mood}</option>
                `).join("");
            }
        } catch(e) {
            console.error(e);
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
            if(data.success && data.patterns) {
                const canvas = document.getElementById("emotionPatternsChart");
                if(!canvas) return;
                
                const labels = data.patterns.map(p => p.trigger_category || p.trigger_note);
                const counts = data.patterns.map(p => p.trigger_count);
                
                if (emotionPatternsChartInstance) {
                    emotionPatternsChartInstance.destroy();
                }
                
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
                }
            }
        } catch(e) {
            console.error(e);
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
                body: JSON.stringify({ mood_id: moodId, trigger_note: note, trigger_category: note })
            });
            const data = await res.json();
            if (data.success) {
                showMessage("Trigger saved!");
                triggerInput.value = '';
                window.loadEmotionPatterns();
            } else {
                alert(data.message);
            }
        } catch(e) {
            console.error(e);
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
                    await fetch(BACKEND_URL + "/api/focus-sessions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                        body: JSON.stringify({ duration_minutes: 25, session_type: 'deep_work' })
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
            const res = await fetch(BACKEND_URL + "/api/focus-sessions/stats", {
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
        container.innerHTML = "";
        
        if (habits.length === 0) {
            container.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: rgba(255,255,255,0.7); background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
                <p style="margin-bottom: 10px;">Build a small routine that works for you.</p>
                <p>Start with one simple habit.</p>
            </div>`;
            return;
        }
        
        habits.forEach(habit => {
            const isCompleted = habit.completed_today;
            const bg = isCompleted ? "rgba(46, 204, 113, 0.1)" : "rgba(255,255,255,0.05)";
            const border = isCompleted ? "1px solid rgba(46, 204, 113, 0.3)" : "1px solid rgba(255,255,255,0.1)";
            const btnText = isCompleted ? "✓ Completed" : "Mark Complete";
            const btnClass = isCompleted ? "btn-secondary" : "btn-primary";
            const freqText = habit.frequency_type === 'daily' ? 'Daily' : `${habit.target_count} times/week`;
            
            const card = document.createElement("div");
            card.style.cssText = `background: ${bg}; border: ${border}; border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; position: relative;`;
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="margin: 0 0 5px; color: #fff; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                            ${habit.name}
                            <span style="font-size: 0.75rem; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; color: #ccc;">${freqText}</span>
                        </h4>
                        <div style="display: flex; gap: 15px; margin-top: 10px;">
                            <span style="color: #ff9a9e; font-size: 0.9rem; font-weight: bold;">🔥 ${habit.current_streak} day streak</span>
                        </div>
                    </div>
                    <button class="btn ${btnClass}" onclick="window.toggleHabit(${habit.id}, ${isCompleted})" style="padding: 0.5rem 1rem; border-radius: 8px;">${btnText}</button>
                </div>
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="font-size: 0.8rem; color: rgba(255,255,255,0.6);">Weekly Progress</span>
                        <span style="font-size: 0.8rem; color: #fff;">${habit.weekly_progress}%</span>
                    </div>
                    <div style="width: 100%; background: rgba(0,0,0,0.3); border-radius: 10px; height: 6px; overflow: hidden;">
                        <div style="height: 100%; width: ${habit.weekly_progress}%; background: #4caf50; border-radius: 10px;"></div>
                    </div>
                </div>
                <button onclick="window.deleteHabit(${habit.id})" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer; display: none;">&times;</button>
            `;
            // Quick hover to show delete button
            card.addEventListener('mouseenter', () => card.querySelector('button[onclick^="window.deleteHabit"]').style.display = 'block');
            card.addEventListener('mouseleave', () => card.querySelector('button[onclick^="window.deleteHabit"]').style.display = 'none');
            
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
                loadHabits();
            } else {
                showMessage(data.message, "error");
            }
        } catch(e) {
            console.error(e);
            showMessage("Failed to update habit", "error");
        }
    };
    
    window.deleteHabit = async function(id) {
        if(!confirm("Delete this habit?")) return;
        const token = localStorage.getItem("innerVoiceToken");
        if (!token) return;
        try {
            const res = await fetch(BACKEND_URL + `/api/habits/${id}`, {
                method: "DELETE",
                headers: { "Authorization": "Bearer " + token }
            });
            if (res.ok) loadHabits();
        } catch(e) { console.error(e); }
    };
    
    const habitForm = document.getElementById("habitForm");
    if (habitForm) {
        habitForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const token = localStorage.getItem("innerVoiceToken");
            if (!token) return;
            
            const payload = {
                name: document.getElementById("habitName").value,
                category: document.getElementById("habitCategory").value,
                frequency_type: document.getElementById("habitFreq").value,
                target_count: parseInt(document.getElementById("habitTarget").value, 10)
            };
            
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
                    closeHabitModal();
                    habitForm.reset();
                    document.getElementById("habitTargetContainer").style.display = "none";
                    loadHabits();
                } else {
                    showMessage(data.message || "Failed to create habit", "error");
                }
            } catch(err) {
                console.error(err);
                showMessage("Error creating habit", "error");
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

});



// =====================================================
// PHASE 7: SMART WELLNESS INSIGHTS
// =====================================================

let currentInsights = [];

async function fetchWellnessInsights() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const [insightsRes, trendsRes, patternsRes] = await Promise.all([
            fetch('/api/wellness-insights', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/wellness-insights/trends', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/wellness-insights/patterns', { headers: { 'Authorization': `Bearer ${token}` } })
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
        const res = await fetch('/api/recommendations', { headers: { 'Authorization': `Bearer ${token}` } });
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

function toggleNotifDropdown() {
    const dd = document.getElementById('notifDropdown');
    if (dd) {
        dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
    }
}

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

async function markAllNotificationsRead() {
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
