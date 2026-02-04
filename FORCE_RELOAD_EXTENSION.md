# Force Reload Extension (Clear Cache)

Chrome is loading the old cached version of popup.js. Follow these steps:

## Method 1: Hard Reload (Recommended)

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Find "ClickSummary: AI YouTube Summarizer"
4. Click **Remove** (yes, remove it completely)
5. Click **Load unpacked**
6. Select folder: `/Users/kbadole/Documents/projects/youtube-extension-2/youtube-summarizer`
7. Extension reloads with fresh code

## Method 2: Clear Service Worker Cache

1. Go to `chrome://extensions`
2. Find your extension
3. Click **"service worker"** link
4. In the console that opens, paste:

```javascript
// Clear all caches
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
  console.log('✅ Caches cleared');
});

// Clear storage
chrome.storage.local.clear(() => {
  console.log('✅ Storage cleared');
});

// Force reload
chrome.runtime.reload();
```

## Method 3: Restart Chrome

1. Close Chrome completely (Cmd+Q on Mac, not just close window)
2. Reopen Chrome
3. Go to `chrome://extensions`
4. Click reload icon on your extension

## Verify It's Working

After reloading, open extension popup and check the console (F12):
- Should see: `🔐 Sign-in button clicked - starting extension-native Google OAuth`
- Should see: `chrome.identity.getAuthToken` being called
- Should NOT see: `Opening URL: https://www.clicksummary.com/signin`

If you still see website opening, the old code is still cached.
