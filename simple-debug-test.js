// SIMPLE DEBUG TEST - Copy and paste this in YouTube console

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
        console.log('💡 SOLUTION: Extension may not have triggered on this video');
    }
    
    // Test 3: API test
    console.log('\n3. API Test:');
    console.log('Testing API key with simple request...');
    
    chrome.runtime.sendMessage({
        action: 'summarizeAdvanced',
        data: {
            transcript: 'This is a simple test to check if the API key works.',
            videoId: 'test-123',
            type: 'insightful',
            length: 'auto',
            format: 'list'
        }
    }, (response) => {
        if (response && response.summary) {
            console.log('✅ API KEY WORKING!');
            console.log('✅ Summary generated:', response.summary.substring(0, 100) + '...');
            console.log('\n🎉 EXTENSION IS WORKING! The issue might be:');
            console.log('   - Video has no captions');
            console.log('   - Transcript extraction failed');
            console.log('   - Extension timing issues');
        } else if (response && response.error) {
            console.log('❌ API ERROR:', response.error);
            console.log('\n🚨 PROBLEM IDENTIFIED:');
            
            if (response.error.includes('Invalid API key') || response.error.includes('401')) {
                console.log('   API key is invalid or expired');
                console.log('💡 SOLUTION: Get new key from https://platform.openai.com/api-keys');
            } else if (response.error.includes('quota') || response.error.includes('billing')) {
                console.log('   Billing/quota issue with OpenAI account');
                console.log('💡 SOLUTION: Check https://platform.openai.com/account/billing');
            } else if (response.error.includes('429')) {
                console.log('   Rate limit exceeded');
                console.log('💡 SOLUTION: Wait 5 minutes and try again');
            } else {
                console.log('   Unknown API error:', response.error);
            }
        } else {
            console.log('❌ No response from background script');
            console.log('💡 SOLUTION: Reload extension at chrome://extensions/');
        }
    });
    
    return true;
}

// Auto-run the test
simpleDebugTest();

console.log('\n📋 NEXT STEPS:');
console.log('1. Look at the results above');
console.log('2. If API working: Try forceSummaryGeneration()');
console.log('3. If API failed: Fix the specific error shown');
console.log('4. If extension not loaded: Refresh page');
