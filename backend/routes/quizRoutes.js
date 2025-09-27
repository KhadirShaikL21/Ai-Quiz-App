const express = require('express');
const router = express.Router();

// Import the new controller functions
const { 
    createQuiz, 
    getQuizzes, 
    getQuizById,
    submitQuiz
} = require('../controllers/quizController');


// Route to get all quizzes
router.get('/quizzes', getQuizzes);

// Route to create a new quiz
router.post('/quizzes', createQuiz);

// Route to get a single quiz by its ID
router.get('/quizzes/:id', getQuizById);

// Route to submit answers for a quiz
router.post('/quizzes/:id/submit', submitQuiz);

// We'll keep the test route for now
router.get('/test', (req, res) => {
    res.json({ message: 'Quiz routes are working!' });
});

module.exports = router;