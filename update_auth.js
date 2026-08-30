const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const newAuthCSS = `
        /* ================= AUTH PAGES ================= */
        #login, #register {
            min-height: 80vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
        }

        .auth-container {
            background: white;
            padding: 50px 40px;
            border-radius: 24px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.08);
            width: 100%;
            max-width: 480px;
            text-align: center;
            border: 1px solid var(--border-color);
        }

        .auth-header {
            margin-bottom: 30px;
        }

        .auth-header h2 {
            font-size: 28px;
            font-weight: 800;
            color: var(--text-dark);
            margin-bottom: 8px;
        }

        .auth-header p {
            color: var(--text-muted);
            font-size: 15px;
        }

        .auth-box {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .auth-box input {
            width: 100%;
            padding: 14px 20px;
            border-radius: 12px;
            border: 1px solid var(--border-color);
            background: #f8fafc;
            font-size: 15px;
            transition: all 0.2s;
        }

        .auth-box input:focus {
            outline: none;
            border-color: var(--primary);
            background: white;
            box-shadow: 0 0 0 4px var(--primary-light);
        }

        .auth-box button {
            width: 100%;
            padding: 16px;
            border-radius: 12px;
            font-size: 16px;
            margin-top: 10px;
        }
        
        .auth-footer {
            margin-top: 24px;
            font-size: 14px;
            color: var(--text-muted);
        }
        .auth-footer a {
            color: var(--primary);
            text-decoration: none;
            font-weight: 600;
        }
        
        .auth-divider {
            display: flex;
            align-items: center;
            text-align: center;
            color: var(--text-muted);
            margin: 20px 0;
            font-size: 13px;
            text-transform: uppercase;
        }
        .auth-divider::before, .auth-divider::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid var(--border-color);
        }
        .auth-divider::before { margin-right: .5em; }
        .auth-divider::after { margin-left: .5em; }
`;

const newAuthHTML = `
    <!-- =====================================================
     2. REGISTER
    ===================================================== -->
    <section id="register">
        <div class="auth-container">
            <div class="auth-header">
                <h2>Begin Your Wellness Journey</h2>
                <p>Create your private INNERVOICE account.</p>
            </div>
            <!-- Reusing original ID/classes for script.js compatibility -->
            <div class="auth-box">
                <input type="text" placeholder="Full Name">
                <input type="email" placeholder="Email Address">
                <input type="password" placeholder="Password">
                <input type="password" placeholder="Confirm Password">
                <button class="iv-btn iv-btn-primary" style="width:100%; border-radius:12px;">Create Account</button>
            </div>
            
            <div class="auth-divider">OR</div>
            
            <div class="auth-footer">
                Already have an account? <a href="#login">Login</a>
            </div>
        </div>
    </section>

    <!-- =====================================================
     3. LOGIN
    ===================================================== -->
    <section id="login">
        <div class="auth-container">
            <div class="auth-header">
                <h2>Welcome Back 🌿</h2>
                <p>Continue your wellness journey.</p>
            </div>
            <div class="auth-box">
                <input type="email" placeholder="Email Address">
                <input type="password" placeholder="Password">
                <div style="display:flex; justify-content:space-between; font-size:13px; margin: 5px 0;">
                    <label style="display:flex; align-items:center; gap:6px; color:var(--text-muted);"><input type="checkbox"> Remember me</label>
                    <a href="#" style="color:var(--primary); text-decoration:none;">Forgot Password?</a>
                </div>
                <button class="iv-btn iv-btn-primary" style="width:100%; border-radius:12px;">Login</button>
            </div>
            
            <div class="auth-divider">New to INNERVOICE?</div>
            
            <a href="#register" class="iv-btn iv-btn-secondary" style="width:100%; border-radius:12px;">Create Account</a>
        </div>
    </section>
`;

html = html.replace('</style>', newAuthCSS + '\n</style>');
html = html.replace(/<section id="register">[\s\S]*?(?=<section id="dashboard">)/, newAuthHTML + '\n\n    ');

fs.writeFileSync('index.html', html);
console.log("Auth pages updated successfully.");
