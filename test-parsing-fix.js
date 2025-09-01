// Test the new parsing fix
// Copy and paste this into browser console after generating a summary

function testParsing() {
  if (!window.youtubeSummarizer) {
    console.log('❌ Extension not loaded');
    return;
  }
  
  const summarizer = window.youtubeSummarizer;
  
  // Test with your example summary
  const testSummary = `🎤 Exploring Key Themes

🚀 The speaker advocates for a proactive approach to life, emphasizing that the primary objective is to help humanity transition into the era of AI while combating the inevitability of death.
💡 There's a powerful critique of modern lifestyles, suggesting that indulgent habits serve as a form of self experimentation that can lead to detrimental health outcomes.
🔥 The speaker's improvisational approach at a prominent conference highlights the importance of authenticity and connection over meticulous preparation, revealing the risks and rewards of vulnerability.

🌐 Strategic Implications

🎯 The concept of "Don't Die" is presented as not just a personal mission but as a global initiative aimed at systematically eliminating factors that contribute to death, showcasing a deep commitment to holistic health.
📈 The integration of AI in health management is proposed as a revolutionary method to personalize care and improve life quality, indicating a potential shift in how we approach longevity and wellness.
⚡ The necessity for a collective understanding of health as a priority is underscored, challenging societal norms that often prioritize pleasure over well being.

💡 Key Takeaways

🌟 The speaker's commitment to prioritizing sleep, nutrition, and exercise serves as a foundational principle for a healthier lifestyle, reinforcing that health should be viewed as the default rather than a luxury.
🤖 The exploration of data driven health care models signifies a transformative shift toward using technology to enhance personal well-being and longevity.
⚖️ The narrative encourages a reevaluation of what it means to live a fulfilling life, urging individuals to consider the long term implications of their lifestyle choices.`;

  console.log('🧪 Testing new parsing logic...');
  
  const sections = summarizer.extractEngagingSections(testSummary);
  
  console.log('📊 Results:');
  console.log(`  - Sections found: ${sections.length}`);
  
  sections.forEach((section, i) => {
    console.log(`  - Section ${i + 1}: "${section.headline}"`);
    console.log(`    └─ Points: ${section.points.length}`);
    
    section.points.forEach((point, j) => {
      const { subheading, description } = summarizer.extractSubheadingAndDescription(point.text);
      console.log(`      ${j + 1}. ${subheading}`);
      console.log(`         └─ ${description.substring(0, 50)}...`);
    });
  });
  
  console.log('\n✅ Test completed!');
  console.log('Expected: 3 sections (🎤 Exploring Key Themes, 🌐 Strategic Implications, 💡 Key Takeaways)');
  console.log('Expected: 9 total points (3 per section)');
}

// Auto-run
setTimeout(testParsing, 100);
