// Fixed Summary Parsing - Replace the extractEngagingSections function in content.js

extractEngagingSections(summary) {
  console.log('🔍 Parsing summary:', summary); // Debug log
  
  if (!summary || typeof summary !== 'string') {
    console.log('❌ Invalid summary format');
    return [{
      headline: this.getHeadlineForType(this.currentSummaryType),
      points: [{ text: '❌ No content available' }]
    }];
  }

  const lines = summary.split('\n').filter(line => line.trim());
  const sections = [];
  let currentSection = null;
  
  console.log('📝 Processing lines:', lines.length);
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    console.log(`Line ${index}: "${trimmedLine}"`);
    
    // Enhanced pattern matching for section headers
    // Matches: "🎤 Section Title" or "## Section Title" or "**Section Title**"
    if (
      trimmedLine.match(/^[🎤🌐💡🚀🔥⚡️📈🎯🧠💰🤖🌟⚖️🔮🛠️📊🎨🎭🎪📚🎬🎵]\s+.+/) ||
      trimmedLine.match(/^#{1,3}\s+.+/) ||
      trimmedLine.match(/^\*\*.+\*\*$/) ||
      trimmedLine.match(/^[A-Z][^.!?]*[A-Z][^.!?]*$/) // All caps or title case
    ) {
      // New section found
      if (currentSection) {
        sections.push(currentSection);
      }
      
      currentSection = {
        headline: trimmedLine.replace(/^#+\s*/, '').replace(/^\*\*(.*)\*\*$/, '$1'),
        points: []
      };
      console.log('✅ New section:', currentSection.headline);
      
    } else if (trimmedLine.length > 0) {
      // This is content - try multiple patterns
      
      if (!currentSection) {
        // Create default section if none exists
        currentSection = {
          headline: this.getHeadlineForType(this.currentSummaryType),
          points: []
        };
      }
      
      // Pattern 1: Lines starting with emojis (🚀 Content...)
      if (trimmedLine.match(/^[🚀💰🧠🤖🌐🔥⚡️📈🎯💡🎤🌟⚖️🔮🛠️📊🎨🎭🎪📚🎬🎵]/)) {
        currentSection.points.push({ text: trimmedLine });
        console.log('✅ Added emoji point:', trimmedLine);
        
      // Pattern 2: Lines starting with bullets (- Content... or • Content...)
      } else if (trimmedLine.match(/^[-•*]\s+(.+)/)) {
        const content = trimmedLine.replace(/^[-•*]\s+/, '');
        // Add emoji if none exists
        const emojiContent = content.match(/^[🚀💰🧠🤖🌐🔥⚡️📈🎯💡🎤🌟⚖️🔮🛠️📊🎨🎭🎪📚🎬🎵]/) 
          ? content 
          : `💡 ${content}`;
        currentSection.points.push({ text: emojiContent });
        console.log('✅ Added bullet point:', emojiContent);
        
      // Pattern 3: Numbered lists (1. Content...)
      } else if (trimmedLine.match(/^\d+\.\s+(.+)/)) {
        const content = trimmedLine.replace(/^\d+\.\s+/, '');
        const emojiContent = content.match(/^[🚀💰🧠🤖🌐🔥⚡️📈🎯💡🎤🌟⚖️🔮🛠️📊🎨🎭🎪📚🎬🎵]/) 
          ? content 
          : `🎯 ${content}`;
        currentSection.points.push({ text: emojiContent });
        console.log('✅ Added numbered point:', emojiContent);
        
      // Pattern 4: Plain text (add emoji and include)
      } else if (trimmedLine.length > 10) { // Only substantial content
        const emojiContent = `💡 ${trimmedLine}`;
        currentSection.points.push({ text: emojiContent });
        console.log('✅ Added plain text:', emojiContent);
      }
    }
  });
  
  // Add the last section
  if (currentSection) {
    sections.push(currentSection);
  }
  
  // If still no sections found, create one with all non-empty lines
  if (sections.length === 0) {
    const fallbackPoints = lines
      .filter(line => line.trim().length > 10)
      .map(line => ({
        text: line.trim().match(/^[🚀💰🧠🤖🌐🔥⚡️📈🎯💡🎤🌟⚖️🔮🛠️📊🎨🎭🎪📚🎬🎵]/) 
          ? line.trim() 
          : `💡 ${line.trim()}`
      }));
    
    sections.push({
      headline: this.getHeadlineForType(this.currentSummaryType),
      points: fallbackPoints.slice(0, 8) // Limit to prevent overwhelming
    });
    
    console.log('🔄 Created fallback section with', fallbackPoints.length, 'points');
  }
  
  console.log('✅ Final sections:', sections.length, sections);
  return sections;
}

// Also add this enhanced formatting function
formatAsTimestampedList(summary) {
  console.log('🎨 Formatting summary as list:', summary);
  
  const sections = this.extractEngagingSections(summary);
  
  if (!sections || sections.length === 0) {
    return `
      <div class="engaging-list">
        <div class="summary-section">
          <h4 class="section-headline">❌ No Content Available</h4>
          <div class="section-content">
            <div class="summary-point">
              <span class="point-text">Unable to generate summary. Please try again.</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
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
}

// Enhanced QA formatting as well
formatAsQA(summary) {
  console.log('🎨 Formatting summary as Q&A:', summary);
  
  // Try to extract Q&A pairs from the summary
  const qaItems = this.extractQAFromSummary(summary);
  
  if (!qaItems || qaItems.length === 0) {
    // Fallback: create Q&A from sections
    const sections = this.extractEngagingSections(summary);
    const fallbackQA = sections.flatMap(section => 
      section.points.slice(0, 2).map((point, index) => ({
        question: `What ${section.headline.toLowerCase().replace(/[🚀💰🧠🤖🌐🔥⚡️📈🎯💡🎤🌟⚖️🔮🛠️📊🎨🎭🎪📚🎬🎵]/g, '').trim()}?`,
        answer: point.text.replace(/^[🚀💰🧠🤖🌐🔥⚡️📈🎯💡🎤🌟⚖️🔮🛠️📊🎨🎭🎪📚🎬🎵]\s*/, ''),
        timestamps: []
      }))
    );
    
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
              ${qa.timestamps && qa.timestamps.length > 0 ? `
                <div class="answer-timestamps">
                  ${qa.timestamps.map(ts => 
                    `<span class="timestamp-highlight" data-time="${ts.time}">${ts.time} ${ts.text}</span>`
                  ).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
