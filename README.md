# WaPlus CRM - HAIRCHIEFS WhatsApp Bulk Messaging System

🚀 **Professional WhatsApp bulk messaging system specially designed for HAIRCHIEFS partnership program.**

## ✨ Features

- 📱 **WhatsApp Integration** - Connect via QR code using whatsapp-web.js
- 💌 **Bulk Messaging** - Send messages to thousands of contacts
- 📊 **CSV/Excel Import** - Import contact lists easily  
- 🎯 **HAIRCHIEFS Templates** - 4 pre-made professional message templates
- 📈 **Real-time Progress** - Live tracking of message sending progress
- 🔄 **Message Scheduling** - Set delays between messages
- 📱 **Responsive Design** - Works on desktop and mobile
- 🛡️ **Safe & Secure** - Local deployment, your data stays private

## 🎯 HAIRCHIEFS Templates Included

1. **🔥 Partnership Opportunity** - Comprehensive partnership invitation
2. **💰 Investment Invitation** - Numbers-focused business proposal  
3. **⭐ Success Story** - Social proof and credibility building
4. **🎯 Short & Effective** - Quick and direct approach

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or development mode
npm run dev
```

Visit `http://localhost:8080` to get started.

### Deploy Options

#### Railway (Recommended)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

#### Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Deploy
git push heroku main
```

#### DigitalOcean/VPS
```bash
# Clone and install
git clone <your-repo>
cd WaplusCRM
npm install

# Start with PM2
npm install -g pm2
pm2 start simple-whatsapp-server.js --name "waplus-crm"
```

## 📋 Usage Instructions

### 1. WhatsApp Connection
- Go to `/qr` route
- Enter instance name: `hairchiefs-wa` 
- Click "Create Instance"
- Scan QR code with WhatsApp
- Wait for connection confirmation

### 2. Bulk Messaging
- Go to `/bulk` route
- Select connected instance
- Upload CSV/Excel or enter numbers manually
- Choose HAIRCHIEFS template
- Start bulk messaging

### 3. CSV Format
```csv
phone,name,email
+905551234567,Ahmet Yılmaz,ahmet@example.com
05557654321,Mehmet Ali,mehmet@example.com
```

## 🛠 Configuration

### Environment Variables
```bash
PORT=8080                    # Server port
NODE_ENV=production         # Environment
WHATSAPP_SESSION_PATH=./sessions  # Session storage path
```

### API Endpoints

- `GET /` - Main dashboard
- `GET /qr` - QR code generator page  
- `GET /bulk` - Bulk messaging page
- `POST /instance/create` - Create WhatsApp instance
- `GET /instance/connect/:name` - Get QR code
- `POST /message/sendText/:name` - Send text message
- `GET /api/status` - API status

## 🔧 Technical Details

- **Backend**: Node.js + Express
- **WhatsApp**: whatsapp-web.js library
- **Frontend**: Vanilla JS + Tailwind CSS
- **Database**: File-based session storage
- **Deployment**: Railway/Heroku ready

## 🚦 System Requirements

- Node.js >= 18.0.0
- 1GB RAM minimum
- 10GB storage for sessions
- Stable internet connection

## 🛡 Security Features

- Local session storage
- No external database required
- API key protection available
- CORS enabled for security
- Graceful error handling

## 📞 Support

For HAIRCHIEFS specific support:
- Phone: 0544 675 71 13
- Website: www.hairchiefs.com
- Location: İstanbul HC Polikliniği

## 📄 License

This project is licensed under the ISC License.

## 🎯 Built For

**HAIRCHIEFS** - Europe's largest hair transplant clinic
- 8 years of experience
- 30,000+ successful operations
- 4000 m² modern facility
- 4.9 Google rating
- Partnership opportunities available

---

*Professional bulk messaging solution for growing your business* 🚀