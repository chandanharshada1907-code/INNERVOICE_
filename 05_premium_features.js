const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const premiumFeatureCSS = `
        /* ================= PREMIUM FEATURE PAGES ================= */
        
        .feature-header {
            margin-bottom: 40px;
            padding-bottom: 32px;
            border-bottom: 1px solid var(--border-light);
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }

        .feature-header-left {
            max-width: 700px;
        }

        .feature-category {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            color: var(--primary);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 12px;
            background: var(--primary-light);
            padding: 6px 12px;
            border-radius: 20px;
        }

        .feature-header h2 {
            font-size: 36px;
            font-weight: 800;
            margin-bottom: 12px;
            color: var(--text-dark);
            letter-spacing: -0.02em;
        }

        .feature-header p {
            font-size: 16px;
            color: var(--text-muted);
            margin: 0;
            line-height: 1.5;
        }

        .feature-header-right {
            display: flex;
            gap: 12px;
        }

        /* Upgrade old generic section styles */
        .section-title, .section-subtitle { display: none !important; }

        @media (max-width: 768px) {
            .feature-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 24px;
            }
        }
`;

if (html.includes('/* ================= OLD DESIGN SYSTEM ================= */')) {
    html = html.replace('/* ================= OLD DESIGN SYSTEM ================= */', premiumFeatureCSS + '\\n/* ================= OLD DESIGN SYSTEM ================= */');
}

// Map sections to premium headers
const featureHeaders = {
    'aiInsights': { cat: 'AI Assistance', title: 'Smart Insights', desc: 'AI-powered wellness patterns and recommendations.', action: '<button class="iv-btn iv-btn-primary" onclick="generateAIInsight()">Generate Insight</button>' },
    'mood': { cat: 'Understanding', title: 'Mood Tracker', desc: 'Log your feelings to understand your emotional patterns.', action: '<button class="iv-btn iv-btn-primary" onclick="showSection(\\\'#emotionPatterns\\\')">View Analytics</button>' },
    'emotionPatterns': { cat: 'Understanding', title: 'Mood Analytics', desc: 'A deeper look at your emotional trends over time.', action: '<button class="iv-btn iv-btn-primary" onclick="showSection(\\\'#mood\\\')">Log Mood</button>' },
    'journal': { cat: 'Expression', title: 'Private Journal', desc: 'A safe space to write your thoughts without judgment.', action: '' },
    'voiceJournal': { cat: 'Expression', title: 'Voice Journal', desc: 'Speak your mind and let INNERVOICE transcribe your thoughts.', action: '' },
    'reflection': { cat: 'Expression', title: 'Guided Reflections', desc: 'Structured prompts to help you reflect deeply on specific moments.', action: '' },
    'dailyPlan': { cat: 'Growth', title: 'Daily Routine', desc: 'Your personalized wellness actions for today.', action: '<button class="iv-btn iv-btn-primary" onclick="typeof loadDailyRecommendations === \\\'function\\\' ? loadDailyRecommendations() : null">Refresh Plan</button>' },
    'habitTrackerSection': { cat: 'Growth', title: 'Habit Tracker', desc: 'Build and maintain positive daily routines.', action: '' },
    'goals': { cat: 'Growth', title: 'Goal Tracking', desc: 'Set meaningful wellness objectives and track your progress.', action: '<button class="iv-btn iv-btn-primary" onclick="document.getElementById(\\\'goalTitle\\\').focus()">New Goal</button>' },
    'achievements': { cat: 'Growth', title: 'Milestones', desc: 'Celebrate your consistency and wellness wins.', action: '' },
    'focusMode': { cat: 'Wellness', title: 'Focus Sessions', desc: 'Minimize distractions and concentrate on your tasks.', action: '' },
    'chatbot': { cat: 'AI Assistance', title: 'Wellness Chat', desc: 'Talk to your AI companion whenever you need support.', action: '<button class="iv-btn iv-btn-ghost" onclick="clearChat()">Clear Chat</button>' },
    'resources': { cat: 'Wellness', title: 'Resources & Relaxation', desc: 'Meditation guides, calming sounds, and daily quotes.', action: '' },
    'profile': { cat: 'System', title: 'Settings & Profile', desc: 'Manage your INNERVOICE account preferences.', action: '<button class="iv-btn iv-btn-secondary" onclick="logout()">Logout</button>' },
    'aiMemory': { cat: 'System', title: 'AI Memory', desc: 'Manage what your AI companion remembers about you.', action: '' }
};

for (const id in featureHeaders) {
    const data = featureHeaders[id];
    const regex = new RegExp('<section id="' + id + '">', 'g');
    const headerHTML =
        '<section id="' + id + '">' +
        '<div class="feature-header">' +
        '<div class="feature-header-left">' +
        '<div class="feature-category">' + data.cat + '</div>' +
        '<h2>' + data.title + '</h2>' +
        '<p>' + data.desc + '</p>' +
        '</div>' +
        (data.action ? '<div class="feature-header-right">' + data.action + '</div>' : '') +
        '</div>';
    html = html.replace(regex, headerHTML);
}

fs.writeFileSync('index.html', html);
console.log("Premium Feature Headers injected successfully.");
