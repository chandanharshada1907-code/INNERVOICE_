const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");
const wellnessAssistantService = require("../services/wellnessAssistantService");

const router = express.Router();

// ======================================
// GET /api/chat/history
// Returns the logged-in user's most
// recent 100 chat messages, oldest first.
// JWT protected.
// ======================================
router.get("/history", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const sql = `
        SELECT id, role, content, created_at
        FROM chat_messages
        WHERE user_id = ?
        ORDER BY created_at ASC
        LIMIT 100
    `;

    db.query(sql, [userId], (err, rows) => {
        if (err) {
            console.error("Error fetching chat history:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch chat history: " + (err.sqlMessage || err.message)
            });
        }

        res.status(200).json({
            success: true,
            messages: rows || []
        });
    });
});

// ======================================
// POST /api/chat/message
// Processes user message, interacts with AI service,
// and saves both user and assistant messages to the database.
// JWT protected.
// ======================================
router.post("/message", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const userMessageText = req.body.message || req.body.content;

    if (!userMessageText || String(userMessageText).trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Message content is required."
        });
    }

    // Cap content to 4000 characters
    const safeUserContent = String(userMessageText).trim().substring(0, 4000);

    try {
        const pool = db.promise();
        
        // 1. Save User Message
        const userSql = `INSERT INTO chat_messages (user_id, role, content) VALUES (?, 'user', ?)`;
        await pool.query(userSql, [userId, safeUserContent]);

        // 2. Generate AI Response
        const context = await wellnessAssistantService.buildWellnessContext(userId);
        const aiResult = await wellnessAssistantService.generateAssistantResponse(context, safeUserContent);

        const aiResponseText = typeof aiResult === 'object' ? (aiResult.reply || "AI service is currently unavailable.") : String(aiResult);
        const isCrisis = typeof aiResult === 'object' ? !!aiResult.isCrisis : false;
        const isAvailable = typeof aiResult === 'object' ? aiResult.available !== false : true;

        // 3. Save AI Message
        const aiSql = `INSERT INTO chat_messages (user_id, role, content) VALUES (?, 'ai', ?)`;
        await pool.query(aiSql, [userId, aiResponseText]);

        res.status(200).json({
            success: true,
            reply: aiResponseText,
            isCrisis: isCrisis,
            available: isAvailable,
            contextUsed: {
                mood: !!(context && context.mood && context.mood.latest),
                habits: !!(context && context.habits && context.habits.active),
                goals: !!(context && context.goals && (context.goals.active || context.goals.completed)),
                wellnessScore: !!(context && context.wellnessScore)
            }
        });
    } catch (err) {
        console.error("Error processing chat message:", err);
        res.status(500).json({
            success: false,
            message: "Server error processing message: " + (err.sqlMessage || err.message)
        });
    }
});

// ======================================
// GET /api/chat/daily-message
// Returns a short daily message for dashboard
// ======================================
router.get("/daily-message", verifyToken, async (req, res) => {
    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    try {
        const context = await wellnessAssistantService.buildWellnessContext(userId);
        const msg = wellnessAssistantService.generateDailyMessage(context);
        
        res.status(200).json({
            success: true,
            message: msg
        });
    } catch (err) {
        console.error("Error generating daily message:", err);
        res.status(500).json({
            success: false,
            message: "Server error generating message."
        });
    }
});

// ======================================
// DELETE /api/chat/history
// Permanently clears all chat messages
// for the authenticated user only.
// ======================================
router.delete("/history", verifyToken, (req, res) => {
    const userId = req.user.user_id || req.user.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: User ID missing from token."
        });
    }

    const sql = `DELETE FROM chat_messages WHERE user_id = ?`;

    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error("Error clearing chat history:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to clear chat history: " + (err.sqlMessage || err.message)
            });
        }

        res.status(200).json({
            success: true,
            message: "Chat history cleared",
            deleted: result.affectedRows
        });
    });
});

module.exports = router;
