const Quiz = require('../models/Quiz');

// @desc    Create a new quiz
// @route   POST /api/quizzes
// @access  Public
const createQuiz = async (req, res) => {
    try {
        // Get the title and questions from the request body
        const { title, questions } = req.body;

        // Create a new quiz instance using our model
        const quiz = new Quiz({
            title,
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


// @desc    Get all quizzes (only titles and IDs)
// @route   GET /api/quizzes
// @access  Public
const getQuizzes = async (req, res) => {
    try {
        // Find all quizzes but only return their title field
        const quizzes = await Quiz.find({}).select('title');
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





module.exports = {
    createQuiz,
    getQuizzes,
    getQuizById,
    submitQuiz
};