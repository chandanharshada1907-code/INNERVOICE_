const fs = require('fs');

function restoreUI() {
    let html = fs.readFileSync('index.html', 'utf8');

    // 1. Remove Premium Feature Headers
    // The feature headers look like: <div class="feature-header">...</div>
    // We can regex them out. They are always directly after <section id="...">
    html = html.replace(/<div class="feature-header">[\s\S]*?<\/div>\s*<\/div>/g, '');
    // Wait, the inner div might cause issues. Let's just remove the exact structure.
    html = html.replace(/<div class="feature-header">[\s\S]*?(?=<!--|^\s*<div|^\s*<form|^\s*<h2|^\s*<h3|^\s*<canvas|^\s*<ul|^\s*<p|^\s*<button|^\s*<table)/gm, function(match) {
        // Just checking if we can strip it. Actually, it's safer to use a more specific regex.
        return '';
    });
    // Actually, let's just strip the block from `<div class="feature-header">` up to the closing `</div>` of `.feature-header-right` or `.feature-header-left`.
    // It's easier to remove `<div class="feature-header">...</div>` exactly.
    // Let's use a lazy match but ensure we don't eat the section content.
    html = html.replace(/<div class="feature-header">\s*<div class="feature-header-left">[\s\S]*?<\/div>\s*(?:<div class="feature-header-right">[\s\S]*?<\/div>\s*)?<\/div>/g, '');


    // 2. Remove Premium CSS
    if (html.includes('/* ================= PREMIUM INNERVOICE DESIGN SYSTEM ================= */')) {
        html = html.replace(/\/\* ================= PREMIUM INNERVOICE DESIGN SYSTEM ================= \*\/[\s\S]*?(?=\/\* ================= OLD DESIGN SYSTEM ================= \*\/)/, '');
    }
    if (html.includes('/* ================= PREMIUM SHELL ================= */')) {
        html = html.replace(/\/\* ================= PREMIUM SHELL ================= \*\/[\s\S]*?(?=\/\* ================= OLD DESIGN SYSTEM ================= \*\/)/, '');
    }
    if (html.includes('/* ================= PREMIUM HOME & AUTH STYLES ================= */')) {
        html = html.replace(/\/\* ================= PREMIUM HOME & AUTH STYLES ================= \*\/[\s\S]*?(?=\/\* ================= OLD DESIGN SYSTEM ================= \*\/)/, '');
    }
    if (html.includes('/* ================= PREMIUM DASHBOARD STYLES ================= */')) {
        html = html.replace(/\/\* ================= PREMIUM DASHBOARD STYLES ================= \*\/[\s\S]*?(?=\/\* ================= OLD DESIGN SYSTEM ================= \*\/)/, '');
    }
    if (html.includes('/* ================= PREMIUM FEATURE PAGES ================= */')) {
        html = html.replace(/\/\* ================= PREMIUM FEATURE PAGES ================= \*\/[\s\S]*?(?=\/\* ================= OLD DESIGN SYSTEM ================= \*\/)/, '');
    }
    
    // Clean up empty /* ================= OLD DESIGN SYSTEM ================= */ markers
    html = html.replace(/\/\* ================= OLD DESIGN SYSTEM ================= \*\/\n?/g, '');

    // 3. Restore Public Navbar, Sidebar, Topbar
    const shellHTML = `
    <!-- ================= PUBLIC NAVBAR ================= -->
    <nav id="publicNavbar">
        <div class="logo">🌿 INNERVOICE</div>
        <ul class="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#home" onclick="alert('Scroll to Why INNERVOICE')">Features</a></li>
        </ul>
        <div class="nav-buttons" style="display:flex; align-items:center; gap:12px;">
            <a href="#login" class="login-btn" style="font-weight:600; text-decoration:none; color:var(--primary);">Login</a>
            <a href="#register" class="iv-btn iv-btn-primary">Get Started</a>
        </div>
    </nav>

    <!-- ================= PRIVATE SIDEBAR ================= -->
    <aside id="privateSidebar">
        <div class="sidebar-header">🌿 INNERVOICE</div>
        <div class="sidebar-menu">
            
            <a href="#dashboard" class="sidebar-link active"><span>🏠</span> Dashboard</a>

            <div class="sidebar-group-title">Mood</div>
            <a href="#mood" class="sidebar-link"><span>💭</span> Mood Tracker</a>
            <a href="#emotionPatterns" class="sidebar-link"><span>📊</span> Analytics</a>

            <div class="sidebar-group-title">Reflection</div>
            <a href="#journal" class="sidebar-link"><span>📝</span> Personal Journal</a>
            <a href="#reflection" class="sidebar-link"><span>✨</span> Reflections</a>
            <a href="#voiceJournal" class="sidebar-link"><span>🎤</span> Voice Journal</a>

            <div class="sidebar-group-title">Wellness</div>
            <a href="#dailyPlan" class="sidebar-link"><span>🌱</span> Daily Plan</a>
            <a href="#goals" class="sidebar-link"><span>🎯</span> Goals</a>
            
            <div class="sidebar-group-title">Insights</div>
            <a href="#aiInsights" class="sidebar-link"><span>🧠</span> AI Insights</a>
            <a href="#chatbot" class="sidebar-link"><span>🤖</span> AI Chatbot</a>

            <div class="sidebar-group-title">Progress</div>
            <a href="#achievements" class="sidebar-link"><span>🏆</span> Achievements</a>
            <a href="#focusMode" class="sidebar-link"><span>⏱️</span> Focus Sessions</a>

            <div class="sidebar-group-title">Relax</div>
            <a href="#resources" class="sidebar-link"><span>🌿</span> Resources (Meditation/Music)</a>

            <div class="sidebar-group-title">System</div>
            <a href="#profile" class="sidebar-link"><span>⚙️</span> Settings & Profile</a>
            <a onclick="window.openEmergencyModal()" class="sidebar-link" style="color:#ef4444;"><span>🆘</span> Emergency Help</a>
        </div>
    </aside>

    <!-- ================= PRIVATE TOPBAR ================= -->
    <header id="privateTopbar">
        <div class="topbar-left" style="display:flex; align-items:center; gap:16px;">
            <button id="hamburgerBtn" class="icon-btn" style="border:none;">☰</button>
            <div>
                <h2 id="topbarGreeting">Good Morning 🌿</h2>
                <p>How are you feeling today?</p>
            </div>
        </div>
        <div class="topbar-right">
            <!-- Reuse original notification and emergency UI but stylize -->
            <button type="button" id="notifBellBtn2" class="icon-btn" style="position:relative;">
                🔔
                <span id="notifBadge" class="notif-badge" style="display:none; position:absolute; top:-3px; right:-3px; background:#ef4444; color:white; font-size:11px; font-weight:700; border-radius:10px; padding:2px 5px;">0</span>
            </button>
            <button class="icon-btn" onclick="toggleTheme()" title="Toggle Dark Mode">🌓</button>
            <button class="icon-btn" onclick="logout()" title="Logout">🚪</button>
        </div>
    </header>
`;
    // Remove the premium ones
    html = html.replace(/<aside id="privateSidebar">[\s\S]*?<\/aside>/, '');
    html = html.replace(/<header id="privateTopbar">[\s\S]*?<\/header>/, '');
    // Replace public navbar with full shell
    html = html.replace(/<nav id="publicNavbar">[\s\S]*?<\/nav>/, shellHTML);

    // 4. Restore Home
    const oldHomeHTML = `
    <!-- =====================================================
     1. HOME / LANDING PAGE
    ===================================================== -->
    <section id="home" style="display:block;">
        
        <!-- Hero Section -->
        <div style="display:flex; align-items:center; justify-content:space-between; padding:80px 5%; background:linear-gradient(135deg, var(--bg-color), #fff); min-height:80vh;">
            <div style="max-width:600px;">
                <h1 style="font-size:56px; font-weight:800; color:var(--text-dark); margin-bottom:24px; line-height:1.1;">
                    Your personal <span style="color:var(--primary);">mental wellness</span> companion.
                </h1>
                <p style="font-size:20px; color:var(--text-muted); margin-bottom:40px; line-height:1.6;">
                    INNERVOICE helps you track your mood, reflect on your thoughts, build positive habits, and understand your emotional patterns.
                </p>
                <div style="display:flex; gap:16px;">
                    <a href="#register" class="iv-btn iv-btn-primary" style="padding:16px 32px; font-size:18px;">Start for free</a>
                    <a href="#login" class="iv-btn iv-btn-secondary" style="padding:16px 32px; font-size:18px;">Log in</a>
                </div>
            </div>
            <div style="width:500px; height:500px; background:var(--primary-light); border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 20px 40px rgba(108,99,255,0.15);">
                <div style="font-size:120px;">🌿</div>
            </div>
        </div>

        <!-- Features / Why INNERVOICE -->
        <div style="padding:80px 5%; background:var(--surface);">
            <div style="text-align:center; margin-bottom:60px;">
                <h2 style="font-size:36px; font-weight:700; color:var(--text-dark); margin-bottom:16px;">Everything you need for your mind</h2>
                <p style="font-size:18px; color:var(--text-muted); max-width:600px; margin:0 auto;">A complete toolkit designed to foster self-awareness and emotional growth.</p>
            </div>
            
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:32px;">
                <div class="iv-card">
                    <div style="font-size:40px; margin-bottom:16px;">💭</div>
                    <h3 style="font-size:20px; font-weight:700; margin-bottom:12px;">Mood Tracking</h3>
                    <p style="color:var(--text-muted); line-height:1.5;">Log your daily emotions and discover patterns in your mood over time with intuitive analytics.</p>
                </div>
                <div class="iv-card">
                    <div style="font-size:40px; margin-bottom:16px;">📝</div>
                    <h3 style="font-size:20px; font-weight:700; margin-bottom:12px;">Smart Journaling</h3>
                    <p style="color:var(--text-muted); line-height:1.5;">Express yourself through text or voice. Get AI-powered insights on your entries.</p>
                </div>
                <div class="iv-card">
                    <div style="font-size:40px; margin-bottom:16px;">🌱</div>
                    <h3 style="font-size:20px; font-weight:700; margin-bottom:12px;">Habit Building</h3>
                    <p style="color:var(--text-muted); line-height:1.5;">Set daily routines and track your consistency. Small steps lead to big changes.</p>
                </div>
                <div class="iv-card">
                    <div style="font-size:40px; margin-bottom:16px;">📊</div>
                    <h3 style="font-size:20px; font-weight:700; margin-bottom:12px;">Wellness Score</h3>
                    <p style="color:var(--text-muted); line-height:1.5;">Get a holistic view of your mental wellbeing based on your activity and reflections.</p>
                </div>
            </div>
        </div>

    </section>
`;
    html = html.replace(/<section id="home">[\s\S]*?(?=<section id="register">)/, oldHomeHTML + '\n\n    ');

    // 5. Restore Auth
    const oldAuthHTML = `
    <!-- =====================================================
     2. REGISTER
    ===================================================== -->
    <section id="register">
        <div style="min-height:80vh; display:flex; align-items:center; justify-content:center; padding:40px 5%;">
            <div class="iv-card" style="max-width:450px; width:100%; padding:40px;">
                <div style="text-align:center; margin-bottom:32px;">
                    <div style="font-size:48px; margin-bottom:16px;">🌿</div>
                    <h2 style="font-size:28px; font-weight:700; color:var(--text-dark); margin-bottom:8px;">Create Account</h2>
                    <p style="color:var(--text-muted);">Start your wellness journey today.</p>
                </div>
                
                <form id="registerForm" onsubmit="event.preventDefault(); window.location.hash = '#dashboard';">
                    <div style="margin-bottom:20px;">
                        <label style="display:block; margin-bottom:8px; font-weight:600; color:var(--text-dark);">Full Name</label>
                        <input type="text" id="regName" placeholder="e.g. Jane Doe" required style="width:100%; padding:12px 16px; border-radius:8px; border:1px solid var(--border-color); font-size:16px;">
                    </div>
                    <div style="margin-bottom:20px;">
                        <label style="display:block; margin-bottom:8px; font-weight:600; color:var(--text-dark);">Email Address</label>
                        <input type="email" id="regEmail" placeholder="jane@example.com" required style="width:100%; padding:12px 16px; border-radius:8px; border:1px solid var(--border-color); font-size:16px;">
                    </div>
                    <div style="margin-bottom:20px;">
                        <label style="display:block; margin-bottom:8px; font-weight:600; color:var(--text-dark);">Password</label>
                        <input type="password" id="regPassword" placeholder="••••••••" required style="width:100%; padding:12px 16px; border-radius:8px; border:1px solid var(--border-color); font-size:16px;">
                    </div>
                    <div style="margin-bottom:32px;">
                        <label style="display:block; margin-bottom:8px; font-weight:600; color:var(--text-dark);">Confirm Password</label>
                        <input type="password" id="regConfirmPassword" placeholder="••••••••" required style="width:100%; padding:12px 16px; border-radius:8px; border:1px solid var(--border-color); font-size:16px;">
                    </div>
                    <button type="submit" class="iv-btn iv-btn-primary" style="width:100%; padding:14px; font-size:16px;">Sign Up</button>
                </form>
                
                <div style="text-align:center; margin-top:24px;">
                    <p style="color:var(--text-muted);">Already have an account? <a href="#login" style="color:var(--primary); font-weight:600; text-decoration:none;">Log in</a></p>
                </div>
            </div>
        </div>
    </section>

    <!-- =====================================================
     3. LOGIN
    ===================================================== -->
    <section id="login">
        <div style="min-height:80vh; display:flex; align-items:center; justify-content:center; padding:40px 5%;">
            <div class="iv-card" style="max-width:450px; width:100%; padding:40px;">
                <div style="text-align:center; margin-bottom:32px;">
                    <div style="font-size:48px; margin-bottom:16px;">🌿</div>
                    <h2 style="font-size:28px; font-weight:700; color:var(--text-dark); margin-bottom:8px;">Welcome Back</h2>
                    <p style="color:var(--text-muted);">Log in to continue your journey.</p>
                </div>
                
                <form id="loginForm" onsubmit="event.preventDefault(); window.location.hash = '#dashboard';">
                    <div style="margin-bottom:20px;">
                        <label style="display:block; margin-bottom:8px; font-weight:600; color:var(--text-dark);">Email Address</label>
                        <input type="email" id="logEmail" placeholder="jane@example.com" required style="width:100%; padding:12px 16px; border-radius:8px; border:1px solid var(--border-color); font-size:16px;">
                    </div>
                    <div style="margin-bottom:32px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <label style="margin:0; font-weight:600; color:var(--text-dark);">Password</label>
                            <a href="#" style="color:var(--primary); font-size:14px; text-decoration:none;">Forgot password?</a>
                        </div>
                        <input type="password" id="logPassword" placeholder="••••••••" required style="width:100%; padding:12px 16px; border-radius:8px; border:1px solid var(--border-color); font-size:16px;">
                    </div>
                    <button type="submit" class="iv-btn iv-btn-primary" style="width:100%; padding:14px; font-size:16px;">Log In</button>
                </form>
                
                <div style="text-align:center; margin-top:24px;">
                    <p style="color:var(--text-muted);">Don't have an account? <a href="#register" style="color:var(--primary); font-weight:600; text-decoration:none;">Sign up</a></p>
                </div>
            </div>
        </div>
    </section>
`;
    html = html.replace(/<section id="register">[\s\S]*?(?=<section id="dashboard">)/, oldAuthHTML + '\n\n    ');

    // 6. Restore Dashboard
    const oldDashboardHTML = `
    <!-- =====================================================
     4. DASHBOARD
    ===================================================== -->
    <section id="dashboard">
        <h2 class="section-title">Overview</h2>
        <p class="section-subtitle">A summary of your wellness journey.</p>
        
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:24px; margin-bottom:32px;">
            <div class="iv-card" style="display:flex; align-items:center; gap:20px;">
                <div style="width:60px; height:60px; border-radius:50%; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:24px;">📊</div>
                <div>
                    <div style="font-size:14px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Wellness Score</div>
                    <div style="font-size:32px; font-weight:800; color:var(--text-dark);" id="dashScoreVal">82</div>
                </div>
            </div>
            <div class="iv-card" style="display:flex; align-items:center; gap:20px;">
                <div style="width:60px; height:60px; border-radius:50%; background:#fef3c7; color:#f59e0b; display:flex; align-items:center; justify-content:center; font-size:24px;">🔥</div>
                <div>
                    <div style="font-size:14px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Current Streak</div>
                    <div style="font-size:32px; font-weight:800; color:var(--text-dark);" id="dashStreakVal">5 Days</div>
                </div>
            </div>
            <div class="iv-card" style="display:flex; align-items:center; gap:20px;">
                <div style="width:60px; height:60px; border-radius:50%; background:#d1fae5; color:#10b981; display:flex; align-items:center; justify-content:center; font-size:24px;">🏆</div>
                <div>
                    <div style="font-size:14px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Achievement Level</div>
                    <div style="font-size:32px; font-weight:800; color:var(--text-dark);" id="dashLevelVal">Lvl 3</div>
                </div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns:2fr 1fr; gap:24px;">
            <!-- Left Column -->
            <div>
                <!-- Daily Plan -->
                <div class="iv-card" style="margin-bottom:24px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h3 style="font-size:18px; font-weight:700;">🌱 Today's Plan</h3>
                        <a href="#dailyPlan" style="color:var(--primary); font-size:14px; font-weight:600; text-decoration:none;">View All</a>
                    </div>
                    <ul style="list-style:none; padding:0; margin:0;">
                        <li style="display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid var(--border-color);">
                            <input type="checkbox" checked style="width:20px; height:20px;">
                            <div>
                                <div style="font-weight:600; color:var(--text-muted); text-decoration:line-through;">Morning Check-in</div>
                                <div style="font-size:12px; color:var(--text-light);">Completed</div>
                            </div>
                        </li>
                        <li style="display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid var(--border-color);">
                            <input type="checkbox" style="width:20px; height:20px;">
                            <div>
                                <div style="font-weight:600;">5-Minute Breathing</div>
                                <div style="font-size:12px; color:var(--text-muted);">Pending</div>
                            </div>
                        </li>
                        <li style="display:flex; align-items:center; gap:12px; padding:12px 0;">
                            <input type="checkbox" style="width:20px; height:20px;">
                            <div>
                                <div style="font-weight:600;">Evening Reflection</div>
                                <div style="font-size:12px; color:var(--text-muted);">Pending</div>
                            </div>
                        </li>
                    </ul>
                </div>
                
                <!-- Quick Actions -->
                <div class="iv-card">
                    <h3 style="font-size:18px; font-weight:700; margin-bottom:20px;">⚡ Quick Actions</h3>
                    <div style="display:flex; gap:16px;">
                        <button class="iv-btn iv-btn-primary" onclick="showSection('#mood')">Log Mood</button>
                        <button class="iv-btn iv-btn-secondary" onclick="showSection('#journal')">Write Journal</button>
                        <button class="iv-btn iv-btn-secondary" onclick="showSection('#focusMode')">Focus Timer</button>
                    </div>
                </div>
            </div>

            <!-- Right Column -->
            <div>
                <!-- Habit Preview -->
                <div class="iv-card" style="margin-bottom:24px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h3 style="font-size:18px; font-weight:700;">🔥 Habits</h3>
                        <a href="#habitTrackerSection" style="color:var(--primary); font-size:14px; font-weight:600; text-decoration:none;">Manage</a>
                    </div>
                    <div style="margin-bottom:16px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="font-weight:600; font-size:14px;">💧 Drink Water</span>
                            <span style="font-weight:600; font-size:14px; color:var(--primary);">80%</span>
                        </div>
                        <div style="height:8px; background:var(--bg-color); border-radius:4px; overflow:hidden;">
                            <div style="height:100%; background:var(--primary); width:80%;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="font-weight:600; font-size:14px;">📚 Read 10 Pages</span>
                            <span style="font-weight:600; font-size:14px; color:var(--primary);">40%</span>
                        </div>
                        <div style="height:8px; background:var(--bg-color); border-radius:4px; overflow:hidden;">
                            <div style="height:100%; background:var(--primary); width:40%;"></div>
                        </div>
                    </div>
                </div>
                
                <!-- AI Insight Preview -->
                <div class="iv-card" style="background:var(--primary-light); border:none;">
                    <h3 style="font-size:16px; font-weight:700; color:var(--primary); margin-bottom:12px;">🧠 AI Insight</h3>
                    <p style="font-size:14px; color:var(--text-dark); line-height:1.5;">You've logged "Anxious" three times this week in the afternoon. Consider scheduling a short breathing exercise at 2 PM.</p>
                </div>
            </div>
        </div>

    </section>
`;
    html = html.replace(/<section id="dashboard">[\s\S]*?(?=<section id="aiInsights">)/, oldDashboardHTML + '\n\n    ');


    // Remove Google Fonts added in premium update
    html = html.replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">\s*/, '');

    fs.writeFileSync('index.html', html);
    console.log('Restored previous UI successfully!');
}

restoreUI();
