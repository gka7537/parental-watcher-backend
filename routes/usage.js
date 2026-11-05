/**
 * Usage Tracking Routes
 */

const express = require('express');
const router = express.Router();
const UsageLog = require('../models/UsageLog');
const Device = require('../models/Device');
const { authMiddleware } = require('../utils/auth');

// POST /api/usage/sync
router.post('/sync', authMiddleware, async (req, res) => {
    try {
        const { device_id, logs } = req.body;

        if (!device_id || !Array.isArray(logs)) {
            return res.status(400).json({ error: 'device_id and logs array are required' });
        }

        const device = await Device.findOne({ deviceId: device_id, owner: req.user.id });
        if (!device) return res.status(403).json({ error: 'Forbidden - device not owned by user' });

        const enrichedLogs = logs.map(log => ({
            deviceId: device_id,
            packageName: log.package_name || log.packageName,
            appName: log.app_name || log.appName,
            usageMinutes: log.usage_minutes || log.usageMinutes || 0,
            category: log.category || 'other',
            sessionStart: log.session_start || log.sessionStart,
            sessionEnd: log.session_end || log.sessionEnd
        }));

        const result = await UsageLog.insertMany(enrichedLogs);

        res.json({ message: 'Usage data synced', inserted: result.length });
    } catch (error) {
        console.error('Usage sync error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/usage/daily/:deviceId
router.get('/daily/:deviceId', authMiddleware, async (req, res) => {
    try {
        const device = await Device.findOne({
            deviceId: req.params.deviceId,
            owner: req.user.id
        });
        if (!device) return res.status(403).json({ error: 'Forbidden - device not owned by user' });

        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        const startOfDay = new Date(targetDate);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const summary = await UsageLog.aggregate([
            { $match: { deviceId: req.params.deviceId, timestamp: { $gte: startOfDay, $lte: endOfDay } } },
            { $group: { _id: '$packageName', appName: { $first: '$appName' }, totalMinutes: { $sum: '$usageMinutes' }, sessions: { $sum: 1 } } },
            { $sort: { totalMinutes: -1 } }
        ]);

        res.json({ date: targetDate, summary });
    } catch (error) {
        console.error('Usage daily error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
