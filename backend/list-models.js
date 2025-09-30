// List Available Gemini Models
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        console.log('🔍 Fetching available Gemini models...');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Try to list models (this might not work with all versions)
        try {
            const models = await genAI.listModels();
            console.log('📋 Available models:');
            models.forEach(model => {
                console.log(`- ${model.name}`);
            });
        } catch (error) {
            console.log('❌ Could not list models directly:', error.message);
        }
        
        // Try common model names one by one
        const commonModels = [
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro-latest', 
            'gemini-1.0-pro-latest',
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-1.0-pro',
            'gemini-pro',
            'gemini-pro-vision',
            'text-bison-001',
            'gemini-2.0-flash-exp',
            'gemini-exp-1121'
        ];
        
        console.log('\n🧪 Testing common model names...');
        
        for (const modelName of commonModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Test");
                const response = await result.response;
                const text = response.text();
                
                console.log(`✅ ${modelName} - WORKING! Sample: "${text.substring(0, 50)}..."`);
                
                // If we find a working model, use it for a quiz feedback test
                console.log(`\n🎯 Testing quiz feedback with ${modelName}...`);
                const feedbackResult = await model.generateContent("A student scored 8/10 on a JavaScript quiz. Provide encouraging feedback.");
                const feedbackResponse = await feedbackResult.response;
                const feedbackText = feedbackResponse.text();
                console.log(`💬 Sample feedback: "${feedbackText.substring(0, 100)}..."`);
                
                return modelName;
                
            } catch (error) {
                console.log(`❌ ${modelName} - Failed: ${error.message.substring(0, 80)}...`);
            }
        }
        
        console.log('\n❌ No working models found');
        return null;
        
    } catch (error) {
        console.error('🚨 Global error:', error);
        return null;
    }
}

listModels().then(workingModel => {
    if (workingModel) {
        console.log(`\n🎉 Use this model in your app: "${workingModel}"`);
    } else {
        console.log('\n⚠️ No working model found. Check your API key or try updating the @google/generative-ai package.');
    }
});