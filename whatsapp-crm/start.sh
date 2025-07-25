#!/bin/bash

# WhatsApp CRM Başlatma Scripti

echo "🚀 WhatsApp CRM Sistemi Başlatılıyor..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Node.js ve NPM versiyonlarını kontrol et
echo "📋 Sistem Kontrolleri:"
echo "   Node.js versiyon: $(node --version)"
echo "   NPM versiyon: $(npm --version)"
echo ""

# Bağımlılıkların yüklü olup olmadığını kontrol et
if [ ! -d "node_modules" ]; then
    echo "📦 Bağımlılıklar yükleniyor..."
    npm install
    echo ""
fi

# Port kontrolü
if lsof -Pi :3025 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3025 kullanımda. Önceki süreci kapatıyor..."
    lsof -ti:3025 | xargs kill -9
    sleep 2
fi

echo "🔧 WhatsApp CRM Server başlatılıyor..."
echo "   Port: 3025"
echo "   URL: http://localhost:3025"
echo ""
echo "📱 Kullanım:"
echo "   1. Tarayıcıda http://localhost:3025 adresine gidin"
echo "   2. 'WhatsApp'a Bağlan' butonuna tıklayın"
echo "   3. QR kodu telefonunuzla tarayın"
echo ""
echo "🛑 Sunucuyu durdurmak için: Ctrl+C"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Sunucuyu başlat
node whatsapp-server.js