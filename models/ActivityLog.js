/**
 * Activity Log model
 */
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    eventType: {
        type: String,
        required: true,
        enum: [
            'block',
            'override',
            'pin_attempt',
            'time_limit_reached',
            'remote_command',
            'device_registered',
            'settings_updated',
            'file_uploaded',
            'block_rule_updated'
        ]
    },
    description: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
});

activityLogSchema.index({ deviceId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
