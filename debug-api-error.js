// Debug API Error - Paste this in YouTube console to diagnose the issue

function debugAPIError() {
    console.log('🔧 Debugging API Error...');
    console.log('================================');
    
    // Check extension state
    if (!window.youtubeSummarizer) {
        console.log('❌ Extension not found');
        return;
    }
    
    console.log('✅ Extension found');
    console.log('Current video ID:', window.youtubeSummarizer.currentVideoId);
    console.log('Is processing:', window.youtubeSummarizer.isProcessing);
    console.log('Transcript data available:', !!window.youtubeSummarizer.transcriptData);
    
    if (window.youtubeSummarizer.transcriptData) {
        console.log('Transcript length:', window.youtubeSummarizer.transcriptData.length);
        console.log('Transcript preview:', window.youtubeSummarizer.transcriptData.substring(0, 200) + '...');
    }
    
    // Test API connection manually
    console.log('\n🌐 Testing API Connection...');
    testAPIConnection();
}

async function testAPIConnection() {
    const apiKey = 'YOUR_OPENAI_API_KEY_HERE'; // Get this from backend/.env file
    
    try {
        console.log('Testing API key validity...');
        
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            console.log('✅ API key is valid');
            const data = await response.json();
            console.log('Available models:', data.data?.length || 0);
        } else {
            console.log('❌ API key issue:', response.status, response.statusText);
            const errorData = await response.json();
            console.log('Error details:', errorData);
        }
    } catch (error) {
        console.log('❌ Network/Connection error:', error.message);
    }
    
    // Test a simple completion
    console.log('\n🧪 Testing simple completion...');
    try {
        const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: 'Say "API test successful" if you receive this message.'
                    }
                ],
                max_tokens: 50
            })
        });
        
        if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log('✅ API test response:', testData.choices[0].message.content);
        } else {
            console.log('❌ API test failed:', testResponse.status);
            const errorData = await testResponse.json();
            console.log('Error details:', errorData);
        }
    } catch (error) {
        console.log('❌ API test error:', error.message);
    }
}

function checkTranscriptAvailability() {
    console.log('\n📝 Checking transcript availability...');
    
    // Check for CC button
    const ccButton = document.querySelector('button[aria-label*="captions"]') || 
                    document.querySelector('button[aria-label*="Captions"]') ||
                    document.querySelector('.ytp-subtitles-button');
    
    if (ccButton) {
        console.log('✅ Captions button found');
    } else {
        console.log('❌ No captions button - video may not have subtitles');
    }
    
    // Check for transcript panel
    const transcriptElements = document.querySelectorAll('[id*="transcript"], [class*="transcript"]');
    console.log('Transcript elements found:', transcriptElements.length);
    
    // Check video info
    const videoTitle = document.querySelector('h1.ytd-watch-metadata')?.textContent;
    console.log('Video title:', videoTitle);
    
    const videoId = new URL(window.location.href).searchParams.get('v');
    console.log('Video ID:', videoId);
}

function manualSummaryTest() {
    console.log('\n🔄 Attempting manual summary generation...');
    
    if (window.youtubeSummarizer && window.youtubeSummarizer.transcriptData) {
        console.log('Sending manual request to background script...');
        
        chrome.runtime.sendMessage({
            action: 'summarizeAdvanced',
            transcript: window.youtubeSummarizer.transcriptData.substring(0, 2000), // Limit for testing
            videoId: window.youtubeSummarizer.currentVideoId,
            type: 'insightful',
            length: 'auto',
            format: 'list'
        }, (response) => {
            if (response.error) {
                console.log('❌ Manual test failed:', response.error);
            } else {
                console.log('✅ Manual test successful:', response.summary?.substring(0, 200) + '...');
            }
        });
    } else {
        console.log('❌ No transcript data available for manual test');
    }
}

// Run all debug checks
debugAPIError();
checkTranscriptAvailability();

console.log('\n📋 Debug Summary:');
console.log('1. Check the console output above for specific errors');
console.log('2. Common issues:');
console.log('   - API key expired or invalid');
console.log('   - OpenAI account out of credits');
console.log('   - Video has no captions/transcript');
console.log('   - Network connectivity issues');
console.log('3. Try: manualSummaryTest() for a direct test');
