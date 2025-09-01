// Debug Script for YouTube Summarizer - Add this to your content.js temporarily

// Add this debug function to your content.js
debugSummaryParsing() {
  console.log('🐛 DEBUG: Current summary data:', {
    summaries: this.summaries,
    currentSummaryType: this.currentSummaryType,
    currentLength: this.currentLength,
    currentFormat: this.currentFormat
  });
  
  if (this.summaries && this.summaries[this.currentSummaryType] && this.summaries[this.currentSummaryType][this.currentLength]) {
    const rawSummary = this.summaries[this.currentSummaryType][this.currentLength];
    console.log('🔍 Raw AI Summary:', rawSummary);
    console.log('📝 Summary type:', typeof rawSummary);
    console.log('📏 Summary length:', rawSummary.length);
    
    // Test the parsing
    const sections = this.extractEngagingSections(rawSummary);
    console.log('🎯 Parsed sections:', sections);
    
    sections.forEach((section, index) => {
      console.log(`Section ${index}:`, {
        headline: section.headline,
        pointsCount: section.points ? section.points.length : 0,
        points: section.points
      });
    });
  } else {
    console.log('❌ No summary found for current selection');
  }
}

// Add this to your updateSummaryDisplay function to debug
updateSummaryDisplay() {
  // Add this line at the beginning
  this.debugSummaryParsing();
  
  const summaryContent = this.summaryContainer.querySelector('#summary-content');
  
  if (this.summaries && this.summaries[this.currentSummaryType] && this.summaries[this.currentSummaryType][this.currentLength]) {
    const summary = this.summaries[this.currentSummaryType][this.currentLength];
    
    // Add debug info to the display
    console.log('🎨 Formatting summary:', summary);
    
    if (this.currentFormat === 'qa') {
      summaryContent.innerHTML = this.formatAsQA(summary);
    } else {
      summaryContent.innerHTML = this.formatAsTimestampedList(summary);
    }
  } else {
    summaryContent.innerHTML = '<div class="loading-summary"><div class="loading-spinner"></div><span>Loading summary...</span></div>';
  }
}

// Quick fix function - paste this into your browser console on a YouTube page
function quickFixSummaryParsing() {
  // Check if the extension is loaded
  const container = document.querySelector('#youtube-summarizer-container');
  if (!container) {
    console.log('❌ Extension not found on this page');
    return;
  }
  
  // Get the current content
  const summaryContent = container.querySelector('#summary-content');
  if (!summaryContent) {
    console.log('❌ Summary content area not found');
    return;
  }
  
  // Check what's currently displayed
  console.log('🔍 Current content:', summaryContent.innerHTML);
  
  // If it's only showing the header, try to show some debug info
  if (summaryContent.innerHTML.includes('Key Insights & Learnings') && !summaryContent.innerHTML.includes('point-text')) {
    summaryContent.innerHTML = `
      <div class="engaging-list">
        <div class="summary-section">
          <h4 class="section-headline">🐛 Debug Information</h4>
          <div class="section-content">
            <div class="summary-point">
              <span class="point-text">📋 The AI response is not being parsed correctly</span>
            </div>
            <div class="summary-point">
              <span class="point-text">🔧 Solution: Update the extractEngagingSections function</span>
            </div>
            <div class="summary-point">
              <span class="point-text">💡 Check browser console for detailed logs</span>
            </div>
            <div class="summary-point">
              <span class="point-text">🚀 Apply the fix from fix-summary-parsing.js</span>
            </div>
          </div>
        </div>
      </div>
    `;
    console.log('✅ Injected debug information into summary display');
  }
}

// Auto-run the quick fix
if (typeof window !== 'undefined') {
  setTimeout(quickFixSummaryParsing, 2000);
}
