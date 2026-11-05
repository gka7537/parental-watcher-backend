/**
 * Parental Settings model - PIN and permissions
 */
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    pinCode: { type: String, default: '1234' },
    requirePinForSettings: { type: Boolean, default: true },
    allowAppUninstall: { type: Boolean, default: false },
    allowAppInstall: { type: Boolean, default: true },
    remoteLockEnabled: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', settingsSchema);
