/**
 * Time Limit model - Daily screen time limits
 */
const mongoose = require('mongoose');

const timeLimitSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    dailyLimitMinutes: { type: Number, default: 120 },
    startTime: { type: String, default: '21:00' },
    endTime: { type: String, default: '07:00' },
    isEnabled: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TimeLimit', timeLimitSchema);
