// PASTE THIS TO REPLACE extractEngagingSections function in content.js (line ~511)

extractEngagingSections(summary) {
  console.log('🔍 Parsing summary:', summary?.substring(0, 200) + '...'); 
  
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
  
  console.log('✅ Parsed sections:', sections.map(s => ({ headline: s.headline, points: s.points.length })));
  return sections;
}
