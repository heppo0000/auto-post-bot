const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function checkModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("Checking alternative models...");

    // Candidates from the raw list we saw earlier
    const candidates = [
        "gemini-2.0-flash-lite-preview-02-05",
        "gemini-2.0-flash-lite",
        "gemini-pro-latest",
        "gemini-2.0-flash-exp"
    ];

    for (const modelName of candidates) {
        console.log(`Testing: ${modelName} ...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test");
            console.log(`SUCCESS! ${modelName} is working.`);
            console.log("Response:", result.response.text());
            return; // Stop at first success
        } catch (e) {
            console.log(`FAILED: ${modelName}`);
            console.log(`Error: ${e.message.split('Please check')[0]}`); // Shorten log
        }
    }
    console.log("All candidates failed.");
}

checkModels();
