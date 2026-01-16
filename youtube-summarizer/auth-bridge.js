// Enhanced Auth Bridge Content Script - Robust sync between web app and extension

console.log('🌉 YouTube Summarizer Auth Bridge loaded on:', window.location.origin);

// Configuration
const STORAGE_KEYS = {
  TOKEN: 'youtube_summarizer_token',
  USER: 'youtube_summarizer_user'
};

// Enhanced state tracking
let lastAuthState = null;
let syncInProgress = false;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Enhanced function to check and sync authentication
async function checkAndSyncAuth(forceSync = false) {
  if (syncInProgress && !forceSync) {
    console.log('🔄 Auth sync already in progress, skipping...');
    return;
  }

  try {
    syncInProgress = true;
    
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    
    let userData = null;
    try {
      userData = user ? JSON.parse(user) : null;
    } catch (parseError) {
      console.error('❌ Failed to parse user data:', parseError);
      // Clear invalid data
      localStorage.removeItem(STORAGE_KEYS.USER);
      userData = null;
    }
    
    const currentAuthState = {
      hasToken: !!token,
      hasUser: !!userData,
      userEmail: userData?.email || null,
      userName: userData?.name || null,
      timestamp: Date.now()
    };
    
    // Check if auth state changed or forced sync
    const stateChanged = forceSync || !lastAuthState || 
      lastAuthState.hasToken !== currentAuthState.hasToken ||
      lastAuthState.hasUser !== currentAuthState.hasUser ||
      lastAuthState.userEmail !== currentAuthState.userEmail;
    
    if (stateChanged) {
      console.log('🔄 Auth state changed, syncing to extension:', {
        previous: lastAuthState,
        current: currentAuthState,
        forced: forceSync
      });
      
      if (token && userData) {
        // User is authenticated, sync to extension with retry
        await syncToExtensionWithRetry('storeUserToken', { token, user: userData });
      } else {
        // User is not authenticated, clear extension storage
        await syncToExtensionWithRetry('userSignedOut', {});
      }
      
      lastAuthState = currentAuthState;
      retryCount = 0; // Reset retry count on successful state change
    } else {
      console.log('🔍 No auth state change detected, skipping sync');
    }
  } catch (error) {
    console.error('❌ Error in auth sync check:', error);
    retryCount++;
    
    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 Retrying auth sync in ${RETRY_DELAY}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      setTimeout(() => checkAndSyncAuth(forceSync), RETRY_DELAY);
    } else {
      console.error('❌ Max retries reached for auth sync');
      retryCount = 0;
    }
  } finally {
    syncInProgress = false;
  }
}

// Retry mechanism for extension communication
async function syncToExtensionWithRetry(action, data, attempt = 1) {
  try {
    console.log(`📡 Sending ${action} to extension (attempt ${attempt}/${MAX_RETRIES})`);
    
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Extension communication timeout'));
      }, 5000);
      
      chrome.runtime.sendMessage({ action, ...data }, (response) => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    
    if (response && response.success) {
      console.log(`✅ ${action} synced to extension successfully`);
      return true;
    } else {
      throw new Error(`Extension returned failure: ${response?.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.warn(`⚠️ ${action} sync failed (attempt ${attempt}): ${error.message}`);
    
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      return syncToExtensionWithRetry(action, data, attempt + 1);
    } else {
      console.error(`❌ Failed to sync ${action} after ${MAX_RETRIES} attempts`);
      return false;
    }
  }
}

// Enhanced initial sync with delay to ensure DOM is ready
setTimeout(() => {
  console.log('🚀 Starting initial auth sync...');
  checkAndSyncAuth(true); // Force initial sync
}, 500);

// Enhanced localStorage monitoring with debouncing
let storageChangeTimeout = null;

const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  originalSetItem.apply(this, arguments);
  
  // If authentication-related key changed, sync with debouncing
  if (key === STORAGE_KEYS.TOKEN || key === STORAGE_KEYS.USER) {
    console.log('📝 localStorage auth change detected:', key);
    
    // Clear existing timeout and set new one to debounce rapid changes
    if (storageChangeTimeout) {
      clearTimeout(storageChangeTimeout);
    }
    
    storageChangeTimeout = setTimeout(() => {
      checkAndSyncAuth(false);
      storageChangeTimeout = null;
    }, 200); // 200ms debounce
  }
};

const originalRemoveItem = localStorage.removeItem;
localStorage.removeItem = function(key) {
  originalRemoveItem.apply(this, arguments);
  
  // If authentication-related key removed, sync with debouncing
  if (key === STORAGE_KEYS.TOKEN || key === STORAGE_KEYS.USER) {
    console.log('🗑️ localStorage auth removal detected:', key);
    
    if (storageChangeTimeout) {
      clearTimeout(storageChangeTimeout);
    }
    
    storageChangeTimeout = setTimeout(() => {
      checkAndSyncAuth(false);
      storageChangeTimeout = null;
    }, 200);
  }
};

// Listen for storage events (from other tabs) with debouncing
let storageEventTimeout = null;
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEYS.TOKEN || e.key === STORAGE_KEYS.USER) {
    console.log('🔄 Storage event detected for auth key:', e.key);
    
    if (storageEventTimeout) {
      clearTimeout(storageEventTimeout);
    }
    
    storageEventTimeout = setTimeout(() => {
      checkAndSyncAuth(false);
      storageEventTimeout = null;
    }, 200);
  }
});

// Enhanced periodic check (every 10 seconds) with smart checking
let lastPeriodicCheck = 0;
setInterval(() => {
  const now = Date.now();
  
  // Only do periodic check if we haven't synced recently
  if (now - lastPeriodicCheck > 9000) { // 9 seconds
    console.log('🔄 Periodic auth sync check');
    checkAndSyncAuth(false);
    lastPeriodicCheck = now;
  }
}, 10000);

// Listen for messages from the web app with enhanced handling
window.addEventListener('message', (event) => {
  // Only accept messages from same origin
  if (event.origin !== window.location.origin) {
    return;
  }
  
  if (event.data && event.data.type === 'YOUTUBE_SUMMARIZER_AUTH_SYNC') {
    console.log('📨 Received auth sync request from web app');
    checkAndSyncAuth(event.data.force || false);
  }
});

// Enhanced global API for web app integration
window.youTubeSummarizerAuthBridge = {
  // Force sync authentication
  syncAuth: (force = false) => {
    console.log('🌉 Manual sync triggered via bridge API');
    return checkAndSyncAuth(force);
  },
  
  // Get current auth state
  getAuthState: () => lastAuthState,
  
  // Get detailed status
  getStatus: () => ({
    lastAuthState,
    syncInProgress,
    retryCount,
    timestamp: Date.now()
  }),
  
  // Trigger force sync
  forceSync: () => {
    console.log('🚀 Force sync triggered via bridge API');
    return checkAndSyncAuth(true);
  }
};

console.log('✅ Enhanced YouTube Summarizer Auth Bridge initialized');

// Enhanced page visibility handling
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    console.log('👀 Page became visible, checking auth sync');
    // Force sync when page becomes visible to ensure fresh state
    setTimeout(() => checkAndSyncAuth(true), 300);
  }
});

// Listen for beforeunload to ensure final sync
window.addEventListener('beforeunload', () => {
  console.log('👋 Page unloading, final auth sync...');
  // Synchronous final check
  try {
    checkAndSyncAuth(false);
  } catch (error) {
    console.warn('⚠️ Final sync failed:', error);
  }
});

// Enhanced focus handling for tab switching
window.addEventListener('focus', () => {
  console.log('🎯 Window focused, checking auth sync');
  setTimeout(() => checkAndSyncAuth(false), 100);
});

// Log bridge status periodically for debugging
setInterval(() => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const user = localStorage.getItem(STORAGE_KEYS.USER);
  console.log('📊 Auth Bridge Status:', {
    hasToken: !!token,
    hasUser: !!user,
    lastAuthState,
    syncInProgress,
    retryCount
  });
}, 30000); // Every 30 seconds
