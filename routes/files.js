/**
 * File Upload Routes - Cloudinary (Updated for Pairing Code)
 */

const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const ActivityLog = require('../models/ActivityLog');
const Device = require('../models/Device');

// POST /api/files/upload/:deviceId
// Yahan deviceId ab 6-digit pairing code hoga
router.post('/upload/:deviceId', async (req, res) => {
    try {
        const deviceId = req.params.deviceId;
        
        // Verify karein ki ye 6-digit code database mein exist karta hai ya nahi
        const device = await Device.findOne({ deviceId: deviceId });
        if (!device) {
            return res.status(403).json({ error: 'Forbidden - Invalid Pairing Code' });
        }

        const { data, type, metadata } = req.body;
        if (!data || !type) return res.status(400).json({ error: 'File data and type are required' });

        let resourceType = 'auto';
        if (type.includes('image')) resourceType = 'image';
        else if (type.includes('video')) resourceType = 'video';
        else if (type.includes('audio')) resourceType = 'audio';

        // Cloudinary Upload (Folder mein 6-digit code use hoga)
        const uploadResult = await cloudinary.uploader.upload(data, {
            resource_type: resourceType,
            folder: `parental_watcher/${deviceId}`,
            ...metadata
        });

        // Database mein log save karein
        await ActivityLog.create({
            deviceId: deviceId,
            eventType: 'file_uploaded',
            description: `File uploaded from child app: ${uploadResult.public_id}`,
            metadata: { 
                public_id: uploadResult.public_id, 
                url: uploadResult.secure_url,
                resource_type: uploadResult.resource_type,
                bytes: uploadResult.bytes
            }
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
// Parent app gallery mein files dekhne ke liye (Yahan bhi 6-digit code aayega)
router.get('/list/:deviceId', async (req, res) => {
    try {
        const deviceId = req.params.deviceId;
        const { max_results = 50 } = req.query; 

        const result = await cloudinary.api.resources({
            prefix: `parental_watcher/${deviceId}`,
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
        console.error('List files error:', error.message);
        // Agar folder khali hai toh empty array return karein
        if (error.http_code === 404 || error.message.includes('Resource not found')) {
            return res.json({ files: [] });
        }
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// DELETE /api/files/delete
// Parent app purani files delete karne ke liye
router.delete('/delete', async (req, res) => {
    try {
        const { public_id, resource_type } = req.body;
        if (!public_id) return res.status(400).json({ error: 'public_id is required' });

        const type = resource_type || 'auto';
        
        const result = await cloudinary.uploader.destroy(public_id, { 
            resource_type: type,
            invalidate: true 
        });

        if (result.result === 'ok') {
            res.json({ success: true, message: 'File deleted successfully' });
        } else {
            res.status(400).json({ error: 'Failed to delete file from Cloudinary' });
        }
    } catch (error) {
        console.error('Delete file error:', error.message);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

module.exports = router;
