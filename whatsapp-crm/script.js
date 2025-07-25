// WhatsApp CRM Application
class WhatsAppCRM {
    constructor() {
        this.contacts = [
            // Başlangıç kişileri - gerçek kullanım için silebilirsiniz
            {
                id: '1',
                name: 'Test Kişi 1',
                phone: '+90 555 123 4567',
                email: 'test1@example.com',
                group: 'Müşteri',
                status: 'active',
                notes: 'Örnek kişi',
                createdAt: new Date().toISOString(),
                whatsappData: false
            },
            {
                id: '2', 
                name: 'Test Kişi 2',
                phone: '+90 555 234 5678',
                email: 'test2@example.com',
                group: 'Potansiyel',
                status: 'active',
                notes: 'Örnek kişi',
                createdAt: new Date().toISOString(),
                whatsappData: false
            }
        ];
        this.templates = [];
        this.selectedContacts = [];
        this.isConnected = false;
        this.currentSection = 'dashboard';
        this.whatsappClient = null;
        this.socket = null;
        this.qrCode = null;
        this.connectionStatus = 'disconnected';
        this.serverUrl = 'http://localhost:3025'; // WhatsApp Web.js server URL
        
        this.init();
        this.initializeWhatsAppConnection();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.setupModals();
        this.renderDashboard();
        this.loadSettings();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.navigateToSection(section);
            });
        });

        // Header actions
        document.getElementById('connectWhatsApp')?.addEventListener('click', () => {
            this.showQRModal();
        });

        // Bulk sender actions
        document.getElementById('previewMessage')?.addEventListener('click', () => {
            this.previewMessage();
        });

        document.getElementById('sendBulkMessage')?.addEventListener('click', () => {
            this.sendBulkMessage();
        });

        // Contact management
        document.getElementById('addContact')?.addEventListener('click', () => {
            this.showContactModal();
        });

        document.getElementById('saveContact')?.addEventListener('click', () => {
            this.saveContact();
        });

        document.getElementById('cancelContact')?.addEventListener('click', () => {
            this.hideContactModal();
        });

        // Template management
        document.getElementById('createTemplate')?.addEventListener('click', () => {
            this.showTemplateModal();
        });

        // Recipient type changes
        document.querySelectorAll('input[name="recipientType"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateRecipientSelection();
            });
        });

        // Manual contact entry
        document.getElementById('addManualContact')?.addEventListener('click', () => {
            this.addManualContact();
        });

        // Settings tab navigation
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchSettingsTab(e.target.dataset.tab);
            });
        });

        // Save settings
        document.getElementById('saveGeneralSettings')?.addEventListener('click', () => {
            this.saveSettings('general');
        });

        document.getElementById('saveAPISettings')?.addEventListener('click', () => {
            this.saveSettings('api');
        });

        document.getElementById('saveMessageSettings')?.addEventListener('click', () => {
            this.saveSettings('messaging');
        });

        // WhatsApp sync
        document.getElementById('syncWhatsAppContacts')?.addEventListener('click', () => {
            this.syncWhatsAppContacts();
        });

        // File import
        document.getElementById('importContacts')?.addEventListener('click', () => {
            this.showImportModal();
        });

        // Message content changes
        const messageContent = document.getElementById('messageContent');
        if (messageContent) {
            messageContent.addEventListener('input', () => {
                this.updateCharCount();
            });
        }

        // Template selection
        const templateSelect = document.getElementById('templateSelect');
        if (templateSelect) {
            templateSelect.addEventListener('change', () => {
                this.loadTemplate();
            });
        }

        // Schedule toggle
        const scheduleCheckbox = document.getElementById('scheduleMessage');
        if (scheduleCheckbox) {
            scheduleCheckbox.addEventListener('change', () => {
                this.toggleScheduleInputs();
            });
        }

        // Media upload
        const mediaFile = document.getElementById('mediaFile');
        if (mediaFile) {
            mediaFile.addEventListener('change', () => {
                this.handleMediaUpload();
            });
        }

        // Contact search
        const contactSearch = document.getElementById('contactSearch');
        if (contactSearch) {
            contactSearch.addEventListener('input', () => {
                this.filterContacts();
            });
        }

        // Select all contacts
        const selectAllContacts = document.getElementById('selectAllContacts');
        if (selectAllContacts) {
            selectAllContacts.addEventListener('change', () => {
                this.toggleAllContacts();
            });
        }

        // Contact filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterContactsByType(e.target.dataset.filter);
            });
        });
    }

    setupNavigation() {
        // Set initial active section
        this.navigateToSection('dashboard');
    }

    setupModals() {
        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Close button handlers
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });
    }

    navigateToSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');

        this.currentSection = section;

        // Load section-specific data
        switch(section) {
            case 'contacts':
                this.renderContacts();
                break;
            case 'bulk-sender':
                this.renderBulkSender();
                break;
            case 'templates':
                this.renderTemplates();
                break;
        }
    }

    // Real WhatsApp Web Integration
    initializeWhatsAppConnection() {
        // Initialize Socket.IO connection to WhatsApp server
        try {
            this.socket = io(this.serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: 10000
            });

            this.socket.on('connect', () => {
                console.log('Connected to WhatsApp server');
            });

            // Gelen QR kodunu dinle
            this.socket.on('qr', (qr) => {
                console.log('✅ QR KODU ALINDI (socket)');
                this.handleQRCode(qr);
            });

            // Evolution API entegrasyonu için güncellenmiş event handler'lar
            this.socket.on('status', (data) => {
                console.log('📱 WhatsApp durumu:', data.status);
                if (data.status === 'ready') {
                    this.handleWhatsAppReady();
                } else if (data.status === 'disconnected') {
                    this.handleWhatsAppDisconnected();
                }
            });

            this.socket.on('whatsapp-ready', () => {
                console.log('✅ WhatsApp hazır! Evolution API bağlantısı aktif.');
                this.handleWhatsAppReady();
            });

            this.socket.on('message', (msg) => {
                console.log('💬 Server mesajı:', msg);
                this.showNotification(msg, 'info');
            });

            this.socket.on('auth_failure', (msg) => {
                console.error('❌ Kimlik doğrulama başarısız:', msg);
                this.showNotification('WhatsApp kimlik doğrulama başarısız: ' + msg, 'error');
                this.updateQRStatus('Kimlik doğrulama başarısız - QR kodu yeniden tarayın', 'error');
            });

            this.socket.on('disconnected', () => {
                this.handleWhatsAppDisconnected();
            });

            this.socket.on('contacts', (contacts) => {
                this.handleContactsReceived(contacts);
            });

            this.socket.on('groups', (groups) => {
                this.handleGroupsReceived(groups);
            });

            this.socket.on('message_sent', (result) => {
                this.handleMessageSent(result);
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                this.showNotification('WhatsApp sunucusuna bağlanılamadı.', 'error');
            });

        } catch (error) {
            console.error('WhatsApp initialization error:', error);
            this.showNotification('WhatsApp bağlantısı başlatılamadı. Lütfen sunucunun çalıştığından emin olun.', 'error');
        }
    }

    showQRModal() {
        const modal = document.getElementById('qrModal');
        if (modal) {
            modal.classList.add('active');
        }

        try {
            // Evolution API entegrasyonu için WhatsApp durumu kontrol et
            if (this.socket && this.socket.connected) {
                console.log('📡 Socket bağlı, QR kodu isteniyor...');
                this.socket.emit('request-qr');
                this.updateQRStatus('QR kodu bekleniyor...', 'loading');
            } else {
                console.log('❌ Socket bağlı değil!');
                this.showNotification('WhatsApp sunucusuna bağlanılamadı. Sunucuyu yeniden başlatın.', 'error');
                this.updateQRStatus('Sunucuya bağlanılamadı.', 'error');
            }
        } catch (error) {
            console.error('❌ WhatsApp bağlantısı kontrol edilirken hata:', error);
            this.showNotification('WhatsApp bağlantısı kontrol edilemedi: ' + error.message, 'error');
        }
    }

    hideQRModal() {
        const modal = document.getElementById('qrModal');
        modal.classList.remove('active');
    }

    // Gelen QR kod verisini işler ve modal içinde gösterir
    handleQRCode(qr) {
        // Gelen verinin geçerli bir string olup olmadığını kontrol et
        if (typeof qr !== 'string' || qr.length < 10) {
            console.error('❌ Geçersiz veya boş QR kod verisi alındı, işlem atlanıyor.', qr);
            this.showNotification('Geçersiz QR kod verisi alındı.', 'error');
            return;
        }

        console.log(`🔄 Geçerli QR kodu alindi, görüntü oluşturuluyor...`);
        const qrContainer = document.getElementById('qr-code-image');
        const qrInstructions = document.getElementById('qr-instructions');
        const qrModal = document.getElementById('qr-modal');

        // Önceki QR kodunu temizle
        qrContainer.innerHTML = '';

        try {
            // qrcode.js kütüphanesini kullanarak QR kodunu oluştur
            new QRCode(qrContainer, {
                text: qr,
                width: 256,
                height: 256,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });

            qrContainer.style.display = 'block';
            qrInstructions.innerText = 'Lütfen QR kodu telefonunuzla tarayın.';
        } catch (e) {
            console.error('QR kod oluşturulurken hata oluştu:', e);
            this.showNotification('QR kod oluşturulamadı.', 'error');
        }

        qrModal.classList.remove('hidden');
    }

    showTextQR(qr, qrDisplay) {
        console.log('🌐 Online QR servisini kullanıyor...');
        
        // Direkt QR kod image'ını göster
        qrDisplay.innerHTML = `
            <div class="qr-container" style="text-align: center;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qr)}" 
                     alt="WhatsApp QR Code" 
                     style="border: 2px solid #ddd; border-radius: 8px; margin-bottom: 15px;" />
                <div style="color: #666;">
                    <p><strong>QR Kodu Telefonunuzla Tarayın:</strong></p>
                    <p>1. WhatsApp uygulamasını açın</p>
                    <p>2. ⋮ (Menü) → <strong>Bağlı Cihazlar</strong></p>
                    <p>3. <strong>Cihaz Bağla</strong> → QR kodu tarayın</p>
                </div>
            </div>
        `;
        this.updateQRStatus('QR kodu görüntülendi', 'waiting');
    }

    refreshQRCode() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('request-qr');
            this.updateQRStatus('QR kod yenileniyor...', 'loading');
        }
    }

    updateQRStatus(message, status) {
        const statusElement = document.getElementById('qrStatus');
        const qrDisplay = document.getElementById('qrCodeDisplay');
        
        if (statusElement) {
            statusElement.innerHTML = `<i class="fas fa-qrcode"></i><span>${message}</span>`;
            
            // Update visual status
            statusElement.className = `qr-status ${status}`;
            qrDisplay.className = `qr-code ${status}`;
        }
    }

    handleWhatsAppReady() {
        this.isConnected = true;
        this.connectionStatus = 'connected';
        
        // Update UI
        const btn = document.getElementById('connectWhatsApp');
        const statusSpan = document.getElementById('connectionStatus');
        
        if (btn) {
            btn.classList.add('connected');
            btn.classList.remove('connecting', 'disconnected');
        }
        
        if (statusSpan) {
            statusSpan.textContent = 'Bağlandı';
        }

        // Hide QR modal
        this.hideQRModal();
        
        // Show success toast
        this.showConnectionToast('WhatsApp Web\'e başarıyla bağlandı!', 'success');
        
        // Request contacts and groups
        this.requestWhatsAppData();
    }

    handleWhatsAppDisconnected() {
        this.isConnected = false;
        this.connectionStatus = 'disconnected';
        
        // Update UI
        const btn = document.getElementById('connectWhatsApp');
        const statusSpan = document.getElementById('connectionStatus');
        
        if (btn) {
            btn.classList.add('disconnected');
            btn.classList.remove('connected', 'connecting');
        }
        
        if (statusSpan) {
            statusSpan.textContent = 'WhatsApp\'a Bağlan';
        }

        this.showNotification('WhatsApp bağlantısı kesildi.', 'warning');
    }

    showConnectionToast(message, type) {
        const toast = document.getElementById('connectionToast');
        const content = toast.querySelector('.toast-content span');
        
        if (content) content.textContent = message;
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    async requestWhatsAppData() {
        if (this.isConnected) {
            try {
                console.log('✅ WhatsApp bağlantısı hazır - Manuel kişi yönetimi aktif');
                
                // Evolution API endpoint'leri henüz çalışmadığı için manuel sistem kullan
                this.showNotification('WhatsApp bağlandı! Şimdi kişi ekleyebilir ve mesaj gönderebilirsiniz.', 'success');
                
                // Grupları boş array olarak ayarla (şimdilik)
                this.whatsappGroups = [];
                
                // UI'ı güncelle
                this.renderContacts();
                this.updateStats();
                
            } catch (error) {
                console.error('❌ WhatsApp verileri çekilirken hata:', error);
                this.showNotification('WhatsApp bağlandı ancak veri çekimde sorun var. Manuel kişi yönetimi kullanın.', 'warning');
            }
        }
    }

    handleContactsReceived(contacts) {
        console.log('Received contacts:', contacts.length);
        
        // Clear existing WhatsApp contacts
        this.contacts = this.contacts.filter(c => !c.whatsappData);
        
        // Add real WhatsApp contacts
        contacts.forEach(contact => {
            if (contact.name && contact.id._serialized) {
                this.contacts.push({
                    id: contact.id._serialized,
                    name: contact.name || contact.pushname || contact.number,
                    phone: contact.number,
                    email: '',
                    group: 'whatsapp-sync',
                    tags: ['WhatsApp'],
                    whatsappData: {
                        avatar: contact.profilePicUrl || '',
                        lastSeen: contact.lastSeen || 'Bilinmiyor',
                        synced: true,
                        isGroup: false,
                        serialized: contact.id._serialized
                    }
                });
            }
        });

        // Update UI
        this.renderContactsTable();
        this.updateContactsCount();
        
        this.showNotification(`${contacts.length} WhatsApp kişisi senkronize edildi.`, 'success');
    }

    handleGroupsReceived(groups) {
        console.log('Received groups:', groups.length);
        
        // Store WhatsApp groups
        this.whatsappGroups = groups.map(group => ({
            id: group.id._serialized,
            name: group.name,
            description: group.description || 'WhatsApp grubu',
            members: group.participants ? group.participants.length : 0,
            avatar: group.name.substring(0, 2).toUpperCase(),
            lastMessage: 'Az önce',
            canSendMessages: true, // Gerçek durumda admin kontrolü yapılacak
            whatsappData: {
                serialized: group.id._serialized,
                participants: group.participants || []
            }
        }));

        this.selectedWhatsAppGroups = [];
        
        this.showNotification(`${groups.length} WhatsApp grubu yüklendi.`, 'success');
    }

    handleMessageSent(result) {
        if (result.success) {
            console.log('Message sent successfully to:', result.to);
        } else {
            console.error('Failed to send message to:', result.to, result.error);
        }
    }

    // Override sync functions to use real data
    async syncWhatsAppContacts() {
        if (!this.isConnected) {
            this.showNotification('Önce WhatsApp Web\'e bağlanın.', 'warning');
            return;
        }

        const button = document.getElementById('syncWhatsAppContacts');
        const originalText = button.innerHTML;
        
        // Show loading state
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Senkronize ediliyor...';
        button.disabled = true;

        try {
            // Request real contacts from WhatsApp
            this.socket.emit('get_contacts');
            
            // Wait for response (will be handled by handleContactsReceived)
            await this.sleep(2000);

        } catch (error) {
            console.error('WhatsApp sync error:', error);
            this.showNotification('WhatsApp senkronizasyonu başarısız.', 'error');
        } finally {
            // Restore button
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    async loadWhatsAppGroups() {
        const groupsList = document.getElementById('whatsappGroupsList');
        if (!groupsList) return;

        // Show loading
        groupsList.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-spinner loading-icon"></i>
                WhatsApp grupları yükleniyor...
            </div>
        `;

        try {
            if (!this.isConnected) {
                groupsList.innerHTML = `
                    <div class="loading-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        WhatsApp'a bağlı değilsiniz.
                    </div>
                `;
                return;
            }

            // Request real groups from WhatsApp
            this.socket.emit('get_groups');
            
            // Wait a bit for response
            await this.sleep(1500);

            if (!this.whatsappGroups || this.whatsappGroups.length === 0) {
                groupsList.innerHTML = `
                    <div class="loading-message">
                        <i class="fas fa-info-circle"></i>
                        Hiç WhatsApp grubu bulunamadı.
                    </div>
                `;
                return;
            }

            this.renderWhatsAppGroups();

        } catch (error) {
            console.error('Groups loading error:', error);
            groupsList.innerHTML = `
                <div class="loading-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    Gruplar yüklenirken hata oluştu.
                </div>
            `;
        }
    }

    // REST API ile direkt mesaj gönderimi
    async sendSingleMessage(recipient, message) {
        try {
            // Check if sending is paused or stopped
            if (this.sendingPaused || this.sendingStopped) {
                throw new Error('Gönderim durduruldu');
            }

            let targetNumber;
            if (recipient.type === 'group') {
                throw new Error('Grup mesajları henüz desteklenmiyor');
            } else {
                // Clean phone number
                targetNumber = recipient.phone.replace(/[^\d]/g, '');
                if (!targetNumber.startsWith('90')) {
                    targetNumber = '90' + targetNumber;
                }
            }

            console.log('📤 Mesaj gönderiliyor:', targetNumber);

            // REST API'ye direkt POST request
            const response = await fetch(`${this.serverUrl}/whatsapp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    number: targetNumber,
                    text: message
                })
            });

            const result = await response.json();
            console.log('📱 Gönderim sonucu:', result);
            
            if (response.ok && result.success !== false) {
                return { success: true, data: result };
            } else {
                throw new Error(result.error || 'Mesaj gönderilemedi');
            }

        } catch (error) {
            console.error('❌ Mesaj gönderim hatası:', error);
            throw error;
        }
    }


    renderDashboard() {
        // Update stats with real data
        const stats = {
            totalContacts: this.contacts.length,
            totalTemplates: this.templates.length,
            whatsappGroups: this.whatsappGroups ? this.whatsappGroups.length : 0,
            connectionStatus: this.isConnected ? 'Bağlı' : 'Bağlantı Yok'
        };

        // Update dashboard stats in UI
        const totalContactsEl = document.querySelector('[data-stat="total-contacts"]');
        const totalTemplatesEl = document.querySelector('[data-stat="total-templates"]');
        const whatsappGroupsEl = document.querySelector('[data-stat="whatsapp-groups"]');
        const connectionStatusEl = document.querySelector('[data-stat="connection-status"]');

        if (totalContactsEl) totalContactsEl.textContent = stats.totalContacts;
        if (totalTemplatesEl) totalTemplatesEl.textContent = stats.totalTemplates;
        if (whatsappGroupsEl) whatsappGroupsEl.textContent = stats.whatsappGroups;
        if (connectionStatusEl) {
            connectionStatusEl.textContent = stats.connectionStatus;
            connectionStatusEl.className = this.isConnected ? 'status-connected' : 'status-disconnected';
        }
    }

    renderContacts() {
        const tbody = document.getElementById('contactsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.contacts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                            <i class="fas fa-users" style="font-size: 3rem; opacity: 0.3;"></i>
                            <div>
                                <h3 style="margin: 0; color: var(--text-primary);">Henüz kişi yok</h3>
                                <p style="margin: 0.5rem 0 0 0;">WhatsApp'a bağlanarak kişilerinizi senkronize edin veya manuel olarak kişi ekleyin</p>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-primary" onclick="crm.showQRModal()">
                                    <i class="fab fa-whatsapp"></i> WhatsApp'a Bağlan
                                </button>
                                <button class="btn btn-secondary" onclick="crm.showAddContactModal()">
                                    <i class="fas fa-plus"></i> Kişi Ekle
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        this.contacts.forEach(contact => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" data-contact-id="${contact.id}" ${this.selectedContacts.some(c => c.id === contact.id) ? 'checked' : ''}>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div class="contact-avatar">${contact.name.charAt(0)}</div>
                        <div>
                            <strong>${contact.name}</strong>
                            ${contact.notes ? `<div style="font-size: 0.8rem; color: var(--text-secondary);">${contact.notes}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td>${contact.phone}</td>
                <td>
                    <span class="group-badge">${this.getGroupName(contact.group)}</span>
                </td>
                <td>${contact.lastMessage}</td>
                <td>
                    <span class="status-badge ${contact.status}">${contact.status === 'active' ? 'Aktif' : 'Pasif'}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="crm.editContact(${contact.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="crm.deleteContact(${contact.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add event listeners for checkboxes
        tbody.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const contactId = parseInt(e.target.dataset.contactId);
                this.toggleContactSelection(contactId);
            });
        });
    }

    renderBulkSender() {
        this.renderContactSelector();
        this.updateSelectedCount();
    }

    renderContactSelector() {
        const contactList = document.getElementById('contactList');
        if (!contactList) return;

        contactList.innerHTML = '';

        this.contacts.forEach(contact => {
            const contactItem = document.createElement('div');
            contactItem.className = 'contact-item';
            contactItem.innerHTML = `
                <input type="checkbox" data-contact-id="${contact.id}" ${this.selectedContacts.some(c => c.id === contact.id) ? 'checked' : ''}>
                <div class="contact-avatar">${contact.name.charAt(0)}</div>
                <div class="contact-info">
                    <h4>${contact.name}</h4>
                    <p>${contact.phone} • ${this.getGroupName(contact.group)}</p>
                </div>
            `;

            contactList.appendChild(contactItem);
        });

        // Add event listeners
        contactList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const contactId = parseInt(e.target.dataset.contactId);
                this.toggleContactSelection(contactId);
            });
        });
    }

    renderTemplates() {
        const templatesGrid = document.querySelector('.templates-grid');
        if (!templatesGrid) return;

        templatesGrid.innerHTML = '';

        if (this.templates.length === 0) {
            templatesGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                        <i class="fas fa-file-alt" style="font-size: 4rem; opacity: 0.3;"></i>
                        <div>
                            <h3 style="margin: 0; color: var(--text-primary);">Henüz şablon yok</h3>
                            <p style="margin: 0.5rem 0 0 0;">Mesajlarınız için şablon oluşturun ve zamandan tasarruf edin</p>
                        </div>
                        <button class="btn btn-primary" onclick="crm.showAddTemplateModal()">
                            <i class="fas fa-plus"></i> İlk Şablonunuzu Oluşturun
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        this.templates.forEach(template => {
            const templateCard = document.createElement('div');
            templateCard.className = 'template-card fade-in';
            templateCard.innerHTML = `
                <div class="template-header">
                    <div>
                        <h3>${template.name}</h3>
                        <small>Kategori: ${this.getCategoryName(template.category)}</small>
                    </div>
                    <div class="template-actions">
                        <button class="action-btn edit" onclick="crm.editTemplate(${template.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="crm.deleteTemplate(${template.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="template-content">
                    ${template.content}
                </div>
                <div class="template-meta">
                    <span>Oluşturulma: ${template.createdAt}</span>
                    <span>Kullanım: ${template.usageCount} kez</span>
                </div>
            `;
            templatesGrid.appendChild(templateCard);
        });
    }

    toggleContactSelection(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (!contact) return;

        const index = this.selectedContacts.findIndex(c => c.id === contactId);
        if (index > -1) {
            this.selectedContacts.splice(index, 1);
        } else {
            this.selectedContacts.push(contact);
        }

        this.updateSelectedCount();
    }

    toggleAllContacts() {
        const selectAll = document.getElementById('selectAllContacts');
        const checkboxes = document.querySelectorAll('#contactsTableBody input[type="checkbox"]');

        if (selectAll.checked) {
            this.selectedContacts = [...this.contacts];
            checkboxes.forEach(cb => cb.checked = true);
        } else {
            this.selectedContacts = [];
            checkboxes.forEach(cb => cb.checked = false);
        }

        this.updateSelectedCount();
    }

    updateSelectedCount() {
        const countElement = document.getElementById('selectedCount');
        if (countElement) {
            countElement.textContent = this.selectedContacts.length;
        }
    }

    updateRecipientSelection() {
        const recipientType = document.querySelector('input[name="recipientType"]:checked')?.value;
        const contactSelector = document.getElementById('contactSelector');
        const manualEntry = document.getElementById('manualEntry');
        const whatsappGroupsSelector = document.getElementById('whatsappGroupsSelector');

        // Hide all sections first
        if (contactSelector) contactSelector.style.display = 'none';
        if (manualEntry) manualEntry.style.display = 'none';
        if (whatsappGroupsSelector) whatsappGroupsSelector.style.display = 'none';

        switch(recipientType) {
            case 'all':
                this.selectedContacts = [...this.contacts];
                break;
            case 'groups':
                if (contactSelector) contactSelector.style.display = 'block';
                this.showGroupSelector();
                break;
            case 'whatsapp-groups':
                if (whatsappGroupsSelector) whatsappGroupsSelector.style.display = 'block';
                this.loadWhatsAppGroups();
                break;
            case 'custom':
                if (contactSelector) contactSelector.style.display = 'block';
                this.renderContactSelector();
                break;
            case 'manual':
                if (manualEntry) manualEntry.style.display = 'block';
                this.selectedContacts = [];
                break;
        }

        this.updateSelectedCount();
    }

    showGroupSelector() {
        const contactList = document.getElementById('contactList');
        if (!contactList) return;

        const groups = [...new Set(this.contacts.map(c => c.group))];
        contactList.innerHTML = '';

        groups.forEach(group => {
            const groupItem = document.createElement('div');
            groupItem.className = 'contact-item';
            groupItem.innerHTML = `
                <input type="checkbox" data-group="${group}" checked>
                <div class="contact-avatar">
                    <i class="fas fa-users"></i>
                </div>
                <div class="contact-info">
                    <h4>${this.getGroupName(group)}</h4>
                    <p>${this.contacts.filter(c => c.group === group).length} kişi</p>
                </div>
            `;
            contactList.appendChild(groupItem);
        });

        // Add event listeners for group selection
        contactList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateGroupSelection();
            });
        });
    }

    updateGroupSelection() {
        const selectedGroups = Array.from(document.querySelectorAll('#contactList input[type="checkbox"]:checked'))
            .map(cb => cb.dataset.group);

        this.selectedContacts = this.contacts.filter(contact => 
            selectedGroups.includes(contact.group)
        );

        this.updateSelectedCount();
    }

    filterContacts() {
        const searchTerm = document.getElementById('contactSearch').value.toLowerCase();
        const filteredContacts = this.contacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm) ||
            contact.phone.includes(searchTerm)
        );

        this.renderFilteredContacts(filteredContacts);
    }

    filterContactsByType(type) {
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${type}"]`).classList.add('active');

        let filteredContacts = [...this.contacts];

        switch(type) {
            case 'recent':
                // Filter contacts added in last 7 days (simulated)
                filteredContacts = this.contacts.slice(0, 2);
                break;
            case 'active':
                filteredContacts = this.contacts.filter(c => c.status === 'active');
                break;
            case 'all':
            default:
                filteredContacts = [...this.contacts];
        }

        this.renderFilteredContacts(filteredContacts);
    }

    renderFilteredContacts(contacts) {
        const tbody = document.getElementById('contactsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        contacts.forEach(contact => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" data-contact-id="${contact.id}" ${this.selectedContacts.some(c => c.id === contact.id) ? 'checked' : ''}>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div class="contact-avatar">${contact.name.charAt(0)}</div>
                        <div>
                            <strong>${contact.name}</strong>
                        </div>
                    </div>
                </td>
                <td>${contact.phone}</td>
                <td>
                    <span class="group-badge">${this.getGroupName(contact.group)}</span>
                </td>
                <td>${contact.lastMessage}</td>
                <td>
                    <span class="status-badge ${contact.status}">${contact.status === 'active' ? 'Aktif' : 'Pasif'}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    updateCharCount() {
        const messageContent = document.getElementById('messageContent');
        const charCount = document.getElementById('charCount');
        
        if (messageContent && charCount) {
            const count = messageContent.value.length;
            charCount.textContent = count;
            
            if (count > 4000) {
                charCount.style.color = 'var(--error-color)';
            } else if (count > 3500) {
                charCount.style.color = 'var(--warning-color)';
            } else {
                charCount.style.color = 'var(--text-secondary)';
            }
        }
    }

    loadTemplate() {
        const templateSelect = document.getElementById('templateSelect');
        const messageContent = document.getElementById('messageContent');
        
        if (!templateSelect || !messageContent) return;

        const templateId = parseInt(templateSelect.value);
        if (!templateId) {
            messageContent.value = '';
            this.updateCharCount();
            return;
        }

        const template = this.templates.find(t => t.id === templateId);
        if (template) {
            messageContent.value = template.content;
            this.updateCharCount();
        }
    }

    toggleScheduleInputs() {
        const scheduleCheckbox = document.getElementById('scheduleMessage');
        const scheduleInputs = document.getElementById('scheduleInputs');
        
        if (scheduleInputs) {
            scheduleInputs.style.display = scheduleCheckbox.checked ? 'block' : 'none';
        }
    }

    handleMediaUpload() {
        const mediaFile = document.getElementById('mediaFile');
        const mediaPreview = document.getElementById('mediaPreview');
        
        if (!mediaFile.files.length) return;

        const file = mediaFile.files[0];
        const maxSize = 16 * 1024 * 1024; // 16MB

        if (file.size > maxSize) {
            this.showNotification('Dosya boyutu 16MB\'dan büyük olamaz.', 'error');
            mediaFile.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'media-preview-item';
            
            let mediaElement = '';
            if (file.type.startsWith('image/')) {
                mediaElement = `<img src="${e.target.result}" alt="Preview">`;
            } else {
                mediaElement = `<div class="file-icon"><i class="fas fa-file"></i></div>`;
            }

            previewItem.innerHTML = `
                ${mediaElement}
                <div class="media-info">
                    <h4>${file.name}</h4>
                    <p>${this.formatFileSize(file.size)}</p>
                </div>
                <button class="remove-media" onclick="crm.removeMedia()">
                    <i class="fas fa-times"></i>
                </button>
            `;

            mediaPreview.innerHTML = '';
            mediaPreview.appendChild(previewItem);
        };

        reader.readAsDataURL(file);
    }

    removeMedia() {
        const mediaFile = document.getElementById('mediaFile');
        const mediaPreview = document.getElementById('mediaPreview');
        
        if (mediaFile) mediaFile.value = '';
        if (mediaPreview) mediaPreview.innerHTML = '';
    }

    previewMessage() {
        const messageContent = document.getElementById('messageContent').value;
        if (!messageContent.trim()) {
            this.showNotification('Lütfen mesaj içeriği girin.', 'warning');
            return;
        }

        // Process message with variables
        const processedMessage = this.processMessageVariables(messageContent);
        
        const previewContent = document.getElementById('previewContent');
        const previewMedia = document.getElementById('previewMedia');
        const previewModal = document.getElementById('previewModal');

        if (previewContent) {
            previewContent.innerHTML = processedMessage.replace(/\n/g, '<br>');
        }

        // Show media if uploaded
        const mediaFile = document.getElementById('mediaFile');
        if (mediaFile && mediaFile.files.length > 0) {
            const file = mediaFile.files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewMedia.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; border-radius: 8px; margin-bottom: 0.5rem;">`;
                };
                reader.readAsDataURL(file);
            } else {
                previewMedia.innerHTML = `
                    <div style="padding: 0.5rem; background: var(--whatsapp-gray); border-radius: 8px; margin-bottom: 0.5rem;">
                        <i class="fas fa-file"></i> ${file.name}
                    </div>
                `;
            }
        } else {
            previewMedia.innerHTML = '';
        }

        previewModal.classList.add('active');
    }

    // This function is replaced by the enhanced version below

    processMessageVariables(message, contact = null) {
        let processed = message;
        
        if (contact) {
            processed = processed.replace(/\{isim\}/g, contact.name);
            processed = processed.replace(/\{telefon\}/g, contact.phone);
        } else {
            // For preview, use sample data
            processed = processed.replace(/\{isim\}/g, 'Örnek İsim');
            processed = processed.replace(/\{telefon\}/g, '+90 555 000 0000');
        }
        
        processed = processed.replace(/\{tarih\}/g, new Date().toLocaleDateString('tr-TR'));
        
        return processed;
    }

    async simulateSendMessage(contact, message) {
        // Simulate API call delay
        await this.sleep(100 + Math.random() * 200);
        
        // Simulate 95% success rate
        if (Math.random() < 0.05) {
            throw new Error('Sending failed');
        }
        
        console.log(`Message sent to ${contact.name}: ${message}`);
    }

    showSendingProgress() {
        // Create progress modal
        const progressModal = document.createElement('div');
        progressModal.id = 'sendingProgressModal';
        progressModal.className = 'modal active';
        progressModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Mesajlar Gönderiliyor</h3>
                </div>
                <div class="modal-body">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <div style="text-align: center; margin-top: 1rem;">
                        <p id="progressText">0 / ${this.selectedContacts.length} mesaj gönderildi</p>
                        <div style="margin-top: 1rem; display: flex; justify-content: space-between;">
                            <span>✅ Başarılı: <span id="successCount">0</span></span>
                            <span>❌ Başarısız: <span id="failCount">0</span></span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(progressModal);
    }

    updateSendingProgress(progress, successCount, failCount) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const successCountEl = document.getElementById('successCount');
        const failCountEl = document.getElementById('failCount');

        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${successCount + failCount} / ${this.selectedContacts.length} mesaj gönderildi`;
        if (successCountEl) successCountEl.textContent = successCount;
        if (failCountEl) failCountEl.textContent = failCount;
    }

    hideSendingProgress() {
        const progressModal = document.getElementById('sendingProgressModal');
        if (progressModal) {
            progressModal.remove();
        }
    }

    showSendingResults(successCount, failCount) {
        const total = successCount + failCount;
        const message = failCount === 0 
            ? `🎉 Tüm mesajlar başarıyla gönderildi! (${total} mesaj)`
            : `⚠️ ${successCount} mesaj başarıyla gönderildi, ${failCount} mesaj gönderilemedi.`;
        
        const type = failCount === 0 ? 'success' : 'warning';
        this.showNotification(message, type, 5000);
    }

    resetMessageForm() {
        document.getElementById('messageContent').value = '';
        document.getElementById('templateSelect').value = '';
        document.getElementById('scheduleMessage').checked = false;
        document.getElementById('scheduleInputs').style.display = 'none';
        this.removeMedia();
        this.updateCharCount();
    }

    showContactModal(contactId = null) {
        const modal = document.getElementById('contactModal');
        const form = document.getElementById('contactForm');
        
        if (contactId) {
            // Edit mode
            const contact = this.contacts.find(c => c.id === contactId);
            if (contact) {
                document.getElementById('contactName').value = contact.name;
                document.getElementById('contactPhone').value = contact.phone;
                document.getElementById('contactGroup').value = contact.group;
                document.getElementById('contactNotes').value = contact.notes || '';
                form.dataset.contactId = contactId;
            }
        } else {
            // Add mode
            form.reset();
            delete form.dataset.contactId;
        }
        
        modal.classList.add('active');
    }

    hideContactModal() {
        document.getElementById('contactModal').classList.remove('active');
    }

    saveContact() {
        const form = document.getElementById('contactForm');
        const formData = new FormData(form);
        
        const contactData = {
            name: document.getElementById('contactName').value,
            phone: document.getElementById('contactPhone').value,
            group: document.getElementById('contactGroup').value,
            notes: document.getElementById('contactNotes').value,
            status: 'active',
            lastMessage: 'Henüz mesaj yok'
        };

        // Validation
        if (!contactData.name || !contactData.phone) {
            this.showNotification('Lütfen ad ve telefon alanlarını doldurun.', 'warning');
            return;
        }

        if (form.dataset.contactId) {
            // Update existing contact
            const contactId = parseInt(form.dataset.contactId);
            const index = this.contacts.findIndex(c => c.id === contactId);
            if (index > -1) {
                this.contacts[index] = { ...this.contacts[index], ...contactData };
                this.showNotification('Kişi başarıyla güncellendi.', 'success');
            }
        } else {
            // Add new contact
            const newContact = {
                id: Date.now(),
                ...contactData
            };
            this.contacts.push(newContact);
            this.showNotification('Kişi başarıyla eklendi.', 'success');
        }

        this.hideContactModal();
        if (this.currentSection === 'contacts') {
            this.renderContacts();
        }
        this.updateContactCount();
    }

    editContact(contactId) {
        this.showContactModal(contactId);
    }

    deleteContact(contactId) {
        if (confirm('Bu kişiyi silmek istediğinizden emin misiniz?')) {
            const index = this.contacts.findIndex(c => c.id === contactId);
            if (index > -1) {
                this.contacts.splice(index, 1);
                this.showNotification('Kişi başarıyla silindi.', 'success');
                this.renderContacts();
                this.updateContactCount();
            }
        }
    }

    updateContactCount() {
        const countElement = document.querySelector('.nav-item[data-section="contacts"] .count');
        if (countElement) {
            countElement.textContent = this.contacts.length;
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add styles if not exists
        if (!document.getElementById('notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: var(--shadow-lg);
                    padding: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    z-index: 1001;
                    max-width: 400px;
                    animation: slideInRight 0.3s ease-out;
                    border-left: 4px solid var(--whatsapp-green);
                }
                .notification-success { border-left-color: var(--success-color); }
                .notification-error { border-left-color: var(--error-color); }
                .notification-warning { border-left-color: var(--warning-color); }
                .notification-content { display: flex; align-items: center; gap: 0.75rem; flex: 1; }
                .notification-close { background: none; border: none; cursor: pointer; color: var(--text-secondary); }
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }

    getGroupName(group) {
        const groups = {
            customers: 'Müşteriler',
            leads: 'Potansiyel Müşteriler',
            partners: 'Partnerler'
        };
        return groups[group] || group;
    }

    getCategoryName(category) {
        const categories = {
            welcome: 'Karşılama',
            promotion: 'Promosyon',
            reminder: 'Hatırlatma'
        };
        return categories[category] || category;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Manual Contact Entry Functions
    addManualContact() {
        const nameInput = document.getElementById('manualName');
        const phoneInput = document.getElementById('manualPhone');
        
        const name = nameInput?.value.trim();
        const phone = phoneInput?.value.trim();
        
        if (!name || !phone) {
            this.showNotification('Lütfen isim ve telefon numarasını girin.', 'warning');
            return;
        }
        
        // Create temporary contact for manual entry
        const manualContact = {
            id: Date.now(),
            name: name,
            phone: phone,
            group: 'manual',
            isManual: true
        };
        
        // Add to selected contacts
        this.selectedContacts = [manualContact];
        
        // Clear inputs
        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '';
        
        // Update UI
        this.updateSelectedCount();
        this.showNotification(`${name} manuel olarak eklendi.`, 'success');
    }

    // Settings Functions
    switchSettingsTab(tabName) {
        // Update tabs
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        
        // Update sections
        document.querySelectorAll('.settings-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${tabName}Settings`)?.classList.add('active');
    }

    saveSettings(type) {
        let message = '';
        
        switch(type) {
            case 'general':
                // Save general settings
                const appName = document.getElementById('appName')?.value;
                const timezone = document.getElementById('timezone')?.value;
                const language = document.getElementById('language')?.value;
                
                // Store in localStorage (in real app, send to server)
                localStorage.setItem('settings_general', JSON.stringify({
                    appName, timezone, language
                }));
                
                message = 'Genel ayarlar kaydedildi.';
                break;
                
            case 'api':
                // Save API settings
                const apiEndpoint = document.getElementById('apiEndpoint')?.value;
                const apiKey = document.getElementById('apiKey')?.value;
                const instanceId = document.getElementById('instanceId')?.value;
                
                localStorage.setItem('settings_api', JSON.stringify({
                    apiEndpoint, apiKey, instanceId
                }));
                
                message = 'API ayarları kaydedildi.';
                break;
                
            case 'messaging':
                // Save messaging settings
                const sendingSpeed = document.getElementById('sendingSpeed')?.value;
                const randomDelay = document.getElementById('randomDelay')?.checked;
                const maxRetries = document.getElementById('maxRetries')?.value;
                
                localStorage.setItem('settings_messaging', JSON.stringify({
                    sendingSpeed, randomDelay, maxRetries
                }));
                
                message = 'Mesajlaşma ayarları kaydedildi.';
                break;
        }
        
        this.showNotification(message, 'success');
    }

    // Load saved settings on page load
    loadSettings() {
        // Load general settings
        const generalSettings = JSON.parse(localStorage.getItem('settings_general') || '{}');
        if (generalSettings.appName) {
            const appNameInput = document.getElementById('appName');
            if (appNameInput) appNameInput.value = generalSettings.appName;
        }
        if (generalSettings.timezone) {
            const timezoneSelect = document.getElementById('timezone');
            if (timezoneSelect) timezoneSelect.value = generalSettings.timezone;
        }
        if (generalSettings.language) {
            const languageSelect = document.getElementById('language');
            if (languageSelect) languageSelect.value = generalSettings.language;
        }
        
        // Load API settings
        const apiSettings = JSON.parse(localStorage.getItem('settings_api') || '{}');
        if (apiSettings.apiEndpoint) {
            const apiEndpointInput = document.getElementById('apiEndpoint');
            if (apiEndpointInput) apiEndpointInput.value = apiSettings.apiEndpoint;
        }
        if (apiSettings.instanceId) {
            const instanceIdInput = document.getElementById('instanceId');
            if (instanceIdInput) instanceIdInput.value = apiSettings.instanceId;
        }
        
        // Load messaging settings
        const messagingSettings = JSON.parse(localStorage.getItem('settings_messaging') || '{}');
        if (messagingSettings.sendingSpeed) {
            const sendingSpeedSelect = document.getElementById('sendingSpeed');
            if (sendingSpeedSelect) sendingSpeedSelect.value = messagingSettings.sendingSpeed;
        }
        if (messagingSettings.randomDelay !== undefined) {
            const randomDelayCheckbox = document.getElementById('randomDelay');
            if (randomDelayCheckbox) randomDelayCheckbox.checked = messagingSettings.randomDelay;
        }
        if (messagingSettings.maxRetries) {
            const maxRetriesInput = document.getElementById('maxRetries');
            if (maxRetriesInput) maxRetriesInput.value = messagingSettings.maxRetries;
        }
    }

    // Update the sendBulkMessage function to handle manual contacts
    updateSelectedCount() {
        const countElement = document.getElementById('selectedCount');
        if (countElement) {
            const recipientType = document.querySelector('input[name="recipientType"]:checked')?.value;
            
            if (recipientType === 'manual') {
                countElement.textContent = this.selectedContacts.length > 0 ? '1' : '0';
            } else if (recipientType === 'whatsapp-groups') {
                const selectedGroups = this.selectedWhatsAppGroups || [];
                countElement.textContent = selectedGroups.length;
            } else {
                countElement.textContent = this.selectedContacts.length;
            }
        }
    }

    // WhatsApp Integration Functions
    async syncWhatsAppContacts() {
        if (!this.isConnected) {
            this.showNotification('Önce WhatsApp Web\'e bağlanın.', 'warning');
            return;
        }

        const button = document.getElementById('syncWhatsAppContacts');
        const originalText = button.innerHTML;
        
        // Show loading state
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Senkronize ediliyor...';
        button.disabled = true;

        try {
            // Real WhatsApp API call via Socket.IO
            this.socket.emit('get_contacts');
            
            this.showNotification('WhatsApp kişileri senkronize ediliyor...', 'info');

        } catch (error) {
            console.error('WhatsApp sync error:', error);
            this.showNotification('WhatsApp senkronizasyonu başarısız.', 'error');
        } finally {
            // Restore button
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    async syncWhatsAppGroupsData() {
        if (!this.isConnected) {
            this.showNotification('WhatsApp bağlantısı gerekli.', 'warning');
            return;
        }

        try {
            // Real WhatsApp API call via Socket.IO
            this.socket.emit('get_groups');
            this.selectedWhatsAppGroups = [];
        } catch (error) {
            console.error('WhatsApp groups sync error:', error);
            this.showNotification('WhatsApp grupları senkronize edilemedi.', 'error');
        }
    }

    async loadWhatsAppGroups() {
        const groupsList = document.getElementById('whatsappGroupsList');
        if (!groupsList) return;

        // Show loading
        groupsList.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-spinner loading-icon"></i>
                WhatsApp grupları yükleniyor...
            </div>
        `;

        try {
            if (!this.whatsappGroups || this.whatsappGroups.length === 0) {
                await this.syncWhatsAppGroupsData();
            }

            this.renderWhatsAppGroups();

        } catch (error) {
            console.error('Groups loading error:', error);
            groupsList.innerHTML = `
                <div class="loading-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    Gruplar yüklenirken hata oluştu.
                </div>
            `;
        }
    }

    renderWhatsAppGroups() {
        const groupsList = document.getElementById('whatsappGroupsList');
        if (!groupsList || !this.whatsappGroups) return;

        groupsList.innerHTML = this.whatsappGroups.map(group => `
            <div class="group-item" onclick="crm.toggleGroupSelection('${group.id}')">
                <input type="checkbox" id="group_${group.id}" ${this.selectedWhatsAppGroups?.includes(group.id) ? 'checked' : ''}>
                <div class="group-avatar">${group.avatar}</div>
                <div class="group-info">
                    <h4>${group.name}</h4>
                    <p>${group.description}</p>
                    <span class="group-members">${group.members} üye</span>
                    ${!group.canSendMessages ? '<span class="group-members" style="background: #ffebee; color: #c62828;">Admin değil</span>' : ''}
                </div>
            </div>
        `).join('');

        this.updateSelectedGroupsCount();
    }

    toggleGroupSelection(groupId) {
        if (!this.selectedWhatsAppGroups) {
            this.selectedWhatsAppGroups = [];
        }

        const checkbox = document.getElementById(`group_${groupId}`);
        const group = this.whatsappGroups.find(g => g.id === groupId);

        if (!group.canSendMessages) {
            this.showNotification('Bu gruba mesaj gönderme yetkiniz yok.', 'warning');
            checkbox.checked = false;
            return;
        }

        if (checkbox.checked) {
            if (!this.selectedWhatsAppGroups.includes(groupId)) {
                this.selectedWhatsAppGroups.push(groupId);
            }
        } else {
            this.selectedWhatsAppGroups = this.selectedWhatsAppGroups.filter(id => id !== groupId);
        }

        this.updateSelectedGroupsCount();
        this.updateSelectedCount();
    }

    updateSelectedGroupsCount() {
        const countElement = document.getElementById('selectedGroupsCount');
        if (countElement && this.selectedWhatsAppGroups) {
            const count = this.selectedWhatsAppGroups.length;
            countElement.innerHTML = `<i class="fas fa-users"></i> ${count} grup seçildi`;
        }
    }

    // Enhanced Bulk Message Sending with Smart Delays
    async sendBulkMessage() {
        if (!this.isConnected) {
            this.showNotification('Önce WhatsApp Web\'e bağlanın.', 'error');
            return;
        }

        const messageContent = document.getElementById('messageContent').value.trim();
        if (!messageContent) {
            this.showNotification('Lütfen mesaj içeriği girin.', 'warning');
            return;
        }

        const recipientType = document.querySelector('input[name="recipientType"]:checked')?.value;
        let recipients = [];

        // Determine recipients based on type
        switch(recipientType) {
            case 'whatsapp-groups':
                if (!this.selectedWhatsAppGroups || this.selectedWhatsAppGroups.length === 0) {
                    this.showNotification('Lütfen en az bir grup seçin.', 'warning');
                    return;
                }
                recipients = this.selectedWhatsAppGroups.map(groupId => {
                    const group = this.whatsappGroups.find(g => g.id === groupId);
                    return { type: 'group', id: groupId, name: group.name, members: group.members };
                });
                break;
            case 'manual':
            case 'all':
            case 'groups':
            case 'custom':
                if (this.selectedContacts.length === 0) {
                    this.showNotification('Lütfen en az bir kişi seçin.', 'warning');
                    return;
                }
                recipients = this.selectedContacts.map(contact => ({
                    type: 'contact',
                    id: contact.id,
                    name: contact.name,
                    phone: contact.phone
                }));
                break;
        }

        // Get smart delay settings
        const smartDelayEnabled = document.getElementById('enableSmartDelay')?.checked;
        const delaySettings = {
            after10: parseInt(document.getElementById('delay10')?.value) * 1000 || 30000,
            after100: parseInt(document.getElementById('delay100')?.value) * 1000 || 300000,
            after300: parseInt(document.getElementById('delay300')?.value) * 1000 || 600000,
            after500: parseInt(document.getElementById('delay500')?.value) * 1000 || 1800000
        };

        // Start sending process
        await this.processBulkSending(recipients, messageContent, delaySettings, smartDelayEnabled);
    }

    async processBulkSending(recipients, messageContent, delaySettings, smartDelayEnabled) {
        const totalMessages = recipients.reduce((total, recipient) => {
            return total + (recipient.type === 'group' ? recipient.members : 1);
        }, 0);

        // Create progress modal
        this.showSendingProgress(totalMessages);

        let sentCount = 0;
        let failedCount = 0;

        try {
            for (let i = 0; i < recipients.length; i++) {
                const recipient = recipients[i];
                
                try {
                    // Process message with variables
                    const personalizedMessage = this.processMessageVariables(messageContent, recipient);
                    
                    // Send message
                    await this.sendSingleMessage(recipient, personalizedMessage);
                    
                    if (recipient.type === 'group') {
                        sentCount += recipient.members;
                    } else {
                        sentCount++;
                    }

                    // Update progress
                    this.updateSendingProgress(sentCount, totalMessages, failedCount);

                    // Smart delay logic
                    if (smartDelayEnabled) {
                        await this.applySmartDelay(sentCount, delaySettings);
                    }

                    // Regular delay between messages
                    await this.sleep(1000);

                } catch (error) {
                    console.error(`Failed to send to ${recipient.name}:`, error);
                    failedCount++;
                    this.updateSendingProgress(sentCount, totalMessages, failedCount);
                }
            }

            this.completeSendingProcess(sentCount, failedCount);

        } catch (error) {
            console.error('Bulk sending error:', error);
            this.showNotification('Toplu gönderim sırasında hata oluştu.', 'error');
            this.hideSendingProgress();
        }
    }

    async applySmartDelay(sentCount, delaySettings) {
        let delayTime = 0;
        let delayReason = '';

        if (sentCount % 10 === 0) {
            delayTime = delaySettings.after10;
            delayReason = 'Her 10 mesajda bir bekleme';
        }

        if (sentCount === 100) {
            delayTime = Math.max(delayTime, delaySettings.after100);
            delayReason = '100 mesaj sonrası güvenlik beklemesi';
        } else if (sentCount === 300) {
            delayTime = Math.max(delayTime, delaySettings.after300);
            delayReason = '300 mesaj sonrası uzun bekleme';
        } else if (sentCount === 500) {
            delayTime = Math.max(delayTime, delaySettings.after500);
            delayReason = '500 mesaj sonrası maksimum bekleme';
        }

        if (delayTime > 0) {
            await this.showDelayCountdown(delayTime, delayReason);
        }
    }

    async showDelayCountdown(delayTime, reason) {
        const progressModal = document.querySelector('.sending-progress-modal');
        if (!progressModal) return;

        const delayElement = progressModal.querySelector('.delay-countdown');
        if (delayElement) {
            delayElement.style.display = 'block';
            delayElement.querySelector('.delay-reason').textContent = reason;
            
            let remainingTime = Math.floor(delayTime / 1000);
            const countdownElement = delayElement.querySelector('.countdown-timer');
            
            const updateCountdown = () => {
                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;
                countdownElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                if (remainingTime > 0) {
                    remainingTime--;
                    setTimeout(updateCountdown, 1000);
                } else {
                    delayElement.style.display = 'none';
                }
            };
            
            updateCountdown();
            await this.sleep(delayTime);
        }
    }

    showImportModal() {
        // Create import modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Kişi İçe Aktarma</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="import-options">
                        <div class="import-option">
                            <h4><i class="fas fa-file-csv"></i> CSV/Excel Dosyası</h4>
                            <p>CSV veya Excel formatındaki kişi listesini içe aktarın.</p>
                            <input type="file" id="importFile" accept=".csv,.xlsx,.xls" style="display: none;">
                            <button class="btn-primary" onclick="document.getElementById('importFile').click()">
                                <i class="fas fa-upload"></i> Dosya Seç
                            </button>
                        </div>
                        <div class="import-option">
                            <h4><i class="fas fa-paste"></i> Metin Olarak Yapıştır</h4>
                            <p>Kişi bilgilerini metin olarak yapıştırın (her satırda: İsim, Telefon).</p>
                            <textarea id="pasteContacts" placeholder="Ali Veli, +90 555 123 4567
Ayşe Yılmaz, +90 555 234 5678" rows="5"></textarea>
                            <button class="btn-primary" onclick="crm.importFromText()">
                                <i class="fas fa-paste"></i> İçe Aktar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle file selection
        const fileInput = modal.querySelector('#importFile');
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importFromFile(e.target.files[0]);
            }
        });
    }

    importFromText() {
        const textarea = document.getElementById('pasteContacts');
        const text = textarea.value.trim();
        
        if (!text) {
            this.showNotification('Lütfen kişi bilgilerini girin.', 'warning');
            return;
        }

        const lines = text.split('\n');
        let imported = 0;
        let failed = 0;

        lines.forEach(line => {
            const parts = line.split(',').map(part => part.trim());
            if (parts.length >= 2) {
                const [name, phone] = parts;
                if (name && phone) {
                    this.contacts.push({
                        id: Date.now() + Math.random(),
                        name,
                        phone,
                        email: '',
                        group: 'imported',
                        tags: ['İçe Aktarılan']
                    });
                    imported++;
                } else {
                    failed++;
                }
            } else {
                failed++;
            }
        });

        this.renderContactsTable();
        this.updateContactsCount();
        
        let message = `${imported} kişi başarıyla içe aktarıldı.`;
        if (failed > 0) {
            message += ` ${failed} satır hatalı olduğu için atlandı.`;
        }
        
        this.showNotification(message, imported > 0 ? 'success' : 'warning');
        
        // Close modal
        document.querySelector('.modal').remove();
    }

    async importFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n');
            let imported = 0;
            let failed = 0;

            lines.forEach((line, index) => {
                if (index === 0) return; // Skip header
                
                const parts = line.split(',').map(part => part.trim());
                if (parts.length >= 2) {
                    const [name, phone] = parts;
                    if (name && phone) {
                        this.contacts.push({
                            id: Date.now() + Math.random(),
                            name,
                            phone,
                            email: parts[2] || '',
                            group: 'imported',
                            tags: ['Dosya İçe Aktarma']
                        });
                        imported++;
                    } else {
                        failed++;
                    }
                } else {
                    failed++;
                }
            });

            this.renderContactsTable();
            this.updateContactsCount();
            
            let message = `${imported} kişi başarıyla içe aktarıldı.`;
            if (failed > 0) {
                message += ` ${failed} satır hatalı olduğu için atlandı.`;
            }
            
            this.showNotification(message, imported > 0 ? 'success' : 'warning');
            
            // Close modal
            document.querySelector('.modal').remove();
        };
        
        reader.readAsText(file);
    }

    // Progress Modal for Bulk Sending
    showSendingProgress(totalMessages) {
        const modal = document.createElement('div');
        modal.className = 'modal active sending-progress-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3><i class="fas fa-paper-plane"></i> Toplu Gönderim</h3>
                </div>
                <div class="modal-body">
                    <div class="progress-info">
                        <div class="progress-stats">
                            <div class="stat">
                                <span class="stat-label">Gönderilen:</span>
                                <span class="stat-value" id="sentCount">0</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Toplam:</span>
                                <span class="stat-value">${totalMessages}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Başarısız:</span>
                                <span class="stat-value" id="failedCount">0</span>
                            </div>
                        </div>
                        
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        
                        <div class="progress-text" id="progressText">Gönderim başlatılıyor...</div>
                    </div>
                    
                    <div class="delay-countdown" id="delayCountdown" style="display: none;">
                        <div class="delay-info">
                            <i class="fas fa-clock"></i>
                            <span class="delay-reason"></span>
                        </div>
                        <div class="countdown-timer">00:00</div>
                    </div>
                    
                    <div class="sending-actions">
                        <button class="btn-secondary" id="pauseSending" onclick="crm.pauseSending()">
                            <i class="fas fa-pause"></i> Duraklat
                        </button>
                        <button class="btn-danger" id="stopSending" onclick="crm.stopSending()">
                            <i class="fas fa-stop"></i> Durdur
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    updateSendingProgress(sent, total, failed) {
        const sentElement = document.getElementById('sentCount');
        const failedElement = document.getElementById('failedCount');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (sentElement) sentElement.textContent = sent;
        if (failedElement) failedElement.textContent = failed;
        
        if (progressFill) {
            const percentage = (sent / total) * 100;
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${sent}/${total} mesaj gönderildi`;
        }
    }

    completeSendingProcess(sent, failed) {
        const modal = document.querySelector('.sending-progress-modal');
        if (modal) {
            const progressText = modal.querySelector('#progressText');
            const actions = modal.querySelector('.sending-actions');
            
            if (progressText) {
                progressText.innerHTML = `
                    <div class="completion-message">
                        <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
                        Gönderim tamamlandı!
                    </div>
                `;
            }
            
            if (actions) {
                actions.innerHTML = `
                    <button class="btn-primary" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i> Kapat
                    </button>
                `;
            }
        }

        this.showNotification(
            `${sent} mesaj başarıyla gönderildi. ${failed > 0 ? `${failed} mesaj başarısız.` : ''}`,
            failed > 0 ? 'warning' : 'success'
        );
    }

    hideSendingProgress() {
        const modal = document.querySelector('.sending-progress-modal');
        if (modal) {
            modal.remove();
        }
    }

    pauseSending() {
        this.sendingPaused = !this.sendingPaused;
        const button = document.getElementById('pauseSending');
        if (button) {
            if (this.sendingPaused) {
                button.innerHTML = '<i class="fas fa-play"></i> Devam Et';
                this.showNotification('Gönderim duraklatıldı.', 'info');
            } else {
                button.innerHTML = '<i class="fas fa-pause"></i> Duraklat';
                this.showNotification('Gönderim devam ediyor.', 'info');
            }
        }
    }

    stopSending() {
        this.sendingStopped = true;
        this.hideSendingProgress();
        this.showNotification('Gönderim durduruldu.', 'warning');
    }


    processMessageVariables(message, recipient) {
        return message
            .replace(/\{isim\}/g, recipient.name)
            .replace(/\{telefon\}/g, recipient.phone || recipient.id)
            .replace(/\{tarih\}/g, new Date().toLocaleDateString('tr-TR'));
    }

    // Render contacts table
    renderContactsTable() {
        const contactsList = document.getElementById('contactsList');
        if (!contactsList) return;

        if (this.contacts.length === 0) {
            contactsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>Henüz kişi yok</h3>
                    <p>WhatsApp'tan kişi çekin veya manuel olarak ekleyin</p>
                    <button onclick="crm.syncContacts()" class="btn-primary">
                        <i class="fas fa-sync"></i> WhatsApp'tan Çek
                    </button>
                </div>
            `;
            return;
        }

        const contactsHTML = this.contacts.map(contact => `
            <div class="contact-item" data-id="${contact.id}">
                <div class="contact-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="contact-info">
                    <div class="contact-name">${contact.name || 'İsimsiz'}</div>
                    <div class="contact-phone">${contact.number || contact.id}</div>
                </div>
                <div class="contact-actions">
                    <button onclick="crm.editContact('${contact.id}')" class="btn-small">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="crm.deleteContact('${contact.id}')" class="btn-small btn-danger">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        contactsList.innerHTML = contactsHTML;
    }

    // Update contacts count
    updateContactsCount() {
        const countElement = document.getElementById('contactsCount');
        if (countElement) {
            countElement.textContent = this.contacts.length;
        }

        // Update dashboard contact count
        const dashboardCount = document.querySelector('.metric-card .metric-value');
        if (dashboardCount) {
            dashboardCount.textContent = this.contacts.length;
        }
    }

    // Kişi ekleme modal'ını göster
    showAddContactModal() {
        // Modal HTML'i dinamik oluştur
        const modalHTML = `
            <div class="modal" id="addContactModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Yeni Kişi Ekle</h3>
                        <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="addContactForm">
                            <div class="form-group">
                                <label for="contactName">Ad Soyad *</label>
                                <input type="text" id="contactName" required>
                            </div>
                            <div class="form-group">
                                <label for="contactPhone">Telefon *</label>
                                <input type="tel" id="contactPhone" placeholder="+90 555 123 4567" required>
                            </div>
                            <div class="form-group">
                                <label for="contactEmail">E-posta</label>
                                <input type="email" id="contactEmail">
                            </div>
                            <div class="form-group">
                                <label for="contactGroup">Grup</label>
                                <select id="contactGroup">
                                    <option value="">Grup Seçin</option>
                                    <option value="Müşteri">Müşteri</option>
                                    <option value="Potansiyel">Potansiyel</option>
                                    <option value="Partner">Partner</option>
                                    <option value="Diğer">Diğer</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="contactNotes">Notlar</label>
                                <textarea id="contactNotes" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">İptal</button>
                        <button type="button" class="btn btn-primary" onclick="crm.addNewContact()">Kişi Ekle</button>
                    </div>
                </div>
            </div>
        `;
        
        // Modal'ı DOM'a ekle
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Modal'ı göster
        document.getElementById('addContactModal').classList.add('active');
    }

    // Yeni kişi ekle
    addNewContact() {
        const name = document.getElementById('contactName').value.trim();
        const phone = document.getElementById('contactPhone').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        const group = document.getElementById('contactGroup').value;
        const notes = document.getElementById('contactNotes').value.trim();

        // Validation
        if (!name || !phone) {
            this.showNotification('Ad Soyad ve Telefon alanları zorunludur.', 'error');
            return;
        }

        // Telefon numarası formatını kontrol et
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(phone)) {
            this.showNotification('Geçerli bir telefon numarası girin.', 'error');
            return;
        }

        // Kişi zaten var mı kontrol et
        const existingContact = this.contacts.find(c => c.phone === phone);
        if (existingContact) {
            this.showNotification('Bu telefon numarası zaten kayıtlı.', 'error');
            return;
        }

        // Yeni kişi objesi oluştur
        const newContact = {
            id: Date.now().toString(),
            name: name,
            phone: phone,
            email: email || '',
            group: group || 'Diğer',
            notes: notes || '',
            status: 'active',
            createdAt: new Date().toISOString(),
            whatsappData: false
        };

        // Kişi listesine ekle
        this.contacts.push(newContact);
        
        // UI'ı güncelle
        this.renderContacts();
        this.updateStats();
        
        // Modal'ı kapat
        document.getElementById('addContactModal').remove();
        
        // Başarı mesajı
        this.showNotification(`${name} başarıyla eklendi.`, 'success');
        
        console.log('✅ Yeni kişi eklendi:', newContact);
    }

    // Şablon ekleme modal'ını göster
    showTemplateModal() {
        this.showAddTemplateModal();
    }

    // Şablon ekleme modal'ını göster
    showAddTemplateModal() {
        // Modal HTML'i dinamik oluştur
        const modalHTML = `
            <div class="modal active" id="addTemplateModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Yeni Şablon Oluştur</h3>
                        <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="addTemplateForm">
                            <div class="form-group">
                                <label for="templateName">Şablon Adı *</label>
                                <input type="text" id="templateName" placeholder="Örn: Hoş Geldin Mesajı" required>
                            </div>
                            <div class="form-group">
                                <label for="templateCategory">Kategori</label>
                                <select id="templateCategory">
                                    <option value="Genel">Genel</option>
                                    <option value="Satış">Satış</option>
                                    <option value="Destek">Müşteri Desteği</option>
                                    <option value="Pazarlama">Pazarlama</option>
                                    <option value="Bilgilendirme">Bilgilendirme</option>
                                    <option value="Teşekkür">Teşekkür</option>
                                    <option value="Diğer">Diğer</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="templateContent">Mesaj İçeriği *</label>
                                <textarea id="templateContent" rows="6" placeholder="Mesaj içeriğinizi buraya yazın...

Değişkenler:
{isim} - Kişi adı
{tarih} - Bugünün tarihi
{saat} - Şu anki saat" required></textarea>
                                <small style="color: #666; font-size: 0.85rem;">
                                    <strong>Kullanılabilir değişkenler:</strong><br>
                                    • <code>{isim}</code> - Kişi adı<br>
                                    • <code>{tarih}</code> - Bugünün tarihi<br>
                                    • <code>{saat}</code> - Şu anki saat
                                </small>
                            </div>
                            <div class="form-group">
                                <label for="templateKeywords">Anahtar Kelimeler</label>
                                <input type="text" id="templateKeywords" placeholder="hoşgeldin, tanışma, ilk mesaj" 
                                       title="Virgül ile ayırarak anahtar kelimeler ekleyin">
                                <small style="color: #666; font-size: 0.85rem;">Şablonu bulmak için anahtar kelimeler (virgül ile ayırın)</small>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">İptal</button>
                        <button type="button" class="btn btn-primary" onclick="crm.addNewTemplate()">Şablon Oluştur</button>
                    </div>
                </div>
            </div>
        `;
        
        // Modal'ı DOM'a ekle
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Yeni şablon ekle
    addNewTemplate() {
        const name = document.getElementById('templateName').value.trim();
        const category = document.getElementById('templateCategory').value;
        const content = document.getElementById('templateContent').value.trim();
        const keywords = document.getElementById('templateKeywords').value.trim();

        // Validation
        if (!name || !content) {
            this.showNotification('Şablon adı ve içeriği zorunludur.', 'error');
            return;
        }

        if (content.length < 10) {
            this.showNotification('Mesaj içeriği en az 10 karakter olmalıdır.', 'error');
            return;
        }

        // Şablon zaten var mı kontrol et
        const existingTemplate = this.templates.find(t => t.name.toLowerCase() === name.toLowerCase());
        if (existingTemplate) {
            this.showNotification('Bu isimde bir şablon zaten mevcut.', 'error');
            return;
        }

        // Yeni şablon objesi oluştur
        const newTemplate = {
            id: Date.now().toString(),
            name: name,
            category: category,
            content: content,
            keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
            createdAt: new Date().toISOString(),
            lastUsed: null,
            usage: 0
        };

        // Şablon listesine ekle
        this.templates.push(newTemplate);
        
        // UI'ı güncelle  
        this.renderTemplates();
        
        // Modal'ı kapat
        document.getElementById('addTemplateModal').remove();
        
        // Başarı mesajı
        this.showNotification(`"${name}" şablonu başarıyla oluşturuldu.`, 'success');
        
        console.log('✅ Yeni şablon eklendi:', newTemplate);
    }

    // Toplu kişi içe aktarma
    importBulkContacts() {
        // Excel/CSV dosyası yükleme modal'ı oluştur
        const modalHTML = `
            <div class="modal active" id="importContactsModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Toplu Kişi İçe Aktarma</h3>
                        <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="contactFile">Excel/CSV Dosyası Seçin</label>
                            <input type="file" id="contactFile" accept=".csv,.xlsx,.xls" />
                            <small style="color: #666; font-size: 0.85rem;">
                                Desteklenen formatlar: CSV, Excel (.xlsx, .xls)<br>
                                Sütun sırası: Ad, Telefon, Email, Grup, Notlar
                            </small>
                        </div>
                        <div class="form-group">
                            <h4>Örnek Format:</h4>
                            <table style="width: 100%; border: 1px solid #ddd; margin-top: 10px;">
                                <thead style="background: #f5f5f5;">
                                    <tr>
                                        <th style="padding: 8px; border: 1px solid #ddd;">Ad Soyad</th>
                                        <th style="padding: 8px; border: 1px solid #ddd;">Telefon</th>
                                        <th style="padding: 8px; border: 1px solid #ddd;">Email</th>
                                        <th style="padding: 8px; border: 1px solid #ddd;">Grup</th>
                                        <th style="padding: 8px; border: 1px solid #ddd;">Notlar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="padding: 8px; border: 1px solid #ddd;">Ahmet Yılmaz</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">905301234567</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">ahmet@email.com</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">Müşteri</td>
                                        <td style="padding: 8px; border: 1px solid #ddd;">VIP müşteri</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">İptal</button>
                        <button type="button" class="btn btn-primary" onclick="crm.processImportFile()">İçe Aktar</button>
                    </div>
                </div>
            </div>
        `;
        
        // Modal'ı DOM'a ekle
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Dosya içe aktarma işlemi
    processImportFile() {
        const fileInput = document.getElementById('contactFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showNotification('Lütfen bir dosya seçin.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                let contacts = [];
                
                if (file.name.endsWith('.csv')) {
                    contacts = this.parseCSV(content);
                } else {
                    this.showNotification('Excel dosyaları şu anda desteklenmiyor. CSV kullanın.', 'error');
                    return;
                }
                
                this.importParsedContacts(contacts);
                
            } catch (error) {
                console.error('Dosya okuma hatası:', error);
                this.showNotification('Dosya okunamadı: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    }

    // CSV parse et
    parseCSV(content) {
        const lines = content.split('\n');
        const contacts = [];
        
        // İlk satırı header olarak atla
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
            
            if (columns.length >= 2) {
                const contact = {
                    name: columns[0] || '',
                    phone: columns[1] || '',
                    email: columns[2] || '',
                    group: columns[3] || 'İçe Aktarılan',
                    notes: columns[4] || 'Toplu içe aktarma'
                };
                
                if (contact.name && contact.phone) {
                    contacts.push(contact);
                }
            }
        }
        
        return contacts;
    }

    // Parse edilmiş kişileri içe aktar
    importParsedContacts(contacts) {
        let imported = 0;
        let skipped = 0;
        
        contacts.forEach(contactData => {
            // Telefon numarası formatını kontrol et
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(contactData.phone)) {
                skipped++;
                return;
            }
            
            // Kişi zaten var mı kontrol et
            const existingContact = this.contacts.find(c => c.phone === contactData.phone);
            if (existingContact) {
                skipped++;
                return;
            }
            
            // Yeni kişi objesi oluştur
            const newContact = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: contactData.name,
                phone: contactData.phone,
                email: contactData.email,
                group: contactData.group,
                notes: contactData.notes,
                status: 'active',
                createdAt: new Date().toISOString(),
                whatsappData: false
            };
            
            this.contacts.push(newContact);
            imported++;
        });
        
        // UI'ı güncelle
        this.renderContacts();
        this.updateStats();
        
        // Modal'ı kapat
        document.getElementById('importContactsModal').remove();
        
        // Sonuç mesajı
        this.showNotification(`Toplu içe aktarma tamamlandı: ${imported} kişi eklendi, ${skipped} kişi atlandı.`, 'success');
        
        console.log(`✅ Toplu içe aktarma: ${imported} eklendi, ${skipped} atlandı`);
    }

    // İstatistikleri güncelle
    updateStats() {
        try {
            // Toplam istatistikler
            const totalContacts = this.contacts ? this.contacts.length : 0;
            const totalGroups = this.whatsappGroups ? this.whatsappGroups.length : 0;
            const totalTemplates = this.templates ? this.templates.length : 0;
            
            // Aktif kişiler (WhatsApp'tan gelenler vs manual)
            const whatsappContacts = this.contacts ? this.contacts.filter(c => c.whatsappData === true).length : 0;
            const manualContacts = this.contacts ? this.contacts.filter(c => c.whatsappData === false).length : 0;
            
            // DOM elementlerini güncelle
            const statsElements = {
                'totalContacts': totalContacts,
                'totalGroups': totalGroups, 
                'totalTemplates': totalTemplates,
                'whatsappContacts': whatsappContacts,
                'manualContacts': manualContacts
            };
            
            Object.entries(statsElements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                }
            });
            
            // Dashboard özet kartları güncelle
            this.updateDashboardStats(totalContacts, totalGroups, totalTemplates);
            
            console.log('📊 İstatistikler güncellendi:', {
                totalContacts,
                totalGroups, 
                totalTemplates,
                whatsappContacts,
                manualContacts
            });
            
        } catch (error) {
            console.error('❌ İstatistik güncelleme hatası:', error);
        }
    }

    // Dashboard istatistik kartlarını güncelle
    updateDashboardStats(contacts, groups, templates) {
        try {
            // Ana istatistik kartları
            const statCards = document.querySelectorAll('.stat-card');
            statCards.forEach(card => {
                const titleElement = card.querySelector('h3');
                if (titleElement) {
                    const title = titleElement.textContent.trim();
                    let value = 0;
                    
                    if (title.includes('Kişi') || title.includes('Contacts')) {
                        value = contacts;
                    } else if (title.includes('Grup') || title.includes('Groups')) {
                        value = groups;
                    } else if (title.includes('Şablon') || title.includes('Templates')) {
                        value = templates;
                    }
                    
                    const valueElement = card.querySelector('.stat-value, h2');
                    if (valueElement) {
                        valueElement.textContent = value;
                    }
                }
            });
            
        } catch (error) {
            console.log('Dashboard stat güncelleme hatası:', error);
        }
    }
}

// Initialize CRM when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.crm = new WhatsAppCRM();
});

// Confirm send from preview modal
document.addEventListener('click', (e) => {
    if (e.target.id === 'confirmSend') {
        document.getElementById('previewModal').classList.remove('active');
        window.crm.sendBulkMessage();
    }
});