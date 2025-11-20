# Authentication Sync Fix

## Problem
The extension popup was showing users as logged in even after they signed out from the website/panel. This created a confusing UX where:
- User signs out from website → localStorage cleared
- Popup still shows logged in → chrome.storage.local not cleared
- Panel shows logged out but popup shows logged in

## Root Causes

### 1. **No Token Validation**
The popup was trusting `chrome.storage.local` data without validating if the token was still valid with the backend.

### 2. **Missing Auth Change Notifications**
When the background script received `userSignedOut` message, it cleared storage but didn't notify the popup to refresh its UI.

## Solutions Implemented

### 1. Token Validation (popup.js)
Added `validateTokenWithBackend()` function that:
- Checks token validity with backend API (`/auth/validate`)
- Clears extension storage if token is invalid/expired
- Handles network errors gracefully (assumes valid to avoid false negatives)

```javascript
async function validateTokenWithBackend(token) {
  const response = await fetch(`${BACKEND_URL}/auth/validate`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    return data.valid === true;
  } else if (response.status === 401 || response.status === 403) {
    return false; // Token is invalid
  }
  return true; // Assume valid on other errors
}
```

### 2. Auth Change Notifications (background.js)
Enhanced `userSignedOut` handler to broadcast auth changes:
- Sends `authStatusChanged` message to popup
- Sends `authStatusChanged` message to all content scripts/panels
- Ensures all components refresh their auth state

```javascript
if (request.action === 'userSignedOut') {
  chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user'], () => {
    // Notify popup
    chrome.runtime.sendMessage({ action: 'authStatusChanged' });
    
    // Notify all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'authStatusChanged' });
      });
    });
  });
}
```

## How It Works Now

### Scenario 1: User Opens Popup After Logout
1. Popup reads `chrome.storage.local`
2. Finds token, validates with backend
3. Backend returns 401 (invalid)
4. Popup clears storage and shows sign-in screen ✅

### Scenario 2: User Logs Out While Popup is Open
1. Website clears localStorage
2. Auth-bridge detects change, sends `userSignedOut` to background
3. Background clears `chrome.storage.local`
4. Background sends `authStatusChanged` to popup
5. Popup reinitializes and shows sign-in screen ✅

### Scenario 3: User Logs Out from Website
1. Website clears localStorage
2. Auth-bridge sends `userSignedOut`
3. Background clears extension storage
4. Background notifies all tabs/popup
5. All components show logged-out state ✅

## Backend Requirement

The backend needs to implement the `/auth/validate` endpoint:

```javascript
// Example implementation
router.get('/auth/validate', authenticateToken, (req, res) => {
  // If authenticateToken middleware passes, token is valid
  res.json({ valid: true, user: req.user });
});
```

This endpoint should:
- Return `200` with `{ valid: true }` if token is valid
- Return `401` or `403` if token is invalid/expired
- Use the same authentication middleware as other protected routes

## Testing Checklist

- [ ] Sign out from website → Open popup → Should show sign-in screen
- [ ] Sign out from popup → Refresh website → Should show logged out
- [ ] Sign out from website → Panel should update to logged out
- [ ] Open popup while logged in → Should validate token and show user info
- [ ] Token expires → Open popup → Should detect and show sign-in screen
- [ ] Sign in from website → Open popup → Should show authenticated view

## Files Modified

1. **popup.js**
   - Added `validateTokenWithBackend()` function
   - Modified `checkAuthenticationStatus()` to validate tokens

2. **background.js**
   - Enhanced `userSignedOut` handler to broadcast auth changes
   - Added notifications to popup and content scripts

## Notes

- Token validation happens on every popup open to ensure fresh auth state
- Network errors during validation are handled gracefully (assumes valid)
- Auth-bridge continues to work as before, syncing localStorage ↔ chrome.storage
- All components now receive real-time auth status updates
