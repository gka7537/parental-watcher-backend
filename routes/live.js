/**
 * Live Monitoring Routes
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../utils/auth');

// GET /api/live/status/:deviceId
router.get('/status/:deviceId', authMiddleware, async (req, res) => {
    try {
        res.json({
            device_id: req.params.deviceId,
            last_seen: new Date().toISOString(),
            status: 'online'
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/live/command/:deviceId
router.post('/command/:deviceId', authMiddleware, async (req, res) => {
    try {
        const { command_type, parameters } = req.body;
        const commandId = `cmd_${Date.now()}`;

        const ActivityLog = require('../models/ActivityLog');
        await ActivityLog.create({
            deviceId: req.params.deviceId,
            eventType: 'remote_command',
            description: `Command ${commandId}: ${command_type}`,
            metadata: { command_type, parameters, command_id: commandId }
        });

        const broadcastToDevice = req.app.get('broadcastToDevice');
        if (broadcastToDevice) {
            broadcastToDevice(req.params.deviceId, 'remote_command', {
                command_id: commandId,
                command_type,
                parameters,
                timestamp: new Date().toISOString()
            });
        }

        res.json({ command_id: commandId, message: 'Command sent to device' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
