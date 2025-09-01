// Quick Fix for Summary Display - PASTE THIS IN YOUTUBE CONSOLE
// This will fix the issue where only "Key Insights & Learnings" shows up

function quickFixSummaryDisplay() {
    console.log('🔧 Quick Fix: Improving summary display...');
    
    // Check if extension is loaded
    if (!window.youtubeSummarizer) {
        console.log('❌ Extension not found. Make sure you\'re on a YouTube video page with the extension active.');
        return;
    }
    
    // Override the formatAsTimestampedList function to show ALL content
    window.youtubeSummarizer.formatAsTimestampedList = function(summary) {
        console.log('🎨 Enhanced formatting - showing full summary');
        
        if (!summary || summary.trim().length === 0) {
            return '<div class="summarizer-error">No summary content available</div>';
        }
        
        // Split summary into sections by emoji headers
        const sections = summary.split(/(?=🎯|🚀|🧠|💡|🎤|🌟|🔥|⚡|📈|🌐|💰|🤖|🎨|🎭|🎪|📚|🎬|🎵|⚖️|🔮|🛠️|📊)/);
        
        // Filter out empty sections and format each one
        const validSections = sections
            .filter(section => section.trim().length > 10)
            .map((section, index) => {
                const lines = section.trim().split('\n').filter(line => line.trim().length > 0);
                const header = lines[0] || `Section ${index + 1}`;
                const content = lines.slice(1);
                
                return `
                    <div class="summary-section">
                        <h4 class="section-headline">${header}</h4>
                        <div class="section-content">
                            ${content.map(line => `
                                <div class="summary-point">
                                    <span class="point-text">${line.trim()}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
        
        if (validSections.length === 0) {
            // Fallback: display raw summary with basic formatting
            return `
                <div class="engaging-list">
                    <div class="summary-section">
                        <h4 class="section-headline">📋 Summary</h4>
                        <div class="section-content">
                            ${summary.split('\n').map(line => 
                                line.trim() ? `<div class="summary-point"><span class="point-text">${line.trim()}</span></div>` : ''
                            ).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="engaging-list">
                ${validSections.join('')}
            </div>
        `;
    };
    
    // Refresh the current display
    if (window.youtubeSummarizer.summaries) {
        window.youtubeSummarizer.updateSummaryDisplay();
        console.log('✅ Summary display refreshed with enhanced formatting');
    }
    
    console.log('✅ Quick fix applied! The summary should now show all sections.');
}

// Auto-run the fix
quickFixSummaryDisplay();

// Instructions
console.log('');
console.log('📋 QUICK FIX APPLIED!');
console.log('If the summary still shows only one section:');
console.log('1. Try changing the summary type (Insightful → Funny → Actionable)');
console.log('2. Try changing the length (Auto → Short → Detailed)');
console.log('3. Refresh the page and let the extension reload');
console.log('4. Try a different YouTube video with captions');
