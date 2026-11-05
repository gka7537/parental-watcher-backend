/**
 * Contacts Routes
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../utils/auth');
const Device = require('../models/Device');

// GET /api/contacts/list?device_id=xxx
router.get('/list', authMiddleware, async (req, res) => {
    try {
        const device_id = req.query.device_id || req.body.device_id;
        if (!device_id) return res.status(400).json({ message: 'device_id is required' });

        const device = await Device.findOne({ deviceId: device_id, owner: req.user.id });
        if (!device) return res.status(404).json({ message: 'Device not found' });

        res.json(device.contacts || []);
    } catch (error) {
        console.error('Contacts list error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/contacts/save-selected
router.post('/save-selected', authMiddleware, async (req, res) => {
    try {
        const { device_id, contacts } = req.body;
        if (!device_id) return res.status(400).json({ message: 'device_id is required' });

        const device = await Device.findOneAndUpdate(
            { deviceId: device_id, owner: req.user.id },
            { $set: { selectedWhatsAppContacts: contacts || [], lastContactUpdate: Date.now() } },
            { new: true }
        );

        if (!device) return res.status(404).json({ message: 'Device not found' });

        res.json({ message: 'Contacts saved', success: true, count: contacts?.length || 0 });
    } catch (error) {
        console.error('Save-selected error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/contacts/sync
router.post('/sync', authMiddleware, async (req, res) => {
    try {
        const { device_id, contacts } = req.body;
        if (!device_id) return res.status(400).json({ message: 'device_id is required' });
        if (!Array.isArray(contacts)) return res.status(400).json({ message: 'Contacts must be an array' });

        const device = await Device.findOneAndUpdate(
            { deviceId: device_id, owner: req.user.id },
            { $set: { contacts, lastContactSync: Date.now() } },
            { new: true }
        );

        if (!device) return res.status(404).json({ message: 'Device not found' });

        res.json({ message: `Synced ${contacts.length} contacts`, success: true });
    } catch (error) {
        console.error('Contacts sync error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
