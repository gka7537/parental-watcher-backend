/**
 * WhatsApp Call Routes
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../utils/auth');
const Device = require('../models/Device');

// GET /api/calls/whatsapp?device_id=xxx
router.get('/whatsapp', authMiddleware, async (req, res) => {
    try {
        const device_id = req.query.device_id || req.body.device_id;
        if (!device_id) return res.status(400).json({ message: 'device_id is required' });

        const device = await Device.findOne({ deviceId: device_id, owner: req.user.id });
        if (!device) return res.status(404).json({ message: 'Device not found' });

        res.json({
            selectedContacts: device.whatsappCallSettings?.selectedContacts || [],
            autoScreenRecord: device.whatsappCallSettings?.autoScreenRecord || false
        });
    } catch (error) {
        console.error('WhatsApp call fetch error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/calls/settings/whatsapp-call
router.post('/settings/whatsapp-call', authMiddleware, async (req, res) => {
    try {
        const { device_id, selected_contacts, auto_screen_record } = req.body;
        if (!device_id) return res.status(400).json({ message: 'device_id is required' });

        const device = await Device.findOneAndUpdate(
            { deviceId: device_id, owner: req.user.id },
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

        res.json({ message: 'Settings saved', success: true, device });
    } catch (error) {
        console.error('WhatsApp settings save error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
