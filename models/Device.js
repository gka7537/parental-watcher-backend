/**
 * Device Model - Child devices
 */

const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Child app bina owner ke register hoga
    },
    deviceName: {
        type: String,
        default: 'Android Device'
    },
    deviceType: {
        type: String,
        default: 'android'
    },
    deviceId: {
        type: String,
        required: true,
        unique: true
    },
    // Device info
    osVersion: String,
    deviceModel: String,
    brand: String,
    fcmToken: String,
    
    // Status
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Naye Features (Parent App Control)
    autoRecord: {
        type: Boolean,
        default: false
    },
    uploadMode: {
        type: String,
        enum: ['WIFI', 'DATA', 'BOTH', 'NONE'],
        default: 'BOTH'
    },

    // Permissions status
    permissions: {
        batteryOptimization: { type: Boolean, default: false },
        deviceAdmin: { type: Boolean, default: false },
        accessibility: { type: Boolean, default: false },
        usageAccess: { type: Boolean, default: false },
        overlayPermission: { type: Boolean, default: false },
        location: { type: Boolean, default: false }
    },
    
    // WhatsApp Call Settings
    whatsappCallSettings: {
        enabled: { type: Boolean, default: false },
        selectedContacts: [{ type: String }],
        autoScreenRecord: { type: Boolean, default: true },
        recordAudio: { type: Boolean, default: true },
        updatedAt: Date
    },
    
    // App blocking & Time limits
    blockedApps: [{
        packageName: String,
        name: String,
        blockedAt: { type: Date, default: Date.now }
    }],
    timeLimits: {
        dailyLimitMinutes: { type: Number, default: 120 },
        bedtimeStart: { type: String, default: '21:00' },
        bedtimeEnd: { type: String, default: '06:00' },
        dailyLimitEnabled: { type: Boolean, default: true },
        bedtimeEnabled: { type: Boolean, default: true }
    },
    
    // Registration data
    registeredAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

DeviceSchema.index({ deviceId: 1 });
DeviceSchema.index({ owner: 1 });

module.exports = mongoose.model('Device', DeviceSchema);
