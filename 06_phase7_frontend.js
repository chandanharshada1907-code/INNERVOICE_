const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add Sidebar Link
if (!html.includes('href="#wellnessInsights"')) {
    html = html.replace(
        /<div class="sidebar-group-title">Insights<\/div>/,
        '<div class="sidebar-group-title">Insights</div>\n            <a href="#wellnessInsights" class="sidebar-link"><span>💡</span> Smart Insights</a>'
    );
}

// 2. Add Dashboard Widget
const dashWidget = `
                <!-- Smart Wellness Insight Preview -->
                <div class="iv-card" style="background:var(--primary-light); border:none; margin-bottom:24px;">
                    <h3 style="font-size:16px; font-weight:700; color:var(--primary); margin-bottom:12px;">🧠 Smart Insight</h3>
                    <p id="dashTopInsight" style="font-size:14px; color:var(--text-dark); line-height:1.5;">Generating insights...</p>
                    <a href="#wellnessInsights" style="color:var(--primary); font-size:12px; font-weight:700; text-decoration:none; margin-top:12px; display:inline-block;">View All Insights</a>
                </div>
`;
// Replace the old AI Insight preview which is just static
if (html.includes('<!-- AI Insight Preview -->')) {
    html = html.replace(/<!-- AI Insight Preview -->[\s\S]*?<\/div>\s*<\/div>/, dashWidget + '\n            </div>');
} else if (!html.includes('id="dashTopInsight"')) {
    // Inject before the end of the right column if it's missing
    html = html.replace(/(<!-- Right Column -->[\s\S]*?)(?=<\/div>\s*<\/div>\s*<\/section>)/, '$1\n' + dashWidget);
}

// 3. Add Feature Section
const featureSection = `
    <!-- =====================================================
     PHASE 7: SMART WELLNESS INSIGHTS
    ===================================================== -->
    <section id="wellnessInsights">
        <h2 class="section-title">Smart Wellness Insights</h2>
        <p class="section-subtitle">Discover patterns in your wellbeing journey.</p>
        
        <div style="margin-bottom:24px; display:flex; gap:12px; overflow-x:auto; padding-bottom:12px;">
            <button class="iv-btn iv-btn-primary" onclick="filterInsights('ALL')">All</button>
            <button class="iv-btn iv-btn-secondary" onclick="filterInsights('MOOD PATTERN')">Mood</button>
            <button class="iv-btn iv-btn-secondary" onclick="filterInsights('HABIT PATTERN')">Habits</button>
            <button class="iv-btn iv-btn-secondary" onclick="filterInsights('JOURNAL PATTERN')">Journal</button>
            <button class="iv-btn iv-btn-secondary" onclick="filterInsights('WELLNESS TREND')">Wellness</button>
        </div>

        <div id="insightsContainer" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:24px;">
            <!-- Rendered via JS -->
            <div class="iv-card">Loading your patterns...</div>
        </div>
    </section>
`;

if (!html.includes('id="wellnessInsights"')) {
    html = html.replace(/<\/body>/, featureSection + '\n</body>');
}

fs.writeFileSync('index.html', html);
console.log("Phase 7 Frontend injected successfully.");
