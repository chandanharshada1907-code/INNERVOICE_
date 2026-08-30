const wellnessAssistantService = require('./services/wellnessAssistantService');

async function runTest() {
    console.log("=== Testing Wellness Assistant ===");
    
    // Simulate a user ID (you must have a user with ID 1 in your local DB for this to pull real data)
    // If not, it will just use default/empty context
    const testUserId = 1;

    console.log(`\nBuilding context for user ID: ${testUserId}`);
    const context = await wellnessAssistantService.buildWellnessContext(testUserId);
    console.log("Context Data:");
    console.log(JSON.stringify(context, null, 2));

    console.log("\n--- Testing Daily Message ---");
    const dailyMsg = wellnessAssistantService.generateDailyMessage(context);
    console.log("Output:");
    console.log(dailyMsg);

    console.log("\n--- Testing Assistant Responses ---");
    const testPrompts = [
        "How am I doing this week?",
        "I feel really sad and tired today.",
        "Give me motivation to keep going.",
        "I want to die."
    ];

    for (const prompt of testPrompts) {
        console.log(`\nUser: "${prompt}"`);
        const res = await wellnessAssistantService.generateAssistantResponse(context, prompt);
        console.log(`AI:   ${typeof res === 'object' ? res.reply : res}`);
    }

    console.log("\n=== Test Complete ===");
    process.exit(0);
}

runTest().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
