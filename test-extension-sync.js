// Test script to verify extension authentication sync
// Run this in the browser console on http://localhost:3002

console.log('🧪 Testing Extension Authentication Sync');

// Function to test current auth state
function testAuthState() {
  const token = localStorage.getItem('youtube_summarizer_token');
  const user = localStorage.getItem('youtube_summarizer_user');
  
  console.log('📱 Web App Auth State:');
  console.log('  Has Token:', !!token);
  console.log('  Has User:', !!user);
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('  User:', userData.name, '(' + userData.email + ')');
    } catch (e) {
      console.log('  User data parse error:', e.message);
    }
  }
  
  // Check if auth bridge is available
  if (window.youTubeSummarizerAuthBridge) {
    console.log('✅ Auth Bridge Available');
    console.log('  Bridge State:', window.youTubeSummarizerAuthBridge.getAuthState());
  } else {
    console.log('❌ Auth Bridge Not Available');
    console.log('💡 Make sure the extension is loaded and refresh the page');
  }
}

// Function to manually trigger sync
function triggerSync() {
  if (window.youTubeSummarizerAuthBridge) {
    console.log('🔄 Manually triggering auth sync...');
    window.youTubeSummarizerAuthBridge.syncAuth();
  } else {
    console.log('❌ Cannot sync - Auth Bridge not available');
  }
}

// Function to simulate authentication (for testing)
function simulateAuth() {
  const testUser = {
    id: 'test123',
    name: 'Test User',
    email: 'test@example.com',
    picture: null,
    role: 'user',
    subscription: {
      isActive: false,
      planType: 'free'
    }
  };
  
  const testToken = 'test-jwt-token-' + Date.now();
  
  localStorage.setItem('youtube_summarizer_token', testToken);
  localStorage.setItem('youtube_summarizer_user', JSON.stringify(testUser));
  
  console.log('🎭 Simulated authentication data stored');
  
  setTimeout(() => {
    console.log('🔄 Triggering sync...');
    triggerSync();
  }, 500);
}

// Function to clear auth (for testing)
function clearAuth() {
  localStorage.removeItem('youtube_summarizer_token');
  localStorage.removeItem('youtube_summarizer_user');
  console.log('🗑️ Authentication data cleared');
  
  setTimeout(() => {
    console.log('🔄 Triggering sync...');
    triggerSync();
  }, 500);
}

// Make functions available globally
window.testAuthState = testAuthState;
window.triggerSync = triggerSync;
window.simulateAuth = simulateAuth;
window.clearAuth = clearAuth;

// Run initial test
testAuthState();

console.log(`
🧪 Test Functions Available:
  testAuthState() - Check current auth state
  triggerSync() - Manually trigger extension sync
  simulateAuth() - Create test auth data
  clearAuth() - Clear all auth data

📋 Testing Steps:
1. Run testAuthState() to see current state
2. Sign in normally through the web app
3. Run testAuthState() again to verify
4. Open extension popup to check sync
5. Use clearAuth() and simulateAuth() to test edge cases

💡 Extension Console:
Open extension popup → F12 → Console to see sync messages
`);

// Monitor localStorage changes for debugging
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  if (key.startsWith('youtube_summarizer_')) {
    console.log('📝 localStorage SET:', key, value ? 'set' : 'null');
  }
  return originalSetItem.apply(this, arguments);
};

const originalRemoveItem = localStorage.removeItem;
localStorage.removeItem = function(key) {
  if (key.startsWith('youtube_summarizer_')) {
    console.log('🗑️ localStorage REMOVE:', key);
  }
  return originalRemoveItem.apply(this, arguments);
};
