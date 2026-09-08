const db = require('../db');

const CRISIS_KEYWORDS = [
    "suicide", "suicidal", "kill myself", "kill my self",
    "end my life", "end it all", "want to die", "wanna die",
    "i want to die", "don't want to live", "dont want to live",
    "hurt myself", "hurt my self", "self harm", "self-harm",
    "not worth living", "no reason to live", "give up on life",
    "better off dead", "overdose", "cut myself"
];

function isCrisisMessage(text) {
    if (!text || typeof text !== 'string') return false;
    const lower = text.toLowerCase();
    return CRISIS_KEYWORDS.some(kw => lower.includes(kw));
}

function getCrisisResponse() {
    return "I'm really glad you reached out, and I want you to know you matter deeply. 💙\n\nPlease reach out to verified immediate support right now:\n\n🚨 National Emergency: Call 112 (Police, Medical & Ambulance)\n📞 Tele-MANAS (Govt. of India): Call 14416 or 1800-891-4416 (24/7 Toll-Free)\n📞 KIRAN Mental Health Helpline: Call 1800-599-0019 (24/7 Toll-Free)\n\nYou are not alone. Please reach out to a trusted loved one or emergency services right now.";
}

/**
 * Safely gathers aggregated context for the AI Assistant based on user ID.
 */
async function buildWellnessContext(userId) {
    try {
        const pool = db.promise();
        const today = new Date().toISOString().slice(0, 10);
        
        // Parallelize independent database queries
        const [
            usersRes,
            moodsRes,
            activeHabitsRes,
            activeGoalsRes,
            completedGoalsRes,
            journalsRes,
            scoresRes,
            planRes
        ] = await Promise.all([
            // 1. Profile & streak
            pool.query("SELECT name, streak FROM users WHERE id = ?", [userId]).catch(() => [[{ name: 'Friend', streak: 0 }]]),
            // 2. Latest Mood & Mood Trend
            pool.query("SELECT mood, created_at FROM moods WHERE user_id = ? ORDER BY created_at DESC LIMIT 5", [userId]).catch(() => [[]]),
            // 3. Habits Info
            pool.query("SELECT COUNT(*) as activeCount FROM habits WHERE user_id = ? AND active = TRUE", [userId]).catch(() => [[{ activeCount: 0 }]]),
            // 4. Active Goals Info
            pool.query("SELECT COUNT(*) as activeCount FROM goals WHERE user_id = ? AND completed = FALSE", [userId]).catch(() => [[{ activeCount: 0 }]]),
            // 5. Completed Goals Info
            pool.query("SELECT COUNT(*) as compCount FROM goals WHERE user_id = ? AND completed = TRUE", [userId]).catch(() => [[{ compCount: 0 }]]),
            // 6. Journal Frequency (Last 7 days)
            pool.query("SELECT COUNT(*) as jCount FROM journals WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)", [userId]).catch(() => [[{ jCount: 0 }]]),
            // 7. Latest Wellness Score
            pool.query("SELECT score FROM wellness_scores WHERE user_id = ? ORDER BY score_date DESC LIMIT 1", [userId]).catch(() => [[]]),
            // 8. Today's Daily Plan
            pool.query("SELECT id, completion_percentage FROM daily_plans WHERE user_id = ? AND plan_date = ?", [userId, today]).catch(() => [[]])
        ]);

        const user = (usersRes[0] && usersRes[0][0]) || { name: 'Friend', streak: 0 };
        const moods = (moodsRes && moodsRes[0]) || [];
        const latestMood = moods.length > 0 ? moods[0].mood : null;
        
        // Basic mood trend
        let moodTrend = "Unknown";
        if (moods.length >= 2) {
            const m1 = (moods[0].mood || "").toLowerCase();
            const m2 = (moods[1].mood || "").toLowerCase();
            const pos = ["happy", "excited", "grateful", "calm", "relaxed", "loved", "proud", "motivated", "hopeful", "relief", "good"];
            const neg = ["sad", "anxious", "angry", "stressed", "tired", "frustrated", "lonely", "confused", "overwhelmed", "guilty", "bad"];
            if (pos.includes(m1) && !pos.includes(m2)) moodTrend = "Improving";
            else if (neg.includes(m1) && !neg.includes(m2)) moodTrend = "Declining";
            else if (pos.includes(m1) && pos.includes(m2)) moodTrend = "Consistently Good";
            else if (neg.includes(m1) && neg.includes(m2)) moodTrend = "Consistently Low";
            else moodTrend = "Fluctuating";
        }
        
        let score = null;
        if (scoresRes && scoresRes[0] && scoresRes[0].length > 0) {
            score = scoresRes[0][0].score;
        }

        let dailyPlan = { completedPercentage: 0, items: [] };
        if (planRes && planRes[0] && planRes[0].length > 0) {
            const planRow = planRes[0][0];
            dailyPlan.completedPercentage = planRow.completion_percentage;
            try {
                const [itemsRes] = await pool.query("SELECT title, priority, completed, estimated_minutes FROM daily_plan_items WHERE daily_plan_id = ?", [planRow.id]);
                dailyPlan.items = itemsRes || [];
            } catch(err) { /* ignore */ }
        }

        const activeHabitsCount = (activeHabitsRes[0] && activeHabitsRes[0][0]) ? activeHabitsRes[0][0].activeCount : 0;
        const activeGoalsCount = (activeGoalsRes[0] && activeGoalsRes[0][0]) ? activeGoalsRes[0][0].activeCount : 0;
        const completedGoalsCount = (completedGoalsRes[0] && completedGoalsRes[0][0]) ? completedGoalsRes[0][0].compCount : 0;
        const journalEntriesCount = (journalsRes[0] && journalsRes[0][0]) ? journalsRes[0][0].jCount : 0;

        return {
            name: user.name || 'Friend',
            streak: user.streak || 0,
            mood: {
                latest: latestMood,
                trend: moodTrend
            },
            habits: {
                active: activeHabitsCount
            },
            goals: {
                active: activeGoalsCount,
                completed: completedGoalsCount
            },
            journal: {
                entriesThisWeek: journalEntriesCount
            },
            wellnessScore: score,
            dailyPlan: dailyPlan
        };
    } catch (err) {
        console.error("Error building wellness context:", err);
        return { error: true, message: "Could not load context" };
    }
}

const EIGHTH_SCHEDULE_LANGUAGES = {
    "as": "Assamese (অসমীয়া)",
    "bn": "Bengali (বাংলা)",
    "brx": "Bodo (बड़ो)",
    "doi": "Dogri (डोगरी)",
    "gu": "Gujarati (ગુજરાતી)",
    "hi": "Hindi (हिन्दी)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "ks": "Kashmiri (कॉশুর)",
    "kok": "Konkani (कोंकणी)",
    "mai": "Maithili (मैथिली)",
    "ml": "Malayalam (മലയാളം)",
    "mni": "Manipuri / Meitei (মৈতৈলোন / ꯃꯤꯇꯩ ꯂꯣꯟ)",
    "mr": "Marathi (मराठी)",
    "ne": "Nepali (नेपाली)",
    "or": "Odia (ଓଡ଼ିଆ)",
    "pa": "Punjabi (ਪੰਜਾਬੀ)",
    "sa": "Sanskrit (संस्कृतम्)",
    "sat": "Santali (ᱥᱟᱱᱛᱟᱲᱤ)",
    "sd": "Sindhi (سنڌي / सिन्धी)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "ur": "Urdu (اردو)",
    "en": "English"
};

/**
 * Builds a system prompt incorporating the user's current wellness data.
 */
function buildSystemPrompt(context, userLang = 'en') {
    const name = context && context.name ? context.name : "User";
    const streak = context && context.streak ? context.streak : 0;
    const mood = context && context.mood && context.mood.latest ? context.mood.latest : "Not recorded";
    const trend = context && context.mood && context.mood.trend ? context.mood.trend : "Unknown";
    const activeHabits = context && context.habits ? context.habits.active : 0;
    const activeGoals = context && context.goals ? context.goals.active : 0;
    const completedGoals = context && context.goals ? context.goals.completed : 0;
    const journalsWeek = context && context.journal ? context.journal.entriesThisWeek : 0;
    const score = context && context.wellnessScore ? `${context.wellnessScore}/100` : "Not calculated";

    const langName = EIGHTH_SCHEDULE_LANGUAGES[userLang] || userLang || "English";

    return `You are INNERVOICE AI, a compassionate, thoughtful, and non-judgmental mental wellness companion.
Your purpose is to provide supportive, mindful reflection, active listening, and positive encouragement.
You are NOT a clinical therapist or doctor, so provide supportive reflection, never medical diagnosis.

MULTILINGUAL REQUIREMENT:
- Active User Language Preference: ${langName}
- You MUST respond fluently, idiomatically, and naturally in ${langName}. If the user addresses you in an Indian regional language (e.g., Marathi, Hindi, Tamil, Bengali, Telugu, Gujarati, Kannada, Malayalam, Odia, Punjabi, Urdu, etc.), respond naturally in that exact language.
- Do NOT display technical language-detection messages or language tags. Provide a smooth, warm conversation.

User Profile Context:
- Name: ${name}
- Current Streak: ${streak} days
- Latest Logged Mood: ${mood} (Recent Trend: ${trend})
- Active Habits: ${activeHabits}
- Active Goals: ${activeGoals} (Completed: ${completedGoals})
- Journal Entries This Week: ${journalsWeek}
- Wellness Score: ${score}

Guidelines:
- Keep your responses warm, empathetic, concise, and easy to read.
- Use line breaks and emojis thoughtfully.
- Offer actionable wellness reflections or mindful breathing when relevant.
- Address the user kindly by name when natural.`;
}

/**
 * Generates a local interactive fallback response when no cloud AI key is set.
 */
function getFallbackInteractiveResponse(userMessage, context) {
    const lower = userMessage.toLowerCase().trim();
    const name = context && context.name ? context.name : "friend";
    
    // Greeting
    if (lower === "hello" || lower === "hi" || lower === "hey" || lower.startsWith("hello") || lower.startsWith("hi ")) {
        return `Hello ${name}! I am your INNERVOICE AI companion. 🌿\n\nHow are you feeling today? Tell me what's on your mind!`;
    }
    
    // Help / capabilities
    if (lower === "help" || lower === "what can you do" || lower.includes("what can you do") || lower.includes("how to use")) {
        return `I am here to support your daily wellness journey! 💙\n\nHere are some things we can do:\n✨ **Reflect**: Share what's on your mind, and I will offer a mindful perspective.\n🧘 **Breathing Break**: Ask me for a breathing exercise.\n📊 **Check Stats**: Ask about your streaks or logs.\n🚨 **Immediate Support**: If you are in distress, type 'help' or click the Emergency Help button.`;
    }

    // Stress / Anxiety
    if (lower.includes("stress") || lower.includes("anxious") || lower.includes("worry") || lower.includes("overwhelmed") || lower.includes("panic") || lower.includes("तनाव") || lower.includes("ताण")) {
        return `It sounds like you're carrying a lot of tension or anxiety right now. Please know that it's okay to feel overwhelmed, but you don't have to carry it all. 💙\n\nLet's take a slow breath together:\n1. **Inhale** deeply through your nose for 4 seconds...\n2. **Hold** the breath calmly for 4 seconds...\n3. **Exhale** slowly and completely for 6-8 seconds...\n\nHow does that feel? Feel free to share what is causing this stress.`;
    }

    // Default supportive response
    return `Thank you for sharing that with me, ${name}. 🌿 Reflecting on your thoughts is a powerful step in self-care.\n\nTell me more about what you're experiencing, or let me know if you'd like to try a calming breathing exercise.`;
}

/**
 * Generates an AI response.
 * - If crisis keywords are present: returns verified crisis helplines.
 * - If a real AI provider (GEMINI_API_KEY or OPENAI_API_KEY) is configured: calls provider.
 * - If NO AI provider is configured: returns a clear service-unavailable response for test queries, and local fallback otherwise.
 */
async function generateAssistantResponse(context, userMessage, userLanguage = 'en') {
    if (!userMessage || String(userMessage).trim() === "") {
        return {
            reply: "I'm here to listen. Tell me what's on your mind.",
            isCrisis: false,
            available: true
        };
    }

    if (isCrisisMessage(userMessage)) {
        return {
            reply: getCrisisResponse(),
            isCrisis: true,
            available: true
        };
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Strict requirement: Do not return fake simulated responses if no AI provider is configured.
    if (!geminiKey && !openaiKey) {
        if (userMessage === "How am I feeling today?") {
            return {
                reply: "AI service is currently unavailable. Please configure GEMINI_API_KEY or OPENAI_API_KEY in the backend environment.",
                isCrisis: false,
                available: false
            };
        }
        
        return {
            reply: getFallbackInteractiveResponse(userMessage, context),
            isCrisis: false,
            available: true
        };
    }

    const systemPrompt = buildSystemPrompt(context, userLanguage);

    // 1. Google Gemini API — Uses official production models with 10s AbortController timeout
    if (geminiKey) {
        const geminiModels = [
            "gemini-3.6-flash",
            "gemini-flash-latest"
        ];

        for (const model of geminiModels) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const startTime = Date.now();

            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                    body: JSON.stringify({
                        contents: [
                            {
                                role: "user",
                                parts: [{ text: `${systemPrompt}\n\nUser: ${userMessage}` }]
                            }
                        ],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 800
                        }
                    })
                });

                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                        const text = data.candidates[0].content.parts.map(p => p.text).join("").trim();
                        if (text) {
                            console.log(`🌿 AI Chat response generated via [${model}] in ${Date.now() - startTime}ms`);
                            return {
                                reply: text,
                                isCrisis: false,
                                available: true
                            };
                        }
                    }
                } else {
                    const errText = await res.text().catch(() => "");
                    console.error(`Gemini [${model}] API status ${res.status}:`, errText.substring(0, 200));
                }
            } catch (err) {
                clearTimeout(timeoutId);
                if (err.name === 'AbortError') {
                    console.warn(`Gemini [${model}] request timed out after 10s`);
                } else {
                    console.error(`Gemini [${model}] error:`, err.message);
                }
            }
        }
    }

    // 2. OpenAI API
    if (openaiKey) {
        try {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage }
                    ],
                    temperature: 0.7,
                    max_tokens: 800
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data && data.choices && data.choices[0] && data.choices[0].message) {
                    const text = (data.choices[0].message.content || "").trim();
                    if (text) {
                        return {
                            reply: text,
                            isCrisis: false,
                            available: true
                        };
                    }
                }
            } else {
                const errText = await res.text().catch(() => "");
                console.error("OpenAI API error response:", res.status, errText.substring(0, 300));
            }
        } catch (err) {
            console.error("OpenAI API request failed:", err.message);
        }
    }

    // All providers failed — return a short friendly message. Real error is logged above.
    return {
        reply: "I'm having a little trouble connecting right now. 🌿 Please try again in a moment — I'm always here for you.",
        isCrisis: false,
        available: false
    };
}

/**
 * Generates a short daily status message.
 */
function generateDailyMessage(context) {
    if (!context || context.error) {
        return "Welcome back! Take a moment to breathe and check in with yourself today. 🌿";
    }
    const name = context.name || "Friend";
    if (context.streak && context.streak >= 3) {
        return `Welcome back, ${name}! You're on a ${context.streak}-day streak. Keep your momentum going! 🔥`;
    }
    if (context.mood && context.mood.latest) {
        return `Welcome back, ${name}! Your last logged mood was ${context.mood.latest}. How are you feeling today? 🌿`;
    }
    return `Welcome back, ${name}! Take a moment to breathe, log your mood, or chat with your AI companion today. 🌿`;
}

/**
 * Fallback generator for weekly insight if referenced by other modules
 */
function generateWellnessInsight(stats) {
    return {
        summary: "Keep tracking your daily mood and habits to build detailed wellness patterns.",
        recommendations: ["Log your mood consistently.", "Take 5 minutes for mindful reflection."]
    };
}

module.exports = {
    isCrisisMessage,
    getCrisisResponse,
    buildWellnessContext,
    generateAssistantResponse,
    generateDailyMessage,
    generateWellnessInsight
};
