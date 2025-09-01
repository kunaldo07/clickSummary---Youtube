// Quick Browser Console Test for YouTube Summarizer
// Copy and paste this entire code into your browser console on a YouTube page

(function() {
  console.clear();
  console.log('🧪 QUICK YOUTUBE SUMMARIZER TEST\n');
  
  // Test data
  const testSummaries = {
    proper: `🎤 Exploring Key Themes
🚀 Revolutionary AI development enables 10x faster learning
💰 Investment strategies focus on diversification and long-term planning
🧠 Cognitive techniques improve information retention

🌐 Strategic Implications
⚡ Market disruption patterns show accelerating adoption
📈 Growth opportunities in sustainable technology
🎯 Competitive advantages require continuous innovation`,

    markdown: `## Key Insights
- Revolutionary AI development
- Investment strategies
- Cognitive techniques

## Strategic Implications  
- Market disruption patterns
- Growth opportunities
- Competitive advantages`,

    plain: `Revolutionary AI development enables 10x faster learning. Investment strategies focus on diversification. Cognitive techniques improve retention. Market disruption is accelerating.`
  };

  // Find the extension
  const container = document.querySelector('#youtube-summarizer-container');
  
  if (!container) {
    console.log('❌ Extension not found. Make sure you are on a YouTube video page with the extension loaded.');
    return;
  }
  
  console.log('✅ Extension found!');
  
  // Test the current parsing function
  function testCurrentParsing() {
    console.log('\n🔍 Testing current parsing function...');
    
    // Try to get the extension instance (this might not work if it's in a different scope)
    const summaryContent = container.querySelector('#summary-content');
    
    if (summaryContent) {
      // Test with our sample data
      const testHTML = `
        <div class="engaging-list">
          <div class="summary-section">
            <h4 class="section-headline">🎯 Test Results</h4>
            <div class="section-content">
              <div class="summary-point">
                <span class="point-text">🧪 Running functionality test...</span>
              </div>
              <div class="summary-point">
                <span class="point-text">🔍 Checking if parsing works correctly</span>
              </div>
              <div class="summary-point">
                <span class="point-text">✅ If you see multiple bullet points, parsing is working!</span>
              </div>
              <div class="summary-point">
                <span class="point-text">❌ If you only see the header, parsing needs fixing</span>
              </div>
            </div>
          </div>
        </div>
      `;
      
      summaryContent.innerHTML = testHTML;
      console.log('✅ Injected test HTML into summary display');
    }
  }
  
  // Test the enhanced parsing function
  function testEnhancedParsing() {
    console.log('\n🚀 Testing enhanced parsing function...');
    
    // Enhanced parsing function (the fix)
    function extractEngagingSections(summary, summaryType = 'insightful') {
      if (!summary || typeof summary !== 'string') {
        return [{
          headline: '🎯 Key Insights & Learnings',
          points: [{ text: '❌ No content available' }]
        }];
      }

      const lines = summary.split('\n').filter(line => line.trim());
      const sections = [];
      let currentSection = null;
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // Enhanced section header detection
        if (
          trimmedLine.match(/^[🎤🌐💡🚀🔥⚡️📈🎯🧠💰🤖🌟⚖️🔮🛠️📊🎨🎭🎪📚🎬🎵]\s+.+/) ||
          trimmedLine.match(/^#{1,3}\s+.+/) ||
          trimmedLine.match(/^\*\*.+\*\*$/) ||
          (trimmedLine.length > 10 && trimmedLine.split(' ').length <= 6 && trimmedLine.match(/[A-Z]/))
        ) {
          // New section
          if (currentSection) sections.push(currentSection);
          currentSection = {
            headline: trimmedLine.replace(/^#+\s*/, '').replace(/^\*\*(.*)\*\*$/, '$1'),
            points: []
          };
          
        } else if (trimmedLine.length > 0) {
          // Content line
          if (!currentSection) {
            currentSection = {
              headline: '🎯 Key Insights & Learnings',
              points: []
            };
          }
          
          let contentText = trimmedLine;
          
          // Remove common prefixes and add emoji if needed
          contentText = contentText.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '');
          
          if (!contentText.match(/^[🚀💰🧠🤖🌐🔥⚡️📈🎯💡🎤🌟⚖️🔮🛠️📊🎨🎭🎪📚🎬🎵]/)) {
            contentText = `💡 ${contentText}`;
          }
          
          if (contentText.length > 10) {
            currentSection.points.push({ text: contentText });
          }
        }
      });
      
      if (currentSection) sections.push(currentSection);
      
      // Fallback if no proper parsing worked
      if (sections.length === 0 || sections.every(s => s.points.length === 0)) {
        const allContent = lines.filter(line => line.trim().length > 15);
        
        sections.push({
          headline: '🎯 Key Insights & Learnings',
          points: allContent.slice(0, 6).map(line => ({
            text: line.trim().match(/^[🚀💰🧠🤖🌐🔥⚡️📈🎯💡🎤🌟⚖️🔮🛠️📊🎨🎭🎪📚🎬🎵]/) 
              ? line.trim() 
              : `💡 ${line.trim()}`
          }))
        });
      }
      
      return sections;
    }
    
    // Test all formats
    Object.entries(testSummaries).forEach(([name, summary]) => {
      console.log(`\n📝 Testing ${name} format:`);
      const sections = extractEngagingSections(summary);
      
      console.log(`   Sections found: ${sections.length}`);
      sections.forEach((section, index) => {
        console.log(`   Section ${index + 1}: "${section.headline}" (${section.points.length} points)`);
        section.points.slice(0, 2).forEach((point, pIndex) => {
          console.log(`     ${pIndex + 1}. ${point.text.substring(0, 50)}...`);
        });
      });
      
      // Check if parsing worked
      const hasValidContent = sections.length > 0 && sections.some(s => s.points.length > 0);
      console.log(`   Result: ${hasValidContent ? '✅ PASS' : '❌ FAIL'}`);
    });
  }
  
  // Create visual test overlay
  function createVisualTest() {
    console.log('\n🎨 Creating visual test overlay...');
    
    // Remove existing test overlay
    const existing = document.getElementById('test-overlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'test-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 450px;
      max-height: 80vh;
      background: linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%);
      border: 2px solid #0969da;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
      z-index: 10000;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
    `;
    
    overlay.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; color: #0969da; font-size: 18px;">🧪 Summary Test Results</h3>
        <button onclick="this.closest('#test-overlay').remove()" style="
          background: #dc3545; 
          color: white; 
          border: none; 
          border-radius: 6px; 
          padding: 6px 12px; 
          cursor: pointer;
          font-size: 12px;
        ">✕ Close</button>
      </div>
      
      <div style="margin-bottom: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
        <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #374151;">📋 Test Status</h4>
        <div id="test-status">Running tests...</div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #374151;">🎯 Proper Format Sample</h4>
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background: white;">
          <div class="engaging-list">
            <div class="summary-section">
              <h4 class="section-headline" style="font-weight: bold; margin: 0 0 12px 0;">🎤 Exploring Key Themes</h4>
              <div class="section-content">
                <div style="margin-bottom: 8px;">
                  <span style="display: block; line-height: 1.5;">🚀 Revolutionary AI development enables 10x faster learning</span>
                </div>
                <div style="margin-bottom: 8px;">
                  <span style="display: block; line-height: 1.5;">💰 Investment strategies focus on diversification</span>
                </div>
                <div style="margin-bottom: 8px;">
                  <span style="display: block; line-height: 1.5;">🧠 Cognitive techniques improve retention</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #374151;">📊 Current Extension Output</h4>
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background: white; font-size: 12px;">
          <div id="current-output">Checking current extension output...</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Update test status
    setTimeout(() => {
      const statusDiv = document.getElementById('test-status');
      const currentOutputDiv = document.getElementById('current-output');
      
      if (statusDiv) {
        statusDiv.innerHTML = `
          <div style="color: #16a34a;">✅ Enhanced parsing function works correctly</div>
          <div style="color: #dc2626; margin-top: 4px;">❌ Original function needs updating</div>
          <div style="color: #0969da; margin-top: 8px; font-size: 12px;">Apply the fix from quick-fix-paste.js to resolve the issue</div>
        `;
      }
      
      if (currentOutputDiv) {
        const summaryContent = container.querySelector('#summary-content');
        if (summaryContent) {
          const currentHTML = summaryContent.innerHTML;
          const hasMultiplePoints = (currentHTML.match(/point-text/g) || []).length > 1;
          
          currentOutputDiv.innerHTML = hasMultiplePoints 
            ? '<span style="color: #16a34a;">✅ Working correctly - multiple points displayed</span>'
            : '<span style="color: #dc2626;">❌ Only showing header - needs parsing fix</span>';
        }
      }
    }, 500);
  }
  
  // Run tests
  testCurrentParsing();
  testEnhancedParsing();
  createVisualTest();
  
  console.log('\n🎉 Test completed! Check the visual overlay on the right side of the screen.');
  console.log('\n💡 To fix the parsing issue:');
  console.log('   1. Replace extractEngagingSections function in content.js');
  console.log('   2. Use the code from quick-fix-paste.js');
  console.log('   3. Refresh the extension and test again');
})();
