const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3002;

const server = http.createServer((req, res) => {
    // Serve the HTML file
    if (req.url === '/' || req.url === '/qr-code-generator.html') {
        const filePath = path.join(__dirname, 'qr-code-generator.html');
        
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
    console.log(`🚀 WaPlus CRM QR Code Sistemi çalışıyor!`);
    console.log(`📱 QR Code Arayüzü: http://localhost:${port}`);
    console.log(`🌐 LAN Erişim: http://192.168.1.x:${port} (IP'nizi kontrol edin)`);
    console.log(`\n💡 Kullanım:`);
    console.log(`   1. Instance Name: hairchiefs-wa`);
    console.log(`   2. API Base URL: http://localhost:8080`);
    console.log(`   3. API Key: 429683C4C977415CAAFCCE10F7D57E11`);
    console.log(`   4. "Instance Oluştur" butonuna tıklayın`);
    console.log(`   5. QR kodu WhatsApp ile tarayın`);
    console.log(`\n🎯 Bağlantı kurduktan sonra: http://localhost:3001`);
    console.log(`\n✅ Simple WhatsApp API Server çalışıyor!`);
});