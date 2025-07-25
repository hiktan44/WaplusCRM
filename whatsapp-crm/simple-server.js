// Simple WhatsApp CRM Server - All in one
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const socketIOClient = require('socket.io-client');
const { Server } = require('socket.io');

// Express app setup
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8081';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files

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
    }
});

let isClientReady = false;
let connectedSockets = new Set();

// QR kodunu saklamak için global değişken
let currentQR = null;

// Evolution API'sine bağlanma fonksiyonu
const connectToEvolutionAPI = () => {
    const socket = socketIOClient(EVOLUTION_API_URL, {
        transports: ['websocket'],
        query: {
            "API_KEY": "MUITOBRIGADO"
        }
    });

    socket.on('connect', () => {
        console.log('✅ Connected to Evolution API');
        io.emit('status', { status: 'connected_api', message: 'Evolution API\'ye bağlandı' });
    });

    socket.on('qr', (data) => {
        // Gelen verinin birden fazla parametre içerebileceği durumu ele al
        // Genellikle asıl base64 verisi 'qr' alanında olur.
        const qrCode = data.qr || data;
        
        // Gelen verinin geçerli bir string olup olmadığını kontrol et
        if (typeof qrCode === 'string' && qrCode.length > 50) { // Basit bir geçerlilik kontrolü
            console.log('✅ QR RECEIVED from Evolution API');
            currentQR = qrCode;
            io.emit('qr', currentQR); // Tüm istemcilere yeni QR'ı gönder
        } else {
            console.warn('❌ Invalid or empty QR data received from Evolution API.');
        }
    });

    socket.on('status.instance', (data) => {
        console.log('📱 Instance status update:', data.instance.state);
    });

    socket.on('disconnect', () => {
        console.log('❌ Evolution API disconnected.');
    });
};

// Gelen QR verisini doğrular ve temizler
function sanitizeQR(qr) {
    if (typeof qr !== 'string') return null;
    // Bazen "undefined,..." şeklinde gelen hatalı veriyi temizle
    if (qr.startsWith('undefined,')) {
        return qr.split(',')[1] || null;
    }
    // Verinin geçerli bir base64 başlangıcı olup olmadığını kontrol et
    if (qr.length < 20) { // Makul bir base64 string'inden daha kısa verileri reddet
        return null;
    }
    return qr;
}


// WhatsApp client events
client.on('qr', (...args) => {
    // Gelen argümanlar arasında geçerli base64 dizesini (uzun bir string) bul
    const qrData = args.find(arg => typeof arg === 'string' && arg.length > 200);

    if (qrData) {
        console.log('✅ QR RECEIVED (Valid Data Found)');
        currentQR = qrData;
        // Sadece geçerli ve temiz QR verisini istemciye gönder
        io.emit('qr', qrData);
    } else {
        // Bu log, sorunun devam etmesi durumunda bize ipucu verecek
        console.log('❌ QR event received, but no valid QR data found in arguments:', args);
    }
});

client.on('ready', async () => {
    console.log('🎉 WhatsApp Client is ready!');
    isClientReady = true;
    currentQR = null;
    
    // Notify all connected clients
    connectedSockets.forEach(socket => {
        socket.emit('ready');
    });
});

client.on('authenticated', () => {
    console.log('🔐 WhatsApp Client authenticated');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
    
    connectedSockets.forEach(socket => {
        socket.emit('auth_failure', msg);
    });
});

client.on('disconnected', (reason) => {
    console.log('📱 WhatsApp Client disconnected:', reason);
    isClientReady = false;
    
    connectedSockets.forEach(socket => {
        socket.emit('disconnected', reason);
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    connectedSockets.add(socket);
    
    // Send current QR if available
    socket.on('request_qr', () => {
        console.log('📲 QR request received from client:', socket.id);
        if (currentQR) {
            console.log('📤 Sending current QR to client:', currentQR.substring(0, 50) + '...');
            socket.emit('qr', currentQR);
        } else if (isClientReady) {
            socket.emit('ready');
        } else {
            console.log('⏳ No QR available, starting WhatsApp client...');
            if (!client.pupBrowser) {
                client.initialize();
            }
        }
    });

    // Handle contacts request
    socket.on('get_contacts', async () => {
        try {
            if (!isClientReady) {
                socket.emit('error', 'WhatsApp client not ready');
                return;
            }

            console.log('📇 Getting contacts...');
            const contacts = await client.getContacts();
            
            // Filter contacts
            const filteredContacts = contacts
                .filter(contact => contact.isMyContact && !contact.isGroup)
                .map(contact => ({
                    id: contact.id._serialized,
                    name: contact.name || contact.pushname || contact.number,
                    number: contact.number,
                    isMyContact: contact.isMyContact
                }));

            console.log(`📤 Sending ${filteredContacts.length} contacts`);
            socket.emit('contacts', filteredContacts);
        } catch (error) {
            console.error('❌ Error getting contacts:', error);
            socket.emit('error', 'Failed to get contacts: ' + error.message);
        }
    });

    // Handle groups request
    socket.on('get_groups', async () => {
        try {
            if (!isClientReady) {
                socket.emit('error', 'WhatsApp client not ready');
                return;
            }

            console.log('👥 Getting groups...');
            const chats = await client.getChats();
            
            // Filter only groups
            const groups = chats
                .filter(chat => chat.isGroup)
                .map(group => ({
                    id: group.id._serialized,
                    name: group.name,
                    description: group.description,
                    participants: group.participants.length,
                    isGroup: true
                }));

            console.log(`📤 Sending ${groups.length} groups`);
            socket.emit('groups', groups);
        } catch (error) {
            console.error('❌ Error getting groups:', error);
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

            console.log(`💬 Sending message to: ${data.to}`);
            
            const message = await client.sendMessage(data.to, data.message);
            
            console.log('✅ Message sent successfully:', message.id);
            socket.emit('message_sent', {
                messageId: data.messageId,
                success: true,
                whatsappMessageId: message.id
            });
        } catch (error) {
            console.error('❌ Error sending message:', error);
            socket.emit('message_sent', {
                messageId: data.messageId,
                success: false,
                error: error.message,
                to: data.to
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
        connectedSockets.delete(socket);
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Graceful shutdown...');
    if (client) {
        client.destroy();
    }
    server.close(() => {
        console.log('👋 Server closed');
        process.exit(0);
    });
});

// Start server
const PORT = process.env.PORT || 3025;
server.listen(PORT, () => {
    console.log(`🚀 WhatsApp CRM Server running on port ${PORT}`);
    console.log(`📱 Mode: Real WhatsApp Web.js Integration`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`📂 Static files served from: ${__dirname}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏳ Ready to serve requests...');
    
    // Initialize WhatsApp client after a short delay
    setTimeout(() => {
        console.log('🔄 Starting WhatsApp Web.js client...');
        client.initialize();
    }, 2000);

    // Connect to Evolution API
    connectToEvolutionAPI();
});

module.exports = { app, server, client };