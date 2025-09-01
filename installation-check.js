// Quick Extension Installation Checker
// Paste this in any webpage console to check if extension is installed

console.log('🔧 Checking Chrome Extension Installation...');

// Check if we're in a proper browser context
if (typeof chrome !== 'undefined') {
    console.log('✅ Chrome browser detected');
    
    if (chrome.runtime && chrome.runtime.id) {
        console.log('✅ Chrome runtime available');
        console.log('Extension ID:', chrome.runtime.id);
    } else {
        console.log('❌ Chrome runtime not available - extension may not be installed');
    }
} else {
    console.log('❌ Chrome browser not detected or extensions disabled');
}

// Check if we can access extension APIs
try {
    if (chrome.storage) {
        console.log('✅ Storage API available');
    }
    if (chrome.scripting) {
        console.log('✅ Scripting API available');
    }
} catch (error) {
    console.log('❌ Extension APIs not accessible:', error.message);
}

console.log('📝 Installation checklist:');
console.log('1. Go to chrome://extensions/');
console.log('2. Turn ON "Developer mode" (top-right)');
console.log('3. Click "Load unpacked"');
console.log('4. Select folder: /Users/kbadole/Documents/projects/youtube-extension-2');
console.log('5. Look for "YouTube Video Summarizer" in the list');
