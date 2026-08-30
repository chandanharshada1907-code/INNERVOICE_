const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add Google Fonts
if (!html.includes('fonts.googleapis.com')) {
    html = html.replace('</head>', `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</head>`);
}

// 2. Premium Design System Variables & Base Overrides
const premiumCSS = `
        /* ================= PREMIUM INNERVOICE DESIGN SYSTEM ================= */
        :root {
            /* Color Palette */
            --primary: #6c63ff;
            --primary-light: #eeeaff;
            --secondary: #8b7cf6;
            --secondary-light: #f3f0ff;
            --accent: #a7f3d0;
            --accent-dark: #059669;
            
            --bg-color: #f8f7fc;
            --surface: #ffffff;
            --surface-hover: #fcfcfd;
            
            --text-dark: #1e293b;
            --text-muted: #64748b;
            --text-light: #94a3b8;
            
            --border-color: #e2e8f0;
            --border-light: rgba(226, 232, 240, 0.5);
            
            --danger: #f43f5e;
            --danger-light: #fff1f2;
            --success: #10b981;
            --success-light: #ecfdf5;
            --warning: #f59e0b;
            --warning-light: #fffbeb;

            /* Dimensions */
            --sidebar-width: 280px;
            --nav-height: 80px;

            /* Shadows & Glass */
            --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
            --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.06);
            --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.08);
            --shadow-glow: 0 0 20px rgba(108, 99, 255, 0.15);
            --glass-bg: rgba(255, 255, 255, 0.85);
            --glass-border: rgba(255, 255, 255, 0.5);
            
            /* Transitions */
            --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            --transition-normal: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        body.dark-mode {
            --primary: #8b7cf6;
            --primary-light: rgba(139, 124, 246, 0.15);
            --secondary: #a78bfa;
            --accent: #34d399;
            
            --bg-color: #0f172a;
            --surface: #1e293b;
            --surface-hover: #273549;
            
            --text-dark: #f8fafc;
            --text-muted: #94a3b8;
            --text-light: #64748b;
            
            --border-color: rgba(255, 255, 255, 0.1);
            --border-light: rgba(255, 255, 255, 0.05);

            --glass-bg: rgba(30, 41, 59, 0.85);
            --glass-border: rgba(255, 255, 255, 0.05);
            
            --shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.3);
            --shadow-md: 0 12px 32px rgba(0, 0, 0, 0.4);
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-dark);
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        /* ------------------ GLOBAL TYPOGRAPHY ------------------ */
        h1, h2, h3, h4, h5, h6 {
            font-weight: 700;
            line-height: 1.2;
            letter-spacing: -0.02em;
            color: var(--text-dark);
        }
        
        p {
            color: var(--text-muted);
            letter-spacing: 0.01em;
        }

        /* ------------------ PREMIUM BUTTONS ------------------ */
        button, .iv-btn {
            font-family: 'Inter', sans-serif;
            border: none;
            outline: none;
            cursor: pointer;
            border-radius: 12px;
            font-weight: 600;
            font-size: 15px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all var(--transition-normal);
            text-decoration: none;
            padding: 12px 24px;
        }

        .iv-btn-primary, button.primary, .btn-primary {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: #ffffff !important;
            box-shadow: 0 4px 12px rgba(108, 99, 255, 0.3);
        }
        .iv-btn-primary:hover, button.primary:hover, .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(108, 99, 255, 0.4);
            background: linear-gradient(135deg, #5a52d5, #7c6ee6);
        }

        .iv-btn-secondary, button.secondary, .btn-secondary {
            background: var(--surface);
            color: var(--text-dark) !important;
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-sm);
        }
        .iv-btn-secondary:hover, button.secondary:hover, .btn-secondary:hover {
            border-color: var(--primary);
            color: var(--primary) !important;
            transform: translateY(-1px);
        }
        
        .iv-btn-ghost {
            background: transparent;
            color: var(--text-muted);
        }
        .iv-btn-ghost:hover {
            background: var(--primary-light);
            color: var(--primary);
        }

        /* ------------------ PREMIUM CARDS & GLASS ------------------ */
        .iv-card, .dashboard-card, .card {
            background: var(--surface);
            border-radius: 24px;
            padding: 32px;
            border: 1px solid var(--border-light);
            box-shadow: var(--shadow-sm);
            transition: transform var(--transition-normal), box-shadow var(--transition-normal);
            position: relative;
            overflow: hidden;
        }
        .iv-card:hover, .dashboard-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-md);
        }
        
        .iv-glass {
            background: var(--glass-bg);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--glass-border);
            box-shadow: var(--shadow-md);
        }

        /* ------------------ INPUTS & FORMS ------------------ */
        input[type="text"], input[type="email"], input[type="password"], textarea, select {
            width: 100%;
            padding: 16px 20px;
            border-radius: 12px;
            border: 1px solid var(--border-color);
            background: var(--bg-color);
            color: var(--text-dark);
            font-size: 15px;
            font-family: 'Inter', sans-serif;
            transition: all var(--transition-fast);
        }
        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: var(--primary);
            background: var(--surface);
            box-shadow: 0 0 0 4px var(--primary-light);
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-dark);
        }

        /* ------------------ CUSTOM SCROLLBAR ------------------ */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--text-light); }
`;

// Insert the new premium CSS block.
// To avoid conflicts, we append it after the V2 design system block.
if (html.includes('/* ================= INNERVOICE DESIGN SYSTEM (V2) ================= */')) {
    html = html.replace('/* ================= INNERVOICE DESIGN SYSTEM (V2) ================= */', premiumCSS + '\n/* ================= OLD DESIGN SYSTEM ================= */');
} else {
    html = html.replace('</style>', premiumCSS + '\n</style>');
}

fs.writeFileSync('index.html', html);
console.log("Premium Base CSS injected successfully.");
