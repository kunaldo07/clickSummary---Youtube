/**
 * Website Authentication Sync Script
 * Syncs authentication state from website localStorage to extension storage
 */

console.log('🔄 AI Reddit Post Analyzer: Website sync script loaded');

// Function to sync auth from localStorage to chrome.storage
function syncAuthToExtension() {
  try {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      console.log('⚠️ Extension context invalidated - stopping sync');
      return;
    }

    const token = localStorage.getItem('youtube_summarizer_token');
    const user = localStorage.getItem('youtube_summarizer_user');
    
    if (token && user) {
      // User is signed in - sync to extension storage
      chrome.storage.local.set({
        youtube_summarizer_token: token,
        youtube_summarizer_user: user
      }, () => {
        if (chrome.runtime.lastError) {
          console.log('⚠️ Extension context invalidated during sync');
          return;
        }
        console.log('✅ Auth synced to extension storage');
      });
    } else {
      // User is signed out - clear extension storage
      chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user'], () => {
        if (chrome.runtime.lastError) {
          console.log('⚠️ Extension context invalidated during clear');
          return;
        }
        console.log('🗑️ Cleared extension storage (user signed out)');
      });
    }
  } catch (error) {
    // Silently handle extension context invalidation errors
    if (error.message.includes('Extension context invalidated')) {
      console.log('⚠️ Extension reloaded - please refresh page');
    } else {
      console.error('❌ Error syncing auth:', error);
    }
  }
}

// Sync immediately on page load
syncAuthToExtension();

// Watch for localStorage changes (sign in/out events)
window.addEventListener('storage', (event) => {
  if (event.key === 'youtube_summarizer_token' || event.key === 'youtube_summarizer_user') {
    console.log('🔄 Auth change detected, syncing...');
    syncAuthToExtension();
  }
});

// Also watch for custom events from the website
window.addEventListener('authStateChanged', () => {
  console.log('🔄 Auth state changed event received, syncing...');
  syncAuthToExtension();
});

// Poll localStorage every 2 seconds to catch changes (fallback)
setInterval(() => {
  syncAuthToExtension();
}, 2000);

console.log('✅ AI Reddit Post Analyzer: Website sync active');
