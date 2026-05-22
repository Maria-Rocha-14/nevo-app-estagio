const mongoose = require('mongoose');

const ScanSettingSchema = new mongoose.Schema({
    minAge: Number,
    maxAge: Number,
    intervalWeeksDefault: Number,
    intervalWeeksHighRisk: Number
});

module.exports = mongoose.model('ScanSetting', ScanSettingSchema);