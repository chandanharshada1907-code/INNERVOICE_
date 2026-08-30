const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf8');

const insightsJS = `
// =====================================================
// PHASE 7: SMART WELLNESS INSIGHTS
// =====================================================

let currentInsights = [];

async function fetchWellnessInsights() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const [insightsRes, trendsRes, patternsRes] = await Promise.all([
            fetch('/api/wellness-insights', { headers: { 'Authorization': \`Bearer \${token}\` } }),
            fetch('/api/wellness-insights/trends', { headers: { 'Authorization': \`Bearer \${token}\` } }),
            fetch('/api/wellness-insights/patterns', { headers: { 'Authorization': \`Bearer \${token}\` } })
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
        container.innerHTML = \`
            <div class="iv-card" style="grid-column: 1 / -1; text-align:center; padding:40px;">
                <div style="font-size:40px; margin-bottom:16px;">🌱</div>
                <h3 style="font-size:20px; font-weight:700;">Not enough data yet</h3>
                <p style="color:var(--text-muted); max-width:400px; margin:0 auto;">
                    We need a bit more data to identify patterns. Keep logging your mood, habits, and journals!
                </p>
            </div>
        \`;
        return;
    }
    
    container.innerHTML = insights.map(insight => {
        let icon = '💡';
        if (insight.category.includes('MOOD')) icon = '😌';
        if (insight.category.includes('HABIT')) icon = '🔥';
        if (insight.category.includes('JOURNAL')) icon = '📝';
        if (insight.category.includes('TREND') || insight.category.includes('WELLNESS')) icon = '📊';
        
        return \`
            <div class="iv-card" style="display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                        <span style="background:var(--primary-light); color:var(--primary); font-size:11px; font-weight:700; padding:4px 8px; border-radius:12px;">\${insight.category}</span>
                        \${insight.importance === 'HIGH' ? '<span style="color:#ef4444; font-size:12px; font-weight:700;">HIGH IMPORTANCE</span>' : ''}
                    </div>
                    <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:12px;">
                        <div style="font-size:24px;">\${icon}</div>
                        <h3 style="font-size:18px; font-weight:700; margin:0;">\${insight.title}</h3>
                    </div>
                    <p style="color:var(--text-dark); margin-bottom:16px; font-size:15px; line-height:1.5;">\${insight.description}</p>
                </div>
                <div style="background:var(--bg-color); padding:12px; border-radius:12px; border:1px solid var(--border-color);">
                    <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">Recommendation</div>
                    <p style="margin:0; font-size:14px; color:var(--primary);">\${insight.recommendation}</p>
                </div>
            </div>
        \`;
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
`;

// Insert the JS into script.js before the loadDashboardData call
if (!js.includes('function fetchWellnessInsights')) {
    // Append to end of script
    js += '\n\n' + insightsJS;
}

// Ensure it gets called on dashboard load
if (js.includes('function loadDashboardData() {') && !js.includes('fetchWellnessInsights();')) {
    js = js.replace(/function loadDashboardData\(\) \{/, 'function loadDashboardData() {\n    fetchWellnessInsights();');
} else if (js.includes('async function loadDashboardData() {') && !js.includes('fetchWellnessInsights();')) {
    js = js.replace(/async function loadDashboardData\(\) \{/, 'async function loadDashboardData() {\n    fetchWellnessInsights();');
}

fs.writeFileSync('script.js', js);
console.log("Phase 7 JS injected successfully.");
