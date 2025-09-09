const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3001;

const server = http.createServer((req, res) => {
    // Serve the HTML file
    if (req.url === '/' || req.url === '/bulk-message-sender.html') {
        const filePath = path.join(__dirname, 'bulk-message-sender.html');
        
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server Error');
                return;
            }
            
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
        });
        return;
    }

    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(port, () => {
    console.log(`🚀 WaPlus CRM Toplu Mesaj Sistemi çalışıyor!`);
    console.log(`📱 Toplu Mesaj Arayüzü: http://localhost:${port}`);
    console.log(`🌐 LAN Erişim: http://192.168.1.x:${port} (IP'nizi kontrol edin)`);
    console.log(`\n💡 Kullanım:`);
    console.log(`   1. Instance Name: hairchiefs-wa (QR ile bağladığınız)`);
    console.log(`   2. API Base URL: http://localhost:8080`);
    console.log(`   3. API Key: 429683C4C977415CAAFCCE10F7D57E11`);
    console.log(`   4. "Bağlantıyı Test Et" butonuna tıklayın`);
    console.log(`   5. CSV/Excel yükleyin veya manuel numara girin`);
    console.log(`   6. HAIRCHIEFS şablonunu seçin`);
    console.log(`   7. Toplu mesaj gönderin`);
    console.log(`\n🎯 HAIRCHIEFS şablonları "Hazır Şablonlar" menüsünde!`);
    console.log(`\n✅ WhatsApp API Server çalışıyor!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🔄 Sunucu kapatılıyor...');
    server.close(() => {
        console.log('✅ Sunucu başarıyla kapatıldı.');
        process.exit(0);
    });
});