const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Update CSS
const newCSS = `
        /* ================= INNERVOICE DESIGN SYSTEM (V2) ================= */
        :root {
            --primary: #6c63ff;
            --primary-light: #eeeaff;
            --secondary: #f472b6;
            --bg-color: #f8fafc;
            --text-dark: #1e293b;
            --text-muted: #64748b;
            --border-color: #e2e8f0;
            --surface: #ffffff;
            --sidebar-width: 260px;
            --nav-height: 75px;
        }

        body.dark-mode {
            --bg-color: #0f172a;
            --text-dark: #f8fafc;
            --text-muted: #94a3b8;
            --border-color: #334155;
            --surface: #1e293b;
            --primary-light: #312e81;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-dark);
            transition: background-color 0.3s, color 0.3s;
        }

        /* ------------------ SHELL VISIBILITY ------------------ */
        body.public-view #privateSidebar,
        body.public-view #privateTopbar {
            display: none !important;
        }

        body.private-view #publicNavbar {
            display: none !important;
        }

        /* ------------------ PUBLIC NAVBAR ------------------ */
        #publicNavbar {
            position: fixed;
            top: 0; left: 0; right: 0;
            height: var(--nav-height);
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 5%;
            box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
            z-index: 1000;
        }
        body.dark-mode #publicNavbar {
            background: rgba(30, 41, 59, 0.95);
        }

        /* ------------------ PRIVATE SHELL ------------------ */
        #privateSidebar {
            position: fixed;
            top: 0; left: 0; bottom: 0;
            width: var(--sidebar-width);
            background: var(--surface);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            z-index: 100;
            transition: transform 0.3s ease;
        }
        
        .sidebar-header {
            height: var(--nav-height);
            display: flex;
            align-items: center;
            padding: 0 24px;
            font-size: 22px;
            font-weight: 800;
            color: var(--primary);
            border-bottom: 1px solid var(--border-color);
        }

        .sidebar-menu {
            flex: 1;
            overflow-y: auto;
            padding: 20px 0;
        }

        .sidebar-group-title {
            padding: 0 24px;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--text-muted);
            margin: 20px 0 8px;
            letter-spacing: 0.5px;
        }

        .sidebar-link {
            display: flex;
            align-items: center;
            padding: 12px 24px;
            color: var(--text-dark);
            text-decoration: none;
            font-size: 15px;
            font-weight: 500;
            transition: all 0.2s;
            cursor: pointer;
            gap: 12px;
        }

        .sidebar-link:hover, .sidebar-link.active {
            background: var(--primary-light);
            color: var(--primary);
            border-right: 3px solid var(--primary);
        }

        #privateTopbar {
            position: fixed;
            top: 0; left: var(--sidebar-width); right: 0;
            height: var(--nav-height);
            background: var(--surface);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 32px;
            z-index: 90;
            transition: left 0.3s ease;
        }

        .topbar-left h2 { font-size: 18px; font-weight: 600; color: var(--text-dark); }
        .topbar-right { display: flex; align-items: center; gap: 16px; }
        
        .icon-btn {
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 50%;
            width: 40px; height: 40px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; color: var(--text-dark); transition: all 0.2s;
        }
        .icon-btn:hover { background: var(--primary-light); color: var(--primary); border-color: var(--primary-light); }

        /* ------------------ SECTIONS ------------------ */
        section {
            display: none;
            animation: fadeIn 0.3s ease-in-out;
        }
        
        body.public-view section {
            padding-top: calc(var(--nav-height) + 40px);
        }

        body.private-view section {
            margin-left: var(--sidebar-width);
            padding: calc(var(--nav-height) + 32px) 40px 40px 40px;
            min-height: 100vh;
        }

        /* Existing nav hide override */
        nav:not(#publicNavbar) { display: none !important; }

        @media (max-width: 768px) {
            #privateSidebar { transform: translateX(-100%); }
            body.sidebar-open #privateSidebar { transform: translateX(0); box-shadow: 4px 0 20px rgba(0,0,0,0.1); }
            #privateTopbar { left: 0; padding: 0 16px; }
            body.private-view section { margin-left: 0; padding: calc(var(--nav-height) + 20px) 20px 20px 20px; }
            #hamburgerBtn { display: flex !important; }
        }
        #hamburgerBtn { display: none; }
        
        /* Typography and Buttons */
        .iv-btn {
            display: inline-flex; align-items: center; justify-content: center;
            padding: 12px 24px; border-radius: 30px; font-weight: 600; font-size: 15px;
            cursor: pointer; border: none; text-decoration: none; transition: all 0.2s;
        }
        .iv-btn-primary { background: var(--primary); color: white; }
        .iv-btn-primary:hover { background: #5a52d5; transform: translateY(-1px); }
        .iv-btn-secondary { background: transparent; color: var(--text-dark); border: 1px solid var(--border-color); }
        .iv-btn-secondary:hover { border-color: var(--primary); color: var(--primary); }

        .iv-card {
            background: var(--surface); border-radius: 16px; padding: 24px;
            border: 1px solid var(--border-color);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .iv-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.04); transform: translateY(-2px); }
`;

// Replace old injected CSS if present, or just append
if (html.includes('/* ================= INNERVOICE DESIGN SYSTEM (V2) ================= */')) {
    html = html.replace(/\/\* ================= INNERVOICE DESIGN SYSTEM \(V2\) ================= \*\/[\s\S]*?(?=<\/style>)/, newCSS);
} else {
    html = html.replace('</style>', newCSS + '\n</style>');
}

// 2. Replace Old Nav with New Shell
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

// Find old <nav> and replace it
html = html.replace(/<nav>[\s\S]*?<\/nav>/, shellHTML);

fs.writeFileSync('index.html', html);
console.log("HTML shell injected successfully.");
