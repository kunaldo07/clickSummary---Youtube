// Run this in the extension's service worker console to clear old tokens
// Open chrome://extensions → Click "service worker" under your extension

chrome.storage.local.clear(() => {
  console.log('✅ All extension storage cleared');
  console.log('🔄 Please reload the extension popup and sign in again');
});

// Or to clear just auth data:
// chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user'], () => {
//   console.log('✅ Auth tokens cleared');
// });
