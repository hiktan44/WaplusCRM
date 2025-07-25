# WhatsApp CRM Kurulum Rehberi

## Gereksinimler
- Node.js (v16 veya üzeri)
- npm (v8 veya üzeri)
- Chrome/Chromium tarayıcı (Puppeteer için)

## Kurulum Adımları

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. WhatsApp Sunucusunu Başlat
```bash
npm start
```

Veya geliştirme modu için:
```bash
npm run dev
```

### 3. Web Arayüzünü Aç
1. Tarayıcınızda `index.html` dosyasını açın
2. Veya basit bir HTTP sunucu çalıştırın:
```bash
# Python 3
python -m http.server 8080

# Node.js (http-server gerekli)
npx http-server -p 8080
```

### 4. WhatsApp Bağlantısı

1. **WhatsApp'a Bağlan** butonuna tıklayın
2. QR kod görüntülenecek
3. WhatsApp mobil uygulamanızı açın:
   - Android: ⋮ menü → Bağlı Cihazlar → Cihaz Bağla
   - iPhone: Ayarlar → Bağlı Cihazlar → Cihaz Bağla
4. QR kodu telefonunuzla tarayın
5. Bağlantı onaylandığında sistem hazır olacak

## Sunucu Portları
- WhatsApp Server: `http://localhost:3025`
- Web Interface: `http://localhost:8080` (HTTP sunucu kullanıyorsanız)

## Özellikler

### Gerçek WhatsApp Entegrasyonu
- ✅ QR kod ile kimlik doğrulama
- ✅ Gerçek kişi listesi senkronizasyonu
- ✅ Grup listesi senkronizasyonu
- ✅ Gerçek mesaj gönderimi
- ✅ Medya dosyası gönderimi
- ✅ Toplu mesaj gönderimi
- ✅ Otomatik gecikme sistemi

### CRM Özellikleri
- 📊 İstatistikler ve analitik
- 📝 Mesaj şablonları
- 🤖 AI asistan
- 📡 Yayın listesi
- ⚙️ Otomasyon
- 📱 Responsive tasarım

## Sorun Giderme

### QR Kod Görünmüyor
1. Sunucunun çalıştığından emin olun (`npm start`)
2. Konsol loglarını kontrol edin
3. Port 3025'in boş olduğundan emin olun

### Bağlantı Hatası
```bash
# Sunucu durumunu kontrol et
curl http://localhost:3025/health
```

### WhatsApp Oturum Problemi
```bash
# .wwebjs_auth klasörünü sil ve yeniden başlat
rm -rf .wwebjs_auth
npm start
```

### Puppeteer Hatası
```bash
# Chrome/Chromium bağımlılıklarını yükle (Ubuntu/Debian)
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

## Güvenlik
- WhatsApp oturum bilgileri `.wwebjs_auth` klasöründe saklanır
- Bu klasörü güvenli tutun ve paylaşmayın
- Üretim ortamında CORS ayarlarını sıkılaştırın

## Log Dosyaları
- Sunucu logları konsola yazdırılır
- Hata durumlarında konsol çıktısını kontrol edin

## Destek
Sorun yaşadığınızda:
1. Konsol loglarını kontrol edin
2. Sunucu durumunu kontrol edin (`/health` endpoint)
3. WhatsApp Web'in güncel olduğundan emin olun