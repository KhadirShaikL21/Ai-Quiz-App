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

        // Try multiple model names in case one isn't available
        const modelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro'];
        let model = null;
        let lastError = null;

        for (const modelName of modelNames) {
            try {
                model = genAI.getGenerativeModel({ model: modelName });
                
                // Test the model with a simple request
                const testResult = await model.generateContent('Test');
                console.log(`Successfully connected with model: ${modelName}`);
                break;
            } catch (error) {
                console.log(`Model ${modelName} failed:`, error.message);
                lastError = error;
                model = null;
            }
        }

        if (!model) {
            console.error("All AI models failed, providing fallback feedback");
            // Provide fallback feedback based on score percentage
            const percentage = Math.round((score / total) * 100);
            let feedbackText = "";
            
            if (percentage >= 90) {
                feedbackText = `Excellent work! You scored ${score} out of ${total} (${percentage}%) on the ${quizTopic} quiz. You have a strong understanding of the material. Keep up the great work and continue building on this solid foundation!`;
            } else if (percentage >= 70) {
                feedbackText = `Great job! You scored ${score} out of ${total} (${percentage}%) on the ${quizTopic} quiz. You're doing well and have a good grasp of most concepts. Review the areas where you missed questions to further strengthen your knowledge.`;
            } else if (percentage >= 50) {
                feedbackText = `Good effort! You scored ${score} out of ${total} (${percentage}%) on the ${quizTopic} quiz. You're on the right track but there's room for improvement. Focus on studying the topics you found challenging and try practicing more questions.`;
            } else {
                feedbackText = `Keep working hard! You scored ${score} out of ${total} (${percentage}%) on the ${quizTopic} quiz. Don't be discouraged - learning takes time and practice. Review the material thoroughly and consider additional study resources to strengthen your understanding.`;
            }
            
            return res.json({ feedback: feedbackText, isAIGenerated: false });
        }

        // Craft the prompt
        const prompt = `A user just completed a quiz on the topic "${quizTopic}".
        They scored ${score} out of ${total}.
        Provide one paragraph of friendly, encouraging, and constructive feedback for them.
        Keep the tone positive and motivating. Address the user directly as 'you'.`;

        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const feedbackText = response.text();

        res.json({ feedback: feedbackText, isAIGenerated: true });

    } catch (error) {
        console.error("Error generating AI feedback:", error);
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            status: error.status
        });
        
        // Provide fallback feedback if AI fails
        const { quizTopic, score, total } = req.body;
        if (score !== undefined && total !== undefined) {
            const percentage = Math.round((score / total) * 100);
            let fallbackFeedback = `You completed the ${quizTopic || 'quiz'} and scored ${score} out of ${total} (${percentage}%). `;
            
            if (percentage >= 70) {
                fallbackFeedback += "Great work! Keep practicing to maintain your excellent performance.";
            } else {
                fallbackFeedback += "Keep studying and practicing - you're making progress!";
            }
            
            return res.json({ 
                feedback: fallbackFeedback, 
                isAIGenerated: false,
                message: "AI service temporarily unavailable, providing basic feedback"
            });
        }
        
        res.status(500).json({ 
            message: "Failed to generate feedback.",
            error: error.message 
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