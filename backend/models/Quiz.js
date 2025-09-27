const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true }
});

const QuizSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    timeLimit: { type: Number, default: 300 }, // Time in seconds (5 minutes default)
    category: { type: String, default: 'General' },
    questions: [QuestionSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', QuizSchema);