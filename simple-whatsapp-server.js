const express = require('express');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WhatsApp clients storage
const clients = new Map();

// Serve static files
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>WaPlus CRM - HAIRCHIEFS</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>.gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }</style>
        </head>
        <body class="bg-gray-50">
            <div class="container mx-auto px-6 py-8">
                <div class="gradient-bg text-white rounded-xl p-8 text-center">
                    <h1 class="text-4xl font-bold mb-4">🚀 WaPlus CRM</h1>
                    <p class="text-xl mb-6">HAIRCHIEFS Toplu WhatsApp Mesaj Sistemi</p>
                    <p class="text-lg">API Status: <span class="text-green-300 font-bold">✅ RUNNING</span></p>
                    <p class="text-sm mt-2">Active Instances: ${Array.from(clients.keys()).length}</p>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6 mt-8">
                    <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                        <div class="text-4xl mb-4">📱</div>
                        <h2 class="text-xl font-semibold mb-4">1. WhatsApp QR Code</h2>
                        <p class="text-gray-600 mb-4">WhatsApp hesabınızı bağlayın</p>
                        <a href="/qr" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 inline-block">QR Kod Sayfası</a>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                        <div class="text-4xl mb-4">💌</div>
                        <h2 class="text-xl font-semibold mb-4">2. Toplu Mesaj</h2>
                        <p class="text-gray-600 mb-4">HAIRCHIEFS şablonları ile mesaj gönderin</p>
                        <div class="space-y-2">
                            <a href="/bulk" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200 inline-block w-full">📝 Sadece Mesaj</a>
                            <a href="/bulk-attachments" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 inline-block w-full">📎 Mesaj + Broşür</a>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-lg p-6 mt-8">
                    <h2 class="text-xl font-semibold mb-4">🔧 API Info</h2>
                    <div class="grid md:grid-cols-3 gap-4 text-sm">
                        <div><strong>Server:</strong> ${req.get('host')}</div>
                        <div><strong>Port:</strong> ${port}</div>
                        <div><strong>Version:</strong> v1.0.0</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Serve QR Code page
app.get('/qr', (req, res) => {
    const filePath = path.join(__dirname, 'qr-code-generator.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('QR Code page not found');
        }
        res.send(data);
    });
});

// Serve Bulk Message page
app.get('/bulk', (req, res) => {
    const filePath = path.join(__dirname, 'bulk-message-sender.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Bulk message page not found');
        }
        res.send(data);
    });
});

// Serve Bulk Message with Attachments page  
app.get('/bulk-attachments', (req, res) => {
    const filePath = path.join(__dirname, 'bulk-message-with-attachments.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Bulk message with attachments page not found');
        }
        res.send(data);
    });
});

// API Status
app.get('/api/status', (req, res) => {
    res.json({
        message: 'WaPlus CRM API Server',
        status: 'running',
        instances: Array.from(clients.keys()),
        version: '1.0.0',
        uptime: process.uptime()
    });
});

// Create instance
app.post('/instance/create', async (req, res) => {
    try {
        const { instanceName } = req.body;
        
        if (!instanceName) {
            return res.status(400).json({ error: 'instanceName is required' });
        }

        if (clients.has(instanceName)) {
            return res.status(409).json({ error: 'Instance already exists' });
        }

        // Create WhatsApp client
        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: instanceName,
                dataPath: './sessions'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            }
        });

        // Store client
        const instanceData = {
            client: client,
            status: 'initializing',
            qrCode: null,
            isReady: false
        };
        
        clients.set(instanceName, instanceData);

        // QR Code event
        client.on('qr', async (qr) => {
            try {
                const qrCodeDataURL = await qrcode.toDataURL(qr);
                instanceData.qrCode = qrCodeDataURL;
                instanceData.status = 'qr_generated';
                console.log(`QR Code generated for ${instanceName}`);
            } catch (err) {
                console.error('QR generation error:', err);
            }
        });

        // Ready event
        client.on('ready', () => {
            instanceData.status = 'connected';
            instanceData.isReady = true;
            console.log(`${instanceName} is ready!`);
        });

        // Disconnected event
        client.on('disconnected', (reason) => {
            instanceData.status = 'disconnected';
            instanceData.isReady = false;
            console.log(`${instanceName} disconnected:`, reason);
        });

        // Authentication failure
        client.on('auth_failure', (msg) => {
            instanceData.status = 'auth_failure';
            console.error(`Auth failure for ${instanceName}:`, msg);
        });

        // Initialize client
        await client.initialize();

        res.json({
            message: 'Instance created successfully',
            instanceName: instanceName,
            status: 'initializing'
        });

    } catch (error) {
        console.error('Instance creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get QR Code
app.get('/instance/connect/:instanceName', (req, res) => {
    try {
        const { instanceName } = req.params;
        const instanceData = clients.get(instanceName);

        if (!instanceData) {
            return res.status(404).json({ error: 'Instance not found' });
        }

        if (instanceData.status === 'connected') {
            return res.json({ 
                message: 'Instance already connected',
                status: 'connected'
            });
        }

        if (!instanceData.qrCode) {
            return res.json({ 
                message: 'QR code not ready yet',
                status: instanceData.status
            });
        }

        res.json({
            base64: instanceData.qrCode,
            status: instanceData.status
        });

    } catch (error) {
        console.error('QR code error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get connection state
app.get('/instance/connectionState/:instanceName', (req, res) => {
    try {
        const { instanceName } = req.params;
        const instanceData = clients.get(instanceName);

        if (!instanceData) {
            return res.status(404).json({ error: 'Instance not found' });
        }

        let state = 'close';
        if (instanceData.status === 'connected' && instanceData.isReady) {
            state = 'open';
        } else if (instanceData.status === 'qr_generated') {
            state = 'connecting';
        }

        res.json({
            instance: {
                instanceName: instanceName,
                state: state
            }
        });

    } catch (error) {
        console.error('Connection state error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send text message
app.post('/message/sendText/:instanceName', async (req, res) => {
    try {
        const { instanceName } = req.params;
        const { number, text, delay, attachment } = req.body;

        const instanceData = clients.get(instanceName);
        if (!instanceData || !instanceData.isReady) {
            return res.status(400).json({ error: 'Instance not connected' });
        }

        if (!number || !text) {
            return res.status(400).json({ error: 'number and text are required' });
        }

        // Clean phone number
        let cleanNumber = number.replace(/[^\d+]/g, '');
        if (!cleanNumber.includes('@c.us')) {
            if (cleanNumber.startsWith('+')) {
                cleanNumber = cleanNumber.substring(1);
            }
            cleanNumber = cleanNumber + '@c.us';
        }

        // Add delay if specified
        if (delay && delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay * 1000));
        }

        let message;

        // Send with attachment if provided
        if (attachment && attachment !== 'none') {
            const attachmentPath = path.join(__dirname, 'uploads', attachment);
            
            if (fs.existsSync(attachmentPath)) {
                const media = MessageMedia.fromFilePath(attachmentPath);
                message = await instanceData.client.sendMessage(cleanNumber, media, { caption: text });
                
                console.log(`Message with attachment sent to ${cleanNumber}`);
            } else {
                console.log(`Attachment not found: ${attachmentPath}, sending text only`);
                message = await instanceData.client.sendMessage(cleanNumber, text);
            }
        } else {
            // Send text only
            message = await instanceData.client.sendMessage(cleanNumber, text);
        }

        res.json({
            key: {
                remoteJid: cleanNumber,
                fromMe: true,
                id: message.id.id
            },
            message: {
                conversation: text,
                hasAttachment: !!attachment && attachment !== 'none'
            },
            status: 'SUCCESS'
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ 
            error: error.message,
            status: 'ERROR'
        });
    }
});

// Get instance info
app.get('/instance/fetchInstances', (req, res) => {
    const instances = Array.from(clients.entries()).map(([name, data]) => ({
        instanceName: name,
        status: data.status,
        serverUrl: `http://localhost:${port}`,
        apikey: '429683C4C977415CAAFCCE10F7D57E11'
    }));

    res.json(instances);
});

// Delete instance
app.delete('/instance/delete/:instanceName', async (req, res) => {
    try {
        const { instanceName } = req.params;
        const instanceData = clients.get(instanceName);

        if (!instanceData) {
            return res.status(404).json({ error: 'Instance not found' });
        }

        // Destroy client
        if (instanceData.client) {
            await instanceData.client.destroy();
        }

        // Remove from storage
        clients.delete(instanceName);

        res.json({
            message: 'Instance deleted successfully'
        });

    } catch (error) {
        console.error('Delete instance error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
app.listen(port, host, () => {
    console.log(`🚀 Simple WhatsApp API Server çalışıyor!`);
    console.log(`📱 Server URL: http://${host}:${port}`);
    console.log(`🔑 API Key: 429683C4C977415CAAFCCE10F7D57E11`);
    console.log(`\n🎯 HAIRCHIEFS için hazır!`);
    console.log(`\n📋 Kullanım:`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`   1. QR Code sayfası: /qr`);
        console.log(`   2. Toplu mesaj: /bulk`);
    } else {
        console.log(`   1. QR Code sayfası: http://localhost:${port}/qr`);
        console.log(`   2. Toplu mesaj: http://localhost:${port}/bulk`);
    }
    console.log(`\n✨ Instance adı önerisi: "hairchiefs-wa"`);
});