const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    iconType: { type: String, default: 'trophy' }, // Nome do ícone (ex: 'medal', 'star')
    requirementType: {
        type: String,
        enum: ['points', 'scans', 'streak'],
        required: true
    },
    requirementValue: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Badge', BadgeSchema);