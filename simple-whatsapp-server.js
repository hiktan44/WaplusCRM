const express = require('express');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WhatsApp clients storage
const clients = new Map();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        // Keep original filename with timestamp prefix
        const timestamp = Date.now();
        cb(null, `${timestamp}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 250 * 1024 * 1024, // 250MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images, videos, documents, audio
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|mp4|mp3|wav|zip|rar/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Unsupported file type'));
        }
    }
});

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
                            <a href="/advanced-bulk" class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition duration-200 inline-block w-full">🚀 Gelişmiş Toplu Mesaj</a>
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

// Serve Advanced Bulk Message page
app.get('/advanced-bulk', (req, res) => {
    const filePath = path.join(__dirname, 'advanced-bulk-messaging.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Advanced bulk message page not found');
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

// Upload files endpoint
app.post('/api/upload', upload.array('files', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const uploadedFiles = req.files.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            path: file.path
        }));

        res.json({
            message: 'Files uploaded successfully',
            files: uploadedFiles,
            count: uploadedFiles.length
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get uploaded files list
app.get('/api/files', (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, 'uploads');
        const files = fs.readdirSync(uploadsDir)
            .filter(file => file !== '.DS_Store')
            .map(filename => {
                const filePath = path.join(uploadsDir, filename);
                const stats = fs.statSync(filePath);
                return {
                    filename: filename,
                    originalname: filename.replace(/^\d+-/, ''), // Remove timestamp prefix
                    size: stats.size,
                    uploadDate: stats.birthtime,
                    path: filePath
                };
            })
            .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

        res.json({
            files: files,
            count: files.length
        });
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete uploaded file
app.delete('/api/files/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, 'uploads', filename);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ message: 'File deleted successfully', filename: filename });
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: error.message });
    }
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

        // Create WhatsApp client with minimal config
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
                    '--disable-web-security'
                ]
            }
        });

        // Store client
        const instanceData = {
            client: client,
            status: 'initializing',
            qrCode: null,
            isReady: false,
            qrGenerated: false,
            lastQRTime: 0
        };
        
        clients.set(instanceName, instanceData);

        // QR Code event - only generate once
        client.on('qr', async (qr) => {
            try {
                // Only generate QR once
                if (instanceData.qrGenerated) {
                    console.log(`QR Code request ignored for ${instanceName} (already generated)`);
                    return;
                }
                
                const qrCodeDataURL = await qrcode.toDataURL(qr);
                instanceData.qrCode = qrCodeDataURL;
                instanceData.status = 'qr_generated';
                instanceData.qrGenerated = true;
                instanceData.lastQRTime = Date.now();
                console.log(`QR Code generated for ${instanceName} - ready to scan!`);
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
            instanceData.qrGenerated = false;
            console.error(`Auth failure for ${instanceName}:`, msg);
        });

        // Loading event
        client.on('loading_screen', (percent, message) => {
            console.log(`${instanceName}: Loading ${percent}% - ${message}`);
        });

        // Initialize client with timeout
        const initTimeout = setTimeout(() => {
            if (instanceData.status === 'initializing') {
                instanceData.status = 'timeout';
                console.error(`${instanceName}: Initialization timeout`);
            }
        }, 60000); // 60 second timeout

        try {
            await client.initialize();
            clearTimeout(initTimeout);
        } catch (error) {
            clearTimeout(initTimeout);
            instanceData.status = 'init_error';
            console.error(`${instanceName}: Initialization error:`, error);
            throw error;
        }

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
        const { number, text, delay, attachment, attachments } = req.body;

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
        let sentAttachments = 0;
        
        // Determine which attachments to use (priority: attachments array > single attachment)
        let filesToSend = [];
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
            filesToSend = attachments;
        } else if (attachment && attachment !== 'none') {
            filesToSend = [attachment];
        }

        // Send text message first
        message = await instanceData.client.sendMessage(cleanNumber, text);
        console.log(`Text message sent to ${cleanNumber}`);

        // Send attachments separately
        if (filesToSend.length > 0) {
            for (const filename of filesToSend) {
                const attachmentPath = path.join(__dirname, 'uploads', filename);
                
                if (fs.existsSync(attachmentPath)) {
                    try {
                        const media = MessageMedia.fromFilePath(attachmentPath);
                        await instanceData.client.sendMessage(cleanNumber, media);
                        sentAttachments++;
                        console.log(`Attachment ${filename} sent to ${cleanNumber}`);
                        
                        // Small delay between attachments
                        if (filesToSend.length > 1) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    } catch (attachError) {
                        console.error(`Failed to send attachment ${filename}:`, attachError);
                    }
                } else {
                    console.warn(`Attachment not found: ${attachmentPath}`);
                }
            }
        }

        res.json({
            key: {
                remoteJid: cleanNumber,
                fromMe: true,
                id: message.id.id
            },
            message: {
                conversation: text,
                hasAttachment: filesToSend.length > 0,
                attachmentCount: sentAttachments,
                attachments: filesToSend
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