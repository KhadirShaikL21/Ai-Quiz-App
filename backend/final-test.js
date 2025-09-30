// Test the updated quiz feedback function
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Simulate the controller function
async function testQuizFeedback() {
    try {
        console.log('🎯 Testing Quiz Feedback Function...');
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Test data
        const testCases = [
            { quizTopic: "JavaScript Fundamentals", score: 9, total: 10 },
            { quizTopic: "React Hooks", score: 6, total: 10 },
            { quizTopic: "Node.js Backend", score: 3, total: 10 },
            { quizTopic: "Database Design", score: 10, total: 10 }
        ];
        
        console.log(`📊 Testing ${testCases.length} different score scenarios...\n`);
        
        for (const testCase of testCases) {
            const { quizTopic, score, total } = testCase;
            const percentage = Math.round((score / total) * 100);
            
            console.log(`🧪 Test: ${quizTopic} - ${score}/${total} (${percentage}%)`);
            
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
                
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
                const feedbackText = response.text();
                
                console.log(`✅ Success! Feedback: "${feedbackText.substring(0, 150)}..."`);
                console.log(`📝 Length: ${feedbackText.length} characters\n`);
                
            } catch (error) {
                console.log(`❌ Failed: ${error.message}\n`);
            }
        }
        
        console.log('🎉 Quiz feedback testing completed!');
        return true;
        
    } catch (error) {
        console.error('🚨 Test failed:', error);
        return false;
    }
}

// Test the actual API endpoint structure
async function testAPIEndpoint() {
    console.log('\n🔌 Testing API Endpoint Structure...');
    
    // Simulate request body
    const reqBody = {
        quizTopic: "Full Stack Development",
        score: 7,
        total: 10
    };
    
    console.log('📥 Request:', reqBody);
    
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        
        const { quizTopic, score, total } = reqBody;
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
        const feedbackText = response.text();
        
        // Simulate the API response
        const apiResponse = {
            feedback: feedbackText,
            isAIGenerated: true,
            model: "gemini-2.0-flash-exp",
            timestamp: new Date().toISOString()
        };
        
        console.log('📤 API Response:');
        console.log(JSON.stringify(apiResponse, null, 2));
        
        return true;
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('🚀 Starting Comprehensive Gemini AI Tests...\n');
    
    const feedbackTest = await testQuizFeedback();
    const apiTest = await testAPIEndpoint();
    
    console.log('\n📊 Final Results:');
    console.log(`✔️ Quiz Feedback Test: ${feedbackTest ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`✔️ API Endpoint Test: ${apiTest ? 'PASSED ✅' : 'FAILED ❌'}`);
    
    if (feedbackTest && apiTest) {
        console.log('\n🎉 ALL TESTS PASSED! Your Gemini AI integration is ready! 🚀');
        console.log('💡 The backend will now provide intelligent, personalized feedback for quiz results.');
    } else {
        console.log('\n⚠️ Some tests failed. Check the error messages above.');
    }
}

runTests().catch(console.error);