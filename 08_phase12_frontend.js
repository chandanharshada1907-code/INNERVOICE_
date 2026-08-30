const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add sidebar link for Analytics
const sidebarNavStr = `<a href="#notifications" class="sidebar-link"><span>🔔</span> Notifications</a>`;
const newSidebarNavStr = `<a href="#notifications" class="sidebar-link"><span>🔔</span> Notifications</a>
                <a href="#analytics" class="sidebar-link" onclick="loadWellnessAnalytics()"><span>📊</span> Analytics</a>`;
if (!html.includes('href="#analytics"')) {
    html = html.replace(sidebarNavStr, newSidebarNavStr);
}

// 2. Add Analytics Section after #dashboard
const analyticsSection = `
    <!-- PHASE 12: WELLNESS ANALYTICS CENTER -->
    <section id="analytics" class="iv-section" style="display:none; margin-top:20px;">
        <div class="dashboard-panel" style="max-width: 900px; margin: auto; padding: 24px;">
            <div class="dash-widget-header" style="margin-bottom: 24px; border-bottom: 1px solid #eee; padding-bottom: 16px;">
                <h2 style="font-size: 24px; font-weight: 700;"><span>📊</span> Personal Wellness Analytics</h2>
                <div style="display:flex; gap:10px; margin-top: 15px;">
                    <button class="iv-btn iv-btn-primary analytics-period-btn" data-period="7">7 Days</button>
                    <button class="iv-btn iv-btn-secondary analytics-period-btn" data-period="30">30 Days</button>
                    <button class="iv-btn iv-btn-secondary analytics-period-btn" data-period="90">90 Days</button>
                    <button class="iv-btn iv-btn-secondary analytics-period-btn" data-period="all">All Time</button>
                </div>
            </div>

            <!-- Empty State -->
            <div id="analyticsEmptyState" style="display: none; text-align: center; padding: 40px; background: #f9fafb; border-radius: 12px;">
                <div style="font-size: 40px; margin-bottom: 10px;">📉</div>
                <h3 style="font-size: 18px; margin-bottom: 10px;">No Data Available</h3>
                <p style="color: #6b7280;">Keep tracking your mood, habits, and goals to generate personalized wellness insights.</p>
            </div>

            <!-- Content -->
            <div id="analyticsContent" style="display: block;">
                <!-- Summary & Strengths -->
                <div style="background: linear-gradient(145deg, #f0fdf4, #dcfce7); padding: 20px; border-radius: 16px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
                    <h3 style="font-size: 18px; margin-bottom: 8px;">✨ Progress Summary</h3>
                    <p id="analyticsSummary" style="font-size: 15px; color: #166534; font-weight: 500;"></p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 16px;">
                        <div style="background: rgba(255,255,255,0.7); padding: 12px; border-radius: 12px;">
                            <h4 style="font-size: 13px; text-transform: uppercase; color: #15803d; margin-bottom: 8px;">💪 Strengths</h4>
                            <ul id="analyticsStrengths" style="margin-left: 20px; font-size: 14px; color: #166534;"></ul>
                        </div>
                        <div style="background: rgba(255,255,255,0.7); padding: 12px; border-radius: 12px;">
                            <h4 style="font-size: 13px; text-transform: uppercase; color: #c2410c; margin-bottom: 8px;">📈 Areas to Improve</h4>
                            <ul id="analyticsImprovements" style="margin-left: 20px; font-size: 14px; color: #c2410c;"></ul>
                        </div>
                    </div>
                </div>

                <!-- Main Metrics Grid -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px;">
                    <div style="background: white; padding: 20px; border-radius: 16px; border: 1px solid #eee; text-align: center;">
                        <div style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">Avg Wellness Score</div>
                        <div id="analyticsScore" style="font-size: 32px; font-weight: 800; color: var(--primary);"></div>
                        <div id="analyticsScoreChange" style="font-size: 13px; font-weight: 600; margin-top: 4px;"></div>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 16px; border: 1px solid #eee; text-align: center;">
                        <div style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">Avg Mood</div>
                        <div style="font-size: 32px; font-weight: 800; color: #10b981;"><span id="analyticsMoodAvg"></span><span style="font-size: 16px;">/5</span></div>
                        <div id="analyticsMoodFreq" style="font-size: 13px; font-weight: 600; color: #6b7280; margin-top: 4px;"></div>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 16px; border: 1px solid #eee; text-align: center;">
                        <div style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">Goal Completion</div>
                        <div id="analyticsGoalPct" style="font-size: 32px; font-weight: 800; color: #f59e0b;"></div>
                        <div id="analyticsHabitPct" style="font-size: 13px; font-weight: 600; color: #6b7280; margin-top: 4px;"></div>
                    </div>
                </div>

                <!-- Charts Area -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                    <div style="background: white; padding: 20px; border-radius: 16px; border: 1px solid #eee;">
                        <h4 style="font-size: 15px; margin-bottom: 12px; color: #444;">Score Trend</h4>
                        <canvas id="analyticsScoreChart" style="width: 100%; height: 200px;"></canvas>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 16px; border: 1px solid #eee;">
                        <h4 style="font-size: 15px; margin-bottom: 12px; color: #444;">Mood Trend</h4>
                        <canvas id="analyticsMoodChart" style="width: 100%; height: 200px;"></canvas>
                    </div>
                </div>
                
                <!-- Additional Stats -->
                <div style="background: white; padding: 20px; border-radius: 16px; border: 1px solid #eee; margin-bottom: 24px;">
                     <div style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">Tracking Stats</div>
                     <div style="display: flex; justify-content: space-around;">
                         <div id="analyticsMoodStats" style="font-size: 14px; font-weight: 600; color: #444;"></div>
                         <div id="analyticsGoalStats" style="font-size: 14px; font-weight: 600; color: #444;"></div>
                     </div>
                </div>

                <!-- Personal Bests -->
                <div style="background: white; padding: 20px; border-radius: 16px; border: 1px solid #eee;">
                    <h3 style="font-size: 18px; margin-bottom: 16px;">🏆 Personal Bests</h3>
                    <div id="analyticsBests" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
                        
                    </div>
                </div>

            </div>
        </div>
    </section>
`;

if (!html.includes('<section id="analytics"')) {
    html = html.replace('</section>', '</section>\n' + analyticsSection);
}

// 3. Inject Analytics Preview Widget into right column of Dashboard
const dashboardPreviewStr = `
                <!-- Analytics Preview Widget -->
                <div class="dash-widget" style="margin-bottom:24px;">
                    <div class="dash-widget-header">
                        <h3><span>📊</span> 7-Day Analytics</h3>
                        <a href="#analytics" onclick="showSection('#analytics'); loadWellnessAnalytics('7'); return false;" style="font-size:13px; color:var(--primary); font-weight:600; text-decoration:none;">View Full</a>
                    </div>
                    <div style="display:flex; justify-content:space-between; text-align:center; padding: 10px 0;">
                        <div>
                            <div id="dashPreviewMood" style="font-size:24px; font-weight:800; color:#10b981;">--</div>
                            <div style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:600;">Avg Mood</div>
                        </div>
                        <div>
                            <div id="dashPreviewGoals" style="font-size:24px; font-weight:800; color:#f59e0b;">--</div>
                            <div style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:600;">Goal Pct</div>
                        </div>
                        <div>
                            <div id="dashPreviewHabits" style="font-size:24px; font-weight:800; color:var(--primary);">--</div>
                            <div style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:600;">Habits</div>
                        </div>
                    </div>
                </div>
`;

if (!html.includes('<!-- Analytics Preview Widget -->')) {
    html = html.replace("<!-- Today's Plan -->", dashboardPreviewStr + "\\n                <!-- Today's Plan -->");
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully added Analytics Phase 12 to index.html');
