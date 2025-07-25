#!/usr/bin/env node

// WhatsApp CRM Connection Test Script
const axios = require('axios').default || require('axios');
const { io } = require('socket.io-client');

console.log('🧪 WhatsApp CRM Bağlantı Testi');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const SERVER_URL = 'http://localhost:3025';

async function testServerConnection() {
    console.log('\n📡 1. Sunucu HTTP Bağlantısı Testi...');
    
    try {
        const response = await axios.get(`${SERVER_URL}/health`, { timeout: 5000 });
        console.log('   ✅ HTTP Bağlantısı: Başarılı');
        console.log(`   📊 Sunucu Durumu: ${response.data.status}`);
        console.log(`   📱 WhatsApp Durumu: ${response.data.whatsapp}`);
        console.log(`   ⏱️  Çalışma Süresi: ${Math.floor(response.data.uptime)} saniye`);
        return true;
    } catch (error) {
        console.log('   ❌ HTTP Bağlantısı: Başarısız');
        console.log(`   🔍 Hata: ${error.message}`);
        console.log('   💡 Çözüm: "npm start" komutu ile sunucuyu başlatın');
        return false;
    }
}

async function testSocketConnection() {
    console.log('\n🔌 2. Socket.IO Bağlantısı Testi...');
    
    return new Promise((resolve) => {
        const socket = io(SERVER_URL, {
            timeout: 5000,
            transports: ['websocket', 'polling']
        });

        const timeout = setTimeout(() => {
            console.log('   ❌ Socket.IO Bağlantısı: Zaman Aşımı');
            console.log('   💡 Çözüm: Sunucunun çalıştığından ve port 3025\'in açık olduğundan emin olun');
            socket.disconnect();
            resolve(false);
        }, 5000);

        socket.on('connect', () => {
            clearTimeout(timeout);
            console.log('   ✅ Socket.IO Bağlantısı: Başarılı');
            console.log(`   🆔 Socket ID: ${socket.id}`);
            
            // Test QR request
            socket.emit('request_qr');
            
            setTimeout(() => {
                socket.disconnect();
                resolve(true);
            }, 1000);
        });

        socket.on('qr', (qr) => {
            console.log('   📱 QR Kod Alındı: Hazır');
        });

        socket.on('ready', () => {
            console.log('   🎉 WhatsApp: Bağlı ve Hazır');
        });

        socket.on('connect_error', (error) => {
            clearTimeout(timeout);
            console.log('   ❌ Socket.IO Bağlantısı: Bağlantı Hatası');
            console.log(`   🔍 Hata: ${error.message}`);
            resolve(false);
        });
    });
}

async function runTests() {
    console.log('🚀 Test başlatılıyor...\n');
    
    const httpTest = await testServerConnection();
    if (!httpTest) {
        console.log('\n❌ HTTP bağlantısı başarısız. Socket.IO testi atlanıyor.');
        process.exit(1);
    }
    
    const socketTest = await testSocketConnection();
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Test Sonuçları:');
    console.log(`   HTTP Sunucu: ${httpTest ? '✅ Çalışıyor' : '❌ Başarısız'}`);
    console.log(`   Socket.IO: ${socketTest ? '✅ Çalışıyor' : '❌ Başarısız'}`);
    
    if (httpTest && socketTest) {
        console.log('\n🎉 Tüm testler başarılı! WhatsApp CRM sistemi kullanıma hazır.');
        console.log('💻 Web arayüzü: index.html dosyasını tarayıcınızda açın');
        console.log('📱 WhatsApp bağlantısı: "WhatsApp\'a Bağlan" butonuna tıklayın');
    } else {
        console.log('\n⚠️  Bazı testler başarısız. Lütfen sorunları çözün ve tekrar deneyin.');
        console.log('🔧 Yardım için SETUP.md dosyasına bakın');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Error handling
process.on('unhandledRejection', (error) => {
    console.log('\n❌ Beklenmeyen hata:', error.message);
    process.exit(1);
});

// Run tests
runTests().catch((error) => {
    console.error('\n❌ Test hatası:', error.message);
    process.exit(1);
});