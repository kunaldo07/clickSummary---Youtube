// Debug Transcript Extraction for YouTube Summarizer
// Run this in the YouTube video page console to diagnose transcript issues

console.log('🔬 TRANSCRIPT EXTRACTION DEBUGGER');
console.log('='.repeat(50));

function debugTranscriptExtraction() {
  // 1. Check for transcript button
  console.log('\n1️⃣ CHECKING FOR TRANSCRIPT BUTTON:');
  
  const transcriptSelectors = [
    'button[aria-label*="Show transcript"]',
    'button[aria-label*="transcript"]', 
    'button:has([d*="transcript"])',
    'ytd-toggle-button-renderer button',
    'button[aria-label="Show transcript"]'
  ];
  
  let transcriptButton = null;
  for (const selector of transcriptSelectors) {
    const btn = document.querySelector(selector);
    if (btn) {
      console.log(`✅ Found transcript button with selector: ${selector}`);
      console.log('Button text:', btn.textContent?.trim());
      console.log('Button aria-label:', btn.getAttribute('aria-label'));
      transcriptButton = btn;
      break;
    }
  }
  
  if (!transcriptButton) {
    // Try finding by text content
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      const text = btn.textContent?.toLowerCase() || '';
      const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
      if (text.includes('transcript') || ariaLabel.includes('transcript')) {
        console.log('✅ Found transcript button by text content');
        console.log('Button text:', btn.textContent?.trim());
        console.log('Button aria-label:', btn.getAttribute('aria-label'));
        transcriptButton = btn;
        break;
      }
    }
  }
  
  if (!transcriptButton) {
    console.log('❌ NO TRANSCRIPT BUTTON FOUND');
    console.log('This video might not have transcripts available');
    return;
  }
  
  // 2. Check current transcript panel state
  console.log('\n2️⃣ CHECKING TRANSCRIPT PANEL STATE:');
  
  const transcriptPanel = document.querySelector('ytd-transcript-renderer, #transcript');
  if (transcriptPanel) {
    console.log('✅ Transcript panel exists');
    console.log('Panel visibility:', window.getComputedStyle(transcriptPanel).display);
  } else {
    console.log('❌ No transcript panel found');
  }
  
  // 3. Check for transcript segments (current state)
  console.log('\n3️⃣ CHECKING FOR TRANSCRIPT SEGMENTS:');
  
  const segmentSelectors = [
    'ytd-transcript-segment-renderer',
    '.ytd-transcript-segment-renderer',
    '[class*="transcript-segment"]',
    '.cue-group',
    '.transcript-seekbar-cue-group'
  ];
  
  let foundSegments = false;
  for (const selector of segmentSelectors) {
    const segments = document.querySelectorAll(selector);
    if (segments.length > 0) {
      console.log(`✅ Found ${segments.length} segments with selector: ${selector}`);
      foundSegments = true;
      
      // Show first few segments
      for (let i = 0; i < Math.min(3, segments.length); i++) {
        const segment = segments[i];
        console.log(`  Segment ${i + 1}:`, segment.textContent?.trim().substring(0, 50) + '...');
      }
      break;
    }
  }
  
  if (!foundSegments) {
    console.log('❌ NO TRANSCRIPT SEGMENTS FOUND');
    console.log('Transcript panel might not be open or loaded yet');
  }
  
  // 4. Click transcript button and wait
  console.log('\n4️⃣ CLICKING TRANSCRIPT BUTTON AND WAITING:');
  
  console.log('🖱️ Clicking transcript button...');
  transcriptButton.click();
  
  // Wait and recheck segments
  let checkCount = 0;
  const maxChecks = 10;
  
  const checkInterval = setInterval(() => {
    checkCount++;
    console.log(`⏳ Check ${checkCount}/${maxChecks} - Looking for transcript segments...`);
    
    let foundNow = false;
    for (const selector of segmentSelectors) {
      const segments = document.querySelectorAll(selector);
      if (segments.length > 0) {
        console.log(`✅ SUCCESS! Found ${segments.length} segments with selector: ${selector}`);
        
        // Extract first few segments as test
        const extractedSegments = Array.from(segments).slice(0, 5).map((seg, i) => ({
          index: i,
          text: seg.textContent?.trim() || '',
          element: seg.tagName
        }));
        
        console.log('📝 Sample extracted segments:', extractedSegments);
        foundNow = true;
        break;
      }
    }
    
    if (foundNow || checkCount >= maxChecks) {
      clearInterval(checkInterval);
      if (!foundNow) {
        console.log('❌ STILL NO SEGMENTS FOUND AFTER WAITING');
        console.log('💡 POSSIBLE ISSUES:');
        console.log('   - Video has no transcript available');
        console.log('   - YouTube changed their DOM structure');
        console.log('   - Need longer wait time');
        console.log('   - Different selectors needed');
      }
    }
  }, 1000);
}

// Run the debugger
debugTranscriptExtraction();

console.log('\n🔍 Debug complete. Check the results above.');
console.log('If transcript segments are found, the summarizer should work.');
console.log('If not, the video might not have transcripts available.');
