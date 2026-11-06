/**
 * Device Management Routes
 */
const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const ActivityLog = require('../models/ActivityLog');
const { authMiddleware } = require('../utils/auth');

// Register
router.post('/register', async (req, res) => {
    try {
        const { device_id, device_name, device_type } = req.body;
        if (!device_id) return res.status(400).json({ success: false, error: 'device_id is required' });

        let device = await Device.findOne({ deviceId: device_id });
        if (!device) {
            device = await Device.create({
                deviceId: device_id,
                deviceName: device_name || 'Child Device',
                deviceType: device_type || 'android',
                isOnline: true,
                isActive: true,
                autoRecord: false,
                uploadMode: "BOTH"
            });
        } else {
            device.isOnline = true;
            device.lastSeen = new Date();
            await device.save();
        }
        res.status(201).json({ success: true, message: 'Registered' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Claim
router.post('/claim', authMiddleware, async (req, res) => {
    try {
        const { device_id, device_name } = req.body; 
        if (!device_id) return res.status(400).json({ error: 'Pairing code is required' });

        const device = await Device.findOne({ deviceId: device_id });
        if (!device) return res.status(404).json({ error: 'Invalid Code' });
        if (device.owner && device.owner.toString() !== req.user.id) return res.status(400).json({ error: 'Device already claimed' });

        device.owner = req.user.id;
        if (device_name) device.deviceName = device_name;
        device.isActive = true;
        await device.save();
        res.json({ success: true, device });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Devices
router.get('/', authMiddleware, async (req, res) => {
    try {
        const devices = await Device.find({ owner: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, devices });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle Settings (Naya Updated Code)
router.post('/toggle', authMiddleware, async (req, res) => {
    try {
        const { device_id, is_active, autoRecord, uploadMode } = req.body;
        
        const updateData = {};
        if (is_active !== undefined) updateData.isActive = is_active;
        if (autoRecord !== undefined) updateData.autoRecord = autoRecord;
        if (uploadMode !== undefined) updateData.uploadMode = uploadMode;

        const device = await Device.findOneAndUpdate(
            { deviceId: device_id, owner: req.user.id },
            { $set: updateData },
            { new: true }
        );
        
        if (!device) return res.status(404).json({ error: 'Device not found' });
        res.json({ success: true, device });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Heartbeat (Child App isko call karega)
router.post('/heartbeat', async (req, res) => {
    try {
        const { device_id, fcm_token } = req.body;
        if (!device_id) return res.status(400).json({ success: false, error: 'device_id is required' });

        const device = await Device.findOne({ deviceId: device_id });
        if (device) {
            device.isOnline = true;
            device.lastSeen = new Date();
            if (fcm_token) device.fcmToken = fcm_token;
            await device.save();
            
            // Child App ko saari settings wapas bhejein
            res.json({ 
                success: true, 
                status: 'ok', 
                isActive: device.isActive,
                autoRecord: device.autoRecord,
                uploadMode: device.uploadMode
            });
        } else {
            res.status(404).json({ success: false, error: 'Device not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
