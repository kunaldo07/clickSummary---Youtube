# Extension-Native Authentication Setup

## What Changed

We've implemented **extension-native Google OAuth** for both YouTube and Reddit extensions. This removes the dependency on having the ClickSummary website open and makes the reviewer flow straightforward.

### Key Changes:
1. **YouTube Extension** (`youtube-summarizer/`)
   - Added `identity` permission to manifest
   - Added `oauth2` config to manifest (needs your Google Client ID)
   - Replaced website-dependent sign-in with `chrome.identity.getAuthToken()`
   - Simplified popup UI (removed retry button and website instructions)

2. **Backend** (`backend/routes/supabaseAuth.js`)
   - Added `POST /api/auth/extension/google` endpoint
   - Exchanges Google OAuth token for ClickSummary session
   - Returns user profile + subscription status

## Required: Google OAuth Configuration

### Step 1: Get Your Google OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Chrome Extension**
6. Add your extension ID(s):
   - YouTube: `cijajcbmplbiidgaeooocnfhjhcahnil`
   - Reddit: `ablekmobghbgmpeklpdbfpnhgeloihop`
7. Copy the generated Client ID (format: `xxxxx.apps.googleusercontent.com`)

### Step 2: Update Extension Manifests

Replace `YOUR_GOOGLE_CLIENT_ID` in these files:

**youtube-summarizer/manifest.json** (line 17):
```json
"oauth2": {
  "client_id": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
  ]
}
```

**reddit-extension-v2/public/manifest.json** (add similar block)

### Step 3: Deploy Backend Changes

The backend endpoint `/api/auth/extension/google` is ready. Deploy to EC2:

```bash
cd ~/clickSummary---Youtube
git pull origin master
cd backend
pm2 restart clicksummary-backend
```

## How It Works Now

### User Flow (Reviewer-Friendly):
1. Install extension
2. Open popup → click "Sign In with Google"
3. Google account picker appears (extension-native)
4. After selection, extension exchanges token with backend
5. User is authenticated immediately
6. Go to YouTube video → use summarizer

### No Website Dependency:
- Extension works standalone
- Subscription status fetched from shared backend (by email)
- Website login is separate but uses same account

## Testing Locally

1. Update manifest with your Client ID
2. Load extension unpacked in Chrome
3. Open popup → click Sign In
4. Should see Google account picker
5. After sign-in, popup shows authenticated view

## For Chrome Web Store Submission

Update your listing description:

**Short Description:**
"Requires Google sign-in (free account available). Works on YouTube video pages (/watch URLs)."

**Reviewer Notes:**
"Steps to test:
1. Install extension
2. Click extension icon → Sign In with Google
3. Complete sign-in
4. Open any YouTube video (https://www.youtube.com/watch?v=...)
5. Extension UI appears on page with Summarize button"

## Troubleshooting

### "chrome.identity is not defined"
- Ensure `"identity"` is in manifest permissions
- Reload extension after manifest changes

### "Invalid OAuth client"
- Verify Client ID matches Google Cloud Console
- Ensure extension ID is added to OAuth consent screen

### Backend returns 401
- Check backend logs for Google userinfo API errors
- Verify `GOOGLE_CLIENT_ID` env var is set on backend (if needed)

## Next Steps

1. Get Google OAuth Client ID from Cloud Console
2. Update both extension manifests
3. Test locally with unpacked extension
4. Commit changes
5. Create Web Store zip files
6. Resubmit with updated reviewer notes
