// YouTube Extension Debugging Script
// Paste this in YouTube video page console (F12 → Console)

console.log('🔧 YouTube Extension Debug Check');
console.log('=================================');

// Step 1: Check if extension is loaded
console.log('1. Extension Loading Check:');
if (typeof YouTubeSummarizer !== 'undefined') {
    console.log('✅ YouTubeSummarizer class found');
} else {
    console.log('❌ YouTubeSummarizer class not found');
}

if (window.youtubeSummarizer) {
    console.log('✅ Extension instance found');
    console.log('Current video ID:', window.youtubeSummarizer.currentVideoId);
    console.log('Is processing:', window.youtubeSummarizer.isProcessing);
} else {
    console.log('❌ Extension instance not found');
}

// Step 2: Check if we're on a video page
console.log('\n2. Page Context Check:');
const url = window.location.href;
console.log('Current URL:', url);
if (url.includes('/watch?v=')) {
    console.log('✅ On YouTube video page');
    const videoId = new URL(url).searchParams.get('v');
    console.log('Video ID:', videoId);
} else {
    console.log('❌ Not on YouTube video page');
}

// Step 3: Check for summary container
console.log('\n3. UI Container Check:');
const summaryContainer = document.querySelector('#youtube-summarizer-container');
if (summaryContainer) {
    console.log('✅ Summary container found');
    console.log('Container:', summaryContainer);
} else {
    console.log('❌ Summary container not found');
}

// Step 4: Check for captions/transcript
console.log('\n4. Transcript Availability Check:');
const ccButton = document.querySelector('button[aria-label*="captions"]') || 
                document.querySelector('button[aria-label*="Captions"]') ||
                document.querySelector('.ytp-subtitles-button');
if (ccButton) {
    console.log('✅ Captions button found');
} else {
    console.log('❌ Captions button not found - video may not have captions');
}

// Step 5: Manual trigger test
console.log('\n5. Manual Extension Trigger:');
if (window.youtubeSummarizer) {
    console.log('Attempting to manually trigger extension...');
    try {
        window.youtubeSummarizer.procesVideo();
        console.log('✅ Manual trigger attempted');
    } catch (error) {
        console.log('❌ Manual trigger failed:', error);
    }
} else {
    console.log('❌ Cannot trigger - extension not loaded');
}

// Step 6: Check Chrome extension context
console.log('\n6. Chrome Extension Context:');
if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('✅ Chrome runtime available');
    if (chrome.runtime.id) {
        console.log('Extension ID:', chrome.runtime.id);
    }
} else {
    console.log('❌ Chrome runtime not available');
}

console.log('\n📋 Debug Summary Complete');
console.log('Copy this output and share for detailed diagnosis');
