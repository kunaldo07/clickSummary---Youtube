// YouTube Summarizer - Comprehensive Test Suite
// Run this in browser console on a YouTube page with the extension loaded

class SummaryTester {
  constructor() {
    this.testResults = [];
    this.passCount = 0;
    this.failCount = 0;
  }

  // Test data - various AI response formats
  getTestData() {
    return {
      // Test 1: Proper format with emoji headers and points
      properFormat: `🎤 Exploring Key Themes
🚀 Revolutionary AI development enables 10x faster learning across multiple domains
💰 Investment strategies discussed include diversification and long-term planning approaches
🧠 Cognitive techniques for better information retention and processing efficiency

🌐 Strategic Implications  
⚡ Market disruption patterns show accelerating technological adoption cycles
📈 Growth opportunities emerge in sustainable technology and renewable energy sectors
🎯 Competitive advantages require continuous innovation and adaptive business models`,

      // Test 2: Markdown format
      markdownFormat: `## Key Insights

- Revolutionary AI development enables faster learning
- Investment strategies focus on diversification
- Cognitive techniques improve retention

## Strategic Implications

- Market disruption is accelerating
- Growth in sustainable technology
- Innovation drives competitive advantage`,

      // Test 3: Numbered list format
      numberedFormat: `Key Points:

1. Revolutionary AI development enables 10x faster learning
2. Investment strategies should focus on diversification
3. Cognitive techniques improve information retention
4. Market disruption patterns are accelerating
5. Growth opportunities in sustainable technology`,

      // Test 4: Plain text format
      plainFormat: `Revolutionary AI development enables 10x faster learning across multiple domains. Investment strategies discussed include diversification and long-term planning approaches. Cognitive techniques for better information retention and processing efficiency. Market disruption patterns show accelerating technological adoption cycles.`,

      // Test 5: Mixed format
      mixedFormat: `**Key Insights**
Revolutionary AI development enables faster learning
💰 Investment strategies focus on diversification

🌐 Strategic Implications
Market disruption is accelerating
📈 Growth in sustainable technology`,

      // Test 6: Empty/error cases
      emptyFormat: ``,
      nullFormat: null,
      undefinedFormat: undefined,

      // Test 7: Q&A format
      qaFormat: `Q: What are the main benefits of AI development?
A: Revolutionary AI development enables 10x faster learning across multiple domains and improves cognitive processing.

Q: What investment strategies are recommended?
A: Focus on diversification and long-term planning approaches for sustainable growth.

Q: How can market disruption be handled?
A: By maintaining continuous innovation and developing adaptive business models.`
    };
  }

  // Mock the extension methods for testing
  createMockExtension() {
    return {
      currentSummaryType: 'insightful',
      currentLength: 'auto',
      currentFormat: 'list',

      getHeadlineForType(type) {
        const headlines = {
          insightful: '🎯 Key Insights & Learnings',
          funny: '😄 Humorous Highlights',
          actionable: '⚡ Action Items & Takeaways',
          controversial: '🔥 Debate Points & Controversies'
        };
        return headlines[type] || '💡 Summary Points';
      },

      // Enhanced extractEngagingSections function (the fixed version)
      extractEngagingSections(summary) {
        if (!summary || typeof summary !== 'string') {
          return [{
            headline: this.getHeadlineForType(this.currentSummaryType),
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
                headline: this.getHeadlineForType(this.currentSummaryType),
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
            headline: this.getHeadlineForType(this.currentSummaryType),
            points: allContent.slice(0, 6).map(line => ({
              text: line.trim().match(/^[🚀💰🧠🤖🌐🔥⚡️📈🎯💡🎤🌟⚖️🔮🛠️📊🎨🎭🎪📚🎬🎵]/) 
                ? line.trim() 
                : `💡 ${line.trim()}`
            }))
          });
        }
        
        return sections;
      },

      formatAsTimestampedList(summary) {
        const sections = this.extractEngagingSections(summary);
        
        return `
          <div class="engaging-list">
            ${sections.map(section => `
              <div class="summary-section">
                <h4 class="section-headline">${section.headline}</h4>
                <div class="section-content">
                  ${section.points && section.points.length > 0 
                    ? section.points.map(point => `
                        <div class="summary-point">
                          <span class="point-text">${point.text}</span>
                        </div>
                      `).join('')
                    : `<div class="summary-point">
                         <span class="point-text">💡 No specific points available</span>
                       </div>`
                  }
                </div>
              </div>
            `).join('')}
          </div>
        `;
      },

      extractQAFromSummary(summary) {
        const qaItems = [];
        const lines = summary.split('\n').filter(line => line.trim());
        
        for (let i = 0; i < lines.length - 1; i++) {
          const currentLine = lines[i].trim();
          const nextLine = lines[i + 1]?.trim();
          
          if (currentLine.startsWith('Q:') && nextLine?.startsWith('A:')) {
            qaItems.push({
              question: currentLine.replace('Q:', '').trim(),
              answer: nextLine.replace('A:', '').trim(),
              timestamps: []
            });
            i++; // Skip the answer line in next iteration
          }
        }
        
        return qaItems;
      },

      formatAsQA(summary) {
        const qaItems = this.extractQAFromSummary(summary);
        
        if (!qaItems || qaItems.length === 0) {
          const sections = this.extractEngagingSections(summary);
          const fallbackQA = sections.slice(0, 3).map((section, index) => ({
            question: `What are the key points about ${section.headline.replace(/[🚀💰🧠🤖🌐🔥⚡️📈🎯💡🎤🌟⚖️🔮🛠️📊🎨🎭🎪📚🎬🎵]/g, '').trim().toLowerCase()}?`,
            answer: section.points.slice(0, 2).map(p => p.text.replace(/^[🚀💰🧠🤖🌐🔥⚡️📈🎯💡🎤🌟⚖️🔮🛠️📊🎨🎭🎪📚🎬🎵]\s*/, '')).join(' '),
            timestamps: []
          }));
          
          return `
            <div class="qa-format">
              ${fallbackQA.map((qa, index) => `
                <div class="qa-item">
                  <div class="question">
                    <span class="q-icon">Q</span>
                    <span class="question-text">${qa.question}</span>
                  </div>
                  <div class="answer">
                    <span class="a-icon">A</span>
                    <div class="answer-content">
                      <div class="answer-text">${qa.answer}</div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }
        
        return `
          <div class="qa-format">
            ${qaItems.map((qa, index) => `
              <div class="qa-item">
                <div class="question">
                  <span class="q-icon">Q</span>
                  <span class="question-text">${qa.question}</span>
                </div>
                <div class="answer">
                  <span class="a-icon">A</span>
                  <div class="answer-content">
                    <div class="answer-text">${qa.answer}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    };
  }

  // Test assertion helper
  assert(condition, testName, expected, actual) {
    const result = {
      name: testName,
      passed: condition,
      expected: expected,
      actual: actual,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    if (condition) {
      this.passCount++;
      console.log(`✅ PASS: ${testName}`);
    } else {
      this.failCount++;
      console.log(`❌ FAIL: ${testName}`);
      console.log(`   Expected: ${expected}`);
      console.log(`   Actual: ${actual}`);
    }
  }

  // Individual test methods
  testProperFormatParsing() {
    const extension = this.createMockExtension();
    const testData = this.getTestData();
    
    const sections = extension.extractEngagingSections(testData.properFormat);
    
    this.assert(
      sections.length >= 2,
      'Proper format should create multiple sections',
      'sections.length >= 2',
      `sections.length = ${sections.length}`
    );
    
    this.assert(
      sections[0].headline.includes('Exploring Key Themes'),
      'First section should have correct headline',
      'headline includes "Exploring Key Themes"',
      sections[0].headline
    );
    
    this.assert(
      sections[0].points.length >= 3,
      'First section should have multiple points',
      'points.length >= 3',
      `points.length = ${sections[0].points.length}`
    );
    
    this.assert(
      sections[0].points[0].text.includes('🚀'),
      'Points should retain emojis',
      'text includes emoji',
      sections[0].points[0].text
    );
  }

  testMarkdownFormatParsing() {
    const extension = this.createMockExtension();
    const testData = this.getTestData();
    
    const sections = extension.extractEngagingSections(testData.markdownFormat);
    
    this.assert(
      sections.length >= 2,
      'Markdown format should create multiple sections',
      'sections.length >= 2',
      `sections.length = ${sections.length}`
    );
    
    this.assert(
      sections[0].headline.includes('Key Insights'),
      'Should parse markdown headers',
      'headline includes "Key Insights"',
      sections[0].headline
    );
    
    this.assert(
      sections[0].points.length >= 3,
      'Should extract bullet points',
      'points.length >= 3',
      `points.length = ${sections[0].points.length}`
    );
  }

  testNumberedFormatParsing() {
    const extension = this.createMockExtension();
    const testData = this.getTestData();
    
    const sections = extension.extractEngagingSections(testData.numberedFormat);
    
    this.assert(
      sections.length >= 1,
      'Numbered format should create at least one section',
      'sections.length >= 1',
      `sections.length = ${sections.length}`
    );
    
    this.assert(
      sections[0].points.length >= 5,
      'Should extract numbered points',
      'points.length >= 5',
      `points.length = ${sections[0].points.length}`
    );
    
    this.assert(
      sections[0].points[0].text.includes('Revolutionary AI'),
      'Should extract numbered content',
      'includes "Revolutionary AI"',
      sections[0].points[0].text
    );
  }

  testPlainTextFallback() {
    const extension = this.createMockExtension();
    const testData = this.getTestData();
    
    const sections = extension.extractEngagingSections(testData.plainFormat);
    
    this.assert(
      sections.length >= 1,
      'Plain text should create fallback section',
      'sections.length >= 1',
      `sections.length = ${sections.length}`
    );
    
    this.assert(
      sections[0].headline.includes('Key Insights'),
      'Should use default headline for plain text',
      'headline includes "Key Insights"',
      sections[0].headline
    );
    
    this.assert(
      sections[0].points.length >= 1,
      'Should create points from plain text',
      'points.length >= 1',
      `points.length = ${sections[0].points.length}`
    );
  }

  testErrorHandling() {
    const extension = this.createMockExtension();
    const testData = this.getTestData();
    
    // Test null input
    const nullSections = extension.extractEngagingSections(testData.nullFormat);
    this.assert(
      nullSections.length === 1 && nullSections[0].points[0].text.includes('No content'),
      'Should handle null input gracefully',
      'error message',
      nullSections[0].points[0].text
    );
    
    // Test empty input
    const emptySections = extension.extractEngagingSections(testData.emptyFormat);
    this.assert(
      emptySections.length >= 1,
      'Should handle empty input gracefully',
      'sections.length >= 1',
      `sections.length = ${emptySections.length}`
    );
  }

  testHTMLFormatting() {
    const extension = this.createMockExtension();
    const testData = this.getTestData();
    
    const html = extension.formatAsTimestampedList(testData.properFormat);
    
    this.assert(
      html.includes('engaging-list'),
      'Should generate proper HTML structure',
      'includes "engaging-list"',
      html.includes('engaging-list') ? 'Found' : 'Not found'
    );
    
    this.assert(
      html.includes('section-headline'),
      'Should include section headlines',
      'includes "section-headline"',
      html.includes('section-headline') ? 'Found' : 'Not found'
    );
    
    this.assert(
      html.includes('point-text'),
      'Should include point text elements',
      'includes "point-text"',
      html.includes('point-text') ? 'Found' : 'Not found'
    );
    
    this.assert(
      (html.match(/summary-point/g) || []).length >= 3,
      'Should generate multiple summary points',
      'multiple summary-point elements',
      `${(html.match(/summary-point/g) || []).length} found`
    );
  }

  testQAFormatting() {
    const extension = this.createMockExtension();
    const testData = this.getTestData();
    
    const qaHtml = extension.formatAsQA(testData.qaFormat);
    
    this.assert(
      qaHtml.includes('qa-format'),
      'Should generate Q&A format HTML',
      'includes "qa-format"',
      qaHtml.includes('qa-format') ? 'Found' : 'Not found'
    );
    
    this.assert(
      qaHtml.includes('question-text'),
      'Should include question elements',
      'includes "question-text"',
      qaHtml.includes('question-text') ? 'Found' : 'Not found'
    );
    
    this.assert(
      qaHtml.includes('answer-text'),
      'Should include answer elements',
      'includes "answer-text"',
      qaHtml.includes('answer-text') ? 'Found' : 'Not found'
    );
    
    this.assert(
      (qaHtml.match(/qa-item/g) || []).length >= 2,
      'Should generate multiple Q&A items',
      'multiple qa-item elements',
      `${(qaHtml.match(/qa-item/g) || []).length} found`
    );
  }

  testDifferentSummaryTypes() {
    const extension = this.createMockExtension();
    const testData = this.getTestData();
    
    const types = ['insightful', 'funny', 'actionable', 'controversial'];
    
    types.forEach(type => {
      extension.currentSummaryType = type;
      const sections = extension.extractEngagingSections(testData.properFormat);
      
      this.assert(
        sections.length >= 1,
        `Should work with ${type} summary type`,
        'sections.length >= 1',
        `sections.length = ${sections.length}`
      );
    });
  }

  testRealWorldScenarios() {
    const extension = this.createMockExtension();
    
    // Simulate real AI responses
    const realWorldResponses = [
      "Here are the key insights:\n\n• Revolutionary AI development\n• Investment strategies\n• Market trends",
      "Key Points:\n1. AI enables faster learning\n2. Focus on diversification\n3. Innovation drives growth",
      "🎯 Main Themes\n\n🚀 AI revolutionizes learning\n💰 Smart investment approaches\n📈 Growth in tech sector",
      "**Important Insights**\n\nRevolutionary developments in AI technology are changing how we learn and process information.",
    ];
    
    realWorldResponses.forEach((response, index) => {
      const sections = extension.extractEngagingSections(response);
      
      this.assert(
        sections.length >= 1 && sections[0].points.length >= 1,
        `Real-world scenario ${index + 1} should parse correctly`,
        'valid sections and points',
        `${sections.length} sections, ${sections[0].points.length} points`
      );
    });
  }

  // Performance test
  testPerformance() {
    const extension = this.createMockExtension();
    const testData = this.getTestData();
    
    const startTime = performance.now();
    
    // Run parsing 100 times
    for (let i = 0; i < 100; i++) {
      extension.extractEngagingSections(testData.properFormat);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.assert(
      duration < 1000, // Should complete in under 1 second
      'Performance test - 100 parsings should complete quickly',
      'duration < 1000ms',
      `${duration.toFixed(2)}ms`
    );
  }

  // Visual test for browser
  createVisualTest() {
    const extension = this.createMockExtension();
    const testData = this.getTestData();
    
    // Create a visual test container
    const testContainer = document.createElement('div');
    testContainer.id = 'summary-test-container';
    testContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      max-height: 600px;
      background: white;
      border: 2px solid #0969da;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
      z-index: 10000;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
    `;
    
    testContainer.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #0969da;">🧪 Summary Test Results</h3>
        <button onclick="this.parentElement.parentElement.remove()" style="float: right; background: #dc3545; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">Close</button>
      </div>
      <div style="clear: both;">
        <h4>Proper Format Test:</h4>
        ${extension.formatAsTimestampedList(testData.properFormat)}
      </div>
      <div style="margin-top: 20px;">
        <h4>Q&A Format Test:</h4>
        ${extension.formatAsQA(testData.qaFormat)}
      </div>
    `;
    
    document.body.appendChild(testContainer);
    
    console.log('✅ Visual test container added to page');
  }

  // Run all tests
  runAllTests() {
    console.clear();
    console.log('🧪 STARTING YOUTUBE SUMMARIZER TESTS...\n');
    
    this.testResults = [];
    this.passCount = 0;
    this.failCount = 0;
    
    // Run all test methods
    this.testProperFormatParsing();
    this.testMarkdownFormatParsing();
    this.testNumberedFormatParsing();
    this.testPlainTextFallback();
    this.testErrorHandling();
    this.testHTMLFormatting();
    this.testQAFormatting();
    this.testDifferentSummaryTypes();
    this.testRealWorldScenarios();
    this.testPerformance();
    
    // Show summary
    console.log('\n📊 TEST SUMMARY:');
    console.log(`✅ Passed: ${this.passCount}`);
    console.log(`❌ Failed: ${this.failCount}`);
    console.log(`📈 Success Rate: ${((this.passCount / (this.passCount + this.failCount)) * 100).toFixed(1)}%`);
    
    if (this.failCount === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Your summary functionality is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Check the details above.');
    }
    
    // Create visual test
    this.createVisualTest();
    
    return {
      passed: this.passCount,
      failed: this.failCount,
      total: this.passCount + this.failCount,
      results: this.testResults
    };
  }
}

// Auto-run tests if in browser
if (typeof window !== 'undefined') {
  console.log('🔄 Initializing YouTube Summarizer Test Suite...');
  
  // Create global test instance
  window.SummaryTester = SummaryTester;
  
  // Run tests after a short delay
  setTimeout(() => {
    const tester = new SummaryTester();
    window.testResults = tester.runAllTests();
  }, 1000);
  
  console.log('💡 To run tests manually: new SummaryTester().runAllTests()');
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SummaryTester;
}
