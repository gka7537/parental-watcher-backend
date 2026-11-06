/**
 * Device Management Routes (Pairing Code System)
 */

const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const ActivityLog = require('../models/ActivityLog');
const { authMiddleware } = require('../utils/auth');

// POST /api/devices/register
// Child App isko call karega 6-digit code generate hone ke baad
router.post('/register', async (req, res) => {
    try {
        const { device_id, device_name, device_type } = req.body;

        if (!device_id) {
            return res.status(400).json({ success: false, error: 'device_id (pairing code) is required' });
        }

        // Check karein ki ye code pehle se hai ya nahi
        let device = await Device.findOne({ deviceId: device_id });

        if (!device) {
            // Agar naya code hai, toh nayi entry banayein (Bina owner ke)
            device = await Device.create({
                deviceId: device_id, // Yahan 6-digit code save hoga
                deviceName: device_name || 'Child Device',
                deviceType: device_type || 'android',
                isOnline: true
            });
            console.log(`New Device Registered with Code: ${device_id}`);
        } else {
            // Agar code pehle se hai toh update karein
            device.isOnline = true;
            device.lastSeen = new Date();
            await device.save();
        }

        res.status(201).json({
            success: true,
            message: 'Device registered successfully'
        });
    } catch (error) {
        console.error('Register error:', error.message);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/devices/claim
// Parent App isko call karega jab wo 6-digit code daal kar device add karega
router.post('/claim', authMiddleware, async (req, res) => {
    try {
        const { device_id, device_name } = req.body; // device_id yahan 6-digit code hoga
        if (!device_id) return res.status(400).json({ error: 'Pairing code is required' });

        const device = await Device.findOne({ deviceId: device_id });
        
        // Agar child app ne code generate nahi kiya hai toh error dein
        if (!device) {
            return res.status(404).json({ error: 'Invalid or expired Pairing Code. Ask child to open app.' });
        }

        // Agar device pehle se kisi aur parent ke paas hai
        if (device.owner && device.owner.toString() !== req.user.id) {
            return res.status(400).json({ error: 'Device already claimed by another parent' });
        }

        // Device ko is parent ke naam kar dein
        device.owner = req.user.id;
        if (device_name) {
            device.deviceName = device_name;
        }
        await device.save();

        await ActivityLog.create({
            deviceId: device_id,
            eventType: 'device_registered',
            description: `Device claimed via Pairing Code`,
            userId: req.user.id
        });

        res.json({ success: true, message: 'Device connected successfully!', device });
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

        res.json({ success: true, status: 'ok' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
