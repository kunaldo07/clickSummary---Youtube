# 🔧 Extension Popup Button Debug Guide

## 🎯 **Issue: Extension Popup Buttons Not Working**

The "Sign In with Google" and "Go to Website" buttons in your Chrome extension popup are not responding. Let's debug this step by step.

## 🔍 **Step 1: Debug the Extension Popup**

### **Open Extension Popup Console:**
1. **Right-click** on your extension icon in Chrome
2. **Select "Inspect popup"** (this opens DevTools for the popup)
3. **Click on Console tab** in DevTools
4. **Click your extension icon** to open the popup (while DevTools is open)

### **Expected Console Output:**
```javascript
🚀 Initializing extension popup...
🔍 Environment check: {chrome: true, chromeTabs: true, chromeStorage: true, ...}
🔍 Starting enhanced authentication status check...
📊 Extension storage contents: {...}
```

## 🧪 **Step 2: Test Button Functionality**

### **If NOT Authenticated (should see Sign In view):**
```javascript
// Expected in console:
🔧 Setting up not-authenticated handlers...
✅ Sign-in button found, attaching handler

// Then click the "Sign In / Get Started" button
// Expected:
🔐 Sign-in button clicked!
🌐 Opening URL: http://localhost:3002/signin
✅ Tab created successfully: [tab-id]
```

### **If Authenticated (should see profile + Go to Website):**
```javascript
// Expected in console:
🔧 Setting up authenticated handlers...
✅ Go-to-website button found, attaching handler

// Then click "Go to Website" button
// Expected:
🌐 Go-to-website button clicked!
🌐 Opening URL: http://localhost:3002
✅ Tab created successfully: [tab-id]
```

## ❌ **Common Issues & Fixes**

### **Issue 1: Button Not Found**
**Console shows:** `❌ Sign-in button not found!` or `❌ Go-to-website button not found!`

**Fix:**
1. Check if you're looking at the right view (loading/not-authenticated/authenticated)
2. Verify button IDs in HTML match what JavaScript expects

### **Issue 2: Chrome API Not Available**
**Console shows:** `❌ Chrome tabs API not available`

**Fix:**
1. Make sure extension is properly loaded
2. Check `manifest.json` has `"tabs"` permission (✅ yours does)
3. Reload extension: Chrome → Extensions → Click reload button

### **Issue 3: Tab Creation Fails**
**Console shows:** `❌ Error creating tab: [some error]`

**Fix:**
1. Check if URLs are correct (`localhost:3002`)
2. Make sure your servers are running
3. Check host_permissions in manifest.json

## 🚀 **Step 3: Manual Testing**

### **Test 1: Direct Button Click**
In the popup console, run:
```javascript
// For sign-in button test
document.getElementById('sign-in-btn').click();

// For go-to-website button test
document.getElementById('go-to-website-btn').click();
```

### **Test 2: Manual Tab Creation**
In the popup console, run:
```javascript
// Test tabs API directly
chrome.tabs.create({url: 'http://localhost:3002'}, (tab) => {
  console.log('Tab created:', tab);
});
```

## 🔧 **Step 4: Quick Fixes**

### **Fix 1: Reload Extension**
1. Chrome → Extensions → Developer mode ON
2. Find your extension → Click **Reload** button
3. Try popup buttons again

### **Fix 2: Check Server Status**
```bash
# Make sure both servers are running
# Terminal 1:
cd backend && npm start

# Terminal 2:  
cd landing-page-react && npm start
```

### **Fix 3: Test Landing Page Directly**
1. Open `http://localhost:3002` in browser
2. Make sure it loads properly
3. Sign in/out to test authentication

## 🎯 **Expected Working Flow**

### **Not Authenticated:**
1. **Extension popup opens** → Shows "Sign In / Get Started" button
2. **Click button** → Opens `http://localhost:3002/signin` in new tab
3. **Sign in on website** → Authentication syncs to extension
4. **Extension popup** → Now shows profile + "Go to Website"

### **Authenticated:**
1. **Extension popup opens** → Shows profile picture + "Go to Website" button  
2. **Click "Go to Website"** → Opens `http://localhost:3002` in new tab
3. **Landing page** → Should show you're signed in

## 🆘 **If Still Not Working**

### **Share This Debug Info:**

1. **Extension Console Output** (from popup inspect)
2. **Browser Console Output** (F12 on localhost:3002)
3. **Extension Status:**
   ```javascript
   // Run this in popup console:
   console.log('Extension ID:', chrome.runtime.id);
   console.log('Manifest:', chrome.runtime.getManifest());
   ```

4. **Button Elements Check:**
   ```javascript
   // Run this in popup console:
   console.log('Sign-in button:', document.getElementById('sign-in-btn'));
   console.log('Go-to-website button:', document.getElementById('go-to-website-btn'));
   console.log('Current view:', document.querySelector('.view:not(.hidden)'));
   ```

## 💡 **Pro Tips**

1. **Keep popup DevTools open** while testing - popup closes when you click elsewhere
2. **Check Network tab** in popup DevTools for any failed requests
3. **Test authentication sync** by signing in/out on landing page and checking popup
4. **Reload extension** after any manifest.json changes

---

## 🎉 **Success Indicators**

✅ **Console shows no errors**  
✅ **Button click handlers execute**  
✅ **New tabs open correctly**  
✅ **Authentication syncs between website and extension**  
✅ **All buttons respond to clicks**

**Follow this debug guide and let me know what you find in the console!** 🔍
