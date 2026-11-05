/**
 * File Upload Routes - Cloudinary
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../utils/auth');
const cloudinary = require('cloudinary').v2;
const ActivityLog = require('../models/ActivityLog');

// POST /api/files/upload/:deviceId
router.post('/upload/:deviceId', authMiddleware, async (req, res) => {
    try {
        const { data, type, metadata } = req.body;

        if (!data || !type) {
            return res.status(400).json({ error: 'File data and type are required' });
        }

        let resourceType = 'auto';
        if (type.includes('image')) resourceType = 'image';
        else if (type.includes('video')) resourceType = 'video';
        else if (type.includes('audio')) resourceType = 'audio';

        const uploadResult = await cloudinary.uploader.upload(data, {
            resource_type: resourceType,
            folder: `parental_watcher/${req.params.deviceId}`,
            ...metadata
        });

        await ActivityLog.create({
            deviceId: req.params.deviceId,
            eventType: 'file_uploaded',
            description: `File uploaded: ${uploadResult.public_id}`,
            metadata: { public_id: uploadResult.public_id, url: uploadResult.secure_url }
        });

        res.json({
            status: 'success',
            public_id: uploadResult.public_id,
            url: uploadResult.secure_url,
            format: uploadResult.format,
            resource_type: uploadResult.resource_type
        });
    } catch (error) {
        console.error('Upload error:', error.message);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// GET /api/files/list/:deviceId
router.get('/list/:deviceId', authMiddleware, async (req, res) => {
    try {
        const { prefix, max_results = 20 } = req.query;
        const result = await cloudinary.api.resources({
            prefix: prefix || `parental_watcher/${req.params.deviceId}`,
            max_results: parseInt(max_results),
            resource_type: 'auto'
        });

        res.json({
            files: result.resources.map(file => ({
                public_id: file.public_id,
                url: file.secure_url,
                format: file.format,
                resource_type: file.resource_type,
                bytes: file.bytes,
                created_at: file.created_at
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to list files' });
    }
});

module.exports = router;
