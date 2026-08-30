const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const newHomeCSS = `
        /* ================= PUBLIC HOME PAGE STYLES ================= */
        #home {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
        }

        .home-hero {
            min-height: 85vh;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 5%;
            background: linear-gradient(135deg, #f7faf8, #eeeaff);
            position: relative;
            overflow: hidden;
        }

        .home-hero::after {
            content: '';
            position: absolute;
            width: 800px;
            height: 800px;
            background: rgba(108, 99, 255, 0.05);
            border-radius: 50%;
            top: -200px;
            right: -200px;
            z-index: 0;
        }

        .hero-content {
            width: 50%;
            z-index: 1;
        }

        .hero-content h1 {
            font-size: 64px;
            line-height: 1.1;
            font-weight: 800;
            color: var(--text-dark);
            margin-bottom: 24px;
            letter-spacing: -1px;
        }
        
        .hero-content h1 span {
            color: var(--primary);
            display: block;
        }

        .hero-content p {
            font-size: 20px;
            color: var(--text-muted);
            line-height: 1.6;
            margin-bottom: 40px;
            max-width: 500px;
        }

        .hero-buttons {
            display: flex;
            gap: 16px;
        }

        .hero-visual {
            width: 45%;
            z-index: 1;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .hero-visual-card {
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.8);
            border-radius: 30px;
            padding: 40px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.05);
            width: 100%;
            max-width: 450px;
        }

        .trust-badges {
            display: flex;
            justify-content: center;
            gap: 40px;
            padding: 40px 5%;
            background: white;
            border-bottom: 1px solid var(--border-color);
        }

        .trust-badge {
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--text-muted);
            font-weight: 600;
            font-size: 15px;
        }

        .home-section {
            padding: 100px 5%;
            background: white;
        }

        .home-section.alt {
            background: #f8fafc;
        }

        .section-header {
            text-align: center;
            margin-bottom: 60px;
        }

        .section-header h2 {
            font-size: 42px;
            font-weight: 800;
            color: var(--text-dark);
            margin-bottom: 16px;
        }

        .section-header p {
            font-size: 18px;
            color: var(--text-muted);
            max-width: 600px;
            margin: 0 auto;
        }

        .feature-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            max-width: 1200px;
            margin: 0 auto;
        }

        .feature-card {
            background: var(--surface);
            padding: 40px 30px;
            border-radius: 20px;
            border: 1px solid var(--border-color);
            transition: all 0.3s ease;
            text-align: center;
        }

        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.05);
            border-color: var(--primary-light);
        }

        .feature-icon {
            font-size: 40px;
            margin-bottom: 20px;
            display: inline-block;
            background: var(--primary-light);
            width: 80px;
            height: 80px;
            line-height: 80px;
            border-radius: 50%;
        }

        .feature-card h3 {
            font-size: 20px;
            color: var(--text-dark);
            margin-bottom: 12px;
        }

        .feature-card p {
            color: var(--text-muted);
            line-height: 1.6;
        }

        .how-it-works {
            max-width: 1000px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            position: relative;
        }

        .how-it-works::before {
            content: '';
            position: absolute;
            top: 40px;
            left: 50px;
            right: 50px;
            height: 2px;
            background: var(--border-color);
            z-index: 0;
        }

        .step {
            position: relative;
            z-index: 1;
            text-align: center;
            width: 120px;
        }

        .step-num {
            width: 80px;
            height: 80px;
            background: white;
            border: 2px solid var(--primary);
            color: var(--primary);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: 800;
            margin: 0 auto 16px;
            transition: all 0.3s ease;
        }
        
        .step:hover .step-num {
            background: var(--primary);
            color: white;
        }

        .step h4 {
            font-size: 16px;
            color: var(--text-dark);
            font-weight: 700;
        }

        .cta-section {
            text-align: center;
            padding: 120px 5%;
            background: linear-gradient(135deg, #6c63ff, #f472b6);
            color: white;
        }

        .cta-section h2 {
            font-size: 48px;
            font-weight: 800;
            margin-bottom: 24px;
        }

        .cta-section p {
            font-size: 20px;
            opacity: 0.9;
            max-width: 600px;
            margin: 0 auto 40px;
        }
        
        .cta-section .iv-btn-primary {
            background: white;
            color: var(--primary);
            padding: 16px 32px;
            font-size: 16px;
        }
        .cta-section .iv-btn-primary:hover {
            background: #f8fafc;
        }

        footer {
            background: #1e293b;
            color: #cbd5e1;
            padding: 60px 5% 30px;
        }

        .footer-content {
            display: flex;
            justify-content: space-between;
            max-width: 1200px;
            margin: 0 auto 40px;
        }

        .footer-brand h3 {
            font-size: 24px;
            color: white;
            margin-bottom: 12px;
            font-weight: 800;
        }

        .footer-links {
            display: flex;
            gap: 60px;
        }

        .footer-col h4 {
            color: white;
            margin-bottom: 20px;
            font-size: 16px;
        }

        .footer-col a {
            display: block;
            color: #cbd5e1;
            text-decoration: none;
            margin-bottom: 12px;
            transition: color 0.2s;
        }

        .footer-col a:hover {
            color: white;
        }
        
        .footer-bottom {
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid rgba(255,255,255,0.1);
            font-size: 14px;
        }

        @media (max-width: 768px) {
            .home-hero { flex-direction: column; text-align: center; padding-top: 120px; }
            .hero-content { width: 100%; margin-bottom: 40px; }
            .hero-visual { width: 100%; }
            .trust-badges { flex-wrap: wrap; justify-content: center; }
            .feature-grid { grid-template-columns: 1fr; }
            .how-it-works { flex-direction: column; align-items: center; gap: 40px; }
            .how-it-works::before { display: none; }
            .footer-content { flex-direction: column; gap: 40px; }
            .footer-links { flex-direction: column; gap: 30px; }
        }
`;

const newHomeHTML = `
    <!-- =====================================================
     1. HOME / LANDING PAGE (REDESIGNED)
    ===================================================== -->
    <section id="home">
        
        <!-- Hero Section -->
        <div class="home-hero">
            <div class="hero-content">
                <h1>Your Mind.<br>Your Feelings.<br><span>Your INNERVOICE.</span></h1>
                <p>A safe digital space to understand your emotions, reflect on your experiences, build healthy habits, and improve your everyday wellness.</p>
                <div class="hero-buttons">
                    <a href="#register" class="iv-btn iv-btn-primary" style="padding: 16px 32px; font-size: 16px;">Get Started</a>
                    <a href="#login" class="iv-btn iv-btn-secondary" style="padding: 16px 32px; font-size: 16px;">Login</a>
                </div>
            </div>
            <div class="hero-visual">
                <div class="hero-visual-card">
                    <h3 style="margin-bottom: 20px; font-size: 22px; color: var(--text-dark);">🌿 Today's Check-in</h3>
                    <div style="display:flex; justify-content:space-between; margin-bottom: 30px;">
                        <div style="text-align:center; cursor:pointer;"><div style="font-size:32px; background:var(--bg-color); border-radius:50%; width:60px; height:60px; display:flex; align-items:center; justify-content:center; margin:0 auto 8px;">😊</div><span style="font-size:12px; font-weight:600;">Happy</span></div>
                        <div style="text-align:center; cursor:pointer;"><div style="font-size:32px; background:var(--bg-color); border-radius:50%; width:60px; height:60px; display:flex; align-items:center; justify-content:center; margin:0 auto 8px;">😌</div><span style="font-size:12px; font-weight:600;">Calm</span></div>
                        <div style="text-align:center; cursor:pointer;"><div style="font-size:32px; background:var(--bg-color); border-radius:50%; width:60px; height:60px; display:flex; align-items:center; justify-content:center; margin:0 auto 8px;">🙂</div><span style="font-size:12px; font-weight:600;">Good</span></div>
                    </div>
                    <div style="background: var(--primary-light); padding: 16px; border-radius: 12px; border-left: 4px solid var(--primary);">
                        <div style="font-weight:700; font-size:13px; color:var(--primary); margin-bottom:4px;">✨ AI Insight</div>
                        <div style="font-size:14px; color:var(--text-dark);">"You seem to be balancing stress with optimism today. A short journaling session might help clarify your thoughts."</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Trust Badges -->
        <div class="trust-badges">
            <div class="trust-badge">🌿 Personal Wellness</div>
            <div class="trust-badge">🔒 Private Experience</div>
            <div class="trust-badge">🧠 Emotional Awareness</div>
            <div class="trust-badge">📈 Personal Growth</div>
        </div>

        <!-- Why INNERVOICE -->
        <div class="home-section">
            <div class="section-header">
                <h2>Why INNERVOICE?</h2>
                <p>Designed to help you navigate your emotional landscape and foster personal development.</p>
            </div>
            <div class="feature-grid">
                <div class="feature-card">
                    <div class="feature-icon">🧠</div>
                    <h3>Understand Your Emotions</h3>
                    <p>Track your daily moods and uncover patterns in your feelings over time with beautiful, intuitive calendars.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📝</div>
                    <h3>Express Yourself</h3>
                    <p>Use personal journaling and guided reflections to articulate your thoughts in a safe, private space.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🌱</div>
                    <h3>Build Healthy Habits</h3>
                    <p>Create and maintain routines that support your physical and mental wellbeing with smart habit tracking.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📊</div>
                    <h3>Track Your Wellness</h3>
                    <p>Visualize your progress through an aggregated Wellness Score and detailed weekly reports.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">💭</div>
                    <h3>Reflect & Grow</h3>
                    <p>Turn everyday experiences into meaningful reflection points and track progress towards personal goals.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🤖</div>
                    <h3>Personalized Insights</h3>
                    <p>Receive AI-powered, wellness-oriented insights to guide your journey and suggest actionable steps.</p>
                </div>
            </div>
        </div>

        <!-- How It Works -->
        <div class="home-section alt">
            <div class="section-header">
                <h2>How INNERVOICE Works</h2>
                <p>A simple, five-step journey to better self-understanding.</p>
            </div>
            <div class="how-it-works">
                <div class="step">
                    <div class="step-num">01</div>
                    <h4>Check In</h4>
                </div>
                <div class="step">
                    <div class="step-num">02</div>
                    <h4>Reflect</h4>
                </div>
                <div class="step">
                    <div class="step-num">03</div>
                    <h4>Understand</h4>
                </div>
                <div class="step">
                    <div class="step-num">04</div>
                    <h4>Improve</h4>
                </div>
                <div class="step">
                    <div class="step-num">05</div>
                    <h4>Grow</h4>
                </div>
            </div>
        </div>

        <!-- Feature Preview -->
        <div class="home-section">
            <div class="section-header">
                <h2>A complete toolkit for your mind.</h2>
            </div>
            <div class="feature-grid">
                <div class="iv-card" style="text-align:left; padding: 30px;">
                    <h3 style="margin-bottom:12px; display:flex; align-items:center; gap:8px;"><span>💭</span> Mood Tracking</h3>
                    <p style="color:var(--text-muted); font-size:14px;">Log how you feel each day and build a historical calendar of your emotional states.</p>
                </div>
                <div class="iv-card" style="text-align:left; padding: 30px;">
                    <h3 style="margin-bottom:12px; display:flex; align-items:center; gap:8px;"><span>📝</span> Personal Journal</h3>
                    <p style="color:var(--text-muted); font-size:14px;">A private space to write, vent, or celebrate without judgment.</p>
                </div>
                <div class="iv-card" style="text-align:left; padding: 30px;">
                    <h3 style="margin-bottom:12px; display:flex; align-items:center; gap:8px;"><span>🌟</span> Wellness Score</h3>
                    <p style="color:var(--text-muted); font-size:14px;">An aggregated metric summarizing your overall consistency and emotional health.</p>
                </div>
                <div class="iv-card" style="text-align:left; padding: 30px;">
                    <h3 style="margin-bottom:12px; display:flex; align-items:center; gap:8px;"><span>✅</span> Daily Wellness Plan</h3>
                    <p style="color:var(--text-muted); font-size:14px;">Start your day with recommended actions tailored just for you.</p>
                </div>
                <div class="iv-card" style="text-align:left; padding: 30px;">
                    <h3 style="margin-bottom:12px; display:flex; align-items:center; gap:8px;"><span>🔥</span> Habit Tracking</h3>
                    <p style="color:var(--text-muted); font-size:14px;">Build streaks and stay accountable to your positive routines.</p>
                </div>
                <div class="iv-card" style="text-align:left; padding: 30px;">
                    <h3 style="margin-bottom:12px; display:flex; align-items:center; gap:8px;"><span>🧠</span> AI Insights</h3>
                    <p style="color:var(--text-muted); font-size:14px;">Intelligent pattern recognition pointing out what helps you thrive.</p>
                </div>
            </div>
            <div style="text-align:center; margin-top:50px;">
                <a href="#register" class="iv-btn iv-btn-primary">Explore INNERVOICE</a>
            </div>
        </div>

        <!-- CTA Section -->
        <div class="cta-section">
            <h2>Start Understanding Your INNERVOICE</h2>
            <p>Small moments of reflection can lead to meaningful personal growth.</p>
            <a href="#register" class="iv-btn iv-btn-primary">Get Started Now</a>
        </div>

        <!-- Footer -->
        <footer>
            <div class="footer-content">
                <div class="footer-brand">
                    <h3>🌿 INNERVOICE</h3>
                    <p style="max-width:300px; line-height:1.6; opacity:0.8;">Emotional Wellness & Self-Reflection Platform.</p>
                </div>
                <div class="footer-links">
                    <div class="footer-col">
                        <h4>Platform</h4>
                        <a href="#home">Home</a>
                        <a href="#home">Features</a>
                        <a href="#home">How it Works</a>
                    </div>
                    <div class="footer-col">
                        <h4>Legal</h4>
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                        <a href="#">Contact</a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                &copy; 2026 INNERVOICE. All rights reserved.
            </div>
        </footer>

    </section>
`;

html = html.replace('</style>', newHomeCSS + '\n</style>');
html = html.replace(/<section id="home">[\s\S]*?(?=<section id="register">)/, newHomeHTML + '\n\n    ');

fs.writeFileSync('index.html', html);
console.log("Home page updated successfully.");
