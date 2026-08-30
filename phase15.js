
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
