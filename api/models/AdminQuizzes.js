const mongoose = require('mongoose');

const adminQuizSchema = new mongoose.Schema({
    questionType: { type: String, required: true },
    questionText: { type: String, required: true },
    options: [{
        id: String,
        text: String,
        imageUrl: String
    }],
    correctOptionId: { type: String, required: true },
    xpValue: { type: Number, default: 10 },
    medicalSourceUrl: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminQuiz', adminQuizSchema);