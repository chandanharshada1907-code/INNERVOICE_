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


// ======================================
// POST /api/journals/analyze
// AI Sentiment & Reflection Analysis
// Uses Gemini (primary) or OpenAI (fallback)
// ======================================

router.post("/analyze", verifyToken, async (req, res) => {

    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const { text, content } = req.body;
    const journalText = (text || content || "").trim();

    if (!journalText) {
        return res.status(400).json({
            success: false,
            message: "Journal text is required for analysis."
        });
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey && !openaiKey) {
        return res.status(200).json({
            success: false,
            available: false,
            message: "AI analysis is not available right now. Please try again later."
        });
    }

    const systemPrompt = `You are a compassionate wellness journal analysis assistant for INNERVOICE.
Analyze the following journal entry. Return ONLY a JSON object with exactly two keys:
- "sentiment": one of Positive, Negative, Mixed, Neutral, Reflective
- "insight": a warm, supportive 2-3 sentence reflection on the journal entry`;

    // Robust JSON extractor — finds the first { } block even if Gemini adds surrounding text
    function extractJSON(text) {
        if (!text) return null;
        // Strip markdown fences
        let s = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
        // Try direct parse first
        try { const p = JSON.parse(s); if (p.sentiment && p.insight) return p; } catch(e) { /* continue */ }
        // Find first { ... } block in the text
        const start = s.indexOf("{");
        const end = s.lastIndexOf("}");
        if (start >= 0 && end > start) {
            try {
                const p = JSON.parse(s.substring(start, end + 1));
                if (p.sentiment && p.insight) return p;
            } catch(e) { /* continue */ }
        }
        return null;
    }

    // --- 1. Try Google Gemini (with JSON mode enforced) ---
    if (geminiKey) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`;
            const geminiRes = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nJournal Entry:\n${journalText.substring(0, 3000)}` }] }],
                    generationConfig: {
                        temperature: 0.5,
                        maxOutputTokens: 400,
                        responseMimeType: "application/json"
                    }
                })
            });

            if (geminiRes.ok) {
                const geminiData = await geminiRes.json();
                const rawText = (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
                const parsed = extractJSON(rawText);
                if (parsed) {
                    return res.status(200).json({
                        success: true,
                        available: true,
                        analysis: { sentiment: parsed.sentiment, insight: parsed.insight }
                    });
                } else {
                    console.error("Journal analyze: Gemini JSON extraction failed | Raw:", rawText.substring(0, 200));
                }
            } else {
                const errBody = await geminiRes.text().catch(() => "");
                console.error("Journal analyze: Gemini API error", geminiRes.status, errBody.substring(0, 300));
            }
        } catch (err) {
            console.error("Journal analyze: Gemini request failed:", err.message);
        }
    }

    // --- 2. Fallback: OpenAI ---
    if (openaiKey) {
        try {
            const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiKey}` },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `Journal Entry:\n${journalText.substring(0, 3000)}` }
                    ],
                    temperature: 0.5,
                    max_tokens: 400,
                    response_format: { type: "json_object" }
                })
            });

            if (oaiRes.ok) {
                const oaiData = await oaiRes.json();
                const rawText = (oaiData?.choices?.[0]?.message?.content || "").trim();
                const parsed = extractJSON(rawText);
                if (parsed) {
                    return res.status(200).json({
                        success: true,
                        available: true,
                        analysis: { sentiment: parsed.sentiment, insight: parsed.insight }
                    });
                } else {
                    console.error("Journal analyze: OpenAI JSON extraction failed");
                }
            } else {
                const errBody = await oaiRes.text().catch(() => "");
                console.error("Journal analyze: OpenAI API error", oaiRes.status, errBody.substring(0, 300));
            }
        } catch (err) {
            console.error("Journal analyze: OpenAI request failed:", err.message);
        }
    }

    // All providers failed — return friendly message, log technical error server-side
    return res.status(200).json({
        success: false,
        available: false,
        message: "AI reflection is temporarily unavailable. Please try again in a moment."
    });

});


module.exports = router;
