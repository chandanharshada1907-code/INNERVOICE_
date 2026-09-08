const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");
const { awardXP, evaluateAchievements } = require("../services/achievementService");

const router = express.Router();


// ======================================
// POST /api/journals
// Save a journal entry (JWT protected)
// ======================================

router.post("/", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const { title, text, content } = req.body;
    const journalText = (text || content || "").trim();
    const journalTitle = (title || "").trim();

    if (!journalText) {
        return res.status(400).json({
            success: false,
            message: "Journal text is required"
        });
    }

    const sql = `
        INSERT INTO journals (user_id, title, content, journal_date)
        VALUES (?, ?, ?, CURDATE())
    `;

    db.query(sql, [userId, journalTitle, journalText], async (err, result) => {

        if (err) {
            console.error("Error saving journal:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to save journal entry: " + (err.sqlMessage || err.message)
            });
        }

        // Award XP for journal entry (10 XP)
        try {
            await awardXP(userId, 10, "Journal entry", "journal", result.insertId);
            evaluateAchievements(userId, () => {});
        } catch(e) {
            console.error("XP award error in journals:", e);
        }

        res.status(201).json({
            success: true,
            message: "Journal entry saved!",
            journal_id: result.insertId,
            created_at: new Date().toISOString()
        });

    });

});


// ======================================
// GET /api/journals
// Get all journal entries for the
// logged-in user (newest first, limit 30)
// ======================================

router.get("/", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const sql = `
        SELECT journal_id AS id, title, content AS text, journal_date, created_at
        FROM journals
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 30
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("Error fetching journals:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch journal entries: " + (err.sqlMessage || err.message)
            });
        }

        res.status(200).json({
            success: true,
            journals: results || []
        });

    });

});


// ======================================
// GET /api/journals/:id
// Get a single journal entry by ID.
// Only the owner can access it.
// ======================================

router.get("/:id", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const entryId = parseInt(req.params.id, 10);

    if (isNaN(entryId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid journal ID"
        });
    }

    const sql = `
        SELECT journal_id AS id, title, content AS text, journal_date, created_at
        FROM journals
        WHERE journal_id = ? AND user_id = ?
    `;

    db.query(sql, [entryId, userId], (err, results) => {

        if (err) {
            console.error("Error fetching journal:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch journal entry: " + (err.sqlMessage || err.message)
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Journal entry not found"
            });
        }

        res.status(200).json({
            success: true,
            journal: results[0]
        });

    });

});


// ======================================
// DELETE /api/journals/:id
// Delete a journal entry by ID.
// Only the owner can delete their own.
// ======================================

router.delete("/:id", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const entryId = parseInt(req.params.id, 10);

    if (isNaN(entryId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid journal ID"
        });
    }

    const sql = `
        DELETE FROM journals
        WHERE journal_id = ? AND user_id = ?
    `;

    db.query(sql, [entryId, userId], (err, result) => {

        if (err) {
            console.error("Error deleting journal:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to delete journal entry: " + (err.sqlMessage || err.message)
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Journal entry not found or already deleted"
            });
        }

        res.status(200).json({
            success: true,
            message: "Journal entry deleted"
        });

    });

});


// ======================================
// PUT /api/journals/:id
// Update an existing journal entry.
// Only the owner can edit their own.
// ======================================

router.put("/:id", verifyToken, (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const entryId = parseInt(req.params.id, 10);

    if (isNaN(entryId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid journal ID"
        });
    }

    const { title, text, content } = req.body;
    const journalText = (text || content || "").trim();
    const journalTitle = (title || "").trim();

    if (!journalText) {
        return res.status(400).json({
            success: false,
            message: "Journal text cannot be empty"
        });
    }

    const sql = `
        UPDATE journals
        SET title = ?, content = ?
        WHERE journal_id = ? AND user_id = ?
    `;

    db.query(sql, [journalTitle, journalText, entryId, userId], (err, result) => {

        if (err) {
            console.error("Error updating journal:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to update journal entry: " + (err.sqlMessage || err.message)
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Journal entry not found or unauthorized"
            });
        }

        res.status(200).json({
            success: true,
            message: "Journal entry updated!",
            journal: {
                id: entryId,
                title: journalTitle,
                text: journalText
            }
        });

    });

});


// ============================================================
// POST /api/journals/analyze
// AI Reflection Analysis — with retry + exponential backoff
// ============================================================
//
// STRATEGY:
//   Each Gemini model is attempted up to MAX_RETRIES (3) times.
//   On transient errors (503, 429, timeout, ECONNRESET):
//     - wait  2s before attempt 2
//     - wait  5s before attempt 3
//     - wait 10s before attempt 4  (if MAX_RETRIES were 4)
//   After all retries fail, the next Gemini model is tried.
//   After all Gemini models fail, OpenAI is tried (with retries).
//   API keys are NEVER sent to the frontend.
//   Journal text is NEVER logged (privacy rule).
//
// PROMPT: labelled-line format — no JSON schema template,
//   no angle-bracket placeholders (they cause Gemini to echo
//   the prompt back instead of filling it in).
//
// PARSER: line-by-line label scanner — no fragile regex lookaheads.
// ============================================================

// ── Retry constants ──────────────────────────────────────────
const MAX_RETRIES        = 3;                    // max attempts per model
const BACKOFF_MS         = [2000, 5000, 10000];  // wait before attempt 2, 3 (+ beyond)
const PER_REQ_TIMEOUT_MS = 20000;               // per-request AbortController timeout (ms)

/** Sleep for `ms` milliseconds */
function sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

/** Returns true for HTTP status codes that are safe to retry */
function isRetryableStatus(status) {
    return status === 503 || status === 429 || status === 408 || status === 500;
}

router.post("/analyze", verifyToken, async (req, res) => {

    // ── Auth ─────────────────────────────────────────────────
    const userId = req.user.user_id || req.user.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    // ── Input validation ──────────────────────────────────────
    const { text, content } = req.body;
    const journalText = (text || content || "").trim();
    if (!journalText) {
        return res.status(400).json({ success: false, message: "Journal text is required." });
    }

    // ── API key lookup (backend only — never sent to client) ──
    const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey && !openaiKey) {
        console.warn("[journals/analyze] No AI provider configured — add GEMINI_API_KEY to backend/.env");
        return res.status(200).json({
            success: false, available: false,
            message: "AI analysis requires GEMINI_API_KEY in backend/.env"
        });
    }

    // ── Prompt ───────────────────────────────────────────────
    const safeText = journalText.substring(0, 2000).replace(/"/g, "'");
    const prompt =
        "You are a compassionate wellness companion for INNERVOICE.\n" +
        "Analyze this user reflection entry and return a concise analysis containing ALL 5 of the following required fields:\n\n" +
        "EMOTION: one word (e.g. Stressed, Calm, Hopeful, Anxious, Happy, Relieved, Mixed)\n" +
        "SENTIMENT: one word from [Positive, Negative, Mixed, Neutral, Reflective]\n" +
        "INSIGHT: 1-2 concise warm sentences acknowledging the user's feelings\n" +
        "SUGGESTION: 1 practical sentence offering a self-care action step\n" +
        "ENCOURAGEMENT: 1 short uplifting sentence of support\n\n" +
        "CRITICAL RULES:\n" +
        "1. Output MUST contain ALL 5 fields: EMOTION, SENTIMENT, INSIGHT, SUGGESTION, ENCOURAGEMENT.\n" +
        "2. Output short, concise text so all 5 fields fit comfortably.\n" +
        "3. Format as labelled lines (e.g. EMOTION: ...) or valid JSON with keys: emotion, sentiment, insight, suggestion, encouragement.\n\n" +
        "User Reflection:\n" + safeText;

    // ── Parser ───────────────────────────────────────────────
    // Parses either JSON or labelled-line formats.
    // MUST contain all 5 required non-empty fields or returns null.
    function parseAnalysis(rawText) {
        if (!rawText || rawText.trim().length < 10) return null;

        const fields = {};

        // 1. Try parsing JSON format
        let cleaned = rawText.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        }
        if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
            try {
                const jsonObj = JSON.parse(cleaned);
                if (jsonObj && typeof jsonObj === "object") {
                    for (const key of Object.keys(jsonObj)) {
                        fields[key.toLowerCase()] = String(jsonObj[key] || "").trim();
                    }
                }
            } catch (e) {
                // Ignore JSON parse error, fall back to line parser
            }
        }

        // 2. Parse labelled lines if JSON didn't yield all fields
        if (!fields.emotion || !fields.insight || !fields.suggestion || !fields.encouragement) {
            const lineFields = {};
            const lines = rawText.split(/\r?\n/);
            let currentLabel = null;
            let currentValue = [];

            for (const line of lines) {
                const m = line.match(/^(EMOTION|SENTIMENT|INSIGHT|SUGGESTION|ENCOURAGEMENT)\s*:\s*(.*)/i);
                if (m) {
                    if (currentLabel) lineFields[currentLabel] = currentValue.join(" ").trim();
                    currentLabel = m[1].toLowerCase();
                    currentValue = m[2] ? [m[2].trim()] : [];
                } else if (currentLabel && line.trim()) {
                    currentValue.push(line.trim());
                }
            }
            if (currentLabel) lineFields[currentLabel] = currentValue.join(" ").trim();

            for (const k of ["emotion", "sentiment", "insight", "suggestion", "encouragement"]) {
                if (!fields[k] && lineFields[k]) {
                    fields[k] = lineFields[k];
                }
            }
        }

        const emotion       = fields.emotion       ? fields.emotion.trim()       : null;
        const sentiment     = fields.sentiment     ? fields.sentiment.trim()     : null;
        const insight       = fields.insight       ? fields.insight.trim()       : null;
        const suggestion    = fields.suggestion    ? fields.suggestion.trim()    : null;
        const encouragement = fields.encouragement ? fields.encouragement.trim() : null;

        // Strict requirement: EVERY required field MUST be present and non-empty.
        if (!emotion || !insight || !suggestion || !encouragement) {
            console.warn("[journals/analyze] parseAnalysis: missing required fields.", {
                hasEmotion: !!emotion,
                hasSentiment: !!sentiment,
                hasInsight: !!insight,
                hasSuggestion: !!suggestion,
                hasEncouragement: !!encouragement
            });
            return null;
        }

        const finalSentiment = sentiment || (() => {
            const e = emotion.toLowerCase();
            if (["happy","calm","hopeful","grateful","excited","peaceful","content","relieved","proud","joyful"].some(w => e.includes(w))) return "Positive";
            if (["stressed","anxious","sad","depressed","angry","worried","overwhelmed","frustrated","lonely","scared"].some(w => e.includes(w))) return "Negative";
            if (["mixed","conflicted","bittersweet","uncertain"].some(w => e.includes(w))) return "Mixed";
            return "Reflective";
        })();

        // Derive summary sentence from insight
        const firstSentence = insight.split(/[.!?]/)[0].trim();
        const summary = firstSentence ? (firstSentence.endsWith(".") ? firstSentence : firstSentence + ".") : insight;

        return {
            emotion:       emotion,
            sentiment:     finalSentiment,
            summary:       summary,
            insight:       insight,
            suggestion:    suggestion,
            encouragement: encouragement
        };
    }

    // ── fetchWithTimeout ──────────────────────────────────────
    function fetchWithTimeout(url, options, ms) {
        ms = ms || PER_REQ_TIMEOUT_MS;
        const ctrl  = new AbortController();
        const timer = setTimeout(function() { ctrl.abort(); }, ms);
        return fetch(url, Object.assign({}, options, { signal: ctrl.signal }))
            .finally(function() { clearTimeout(timer); });
    }

    // ── tryGeminiModel ────────────────────────────────────────
    // Tries one Gemini model up to MAX_RETRIES times with exponential
    // backoff on transient errors (503/429/408/500/timeout/network or missing fields).
    // Returns a parsed analysis object with ALL 5 fields, or null.
    async function tryGeminiModel(model) {
        const url = "https://generativelanguage.googleapis.com/v1beta/models/" +
                    model + ":generateContent?key=" + geminiKey;
        const reqBody = JSON.stringify({
            contents:         [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature:     0.3,
                maxOutputTokens: 800  // 800 tokens fits all 5 fields comfortably with concise prompt
            }
        });

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const tag = "[journals/analyze] Gemini/" + model + " attempt " + attempt + "/" + MAX_RETRIES;

            // Exponential backoff before retries (not before attempt 1)
            if (attempt > 1) {
                const delay = BACKOFF_MS[Math.min(attempt - 2, BACKOFF_MS.length - 1)];
                console.log(tag + " — waiting " + (delay / 1000) + "s before retry...");
                await sleep(delay);
            }

            try {
                console.log(tag + " — sending request...");
                const gemRes = await fetchWithTimeout(url, {
                    method:  "POST",
                    headers: { "Content-Type": "application/json" },
                    body:    reqBody
                }, PER_REQ_TIMEOUT_MS);

                if (gemRes.ok) {
                    const gemData = await gemRes.json();
                    const rawText = (
                        gemData &&
                        gemData.candidates &&
                        gemData.candidates[0] &&
                        gemData.candidates[0].content &&
                        gemData.candidates[0].content.parts &&
                        gemData.candidates[0].content.parts[0] &&
                        gemData.candidates[0].content.parts[0].text
                    ) ? gemData.candidates[0].content.parts[0].text.trim() : "";

                    console.log(tag + " — response OK. Raw (200c): " + rawText.substring(0, 200));

                    const parsed = parseAnalysis(rawText);
                    if (parsed) {
                        console.log(tag + " — ✅ SUCCESS — emotion: " + parsed.emotion + ", sentiment: " + parsed.sentiment);
                        return parsed; // Complete response with all 5 fields
                    }

                    // Partial/incomplete response — retry the same model
                    console.warn(tag + " — incomplete response (missing required fields). Will retry...");
                    if (attempt < MAX_RETRIES) continue;

                    console.warn(tag + " — all " + attempt + " attempts resulted in incomplete output.");
                    return null;

                } else {
                    const errBody = await gemRes.text().catch(function() { return ""; });
                    let errMsg = errBody;
                    try { errMsg = JSON.parse(errBody).error.message || errBody; } catch(e) {}
                    console.error(tag + " — HTTP " + gemRes.status + ": " + errMsg.substring(0, 200));

                    if (isRetryableStatus(gemRes.status) && attempt < MAX_RETRIES) {
                        console.log(tag + " — transient server error (HTTP " + gemRes.status + "), will retry...");
                        continue;
                    }
                    return null;
                }

            } catch (err) {
                const isTimeout = err.name === "AbortError";
                const isNetwork = err.code === "ECONNRESET" || err.code === "ENOTFOUND" || err.code === "ETIMEDOUT";
                const reason    = isTimeout
                    ? "request timed out after " + (PER_REQ_TIMEOUT_MS / 1000) + "s"
                    : err.message;
                console.error(tag + " — " + reason);

                if ((isTimeout || isNetwork) && attempt < MAX_RETRIES) {
                    console.log(tag + " — transient network failure, will retry...");
                    continue;
                }
                return null;
            }
        }
        return null;
    }

    // ── tryOpenAI ─────────────────────────────────────────────
    // Tries OpenAI gpt-4o-mini up to MAX_RETRIES times.
    // Returns a parsed analysis object on success, or null.
    async function tryOpenAI() {
        const reqBody = JSON.stringify({
            model:       "gpt-4o-mini",
            messages:    [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens:  500
        });

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const tag = "[journals/analyze] OpenAI/gpt-4o-mini attempt " + attempt + "/" + MAX_RETRIES;

            if (attempt > 1) {
                const delay = BACKOFF_MS[Math.min(attempt - 2, BACKOFF_MS.length - 1)];
                console.log(tag + " — waiting " + (delay / 1000) + "s before retry...");
                await sleep(delay);
            }

            try {
                console.log(tag + " — sending request...");
                const oaiRes = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type":  "application/json",
                        "Authorization": "Bearer " + openaiKey
                    },
                    body: reqBody
                }, PER_REQ_TIMEOUT_MS);

                if (oaiRes.ok) {
                    const oaiData = await oaiRes.json();
                    const rawText = (
                        oaiData &&
                        oaiData.choices &&
                        oaiData.choices[0] &&
                        oaiData.choices[0].message &&
                        oaiData.choices[0].message.content
                    ) ? oaiData.choices[0].message.content.trim() : "";

                    console.log(tag + " — response OK. Raw (200c): " + rawText.substring(0, 200));
                    const parsed = parseAnalysis(rawText);
                    if (parsed) {
                        console.log(tag + " — ✅ SUCCESS — emotion: " + parsed.emotion);
                        return parsed;
                    }
                    console.warn(tag + " — incomplete response (missing required fields). Will retry...");
                    if (attempt < MAX_RETRIES) continue;
                    return null;

                } else {
                    const errBody = await oaiRes.text().catch(function() { return ""; });
                    let errMsg = errBody;
                    try { errMsg = JSON.parse(errBody).error.message || errBody; } catch(e) {}
                    console.error(tag + " — HTTP " + oaiRes.status + ": " + errMsg.substring(0, 200));
                    if (isRetryableStatus(oaiRes.status) && attempt < MAX_RETRIES) continue;
                    return null;
                }
            } catch (err) {
                const isTimeout = err.name === "AbortError";
                const reason    = isTimeout ? "timed out" : err.message;
                console.error(tag + " — " + reason);
                if ((isTimeout || err.code === "ECONNRESET") && attempt < MAX_RETRIES) continue;
                return null;
            }
        }
        return null;
    }

    // ── Provider waterfall ────────────────────────────────────
    // 1. Gemini models (in order), each with retry + backoff
    // 2. OpenAI as final fallback (with retry + backoff)

    if (geminiKey) {
        const geminiModels = ["gemini-3.6-flash", "gemini-flash-latest"];
        for (let mi = 0; mi < geminiModels.length; mi++) {
            const model  = geminiModels[mi];
            const parsed = await tryGeminiModel(model);
            if (parsed) {
                return res.status(200).json({ success: true, available: true, analysis: parsed });
            }
            if (mi < geminiModels.length - 1) {
                console.log("[journals/analyze] " + model + " failed — trying fallback model: " + geminiModels[mi + 1]);
            }
        }
        console.warn("[journals/analyze] All Gemini models exhausted (all retries used).");
    }

    if (openaiKey) {
        console.log("[journals/analyze] Trying OpenAI as final fallback provider...");
        const parsed = await tryOpenAI();
        if (parsed) {
            return res.status(200).json({ success: true, available: true, analysis: parsed });
        }
        console.warn("[journals/analyze] OpenAI fallback exhausted.");
    }

    // All providers and all retries exhausted
    console.error("[journals/analyze] ❌ All providers failed after full retry cycle. Check GEMINI_API_KEY and network.");
    return res.status(200).json({
        success:   false,
        available: false,
        message:   "AI insight could not be generated right now. Your reflection has been saved successfully."
    });

});


module.exports = router;
