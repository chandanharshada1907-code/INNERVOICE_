const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

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
            --sidebar-width: 250px;
            --nav-height: 70px;
        }

        body.dark-mode {
            --bg-color: #0f172a;
            --text-dark: #f8fafc;
            --text-muted: #94a3b8;
            --border-color: #334155;
            --surface: #1e293b;
            --primary-light: #312e81;
        }

        body.public-view {
            background-color: var(--bg-color);
        }

        /* Layout Structure */
        #publicShell, #privateShell {
            display: none;
        }

        body.public-view #publicShell { display: block; }
        body.private-view #privateShell { display: flex; height: 100vh; overflow: hidden; width: 100vw; }

        /* --- Private Sidebar --- */
        #privateSidebar {
            width: var(--sidebar-width);
            background: var(--surface);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            transition: all 0.3s ease;
            z-index: 100;
        }
        .sidebar-header {
            height: var(--nav-height);
            display: flex;
            align-items: center;
            padding: 0 24px;
            font-size: 20px;
            font-weight: 700;
            color: var(--primary);
            border-bottom: 1px solid var(--border-color);
            text-decoration: none;
        }
        .sidebar-menu {
            flex: 1;
            overflow-y: auto;
            padding: 16px 0;
        }
        .sidebar-group {
            margin-bottom: 24px;
        }
        .sidebar-group-title {
            padding: 0 24px;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--text-muted);
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        .sidebar-link {
            display: flex;
            align-items: center;
            padding: 10px 24px;
            color: var(--text-dark);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            gap: 12px;
            cursor: pointer;
        }
        .sidebar-link:hover, .sidebar-link.active {
            background: var(--primary-light);
            color: var(--primary);
            border-right: 3px solid var(--primary);
        }

        /* --- Private Content Area --- */
        #privateMainWrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: var(--bg-color);
            overflow: hidden;
        }

        #privateTopbar {
            height: var(--nav-height);
            background: var(--surface);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 32px;
            z-index: 90;
        }

        .topbar-left h2 {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
            color: var(--text-dark);
        }
        .topbar-left p {
            font-size: 13px;
            color: var(--text-muted);
            margin: 0;
        }

        .topbar-right {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .icon-btn {
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: var(--text-dark);
            transition: all 0.2s;
        }
        .icon-btn:hover {
            background: var(--primary-light);
            color: var(--primary);
            border-color: var(--primary-light);
        }

        /* --- Main Content Container --- */
        #contentContainer {
            flex: 1;
            overflow-y: auto;
            position: relative;
        }

        /* Overriding existing section behavior in private shell */
        body.private-view section {
            padding: 32px;
            max-width: 1200px;
            margin: 0 auto;
            animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Grid Utilities */
        .iv-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        .iv-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .iv-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }

        @media (max-width: 1024px) {
            .iv-grid-3, .iv-grid-4 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
            #privateSidebar { position: fixed; left: -100%; height: 100vh; }
            .iv-grid-2, .iv-grid-3, .iv-grid-4 { grid-template-columns: 1fr; }
            body.private-view section { padding: 20px; }
            #hamburgerBtn { display: flex !important; }
        }

        #hamburgerBtn {
            display: none;
        }

        body.sidebar-open #privateSidebar {
            left: 0;
            box-shadow: 4px 0 20px rgba(0,0,0,0.1);
        }

        /* Hide public nav inside private view (legacy fallback) */
        body.private-view nav {
            display: none !important;
        }
`;

// Insert right before </style>
html = html.replace('</style>', newCSS + '\n</style>');
fs.writeFileSync('index.html', html);
console.log("CSS injected successfully.");
