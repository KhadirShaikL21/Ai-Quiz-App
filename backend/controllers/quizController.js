const Quiz = require('../models/Quiz');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Create a new quiz
// @route   POST /api/quizzes
// @access  Public
const createQuiz = async (req, res) => {
    try {
        // Get the quiz data from the request body
        const { title, description, difficulty, timeLimit, category, questions } = req.body;

        // Validate required fields
        if (!title || !questions || questions.length === 0) {
            return res.status(400).json({ message: 'Title and at least one question are required' });
        }

        // Create a new quiz instance using our model
        const quiz = new Quiz({
            title,
            description: description || '',
            difficulty: difficulty || 'Medium',
            timeLimit: timeLimit || 300, // Default 5 minutes
            category: category || 'General',
            questions,
        });

        // Save the new quiz to the database
        const createdQuiz = await quiz.save();

        // Respond with a 201 (Created) status and the new quiz data
        res.status(201).json(createdQuiz);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error: Could not create quiz' });
    }
};


// @desc    Get all quizzes (titles, descriptions, and metadata)
// @route   GET /api/quizzes
// @access  Public
const getQuizzes = async (req, res) => {
    try {
        // Find all quizzes but only return metadata (no questions)
        const quizzes = await Quiz.find({}).select('title description difficulty timeLimit category createdAt');
        res.json(quizzes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get a single quiz by its ID
// @route   GET /api/quizzes/:id
// @access  Public
const getQuizById = async (req, res) => {
    try {
        // Find the quiz by the ID in the URL
        const quiz = await Quiz.findById(req.params.id)
            // IMPORTANT: Exclude the correct answers from being sent to the client
            .select('-questions.correctAnswer');

        if (quiz) {
            res.json(quiz);
        } else {
            res.status(404).json({ message: 'Quiz not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};





// @desc    Submit answers for a quiz and get the score
// @route   POST /api/quizzes/:id/submit
// @access  Public
const submitQuiz = async (req, res) => {
    try {
        // First, find the quiz in the database using the ID from the URL
        // This time, we DO want the correct answers to compare against
        const quiz = await Quiz.findById(req.params.id);

        // If the quiz doesn't exist, send a 404 error
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Get the user's answers from the request body
        const userAnswers = req.body.answers; // e.g., { "questionId1": "A", "questionId2": "C" }

        let score = 0;
        // Loop through each question in the quiz from our database
        quiz.questions.forEach(question => {
            // The question._id is an object, so we convert it to a string for comparison
            const questionId = question._id.toString();

            // Check if the user's answer for this question matches the correct answer
            if (userAnswers[questionId] === question.correctAnswer) {
                score++; // Increment score if the answer is correct
            }
        });

        // Send back the final score and the total number of questions
        res.json({
            score,
            total: quiz.questions.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};




// @desc    Get AI-powered feedback for a quiz result
// @route   POST /api/feedback
// @access  Public
const getAIFeedback = async (req, res) => {
    try {
        const { quizTopic, score, total } = req.body;

        // Validate input
        if (!quizTopic || score === undefined || total === undefined) {
            return res.status(400).json({ 
                message: 'Missing required fields: quizTopic, score, total' 
            });
        }

        // Validate GEMINI_API_KEY
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ 
                message: 'GEMINI_API_KEY not configured' 
            });
        }

        console.log('Attempting to generate AI feedback using Gemini 2.5 Flash...');

        try {
            // Use the working Gemini model
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            
            // Calculate percentage for better context
            const percentage = Math.round((score / total) * 100);
            
            // Craft a detailed prompt for better feedback
            const prompt = `You are an encouraging and knowledgeable tutor. A student just completed a quiz on "${quizTopic}" and scored ${score} out of ${total} questions correctly (${percentage}%).

Please provide personalized feedback that:
1. Acknowledges their performance with appropriate encouragement
2. Gives specific advice based on their score level
3. Suggests next steps for improvement or further learning
4. Maintains a positive, motivating tone
5. Keeps the response to 2-3 sentences maximum

Make it personal by addressing them directly as "you" and be specific about the ${quizTopic} topic.`;

            console.log('Sending request to Gemini AI...');
            
            // Generate content using the latest API structure
            const result = await model.generateContent({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            });

            const response = result.response;
            const feedbackText = response.text();

            console.log('AI feedback generated successfully');

            res.json({ 
                feedback: feedbackText, 
                isAIGenerated: true,
                model: "gemini-2.0-flash-exp",
                timestamp: new Date().toISOString()
            });

        } catch (aiError) {
            console.error("Gemini AI Error:", aiError);
            
            // Provide enhanced fallback feedback
            const percentage = Math.round((score / total) * 100);
            let feedbackText = "";
            
            if (percentage >= 90) {
                feedbackText = `Outstanding work! You scored ${score}/${total} (${percentage}%) on the ${quizTopic} quiz. You have mastered this topic and should feel confident in your knowledge. Consider exploring advanced topics or helping others learn!`;
            } else if (percentage >= 80) {
                feedbackText = `Excellent job! You scored ${score}/${total} (${percentage}%) on the ${quizTopic} quiz. You have a strong grasp of the material with just a few areas to fine-tune. Review the questions you missed to achieve perfection!`;
            } else if (percentage >= 70) {
                feedbackText = `Great effort! You scored ${score}/${total} (${percentage}%) on the ${quizTopic} quiz. You understand most concepts well. Focus on reviewing the specific areas where you missed questions to boost your confidence.`;
            } else if (percentage >= 60) {
                feedbackText = `Good progress! You scored ${score}/${total} (${percentage}%) on the ${quizTopic} quiz. You're building a solid foundation. Spend more time on the challenging topics and take practice quizzes to improve your understanding.`;
            } else if (percentage >= 50) {
                feedbackText = `Keep learning! You scored ${score}/${total} (${percentage}%) on the ${quizTopic} quiz. You're on the right path but need more practice. Break down the topics into smaller parts and focus on understanding the fundamentals.`;
            } else {
                feedbackText = `Don't give up! You scored ${score}/${total} (${percentage}%) on the ${quizTopic} quiz. Learning is a journey and every expert was once a beginner. Review the material thoroughly, seek additional resources, and practice regularly - you've got this!`;
            }
            
            return res.json({ 
                feedback: feedbackText, 
                isAIGenerated: false,
                fallbackReason: aiError.message,
                model: "fallback-system",
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error("Error in getAIFeedback:", error);
        
        res.status(500).json({ 
            message: "Failed to generate feedback",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// @desc    Delete a quiz
// @route   DELETE /api/quizzes/:id
// @access  Public
const deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        await Quiz.findByIdAndDelete(req.params.id);
        res.json({ message: 'Quiz deleted successfully' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error: Could not delete quiz' });
    }
};

// @desc    Update a quiz
// @route   PUT /api/quizzes/:id
// @access  Public
const updateQuiz = async (req, res) => {
    try {
        const { title, description, difficulty, timeLimit, category, questions } = req.body;
        
        const quiz = await Quiz.findById(req.params.id);
        
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        // Update quiz fields
        quiz.title = title || quiz.title;
        quiz.description = description !== undefined ? description : quiz.description;
        quiz.difficulty = difficulty || quiz.difficulty;
        quiz.timeLimit = timeLimit || quiz.timeLimit;
        quiz.category = category || quiz.category;
        quiz.questions = questions || quiz.questions;
        quiz.updatedAt = new Date();
        
        const updatedQuiz = await quiz.save();
        res.json(updatedQuiz);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error: Could not update quiz' });
    }
};


module.exports = {
    createQuiz,
    getQuizzes,
    getQuizById,
    submitQuiz,
    getAIFeedback,
    deleteQuiz,
    updateQuiz
};