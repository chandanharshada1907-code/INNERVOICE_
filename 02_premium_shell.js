const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const premiumShellCSS = `
        /* ================= PREMIUM SHELL ================= */
        
        /* --- Public Navbar --- */
        #publicNavbar {
            position: fixed;
            top: 0; left: 0; right: 0;
            height: var(--nav-height);
            background: var(--glass-bg);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 5%;
            border-bottom: 1px solid var(--border-light);
            z-index: 1000;
            transition: all var(--transition-normal);
        }
        
        .logo {
            font-size: 24px;
            font-weight: 800;
            color: var(--primary);
            letter-spacing: -0.5px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .nav-links {
            display: flex;
            gap: 32px;
            list-style: none;
            margin: 0;
            padding: 0;
        }

        .nav-links a {
            color: var(--text-dark);
            text-decoration: none;
            font-weight: 500;
            font-size: 15px;
            transition: color var(--transition-fast);
        }
        .nav-links a:hover {
            color: var(--primary);
        }

        /* --- Private Sidebar --- */
        #privateSidebar {
            position: fixed;
            top: 0; left: 0; bottom: 0;
            width: var(--sidebar-width);
            background: var(--surface);
            border-right: 1px solid var(--border-light);
            display: flex;
            flex-direction: column;
            z-index: 100;
            transition: transform var(--transition-normal);
        }
        
        .sidebar-header {
            height: var(--nav-height);
            display: flex;
            align-items: center;
            padding: 0 28px;
            font-size: 24px;
            font-weight: 800;
            color: var(--primary);
            letter-spacing: -0.5px;
        }

        .sidebar-menu {
            flex: 1;
            overflow-y: auto;
            padding: 16px 12px;
        }

        .sidebar-group-title {
            padding: 0 16px;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--text-muted);
            margin: 24px 0 8px;
            letter-spacing: 0.1em;
            opacity: 0.8;
        }

        .sidebar-link {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            margin-bottom: 4px;
            color: var(--text-dark);
            text-decoration: none;
            font-size: 15px;
            font-weight: 500;
            border-radius: 12px;
            transition: all var(--transition-fast);
            cursor: pointer;
            gap: 14px;
        }

        .sidebar-link span {
            font-size: 18px;
            opacity: 0.8;
            transition: transform var(--transition-fast);
        }

        .sidebar-link:hover {
            background: var(--surface-hover);
            color: var(--primary);
        }
        
        .sidebar-link:hover span {
            transform: scale(1.1);
            opacity: 1;
        }

        .sidebar-link.active {
            background: var(--primary-light);
            color: var(--primary);
            font-weight: 600;
        }
        
        .sidebar-link.active span {
            opacity: 1;
        }

        /* Remove the ugly right border from active state in old CSS */
        .sidebar-link:hover, .sidebar-link.active {
            border-right: none; 
        }

        .sidebar-footer {
            padding: 16px 12px;
            border-top: 1px solid var(--border-light);
        }

        /* --- Private Topbar --- */
        #privateTopbar {
            position: fixed;
            top: 0; left: var(--sidebar-width); right: 0;
            height: var(--nav-height);
            background: var(--glass-bg);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid var(--border-light);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 40px;
            z-index: 90;
            transition: left var(--transition-normal);
        }

        .topbar-left h2 { 
            font-size: 20px; 
            font-weight: 700; 
            color: var(--text-dark); 
            letter-spacing: -0.5px;
            margin-bottom: 2px;
        }
        .topbar-left p {
            font-size: 14px;
            color: var(--text-muted);
        }

        .topbar-right { display: flex; align-items: center; gap: 16px; }
        
        .icon-btn {
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 50%;
            width: 44px; height: 44px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; color: var(--text-dark); 
            transition: all var(--transition-fast);
            font-size: 18px;
        }
        .icon-btn:hover { 
            background: var(--primary-light); 
            color: var(--primary); 
            border-color: var(--primary-light); 
            transform: translateY(-2px);
        }
        
        .profile-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 4px 10px rgba(108, 99, 255, 0.3);
            cursor: pointer;
            border: 2px solid white;
        }

        /* --- Sections Core --- */
        body.private-view section {
            margin-left: var(--sidebar-width);
            padding: calc(var(--nav-height) + 40px) 40px 60px 40px;
            min-height: 100vh;
            max-width: 1400px; /* Don't stretch infinitely on ultrawide */
            margin-right: auto;
        }
`;

// Insert the CSS right below the previous block
if (html.includes('/* ================= OLD DESIGN SYSTEM ================= */')) {
    html = html.replace('/* ================= OLD DESIGN SYSTEM ================= */', premiumShellCSS + '\n/* ================= OLD DESIGN SYSTEM ================= */');
}

// 2. Replace HTML Shell
const premiumSidebarHTML = `
    <!-- ================= PRIVATE SIDEBAR (PREMIUM) ================= -->
    <aside id="privateSidebar">
        <div class="sidebar-header">🌿 INNERVOICE</div>
        <div class="sidebar-menu">
            
            <a href="#dashboard" class="sidebar-link active"><span>🏠</span> Dashboard</a>

            <div class="sidebar-group-title">Understanding</div>
            <a href="#mood" class="sidebar-link"><span>✨</span> Mood Check-in</a>
            <a href="#emotionPatterns" class="sidebar-link"><span>📊</span> Analytics</a>

            <div class="sidebar-group-title">Expression</div>
            <a href="#journal" class="sidebar-link"><span>📝</span> Private Journal</a>
            <a href="#reflection" class="sidebar-link"><span>💭</span> Reflections</a>
            <a href="#voiceJournal" class="sidebar-link"><span>🎤</span> Voice Journal</a>

            <div class="sidebar-group-title">Growth</div>
            <a href="#dailyPlan" class="sidebar-link"><span>🌱</span> Daily Routine</a>
            <a href="#goals" class="sidebar-link"><span>🎯</span> Goal Tracking</a>
            <a href="#achievements" class="sidebar-link"><span>🏆</span> Milestones</a>

            <div class="sidebar-group-title">AI Assistance</div>
            <a href="#aiInsights" class="sidebar-link"><span>🧠</span> Smart Insights</a>
            <a href="#chatbot" class="sidebar-link"><span>🤖</span> Wellness Chat</a>

            <div class="sidebar-group-title">Wellness</div>
            <a href="#focusMode" class="sidebar-link"><span>⏱️</span> Focus Session</a>
            <a href="#resources" class="sidebar-link"><span>🎧</span> Meditation & Sounds</a>

        </div>
        <div class="sidebar-footer">
            <a href="#profile" class="sidebar-link"><span>⚙️</span> Settings</a>
            <a onclick="window.openEmergencyModal()" class="sidebar-link" style="color:var(--danger); background:var(--danger-light);">
                <span>🆘</span> Emergency
            </a>
        </div>
    </aside>
`;

const premiumTopbarHTML = `
    <!-- ================= PRIVATE TOPBAR (PREMIUM) ================= -->
    <header id="privateTopbar">
        <div class="topbar-left" style="display:flex; align-items:center; gap:16px;">
            <button id="hamburgerBtn" class="icon-btn" style="border:none; display:none;">☰</button>
            <div>
                <h2 id="topbarGreeting">Good Morning, Guest</h2>
                <p>Ready for a moment of reflection?</p>
            </div>
        </div>
        <div class="topbar-right">
            <!-- Search Placeholder -->
            <div style="position:relative; margin-right:12px;" class="hide-mobile">
                <input type="text" placeholder="Search..." style="padding: 10px 16px 10px 36px; border-radius: 20px; width: 200px; height: 40px; font-size:14px; border:none; background:var(--bg-color);">
                <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); opacity:0.5;">🔍</span>
            </div>
            
            <button type="button" id="notifBellBtn2" class="icon-btn" style="position:relative;">
                🔔
                <span id="notifBadge" class="notif-badge" style="display:none; position:absolute; top:-2px; right:-2px; background:var(--danger); color:white; font-size:10px; font-weight:800; border-radius:10px; padding:2px 5px; box-shadow:0 2px 4px rgba(244,63,94,0.4);">0</span>
            </button>
            <button class="icon-btn" onclick="toggleTheme()" title="Toggle Dark Mode">🌓</button>
            
            <!-- Profile Dropdown Trigger (Logout is now inside settings/profile, or we can just bind it directly here for now to preserve function) -->
            <div class="profile-avatar" onclick="logout()" title="Logout">U</div>
        </div>
    </header>
`;

// Replace old sidebar
html = html.replace(/<aside id="privateSidebar">[\s\S]*?<\/aside>/, premiumSidebarHTML);
// Replace old topbar
html = html.replace(/<header id="privateTopbar">[\s\S]*?<\/header>/, premiumTopbarHTML);

fs.writeFileSync('index.html', html);
console.log("Premium Shell injected successfully.");
