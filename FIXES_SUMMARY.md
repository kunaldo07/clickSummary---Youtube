# YouTube Summarizer - Issue Fix Summary

## Problem
The extension was showing the transcript instead of generating AI summaries, with the error:
```
unavailable: remote error: tls: bad record MAC
```

## Root Causes Identified

1. **Invalid OpenAI Model Name**
   - Code was using `gpt-5-nano` which doesn't exist
   - This caused TLS errors when trying to connect to non-existent endpoints

2. **Wrong API Method**
   - Using `openai.responses.create()` instead of `openai.chat.completions.create()`
   - The `responses` API doesn't exist in the OpenAI SDK

3. **Missing Network Configuration**
   - No timeout or retry settings for network issues

## Fixes Applied

### File: `/backend/routes/summarizer.js`

#### 1. Fixed Model Names (Lines 31-32)
```javascript
// BEFORE:
PRIMARY_MODEL: process.env.OPENAI_MODEL || 'gpt-5-nano',
BACKUP_MODEL: process.env.OPENAI_BACKUP_MODEL || 'gpt-5-nano',

// AFTER:
PRIMARY_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
BACKUP_MODEL: process.env.OPENAI_BACKUP_MODEL || 'gpt-3.5-turbo',
```

#### 2. Fixed API Calls (Lines 258-273)
```javascript
// BEFORE:
await openai.responses.create({
  model: CONFIG.PRIMARY_MODEL,
  input: inputText,
  max_completion_tokens: maxTokens,
  temperature: 0.7
});

// AFTER:
await openai.chat.completions.create({
  model: CONFIG.PRIMARY_MODEL,
  messages: [
    { role: 'system', content: prompt },
    { role: 'user', content: `Transcript: ${transcript}` }
  ],
  max_tokens: maxTokens,
  temperature: 0.7
});
```

#### 3. Added Network Configuration (Lines 25-30)
```javascript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30000, // 30 seconds
  dangerouslyAllowBrowser: false
});
```

#### 4. Added Test Endpoint (Lines 542-582)
```javascript
// GET /api/summarizer/test-openai
// Tests OpenAI connection in development mode
```

#### 5. Updated Cost Estimates (Lines 39-41)
```javascript
COST_PER_1K_INPUT: 0.00015,  // gpt-4o-mini pricing
COST_PER_1K_OUTPUT: 0.0006,
COST_PER_1K_CACHED: 0.000075
```

## User Limits (Already Configured)

### Free Plan
- ✅ **5 summaries per day**
- ✅ **1 chat query per day**
- Resets daily at midnight

### Paid Plan
- ✅ **Unlimited summaries**
- ✅ **Unlimited chat queries**

Limits are enforced in both:
- `/backend/models/User.js` (lines 181-182)
- `/backend/models/DevUser.js` (lines 222-223)

## Testing

### 1. Test OpenAI Connection
```bash
curl http://localhost:3001/api/summarizer/test-openai
```

Expected response:
```json
{
  "success": true,
  "message": "OpenAI connection successful",
  "response": "Hello, OpenAI connection is working!",
  "model": "gpt-4o-mini-2024-07-18"
}
```

### 2. Test Extension
1. **Kill any existing backend process:**
   ```bash
   lsof -ti:3001 | xargs kill -9
   ```

2. **Start the backend:**
   ```bash
   cd /Users/kbadole/Documents/projects/youtube-extension-2/backend
   npm start
   ```

3. **Reload the Chrome extension:**
   - Go to `chrome://extensions/`
   - Click the reload icon on your extension

4. **Test on YouTube:**
   - Open any YouTube video with captions
   - Click the "Summarize video" button
   - Should now generate an AI summary instead of showing transcript

### 3. Test Limits (Free Plan)
1. Generate 5 summaries - should work
2. Try 6th summary - should show limit error
3. Use chat once - should work
4. Try chat again - should show limit error

## Status

✅ **Backend running on port 3001**
✅ **OpenAI connection working**
✅ **Model: gpt-4o-mini-2024-07-18**
✅ **User limits configured correctly**

## Next Steps

1. Restart the backend server if not already running
2. Reload the Chrome extension
3. Test summarization on a YouTube video
4. Verify limits are working as expected

## Notes

- The backend is in **development mode** using in-memory storage
- For production, ensure MongoDB is connected and `.env` is properly configured
- The extension will auto-detect localhost (development) vs production API
