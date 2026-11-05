/**
 * Scheduled Recording model - Auto recording schedules
 */
const mongoose = require('mongoose');

const scheduledRecordSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    action: { type: String, required: true, enum: ['VIDEO', 'SCREEN', 'AUDIO'] },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    clipLength: { type: String, default: '1 Minute' },
    cameraFacing: { type: String, enum: ['front', 'back'], default: 'back' },
    repeatDays: { type: [Number], default: [0,1,2,3,4,5,6] },
    uploadOption: { type: String, enum: ['wifi', 'data', 'both'], default: 'both' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

scheduledRecordSchema.index({ deviceId: 1, isActive: 1 });

module.exports = mongoose.model('ScheduledRecord', scheduledRecordSchema);
