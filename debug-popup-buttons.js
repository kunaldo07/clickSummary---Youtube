// Debug script for popup button functionality

console.log('🔍 Debug: Popup button testing script loaded');

// Test function to debug button functionality
function debugPopupButtons() {
  console.log('🧪 Testing popup button functionality...');
  
  // Check if elements exist
  const signInBtn = document.getElementById('sign-in-btn');
  const goToWebsiteBtn = document.getElementById('go-to-website-btn');
  
  console.log('🔍 Button elements:', {
    signInBtn: !!signInBtn,
    goToWebsiteBtn: !!goToWebsiteBtn
  });
  
  // Test sign-in button
  if (signInBtn) {
    console.log('✅ Sign-in button found');
    
    // Remove existing listeners and add new test listener
    signInBtn.addEventListener('click', function(e) {
      console.log('🔐 Sign-in button clicked!');
      e.preventDefault();
      
      // Test chrome.tabs.create
      if (chrome && chrome.tabs) {
        console.log('✅ Chrome tabs API available');
        
        chrome.tabs.create({ 
          url: 'http://localhost:3002/signin' 
        }, function(tab) {
          if (chrome.runtime.lastError) {
            console.error('❌ Error creating tab:', chrome.runtime.lastError);
          } else {
            console.log('✅ Tab created successfully:', tab.id);
            window.close();
          }
        });
      } else {
        console.error('❌ Chrome tabs API not available');
      }
    });
    
    console.log('✅ Sign-in button handler attached');
  } else {
    console.error('❌ Sign-in button not found');
  }
  
  // Test go-to-website button
  if (goToWebsiteBtn) {
    console.log('✅ Go-to-website button found');
    
    // Remove existing listeners and add new test listener
    goToWebsiteBtn.addEventListener('click', function(e) {
      console.log('🌐 Go-to-website button clicked!');
      e.preventDefault();
      
      // Test chrome.tabs.create
      if (chrome && chrome.tabs) {
        console.log('✅ Chrome tabs API available');
        
        chrome.tabs.create({ 
          url: 'http://localhost:3002' 
        }, function(tab) {
          if (chrome.runtime.lastError) {
            console.error('❌ Error creating tab:', chrome.runtime.lastError);
          } else {
            console.log('✅ Tab created successfully:', tab.id);
            window.close();
          }
        });
      } else {
        console.error('❌ Chrome tabs API not available');
      }
    });
    
    console.log('✅ Go-to-website button handler attached');
  } else {
    console.error('❌ Go-to-website button not found');
  }
  
  // Test chrome extension context
  console.log('🔍 Chrome extension context:', {
    chrome: !!chrome,
    chromeRuntime: !!chrome?.runtime,
    chromeTabs: !!chrome?.tabs,
    chromeStorage: !!chrome?.storage,
    extensionId: chrome?.runtime?.id
  });
  
  // List all button elements on page
  const allButtons = document.querySelectorAll('button');
  console.log('🔍 All buttons on page:', Array.from(allButtons).map(btn => ({
    id: btn.id,
    className: btn.className,
    textContent: btn.textContent.trim().substring(0, 50)
  })));
  
  // Check current view visibility
  const views = document.querySelectorAll('.view');
  console.log('🔍 View visibility:', Array.from(views).map(view => ({
    id: view.id,
    hidden: view.classList.contains('hidden'),
    display: window.getComputedStyle(view).display
  })));
}

// Test function for manual button clicking
window.testSignInButton = function() {
  console.log('🧪 Manual test: Sign-in button');
  const btn = document.getElementById('sign-in-btn');
  if (btn) {
    btn.click();
  } else {
    console.error('❌ Sign-in button not found for manual test');
  }
};

window.testGoToWebsiteButton = function() {
  console.log('🧪 Manual test: Go-to-website button');
  const btn = document.getElementById('go-to-website-btn');
  if (btn) {
    btn.click();
  } else {
    console.error('❌ Go-to-website button not found for manual test');
  }
};

// Run debug when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', debugPopupButtons);
} else {
  debugPopupButtons();
}

// Also run after a delay to catch dynamically loaded content
setTimeout(debugPopupButtons, 1000);
setTimeout(debugPopupButtons, 3000);

console.log('🔍 Debug script ready. Open popup console and check logs.');
console.log('💡 You can also manually test buttons with:');
console.log('   testSignInButton()');
console.log('   testGoToWebsiteButton()');
