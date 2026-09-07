const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

console.log("GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
console.log("AI_API_KEY present:", !!process.env.AI_API_KEY);
console.log("OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);
if (process.env.GEMINI_API_KEY) {
    console.log("GEMINI_API_KEY length:", process.env.GEMINI_API_KEY.length);
    console.log("GEMINI_API_KEY prefix:", process.env.GEMINI_API_KEY.substring(0, 6));
}
