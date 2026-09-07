const path = require('path');
require('dotenv').config({ path: 'c:/Users/HP/Downloads/INNERVOICE_updated/INNERVOICE_updated/INNERVOICE/backend/.env' });
const wellnessService = require('c:/Users/HP/Downloads/INNERVOICE_updated/INNERVOICE_updated/INNERVOICE/backend/services/wellnessAssistantService.js');

async function testDirect() {
    console.log("--- Testing generateAssistantResponse directly ---");
    
    const context = { name: "Harshada", streak: 5 };
    
    // 1. Test English
    console.log("\n1. Testing English:");
    const resEn = await wellnessService.generateAssistantResponse(context, "Hello, I am feeling stressed today.", "en");
    console.log("English Result:", resEn);
    
    // 2. Test Marathi
    console.log("\n2. Testing Marathi:");
    const resMr = await wellnessService.generateAssistantResponse(context, "आज मला खूप ताण जाणवत आहे.", "mr");
    console.log("Marathi Result:", resMr);
    
    // 3. Test Hindi
    console.log("\n3. Testing Hindi:");
    const resHi = await wellnessService.generateAssistantResponse(context, "आज मुझे बहुत तनाव महसूस हो रहा है।", "hi");
    console.log("Hindi Result:", resHi);
}

testDirect().catch(err => console.error("Error in direct test:", err));
