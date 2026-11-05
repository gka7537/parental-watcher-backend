/**
 * Device Model - Child devices
 */

const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
    // Status
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
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
    // Contacts for WhatsApp call monitoring
    contacts: [{
        name: String,
        number: String,
        isSelected: { type: Boolean, default: false },
        lastCall: String,
        callCount: { type: Number, default: 0 }
    }],
    selectedWhatsAppContacts: [{
        type: String
    }],
    lastContactSync: Date,
    lastContactUpdate: Date,
    // WhatsApp call settings
    whatsappCallSettings: {
        enabled: { type: Boolean, default: false },
        selectedContacts: [{ type: String }],
        autoScreenRecord: { type: Boolean, default: true },
        recordAudio: { type: Boolean, default: true },
        updatedAt: Date
    },
    // Device admin policies
    deviceAdminPolicies: {
        lockDevice: { type: Boolean, default: true },
        wipeDevice: { type: Boolean, default: true },
        disableCamera: { type: Boolean, default: true },
        limitPassword: { type: Boolean, default: true }
    },
    // App blocking
    blockedApps: [{
        packageName: String,
        name: String,
        blockedAt: { type: Date, default: Date.now }
    }],
    // Time limits
    timeLimits: {
        dailyLimitMinutes: { type: Number, default: 120 },
        bedtimeStart: { type: String, default: '21:00' },
        bedtimeEnd: { type: String, default: '06:00' },
        dailyLimitEnabled: { type: Boolean, default: true },
        bedtimeEnabled: { type: Boolean, default: true }
    },
    // Recording settings
    recordingSettings: {
        videoQuality: { type: String, default: '540p' },
        videoWidth: { type: Number, default: 960 },
        videoHeight: { type: Number, default: 540 },
        fps: { type: Number, default: 25 },
        videoBitrate: { type: Number, default: 1500000 },
        audioBitrate: { type: Number, default: 96000 }
    },
    // Auto upload settings
    autoUpload: {
        enabled: { type: Boolean, default: true },
        deleteAfterUpload: { type: Boolean, default: true },
        uploadInterval: { type: Number, default: 300000 }
    },
    // Registration
    registeredAt: {
        type: Date,
        default: Date.now
    },
    // Last registration data
    lastRegistration: {
        device_name: String,
        device_type: String,
        os_version: String,
        device_model: String,
        brand: String
    }
}, {
    timestamps: true
});

// Indexes
DeviceSchema.index({ deviceId: 1 });
DeviceSchema.index({ owner: 1 });
DeviceSchema.index({ isOnline: 1 });

module.exports = mongoose.model('Device', DeviceSchema);
