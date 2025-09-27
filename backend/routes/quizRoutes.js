const express = require('express');
const router = express.Router();

// We will import controller functions here later
// const { getAIFeedback } = require('../controllers/quizController');

// A simple test route to make sure everything is connected
router.get('/test', (req, res) => {
    res.json({ message: 'Quiz routes are working!' });
});

// We will add more routes like this one later
// router.post('/feedback', getAIFeedback);

module.exports = router;