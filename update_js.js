const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf8');

// 1. Navigation routing logic for new SPA architecture
const routerLogic = `
    /* =====================================================
       14. SPA ROUTING (NEW ARCHITECTURE)
    ===================================================== */
    function showSection(sectionId) {
        // Handle public vs private routing
        const publicSections = ['#home', '#login', '#register'];
        const isPublic = publicSections.includes(sectionId);
        
        if (isPublic) {
            document.body.classList.add('public-view');
            document.body.classList.remove('private-view');
        } else {
            // Require login for private sections
            if (!currentUser) {
                showSection('#login');
                return;
            }
            document.body.classList.add('private-view');
            document.body.classList.remove('public-view');
            
            // Close mobile sidebar if open
            document.body.classList.remove('sidebar-open');
        }

        // Hide all sections
        document.querySelectorAll('section').forEach(s => {
            s.style.display = 'none';
        });

        // Show target section
        const target = document.querySelector(sectionId);
        if (target) {
            target.style.display = 'block';
            window.scrollTo(0, 0);
        }

        // Update active sidebar link
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === sectionId) {
                link.classList.add('active');
            }
        });

        // Special triggers
        if (sectionId === '#dailyPlan' && typeof loadDailyRecommendations === 'function') {
            loadDailyRecommendations();
        }
    }

    // Intercept all hash links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", function(event) {
            const targetID = this.getAttribute("href");
            if (targetID === "#") return;
            
            event.preventDefault();
            history.pushState(null, null, targetID);
            showSection(targetID);
        });
    });

    // Handle back/forward browser buttons
    window.addEventListener('popstate', () => {
        const hash = window.location.hash || '#home';
        showSection(hash);
    });

    // Mobile Hamburger
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-open');
        });
    }

    // Initialize initial route
    window.addEventListener('DOMContentLoaded', () => {
        const hash = window.location.hash || '#home';
        showSection(hash);
    });
`;

// Replace old Navigation section block
js = js.replace(/\/\* =====================================================\s*14\. NAVIGATION\s*=====================================================\s*\*\/[\s\S]*?(?=\/\* =====================================================\s*15\. START YOUR JOURNEY)/, routerLogic + '\n\n');

// 2. Authentication UI toggling
// Update updateLoginStatus to properly route
const loginStatusLogic = `
    /* =====================================================
       16. LOGGED-IN STATUS (UPDATED)
    ===================================================== */
    function updateLoginStatus() {
        if (!currentUser) {
            // Not logged in
            document.body.classList.add('public-view');
            document.body.classList.remove('private-view');
            return;
        }

        // Logged in
        document.body.classList.add('private-view');
        document.body.classList.remove('public-view');
        
        // Update topbar greeting
        const greetingEl = document.getElementById('topbarGreeting');
        if (greetingEl) {
            greetingEl.innerHTML = \`Good Morning, \${currentUser.name} 🌿\`;
        }

        // If currently on public page, route to dashboard
        const currentHash = window.location.hash;
        const publicSections = ['#home', '#login', '#register', ''];
        if (publicSections.includes(currentHash)) {
            history.pushState(null, null, '#dashboard');
            if(typeof showSection === 'function') showSection('#dashboard');
        }
    }
`;
js = js.replace(/\/\* =====================================================\s*16\. LOGGED-IN STATUS\s*=====================================================\s*\*\/[\s\S]*?(?=\/\* =====================================================\s*17\. LOGOUT)/, loginStatusLogic + '\n\n');

// Update logout
const logoutLogic = `
    /* =====================================================
       17. LOGOUT (UPDATED)
    ===================================================== */
    function logout() {
        localStorage.removeItem("innerVoiceUser");
        localStorage.removeItem("innerVoiceToken");
        currentUser = null;
        
        showToast("Logged out successfully.");
        
        history.pushState(null, null, '#home');
        if(typeof showSection === 'function') showSection('#home');
    }
`;
js = js.replace(/\/\* =====================================================\s*17\. LOGOUT\s*=====================================================\s*\*\/[\s\S]*?(?=\/\* =====================================================\s*18\. THEME \(DARK MODE\))/, logoutLogic + '\n\n');

fs.writeFileSync('script.js', js);
console.log("JavaScript routing injected successfully.");
