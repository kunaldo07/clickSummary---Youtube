# 🚀 Port Configuration Guide

## 📋 Complete Port Setup

### **Frontend (React App): Port 3002**
- **URL**: `http://localhost:3002`
- **Configuration**: Automatically configured via package.json and .env

### **Backend (Node.js/Express): Port 3001**  
- **URL**: `http://localhost:3001`
- **API Base**: `http://localhost:3001/api`
- **Configuration**: Set via environment variable `PORT=3001`

## ✅ All Configurations Updated

### **1. Backend Configuration**
**File**: `/Users/kbadole/Documents/projects/youtube-extension-2/backend/config.template`
```bash
# Server Configuration - Backend runs on port 3001
PORT=3001

# CORS and Security - Frontend runs on port 3002  
CLIENT_URL=http://localhost:3002

# Google OAuth
GOOGLE_CLIENT_ID=837073239595-d82jmt90dcg6pg1suilajc7rl2auf2b8.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### **2. Frontend Configuration**
**File**: `/Users/kbadole/Documents/projects/youtube-extension-2/landing-page-react/config.template`
```bash
# Port Configuration - Frontend runs on port 3002
PORT=3002

# API Configuration - Backend runs on port 3001
REACT_APP_API_URL=http://localhost:3001/api

# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=837073239595-d82jmt90dcg6pg1suilajc7rl2auf2b8.apps.googleusercontent.com
```

### **3. Package.json Scripts Updated**
**File**: `/Users/kbadole/Documents/projects/youtube-extension-2/landing-page-react/package.json`
```json
{
  "scripts": {
    "start": "PORT=3002 react-scripts start"
  },
  "proxy": "http://localhost:3001"
}
```

### **4. Backend CORS Configuration**
**File**: `/Users/kbadole/Documents/projects/youtube-extension-2/backend/server.js`
```javascript
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3002',  // Frontend port
    `chrome-extension://${process.env.EXTENSION_ID}`
  ].filter(Boolean)
}));
```

## 🔧 Setup Instructions

### **Step 1: Create Environment Files**
```bash
# Backend
cd /Users/kbadole/Documents/projects/youtube-extension-2/backend
cp config.template .env

# Frontend  
cd /Users/kbadole/Documents/projects/youtube-extension-2/landing-page-react
cp config.template .env
```

### **Step 2: Add Google Client Secret**
In your backend `.env` file, add:
```bash
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
```

### **Step 3: Update Google Cloud Console**
In your OAuth Client settings:

**Authorized JavaScript origins:**
```
http://localhost:3002
```

**Authorized redirect URIs:**
```
http://localhost:3002/signin
```

### **Step 4: Start Both Servers**

**Terminal 1 - Backend (Port 3001):**
```bash
cd /Users/kbadole/Documents/projects/youtube-extension-2/backend
node server.js
```

**Terminal 2 - Frontend (Port 3002):**
```bash
cd /Users/kbadole/Documents/projects/youtube-extension-2/landing-page-react
npm start
```

## ✅ Expected Output

### **Backend Console:**
```
🚀 YouTube Summarizer Backend Server
=====================================
🌐 Server running on port 3001
🤖 AI Model: gpt-4o-mini
💰 Cost limit: $2.50/user/month
🔒 Environment: development
📊 Caching: disabled
=====================================
```

### **Frontend Console:**
```
webpack compiled successfully
Local:            http://localhost:3002
On Your Network:  http://192.168.x.x:3002
```

## 🧪 Testing the Complete Flow

1. **Backend Health Check**: `http://localhost:3001/api/health`
2. **Frontend Application**: `http://localhost:3002`
3. **OAuth Sign-In**: `http://localhost:3002/signin`
4. **Expected Flow**:
   - Frontend (3002) → Backend (3001) → Google OAuth → Success

## 🎯 Key Benefits

- ✅ **Clear separation**: Frontend (3002) and Backend (3001)
- ✅ **No port conflicts**: Different ports for different services
- ✅ **CORS properly configured**: Backend accepts frontend requests
- ✅ **OAuth redirects work**: Google redirects to correct port
- ✅ **Proxy setup**: Frontend can communicate with backend seamlessly

## 🔍 Troubleshooting

- **CORS errors**: Backend must be running and configured for port 3002
- **OAuth redirect errors**: Google Console must have `localhost:3002/signin`
- **Port conflicts**: Make sure ports 3001 and 3002 are available
- **Environment variables**: Both .env files must be created from templates

**All port configurations are now correctly set up! 🚀**
