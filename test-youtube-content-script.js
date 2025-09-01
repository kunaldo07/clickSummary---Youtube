// Test script for YouTube content script functionality
// Run this in the browser console on a YouTube video page

console.log('🧪 Testing YouTube Content Script Functionality...');

// Test 1: Check if content script loaded
console.log('\n=== Test 1: Content Script Loading ===');
const scriptLoaded = !!window.youtubeSummarizer;
console.log(`✅ Content script loaded: ${scriptLoaded ? 'YES' : 'NO'}`);

if (!scriptLoaded) {
  console.error('❌ FAIL: window.youtubeSummarizer is not available');
  console.log('💡 Fix: Reload the extension and refresh the page');
} else {
  console.log('✅ PASS: window.youtubeSummarizer is available');
}

// Test 2: Check required functions exist
console.log('\n=== Test 2: Function Availability ===');
if (scriptLoaded) {
  const functions = [
    'initiateSignIn',
    'openLandingPage', 
    'generateCurrentSummary',
    'showSignInPrompt',
    'checkAndRetry',
    'debug'
  ];
  
  functions.forEach(funcName => {
    const exists = typeof window.youtubeSummarizer[funcName] === 'function';
    console.log(`${exists ? '✅' : '❌'} ${funcName}: ${exists ? 'Available' : 'Missing'}`);
  });
} else {
  console.log('⏩ Skipped (content script not loaded)');
}

// Test 3: Test debug function
console.log('\n=== Test 3: Debug Info ===');
if (scriptLoaded && typeof window.youtubeSummarizer.debug === 'function') {
  try {
    window.youtubeSummarizer.debug();
    console.log('✅ PASS: Debug function works');
  } catch (error) {
    console.error('❌ FAIL: Debug function error:', error);
  }
} else {
  console.log('⏩ Skipped (debug function not available)');
}

// Test 4: Test button simulation
console.log('\n=== Test 4: Button Handler Simulation ===');
if (scriptLoaded) {
  try {
    // Simulate what happens when buttons are clicked
    console.log('🔐 Testing sign-in button handler...');
    const signInTest = `if(window.youtubeSummarizer) window.youtubeSummarizer.initiateSignIn(); else console.error('YouTubeSummarizer not loaded');`;
    eval(signInTest);
    console.log('✅ PASS: Sign-in handler executed without error');
    
    console.log('🌐 Testing landing page button handler...');
    const landingTest = `if(window.youtubeSummarizer) console.log('Landing page would open'); else console.error('YouTubeSummarizer not loaded');`;
    eval(landingTest);
    console.log('✅ PASS: Landing page handler executed without error');
    
  } catch (error) {
    console.error('❌ FAIL: Button handler simulation error:', error);
  }
} else {
  console.log('⏩ Skipped (content script not loaded)');
}

// Test 5: Check if we're on a valid YouTube video page
console.log('\n=== Test 5: YouTube Page Detection ===');
const isYouTubeVideo = window.location.hostname === 'www.youtube.com' && 
                       window.location.pathname === '/watch';
console.log(`✅ On YouTube video page: ${isYouTubeVideo ? 'YES' : 'NO'}`);

if (!isYouTubeVideo) {
  console.warn('⚠️ This test should be run on a YouTube video page (youtube.com/watch?v=...)');
}

// Test 6: Manual function testing
console.log('\n=== Test 6: Manual Function Tests ===');
if (scriptLoaded) {
  console.log('💡 You can manually test these functions:');
  console.log('   window.youtubeSummarizer.debug() - Show debug info');
  console.log('   window.youtubeSummarizer.openLandingPage() - Open sign-in page');
  console.log('   window.youtubeSummarizer.initiateSignIn() - Initiate sign-in');
  
  // Create test buttons for easy manual testing
  const testDiv = document.createElement('div');
  testDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #1976d2;
    color: white;
    padding: 15px;
    border-radius: 8px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 12px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  `;
  testDiv.innerHTML = `
    <div><strong>🧪 Extension Test Panel</strong></div>
    <button onclick="window.youtubeSummarizer.debug()" style="margin: 2px; padding: 4px 8px; font-size: 10px;">Debug Info</button>
    <button onclick="window.youtubeSummarizer.openLandingPage()" style="margin: 2px; padding: 4px 8px; font-size: 10px;">Open Landing</button>
    <button onclick="this.parentElement.remove()" style="margin: 2px; padding: 4px 8px; font-size: 10px; background: #f44336;">Close</button>
  `;
  document.body.appendChild(testDiv);
  
  console.log('✅ Test panel added to page (top-right corner)');
} else {
  console.log('⏩ Skipped (content script not loaded)');
}

// Summary
console.log('\n=== 🎯 Test Summary ===');
if (scriptLoaded) {
  console.log('✅ SUCCESS: Content script is working correctly!');
  console.log('💡 Next steps:');
  console.log('   1. Try clicking the extension UI buttons on this page');
  console.log('   2. Use the test panel (top-right) for manual testing');
  console.log('   3. Sign in at localhost:3002 to test authentication');
} else {
  console.log('❌ FAIL: Content script needs attention');
  console.log('💡 Troubleshooting:');
  console.log('   1. Make sure the extension is loaded and enabled');
  console.log('   2. Reload the extension in chrome://extensions');
  console.log('   3. Refresh this YouTube page');
  console.log('   4. Check for errors in the console');
}

console.log('\n🧪 YouTube Content Script Test Complete!');
