/**
 * WhatsApp Call Routes & Alerts
 * Handles settings sync, call alerts, and history for Parent App
 */

const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const ActivityLog = require('../models/ActivityLog');

// ==========================================
// 1. CHILD APP ROUTES (Bina Auth Token ke chalte hain)
// ==========================================

// GET /api/calls/whatsapp?device_id=xxx
// Child app isko call karke "selected contacts" aur settings sync karti hai
router.get('/whatsapp', async (req, res) => {
    try {
        const device_id = req.query.device_id || req.body.device_id;
        if (!device_id) return res.status(400).json({ message: 'device_id is required' });

        const device = await Device.findOne({ deviceId: device_id });
        if (!device) return res.status(404).json({ message: 'Device not found' });

        // Sirf selected contacts aur settings return karein
        res.json({
            selectedContacts: device.whatsappCallSettings?.selectedContacts || [],
            autoScreenRecord: device.whatsappCallSettings?.autoScreenRecord || false
        });
    } catch (error) {
        console.error('WhatsApp call fetch error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/calls/notify
// Child app call start/end hone par turant alert bhejega
router.post('/notify', async (req, res) => {
    try {
        const { device_id, contact, type, mode, status } = req.body;
        
        if (!device_id || !contact) {
            return res.status(400).json({ message: 'device_id and contact are required' });
        }

        // Activity log mein save karein (taaki parent app history dekh sake)
        await ActivityLog.create({
            deviceId: device_id,
            eventType: 'remote_command',
            description: `WhatsApp ${mode} recording ${status} for ${contact}`,
            metadata: { contact, type, mode, status }
        });

        // Agar status 'started' hai, toh Parent ko FCM alert bhejein
        if (status === 'started') {
            console.log(`ALERT: WhatsApp ${mode} call started from ${contact} on device ${device_id}`);
            
            // NOTE: Yahan Parent App ko Firebase FCM notification bhejne ka code aayega
            // Example:
            // const admin = require('firebase-admin');
            // admin.messaging().send({ ... });
        }

        res.json({ success: true, message: 'Call alert received and logged' });
    } catch (error) {
        console.error('Call notify error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==========================================
// 2. PARENT APP ROUTES (History dekhne ke liye)
// ==========================================

// GET /api/calls/history?device_id=xxx
// Parent App call history fetch karne ke liye isko use karta hai
router.get('/history', async (req, res) => {
    try {
        const device_id = req.query.device_id;
        if (!device_id) return res.status(400).json({ message: 'device_id is required' });

        // Sirf latest 50 logs fetch karein
        const logs = await ActivityLog.find({ 
            deviceId: device_id, 
            eventType: 'remote_command' 
        }).sort({ createdAt: -1 }).limit(50); 

        res.json(logs);
    } catch (error) {
        console.error('History fetch error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/calls/settings/whatsapp-call
// Parent App settings save karta hai (Kiski screen record karni hai)
router.post('/settings/whatsapp-call', async (req, res) => {
    try {
        const { device_id, selected_contacts, auto_screen_record } = req.body;
        if (!device_id) return res.status(400).json({ message: 'device_id is required' });

        const device = await Device.findOneAndUpdate(
            { deviceId: device_id },
            {
                $set: {
                    whatsappCallSettings: {
                        selectedContacts: selected_contacts || [],
                        autoScreenRecord: auto_screen_record || false,
                        updatedAt: Date.now()
                    }
                }
            },
            { new: true }
        );

        if (!device) return res.status(404).json({ message: 'Device not found' });

        res.json({ message: 'WhatsApp call settings saved successfully', success: true });
    } catch (error) {
        console.error('WhatsApp settings save error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
