# Backend Connection Issue - Diagnostic & Fix Guide

## Error Message
```
Unable to connect to backend server. Please check if the server is running.
```

## Current Status ✅
- ✅ Backend is running on port 3001 (PID: 50196)
- ✅ Backend health endpoint responding: `http://localhost:3001/api/health`
- ✅ CORS configured to accept Chrome extension requests
- ✅ MongoDB connected

## Most Likely Causes

### 1. **Extension Needs Reload** (Most Common)
After any backend changes, the Chrome extension needs to be reloaded.

**Fix:**
1. Open Chrome: `chrome://extensions/`
2. Find "ClickSummary: AI YouTube Summarizer"
3. Click the **reload icon** (circular arrow)
4. Refresh any YouTube tabs
5. Try the extension again

### 2. **Extension Using Wrong URL**
The extension might be configured to use production URL instead of localhost.

**Check:**
1. Open extension popup
2. Open browser console (F12)
3. Look for log: `🔗 API URL: http://localhost:3001/api`
4. If it shows a different URL, the config is wrong

**Fix:**
```javascript
// In browser console while on YouTube:
chrome.runtime.sendMessage({
  action: 'setConfig',
  overrides: {
    apiBaseUrl: 'http://localhost:3001/api',
    websiteUrl: 'http://localhost:3002'
  }
}, (response) => console.log('Config updated:', response));
```

### 3. **Backend Server Needs Restart**
If you made changes to CORS or server configuration.

**Fix:**
```bash
cd backend
# Kill existing server
pkill -f "node server.js"
# Or use the specific PID
kill 50196

# Restart server
npm start
# or
node server.js
```

### 4. **Network/Firewall Issue**
Localhost connections might be blocked.

**Test:**
```bash
# Test from terminal
curl http://localhost:3001/api/health

# Should return:
# {"status":"healthy","timestamp":"...","environment":"development",...}
```

If this fails, check:
- Firewall settings
- Antivirus blocking localhost
- VPN interfering with local connections

### 5. **Extension Manifest Permissions**
Verify host_permissions in manifest.json includes localhost.

**Check manifest.json:**
```json
"host_permissions": [
  "http://localhost:3001/*",  // ✅ Should be present
  "http://localhost:3002/*"
]
```

## Quick Diagnostic Steps

### Step 1: Verify Backend is Running
```bash
curl http://localhost:3001/api/health
```
Expected: `{"status":"healthy",...}`

### Step 2: Check Extension Console
1. Go to YouTube
2. Open DevTools (F12)
3. Go to Console tab
4. Look for errors or logs about backend URL

### Step 3: Check Background Script Console
1. Go to `chrome://extensions/`
2. Find ClickSummary
3. Click "service worker" link (or "Inspect views: background page")
4. Check console for errors

### Step 4: Test Direct API Call
In the background script console:
```javascript
fetch('http://localhost:3001/api/health')
  .then(r => r.json())
  .then(d => console.log('Backend response:', d))
  .catch(e => console.error('Backend error:', e));
```

## Complete Fix Procedure

### Option A: Quick Fix (Recommended)
```bash
# 1. Ensure backend is running
cd /Users/kbadole/Documents/projects/youtube-extension-2/backend
npm start

# 2. Reload extension
# Go to chrome://extensions/ and click reload

# 3. Refresh YouTube page
# Press F5 on any YouTube video page

# 4. Test extension
# Click the ClickSummary icon on a YouTube video
```

### Option B: Full Reset
```bash
# 1. Stop backend
pkill -f "node server.js"

# 2. Clear extension storage
# In browser console:
chrome.storage.local.clear()

# 3. Restart backend
cd backend
npm start

# 4. Reload extension
# chrome://extensions/ -> Reload

# 5. Reconfigure extension (if needed)
chrome.runtime.sendMessage({
  action: 'setConfig',
  overrides: {
    apiBaseUrl: 'http://localhost:3001/api'
  }
})
```

## Verification

After applying fixes, verify:

1. **Backend Health:**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Extension Config:**
   - Open extension popup
   - Check console for: `🔗 API URL: http://localhost:3001/api`

3. **Test Summarization:**
   - Go to any YouTube video
   - Click ClickSummary panel
   - Try generating a summary

## Still Not Working?

### Check Backend Logs
```bash
# View backend terminal for errors
# Look for:
# - CORS errors
# - Connection errors
# - API endpoint errors
```

### Enable Verbose Logging
In background.js console:
```javascript
localStorage.setItem('debug', 'true');
```

### Check for Port Conflicts
```bash
lsof -i :3001
# Should show node process
# If multiple processes, kill extras
```

## Environment Variables

Ensure backend `.env` file has:
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your_secret_here
MONGODB_URI=your_mongodb_uri
OPENAI_API_KEY=your_openai_key
```

## Common Mistakes

❌ **Don't:**
- Use production URLs in development
- Forget to reload extension after changes
- Mix http and https (use http for localhost)
- Block localhost in firewall

✅ **Do:**
- Always reload extension after backend changes
- Check both extension and backend consoles
- Use http://localhost (not 127.0.0.1) for consistency
- Verify CORS headers in network tab

## Contact/Debug Info

If issue persists, provide:
1. Backend console output
2. Extension background script console
3. Browser console on YouTube page
4. Output of: `curl -v http://localhost:3001/api/health`
5. Extension version and Chrome version
