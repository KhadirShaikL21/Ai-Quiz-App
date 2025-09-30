const axios = require('axios');

async function testFeedbackAPI() {
    console.log('🧪 Testing AI Feedback API...');
    
    try {
        const response = await axios.post('http://localhost:5001/api/feedback', {
            quizTopic: "JavaScript Fundamentals",
            score: 8,
            total: 10
        });
        
        console.log('✅ API Response received!');
        console.log('📊 Response Status:', response.status);
        console.log('🤖 Feedback:', response.data.feedback);
        console.log('🔮 Is AI Generated:', response.data.isAIGenerated);
        console.log('🎯 Model Used:', response.data.model);
        console.log('⏰ Timestamp:', response.data.timestamp);
        
        if (response.data.isAIGenerated) {
            console.log('🎉 SUCCESS: Getting REAL AI feedback from Gemini!');
        } else {
            console.log('⚠️  FALLBACK: Using static fallback feedback');
            console.log('❌ Reason:', response.data.fallbackReason);
        }
        
    } catch (error) {
        console.error('❌ Error testing API:', error.message);
        if (error.response) {
            console.error('📋 Response data:', error.response.data);
        }
    }
}

testFeedbackAPI();