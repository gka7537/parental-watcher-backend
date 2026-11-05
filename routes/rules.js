/**
 * Rules and Settings Routes
 */

const express = require('express');
const router = express.Router();
const BlockRule = require('../models/BlockRule');
const TimeLimit = require('../models/TimeLimit');
const Settings = require('../models/Settings');
const ActivityLog = require('../models/ActivityLog');
const { authMiddleware } = require('../utils/auth');

// GET /api/rules/blocks/:deviceId
router.get('/blocks/:deviceId', authMiddleware, async (req, res) => {
    try {
        const rules = await BlockRule.find({ deviceId: req.params.deviceId });
        res.json(rules);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/rules/blocks/:deviceId
router.post('/blocks/:deviceId', authMiddleware, async (req, res) => {
    try {
        const { package_name, app_name, is_blocked, reason } = req.body;
        if (!package_name) {
            return res.status(400).json({ error: 'package_name is required' });
        }

        const rule = await BlockRule.findOneAndUpdate(
            { deviceId: req.params.deviceId, packageName: package_name },
            { deviceId: req.params.deviceId, packageName: package_name, appName: app_name, isBlocked: is_blocked !== undefined ? is_blocked : true, reason, updatedAt: new Date() },
            { upsert: true, new: true }
        );

        await ActivityLog.create({
            deviceId: req.params.deviceId,
            eventType: 'block_rule_updated',
            description: `App "${package_name}" ${is_blocked ? 'blocked' : 'unblocked'}`
        });

        res.json(rule);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/rules/time-limit/:deviceId
router.get('/time-limit/:deviceId', authMiddleware, async (req, res) => {
    try {
        const limit = await TimeLimit.findOne({ deviceId: req.params.deviceId });
        res.json(limit || {});
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/rules/time-limit/:deviceId
router.put('/time-limit/:deviceId', authMiddleware, async (req, res) => {
    try {
        const { daily_limit_minutes, start_time, end_time, is_enabled } = req.body;
        const limit = await TimeLimit.findOneAndUpdate(
            { deviceId: req.params.deviceId },
            { dailyLimitMinutes: daily_limit_minutes || 120, startTime: start_time || '21:00', endTime: end_time || '07:00', isEnabled: is_enabled !== undefined ? is_enabled : true, updatedAt: new Date() },
            { upsert: true, new: true }
        );
        res.json(limit);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
