/**
 * Usage Log model - App usage statistics
 */
const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, index: true },
    packageName: { type: String, required: true },
    appName: { type: String },
    usageMinutes: { type: Number, default: 0 },
    category: { type: String, enum: ['social', 'entertainment', 'communication', 'gaming', 'education', 'other'], default: 'other' },
    sessionStart: { type: Date },
    sessionEnd: { type: Date },
    timestamp: { type: Date, default: Date.now }
});

usageLogSchema.index({ deviceId: 1, timestamp: -1 });
usageLogSchema.index({ packageName: 1 });

module.exports = mongoose.model('UsageLog', usageLogSchema);
