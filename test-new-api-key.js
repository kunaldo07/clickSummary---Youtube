// Test New API Key - Paste this in YouTube console to verify the updated key

async function testNewAPIKey() {
    console.log('🔑 Testing Updated API Key...');
    console.log('===================================');
    
    // Get the API key from the extension (if accessible)
    console.log('1. Checking if extension is loaded...');
    if (window.youtubeSummarizer) {
        console.log('✅ Extension found and loaded');
    } else {
        console.log('❌ Extension not found - try refreshing the page');
        return;
    }
    
    // Test API connection with the new key
    console.log('\n2. Testing API connection...');
    try {
        // Send a test request through the extension's background script
        chrome.runtime.sendMessage({
            action: 'testAPI' // We'll create this test action
        }, (response) => {
            if (response && response.success) {
                console.log('✅ API key test successful');
            } else {
                console.log('❌ API key test failed:', response?.error);
            }
        });
        
        // Also test direct API call
        await testDirectAPICall();
        
    } catch (error) {
        console.log('❌ API test error:', error.message);
    }
    
    // Test summary generation
    console.log('\n3. Testing summary generation...');
    await testSummaryGeneration();
}

async function testDirectAPICall() {
    // Test the API key with a simple direct call
    try {
        console.log('Testing direct API call...');
        
        // Note: In a real extension, we'd get this from the background script
        // This is just for testing - replace with your actual new key
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer [YOUR_NEW_API_KEY_HERE]`, // Extension will use the real key
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            console.log('✅ Direct API call successful');
            const data = await response.json();
            console.log('Available models:', data.data?.length || 0);
        } else {
            console.log('❌ Direct API call failed:', response.status, response.statusText);
            
            if (response.status === 401) {
                console.log('🚨 API key is still invalid or not updated properly');
            } else if (response.status === 429) {
                console.log('🚨 Rate limit hit - try again in a moment');
            } else if (response.status === 402) {
                console.log('🚨 Billing issue - check your OpenAI account');
            }
        }
    } catch (error) {
        console.log('❌ Direct API test failed:', error.message);
    }
}

async function testSummaryGeneration() {
    if (!window.youtubeSummarizer) {
        console.log('❌ Extension not available for summary test');
        return;
    }
    
    // Check if we have transcript data
    if (window.youtubeSummarizer.transcriptData) {
        console.log('✅ Transcript data available for testing');
        console.log('Transcript length:', window.youtubeSummarizer.transcriptData.length);
        
        // Test summary generation with new API key
        console.log('Attempting summary generation...');
        
        const testTranscript = typeof window.youtubeSummarizer.transcriptData === 'string' 
            ? window.youtubeSummarizer.transcriptData.substring(0, 1000)
            : 'This is a test transcript for API key validation.';
        
        chrome.runtime.sendMessage({
            action: 'summarizeAdvanced',
            data: {
                transcript: testTranscript,
                videoId: window.youtubeSummarizer.currentVideoId || 'test',
                type: 'insightful',
                length: 'auto',
                format: 'list'
            }
        }, (response) => {
            if (response && response.summary) {
                console.log('✅ Summary generation successful with new API key!');
                console.log('Summary preview:', response.summary.substring(0, 200) + '...');
                
                // Update the display
                if (window.youtubeSummarizer.summaries) {
                    window.youtubeSummarizer.summaries.insightful = { auto: response.summary };
                    window.youtubeSummarizer.updateSummaryDisplay();
                }
                
            } else if (response && response.error) {
                console.log('❌ Summary generation failed:', response.error);
                
                if (response.error.includes('API key')) {
                    console.log('🚨 API key issue - make sure the new key is properly saved');
                } else if (response.error.includes('quota') || response.error.includes('billing')) {
                    console.log('🚨 Check your OpenAI account billing and quota');
                } else {
                    console.log('🚨 Other error - check the specific message above');
                }
            } else {
                console.log('❌ No response received from background script');
            }
        });
        
    } else {
        console.log('⚠️ No transcript data available - trying to extract...');
        
        try {
            const transcript = await window.youtubeSummarizer.extractTranscript();
            if (transcript) {
                console.log('✅ Transcript extracted successfully');
                window.youtubeSummarizer.transcriptData = transcript;
                // Retry the test
                setTimeout(() => testSummaryGeneration(), 1000);
            } else {
                console.log('❌ Could not extract transcript from this video');
                console.log('Try a video with captions (CC button visible)');
            }
        } catch (error) {
            console.log('❌ Transcript extraction failed:', error.message);
        }
    }
}

function quickTestSteps() {
    console.log('\n📋 Quick Test Steps:');
    console.log('1. Make sure you saved the background.js file with the new API key');
    console.log('2. Go to chrome://extensions/ and reload the extension');
    console.log('3. Come back to this YouTube video and wait for it to load');
    console.log('4. Look for the summarizer box below the video');
    console.log('5. Try generating a summary');
    console.log('\nIf issues persist:');
    console.log('- Check https://platform.openai.com/account/billing');
    console.log('- Verify API key starts with "sk-proj-" or "sk-"');
    console.log('- Try a different YouTube video with clear CC button');
}

// Run the test
testNewAPIKey();
quickTestSteps();

console.log('\n🎯 Next: Try generating a summary in the extension interface!');
