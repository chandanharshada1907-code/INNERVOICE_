const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const dashboardCSS = `
        /* ================= NEW DASHBOARD UI ================= */
        .dash-header-row {
            margin-bottom: 24px;
        }

        .stat-cards-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: var(--surface);
            border-radius: 16px;
            padding: 20px;
            border: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            gap: 16px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.04);
        }

        .stat-icon {
            font-size: 28px;
            width: 56px;
            height: 56px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--primary-light);
        }

        .stat-details h4 {
            color: var(--text-muted);
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 4px;
            text-transform: uppercase;
        }
        .stat-details .stat-value {
            color: var(--text-dark);
            font-size: 24px;
            font-weight: 800;
            line-height: 1.1;
        }

        .dash-main-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 24px;
            margin-bottom: 24px;
        }
        @media (max-width: 1024px) {
            .dash-main-grid { grid-template-columns: 1fr; }
        }

        .dash-widget {
            background: var(--surface);
            border-radius: 20px;
            border: 1px solid var(--border-color);
            padding: 24px;
        }

        .dash-widget-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .dash-widget-header h3 {
            font-size: 18px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .dash-mood-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }

        .mood-btn {
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 16px 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        .mood-btn:hover { background: var(--primary-light); border-color: var(--primary); }
        .mood-btn .emoji { font-size: 32px; margin-bottom: 8px; display: block; }
        .mood-btn .label { font-size: 12px; font-weight: 600; color: var(--text-muted); }

        .preview-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .preview-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
            border-bottom: 1px solid var(--border-color);
        }
        .preview-item:last-child { border-bottom: none; }
        .preview-item-icon {
            width: 40px; height: 40px; border-radius: 8px; background: var(--bg-color);
            display: flex; align-items: center; justify-content: center; font-size: 20px;
        }
        .preview-item-content flex { flex: 1; }
        .preview-item h4 { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
        .preview-item p { font-size: 12px; color: var(--text-muted); }
`;

const newDashboardHTML = `
    <!-- =====================================================
     4. DASHBOARD (REDESIGNED)
    ===================================================== -->
    <section id="dashboard">
        <div class="dash-header-row">
            <h1 class="page-title">Welcome to INNERVOICE 🌿</h1>
            <p class="page-subtitle">Here is your wellness overview for today.</p>
        </div>

        <div class="stat-cards-grid">
            <div class="stat-card">
                <div class="stat-icon" style="background:#e0e7ff; color:#4f46e5;">🌟</div>
                <div class="stat-details">
                    <h4>Wellness Score</h4>
                    <div class="stat-value" id="dashScoreVal">82%</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:#ffedd5; color:#ea580c;">🔥</div>
                <div class="stat-details">
                    <h4>Current Streak</h4>
                    <div class="stat-value" id="dashStreakVal">5 Days</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:#fce7f3; color:#db2777;">🏆</div>
                <div class="stat-details">
                    <h4>Level</h4>
                    <div class="stat-value" id="dashLevelVal">Level 3</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:#dcfce7; color:#16a34a;">🎯</div>
                <div class="stat-details">
                    <h4>Active Goals</h4>
                    <div class="stat-value" id="dashGoalsVal">2</div>
                </div>
            </div>
        </div>

        <div class="dash-main-grid">
            
            <!-- Left Column -->
            <div class="dash-col-left">
                
                <!-- Mood Check-in Widget -->
                <div class="dash-widget" style="margin-bottom:24px;">
                    <div class="dash-widget-header">
                        <h3><span>✨</span> How are you feeling right now?</h3>
                    </div>
                    <div class="dash-mood-grid">
                        <div class="mood-btn" onclick="showSection('#mood')">
                            <span class="emoji">😊</span><span class="label">Happy</span>
                        </div>
                        <div class="mood-btn" onclick="showSection('#mood')">
                            <span class="emoji">😌</span><span class="label">Calm</span>
                        </div>
                        <div class="mood-btn" onclick="showSection('#mood')">
                            <span class="emoji">🙂</span><span class="label">Good</span>
                        </div>
                        <div class="mood-btn" onclick="showSection('#mood')">
                            <span class="emoji">😐</span><span class="label">Neutral</span>
                        </div>
                        <div class="mood-btn" onclick="showSection('#mood')">
                            <span class="emoji">😔</span><span class="label">Sad</span>
                        </div>
                        <div class="mood-btn" onclick="showSection('#mood')">
                            <span class="emoji">😰</span><span class="label">Anxious</span>
                        </div>
                        <div class="mood-btn" onclick="showSection('#mood')">
                            <span class="emoji">😡</span><span class="label">Angry</span>
                        </div>
                    </div>
                    <a href="#mood" class="iv-btn iv-btn-secondary" style="width:100%; border-radius:12px;">Go to full Mood Tracker</a>
                </div>

                <!-- AI Insight Preview -->
                <div class="dash-widget" style="background: linear-gradient(145deg, var(--surface), var(--primary-light)); border: 1px solid var(--primary-light);">
                    <div class="dash-widget-header">
                        <h3><span>🧠</span> Latest AI Wellness Insight</h3>
                        <a href="#aiInsights" style="font-size:13px; color:var(--primary); font-weight:600; text-decoration:none;">View All</a>
                    </div>
                    <p style="font-size:16px; font-weight:500; color:var(--text-dark); margin-bottom:12px; line-height:1.5;">
                        "Your recent wellness activity shows consistent progress in your daily routines. Your mood check-ins have been very stable over the past 5 days."
                    </p>
                    <p style="font-size:13px; color:var(--text-muted);">
                        Recommended: Continue your current daily routine and add a short journal entry.
                    </p>
                </div>

            </div>

            <!-- Right Column -->
            <div class="dash-col-right">
                
                <!-- Today's Plan -->
                <div class="dash-widget" style="margin-bottom:24px;">
                    <div class="dash-widget-header">
                        <h3><span>🌱</span> Today's Plan</h3>
                        <a href="#dailyPlan" style="font-size:13px; color:var(--primary); font-weight:600; text-decoration:none;">View Plan</a>
                    </div>
                    <ul class="preview-list">
                        <li class="preview-item">
                            <div class="preview-item-icon" style="color:#16a34a;">✓</div>
                            <div style="flex:1;">
                                <h4>Morning Check-in</h4>
                                <p>Completed at 9:00 AM</p>
                            </div>
                        </li>
                        <li class="preview-item">
                            <div class="preview-item-icon" style="color:var(--text-muted);">○</div>
                            <div style="flex:1;">
                                <h4>5-Minute Breathing</h4>
                                <p>Pending</p>
                            </div>
                        </li>
                        <li class="preview-item">
                            <div class="preview-item-icon" style="color:var(--text-muted);">○</div>
                            <div style="flex:1;">
                                <h4>Short Reflection</h4>
                                <p>Pending</p>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- Habits Preview -->
                <div class="dash-widget">
                    <div class="dash-widget-header">
                        <h3><span>🔥</span> Active Habits</h3>
                        <a href="#habitTrackerSection" style="font-size:13px; color:var(--primary); font-weight:600; text-decoration:none;">Manage</a>
                    </div>
                    <ul class="preview-list">
                        <li class="preview-item">
                            <div style="flex:1;">
                                <h4>Drink Water</h4>
                                <div style="height:6px; background:var(--bg-color); border-radius:3px; margin-top:8px; overflow:hidden;">
                                    <div style="height:100%; width:100%; background:var(--primary);"></div>
                                </div>
                            </div>
                        </li>
                        <li class="preview-item">
                            <div style="flex:1;">
                                <h4>Read 10 Pages</h4>
                                <div style="height:6px; background:var(--bg-color); border-radius:3px; margin-top:8px; overflow:hidden;">
                                    <div style="height:100%; width:40%; background:var(--primary);"></div>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>

            </div>
        </div>

        <div class="iv-grid-3">
            <div class="iv-card" style="text-align:center;">
                <div style="font-size:40px; margin-bottom:12px;">📊</div>
                <h3 style="margin-bottom:8px;">Weekly Report</h3>
                <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">View your wellness progress for the week.</p>
                <a href="#emotionPatterns" class="iv-btn iv-btn-secondary" style="width:100%;">View Report</a>
            </div>
            <div class="iv-card" style="text-align:center;">
                <div style="font-size:40px; margin-bottom:12px;">🏆</div>
                <h3 style="margin-bottom:8px;">Achievements</h3>
                <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">Check your unlocked badges and levels.</p>
                <a href="#achievements" class="iv-btn iv-btn-secondary" style="width:100%;">View Badges</a>
            </div>
            <div class="iv-card" style="text-align:center;">
                <div style="font-size:40px; margin-bottom:12px;">🤖</div>
                <h3 style="margin-bottom:8px;">AI Companion</h3>
                <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">Chat with your empathetic wellness assistant.</p>
                <a href="#chatbot" class="iv-btn iv-btn-secondary" style="width:100%;">Start Chat</a>
            </div>
        </div>
    </section>
`;

html = html.replace('</style>', dashboardCSS + '\n</style>');
html = html.replace(/<section id="dashboard">[\s\S]*?(?=<section id="aiInsights">)/, newDashboardHTML + '\n\n    ');

fs.writeFileSync('index.html', html);
console.log("Dashboard updated successfully.");
