# Testing Backend Connection Fix

## What Was Fixed

### Problem
Extension was failing to connect to backend with error:
```
Unable to connect to backend server. Please check if the server is running.
```

### Root Cause
The environment detection was defaulting to **PRODUCTION mode** when the localhost health check failed (due to timing/CORS issues). This caused the extension to try connecting to `https://api.clicksummary.com/api` instead of `http://localhost:3001/api`.

### Solution
1. **Changed default behavior**: Now defaults to DEVELOPMENT mode (localhost) if health check fails
2. **Better error handling**: Added detailed logging to diagnose connection issues
3. **Increased timeout**: Extended health check timeout from 2s to 3s

## How to Test the Fix

### Step 1: Reload Extension
1. Go to `chrome://extensions/`
2. Find "ClickSummary: AI YouTube Summarizer"
3. Click the **reload button** (🔄)

### Step 2: Check Background Console
1. On `chrome://extensions/` page
2. Click "service worker" link under ClickSummary
3. Look for these logs:

**Expected (Success):**
```
🚀 Initializing extension environment...
🔍 Testing localhost API (http://localhost:3001)...
✅ Localhost backend accessible - DEVELOPMENT MODE
✅ Environment detection complete
🌍 Mode: DEVELOPMENT
🔗 API URL: http://localhost:3001/api
🕸️ Website URL: http://localhost:3002
```

**Or (Fallback - Still OK):**
```
🚀 Initializing extension environment...
🔍 Testing localhost API (http://localhost:3001)...
⚠️ Localhost backend test failed: Failed to fetch
⚠️ Error type: TypeError
🔧 Network error detected - defaulting to DEVELOPMENT mode
💡 If you want PRODUCTION mode, set it manually via setConfig
✅ Environment detection complete
🌍 Mode: DEVELOPMENT
🔗 API URL: http://localhost:3001/api
```

### Step 3: Test Summarization
1. Go to any YouTube video
2. Click the ClickSummary button
3. Try generating a summary

**Expected:**
- Summary generates successfully
- OR shows authentication error (if not logged in)
- NO "Unable to connect to backend server" error

### Step 4: Check Content Script Console
1. On YouTube page, open DevTools (F12)
2. Go to Console tab
3. Look for backend connection logs

**Expected:**
```
🔗 Calling secure backend: /summarizer/summarize (attempt 1)
🌐 Full URL: http://localhost:3001/api/summarizer/summarize
📡 Backend response status: 200
✅ Backend call successful
```

## If Still Not Working

### Check Backend is Running
```bash
curl http://localhost:3001/api/health
```
Should return: `{"status":"healthy",...}`

### Force Development Mode
In background console:
```javascript
chrome.storage.local.set({
  environment_preference: { isDevelopment: true, isProduction: false }
}, () => {
  console.log('✅ Forced development mode');
  chrome.runtime.reload();
});
```

### Clear Extension Cache
```javascript
chrome.storage.local.clear(() => {
  console.log('✅ Storage cleared');
  chrome.runtime.reload();
});
```

### Manual Config Override
```javascript
chrome.runtime.sendMessage({
  action: 'setConfig',
  overrides: {
    apiBaseUrl: 'http://localhost:3001/api',
    websiteUrl: 'http://localhost:3002'
  }
}, (response) => console.log('Config set:', response));
```

## Verification Checklist

- [ ] Extension reloaded
- [ ] Background console shows DEVELOPMENT mode
- [ ] API URL is `http://localhost:3001/api`
- [ ] Backend server is running
- [ ] YouTube page refreshed
- [ ] Summary generation works

## New Error Messages

With the fix, you'll see more helpful errors:

### Network Error
```
❌ Network error: Cannot reach http://localhost:3001/api/summarizer/summarize
💡 Possible causes:
   1. Backend server not running on http://localhost:3001/api
   2. CORS issue (check backend CORS settings)
   3. Wrong URL configured (check extension config)
```

### Timeout Error
```
Backend request timed out after 30 seconds. Please check if backend is running on http://localhost:3001/api
```

### Auth Error
```
Authentication failed. Please sign in again.
```

## Files Modified

1. **background.js**
   - `detectEnvironment()`: Now defaults to development mode
   - `callSecureBackend()`: Added detailed error logging
   - Increased health check timeout to 3 seconds

## Notes

- Extension now **prefers localhost** by default
- Only switches to production if explicitly configured
- Better error messages help diagnose issues faster
- Health check timeout increased for slower systems
