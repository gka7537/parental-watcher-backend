/**
 * Device Management Routes
 */

const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const ActivityLog = require('../models/ActivityLog');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../utils/auth');

// POST /api/devices/register
router.post('/register', authMiddleware, async (req, res) => {
    try {
        const { device_name, device_type, os_version, device_model, brand } = req.body;

        if (!device_name) {
            return res.status(400).json({ success: false, error: 'Device name is required' });
        }

        const deviceId = uuidv4();
        const device = await Device.create({
            deviceId,
            deviceName: device_name,
            owner: req.user.id,
            deviceType: device_type || 'android',
            osVersion: os_version,
            deviceModel: device_model,
            brand: brand,
            lastRegistration: { device_name, device_type: device_type || 'android', os_version, device_model, brand }
        });

        await ActivityLog.create({
            deviceId,
            eventType: 'device_registered',
            description: `Device "${device_name}" registered`,
            userId: req.user.id
        });

        res.status(201).json({
            success: true,
            device_id: device.deviceId,
            device_name: device.deviceName,
            device_type: device.deviceType,
            message: 'Device registered successfully'
        });
    } catch (error) {
        console.error('Register device error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET /api/devices
router.get('/', authMiddleware, async (req, res) => {
    try {
        const devices = await Device.find({ owner: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, devices });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// GET /api/devices/:deviceId
router.get('/:deviceId', authMiddleware, async (req, res) => {
    try {
        const device = await Device.findOne({ deviceId: req.params.deviceId, owner: req.user.id });
        if (!device) {
            return res.status(404).json({ success: false, error: 'Device not found' });
        }
        res.json({ success: true, device });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/devices/heartbeat
router.post('/heartbeat', async (req, res) => {
    try {
        const { device_id } = req.body;
        if (!device_id) {
            return res.status(400).json({ success: false, error: 'device_id is required' });
        }

        await Device.findOneAndUpdate(
            { deviceId: device_id },
            { isOnline: true, lastSeen: new Date(), lastActivity: new Date() }
        );

        res.json({ success: true, status: 'ok', last_sync: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
