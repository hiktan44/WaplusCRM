// Demo WhatsApp Server - Basic functionality for testing
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const qrcode = require('qrcode');

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

let isClientReady = false;
let currentQR = null;
let connectedSockets = new Set();

// Demo data
const demoContacts = [
    { id: '905551234567@c.us', name: 'Ahmet Yılmaz', number: '05551234567', isMyContact: true },
    { id: '905551234568@c.us', name: 'Ayşe Demir', number: '05551234568', isMyContact: true },
    { id: '905551234569@c.us', name: 'Mehmet Kaya', number: '05551234569', isMyContact: true }
];

const demoGroups = [
    { id: '120363025246781234@g.us', name: 'Test Grup', description: 'Demo grup', isGroup: true },
    { id: '120363025246781235@g.us', name: 'İş Arkadaşları', description: 'İş grubu', isGroup: true }
];

// Generate a demo QR code
async function generateDemoQR() {
    const demoQRData = '2@demo-qr-code-for-testing-whatsapp-crm-system-' + Date.now();
    try {
        currentQR = await qrcode.toDataURL(demoQRData);
        console.log('Demo QR kod oluşturuldu');
        return currentQR;
    } catch (error) {
        console.error('QR kod oluşturma hatası:', error);
        return null;
    }
}

// Simulate connection after QR scan
function simulateConnection() {
    setTimeout(() => {
        isClientReady = true;
        currentQR = null;
        console.log('Demo WhatsApp bağlantısı başarılı!');
        
        connectedSockets.forEach(socket => {
            socket.emit('ready');
        });
    }, 5000); // 5 saniye sonra otomatik bağlan
}

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
    socket.on('request_qr', async () => {
        console.log('QR request received from client:', socket.id);
        if (!isClientReady && !currentQR) {
            console.log('Generating demo QR code...');
            await generateDemoQR();
            socket.emit('qr', currentQR);
            simulateConnection(); // Start connection simulation
        } else if (currentQR) {
            socket.emit('qr', currentQR);
        }
    });

    // Handle contact requests
    socket.on('get_contacts', () => {
        if (!isClientReady) {
            socket.emit('error', 'WhatsApp client not ready');
            return;
        }

        console.log('Sending demo contacts...');
        socket.emit('contacts', demoContacts);
    });

    // Handle group requests
    socket.on('get_groups', () => {
        if (!isClientReady) {
            socket.emit('error', 'WhatsApp client not ready');
            return;
        }

        console.log('Sending demo groups...');
        socket.emit('groups', demoGroups);
    });

    // Handle message sending
    socket.on('send_message', async (data) => {
        if (!isClientReady) {
            socket.emit('message_sent', {
                messageId: data.messageId,
                success: false,
                error: 'WhatsApp client not ready'
            });
            return;
        }

        console.log('Demo: Sending message to:', data.to);
        
        // Simulate message sending delay
        setTimeout(() => {
            socket.emit('message_sent', {
                messageId: data.messageId,
                success: true,
                whatsappMessageId: 'demo_msg_' + Date.now(),
                to: data.to
            });
            console.log('Demo: Message sent successfully');
        }, 1000);
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
        connectedClients: connectedSockets.size,
        mode: 'demo'
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        whatsapp: isClientReady ? 'connected' : 'disconnected',
        uptime: process.uptime(),
        mode: 'demo'
    });
});

// Start server
const PORT = process.env.PORT || 3025;
server.listen(PORT, () => {
    console.log(`🚀 Demo WhatsApp CRM Server running on port ${PORT}`);
    console.log('📱 Mode: Demo (Simulated WhatsApp)');
    console.log('🌐 Server URL: http://localhost:' + PORT);
    console.log('💡 Bu demo sunucusu gerçek WhatsApp yerine simülasyon kullanır');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

module.exports = { app, server };