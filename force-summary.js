// FORCE SUMMARY GENERATION - Use this after the simple test passes

function forceSummaryGeneration() {
    console.log('🚀 FORCING SUMMARY GENERATION');
    console.log('==============================');
    
    if (!window.youtubeSummarizer) {
        console.log('❌ Extension not loaded');
        return;
    }
    
    // Force set some test transcript data
    const testTranscript = `
    Welcome to this YouTube video about artificial intelligence and machine learning.
    In this video, we'll explore the fundamentals of neural networks and deep learning.
    We'll discuss how AI is transforming various industries and what the future holds.
    Key topics include supervised learning, unsupervised learning, and reinforcement learning.
    We'll also cover practical applications and real-world examples of AI implementation.
    `;
    
    console.log('1. Setting test transcript data...');
    window.youtubeSummarizer.transcriptData = testTranscript;
    
    console.log('2. Requesting summary generation...');
    chrome.runtime.sendMessage({
        action: 'summarizeAdvanced',
        data: {
            transcript: testTranscript,
            videoId: window.youtubeSummarizer.currentVideoId || 'force-test',
            type: 'insightful',
            length: 'auto',
            format: 'list'
        }
    }, (response) => {
        if (response && response.summary) {
            console.log('✅ Summary generated successfully!');
            console.log('Summary preview:', response.summary.substring(0, 200) + '...');
            
            // Force update the display
            if (!window.youtubeSummarizer.summaries) {
                window.youtubeSummarizer.summaries = {};
            }
            if (!window.youtubeSummarizer.summaries.insightful) {
                window.youtubeSummarizer.summaries.insightful = {};
            }
            
            window.youtubeSummarizer.summaries.insightful.auto = response.summary;
            
            if (window.youtubeSummarizer.updateSummaryDisplay) {
                window.youtubeSummarizer.updateSummaryDisplay();
                console.log('✅ Summary should now appear in the extension UI!');
            }
            
            console.log('\n🎉 SUCCESS! Check the extension interface below the video.');
            
        } else if (response && response.error) {
            console.log('❌ Summary generation failed:', response.error);
        } else {
            console.log('❌ No response received');
        }
    });
}

console.log('📋 FORCE SUMMARY LOADED');
console.log('Run: forceSummaryGeneration()');
