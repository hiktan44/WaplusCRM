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
// Serve uploaded files statically for previews/downloads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// WhatsApp clients storage
const clients = new Map();

// Unsubscribed phone numbers storage
let unsubscribedNumbers = new Set();

// Load unsubscribed numbers from file
const UNSUBSCRIBED_FILE = './unsubscribed.json';
function loadUnsubscribedNumbers() {
    try {
        if (fs.existsSync(UNSUBSCRIBED_FILE)) {
            const data = fs.readFileSync(UNSUBSCRIBED_FILE, 'utf8');
            const numbers = JSON.parse(data);
            unsubscribedNumbers = new Set(numbers);
            console.log(`📚 ${unsubscribedNumbers.size} abonelikten çıkmış numara yüklendi`);
        }
    } catch (error) {
        console.log('📚 Unsubscribed liste yüklenirken hata:', error.message);
        unsubscribedNumbers = new Set();
    }
}

// Save unsubscribed numbers to file
function saveUnsubscribedNumbers() {
    try {
        const data = JSON.stringify([...unsubscribedNumbers], null, 2);
        fs.writeFileSync(UNSUBSCRIBED_FILE, data);
        console.log(`💾 ${unsubscribedNumbers.size} abonelikten çıkmış numara kaydedildi`);
    } catch (error) {
        console.log('💾 Unsubscribed liste kaydedilirken hata:', error.message);
    }
}

// Load unsubscribed numbers on startup
loadUnsubscribedNumbers();

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
        const allowedExtensions = /\.(jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|mp4|mp3|wav|zip|rar)$/i;
        const allowedMimeTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
            'application/pdf',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'video/mp4', 'video/quicktime', 'video/avi',
            'audio/mpeg', 'audio/mp3', 'audio/wav',
            'application/zip', 'application/x-rar-compressed'
        ];
        
        const extname = allowedExtensions.test(file.originalname);
        const mimetype = allowedMimeTypes.includes(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            console.log(`Rejected file: ${file.originalname} (${file.mimetype})`);
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
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
    const filePath = path.join(__dirname, 'bulk-message-with-attachments.html');
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

        // Create WhatsApp client with enhanced config for stability
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
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-extensions',
                    '--no-first-run',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ],
                executablePath: undefined, // Use system Chrome if available
                ignoreDefaultArgs: ['--disable-extensions']
            },
            webVersionCache: {
                type: 'remote',
                remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
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

        // Message received event - for unsubscribe handling
        client.on('message', (message) => {
            handleIncomingMessage(instanceName, message);
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

        // Verify underlying WA client state before attempting to send
        try {
            const state = await instanceData.client.getState();
            if (state !== 'CONNECTED') {
                instanceData.status = 'disconnected';
                instanceData.isReady = false;
                return res.status(400).json({ error: `Instance not connected: ${state}` });
            }
        } catch (stateErr) {
            instanceData.status = 'disconnected';
            instanceData.isReady = false;
            return res.status(400).json({ error: 'Instance state check failed' });
        }

        if (!number || !text) {
            return res.status(400).json({ error: 'number and text are required' });
        }

        // Clean and format Turkish phone number
        if (!number || number.trim() === '') {
            throw new Error('Phone number is required');
        }
        
        // Check if number is unsubscribed (check original number first)
        let cleanForCheck = number.toString().replace(/[^\d+]/g, '');
        if (cleanForCheck.startsWith('+')) {
            cleanForCheck = cleanForCheck.substring(1);
        }
        if (cleanForCheck.startsWith('0') && cleanForCheck.length === 11) {
            cleanForCheck = '9' + cleanForCheck;
        } else if (cleanForCheck.startsWith('5') && cleanForCheck.length === 10) {
            cleanForCheck = '90' + cleanForCheck;
        }
        
        if (unsubscribedNumbers.has(cleanForCheck)) {
            return res.json({
                success: true,
                message: 'Message skipped - number unsubscribed',
                messageId: null,
                number: cleanForCheck,
                unsubscribed: true
            });
        }
        
        let cleanNumber = number.toString().replace(/[^\d+]/g, '');
        
        // Remove leading + if present
        if (cleanNumber.startsWith('+')) {
            cleanNumber = cleanNumber.substring(1);
        }
        
        // Turkish phone number formatting
        if (cleanNumber.startsWith('0') && cleanNumber.length === 11) {
            // 05551234567 -> 905551234567
            cleanNumber = '9' + cleanNumber;
        } else if (cleanNumber.startsWith('5') && cleanNumber.length === 10) {
            // 5551234567 -> 905551234567  
            cleanNumber = '90' + cleanNumber;
        } else if (!cleanNumber.startsWith('90') && cleanNumber.length === 10) {
            // Any 10-digit number starting with 5 -> add 90 prefix
            cleanNumber = '90' + cleanNumber;
        }
        
        // Validate Turkish mobile number format (90 + 10 digits)
        if (!cleanNumber.startsWith('90') || cleanNumber.length !== 12) {
            throw new Error(`Invalid Turkish phone number format: ${number} -> ${cleanNumber}`);
        }
        
        // Add @c.us suffix if not present
        if (!cleanNumber.includes('@c.us')) {
            cleanNumber = cleanNumber + '@c.us';
        }
        
        console.log(`Turkish phone formatted: ${number} -> ${cleanNumber}`);

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

        // Send message with attachments - Prefer rich preview for PDFs by sending a JPG/PNG thumbnail first
        if (filesToSend.length > 0) {
            const firstAttachmentPath = path.join(__dirname, 'uploads', filesToSend[0]);
            
            if (fs.existsSync(firstAttachmentPath)) {
                try {
                    // If first file is a PDF, try to send an image preview (same basename .jpg/.png) first with caption
                    const isPdf = /\.pdf$/i.test(filesToSend[0]);
                    let previewSent = false;
                    if (isPdf) {
                        const parsed = path.parse(filesToSend[0]);
                        const candidateImages = [
                            path.join(__dirname, 'uploads', `${parsed.name}.jpg`),
                            path.join(__dirname, 'uploads', `${parsed.name}.jpeg`),
                            path.join(__dirname, 'uploads', `${parsed.name}.png`)
                        ];
                        const previewPath = candidateImages.find(p => fs.existsSync(p));
                        if (previewPath) {
                            const previewMedia = MessageMedia.fromFilePath(previewPath);
                            console.log(`🖼️ Sending preview image for PDF to ${cleanNumber}: ${path.basename(previewPath)}`);
                            if (text && text.trim()) {
                                message = await instanceData.client.sendMessage(cleanNumber, previewMedia, { caption: text.trim() });
                            } else {
                                message = await instanceData.client.sendMessage(cleanNumber, previewMedia);
                            }
                            previewSent = true;
                        }
                    }

                    // If not a PDF or no preview available, send the original file (image/video/doc)
                    if (!previewSent) {
                        const media = MessageMedia.fromFilePath(firstAttachmentPath);
                        console.log(`📸 Preparing media with caption for ${cleanNumber}`);
                        console.log(`📝 Template text: "${text}"`);
                        if (text && text.trim()) {
                            message = await instanceData.client.sendMessage(cleanNumber, media, { caption: text.trim() });
                            console.log(`✅ Media sent with caption to ${cleanNumber}`);
                        } else {
                            message = await instanceData.client.sendMessage(cleanNumber, media);
                            console.log(`📸 Media sent without caption to ${cleanNumber}`);
                        }
                    }

                    sentAttachments++;
                    
                    // Send additional attachments if any (without caption)
                    for (let i = 1; i < filesToSend.length; i++) {
                        const filename = filesToSend[i];
                        const attachmentPath = path.join(__dirname, 'uploads', filename);
                        
                        if (fs.existsSync(attachmentPath)) {
                            try {
                                // Delay between additional attachments
                                await new Promise(resolve => setTimeout(resolve, 800));
                                
                                const additionalMedia = MessageMedia.fromFilePath(attachmentPath);
                                // For documents (like PDF), ensure they go as document; for images/videos default is fine
                                const sendAsDocument = /\.(pdf|docx?|xlsx?|pptx?)$/i.test(filename);
                                await instanceData.client.sendMessage(cleanNumber, additionalMedia, sendAsDocument ? { sendMediaAsDocument: true } : {});
                                sentAttachments++;
                                console.log(`Additional attachment ${filename} sent to ${cleanNumber}`);
                            } catch (attachError) {
                                console.error(`Failed to send additional attachment ${filename}:`, attachError);
                            }
                        } else {
                            console.warn(`Additional attachment not found: ${attachmentPath}`);
                        }
                    }
                    
                } catch (msgError) {
                    console.error(`Failed to send media with caption (method 1) to ${cleanNumber}:`, msgError);
                    
                    // Method 2: Try with media.caption property fallback
                    try {
                        const media = MessageMedia.fromFilePath(firstAttachmentPath);
                        media.caption = text && text.trim() ? text.trim() : '';
                        message = await instanceData.client.sendMessage(cleanNumber, media);
                        sentAttachments++;
                        console.log(`✅ Media sent with caption (method 2) to ${cleanNumber}`);
                    } catch (fallbackError) {
                        console.error(`Method 2 also failed:`, fallbackError);
                        // Last resort: send text only
                        try {
                            message = await instanceData.client.sendMessage(cleanNumber, text);
                            console.log(`Fallback: text-only message sent to ${cleanNumber}`);
                        } catch (finalError) {
                            throw new Error(`All sending methods failed: ${finalError.message}`);
                        }
                    }
                }
            } else {
                console.warn(`Attachment not found: ${firstAttachmentPath}`);
                // Fallback to text-only message
                try {
                    message = await instanceData.client.sendMessage(cleanNumber, text);
                    console.log(`Text-only message sent to ${cleanNumber}`);
                } catch (msgError) {
                    throw new Error(`Message sending failed: ${msgError.message}`);
                }
            }
        } else {
            // Send text-only message
            try {
                message = await instanceData.client.sendMessage(cleanNumber, text);
                console.log(`Text message sent to ${cleanNumber}`);
            } catch (msgError) {
                console.error(`Failed to send message to ${cleanNumber}:`, msgError);
                throw new Error(`Message sending failed: ${msgError.message}`);
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
        const message = (error && error.message) ? error.message : String(error);
        if (/Protocol error|Session closed|page has been closed/i.test(message)) {
            // Mark instance as disconnected to force reconnection on next attempt
            const { instanceName } = req.params;
            const instanceData = clients.get(instanceName);
            if (instanceData) {
                instanceData.status = 'disconnected';
                instanceData.isReady = false;
            }
            return res.status(400).json({ 
                error: 'Instance lost session with WhatsApp. Please re-open QR and reconnect.',
                status: 'ERROR'
            });
        }
        res.status(500).json({ 
            error: message,
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

// Unsubscribe page
app.get('/unsubscribe', (req, res) => {
    const { phone } = req.query;
    const unsubscribeForm = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonelik İptali - HAIRCHIEFS</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-width: 500px; width: 90%; text-align: center; }
        .logo { font-size: 2rem; font-weight: bold; color: #4a90e2; margin-bottom: 1rem; }
        h1 { color: #333; margin-bottom: 1rem; }
        .form-group { margin-bottom: 1rem; text-align: left; }
        label { display: block; margin-bottom: 0.5rem; color: #666; font-weight: bold; }
        input { width: 100%; padding: 0.8rem; border: 2px solid #ddd; border-radius: 5px; font-size: 1rem; transition: border-color 0.3s; }
        input:focus { outline: none; border-color: #4a90e2; }
        button { background: linear-gradient(45deg, #ff6b6b, #ee5a24); color: white; padding: 1rem 2rem; border: none; border-radius: 5px; font-size: 1rem; cursor: pointer; transition: transform 0.2s; width: 100%; }
        button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(238, 90, 36, 0.4); }
        .success { background: #d4edda; color: #155724; padding: 1rem; border-radius: 5px; border: 1px solid #c3e6cb; margin-top: 1rem; }
        .error { background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 5px; border: 1px solid #f5c6cb; margin-top: 1rem; }
        .info { background: #d1ecf1; color: #0c5460; padding: 1rem; border-radius: 5px; border: 1px solid #bee5eb; margin-bottom: 1rem; }
        .footer { margin-top: 2rem; color: #666; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">📱 HAIRCHIEFS</div>
        <h1>Abonelik İptali</h1>
        
        <div class="info">
            <strong>ℹ️ Bilgi:</strong> Aboneliğinizi iptal etmek için telefon numaranızı girin. Bu numara mesaj listemizden çıkarılacak ve size artık mesaj gönderilmeyecektir.
        </div>
        
        <form id="unsubscribeForm" onsubmit="handleUnsubscribe(event)">
            <div class="form-group">
                <label for="phone">📞 Telefon Numaranız:</label>
                <input type="tel" id="phone" name="phone" value="${phone || ''}" placeholder="05XX XXX XX XX" required>
                <small style="color: #666; font-size: 0.8rem;">Örnek: 05551234567 veya 5551234567</small>
            </div>
            
            <button type="submit">🚫 Abonelikten Çık</button>
        </form>
        
        <div id="result"></div>
        
        <div class="footer">
            <p>© 2024 HAIRCHIEFS - Saç Ekim Merkezi</p>
            <p>Teknik destek için: 0544 675 71 13</p>
        </div>
    </div>

    <script>
        async function handleUnsubscribe(event) {
            event.preventDefault();
            
            const phone = document.getElementById('phone').value.trim();
            const resultDiv = document.getElementById('result');
            const button = event.target.querySelector('button');
            
            if (!phone) {
                resultDiv.innerHTML = '<div class="error">❌ Lütfen telefon numaranızı girin!</div>';
                return;
            }
            
            // Show loading
            button.innerHTML = '⏳ İşleniyor...';
            button.disabled = true;
            
            try {
                const response = await fetch('/api/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    resultDiv.innerHTML = '<div class="success">✅ Aboneliğiniz başarıyla iptal edildi! Telefon numaranız: ' + result.formattedPhone + '</div>';
                    document.getElementById('unsubscribeForm').style.display = 'none';
                } else {
                    resultDiv.innerHTML = '<div class="error">❌ ' + result.error + '</div>';
                }
            } catch (error) {
                resultDiv.innerHTML = '<div class="error">❌ İşlem sırasında bir hata oluştu: ' + error.message + '</div>';
            }
            
            // Reset button
            button.innerHTML = '🚫 Abonelikten Çık';
            button.disabled = false;
        }
    </script>
</body>
</html>`;
    
    res.send(unsubscribeForm);
});

// Unsubscribe API
app.post('/api/unsubscribe', async (req, res) => {
    try {
        const { phone } = req.body;
        
        if (!phone || phone.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                error: 'Telefon numarası gerekli' 
            });
        }
        
        // Clean and format phone number
        let cleanNumber = phone.toString().replace(/[^\d+]/g, '');
        if (cleanNumber.startsWith('+')) {
            cleanNumber = cleanNumber.substring(1);
        }
        
        // Turkish phone number formatting
        if (cleanNumber.startsWith('0') && cleanNumber.length === 11) {
            cleanNumber = '9' + cleanNumber;
        } else if (cleanNumber.startsWith('5') && cleanNumber.length === 10) {
            cleanNumber = '90' + cleanNumber;
        }
        
        // Validate Turkish phone number
        if (!cleanNumber.startsWith('90') || cleanNumber.length !== 12) {
            return res.status(400).json({ 
                success: false, 
                error: 'Geçersiz Türkiye telefon numarası formatı. Örnek: 05551234567' 
            });
        }
        
        // Add to unsubscribed list
        unsubscribedNumbers.add(cleanNumber);
        saveUnsubscribedNumbers();
        
        console.log(`📤 Abonelikten çıkarıldı: ${phone} -> ${cleanNumber}`);
        
        res.json({
            success: true,
            message: 'Abonelik başarıyla iptal edildi',
            originalPhone: phone,
            formattedPhone: cleanNumber
        });
        
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Sunucu hatası: ' + error.message 
        });
    }
});

// Get unsubscribed numbers (admin)
app.get('/api/unsubscribed', (req, res) => {
    res.json({
        count: unsubscribedNumbers.size,
        numbers: [...unsubscribedNumbers]
    });
});

// Add WhatsApp message handler for unsubscribe requests
const handleIncomingMessage = (instanceName, message) => {
    try {
        // Check if message contains unsubscribe request
        const messageBody = message.body.toLowerCase().trim();
        const unsubscribeKeywords = ['abonelikten çık', 'abonelik iptal', 'çık', 'stop', 'unsubscribe'];
        
        if (unsubscribeKeywords.some(keyword => messageBody.includes(keyword))) {
            // Extract phone number from message
            const fromNumber = message.from.replace('@c.us', '');
            
            // Add to unsubscribed list
            unsubscribedNumbers.add(fromNumber);
            saveUnsubscribedNumbers();
            
            console.log(`📤 WhatsApp'tan abonelikten çıkarıldı: ${fromNumber}`);
            
            // Send confirmation message
            const instanceData = clients.get(instanceName);
            if (instanceData && instanceData.isReady) {
                instanceData.client.sendMessage(message.from, 
                    '✅ Aboneliğiniz başarıyla iptal edildi. Size artık mesaj gönderilmeyecektir.\n\n📱 HAIRCHIEFS Saç Ekim Merkezi\n☎️ Bilgi: 0544 675 71 13'
                );
            }
        }
    } catch (error) {
        console.error('Handle incoming message error:', error);
    }
};

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