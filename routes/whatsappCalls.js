/**
 * WhatsApp Call Routes
 */

const express = require('express');
const router = express.Router();
const auth = require('../utils/auth');
const Device = require('../models/Device');

// GET /api/calls/whatsapp
router.get('/whatsapp', auth, async (req, res) => {
    try {
        const device = await Device.findOne({ _id: req.deviceId, owner: req.user.id });
        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }
        res.json({
            selectedContacts: device.whatsappCallSettings?.selectedContacts || [],
            autoScreenRecord: device.whatsappCallSettings?.autoScreenRecord || false
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/calls/settings/whatsapp-call
router.post('/settings/whatsapp-call', auth, async (req, res) => {
    try {
        const { selected_contacts, auto_screen_record } = req.body;
        const device = await Device.findOneAndUpdate(
            { _id: req.deviceId, owner: req.user.id },
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
        res.json({ message: 'Settings saved', success: true, device });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
