// Environment detection
let environmentCache = null;

const detectEnvironment = async () => {
  if (environmentCache) {
    return environmentCache;
  }
  
  console.log('🔍 Popup: Detecting environment...');
  
  // Test if localhost backend is accessible
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('http://localhost:3001/api/health', {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
      cache: 'no-cache'
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ Popup: Localhost backend accessible - DEVELOPMENT MODE');
      environmentCache = { isDevelopment: true, isProduction: false };
      return environmentCache;
    } else {
      console.log('⚠️ Popup: Localhost not healthy - using PRODUCTION MODE');
      environmentCache = { isDevelopment: false, isProduction: true };
      return environmentCache;
    }
  } catch (error) {
    console.log('⚠️ Popup: Localhost backend test failed:', error.message);
    console.log('🔧 Popup: Localhost not reachable - using PRODUCTION MODE');
    environmentCache = { isDevelopment: false, isProduction: true };
    return environmentCache;
  }
};

const getAPIBaseURL = async () => {
  const env = await detectEnvironment();
  const url = env.isDevelopment ? 'http://localhost:3001/api' : 'https://api.clicksummary.com/api';
  console.log(`🔗 Popup: Using API URL: ${url}`);
  return url;
};

// DOM Elements
let loadingView, notAuthenticatedView, authenticatedView, errorView;
let userAvatar, userInitial, userName, planBadge, upgradeBadgeBtn;
let summariesUsed, summariesLimit, summariesProgress, summariesHint, summariesRemaining, summariesPercentage;
let chatsUsed, chatsLimit, chatsProgress, chatsHint, chatsRemaining, chatsPercentage;
let upgradeSection, proSuccessSection, proSummariesUsed, proChatsUsed;
let cycleIndicator, refreshBtn, signOutBtn, retryBtn, errorMessage;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 AI Reddit Post Analyzer popup loaded');
  
  // Get DOM elements
  loadingView = document.getElementById('loading-view');
  notAuthenticatedView = document.getElementById('not-authenticated-view');
  authenticatedView = document.getElementById('authenticated-view');
  errorView = document.getElementById('error-view');
  
  userAvatar = document.getElementById('user-avatar');
  userInitial = document.getElementById('user-initial');
  userName = document.getElementById('user-name');
  planBadge = document.getElementById('plan-badge');
  upgradeBadgeBtn = document.getElementById('upgrade-badge-btn');
  
  summariesUsed = document.getElementById('summaries-used');
  summariesLimit = document.getElementById('summaries-limit');
  summariesProgress = document.getElementById('summaries-progress');
  summariesHint = document.getElementById('summaries-hint');
  summariesRemaining = document.getElementById('summaries-remaining');
  summariesPercentage = document.getElementById('summaries-percentage');
  
  chatsUsed = document.getElementById('chats-used');
  chatsLimit = document.getElementById('chats-limit');
  chatsProgress = document.getElementById('chats-progress');
  chatsHint = document.getElementById('chats-hint');
  chatsRemaining = document.getElementById('chats-remaining');
  chatsPercentage = document.getElementById('chats-percentage');
  
  upgradeSection = document.getElementById('upgrade-section');
  proSuccessSection = document.getElementById('pro-success-section');
  proSummariesUsed = document.getElementById('pro-summaries-used');
  proChatsUsed = document.getElementById('pro-chats-used');
  cycleIndicator = document.getElementById('cycle-indicator');
  refreshBtn = document.getElementById('refresh-btn');
  signOutBtn = document.getElementById('sign-out-btn');
  retryBtn = document.getElementById('retry-btn');
  errorMessage = document.getElementById('error-message');
  
  // Setup event listeners
  refreshBtn.addEventListener('click', loadUsageData);
  signOutBtn.addEventListener('click', handleSignOut);
  retryBtn.addEventListener('click', loadUsageData);
  
  if (upgradeBadgeBtn) {
    upgradeBadgeBtn.addEventListener('click', () => {
      window.open('https://www.clicksummary.com/pricing', '_blank');
    });
  }
  
  // Sign in button
  const signInBtn = document.getElementById('sign-in-btn');
  if (signInBtn) {
    signInBtn.addEventListener('click', handleGoogleSignIn);
  }
  
  // Load data
  await loadUsageData();
});

// Prevent multiple sign-in attempts
let isSigningIn = false;

// Handle Google sign-in with account picker
async function handleGoogleSignIn() {
  if (isSigningIn) {
    console.log('⚠️ Sign-in already in progress');
    return;
  }
  
  isSigningIn = true;
  const signInBtn = document.getElementById('sign-in-btn');
  const signInStatus = document.getElementById('sign-in-status');
  
  if (signInBtn) signInBtn.disabled = true;
  if (signInStatus) signInStatus.textContent = '🔄 Opening Google sign-in...';
  
  try {
    console.log('🔐 Starting Google OAuth with account picker...');
    
    // Get OAuth config from manifest
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2.client_id;
    const scopes = manifest.oauth2.scopes.join(' ');
    
    // Get redirect URI
    const redirectUri = chrome.identity.getRedirectURL();
    console.log('� Redirect URI:', redirectUri);
    
    // Build OAuth URL with account picker
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('prompt', 'select_account');
    
    // Launch OAuth flow
    chrome.identity.launchWebAuthFlow(
      { url: authUrl.toString(), interactive: true },
      async (responseUrl) => {
        if (chrome.runtime.lastError) {
          console.error('❌ OAuth error:', chrome.runtime.lastError);
          if (signInStatus) signInStatus.textContent = '❌ Sign-in failed. Please try again.';
          isSigningIn = false;
          if (signInBtn) signInBtn.disabled = false;
          return;
        }
        
        if (!responseUrl) {
          console.log('ℹ️ Sign-in cancelled');
          if (signInStatus) signInStatus.textContent = 'Sign-in cancelled';
          isSigningIn = false;
          if (signInBtn) signInBtn.disabled = false;
          return;
        }
        
        try {
          // Extract access token
          const url = new URL(responseUrl);
          const hashParams = new URLSearchParams(url.hash.substring(1));
          const token = hashParams.get('access_token');
          
          if (!token) {
            console.error('❌ No access token in response');
            if (signInStatus) signInStatus.textContent = '❌ Sign-in failed. Please try again.';
            isSigningIn = false;
            if (signInBtn) signInBtn.disabled = false;
            return;
          }
          
          console.log('✅ Got Google token, exchanging with backend...');
          if (signInStatus) signInStatus.textContent = '🔄 Completing sign-in...';
          
          // Get API URL
          const API_BASE_URL = await getAPIBaseURL();
          
          // Exchange with backend
          const response = await fetch(`${API_BASE_URL}/auth/extension/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: token })
          });
          
          if (!response.ok) {
            throw new Error(`Backend auth failed: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (!data.success || !data.token || !data.user) {
            throw new Error('Invalid response from backend');
          }
          
          console.log('✅ Sign-in successful:', data.user.email);
          
          // Store auth data
          await chrome.storage.local.set({
            youtube_summarizer_token: data.token,
            youtube_summarizer_user: JSON.stringify(data.user)
          });
          
          // Reload to show authenticated view
          await loadUsageData();
          
        } catch (error) {
          console.error('❌ Sign-in error:', error);
          if (signInStatus) signInStatus.textContent = '❌ ' + (error.message || 'Sign-in failed');
          isSigningIn = false;
          if (signInBtn) signInBtn.disabled = false;
        }
      }
    );
    
  } catch (error) {
    console.error('❌ Sign-in error:', error);
    if (signInStatus) signInStatus.textContent = '❌ Sign-in failed. Please try again.';
    isSigningIn = false;
    if (signInBtn) signInBtn.disabled = false;
  }
}

// Load usage data
async function loadUsageData() {
  try {
    showView('loading');
    
    // Check authentication
    const authData = await checkAuthentication();
    
    if (!authData) {
      showView('not-authenticated');
      return;
    }
    
    // Fetch usage data from backend
    const usageData = await fetchUsageFromBackend(authData.token);
    
    // Display user info
    displayUserInfo(authData.user, usageData.planType);
    
    // Display usage stats
    displayUsageStats(usageData);
    
    showView('authenticated');
    
  } catch (error) {
    console.error('❌ Error loading usage data:', error);
    errorMessage.textContent = error.message || 'Failed to load usage data';
    showView('error');
  }
}

// Check authentication
async function checkAuthentication() {
  try {
    console.log('🔍 Checking authentication in popup...');
    const result = await chrome.storage.local.get(['youtube_summarizer_token', 'youtube_summarizer_user']);
    
    console.log('📦 Storage result:', {
      hasToken: !!result.youtube_summarizer_token,
      hasUser: !!result.youtube_summarizer_user,
      tokenPreview: result.youtube_summarizer_token?.substring(0, 30)
    });
    
    if (!result.youtube_summarizer_token || !result.youtube_summarizer_user) {
      console.log('❌ No auth data found in storage');
      return null;
    }
    
    const user = JSON.parse(result.youtube_summarizer_user);
    console.log('✅ Auth data found for user:', user.email || user.name);
    
    return {
      token: result.youtube_summarizer_token,
      user: user
    };
  } catch (error) {
    console.error('❌ Error checking authentication:', error);
    return null;
  }
}

// Fetch usage data from backend
async function fetchUsageFromBackend(token) {
  // Get API URL
  const API_BASE_URL = await getAPIBaseURL();
  
  // Fetch usage data from backend
  const response = await fetch(`${API_BASE_URL}/reddit/usage`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // If token is invalid/expired, clear storage and show sign-in view
    if (response.status === 401) {
      await chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user']);
      throw new Error('Session expired. Please visit clicksummary.com to sign in again.');
    }
    
    throw new Error(errorData.error || 'Failed to fetch usage data');
  }
  
  const data = await response.json();
  return data;
}

// Display user info
function displayUserInfo(user, planType) {
  // Set user name
  userName.textContent = user.name || 'User';
  
  // Set user avatar
  if (user.picture) {
    userAvatar.innerHTML = `<img src="${user.picture}" alt="${user.name}">`;
  } else {
    const initial = (user.name || 'U').charAt(0).toUpperCase();
    userInitial.textContent = initial;
  }
  
  // Set plan badge
  const isPro = planType === 'monthly';
  planBadge.textContent = isPro ? 'Pro Plan' : 'Free Plan';
  planBadge.className = `plan-badge ${isPro ? 'pro' : 'free'}`;
  
  // Show/hide upgrade badge button for free users
  if (upgradeBadgeBtn) {
    upgradeBadgeBtn.style.display = isPro ? 'none' : 'inline-block';
  }
  
  // Show/hide upgrade section vs pro success section
  upgradeSection.style.display = isPro ? 'none' : 'block';
  proSuccessSection.style.display = isPro ? 'block' : 'none';
}

// Display usage stats
function displayUsageStats(data) {
  const { usage, planType } = data;
  const isPro = planType === 'monthly';
  
  // Update cycle indicator
  const renewalDate = usage.summaries.renewalDate || usage.chats.renewalDate;
  if (renewalDate && !isPro) {
    const daysUntilRenewal = calculateDaysUntilRenewal(renewalDate);
    cycleIndicator.textContent = `Resets in ${daysUntilRenewal} day${daysUntilRenewal === 1 ? '' : 's'}`;
  }
  
  // Summaries
  const summariesUsedCount = usage.summaries.used || 0;
  const summariesLimitCount = usage.summaries.limit;
  const summariesUnlimited = summariesLimitCount === -1;
  
  summariesUsed.textContent = summariesUsedCount;
  summariesLimit.textContent = summariesUnlimited ? '∞' : summariesLimitCount;
  
  if (summariesUnlimited) {
    summariesProgress.style.width = '100%';
    summariesProgress.className = 'progress-fill';
    summariesRemaining.textContent = '∞ left';
    summariesPercentage.textContent = '';
    summariesHint.textContent = '💡 Unlimited summaries with Pro';
    
    // Update pro stats
    if (proSummariesUsed) {
      proSummariesUsed.textContent = summariesUsedCount;
    }
  } else {
    const summariesRemainingCount = Math.max(0, summariesLimitCount - summariesUsedCount);
    const summariesPercent = summariesLimitCount > 0 ? Math.round((summariesUsedCount / summariesLimitCount) * 100) : 0;
    
    summariesProgress.style.width = `${summariesPercent}%`;
    summariesPercentage.textContent = `${summariesPercent}%`;
    summariesRemaining.textContent = `${summariesRemainingCount} left`;
    
    // Color coding for remaining count
    if (summariesRemainingCount === 0) {
      summariesRemaining.className = 'stat-remaining low';
      summariesProgress.className = 'progress-fill danger';
      summariesHint.textContent = '⚠️ Limit reached - Upgrade for unlimited';
    } else if (summariesPercent >= 80) {
      summariesRemaining.className = 'stat-remaining low';
      summariesProgress.className = 'progress-fill warning';
      summariesHint.textContent = `⚡ Only ${summariesRemainingCount} summaries left this month`;
    } else {
      summariesRemaining.className = 'stat-remaining';
      summariesProgress.className = 'progress-fill';
      summariesHint.textContent = '💡 Summarize any Reddit thread instantly';
    }
  }
  
  // Chats
  const chatsUsedCount = usage.chats.used || 0;
  const chatsLimitCount = usage.chats.limit;
  const chatsUnlimited = chatsLimitCount === -1;
  
  chatsUsed.textContent = chatsUsedCount;
  chatsLimit.textContent = chatsUnlimited ? '∞' : chatsLimitCount;
  
  if (chatsUnlimited) {
    chatsProgress.style.width = '100%';
    chatsProgress.className = 'progress-fill';
    chatsRemaining.textContent = '∞ left';
    chatsPercentage.textContent = '';
    chatsHint.textContent = '💡 Unlimited AI conversations with Pro';
    
    // Update pro stats
    if (proChatsUsed) {
      proChatsUsed.textContent = chatsUsedCount;
    }
  } else {
    const chatsRemainingCount = Math.max(0, chatsLimitCount - chatsUsedCount);
    const chatsPercent = chatsLimitCount > 0 ? Math.round((chatsUsedCount / chatsLimitCount) * 100) : 0;
    
    chatsProgress.style.width = `${chatsPercent}%`;
    chatsPercentage.textContent = `${chatsPercent}%`;
    chatsRemaining.textContent = `${chatsRemainingCount} left`;
    
    // Color coding for remaining count
    if (chatsRemainingCount === 0) {
      chatsRemaining.className = 'stat-remaining low';
      chatsProgress.className = 'progress-fill danger';
      chatsHint.textContent = '⚠️ Limit reached - Upgrade for unlimited';
    } else if (chatsPercent >= 60) {
      chatsRemaining.className = 'stat-remaining low';
      chatsProgress.className = 'progress-fill warning';
      chatsHint.textContent = `⚡ Only ${chatsRemainingCount} AI chats left this month`;
    } else {
      chatsRemaining.className = 'stat-remaining';
      chatsProgress.className = 'progress-fill';
      chatsHint.textContent = '💡 Ask AI anything about the discussion';
    }
  }
}

// Calculate days until renewal
function calculateDaysUntilRenewal(renewalDate) {
  const now = new Date();
  const renewal = new Date(renewalDate);
  const diffTime = renewal - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Show specific view
function showView(viewName) {
  loadingView.style.display = 'none';
  notAuthenticatedView.style.display = 'none';
  authenticatedView.style.display = 'none';
  errorView.style.display = 'none';
  
  switch (viewName) {
    case 'loading':
      loadingView.style.display = 'block';
      break;
    case 'not-authenticated':
      notAuthenticatedView.style.display = 'block';
      break;
    case 'authenticated':
      authenticatedView.style.display = 'block';
      break;
    case 'error':
      errorView.style.display = 'block';
      break;
  }
}

// Handle sign out
async function handleSignOut() {
  try {
    await chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user']);
    console.log('✅ Signed out successfully');
    showView('not-authenticated');
  } catch (error) {
    console.error('❌ Error signing out:', error);
    alert('Failed to sign out. Please try again.');
  }
}

console.log('✅ AI Reddit Post Analyzer popup script loaded');
