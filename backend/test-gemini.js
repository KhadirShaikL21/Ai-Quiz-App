// Test script for Gemini AI API
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiAPI() {
    try {
        console.log('🧪 Testing Gemini AI API Connection...');
        console.log('📋 API Key:', process.env.GEMINI_API_KEY ? 'Set ✅' : 'Missing ❌');
        
        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ GEMINI_API_KEY not found in environment variables');
            return;
        }

        // Initialize the AI client
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Get the model
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        console.log('🤖 Attempting to connect to Gemini 2.5 Flash...');
        
        // Test with a simple prompt
        const result = await model.generateContent({
            contents: [{
                parts: [{
                    text: "Explain how AI works in a few words"
                }]
            }]
        });

        const response = result.response;
        const text = response.text();
        
        console.log('✅ Success! Gemini AI is working correctly');
        console.log('🤖 AI Response:', text);
        console.log('📊 Response Length:', text.length, 'characters');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error testing Gemini AI:', error.message);
        console.error('📋 Error Details:', {
            status: error.status,
            message: error.message,
            code: error.code
        });
        return false;
    }
}

// Test quiz feedback scenario
async function testQuizFeedback() {
    try {
        console.log('\n🎯 Testing Quiz Feedback Generation...');
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const quizTopic = "JavaScript Fundamentals";
        const score = 7;
        const total = 10;
        const percentage = Math.round((score / total) * 100);
        
        const prompt = `You are an encouraging and knowledgeable tutor. A student just completed a quiz on "${quizTopic}" and scored ${score} out of ${total} questions correctly (${percentage}%).

Please provide personalized feedback that:
1. Acknowledges their performance with appropriate encouragement
2. Gives specific advice based on their score level
3. Suggests next steps for improvement or further learning
4. Maintains a positive, motivating tone
5. Keeps the response to 2-3 sentences maximum

Make it personal by addressing them directly as "you" and be specific about the ${quizTopic} topic.`;

        const result = await model.generateContent({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        });

        const response = result.response;
        const feedback = response.text();
        
        console.log('✅ Quiz Feedback Generated Successfully!');
        console.log('📊 Quiz Topic:', quizTopic);
        console.log('🎯 Score:', `${score}/${total} (${percentage}%)`);
        console.log('💬 AI Feedback:', feedback);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error generating quiz feedback:', error.message);
        return false;
    }
}

// Run tests
async function runAllTests() {
    console.log('🚀 Starting Gemini AI Tests...\n');
    
    const basicTest = await testGeminiAPI();
    const feedbackTest = await testQuizFeedback();
    
    console.log('\n📊 Test Results:');
    console.log('✔️ Basic API Test:', basicTest ? 'PASSED' : 'FAILED');
    console.log('✔️ Quiz Feedback Test:', feedbackTest ? 'PASSED' : 'FAILED');
    
    if (basicTest && feedbackTest) {
        console.log('\n🎉 All tests passed! Gemini AI is ready to use in your quiz app!');
    } else {
        console.log('\n⚠️ Some tests failed. Check the error messages above.');
    }
}

// Execute tests
runAllTests().catch(console.error);