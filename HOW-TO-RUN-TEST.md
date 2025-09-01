# How to Run Extension Debug Test

## Step-by-Step Instructions

### 1. Open YouTube Video
- Go to: https://www.youtube.com/watch?v=jNQXAC9IVRw
- Wait for page to fully load (10 seconds)

### 2. Open Browser Console
**On Mac:**
- Press: `Cmd + Option + I`
- OR Right-click → "Inspect" → Click "Console" tab

**On Windows/Linux:**
- Press: `F12` 
- OR Right-click → "Inspect" → Click "Console" tab

### 3. Clear Console (Optional)
Type this and press Enter:
```
console.clear()
```

### 4. Copy and Paste Test Code
Copy this ENTIRE code block and paste it in the console:

```javascript
function simpleDebugTest() {
    console.clear();
    console.log('🧪 SIMPLE EXTENSION TEST');
    console.log('========================');
    
    // Test 1: Extension loaded?
    console.log('1. Extension Check:');
    if (window.youtubeSummarizer) {
        console.log('✅ Extension is loaded');
        console.log('   Video ID:', window.youtubeSummarizer.currentVideoId);
        console.log('   Processing:', window.youtubeSummarizer.isProcessing);
    } else {
        console.log('❌ Extension NOT loaded');
        console.log('💡 SOLUTION: Refresh the page (Ctrl+R or Cmd+R)');
        return false;
    }
    
    // Test 2: UI visible?
    console.log('\n2. UI Check:');
    const container = document.querySelector('#youtube-summarizer-container');
    if (container) {
        console.log('✅ Extension UI found on page');
    } else {
        console.log('❌ Extension UI not visible');
    }
    
    // Test 3: API test
    console.log('\n3. API Test:');
    console.log('Testing API key...');
    
    chrome.runtime.sendMessage({
        action: 'summarizeAdvanced',
        data: {
            transcript: 'This is a test to verify the API key works.',
            videoId: 'test-123',
            type: 'insightful',
            length: 'auto',
            format: 'list'
        }
    }, (response) => {
        if (response && response.summary) {
            console.log('✅ API KEY WORKING!');
            console.log('Summary preview:', response.summary.substring(0, 100) + '...');
        } else if (response && response.error) {
            console.log('❌ API ERROR:', response.error);
            
            if (response.error.includes('Invalid API key')) {
                console.log('🚨 API key problem - get new key from https://platform.openai.com/api-keys');
            } else if (response.error.includes('billing')) {
                console.log('🚨 Billing problem - check https://platform.openai.com/account/billing');
            }
        } else {
            console.log('❌ No response - reload extension at chrome://extensions/');
        }
    });
}

// Run the test
simpleDebugTest();
```

### 5. Press Enter
- After pasting, press Enter
- Wait 5-10 seconds for all results

### 6. Read the Results
Look for these messages in the console:

**SUCCESS (Working):**
```
✅ Extension is loaded
✅ Extension UI found on page  
✅ API KEY WORKING!
```

**PROBLEMS:**
```
❌ Extension NOT loaded → Refresh page
❌ API ERROR → Check API key or billing
❌ No response → Reload extension
```

## Troubleshooting

### If Extension Not Loaded:
1. Go to chrome://extensions/
2. Find "YouTube Video Summarizer"
3. Click reload button (🔄)
4. Refresh YouTube page
5. Try test again

### If API Error:
1. Check your OpenAI account: https://platform.openai.com/account/billing
2. Get new API key: https://platform.openai.com/api-keys
3. Update background.js file
4. Reload extension

### Screenshots of Console Location:
- Console tab is usually at the bottom or right side of developer tools
- It shows logs with timestamps
- You can type and run code directly in it
