const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    iconType: { type: String, default: 'Trophy' }, // Nome do ícone (ex: 'Medal', 'Star')
    requirementType: {
        type: String,
        enum: ['points', 'scans', 'streak'], // Já suporta 'streak' corretamente
        required: true
    },
    requirementValue: { type: Number, required: true },

    xpReward: {
        type: Number,
        default: 0
    },
    pointsReward: {
        type: Number,
        default: 0
    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Badge', BadgeSchema);
