const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    dob: Date,
    skinHistory: String, // 'yes' ou 'no'
    lastScanDate: Date
});

module.exports = mongoose.model('User', UserSchema);