// Quick fix for summary display issue
// Paste this in the YouTube console to see the full summary

function debugSummaryParsing() {
    console.log('🔧 Debug: Checking summary parsing...');
    
    // Check if extension is loaded
    if (window.youtubeSummarizer && window.youtubeSummarizer.summaries) {
        const summaries = window.youtubeSummarizer.summaries;
        const currentType = window.youtubeSummarizer.currentSummaryType;
        const currentLength = window.youtubeSummarizer.currentLength;
        
        console.log('Current summary type:', currentType);
        console.log('Current length:', currentLength);
        console.log('Available summaries:', Object.keys(summaries));
        
        if (summaries[currentType] && summaries[currentType][currentLength]) {
            const rawSummary = summaries[currentType][currentLength];
            console.log('Raw summary from API:', rawSummary);
            console.log('Summary length:', rawSummary.length);
            
            // Check if it has multiple sections
            const sections = rawSummary.split(/(?=🎯|🚀|🧠|💡|🎤|🌟|🔥|⚡|📈|🌐|💰|🤖)/);
            console.log('Detected sections:', sections.length);
            sections.forEach((section, index) => {
                console.log(`Section ${index + 1}:`, section.substring(0, 100) + '...');
            });
        }
    } else {
        console.log('❌ Extension or summaries not found');
    }
}

function fixSummaryDisplay() {
    console.log('🔧 Attempting to fix summary display...');
    
    const summaryContent = document.querySelector('#summary-content');
    if (!summaryContent) {
        console.log('❌ Summary content element not found');
        return;
    }
    
    if (window.youtubeSummarizer && window.youtubeSummarizer.summaries) {
        const summaries = window.youtubeSummarizer.summaries;
        const currentType = window.youtubeSummarizer.currentSummaryType;
        const currentLength = window.youtubeSummarizer.currentLength;
        
        if (summaries[currentType] && summaries[currentType][currentLength]) {
            const rawSummary = summaries[currentType][currentLength];
            
            // Display the raw summary as HTML with basic formatting
            const formattedSummary = rawSummary
                .replace(/\n/g, '<br>')
                .replace(/(🎯|🚀|🧠|💡|🎤|🌟|🔥|⚡|📈|🌐|💰|🤖)([^🎯🚀🧠💡🎤🌟🔥⚡📈🌐💰🤖]+)/g, '<div class="summary-section"><h4>$1 $2</h4></div>');
            
            summaryContent.innerHTML = `
                <div class="full-summary">
                    <h3>Complete Summary:</h3>
                    ${formattedSummary}
                </div>
            `;
            
            console.log('✅ Summary display fixed with raw content');
        }
    }
}

// Instructions
console.log('🔧 Summary Debug Tools Loaded!');
console.log('Run: debugSummaryParsing() - to see what summary data exists');
console.log('Run: fixSummaryDisplay() - to force display the full summary');
