/**
 * Device Management Routes
 */

const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const ActivityLog = require('../models/ActivityLog');
const { authMiddleware } = require('../utils/auth');

// POST /api/devices/register
// Child App isko call karega bina token ke
router.post('/register', async (req, res) => {
    try {
        const { device_id, device_name, device_type, os_version, device_model, brand } = req.body;

        if (!device_id) {
            return res.status(400).json({ success: false, error: 'device_id is required' });
        }

        let device = await Device.findOne({ deviceId: device_id });

        if (!device) {
            device = await Device.create({
                deviceId: device_id,
                deviceName: device_name || 'Child Device',
                deviceType: device_type || 'android',
                osVersion: os_version,
                deviceModel: device_model,
                brand: brand,
                isOnline: true,
                lastRegistration: { device_name, device_type, os_version, device_model, brand }
            });
            console.log(`New device registered: ${device_id}`);
        } else {
            device.isOnline = true;
            device.lastSeen = new Date();
            await device.save();
        }

        res.status(201).json({
            success: true,
            device_id: device.deviceId,
            message: 'Device registered successfully'
        });
    } catch (error) {
        console.error('Register device error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/devices/claim
// Parent App isko call karega jab wo Device ID daal kar device add karega
router.post('/claim', authMiddleware, async (req, res) => {
    try {
        const { device_id } = req.body;
        if (!device_id) return res.status(400).json({ error: 'device_id is required' });

        const device = await Device.findOne({ deviceId: device_id });
        if (!device) return res.status(404).json({ error: 'Device not found' });

        // Agar device pehle se kisi aur parent ke paas hai
        if (device.owner && device.owner.toString() !== req.user.id) {
            return res.status(400).json({ error: 'Device already claimed by another parent' });
        }

        // Device ko is parent ke naam kar dein
        device.owner = req.user.id;
        device.deviceName = req.body.device_name || device.deviceName;
        await device.save();

        await ActivityLog.create({
            deviceId: device_id,
            eventType: 'device_registered',
            description: `Device claimed by parent`,
            userId: req.user.id
        });

        res.json({ success: true, message: 'Device added successfully', device });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// GET /api/devices
// Parent App apne saare devices dekhne ke liye
router.get('/', authMiddleware, async (req, res) => {
    try {
        const devices = await Device.find({ owner: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, devices });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/devices/heartbeat
// Child App isko call karega (FCM Token save karne ke liye)
router.post('/heartbeat', async (req, res) => {
    try {
        const { device_id, fcm_token } = req.body;
        if (!device_id) {
            return res.status(400).json({ success: false, error: 'device_id is required' });
        }

        const updateData = { 
            isOnline: true, 
            lastSeen: new Date(), 
            lastActivity: new Date() 
        };

        if (fcm_token) {
            updateData.fcmToken = fcm_token;
        }

        await Device.findOneAndUpdate({ deviceId: device_id }, updateData);

        res.json({ success: true, status: 'ok', last_sync: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
