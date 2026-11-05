/**
 * Block Rule model - Apps to block/unblock
 */
const mongoose = require('mongoose');

const blockRuleSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    packageName: { type: String, required: true },
    appName: { type: String },
    isBlocked: { type: Boolean, default: true },
    reason: { type: String },
    updatedAt: { type: Date, default: Date.now }
});

blockRuleSchema.index({ deviceId: 1, packageName: 1 }, { unique: true });

module.exports = mongoose.model('BlockRule', blockRuleSchema);
