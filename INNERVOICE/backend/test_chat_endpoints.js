const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const wellnessAssistantService = require('./services/wellnessAssistantService');
const chatRoutes = require('./routes/chat');

async function runChatTests() {
    console.log("==========================================");
    console.log("TEST SUITE: INNERVOICE AI CHATBOT");
    console.log("==========================================");

    // 1. TEST WELLNESS ASSISTANT SERVICE
    console.log("\n[TEST 1] Testing wellnessAssistantService without API Key...");
    const dummyContext = {
        name: "Test User",
        streak: 5,
        mood: { latest: "calm", trend: "Improving" },
        habits: { active: 2 },
        goals: { active: 1, completed: 3 },
        journal: { entriesThisWeek: 4 },
        wellnessScore: 85
    };

    const regularResponse = await wellnessAssistantService.generateAssistantResponse(dummyContext, "How am I feeling today?");
    console.log("Regular Response:", regularResponse);
    if (!regularResponse.available && regularResponse.reply.includes("AI service is currently unavailable")) {
        console.log("✓ PASSED: Returned transparent 'AI service is currently unavailable' (no fake responses).");
    } else {
        console.error("✗ FAILED: Expected service unavailable response.");
        process.exit(1);
    }

    console.log("\n[TEST 2] Testing Crisis Detection in Service...");
    const crisisResponse = await wellnessAssistantService.generateAssistantResponse(dummyContext, "I feel like I want to die and hurt myself.");
    console.log("Crisis Response:", crisisResponse.reply.substring(0, 120) + "...");
    if (crisisResponse.isCrisis && crisisResponse.reply.includes("112") && crisisResponse.reply.includes("Tele-MANAS")) {
        console.log("✓ PASSED: Emergency crisis helplines returned accurately.");
    } else {
        console.error("✗ FAILED: Expected crisis response with helplines.");
        process.exit(1);
    }

    console.log("\n[TEST 3] Testing Daily Message Generator...");
    const dailyMsg = wellnessAssistantService.generateDailyMessage(dummyContext);
    console.log("Daily Message:", dailyMsg);
    if (dailyMsg && dailyMsg.length > 10) {
        console.log("✓ PASSED: Daily message generated.");
    } else {
        console.error("✗ FAILED: Daily message empty.");
        process.exit(1);
    }

    // 2. TEST EXPRESS CHAT ROUTES
    const app = express();
    app.use(express.json());
    app.use('/api/chat', chatRoutes);

    const secret = process.env.JWT_SECRET || "innervoice_jwt_secret_key_2026_secure";
    const validToken = jwt.sign({ user_id: 1, email: "test@example.com" }, secret, { expiresIn: '1h' });

    console.log("\n[TEST 4] Testing Missing Token on POST /api/chat/message...");
    const resNoToken = await request(app)
        .post('/api/chat/message')
        .send({ message: "Hello" });
    if (resNoToken.status === 401) {
        console.log("✓ PASSED: Rejected unauthenticated request with 401.");
    } else {
        console.error("✗ FAILED: Expected 401, got:", resNoToken.status);
        process.exit(1);
    }

    console.log("\n[TEST 5] Testing Empty Message on POST /api/chat/message...");
    const resEmpty = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ message: "   " });
    if (resEmpty.status === 400) {
        console.log("✓ PASSED: Rejected empty whitespace message with 400.");
    } else {
        console.error("✗ FAILED: Expected 400, got:", resEmpty.status);
        process.exit(1);
    }

    console.log("\n[TEST 6] Testing Missing Token on GET /api/chat/history...");
    const resHistNoToken = await request(app).get('/api/chat/history');
    if (resHistNoToken.status === 401) {
        console.log("✓ PASSED: Rejected unauthenticated history fetch with 401.");
    } else {
        console.error("✗ FAILED: Expected 401, got:", resHistNoToken.status);
        process.exit(1);
    }

    console.log("\n[TEST 7] Testing Missing Token on DELETE /api/chat/history...");
    const resDelNoToken = await request(app).delete('/api/chat/history');
    if (resDelNoToken.status === 401) {
        console.log("✓ PASSED: Rejected unauthenticated history delete with 401.");
    } else {
        console.error("✗ FAILED: Expected 401, got:", resDelNoToken.status);
        process.exit(1);
    }

    console.log("\n==========================================");
    console.log("ALL CHATBOT UNIT & ROUTE TESTS PASSED! ✓");
    console.log("==========================================");
    process.exit(0);
}

runChatTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
