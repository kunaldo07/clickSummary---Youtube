// Quick fixes to try in YouTube console

// Fix 1: Clear cache and refresh page
function clearCacheAndRefresh() {
    if (window.youtubeSummarizer) {
        console.log('🗑️ Clearing cache and refreshing page...');
        
        // Clear cache first
        if (typeof window.youtubeSummarizer.clearSummaryCache === 'function') {
            window.youtubeSummarizer.clearSummaryCache();
        }
        
        // Refresh the page
        console.log('🔄 Refreshing page...');
        location.reload();
    } else {
        console.error('❌ YouTubeSummarizer not found! Try refreshing the page.');
    }
}

// Fix 2: Reset extension state
function resetExtensionState() {
    if (window.youtubeSummarizer) {
        console.log('🔄 Resetting extension state...');
        
        window.youtubeSummarizer.isProcessing = false;
        window.youtubeSummarizer.transcriptData = null;
        window.youtubeSummarizer.summaries = null;
        
        // Re-process video
        setTimeout(() => {
            window.youtubeSummarizer.procesVideo();
        }, 1000);
    }
}

// Fix 3: Manual transcript and summary
async function manualTranscriptAndSummary() {
    if (!window.youtubeSummarizer) {
        console.log('❌ Extension not found');
        return;
    }
    
    console.log('🔄 Manual transcript extraction and summary...');
    
    try {
        // Extract transcript manually
        const transcript = await window.youtubeSummarizer.extractTranscript();
        console.log('Transcript extracted:', !!transcript);
        
        if (transcript) {
            window.youtubeSummarizer.transcriptData = transcript;
            
            // Generate summary manually
            chrome.runtime.sendMessage({
                action: 'summarizeAdvanced',
                data: {
                    transcript: typeof transcript === 'string' ? transcript : transcript.map(t => t.text || t).join(' '),
                    videoId: window.youtubeSummarizer.currentVideoId,
                    type: 'insightful',
                    length: 'auto',
                    format: 'list'
                }
            }, (response) => {
                if (response.error) {
                    console.log('❌ Manual summary failed:', response.error);
                } else {
                    console.log('✅ Manual summary successful');
                    window.youtubeSummarizer.summaries = {
                        insightful: {
                            auto: response.summary
                        }
                    };
                    window.youtubeSummarizer.updateSummaryDisplay();
                }
            });
        }
    } catch (error) {
        console.log('❌ Manual process failed:', error);
    }
}

console.log('🛠️ Quick Fixes Loaded!');
console.log('Try these in order:');
console.log('1. clearCacheAndRefresh()');
console.log('2. resetExtensionState()');
console.log('3. manualTranscriptAndSummary()');
console.log('4. Refresh page: location.reload()');
