/**
 * Contacts Routes
 */

const express = require('express');
const router = express.Router();
const auth = require('../utils/auth');
const Device = require('../models/Device');

// GET /api/contacts/list
router.get('/list', auth, async (req, res) => {
    try {
        const device = await Device.findOne({ _id: req.deviceId, owner: req.user.id });
        if (!device) {
            return res.status(404).json({ message: 'Device not found' });
        }
        const contacts = device.contacts || [];
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/contacts/save-selected
router.post('/save-selected', auth, async (req, res) => {
    try {
        const { contacts } = req.body;
        const device = await Device.findOneAndUpdate(
            { _id: req.deviceId, owner: req.user.id },
            { $set: { selectedWhatsAppContacts: contacts || [], lastContactUpdate: Date.now() } },
            { new: true }
        );
        res.json({ message: 'Contacts saved', success: true, count: contacts?.length || 0 });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/contacts/sync
router.post('/sync', auth, async (req, res) => {
    try {
        const { contacts } = req.body;
        if (!Array.isArray(contacts)) {
            return res.status(400).json({ message: 'Contacts must be an array' });
        }
        const device = await Device.findOneAndUpdate(
            { _id: req.deviceId, owner: req.user.id },
            { $set: { contacts, lastContactSync: Date.now() } },
            { new: true }
        );
        res.json({ message: `Synced ${contacts.length} contacts`, success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
