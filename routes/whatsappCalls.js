/**
 * WhatsApp Call Routes & Alerts
 */

const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const ActivityLog = require('../models/ActivityLog');

// GET /api/calls/whatsapp?device_id=xxx
// Child app isko call karke "selected contacts" sync karega
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
// Child app call start/end hone par alert bhejega
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

        // Agar status 'started' hai, toh Parent ko FCM bhejein (optional - backend pe Firebase logic chahiye)
        if (status === 'started') {
            console.log(`ALERT: WhatsApp ${mode} call started from ${contact} on device ${device_id}`);
            // Yahan Parent App ko Firebase FCM notification bhejne ka code likha ja sakta hai
        }

        res.json({ success: true, message: 'Call alert received' });
    } catch (error) {
        console.error('Call notify error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/calls/settings/whatsapp-call
// Parent App settings save karta hai (Future use)
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

        res.json({ message: 'Settings saved', success: true });
    } catch (error) {
        console.error('WhatsApp settings save error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
