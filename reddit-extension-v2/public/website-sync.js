/**
 * Website-to-Extension Auth Sync Script (Supabase Version)
 * 
 * This script runs on clicksummary.com domains and syncs Supabase authentication
 * data from the website's localStorage to the extension's chrome.storage.
 * 
 * With Supabase, the session is automatically stored in localStorage with keys:
 * - sb-<project-ref>-auth-token (contains access_token, refresh_token, etc.)
 * 
 * Flow:
 * 1. User signs in on website via Supabase OAuth
 * 2. Supabase stores session in localStorage automatically
 * 3. This script detects the session and syncs to chrome.storage
 * 4. Extension uses the Supabase access token for API calls
 */

console.log('🔄 AI Reddit Post Analyzer: Website sync script loaded on:', window.location.href);

// Function to sync auth from localStorage to chrome.storage
function syncAuthToExtension() {
  try {
    // Check if chrome.runtime exists
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      console.error('❌ Chrome runtime not available');
      return;
    }

    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      console.log('⚠️ Extension context invalidated - stopping sync');
      return;
    }

    // Look for Supabase session in localStorage
    // Supabase stores session with key pattern: sb-<project-ref>-auth-token
    let supabaseSession = null;
    let supabaseKey = null;
    
    // Find Supabase auth key
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        supabaseKey = key;
        const sessionData = localStorage.getItem(key);
        if (sessionData) {
          try {
            supabaseSession = JSON.parse(sessionData);
          } catch (e) {
            console.error('Failed to parse Supabase session:', e);
          }
        }
        break;
      }
    }
    
    // Also check for our custom keys (this is the primary method now)
    const legacyToken = localStorage.getItem('youtube_summarizer_token');
    const legacyUser = localStorage.getItem('youtube_summarizer_user');
    
    console.log('🔍 Reddit Extension - Checking localStorage:', {
      hasSupabaseSession: !!supabaseSession,
      supabaseKey: supabaseKey,
      hasLegacyToken: !!legacyToken,
      legacyTokenLength: legacyToken?.length,
      hasLegacyUser: !!legacyUser
    });
    
    // PRIORITY: Check legacy tokens first (this is what the frontend uses)
    if (legacyToken && legacyUser) {
      console.log('📤 Reddit Extension - Syncing auth from localStorage...');
      chrome.storage.local.set({
        youtube_summarizer_token: legacyToken,
        youtube_summarizer_user: legacyUser
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('❌ Reddit Extension - Error during sync:', chrome.runtime.lastError);
          return;
        }
        console.log('✅ Reddit Extension - Auth synced to extension storage!');
        
        // Verify it was stored
        chrome.storage.local.get(['youtube_summarizer_token', 'youtube_summarizer_user'], (result) => {
          console.log('✅ Reddit Extension - Verified storage:', {
            hasToken: !!result.youtube_summarizer_token,
            tokenLength: result.youtube_summarizer_token?.length,
            hasUser: !!result.youtube_summarizer_user
          });
        });
      });
      return; // Done - don't continue to Supabase check
    }
    
    // Fall back to Supabase session if no legacy tokens
    if (supabaseSession?.access_token) {
      const token = supabaseSession.access_token;
      const user = supabaseSession.user;
      
      console.log('📤 Syncing Supabase auth to extension storage...');
      chrome.storage.local.set({
        youtube_summarizer_token: token,
        youtube_summarizer_user: JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0],
          picture: user.user_metadata?.picture || user.user_metadata?.avatar_url
        })
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('❌ Error during sync:', chrome.runtime.lastError);
          return;
        }
        console.log('✅ Supabase auth synced to extension storage!');
        
        // Verify it was stored
        chrome.storage.local.get(['youtube_summarizer_token', 'youtube_summarizer_user'], (result) => {
          console.log('✅ Verified storage:', {
            hasToken: !!result.youtube_summarizer_token,
            hasUser: !!result.youtube_summarizer_user
          });
        });
      });
    } else {
      // User is signed out - clear extension storage
      console.log('🗑️ No auth found, clearing extension storage...');
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
