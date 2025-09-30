// Simple Gemini Test
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function simpleTest() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Try different model names
        const models = ['gemini-1.5-flash', 'gemini-pro', 'gemini-1.5-pro'];
        
        for (const modelName of models) {
            try {
                console.log(`Testing model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                
                const result = await model.generateContent("Hello, how are you?");
                const response = await result.response;
                const text = response.text();
                
                console.log(`✅ ${modelName} works! Response:`, text.substring(0, 100));
                return modelName;
            } catch (error) {
                console.log(`❌ ${modelName} failed:`, error.message);
            }
        }
        
        console.log('❌ All models failed');
        return null;
        
    } catch (error) {
        console.error('Global error:', error);
        return null;
    }
}

simpleTest();