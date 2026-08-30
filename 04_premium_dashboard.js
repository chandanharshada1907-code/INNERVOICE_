const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const premiumDashboardCSS = `
        /* ================= PREMIUM DASHBOARD STYLES ================= */
        
        .dash-hero {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border-radius: 32px;
            padding: 48px;
            color: white;
            margin-bottom: 40px;
            box-shadow: var(--shadow-lg);
            position: relative;
            overflow: hidden;
        }

        .dash-hero::before {
            content: '';
            position: absolute;
            width: 400px; height: 400px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
            top: -100px; right: -100px;
        }

        .dash-hero-left {
            position: relative;
            z-index: 10;
            max-width: 500px;
        }

        .dash-hero-left h1 {
            font-size: 40px;
            font-weight: 800;
            color: white;
            margin-bottom: 12px;
        }

        .dash-hero-left p {
            font-size: 18px;
            color: rgba(255,255,255,0.9);
            margin-bottom: 32px;
        }
        
        .dash-mood-quick {
            display: flex;
            gap: 12px;
        }

        .mq-btn {
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 20px;
            padding: 12px 20px;
            font-size: 24px;
            cursor: pointer;
            transition: all var(--transition-normal);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }
        .mq-btn span {
            font-size: 11px;
            font-weight: 700;
            color: white;
            text-transform: uppercase;
        }
        
        .mq-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-5px);
            box-shadow: var(--shadow-md);
        }

        .dash-hero-right {
            position: relative;
            z-index: 10;
            display: flex;
            align-items: center;
            gap: 24px;
        }

        /* SVG Circular Progress */
        .progress-ring {
            width: 160px;
            height: 160px;
        }
        .progress-ring__circle {
            stroke: rgba(255,255,255,0.2);
            stroke-width: 12;
            fill: transparent;
        }
        .progress-ring__fill {
            stroke: white;
            stroke-width: 12;
            stroke-linecap: round;
            fill: transparent;
            stroke-dasharray: 439.8;
            stroke-dashoffset: 87.96; /* 80% */
            transition: stroke-dashoffset 1s ease-in-out;
        }
        
        .progress-content {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            width: 100px;
        }
        .progress-content h2 {
            font-size: 42px;
            font-weight: 800;
            color: white;
            margin: 0;
            line-height: 1;
        }
        .progress-content p {
            font-size: 11px;
            font-weight: 700;
            color: rgba(255,255,255,0.8);
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* --- Quick Stats --- */
        .premium-stat-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
            margin-bottom: 40px;
        }

        .premium-stat-card {
            background: var(--surface);
            border-radius: 24px;
            padding: 24px;
            border: 1px solid var(--border-light);
            display: flex;
            align-items: center;
            gap: 20px;
            box-shadow: var(--shadow-sm);
            transition: all var(--transition-normal);
        }
        .premium-stat-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-md);
        }

        .ps-icon {
            width: 64px; height: 64px;
            border-radius: 20px;
            display: flex; align-items: center; justify-content: center;
            font-size: 32px;
        }

        .ps-details h4 {
            font-size: 12px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 4px;
        }
        .ps-details .ps-val {
            font-size: 28px;
            font-weight: 800;
            color: var(--text-dark);
            line-height: 1;
        }

        /* --- Bento Dashboard Widgets --- */
        .dash-bento {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 24px;
            margin-bottom: 40px;
        }

        .bento-widget {
            background: var(--surface);
            border-radius: 32px;
            padding: 32px;
            border: 1px solid var(--border-light);
            box-shadow: var(--shadow-sm);
        }

        .widget-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }
        .widget-header h3 {
            font-size: 20px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        /* Plan List */
        .plan-list {
            list-style: none; padding: 0; margin: 0;
        }
        .plan-item {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px;
            background: var(--bg-color);
            border-radius: 16px;
            margin-bottom: 12px;
            transition: all var(--transition-fast);
            border: 1px solid transparent;
        }
        .plan-item:hover {
            border-color: var(--primary-light);
            background: white;
            box-shadow: var(--shadow-sm);
        }
        .custom-checkbox {
            width: 28px; height: 28px;
            border-radius: 8px;
            border: 2px solid var(--border-color);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: all var(--transition-fast);
            background: white;
        }
        .plan-item.done .custom-checkbox {
            background: var(--success);
            border-color: var(--success);
        }
        .plan-item.done .custom-checkbox::after {
            content: '✓'; color: white; font-weight: 800;
        }
        .plan-item.done .plan-text h4 {
            text-decoration: line-through;
            color: var(--text-light);
        }
        
        .plan-text h4 { font-size: 16px; margin-bottom: 4px; transition: all 0.2s; }
        .plan-text p { font-size: 13px; margin: 0; }

        /* Mini Habit Progress */
        .habit-preview {
            margin-bottom: 24px;
        }
        .habit-preview h4 {
            display: flex; justify-content: space-between;
            font-size: 15px; margin-bottom: 12px;
        }
        .hp-bar {
            height: 10px;
            background: var(--bg-color);
            border-radius: 5px;
            overflow: hidden;
        }
        .hp-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            border-radius: 5px;
        }

        @media (max-width: 1024px) {
            .dash-hero { flex-direction: column; align-items: flex-start; gap: 40px; }
            .premium-stat-grid { grid-template-columns: repeat(2, 1fr); }
            .dash-bento { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
            .premium-stat-grid { grid-template-columns: 1fr; }
            .dash-hero-right { align-self: center; }
            .dash-mood-quick { flex-wrap: wrap; justify-content: center; }
        }
`;

const premiumDashboardHTML = `
    <!-- =====================================================
     4. DASHBOARD (PREMIUM)
    ===================================================== -->
    <section id="dashboard">
        
        <div class="dash-hero">
            <div class="dash-hero-left">
                <h1>Good Morning, Explorer 🌿</h1>
                <p>Let's take a moment for yourself before starting the day.</p>
                <div class="dash-mood-quick">
                    <div class="mq-btn" onclick="showSection('#mood')">😊 <span>Happy</span></div>
                    <div class="mq-btn" onclick="showSection('#mood')">😌 <span>Calm</span></div>
                    <div class="mq-btn" onclick="showSection('#mood')">😐 <span>Neutral</span></div>
                    <div class="mq-btn" onclick="showSection('#mood')">😔 <span>Low</span></div>
                </div>
            </div>
            <div class="dash-hero-right">
                <div style="position:relative;">
                    <svg class="progress-ring">
                        <circle class="progress-ring__circle" cx="80" cy="80" r="70"></circle>
                        <circle class="progress-ring__fill" cx="80" cy="80" r="70"></circle>
                    </svg>
                    <div class="progress-content">
                        <h2>82</h2>
                        <p>Score</p>
                    </div>
                </div>
                <div>
                    <h3 style="color:white; font-size:18px; margin-bottom:8px;">Great Job!</h3>
                    <p style="color:rgba(255,255,255,0.8); font-size:14px; max-width:150px;">You are up 8% compared to last week.</p>
                </div>
            </div>
        </div>

        <div class="premium-stat-grid">
            <div class="premium-stat-card">
                <div class="ps-icon" style="background:#f3f0ff; color:var(--primary);">📊</div>
                <div class="ps-details">
                    <h4>Wellness Score</h4>
                    <div class="ps-val" id="dashScoreVal">82</div>
                </div>
            </div>
            <div class="premium-stat-card">
                <div class="ps-icon" style="background:var(--warning-light); color:var(--warning);">🔥</div>
                <div class="ps-details">
                    <h4>Current Streak</h4>
                    <div class="ps-val" id="dashStreakVal">5 Days</div>
                </div>
            </div>
            <div class="premium-stat-card">
                <div class="ps-icon" style="background:var(--success-light); color:var(--success);">🏆</div>
                <div class="ps-details">
                    <h4>Current Level</h4>
                    <div class="ps-val" id="dashLevelVal">Lvl 3</div>
                </div>
            </div>
            <div class="premium-stat-card">
                <div class="ps-icon" style="background:var(--danger-light); color:var(--danger);">🎯</div>
                <div class="ps-details">
                    <h4>Active Goals</h4>
                    <div class="ps-val" id="dashGoalsVal">2</div>
                </div>
            </div>
        </div>

        <div class="dash-bento">
            
            <div class="dash-col-left">
                <!-- Premium Daily Plan -->
                <div class="bento-widget" style="margin-bottom:24px;">
                    <div class="widget-header">
                        <h3><span>🌱</span> Today's Wellness Plan</h3>
                        <a href="#dailyPlan" class="iv-btn iv-btn-ghost">View All</a>
                    </div>
                    
                    <ul class="plan-list">
                        <li class="plan-item done">
                            <div class="custom-checkbox"></div>
                            <div class="plan-text">
                                <h4>Morning Check-in</h4>
                                <p>Log your mood to start the day.</p>
                            </div>
                        </li>
                        <li class="plan-item">
                            <div class="custom-checkbox"></div>
                            <div class="plan-text">
                                <h4>5-Minute Breathing</h4>
                                <p>Take a moment to center yourself.</p>
                            </div>
                        </li>
                        <li class="plan-item">
                            <div class="custom-checkbox"></div>
                            <div class="plan-text">
                                <h4>Evening Reflection</h4>
                                <p>Jot down one thing you are grateful for.</p>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- AI Insight Premium Card -->
                <div class="bento-widget" style="background: linear-gradient(135deg, #1e293b, #0f172a); color:white; border:none; box-shadow:var(--shadow-lg);">
                    <div class="widget-header">
                        <h3 style="color:white;"><span>🧠</span> Smart Insight</h3>
                        <a href="#aiInsights" style="color:var(--accent); text-decoration:none; font-weight:600; font-size:14px;">Explore</a>
                    </div>
                    <p style="font-size:18px; line-height:1.6; color:rgba(255,255,255,0.9); margin-bottom:20px; font-weight:300;">
                        "Your recent activity shows consistent progress. You tend to feel more anxious on Thursdays; consider scheduling a short meditation session tomorrow."
                    </p>
                    <div style="display:flex; gap:12px;">
                        <span style="background:rgba(255,255,255,0.1); padding:6px 12px; border-radius:20px; font-size:12px; color:var(--accent);">#Consistency</span>
                        <span style="background:rgba(255,255,255,0.1); padding:6px 12px; border-radius:20px; font-size:12px; color:var(--accent);">#StressManagement</span>
                    </div>
                </div>

            </div>

            <div class="dash-col-right">
                
                <!-- Premium Habit Widget -->
                <div class="bento-widget" style="margin-bottom:24px;">
                    <div class="widget-header">
                        <h3><span>🔥</span> Active Habits</h3>
                        <a href="#habitTrackerSection" class="iv-btn iv-btn-ghost">Manage</a>
                    </div>
                    
                    <div class="habit-preview">
                        <h4><span>💧 Drink Water</span> <span style="color:var(--primary); font-weight:700;">80%</span></h4>
                        <div class="hp-bar"><div class="hp-fill" style="width: 80%;"></div></div>
                        <div style="font-size:12px; color:var(--text-muted); margin-top:8px;">8 day streak</div>
                    </div>
                    <div class="habit-preview">
                        <h4><span>📚 Read 10 Pages</span> <span style="color:var(--primary); font-weight:700;">40%</span></h4>
                        <div class="hp-bar"><div class="hp-fill" style="width: 40%;"></div></div>
                        <div style="font-size:12px; color:var(--text-muted); margin-top:8px;">2 day streak</div>
                    </div>
                    <div class="habit-preview">
                        <h4><span>🧘‍♀️ Meditate</span> <span style="color:var(--primary); font-weight:700;">100%</span></h4>
                        <div class="hp-bar"><div class="hp-fill" style="width: 100%; background:var(--success);"></div></div>
                        <div style="font-size:12px; color:var(--success); font-weight:700; margin-top:8px;">Completed today!</div>
                    </div>
                </div>

                <!-- Weekly Report Mini -->
                <div class="bento-widget">
                    <div style="text-align:center;">
                        <div style="font-size:48px; margin-bottom:16px;">📊</div>
                        <h3 style="font-size:18px; margin-bottom:8px;">Weekly Report</h3>
                        <p style="font-size:14px; color:var(--text-muted); margin-bottom:24px;">Your wellness analytics for the past 7 days are ready.</p>
                        <a href="#emotionPatterns" class="iv-btn iv-btn-secondary" style="width:100%;">View Report</a>
                    </div>
                </div>

            </div>
        </div>
    </section>
`;

// Insert CSS
if (html.includes('/* ================= OLD DESIGN SYSTEM ================= */')) {
    html = html.replace('/* ================= OLD DESIGN SYSTEM ================= */', premiumDashboardCSS + '\n/* ================= OLD DESIGN SYSTEM ================= */');
}

// Replace Dashboard section
html = html.replace(/<section id="dashboard">[\s\S]*?(?=<section id="aiInsights">)/, premiumDashboardHTML + '\n\n    ');

fs.writeFileSync('index.html', html);
console.log("Premium Dashboard injected successfully.");
