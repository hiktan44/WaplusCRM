// Basit WhatsApp CRM Server - Direct Web Integration
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

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

// Global değişkenler
let whatsappStatus = 'disconnected';
let connectedSockets = new Set();

// Simüle edilmiş veriler
const demoContacts = [
    { id: '1@c.us', name: 'Ahmet Yılmaz', phone: '+90 555 123 4567' },
    { id: '2@c.us', name: 'Fatma Demir', phone: '+90 555 234 5678' },
    { id: '3@c.us', name: 'Mehmet Kaya', phone: '+90 555 345 6789' },
    { id: '4@c.us', name: 'Ayşe Özkan', phone: '+90 555 456 7890' },
    { id: '5@c.us', name: 'Ali Çelik', phone: '+90 555 567 8901' }
];

const demoGroups = [
    { id: 'g1@g.us', name: 'Müşteri Destek Grubu', participants: 25 },
    { id: 'g2@g.us', name: 'Satış Ekibi', participants: 12 }
];

// Ana sayfa route'u
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// WhatsApp durumu API
app.get('/api/status', (req, res) => {
    res.json({
        status: whatsappStatus,
        connected: whatsappStatus === 'connected',
        contacts: demoContacts.length,
        groups: demoGroups.length
    });
});

// Kişiler API
app.get('/api/contacts', (req, res) => {
    res.json({
        success: true,
        contacts: demoContacts
    });
});

// Gruplar API  
app.get('/api/groups', (req, res) => {
    res.json({
        success: true,
        groups: demoGroups
    });
});

// Mesaj gönderimi API
app.post('/api/send-message', (req, res) => {
    const { to, message, type = 'text' } = req.body;
    
    if (!to || !message) {
        return res.status(400).json({
            success: false,
            error: 'Alıcı ve mesaj gerekli'
        });
    }

    // Simüle edilmiş mesaj gönderimi
    setTimeout(() => {
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Socket ile bildirim gönder
        connectedSockets.forEach(socket => {
            socket.emit('message_sent', {
                id: messageId,
                to: to,
                message: message,
                status: 'sent',
                timestamp: new Date().toISOString()
            });
        });
    }, 1000);

    res.json({
        success: true,
        messageId: 'msg_' + Date.now(),
        status: 'queued'
    });
});

// Socket.IO bağlantıları
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    connectedSockets.add(socket);

    // WhatsApp bağlantı simülasyonu
    socket.on('connect_whatsapp', () => {
        console.log('WhatsApp bağlantısı isteniyor...');
        
        // WhatsApp Web sayfasını aç
        socket.emit('redirect_whatsapp', {
            url: 'https://web.whatsapp.com',
            message: 'WhatsApp Web sayfası açılıyor. QR kodu taradıktan sonra bu pencereye geri dönün.'
        });

        // 30 saniye sonra bağlı varsay (gerçek projede kullanıcı onayı alınmalı)
        setTimeout(() => {
            whatsappStatus = 'connected';
            socket.emit('whatsapp_connected', {
                status: 'connected',
                message: 'WhatsApp başarıyla bağlandı!',
                contacts: demoContacts.length,
                groups: demoGroups.length
            });
        }, 30000);
    });

    // Manuel bağlantı onayı
    socket.on('confirm_connection', () => {
        whatsappStatus = 'connected';
        
        // Tüm client'lara bağlantı durumunu bildir
        connectedSockets.forEach(s => {
            s.emit('whatsapp_connected', {
                status: 'connected',
                message: 'WhatsApp başarıyla bağlandı!',
                contacts: demoContacts.length,
                groups: demoGroups.length
            });
        });
    });

    // Kişileri getir
    socket.on('get_contacts', () => {
        if (whatsappStatus === 'connected') {
            socket.emit('contacts_received', {
                success: true,
                contacts: demoContacts
            });
        } else {
            socket.emit('error', 'WhatsApp bağlantısı yok');
        }
    });

    // Grupları getir
    socket.on('get_groups', () => {
        if (whatsappStatus === 'connected') {
            socket.emit('groups_received', {
                success: true,
                groups: demoGroups
            });
        } else {
            socket.emit('error', 'WhatsApp bağlantısı yok');
        }
    });

    // Bağlantı kopma
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        connectedSockets.delete(socket);
    });
});

// Server başlatma
const PORT = process.env.PORT || 3025;

server.listen(PORT, () => {
    console.log('\n🚀 Basit WhatsApp CRM Server Başlatıldı!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📱 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('💡 Bu basit entegrasyon WhatsApp Web sayfasını kullanır');
    console.log('📋 Kullanım: "WhatsApp\'a Bağlan" -> QR kodu tara -> Geri dön');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}); 