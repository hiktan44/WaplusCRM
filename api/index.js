const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WhatsApp clients storage
const clients = new Map();

// Serve static files
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>WaPlus CRM - HAIRCHIEFS</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>.gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }</style>
        </head>
        <body class="bg-gray-50">
            <div class="container mx-auto px-6 py-8">
                <div class="gradient-bg text-white rounded-xl p-8 text-center">
                    <h1 class="text-4xl font-bold mb-4">🚀 WaPlus CRM</h1>
                    <p class="text-xl mb-6">HAIRCHIEFS Toplu WhatsApp Mesaj Sistemi</p>
                    <p class="text-lg">API Status: <span class="text-green-300 font-bold">✅ RUNNING</span></p>
                    <p class="text-sm mt-2">Active Instances: ${Array.from(clients.keys()).length}</p>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6 mt-8">
                    <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                        <div class="text-4xl mb-4">📱</div>
                        <h2 class="text-xl font-semibold mb-4">1. WhatsApp QR Code</h2>
                        <p class="text-gray-600 mb-4">WhatsApp hesabınızı bağlayın</p>
                        <a href="/qr" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 inline-block">QR Kod Sayfası</a>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6 text-center">
                        <div class="text-4xl mb-4">💌</div>
                        <h2 class="text-xl font-semibold mb-4">2. Toplu Mesaj</h2>
                        <p class="text-gray-600 mb-4">HAIRCHIEFS şablonları ile mesaj gönderin</p>
                        <a href="/bulk" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200 inline-block">Toplu Mesaj Gönder</a>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-lg p-6 mt-8">
                    <h2 class="text-xl font-semibold mb-4">🔧 API Info</h2>
                    <div class="grid md:grid-cols-3 gap-4 text-sm">
                        <div><strong>Server:</strong> ${req.get('host')}</div>
                        <div><strong>Platform:</strong> Vercel</div>
                        <div><strong>Version:</strong> v1.0.0</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Serve QR Code page
app.get('/qr', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>WhatsApp QR Kod Bağlantısı - HAIRCHIEFS</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-gray-50 min-h-screen">
            <div class="container mx-auto px-4 py-8">
                <div class="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
                    <div class="text-center mb-8">
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">📱 WhatsApp Bağlantısı</h1>
                        <p class="text-gray-600">HAIRCHIEFS CRM sisteminize WhatsApp hesabınızı bağlayın</p>
                    </div>

                    <div class="space-y-6">
                        <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm text-blue-700">
                                        QR kodu oluşturmak için önce bir WhatsApp instance oluşturmanız gerekiyor.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Instance Adı</label>
                                <input type="text" id="instanceName" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                       placeholder="hairchiefs-wa" value="hairchiefs-wa">
                            </div>
                            
                            <button onclick="createInstance()" class="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition duration-200 font-medium">
                                🚀 WhatsApp Instance Oluştur
                            </button>
                        </div>

                        <div id="qrContainer" class="hidden text-center p-6 bg-gray-50 rounded-lg">
                            <h3 class="text-lg font-medium text-gray-800 mb-4">QR Kodunu Telefonunuzla Tarayın</h3>
                            <div id="qrCode" class="mb-4"></div>
                            <p class="text-sm text-gray-600">WhatsApp > Menü > Bağlı Cihazlar > Cihaz Bağla</p>
                        </div>

                        <div id="status" class="text-center p-4 rounded-lg hidden">
                            <p class="font-medium"></p>
                        </div>
                    </div>
                </div>
            </div>

            <script>
                let currentInstance = null;
                let checkInterval = null;

                async function createInstance() {
                    const instanceName = document.getElementById('instanceName').value;
                    if (!instanceName) {
                        alert('Lütfen instance adı girin!');
                        return;
                    }

                    try {
                        const response = await fetch('/instance/create', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({instanceName})
                        });

                        const data = await response.json();
                        
                        if (response.ok) {
                            currentInstance = instanceName;
                            showStatus('Instance oluşturuluyor... QR kod bekleniyor...', 'blue');
                            checkQRCode();
                        } else {
                            showStatus('Hata: ' + data.error, 'red');
                        }
                    } catch (error) {
                        showStatus('Bağlantı hatası: ' + error.message, 'red');
                    }
                }

                async function checkQRCode() {
                    if (!currentInstance) return;

                    try {
                        const response = await fetch(\`/instance/connect/\${currentInstance}\`);
                        const data = await response.json();

                        if (data.base64) {
                            document.getElementById('qrCode').innerHTML = \`<img src="\${data.base64}" class="mx-auto max-w-xs">\`;
                            document.getElementById('qrContainer').classList.remove('hidden');
                            showStatus('QR kodu hazır! Telefonunuzla tarayın.', 'green');
                        } else if (data.status === 'connected') {
                            document.getElementById('qrContainer').classList.add('hidden');
                            showStatus('✅ WhatsApp başarıyla bağlandı!', 'green');
                            if (checkInterval) clearInterval(checkInterval);
                            setTimeout(() => {
                                window.location.href = '/bulk';
                            }, 2000);
                            return;
                        }

                        checkInterval = setTimeout(checkQRCode, 3000);
                    } catch (error) {
                        showStatus('QR kod kontrol hatası: ' + error.message, 'red');
                    }
                }

                function showStatus(message, color) {
                    const status = document.getElementById('status');
                    status.classList.remove('hidden');
                    status.className = \`text-center p-4 rounded-lg bg-\${color}-50 text-\${color}-800 border border-\${color}-200\`;
                    status.querySelector('p').textContent = message;
                }
            </script>
        </body>
        </html>
    `);
});

// Serve Bulk Message page
app.get('/bulk', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>HAIRCHIEFS Toplu Mesaj Sistemi</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
        </head>
        <body class="bg-gray-50 min-h-screen">
            <div class="container mx-auto px-4 py-8">
                <div class="max-w-4xl mx-auto">
                    <div class="bg-white rounded-xl shadow-lg p-8">
                        <div class="text-center mb-8">
                            <h1 class="text-3xl font-bold text-gray-800 mb-2">💌 HAIRCHIEFS Toplu Mesaj</h1>
                            <p class="text-gray-600">Profesyonel şablonlarla toplu WhatsApp mesajı gönderin</p>
                        </div>

                        <div class="grid md:grid-cols-2 gap-8">
                            <div>
                                <h2 class="text-xl font-semibold mb-4">📋 1. Kişi Listesi</h2>
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">CSV/Excel Dosyası Yükle</label>
                                        <input type="file" id="fileInput" accept=".csv,.xlsx,.xls" 
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <p class="text-xs text-gray-500 mt-1">Dosya formatı: name,phone (örn: Ahmet Yılmaz,905551234567)</p>
                                    </div>
                                    
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Manuel Giriş</label>
                                        <textarea id="manualInput" rows="4" 
                                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                  placeholder="Ahmet Yılmaz,905551234567&#10;Mehmet Demir,905559876543"></textarea>
                                    </div>
                                    
                                    <button onclick="loadContacts()" class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200">
                                        📝 Kişileri Yükle
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h2 class="text-xl font-semibold mb-4">💬 2. Mesaj Şablonu</h2>
                                <div class="space-y-4">
                                    <select id="templateSelect" onchange="selectTemplate()" 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="">Şablon Seçin...</option>
                                        <option value="partnership">🤝 Ortaklık Fırsatı</option>
                                        <option value="promotion">✂️ Saç Ekimi Promosyonu</option>
                                        <option value="consultation">👨‍⚕️ Ücretsiz Konsültasyon</option>
                                        <option value="success">⭐ Başarı Hikayesi</option>
                                    </select>
                                    
                                    <textarea id="messageTemplate" rows="8" 
                                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              placeholder="Mesaj şablonunu seçin veya kendiniz yazın..."></textarea>
                                    
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Gönderim Aralığı (saniye)</label>
                                        <input type="number" id="delayInput" value="3" min="1" max="30"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mt-8 p-4 bg-gray-50 rounded-lg">
                            <h3 class="text-lg font-semibold mb-2">📊 Durum</h3>
                            <div id="contactList" class="mb-4"></div>
                            <div id="progressContainer" class="hidden">
                                <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                    <div id="progressBar" class="bg-green-600 h-2.5 rounded-full" style="width: 0%"></div>
                                </div>
                                <p id="progressText" class="text-sm text-gray-600">Hazırlanıyor...</p>
                            </div>
                            <button id="sendButton" onclick="startSending()" disabled 
                                    class="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition duration-200 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed">
                                🚀 Mesaj Göndermeyi Başlat
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <script>
                const templates = {
                    partnership: \`💫 Merhaba {name}! ✨

🔥 HAIRCHIEFS'ten size ÖZEL fırsat! 

🎯 KUAFÖR ORTAKLIK PROGRAMI
✅ %20'ye varan komisyon oranı
✅ 50.000₺ kredi imkanı (6 taksit)
✅ 8 yıllık deneyim & 30.000+ başarılı işlem
✅ 4000 m² alan & modern teknoloji

📱 Detaylar için hemen arayın!
☎️ 0850 205 02 73

#HAIRCHIEFS #SaçEkimi #Ortaklık\`,

                    promotion: \`🌟 Merhaba {name}! 

✂️ HAIRCHIEFS ÖZEL KAMPANYA! 

🎁 SADECE BU AY:
✅ Saç ekiminde %25 indirim
✅ Ücretsiz saç analizi
✅ 12 ay garanti
✅ VIP transfer hizmeti

👨‍⚕️ 8 yıllık tecrübe ile 30.000+ memnun hasta!

📞 Randevu için hemen arayın:
☎️ 0850 205 02 73

#HAIRCHIEFS #SaçEkimi #Kampanya\`,

                    consultation: \`👋 Merhaba {name}!

👨‍⚕️ ÜCRETSIZ UZMAN KONSÜLTASYONU

🔬 HAIRCHIEFS'ten size özel:
✅ Saç dökülmesi analizi
✅ Kişisel tedavi planı
✅ 3D saç simülasyonu
✅ Fiyat bilgilendirme

🏥 30.000+ başarılı operasyon tecrübesi
⭐ 4.9 Google puanı ile güvenilir hizmet

📱 Hemen ücretsiz analiz için:
☎️ 0850 205 02 73

#HAIRCHIEFS #SaçAnalizi #ÜcretsizKonsültasyon\`,

                    success: \`🎉 Merhaba {name}!

⭐ HAIRCHIEFS BAŞARI HİKAYESİ

📈 8 yıllık tecrübemizle:
✅ 30.000+ memnun hasta
✅ %99 başarı oranı  
✅ 4.9 Google yorumu
✅ Doğal görünüm garantisi

💬 "Hayalindeki saçlara kavuştum!" 
- Memnun hastalarımızdan...

🏆 Türkiye'nin en güvenilir saç ekimi merkezi

📞 Siz de aramıza katılın:
☎️ 0850 205 02 73

#HAIRCHIEFS #BaşarıHikayesi #SaçEkimi\`
                };

                let contacts = [];
                let currentInstance = 'hairchiefs-wa';

                function selectTemplate() {
                    const templateKey = document.getElementById('templateSelect').value;
                    if (templateKey && templates[templateKey]) {
                        document.getElementById('messageTemplate').value = templates[templateKey];
                    }
                }

                function loadContacts() {
                    contacts = [];
                    
                    const fileInput = document.getElementById('fileInput');
                    const manualInput = document.getElementById('manualInput').value.trim();
                    
                    if (fileInput.files.length > 0) {
                        const file = fileInput.files[0];
                        const reader = new FileReader();
                        
                        reader.onload = function(e) {
                            try {
                                if (file.name.endsWith('.csv')) {
                                    parseCSV(e.target.result);
                                } else {
                                    parseExcel(e.target.result);
                                }
                            } catch (error) {
                                alert('Dosya okuma hatası: ' + error.message);
                            }
                        };
                        
                        if (file.name.endsWith('.csv')) {
                            reader.readAsText(file);
                        } else {
                            reader.readAsBinaryString(file);
                        }
                    } else if (manualInput) {
                        parseCSV(manualInput);
                    } else {
                        alert('Lütfen dosya yükleyin veya manuel olarak kişi girin!');
                    }
                }

                function parseCSV(csvText) {
                    const lines = csvText.trim().split('\\n');
                    contacts = [];
                    
                    lines.forEach(line => {
                        const [name, phone] = line.split(',').map(s => s.trim());
                        if (name && phone) {
                            contacts.push({name, phone});
                        }
                    });
                    
                    updateContactList();
                }

                function parseExcel(binaryStr) {
                    const workbook = XLSX.read(binaryStr, {type: 'binary'});
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const data = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                    
                    contacts = [];
                    data.forEach(row => {
                        if (row[0] && row[1]) {
                            contacts.push({name: row[0], phone: row[1]});
                        }
                    });
                    
                    updateContactList();
                }

                function updateContactList() {
                    const listElement = document.getElementById('contactList');
                    if (contacts.length > 0) {
                        listElement.innerHTML = \`<p class="text-green-600 font-medium">✅ \${contacts.length} kişi yüklendi</p>\`;
                        document.getElementById('sendButton').disabled = false;
                    } else {
                        listElement.innerHTML = '<p class="text-red-600">❌ Hiç kişi yüklenmedi</p>';
                        document.getElementById('sendButton').disabled = true;
                    }
                }

                async function startSending() {
                    const template = document.getElementById('messageTemplate').value;
                    const delay = parseInt(document.getElementById('delayInput').value);
                    
                    if (!template) {
                        alert('Lütfen mesaj şablonu seçin!');
                        return;
                    }

                    document.getElementById('progressContainer').classList.remove('hidden');
                    document.getElementById('sendButton').disabled = true;
                    
                    let sent = 0;
                    let failed = 0;

                    for (let i = 0; i < contacts.length; i++) {
                        const contact = contacts[i];
                        const personalizedMessage = template.replace('{name}', contact.name);
                        
                        try {
                            const response = await fetch(\`/message/sendText/\${currentInstance}\`, {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({
                                    number: contact.phone,
                                    text: personalizedMessage,
                                    delay: delay
                                })
                            });

                            if (response.ok) {
                                sent++;
                            } else {
                                failed++;
                            }
                        } catch (error) {
                            failed++;
                        }

                        const progress = ((i + 1) / contacts.length) * 100;
                        document.getElementById('progressBar').style.width = progress + '%';
                        document.getElementById('progressText').textContent = 
                            \`İlerleme: \${i + 1}/\${contacts.length} - Başarılı: \${sent}, Başarısız: \${failed}\`;
                        
                        if (i < contacts.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, delay * 1000));
                        }
                    }

                    document.getElementById('progressText').textContent = 
                        \`✅ Gönderim tamamlandı! Başarılı: \${sent}, Başarısız: \${failed}\`;
                    document.getElementById('sendButton').disabled = false;
                }
            </script>
        </body>
        </html>
    `);
});

// API Status
app.get('/api/status', (req, res) => {
    res.json({
        message: 'WaPlus CRM API Server',
        status: 'running',
        platform: 'Vercel',
        instances: Array.from(clients.keys()),
        version: '1.0.0'
    });
});

// Create instance
app.post('/instance/create', async (req, res) => {
    try {
        const { instanceName } = req.body;
        
        if (!instanceName) {
            return res.status(400).json({ error: 'instanceName is required' });
        }

        if (clients.has(instanceName)) {
            return res.status(409).json({ error: 'Instance already exists' });
        }

        // Create WhatsApp client
        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: instanceName
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
                    '--single-process',
                    '--disable-gpu'
                ]
            }
        });

        // Store client
        const instanceData = {
            client: client,
            status: 'initializing',
            qrCode: null,
            isReady: false
        };
        
        clients.set(instanceName, instanceData);

        // QR Code event
        client.on('qr', async (qr) => {
            try {
                const qrCodeDataURL = await qrcode.toDataURL(qr);
                instanceData.qrCode = qrCodeDataURL;
                instanceData.status = 'qr_generated';
                console.log(`QR Code generated for ${instanceName}`);
            } catch (err) {
                console.error('QR generation error:', err);
            }
        });

        // Ready event
        client.on('ready', () => {
            instanceData.status = 'connected';
            instanceData.isReady = true;
            console.log(`${instanceName} is ready!`);
        });

        // Disconnected event
        client.on('disconnected', (reason) => {
            instanceData.status = 'disconnected';
            instanceData.isReady = false;
            console.log(`${instanceName} disconnected:`, reason);
        });

        // Authentication failure
        client.on('auth_failure', (msg) => {
            instanceData.status = 'auth_failure';
            console.error(`Auth failure for ${instanceName}:`, msg);
        });

        // Initialize client
        await client.initialize();

        res.json({
            message: 'Instance created successfully',
            instanceName: instanceName,
            status: 'initializing'
        });

    } catch (error) {
        console.error('Instance creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get QR Code
app.get('/instance/connect/:instanceName', (req, res) => {
    try {
        const { instanceName } = req.params;
        const instanceData = clients.get(instanceName);

        if (!instanceData) {
            return res.status(404).json({ error: 'Instance not found' });
        }

        if (instanceData.status === 'connected') {
            return res.json({ 
                message: 'Instance already connected',
                status: 'connected'
            });
        }

        if (!instanceData.qrCode) {
            return res.json({ 
                message: 'QR code not ready yet',
                status: instanceData.status
            });
        }

        res.json({
            base64: instanceData.qrCode,
            status: instanceData.status
        });

    } catch (error) {
        console.error('QR code error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send text message
app.post('/message/sendText/:instanceName', async (req, res) => {
    try {
        const { instanceName } = req.params;
        const { number, text, delay } = req.body;

        const instanceData = clients.get(instanceName);
        if (!instanceData || !instanceData.isReady) {
            return res.status(400).json({ error: 'Instance not connected' });
        }

        if (!number || !text) {
            return res.status(400).json({ error: 'number and text are required' });
        }

        // Clean phone number
        let cleanNumber = number.replace(/[^\\d+]/g, '');
        if (!cleanNumber.includes('@c.us')) {
            if (cleanNumber.startsWith('+')) {
                cleanNumber = cleanNumber.substring(1);
            }
            cleanNumber = cleanNumber + '@c.us';
        }

        // Add delay if specified
        if (delay && delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay * 1000));
        }

        // Send message
        const message = await instanceData.client.sendMessage(cleanNumber, text);

        res.json({
            key: {
                remoteJid: cleanNumber,
                fromMe: true,
                id: message.id.id
            },
            message: {
                conversation: text
            },
            status: 'SUCCESS'
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ 
            error: error.message,
            status: 'ERROR'
        });
    }
});

// Get instance info
app.get('/instance/fetchInstances', (req, res) => {
    const instances = Array.from(clients.entries()).map(([name, data]) => ({
        instanceName: name,
        status: data.status,
        serverUrl: `https://${req.get('host')}`,
        apikey: '429683C4C977415CAAFCCE10F7D57E11'
    }));

    res.json(instances);
});

// Delete instance
app.delete('/instance/delete/:instanceName', async (req, res) => {
    try {
        const { instanceName } = req.params;
        const instanceData = clients.get(instanceName);

        if (!instanceData) {
            return res.status(404).json({ error: 'Instance not found' });
        }

        // Destroy client
        if (instanceData.client) {
            await instanceData.client.destroy();
        }

        // Remove from storage
        clients.delete(instanceName);

        res.json({
            message: 'Instance deleted successfully'
        });

    } catch (error) {
        console.error('Delete instance error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;