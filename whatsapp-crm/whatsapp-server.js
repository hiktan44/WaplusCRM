// WhatsApp Web.js Server for CRM Integration
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');

// Express app setup
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

// WhatsApp client setup
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'whatsapp-crm-client',
        dataPath: './whatsapp-auth'
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
            '--disable-gpu',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=VizDisplayCompositor',
            '--disable-blink-features=AutomationControlled',
            '--no-default-browser-check',
            '--disable-web-security',
            '--disable-features=TranslateUI'
        ],
        executablePath: undefined,
        timeout: 120000,
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    }
});

let isClientReady = false;
let currentQR = null;
let connectedSockets = new Set();

// WhatsApp client events
client.on('qr', (qr) => {
    console.log('🔥 QR KOD TERMİNAL\'DE GÖRÜNTÜLENMEKTE:');
    console.log('📱 Telefonunuzla aşağıdaki QR kodu tarayın:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Terminal'de QR kodu göster
    qrcodeTerminal.generate(qr, { small: true });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 WhatsApp → ⋮ (Menü) → Bağlı Cihazlar → Cihaz Bağla → QR Kodu Tarayın');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    currentQR = qr;
    
    // Send QR to all connected clients
    connectedSockets.forEach(socket => {
        socket.emit('qr', qr);
    });
});

client.on('ready', async () => {
    console.log('WhatsApp Client is ready!');
    isClientReady = true;
    currentQR = null;
    
    // Notify all connected clients
    connectedSockets.forEach(socket => {
        socket.emit('ready');
    });
});

client.on('authenticated', () => {
    console.log('WhatsApp Client authenticated');
});

client.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
    
    connectedSockets.forEach(socket => {
        socket.emit('auth_failure', msg);
    });
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp Client disconnected:', reason);
    isClientReady = false;
    
    connectedSockets.forEach(socket => {
        socket.emit('disconnected', reason);
    });
});

client.on('message', async (message) => {
    console.log('New message received:', message.body);
    
    // Forward message to CRM (if needed for auto-replies)
    connectedSockets.forEach(socket => {
        socket.emit('message_received', {
            from: message.from,
            body: message.body,
            timestamp: message.timestamp,
            isGroup: message.isGroupMsg
        });
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    connectedSockets.add(socket);

    // Send current status
    if (isClientReady) {
        socket.emit('ready');
    } else if (currentQR) {
        socket.emit('qr', currentQR);
    }

    // Handle QR request
    socket.on('request_qr', () => {
        console.log('QR request received from client:', socket.id);
        if (currentQR) {
            console.log('Sending current QR to client:', currentQR.substring(0, 50) + '...');
            socket.emit('qr', currentQR);
        } else if (!isClientReady) {
            console.log('No QR available, restarting WhatsApp client...');
            client.initialize();
        }
    });

    // Handle contact requests
    socket.on('get_contacts', async () => {
        try {
            if (!isClientReady) {
                socket.emit('error', 'WhatsApp client not ready');
                return;
            }

            console.log('Getting contacts...');
            const contacts = await client.getContacts();
            
            // Filter out groups and format contacts
            const formattedContacts = contacts
                .filter(contact => !contact.isGroup && contact.isMyContact)
                .map(contact => ({
                    id: contact.id,
                    name: contact.name || contact.pushname,
                    number: contact.number,
                    profilePicUrl: contact.profilePicUrl,
                    isMyContact: contact.isMyContact,
                    lastSeen: contact.lastSeen
                }));

            console.log(`Sending ${formattedContacts.length} contacts`);
            socket.emit('contacts', formattedContacts);

        } catch (error) {
            console.error('Error getting contacts:', error);
            socket.emit('error', 'Failed to get contacts: ' + error.message);
        }
    });

    // Handle group requests
    socket.on('get_groups', async () => {
        try {
            if (!isClientReady) {
                socket.emit('error', 'WhatsApp client not ready');
                return;
            }

            console.log('Getting groups...');
            const chats = await client.getChats();
            
            // Filter only groups
            const groups = chats
                .filter(chat => chat.isGroup)
                .map(group => ({
                    id: group.id,
                    name: group.name,
                    description: group.description,
                    participants: group.participants,
                    isGroup: true
                }));

            console.log(`Sending ${groups.length} groups`);
            socket.emit('groups', groups);

        } catch (error) {
            console.error('Error getting groups:', error);
            socket.emit('error', 'Failed to get groups: ' + error.message);
        }
    });

    // Handle message sending
    socket.on('send_message', async (data) => {
        try {
            if (!isClientReady) {
                socket.emit('message_sent', {
                    messageId: data.messageId,
                    success: false,
                    error: 'WhatsApp client not ready'
                });
                return;
            }

            console.log('Sending message to:', data.to);
            
            // Send message via WhatsApp
            const message = await client.sendMessage(data.to, data.message);
            
            console.log('Message sent successfully:', message.id);
            
            socket.emit('message_sent', {
                messageId: data.messageId,
                success: true,
                whatsappMessageId: message.id,
                to: data.to
            });

        } catch (error) {
            console.error('Error sending message:', error);
            
            socket.emit('message_sent', {
                messageId: data.messageId,
                success: false,
                error: error.message,
                to: data.to
            });
        }
    });

    // Handle media message sending
    socket.on('send_media', async (data) => {
        try {
            if (!isClientReady) {
                socket.emit('message_sent', {
                    messageId: data.messageId,
                    success: false,
                    error: 'WhatsApp client not ready'
                });
                return;
            }

            console.log('Sending media message to:', data.to);
            
            // Create media object
            const media = MessageMedia.fromFilePath(data.mediaPath);
            
            // Send media message
            const message = await client.sendMessage(data.to, media, {
                caption: data.caption || ''
            });
            
            console.log('Media message sent successfully:', message.id);
            
            socket.emit('message_sent', {
                messageId: data.messageId,
                success: true,
                whatsappMessageId: message.id,
                to: data.to
            });

        } catch (error) {
            console.error('Error sending media message:', error);
            
            socket.emit('message_sent', {
                messageId: data.messageId,
                success: false,
                error: error.message,
                to: data.to
            });
        }
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        connectedSockets.delete(socket);
    });
});

// Express routes
app.get('/', (req, res) => {
    res.json({
        status: isClientReady ? 'ready' : 'connecting',
        hasQR: !!currentQR,
        connectedClients: connectedSockets.size
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        whatsapp: isClientReady ? 'connected' : 'disconnected',
        uptime: process.uptime()
    });
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    
    if (client) {
        await client.destroy();
    }
    
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Start server
const PORT = process.env.PORT || 3025;
server.listen(PORT, () => {
    console.log(`🚀 WhatsApp CRM Server running on port ${PORT}`);
    console.log('📱 Mode: Real WhatsApp Web.js Integration');
    console.log('🌐 Server URL: http://localhost:' + PORT);
    console.log('🔗 Web Interface: http://localhost:8081/index.html');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏳ WhatsApp client initializing...');
    
    // Initialize WhatsApp client after a short delay
    setTimeout(() => {
        console.log('🔄 Starting WhatsApp Web.js client...');
        client.initialize();
    }, 3000);
});

module.exports = { app, server, client };