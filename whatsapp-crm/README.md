# WhatsApp CRM Sistemi

Modern WhatsApp tabanlı müşteri ilişkileri yönetim sistemi. Gerçek WhatsApp Web entegrasyonu ile toplu mesaj gönderimi, kişi yönetimi ve AI asistan özellikleri.

## 🚀 Özellikler

### 📱 **Gerçek WhatsApp Web Entegrasyonu**
- QR kod ile WhatsApp Web bağlantısı
- Otomatik kişi ve grup senkronizasyonu
- Gerçek zamanlı mesaj gönderimi
- Oturum kalıcılığı

### 📊 Dashboard
- Gerçek zamanlı istatistikler
- Mesaj gönderim trendi grafikleri
- Son aktiviteler takibi
- Performans metrikleri

### 📋 Kişi Yönetimi
- WhatsApp kişilerinden otomatik çekme
- Grup bazlı organizasyon
- Arama ve filtreleme
- Toplu işlemler

### 📤 Toplu Gönderim (Bulk Sender)
- **Alıcı Seçenekleri:**
  - Tüm kişilere gönderim
  - Grup bazlı seçim
  - Özel kişi seçimi
  
- **Mesaj Özellikleri:**
  - Şablon kullanımı
  - Değişken desteği (`{isim}`, `{telefon}`, `{tarih}`)
  - Medya ekleme (resim, video, dosya)
  - Zamanlanmış gönderim
  
- **Gönderim Kontrolü:**
  - Akıllı gecikme sistemi
  - Mesaj önizleme
  - İlerleme takibi

### 🤖 AI Asistan
- Otomatik müşteri yanıtları
- Randevu yönetimi
- Mesaj buffer sistemi
- RAG tabanlı bilgi bankası

### 📝 Şablon Sistemi
- Hazır mesaj şablonları
- Kategori bazlı organizasyon
- Değişken desteği
- Kullanım istatistikleri

### 📈 Analitik
- Gönderim raporları
- Başarı oranları
- Performans analizi

## 🛠️ Teknolojiler

- **Backend:** Node.js, Express.js
- **WhatsApp:** WhatsApp Web.js
- **Real-time:** Socket.IO
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Database:** LocalAuth (sessions)

## 📁 Dosya Yapısı

```
whatsapp-crm/
├── index.html          # Ana arayüz
├── styles.css          # CSS stilleri
├── script.js           # Frontend JavaScript
├── whatsapp-server.js  # WhatsApp Web.js sunucusu
├── ai-assistant.js     # AI asistan modülü
├── package.json        # Node.js bağımlılıkları
└── README.md           # Proje dokümantasyonu
```

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js (v16+)
- NPM (v8+)
- Modern web tarayıcısı

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. Sunucuyu Başlat
```bash
npm start

# Veya geliştirme modu için
npm run dev
```

### 3. WhatsApp Bağlantısı
1. `index.html` dosyasını tarayıcınızda açın
2. **"WhatsApp'a Bağlan"** butonuna tıklayın
3. QR kodu telefonunuzla tarayın:
   - WhatsApp → ⋮ → **Bağlı Cihazlar** → **Cihaz Bağla**
   - QR kodu tarayın

### 4. Bağlantıyı Test Et
```bash
npm test
```

## 💡 Kullanım Kılavuzu

### 1. WhatsApp'a Bağlanma
- Sağ üstteki "WhatsApp'a Bağlan" butonuna tıklayın
- Gerçek uygulamada QR kod ile WhatsApp Web bağlantısı kurulur

### 2. Kişi Ekleme
- Sol menüden "Kişiler" sekmesine gidin
- "Kişi Ekle" butonuna tıklayın
- Gerekli bilgileri doldurun ve kaydedin

### 3. Toplu Mesaj Gönderimi
- "Toplu Gönderim" sekmesine gidin
- Alıcıları seçin (Tümü/Grup/Özel)
- Mesajınızı yazın veya şablon seçin
- Medya ekleyin (opsiyonel)
- Gönderim ayarlarını yapın
- "Önizleme" ile kontrol edin
- "Gönder" butonuna tıklayın

### 4. Şablon Oluşturma
- "Şablonlar" sekmesine gidin
- "Yeni Şablon" butonuna tıklayın
- Şablon içeriğini oluşturun
- Değişkenleri kullanın: `{isim}`, `{telefon}`, `{tarih}`

## 🎯 Değişkenler

Mesajlarınızda aşağıdaki değişkenleri kullanabilirsiniz:

- `{isim}` - Kişinin adı
- `{telefon}` - Telefon numarası
- `{tarih}` - Bugünün tarihi

**Örnek:**
```
Merhaba {isim}! 
Özel indirim fırsatımızdan yararlanmak için 
{telefon} numarasından bizi arayabilirsiniz.
Kampanya {tarih} tarihine kadar geçerlidir.
```

## ⚙️ Gönderim Ayarları

### Gönderim Hızı
- **Normal:** 1 mesaj/saniye
- **Yavaş:** 1 mesaj/2 saniye (daha güvenli)
- **Hızlı:** 2 mesaj/saniye

### Güvenlik Özellikleri
- Rastgele gecikme ekleme
- Anti-spam koruması
- Gönderim limitleri

## 🎨 Tasarım Özellikleri

- **Responsive:** Tüm cihazlarda uyumlu
- **WhatsApp Teması:** Resmi WhatsApp renkleri
- **Modern UI:** Kullanıcı dostu arayüz
- **Animasyonlar:** Smooth geçişler
- **Dark Mode:** Yakında gelecek

## 🔒 Güvenlik

- XSS koruması
- CSRF koruması
- Veri validasyonu
- Güvenli dosya yükleme

## 📱 Responsive Tasarım

- **Desktop:** Full özellik desteği
- **Tablet:** Optimize edilmiş layout
- **Mobile:** Touch-friendly arayüz

## 🐛 Bilinen Sorunlar

- Gerçek WhatsApp API entegrasyonu gerekiyor
- Dosya yükleme boyut limiti: 16MB
- Safari'de bazı CSS özellikleri farklı görünebilir

## 🔄 Gelecek Güncellemeler

- [ ] WhatsApp Business API entegrasyonu
- [ ] Gerçek zamanlı mesaj durumu takibi
- [ ] Excel/CSV import/export
- [ ] Dark mode desteği
- [ ] Multi-language desteği
- [ ] Advanced analytics
- [ ] Webhook desteği
- [ ] Chatbot entegrasyonu

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Branch'i push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakınız.

## 📞 İletişim

- **Email:** info@example.com
- **Website:** https://example.com
- **GitHub:** https://github.com/username/whatsapp-crm

## 🙏 Teşekkürler

- WhatsApp resmi tasarım kılavuzu
- Font Awesome icon library
- Open source topluluğu

---

**⚠️ Önemli Not:** Bu uygulama WhatsApp'ın resmi API'sini kullanmamaktadır. Gerçek kullanım için WhatsApp Business API entegrasyonu gereklidir. WhatsApp'ın kullanım şartlarına uygun olarak kullanın.