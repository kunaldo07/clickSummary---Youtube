// Comprehensive Debug Tool - Paste this in YouTube console
// This will check every step of the summary generation process

async function comprehensiveDebug() {
    console.clear();
    console.log('🔧 COMPREHENSIVE EXTENSION DEBUG');
    console.log('=====================================');
    
    let step = 1;
    
    // Step 1: Check Extension Loading
    console.log(`${step++}. Checking Extension Loading...`);
    if (typeof chrome === 'undefined') {
        console.log('❌ Chrome APIs not available');
        return;
    }
    
    if (!window.youtubeSummarizer) {
        console.log('❌ Extension not loaded on this page');
        console.log('💡 Solution: Refresh the page (Ctrl+R or Cmd+R)');
        return;
    }
    console.log('✅ Extension loaded successfully');
    
    // Step 2: Check Extension State
    console.log(`\n${step++}. Checking Extension State...`);
    console.log('Current video ID:', window.youtubeSummarizer.currentVideoId);
    console.log('Is processing:', window.youtubeSummarizer.isProcessing);
    console.log('Summary container exists:', !!window.youtubeSummarizer.summaryContainer);
    
    if (!window.youtubeSummarizer.currentVideoId) {
        console.log('❌ No video ID detected');
        console.log('💡 Make sure you\'re on a YouTube video page (/watch?v=...)');
        return;
    }
    
    // Step 3: Check UI Container
    console.log(`\n${step++}. Checking UI Container...`);
    const container = document.querySelector('#youtube-summarizer-container');
    if (container) {
        console.log('✅ Extension UI container found');
        console.log('Container visible:', container.style.display !== 'none');
    } else {
        console.log('❌ Extension UI container not found');
        console.log('💡 Trying to create container...');
        if (window.youtubeSummarizer.createSummaryContainer) {
            window.youtubeSummarizer.createSummaryContainer();
            console.log('Container creation attempted');
        }
    }
    
    // Step 4: Check Video Captions
    console.log(`\n${step++}. Checking Video Captions...`);
    const ccButton = document.querySelector('button[aria-label*="captions"]') || 
                    document.querySelector('button[aria-label*="Captions"]') ||
                    document.querySelector('.ytp-subtitles-button');
    
    if (ccButton) {
        console.log('✅ Captions button found - video has subtitles');
    } else {
        console.log('❌ No captions button found');
        console.log('💡 Try a video with visible CC button like:');
        console.log('   https://www.youtube.com/watch?v=jNQXAC9IVRw');
        console.log('   https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    }
    
    // Step 5: Check Transcript Data
    console.log(`\n${step++}. Checking Transcript Data...`);
    if (window.youtubeSummarizer.transcriptData) {
        const transcript = window.youtubeSummarizer.transcriptData;
        if (typeof transcript === 'string') {
            console.log('✅ Transcript available (string):', transcript.length, 'characters');
            console.log('Preview:', transcript.substring(0, 150) + '...');
        } else if (Array.isArray(transcript)) {
            console.log('✅ Transcript available (array):', transcript.length, 'segments');
            console.log('First segment:', transcript[0]);
        } else {
            console.log('⚠️ Transcript in unexpected format:', typeof transcript);
        }
    } else {
        console.log('❌ No transcript data available');
        console.log('💡 Attempting manual extraction...');
        
        try {
            const extractedTranscript = await window.youtubeSummarizer.extractTranscript();
            if (extractedTranscript) {
                console.log('✅ Manual extraction successful');
                window.youtubeSummarizer.transcriptData = extractedTranscript;
            } else {
                console.log('❌ Manual extraction failed');
                console.log('💡 This video may not have accessible captions');
                return;
            }
        } catch (error) {
            console.log('❌ Extraction error:', error.message);
            return;
        }
    }
    
    // Step 6: Test Background Script Communication
    console.log(`\n${step++}. Testing Background Script Communication...`);
    try {
        chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('❌ Background script communication failed:', chrome.runtime.lastError.message);
                console.log('💡 Try reloading the extension in chrome://extensions/');
            } else {
                console.log('✅ Background script communication working');
            }
        });
    } catch (error) {
        console.log('❌ Cannot communicate with background script:', error.message);
    }
    
    // Step 7: Test API Key
    console.log(`\n${step++}. Testing API Key...`);
    await testAPIKeyDirectly();
    
    // Step 8: Test Summary Generation
    console.log(`\n${step++}. Testing Summary Generation...`);
    await testSummaryGeneration();
}

async function testAPIKeyDirectly() {
    try {
        // Test if we can make a simple API call
        console.log('Making test API call...');
        
        chrome.runtime.sendMessage({
            action: 'summarizeAdvanced',
            data: {
                transcript: 'This is a test transcript to verify the API key is working properly.',
                videoId: 'test',
                type: 'insightful',
                length: 'auto',
                format: 'list'
            }
        }, (response) => {
            if (response && response.summary) {
                console.log('✅ API key working! Test summary generated');
                console.log('Test summary:', response.summary.substring(0, 100) + '...');
            } else if (response && response.error) {
                console.log('❌ API error:', response.error);
                
                if (response.error.includes('Invalid API key') || response.error.includes('401')) {
                    console.log('🚨 API KEY ISSUE: Your API key is invalid');
                    console.log('💡 Check: https://platform.openai.com/api-keys');
                } else if (response.error.includes('quota') || response.error.includes('billing') || response.error.includes('402')) {
                    console.log('🚨 BILLING ISSUE: Your OpenAI account needs payment');
                    console.log('💡 Check: https://platform.openai.com/account/billing');
                } else if (response.error.includes('429')) {
                    console.log('🚨 RATE LIMIT: Too many requests');
                    console.log('💡 Wait a moment and try again');
                } else {
                    console.log('🚨 OTHER API ERROR:', response.error);
                }
            } else {
                console.log('❌ No response from API test');
            }
        });
        
    } catch (error) {
        console.log('❌ API test failed:', error.message);
    }
}

async function testSummaryGeneration() {
    if (!window.youtubeSummarizer.transcriptData) {
        console.log('❌ Cannot test - no transcript data');
        return;
    }
    
    console.log('Attempting full summary generation...');
    
    try {
        // Clear any existing summaries
        window.youtubeSummarizer.summaries = null;
        
        // Try to generate summaries
        if (window.youtubeSummarizer.generateAllSummaries) {
            console.log('Calling generateAllSummaries...');
            await window.youtubeSummarizer.generateAllSummaries();
        } else {
            console.log('generateAllSummaries method not found');
        }
        
        // Check if summaries were generated
        setTimeout(() => {
            if (window.youtubeSummarizer.summaries) {
                console.log('✅ Summaries generated successfully!');
                console.log('Available summaries:', Object.keys(window.youtubeSummarizer.summaries));
                
                // Update display
                if (window.youtubeSummarizer.updateSummaryDisplay) {
                    window.youtubeSummarizer.updateSummaryDisplay();
                    console.log('✅ Display updated');
                }
            } else {
                console.log('❌ No summaries generated');
            }
        }, 5000);
        
    } catch (error) {
        console.log('❌ Summary generation error:', error.message);
    }
}

function showNextSteps() {
    console.log('\n📋 NEXT STEPS BASED ON RESULTS:');
    console.log('================================');
    console.log('1. If API key invalid: Get new key from https://platform.openai.com/api-keys');
    console.log('2. If billing issue: Add payment method at https://platform.openai.com/account/billing');
    console.log('3. If no transcript: Try different video with CC button');
    console.log('4. If extension not loaded: Refresh page (Ctrl+R)');
    console.log('5. If background script issues: Reload extension at chrome://extensions/');
    console.log('\n🔄 Quick fixes to try:');
    console.log('- location.reload() // Refresh page');
    console.log('- Try video: https://www.youtube.com/watch?v=jNQXAC9IVRw');
}

// Run comprehensive debug
comprehensiveDebug();

// Show next steps after a delay
setTimeout(showNextSteps, 2000);

console.log('\n⏳ Running comprehensive debug... Check results above in 10 seconds.');
