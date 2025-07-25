// INSERT_YOUR_REWRITE_HERE
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
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

// Evolution API Configuration
const EVOLUTION_API_URL = 'http://localhost:8081';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'whatsapp-crm';

// Global değişkenler
let connectedSockets = new Set();
let whatsappStatus = 'disconnected';

// Evolution API Helper Functions
const evolutionAPI = {
    // HTTP header'ları
    getHeaders() {
        return {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json'
        };
    },

    // Instance durumunu kontrol et
    async getInstanceState() {
        try {
            const response = await axios.get(
                `${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`,
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error) {
            console.error('Instance state error:', error.message);
            return { instance: { state: 'closed' } };
        }
    },

    // Kişileri al
    async getContacts() {
        try {
            let contacts = [];
            
            // Evolution API v2.3.0'da doğru endpoint'ler
            try {
                // Önce contacts endpoint'ini dene
                const contactsResponse = await axios.post(
                    `${EVOLUTION_API_URL}/chat/findContacts/${INSTANCE_NAME}`,
                    {},
                    { headers: this.getHeaders() }
                );
                
                if (contactsResponse.data && Array.isArray(contactsResponse.data)) {
                    contacts = contactsResponse.data.map(contact => ({
                        id: contact.id,
                        name: contact.name || contact.pushName || contact.id.replace('@s.whatsapp.net', ''),
                        phone: contact.id.replace('@s.whatsapp.net', ''),
                        whatsappData: true,
                        profilePicUrl: contact.profilePicUrl || null
                    }));
                }
                
                // Eğer contact yok ise, chat'leri al (mesajlaştığın kişiler)
                if (contacts.length === 0) {
                    const chatsResponse = await axios.post(
                        `${EVOLUTION_API_URL}/chat/findChats/${INSTANCE_NAME}`,
                        {},
                        { headers: this.getHeaders() }
                    );
                    
                    if (chatsResponse.data && Array.isArray(chatsResponse.data)) {
                        contacts = chatsResponse.data
                            .filter(chat => chat.id.includes('@s.whatsapp.net')) // Sadece bireysel chat'ler
                            .map(chat => ({
                                id: chat.id,
                                name: chat.name || chat.pushName || chat.id.replace('@s.whatsapp.net', ''),
                                phone: chat.id.replace('@s.whatsapp.net', ''),
                                whatsappData: true,
                                lastMessage: chat.lastMessage ? chat.lastMessage.message : null
                            }));
                    }
                }
                
            } catch (err) {
                console.log('Contact/Chat endpoint hata:', err.message);
            }
            
            console.log(`📞 ${contacts.length} kişi/chat bulundu`);
            return contacts;
        } catch (error) {
            console.error('Contacts error:', error.message);
            return [];
        }
    },

    // Mesaj gönder
    async sendMessage(number, text) { // message'ı text olarak değiştirdim
        try {
            console.log(`📤 Evolution API'ye gönderiliyor: Numarası: ${number}, Mesaj: ${text}`);
            const response = await axios.post(
                `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
                {
                    number: number,
                    text: text, // message yerine text
                    options: {
                        delay: 1200,
                        presence: 'composing'
                    }
                },
                { headers: this.getHeaders() }
            );
            console.log('✅ Evolution API yanıtı:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Evolution API Mesaj Gönderim Hatası:', error.response ? error.response.data : error.message);
            return { success: false, error: error.message, data: error.response ? error.response.data : null };
        }
    },

    // Grupları al
    async getGroups() {
        try {
            // Evolution API'de grup endpoint'i farklı olabilir
            let groups = [];
            
            try {
                const groupsResponse = await axios.get(
                    `${EVOLUTION_API_URL}/group/findGroups/${INSTANCE_NAME}`,
                    { headers: this.getHeaders() }
                );
                
                if (groupsResponse.data && Array.isArray(groupsResponse.data)) {
                    groups = groupsResponse.data.map(group => ({
                        id: group.id,
                        name: group.subject || group.name,
                        participants: group.participants ? group.participants.length : 0,
                        whatsappData: true
                    }));
                }
            } catch (err) {
                console.log('Group endpoint çalışmadı:', err.message);
            }
            
            console.log(`👥 ${groups.length} grup bulundu`);
            return groups;
        } catch (error) {
            console.error('Groups error:', error.message);
            return [];
        }
    }
};

// Socket.IO bağlantıları
io.on('connection', (socket) => {
    console.log('🔗 Client bağlandı:', socket.id);
    connectedSockets.add(socket);

    // WhatsApp durumunu gönder
    socket.emit('status', { status: whatsappStatus });

    socket.on('disconnect', () => {
        console.log('❌ Client ayrıldı:', socket.id);
        connectedSockets.delete(socket);
    });

    // QR kod isteme (Evolution API'de artık gerek yok)
    socket.on('request-qr', async () => {
        const state = await evolutionAPI.getInstanceState();
        if (state.instance && state.instance.state === 'open') {
            socket.emit('whatsapp-ready');
            whatsappStatus = 'ready';
        } else {
            socket.emit('message', 'WhatsApp bağlantısı kapalı. Evolution API Manager\'dan yeniden bağlanın.');
        }
    });

    // Mesaj gönderme
    socket.on('send-message', async (data) => {
        console.log('📤 Mesaj gönderimi:', data);
        try {
            const result = await evolutionAPI.sendMessage(data.to, data.message);
            console.log('✅ Mesaj gönderim sonucu:', result);
            
            // Script.js'in beklediği format ile response gönder
            socket.emit('message_sent', {
                messageId: data.messageId,
                success: result.success || false,
                error: result.error || null,
                data: result
            });
        } catch (error) {
            console.error('❌ Mesaj gönderim hatası:', error);
            socket.emit('message_sent', {
                messageId: data.messageId,
                success: false,
                error: error.message
            });
        }
    });
});

// API Routes

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        evolution_api: 'Connected',
        instance: INSTANCE_NAME,
        timestamp: new Date().toISOString()
    });
});

// WhatsApp durumu
app.get('/whatsapp/status', async (req, res) => {
    const state = await evolutionAPI.getInstanceState();
    res.json(state);
});

// Kişileri al
app.get('/whatsapp/contacts', async (req, res) => {
    const contacts = await evolutionAPI.getContacts();
    res.json(contacts);
});

// Grupları al
app.get('/whatsapp/groups', async (req, res) => {
    const groups = await evolutionAPI.getGroups();
    res.json(groups);
});

// Mesaj gönder
app.post('/whatsapp/send', async (req, res) => {
    const { number, text } = req.body;
    console.log('📤 Server mesaj gönderim isteği:', { number, text });
    const result = await evolutionAPI.sendMessage(number, text);
    console.log('📱 Evolution API yanıtı:', result);
    res.json(result);
});

// WhatsApp durumunu periyodik kontrol et
setInterval(async () => {
    const state = await evolutionAPI.getInstanceState();
    const newStatus = state.instance && state.instance.state === 'open' ? 'ready' : 'disconnected';
    
    if (newStatus !== whatsappStatus) {
        whatsappStatus = newStatus;
        console.log('📱 WhatsApp durumu:', whatsappStatus);
        
        // Tüm client'lara durum gönder
        connectedSockets.forEach(socket => {
            socket.emit('status', { status: whatsappStatus });
            if (whatsappStatus === 'ready') {
                socket.emit('whatsapp-ready');
            }
        });
    }
}, 5000); // 5 saniyede bir kontrol

// Server başlat
const PORT = process.env.PORT || 3025;
server.listen(PORT, () => {
    console.log('🚀 WhatsApp CRM + Evolution API Server başlatıldı!');
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔗 Evolution API: ${EVOLUTION_API_URL}`);
    console.log(`📱 Instance: ${INSTANCE_NAME}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

module.exports = { app, server, io }; 