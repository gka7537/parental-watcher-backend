/**
 * Parental Watcher Backend Server
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('ws');
const path = require('path');

const config = require('./config');
const connectDB = require('./database/connection');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret
});

// Firebase Admin init
try {
    const admin = require('firebase-admin');
    if (config.firebase.projectId && config.firebase.privateKey && config.firebase.clientEmail) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: config.firebase.projectId,
                privateKey: config.firebase.privateKey,
                clientEmail: config.firebase.clientEmail
            })
        });
        console.log('Firebase Admin initialized');
    } else {
        console.warn('Firebase credentials missing - FCM disabled');
    }
} catch (err) {
    console.warn('Firebase init skipped:', err.message);
}

const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/device');
const usageRoutes = require('./routes/usage');
const rulesRoutes = require('./routes/rules');
const liveRoutes = require('./routes/live');
const commandRoutes = require('./routes/commands');
const fileRoutes = require('./routes/files');
const contactRoutes = require('./routes/contacts');
const whatsappCallRoutes = require('./routes/whatsappCalls');

const app = express();
const server = http.createServer(app);
const wss = new Server({ server });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/commands', commandRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/calls', whatsappCallRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.json({
        name: 'Parental Watcher Backend',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth',
            devices: '/api/devices',
            usage: '/api/usage',
            rules: '/api/rules',
            live: '/api/live',
            commands: '/api/commands',
            files: '/api/files',
            contacts: '/api/contacts',
            calls: '/api/calls'
        }
    });
});

const deviceClients = new Map();
const parentSessions = new Map();

wss.on('connection', (ws, req) => {
    let connectedDeviceId = null;
    let isParentSession = false;

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            if (message.type === 'register') {
                connectedDeviceId = message.device_id;
                isParentSession = message.is_parent || false;

                if (isParentSession) {
                    if (!parentSessions.has(connectedDeviceId)) {
                        parentSessions.set(connectedDeviceId, new Set());
                    }
                    parentSessions.get(connectedDeviceId).add(ws);
                } else {
                    if (!deviceClients.has(connectedDeviceId)) {
                        deviceClients.set(connectedDeviceId, new Set());
                    }
                    deviceClients.get(connectedDeviceId).add(ws);
                }
            }
        } catch (err) {
            console.error('WebSocket error:', err.message);
        }
    });

    ws.on('close', () => {
        if (connectedDeviceId && isParentSession) {
            const parentSet = parentSessions.get(connectedDeviceId);
            if (parentSet) {
                parentSet.delete(ws);
                if (parentSet.size === 0) parentSessions.delete(connectedDeviceId);
            }
        } else if (connectedDeviceId) {
            const deviceSet = deviceClients.get(connectedDeviceId);
            if (deviceSet) {
                deviceSet.delete(ws);
                if (deviceSet.size === 0) deviceClients.delete(connectedDeviceId);
            }
        }
    });
});

function broadcastToDevice(deviceId, event, data) {
    const clients = deviceClients.get(deviceId);
    if (clients) {
        const message = JSON.stringify({ type: event, data, timestamp: new Date().toISOString() });
        clients.forEach((client) => {
            if (client.readyState === 1) client.send(message);
        });
    }
}

function broadcastToParent(deviceId, event, data) {
    const clients = parentSessions.get(deviceId);
    if (clients) {
        const message = JSON.stringify({ type: event, data, timestamp: new Date().toISOString() });
        clients.forEach((client) => {
            if (client.readyState === 1) client.send(message);
        });
    }
}

app.set('broadcastToDevice', broadcastToDevice);
app.set('broadcastToParent', broadcastToParent);

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = config.port;
connectDB()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Parental Watcher Backend running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to connect to database:', err);
        process.exit(1);
    });

module.exports = { app, server, wss };
