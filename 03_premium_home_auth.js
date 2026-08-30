const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const premiumHomeCSS = `
        /* ================= PREMIUM HOME & AUTH STYLES ================= */
        
        #home {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            overflow-x: hidden;
        }

        /* --- Hero Section --- */
        .home-hero {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 5%;
            background: linear-gradient(135deg, var(--bg-color) 0%, var(--primary-light) 100%);
            position: relative;
        }

        /* Soft blurred blobs */
        .hero-blob-1 {
            position: absolute; width: 600px; height: 600px;
            background: radial-gradient(circle, rgba(139,124,246,0.2) 0%, rgba(255,255,255,0) 70%);
            top: -100px; right: -100px; z-index: 0;
            border-radius: 50%;
        }
        .hero-blob-2 {
            position: absolute; width: 400px; height: 400px;
            background: radial-gradient(circle, rgba(167,243,208,0.3) 0%, rgba(255,255,255,0) 70%);
            bottom: 10%; left: 10%; z-index: 0;
            border-radius: 50%;
        }

        .hero-content {
            width: 50%;
            z-index: 10;
        }

        .hero-badge {
            display: inline-block;
            padding: 8px 16px;
            background: var(--surface);
            border-radius: 30px;
            font-size: 13px;
            font-weight: 700;
            color: var(--primary);
            letter-spacing: 0.1em;
            text-transform: uppercase;
            box-shadow: var(--shadow-sm);
            margin-bottom: 24px;
        }

        .hero-content h1 {
            font-size: 72px;
            line-height: 1.05;
            font-weight: 800;
            color: var(--text-dark);
            margin-bottom: 24px;
            letter-spacing: -0.03em;
        }
        
        .hero-content h1 span {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: inline-block;
        }

        .hero-content p {
            font-size: 20px;
            color: var(--text-muted);
            line-height: 1.6;
            margin-bottom: 40px;
            max-width: 500px;
            font-weight: 400;
        }

        .hero-trust {
            margin-top: 24px;
            font-size: 14px;
            color: var(--text-light);
            font-weight: 500;
        }

        /* --- Hero Visual (Floating Cards) --- */
        .hero-visual {
            width: 45%;
            z-index: 10;
            position: relative;
            height: 600px;
        }

        .float-card {
            position: absolute;
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.8);
            border-radius: 24px;
            padding: 30px;
            box-shadow: var(--shadow-lg);
            animation: float 6s ease-in-out infinite;
        }

        .fc-1 {
            top: 10%; right: 5%; width: 320px;
            animation-delay: 0s;
            z-index: 3;
        }
        
        .fc-2 {
            top: 45%; right: 25%; width: 280px;
            animation-delay: 2s;
            z-index: 2;
        }

        .fc-3 {
            bottom: 5%; right: 0%; width: 260px;
            animation-delay: 4s;
            z-index: 1;
        }

        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
        }

        /* --- Social Message --- */
        .home-statement {
            padding: 120px 5%;
            text-align: center;
            background: var(--surface);
        }
        
        .home-statement h2 {
            font-size: 48px;
            font-weight: 300;
            color: var(--text-dark);
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.4;
            letter-spacing: -0.02em;
        }

        /* --- Asymmetric Grid (Why INNERVOICE) --- */
        .home-section {
            padding: 120px 5%;
            background: var(--bg-color);
        }

        .section-header {
            text-align: center;
            margin-bottom: 80px;
        }

        .section-header h2 { font-size: 48px; font-weight: 800; margin-bottom: 20px; letter-spacing: -0.02em; }
        .section-header p { font-size: 20px; max-width: 600px; margin: 0 auto; }

        .bento-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            grid-template-rows: auto auto;
            gap: 24px;
            max-width: 1200px;
            margin: 0 auto;
        }

        .bento-card {
            background: var(--surface);
            border-radius: 32px;
            padding: 40px;
            border: 1px solid var(--border-light);
            transition: all var(--transition-normal);
            position: relative;
            overflow: hidden;
        }
        
        .bento-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-md);
        }

        .bento-large {
            grid-column: span 2;
            background: linear-gradient(135deg, var(--surface), var(--primary-light));
            border-color: var(--primary-light);
        }

        .bento-icon {
            font-size: 48px;
            margin-bottom: 24px;
            display: inline-block;
        }

        .bento-card h3 { font-size: 24px; margin-bottom: 16px; }
        .bento-large h3 { font-size: 32px; }

        /* --- Horizontal Timeline (How It Works) --- */
        .timeline-wrapper {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            position: relative;
        }
        
        .timeline-line {
            position: absolute;
            top: 40px; left: 5%; right: 5%;
            height: 2px;
            background: linear-gradient(90deg, var(--primary-light), var(--primary), var(--primary-light));
            z-index: 0;
            opacity: 0.5;
        }

        .timeline-step {
            width: 140px;
            text-align: center;
            position: relative;
            z-index: 1;
        }

        .t-num {
            width: 80px; height: 80px;
            background: var(--surface);
            border: 2px solid var(--primary);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 24px; font-weight: 800; color: var(--primary);
            margin: 0 auto 24px;
            box-shadow: var(--shadow-sm);
            transition: all var(--transition-normal);
        }
        .timeline-step:hover .t-num {
            background: var(--primary);
            color: white;
            transform: scale(1.1);
            box-shadow: var(--shadow-glow);
        }

        /* --- Rounded CTA --- */
        .cta-wrapper {
            max-width: 1200px;
            margin: 0 auto 120px;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border-radius: 40px;
            padding: 80px 5%;
            text-align: center;
            color: white;
            box-shadow: 0 20px 40px rgba(108, 99, 255, 0.2);
            position: relative;
            overflow: hidden;
        }

        .cta-wrapper h2 { color: white; font-size: 56px; margin-bottom: 24px; }
        .cta-wrapper p { color: rgba(255,255,255,0.9); font-size: 20px; max-width: 600px; margin: 0 auto 40px; }
        .cta-wrapper .iv-btn-primary {
            background: white; color: var(--primary); padding: 20px 40px; font-size: 18px; border-radius: 20px;
        }

        /* --- Footer --- */
        footer {
            background: var(--bg-color);
            padding: 80px 5% 40px;
            border-top: 1px solid var(--border-light);
        }
        
        /* --- AUTH PAGES (SPLIT SCREEN) --- */
        #login, #register {
            padding: 0 !important;
            margin: 0 !important;
            min-height: 100vh;
        }

        .auth-split {
            display: flex;
            min-height: 100vh;
            width: 100vw;
        }

        .auth-left {
            width: 50%;
            background: linear-gradient(135deg, var(--primary-light), var(--bg-color));
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 5%;
            position: relative;
            overflow: hidden;
        }
        
        .auth-quote {
            max-width: 500px;
            z-index: 10;
        }
        .auth-quote h2 {
            font-size: 48px;
            font-weight: 300;
            line-height: 1.2;
            color: var(--primary);
            margin-bottom: 24px;
            letter-spacing: -0.02em;
        }

        .auth-right {
            width: 50%;
            background: var(--surface);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 5%;
        }

        .auth-form-wrapper {
            width: 100%;
            max-width: 440px;
        }

        .auth-form-wrapper h3 {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 8px;
        }
        
        .auth-form-wrapper > p {
            color: var(--text-muted);
            margin-bottom: 40px;
            font-size: 16px;
        }

        @media (max-width: 1024px) {
            .hero-content h1 { font-size: 56px; }
            .bento-grid { grid-template-columns: 1fr 1fr; }
            .bento-large { grid-column: span 2; }
            .auth-left { display: none; }
            .auth-right { width: 100%; }
        }
        @media (max-width: 768px) {
            .home-hero { flex-direction: column; text-align: center; padding-top: 120px; }
            .hero-content { width: 100%; margin-bottom: 60px; }
            .hero-visual { width: 100%; height: 400px; }
            .bento-grid { grid-template-columns: 1fr; }
            .bento-large { grid-column: span 1; }
            .timeline-wrapper { flex-direction: column; align-items: center; gap: 40px; }
            .timeline-line { display: none; }
        }
`;

const premiumHomeHTML = `
    <!-- =====================================================
     1. HOME / LANDING PAGE (PREMIUM)
    ===================================================== -->
    <section id="home">
        
        <div class="home-hero">
            <div class="hero-blob-1"></div>
            <div class="hero-blob-2"></div>
            
            <div class="hero-content">
                <div class="hero-badge">🌿 YOUR SPACE FOR SELF-REFLECTION</div>
                <h1>Understand your mind.<br>Care for your <span>wellbeing.</span></h1>
                <p>INNERVOICE helps you reflect, understand your emotions, build meaningful habits, and create healthier daily routines.</p>
                <div style="display:flex; gap:16px;">
                    <a href="#register" class="iv-btn iv-btn-primary" style="padding: 18px 36px; font-size: 16px; border-radius: 16px;">Start Your Journey</a>
                    <a href="#dashboard" class="iv-btn iv-btn-secondary" style="padding: 18px 36px; font-size: 16px; border-radius: 16px; background:var(--glass-bg); backdrop-filter:blur(10px);">Explore Demo</a>
                </div>
                <div class="hero-trust">Private • Personal • Supportive</div>
            </div>
            
            <div class="hero-visual">
                <div class="float-card fc-1">
                    <div style="font-size:12px; font-weight:700; color:var(--text-muted); margin-bottom:12px; text-transform:uppercase;">Today's Mood</div>
                    <div style="display:flex; align-items:center; gap:16px;">
                        <div style="font-size:48px;">😌</div>
                        <div>
                            <div style="font-size:20px; font-weight:700;">Calm</div>
                            <div style="font-size:14px; color:var(--text-muted);">Feeling balanced</div>
                        </div>
                    </div>
                </div>
                <div class="float-card fc-2">
                    <div style="font-size:12px; font-weight:700; color:var(--text-muted); margin-bottom:12px; text-transform:uppercase;">Wellness Score</div>
                    <div style="font-size:56px; font-weight:800; color:var(--primary); line-height:1;">82</div>
                    <div style="font-size:14px; color:var(--success); font-weight:600; margin-top:4px;">↑ 5% from last week</div>
                </div>
                <div class="float-card fc-3">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="font-size:32px;">🔥</div>
                        <div>
                            <div style="font-size:18px; font-weight:700;">7 Day Streak</div>
                            <div style="font-size:13px; color:var(--text-muted);">Consistency is key</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="home-statement">
            <h2>"Your thoughts deserve a place. INNERVOICE gives you a space to pause, reflect, understand and grow."</h2>
        </div>

        <div class="home-section">
            <div class="section-header">
                <h2>Everything you need for your wellbeing journey.</h2>
                <p>Designed to help you navigate your emotional landscape and foster personal development.</p>
            </div>
            <div class="bento-grid">
                <div class="bento-card bento-large">
                    <div class="bento-icon">🧠</div>
                    <h3>Understand Your Emotions</h3>
                    <p>Track your daily moods and uncover patterns in your feelings over time with beautiful, intuitive calendars and aggregated insights.</p>
                </div>
                <div class="bento-card">
                    <div class="bento-icon">📝</div>
                    <h3>Reflect</h3>
                    <p>Use personal journaling to articulate your thoughts in a safe space.</p>
                </div>
                <div class="bento-card">
                    <div class="bento-icon">🌱</div>
                    <h3>Build Habits</h3>
                    <p>Create and maintain routines that support your mental wellbeing.</p>
                </div>
                <div class="bento-card">
                    <div class="bento-icon">📊</div>
                    <h3>Track Progress</h3>
                    <p>Visualize your progress through an aggregated Wellness Score.</p>
                </div>
                <div class="bento-card">
                    <div class="bento-icon">🤖</div>
                    <h3>Personalized Insights</h3>
                    <p>Receive AI-powered insights to guide your journey.</p>
                </div>
                <div class="bento-card">
                    <div class="bento-icon">⏱️</div>
                    <h3>Focus</h3>
                    <p>Dedicated tools for meditation, breathing, and deep work.</p>
                </div>
            </div>
        </div>

        <div class="home-section" style="background:var(--surface);">
            <div class="section-header">
                <h2>How INNERVOICE Works</h2>
                <p>A simple, five-step journey to better self-understanding.</p>
            </div>
            <div class="timeline-wrapper">
                <div class="timeline-line"></div>
                <div class="timeline-step">
                    <div class="t-num">01</div>
                    <h4>Check In</h4>
                    <p style="font-size:14px; margin-top:8px;">Log your mood</p>
                </div>
                <div class="timeline-step">
                    <div class="t-num">02</div>
                    <h4>Reflect</h4>
                    <p style="font-size:14px; margin-top:8px;">Write a journal</p>
                </div>
                <div class="timeline-step">
                    <div class="t-num">03</div>
                    <h4>Understand</h4>
                    <p style="font-size:14px; margin-top:8px;">Read AI insights</p>
                </div>
                <div class="timeline-step">
                    <div class="t-num">04</div>
                    <h4>Improve</h4>
                    <p style="font-size:14px; margin-top:8px;">Complete habits</p>
                </div>
                <div class="timeline-step">
                    <div class="t-num">05</div>
                    <h4>Grow</h4>
                    <p style="font-size:14px; margin-top:8px;">Track wellness</p>
                </div>
            </div>
        </div>

        <div class="cta-wrapper">
            <h2>Start your journey inward.</h2>
            <p>Small moments of reflection can lead to meaningful personal growth.</p>
            <a href="#register" class="iv-btn iv-btn-primary">Create Your INNERVOICE</a>
        </div>

        <footer>
            <div style="max-width:1200px; margin:0 auto; display:flex; justify-content:space-between;">
                <div>
                    <h3 style="font-size:24px; font-weight:800; color:var(--primary); margin-bottom:16px; letter-spacing:-0.5px;">🌿 INNERVOICE</h3>
                    <p style="max-width:300px;">A premium emotional wellness & self-reflection platform.</p>
                </div>
                <div style="display:flex; gap:60px;">
                    <div>
                        <h4 style="margin-bottom:20px; font-size:14px; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-dark);">Platform</h4>
                        <a href="#home" style="display:block; color:var(--text-muted); text-decoration:none; margin-bottom:12px;">Home</a>
                        <a href="#home" style="display:block; color:var(--text-muted); text-decoration:none; margin-bottom:12px;">Features</a>
                        <a href="#home" style="display:block; color:var(--text-muted); text-decoration:none; margin-bottom:12px;">How it Works</a>
                    </div>
                    <div>
                        <h4 style="margin-bottom:20px; font-size:14px; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-dark);">Legal</h4>
                        <a href="#" style="display:block; color:var(--text-muted); text-decoration:none; margin-bottom:12px;">Privacy Policy</a>
                        <a href="#" style="display:block; color:var(--text-muted); text-decoration:none; margin-bottom:12px;">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    </section>
`;

const premiumAuthHTML = `
    <!-- =====================================================
     2. REGISTER
    ===================================================== -->
    <section id="register">
        <div class="auth-split">
            <div class="auth-left">
                <div class="hero-blob-1" style="top: -20%; right: 10%;"></div>
                <div class="auth-quote">
                    <h2>"Begin the journey to understand your own mind."</h2>
                    <p style="font-size:20px; color:var(--text-dark); opacity:0.8;">Create a safe, private space for your thoughts.</p>
                </div>
            </div>
            <div class="auth-right">
                <div class="auth-form-wrapper">
                    <h3>Create Account</h3>
                    <p>Join INNERVOICE for free.</p>
                    
                    <div style="display:flex; flex-direction:column; gap:20px;">
                        <div>
                            <label>Full Name</label>
                            <input type="text" placeholder="e.g. Jane Doe">
                        </div>
                        <div>
                            <label>Email Address</label>
                            <input type="email" placeholder="jane@example.com">
                        </div>
                        <div>
                            <label>Password</label>
                            <input type="password" placeholder="••••••••">
                        </div>
                        <button class="iv-btn iv-btn-primary" style="width:100%; padding: 16px; margin-top: 10px;">Create Account</button>
                    </div>
                    
                    <div style="text-align:center; margin-top:32px; font-size:15px;">
                        <span style="color:var(--text-muted);">Already have an account?</span> 
                        <a href="#login" style="color:var(--primary); font-weight:600; text-decoration:none;">Log In</a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- =====================================================
     3. LOGIN
    ===================================================== -->
    <section id="login">
        <div class="auth-split">
            <div class="auth-left" style="background: linear-gradient(135deg, var(--bg-color), var(--accent));">
                <div class="hero-blob-2" style="background: radial-gradient(circle, rgba(167,243,208,0.5) 0%, rgba(255,255,255,0) 70%);"></div>
                <div class="auth-quote">
                    <h2 style="color:var(--accent-dark);">"Take a moment.<br>Check in with yourself."</h2>
                    <p style="font-size:20px; color:var(--text-dark); opacity:0.8;">Welcome back to your private space.</p>
                </div>
            </div>
            <div class="auth-right">
                <div class="auth-form-wrapper">
                    <h3>Welcome Back 🌿</h3>
                    <p>Continue your wellness journey.</p>
                    
                    <div style="display:flex; flex-direction:column; gap:20px;">
                        <div>
                            <label>Email Address</label>
                            <input type="email" placeholder="jane@example.com">
                        </div>
                        <div>
                            <label>Password</label>
                            <input type="password" placeholder="••••••••">
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:14px;">
                            <label style="margin:0; display:flex; align-items:center; gap:8px; cursor:pointer; color:var(--text-muted);">
                                <input type="checkbox" style="width:auto;"> Remember me
                            </label>
                            <a href="#" style="color:var(--primary); font-weight:600; text-decoration:none;">Forgot password?</a>
                        </div>
                        <button class="iv-btn iv-btn-primary" style="width:100%; padding: 16px; margin-top: 10px;">Log In</button>
                    </div>
                    
                    <div style="text-align:center; margin-top:32px; font-size:15px;">
                        <span style="color:var(--text-muted);">New to INNERVOICE?</span> 
                        <a href="#register" style="color:var(--primary); font-weight:600; text-decoration:none;">Create Account</a>
                    </div>
                </div>
            </div>
        </div>
    </section>
`;

// Insert the CSS
if (html.includes('/* ================= OLD DESIGN SYSTEM ================= */')) {
    html = html.replace('/* ================= OLD DESIGN SYSTEM ================= */', premiumHomeCSS + '\n/* ================= OLD DESIGN SYSTEM ================= */');
}

// Replace Home section
html = html.replace(/<section id="home">[\s\S]*?(?=<section id="register">)/, premiumHomeHTML + '\n\n    ');

// Replace Register and Login sections
html = html.replace(/<section id="register">[\s\S]*?(?=<section id="dashboard">)/, premiumAuthHTML + '\n\n    ');

fs.writeFileSync('index.html', html);
console.log("Premium Home and Auth injected successfully.");
