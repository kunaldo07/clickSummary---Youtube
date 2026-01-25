// YouTube Summarizer Popup Script - Multi-Environment Support

// Centralized config: request from background
let WEBSITE_URL = 'https://www.clicksummary.com';
let BACKEND_URL = 'https://api.clicksummary.com/api';

async function loadConfigFromBackground() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
    if (response && response.API_BASE_URL && response.WEBSITE_URL) {
      BACKEND_URL = response.API_BASE_URL;
      WEBSITE_URL = response.WEBSITE_URL;
      console.log(`🌍 Popup Environment: ${response.environment?.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
      console.log(`🌐 Website URL: ${WEBSITE_URL}`);
      console.log(`🔗 Backend URL: ${BACKEND_URL}`);
    } else {
      console.warn('⚠️ getConfig returned incomplete response, using defaults');
    }
  } catch (e) {
    console.warn('⚠️ Failed to load config from background, using defaults', e);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfigFromBackground();
  initializePopup();
  
  // Listen for auth status changes from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'authStatusChanged') {
      console.log('🔄 Auth status changed, refreshing popup...');
      initializePopup();
    }
  });
  
  // Listen for storage changes to update popup in real-time
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && (changes.youtube_summarizer_token || changes.youtube_summarizer_user)) {
      console.log('🔄 Storage changed, refreshing popup...');
      initializePopup();
    }
  });
});

async function initializePopup() {
  try {
    console.log('🚀 Initializing extension popup...');
    console.log('🔍 Environment check:', {
      chrome: !!chrome,
      chromeTabs: !!chrome?.tabs,
      chromeStorage: !!chrome?.storage,
      chromeRuntime: !!chrome?.runtime,
      websiteUrl: WEBSITE_URL,
      backendUrl: BACKEND_URL
    });
    
    // Show loading view initially
    showView('loading-view');
    
    // Check authentication status
    const authData = await checkAuthenticationStatus();
    
    if (authData && authData.token && authData.user) {
      console.log('✅ User is authenticated, showing authenticated view');
      await showAuthenticatedView(authData);
    } else {
      console.log('🔐 User is not authenticated, showing sign-in view');
      showView('not-authenticated-view');
      setupNotAuthenticatedHandlers();
    }
    
  } catch (error) {
    console.error('❌ Error initializing popup:', error);
    showView('not-authenticated-view');
    setupNotAuthenticatedHandlers();
  }
}

async function checkAuthenticationStatus() {
  try {
    console.log('🔍 Starting multi-strategy authentication check...');
    
    // Update UI to show sync status
    updateSyncStatus('🔄 Checking extension storage...');
    
    // Strategy 1: Check chrome.storage.local for auth data
    const result = await chrome.storage.local.get(['youtube_summarizer_token', 'youtube_summarizer_user']);
    
    console.log('📊 Extension storage contents:', {
      hasToken: !!result.youtube_summarizer_token,
      tokenLength: result.youtube_summarizer_token?.length || 0,
      hasUser: !!result.youtube_summarizer_user,
      userLength: result.youtube_summarizer_user?.length || 0
    });
    
    if (result.youtube_summarizer_token && result.youtube_summarizer_user) {
      try {
        const user = JSON.parse(result.youtube_summarizer_user);
        
        // Validate user object structure
        if (!user.id || !user.email || !user.name) {
          console.error('❌ Invalid user data structure:', user);
          await chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user']);
          return null;
        }
        
        console.log('✅ Found auth data in extension storage, validating with backend...');
        updateSyncStatus('🔄 Validating authentication...');
        
        // Validate token with backend to ensure it's still valid
        const isValid = await validateTokenWithBackend(result.youtube_summarizer_token);
        
        if (!isValid) {
          console.warn('⚠️ Token is invalid or expired, clearing storage');
          await chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user']);
          updateSyncStatus('❌ Session expired - please sign in again');
          return null;
        }
        
        console.log('✅ Token validated successfully');
        updateSyncStatus('✅ Authentication verified!');
        
        return {
          token: result.youtube_summarizer_token,
          user: user
        };
        
      } catch (parseError) {
        console.error('❌ Error parsing stored user data:', parseError);
        await chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user']);
      }
    }
    
    console.log('📭 No authentication data found in extension storage');
    
    // Strategy 2: Aggressive multi-attempt sync from web app
    return await attemptWebAppSync();
    
  } catch (error) {
    console.error('❌ Error checking authentication:', error);
    updateSyncStatus('❌ Error checking authentication');
    return null;
  }
}

async function validateTokenWithBackend(token) {
  try {
    console.log('🔐 Validating token with backend...');
    console.log('🔗 Backend URL:', BACKEND_URL);
    console.log('🎫 Token length:', token?.length);
    
    const response = await fetch(`${BACKEND_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Validation response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token validation response:', data);
      return data.valid === true;
    } else if (response.status === 401 || response.status === 403) {
      console.warn('⚠️ Token validation failed: Unauthorized');
      return false;
    } else {
      console.warn('⚠️ Token validation failed with status:', response.status);
      const errorText = await response.text().catch(() => 'No error text');
      console.warn('⚠️ Error response:', errorText);
      // On network errors or other issues, assume token is still valid to avoid false negatives
      return true;
    }
  } catch (error) {
    console.warn('⚠️ Token validation error (assuming valid):', error.message);
    console.warn('⚠️ Error details:', error);
    // On network errors, assume token is still valid to avoid disrupting user experience
    return true;
  }
}

async function attemptWebAppSync() {
  try {
    updateSyncStatus('🔄 Looking for website session...');
    
    // Get all tabs to find the landing page
    const tabs = await chrome.tabs.query({});
    const landingPageTabs = tabs.filter(tab => 
      tab.url && (
        tab.url.includes('localhost:3002') || 
        tab.url.includes('127.0.0.1:3002') ||
        tab.url.includes('clicksummary.com')
      )
    );
    
    console.log(`🌐 Found ${landingPageTabs.length} landing page tab(s)`);
    
    if (landingPageTabs.length === 0) {
      updateSyncStatus('🌐 No website tab found - please sign in first');
      return null;
    }
    
    // Strategy 2a: Try multiple sync attempts across all landing page tabs
    for (const tab of landingPageTabs) {
      console.log(`🔄 Attempting sync from tab ${tab.id}: ${tab.url}`);
      updateSyncStatus(`🔄 Syncing from website tab...`);
      
      try {
        // Inject comprehensive sync script
        const syncResult = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            console.log('🔄 Direct localStorage sync from popup');
            
            const token = localStorage.getItem('youtube_summarizer_token');
            const user = localStorage.getItem('youtube_summarizer_user');
            
            console.log('🔍 Direct localStorage check:', {
              hasToken: !!token,
              hasUser: !!user,
              tokenLength: token?.length || 0,
              userLength: user?.length || 0
            });
            
            if (token && user) {
              // Manual chrome extension sync
              if (typeof chrome !== 'undefined' && chrome.runtime) {
                try {
                  console.log('📤 Sending auth data to extension manually');
                  chrome.runtime.sendMessage({
                    action: 'syncAuthData',
                    authData: {
                      token: token,
                      user: user
                    }
                  });
                } catch (e) {
                  console.warn('Manual sync message failed:', e);
                }
              }
              
              return {
                success: true,
                token: token,
                user: user,
                source: 'direct_localStorage'
              };
            }
            
            return {
              success: false,
              reason: 'no_auth_data_in_localStorage'
            };
          }
        });
        
        console.log('📡 Sync script result:', syncResult);
        
        if (syncResult?.[0]?.result?.success) {
          updateSyncStatus('🔄 Auth data found, syncing...');
          
          // Wait for sync to complete
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Check if sync worked
          const retryResult = await chrome.storage.local.get(['youtube_summarizer_token', 'youtube_summarizer_user']);
          
          if (retryResult.youtube_summarizer_token && retryResult.youtube_summarizer_user) {
            console.log('✅ Website sync successful!');
            updateSyncStatus('✅ Successfully synced from website!');
            
            try {
              const user = JSON.parse(retryResult.youtube_summarizer_user);
              return {
                token: retryResult.youtube_summarizer_token,
                user: user
              };
            } catch (parseError) {
              console.error('❌ Error parsing synced user data:', parseError);
            }
          }
        }
        
      } catch (scriptError) {
        console.warn(`⚠️ Failed to sync from tab ${tab.id}:`, scriptError);
      }
    }
    
    // Strategy 2b: Final attempt - trigger manual background sync
    updateSyncStatus('🔄 Attempting background sync...');
    
    try {
      // Send message to background script to attempt sync
      await chrome.runtime.sendMessage({ 
        action: 'requestAuthSync',
        source: 'popup_manual_check'
      });
      
      // Wait for background sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Final check
      const finalResult = await chrome.storage.local.get(['youtube_summarizer_token', 'youtube_summarizer_user']);
      
      if (finalResult.youtube_summarizer_token && finalResult.youtube_summarizer_user) {
        console.log('✅ Background sync successful!');
        updateSyncStatus('✅ Authentication synced!');
        
        try {
          const user = JSON.parse(finalResult.youtube_summarizer_user);
          return {
            token: finalResult.youtube_summarizer_token,
            user: user
          };
        } catch (parseError) {
          console.error('❌ Error parsing final user data:', parseError);
        }
      }
      
    } catch (bgError) {
      console.warn('⚠️ Background sync failed:', bgError);
    }
    
    // If we get here, all sync strategies failed
    updateSyncStatus('🔑 Please sign in on the website first');
    return null;
    
  } catch (error) {
    console.error('❌ Error in web app sync:', error);
    updateSyncStatus('❌ Sync failed - please try again');
    return null;
  }
}

function updateSyncStatus(message) {
  const syncStatus = document.getElementById('sync-status');
  if (syncStatus) {
    syncStatus.innerHTML = `<small>${message}</small>`;
  }
}

function showView(viewId) {
  // Hide all views
  const views = document.querySelectorAll('.view');
  views.forEach(view => view.classList.add('hidden'));
  
  // Show target view
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.remove('hidden');
  }
}

function setupNotAuthenticatedHandlers() {
  console.log('🔧 Setting up not-authenticated handlers...');
  
  const signInBtn = document.getElementById('sign-in-btn');
  
  if (!signInBtn) {
    console.error('❌ Sign-in button not found!');
    return;
  }
  
  console.log('✅ Sign-in button found, attaching handler');
  
  signInBtn.addEventListener('click', (e) => {
    console.log('🔐 Sign-in button clicked!');
    e.preventDefault();
    
    try {
      if (!chrome || !chrome.tabs) {
        console.error('❌ Chrome tabs API not available');
        return;
      }
      
      const url = `${WEBSITE_URL}/signin`;
      console.log('🌐 Opening URL:', url);
      
      chrome.tabs.create({ url }, (tab) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Error creating tab:', chrome.runtime.lastError);
        } else {
          console.log('✅ Tab created successfully:', tab?.id);
          window.close();
        }
      });
    } catch (error) {
      console.error('❌ Error in sign-in button handler:', error);
    }
  });
  
  console.log('✅ Not-authenticated handlers setup complete');
}

async function showAuthenticatedView(authData) {
  const { user, token } = authData;
  
  // Update user profile
  const userAvatar = document.getElementById('user-avatar');
  const userName = document.getElementById('user-name');
  const planBadge = document.getElementById('plan-badge');
  
  if (userAvatar) {
    if (user.picture) {
      userAvatar.src = user.picture;
      userAvatar.onerror = () => {
        userAvatar.src = generateInitialsAvatar(user.name);
      };
    } else {
      userAvatar.src = generateInitialsAvatar(user.name);
    }
  }
  
  if (userName) {
    userName.textContent = user.name;
  }
  
  // Update plan badge
  const planType = user.subscription?.planType || 'free';
  if (planBadge) {
    if (planType === 'monthly') {
      planBadge.textContent = 'Premium';
      planBadge.className = 'badge premium';
    } else {
      planBadge.textContent = 'Free Plan';
      planBadge.className = 'badge';
    }
  }
  
  // Update plan details
  await updatePlanDetails(user, token);
  
  // Setup authenticated handlers
  setupAuthenticatedHandlers(authData);
  
  // Show authenticated view
  showView('authenticated-view');
}

async function updatePlanDetails(user, token) {
  try {
    // Get elements
    const summariesCount = document.getElementById('summaries-count');
    const planExpiry = document.getElementById('plan-expiry');
    const upgradeBtn = document.getElementById('upgrade-plan-btn');
    
    // Determine plan type
    const planType = user.subscription?.planType || 'free';
    const endDate = user.subscription?.endDate;
    
    // Show/hide upgrade button based on plan
    if (upgradeBtn) {
      if (planType === 'free') {
        upgradeBtn.classList.remove('hidden');
      } else {
        upgradeBtn.classList.add('hidden');
      }
    }
    
    // Update expiry text
    if (planExpiry) {
      if (planType === 'monthly' && endDate) {
        const expiryDate = new Date(endDate);
        planExpiry.textContent = `Renews ${expiryDate.toLocaleDateString()}`;
      } else {
        planExpiry.textContent = 'Resets daily';
      }
    }
    
    // Fetch usage information from backend
    await fetchAndDisplayUsage(token, summariesCount, planType);
    
  } catch (error) {
    console.error('Error updating plan details:', error);
  }
}

async function fetchAndDisplayUsage(token, summariesElement, planType) {
  try {
    console.log('📊 Fetching usage information...');
    
    const response = await fetch(`${BACKEND_URL}/summarizer/usage`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Usage fetch failed: ${response.status}`);
    }

    const usageData = await response.json();
    console.log('📈 Usage data received:', usageData);

    // Update summary count - show REMAINING (decreasing)
    const chatElement = document.getElementById('chat-count');
    const summariesProgress = document.getElementById('summaries-progress');
    const chatProgress = document.getElementById('chat-progress');
    const planExpiry = document.getElementById('plan-expiry');
    
    if (usageData.limits.summaries === -1) {
      summariesElement.textContent = 'Unlimited';
      if (summariesProgress) summariesProgress.style.width = '100%';
    } else {
      const remaining = usageData.usage.summaries.remaining || 0;
      const limit = usageData.limits.summaries;
      const used = limit - remaining;
      const percentage = Math.min((used / limit) * 100, 100);
      
      summariesElement.textContent = `${used}/${limit} used`;
      
      if (summariesProgress) {
        summariesProgress.style.width = `${percentage}%`;
        
        // Add color coding based on remaining
        summariesProgress.className = 'progress-fill'; // Reset
        if (remaining === 0) {
          summariesProgress.classList.add('danger');
        } else if (remaining === 1) {
          summariesProgress.classList.add('warning');
        }
      }
    }

    // Update chat count - show REMAINING (decreasing)
    if (usageData.limits.chatQueries === -1) {
      chatElement.textContent = 'Unlimited';
      if (chatProgress) chatProgress.style.width = '100%';
    } else {
      const chatRemaining = usageData.usage.chat.remaining || 0;
      const chatLimit = usageData.limits.chatQueries;
      const chatUsed = chatLimit - chatRemaining;
      const chatPercentage = Math.min((chatUsed / chatLimit) * 100, 100);
      
      chatElement.textContent = `${chatUsed}/${chatLimit} used`;
      
      if (chatProgress) {
        chatProgress.style.width = `${chatPercentage}%`;
        
        // Add color coding
        chatProgress.className = 'progress-fill'; // Reset
        if (chatRemaining === 0) {
          chatProgress.classList.add('danger');
        } else if (chatRemaining <= 1) {
          chatProgress.classList.add('warning');
        }
      }
    }

    // Update plan expiry with renewal date
    if (planType === 'free' && usageData.renewalDate) {
      const renewalDate = new Date(usageData.renewalDate);
      const now = new Date();
      const daysUntilRenewal = Math.ceil((renewalDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilRenewal > 0) {
        planExpiry.textContent = `Resets in ${daysUntilRenewal} day${daysUntilRenewal === 1 ? '' : 's'}`;
      } else {
        planExpiry.textContent = 'Resets today';
      }
    } else if (usageData.limits.summaries === -1) {
      planExpiry.textContent = 'Unlimited';
    } else {
      planExpiry.textContent = 'Resets monthly';
    }

    // Show upgrade button if user has reached limits
    const upgradeBtn = document.getElementById('upgrade-plan-btn');
    if (!usageData.isPaid && (!usageData.usage.summaries.canUse || !usageData.usage.chat.canUse)) {
      upgradeBtn.classList.remove('hidden');
      upgradeBtn.innerHTML = `
        <span class="btn-icon">⭐</span>
        ${!usageData.usage.summaries.canUse ? 'Summary limit reached!' : 'Chat limit reached!'}
      `;
    }

  } catch (error) {
    console.error('❌ Error fetching usage:', error);
    summariesElement.textContent = 'Unable to load';
    document.getElementById('chat-count').textContent = 'Unable to load';
  }
}

function setupAuthenticatedHandlers(authData) {
  console.log('🔧 Setting up authenticated handlers...');
  const { user, token } = authData;
  
  // Go to website button
  const goToWebsiteBtn = document.getElementById('go-to-website-btn');
  if (!goToWebsiteBtn) {
    console.error('❌ Go-to-website button not found!');
  } else {
    console.log('✅ Go-to-website button found, attaching handler');
    
    goToWebsiteBtn.addEventListener('click', (e) => {
      console.log('🌐 Go-to-website button clicked!');
      e.preventDefault();
      
      try {
        if (!chrome || !chrome.tabs) {
          console.error('❌ Chrome tabs API not available');
          return;
        }
        
        console.log('🌐 Opening URL:', WEBSITE_URL);
        chrome.tabs.create({ url: WEBSITE_URL }, (tab) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Error creating tab:', chrome.runtime.lastError);
          } else {
            console.log('✅ Tab created successfully:', tab?.id);
            window.close();
          }
        });
      } catch (error) {
        console.error('❌ Error in go-to-website button handler:', error);
      }
    });
  }
  
  // Upgrade plan button
  const upgradeBtn = document.getElementById('upgrade-plan-btn');
  if (!upgradeBtn) {
    console.error('❌ Upgrade button not found!');
  } else {
    console.log('✅ Upgrade button found, attaching handler');
    
    upgradeBtn.addEventListener('click', (e) => {
      console.log('⭐ Upgrade button clicked!');
      e.preventDefault();
      
      try {
        if (!chrome || !chrome.tabs) {
          console.error('❌ Chrome tabs API not available');
          return;
        }
        
        const url = `${WEBSITE_URL}/pricing`;
        console.log('🌐 Opening URL:', url);
        
        chrome.tabs.create({ url }, (tab) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Error creating tab:', chrome.runtime.lastError);
          } else {
            console.log('✅ Tab created successfully:', tab?.id);
            window.close();
          }
        });
      } catch (error) {
        console.error('❌ Error in upgrade button handler:', error);
      }
    });
  }
  
  // Sign out button
  const signOutBtn = document.getElementById('sign-out-btn');
  if (!signOutBtn) {
    console.error('❌ Sign-out button not found!');
  } else {
    console.log('✅ Sign-out button found, attaching handler');
    
    signOutBtn.addEventListener('click', async (e) => {
      console.log('🚪 Sign-out button clicked!');
      e.preventDefault();
      
      if (confirm('Are you sure you want to sign out?')) {
        try {
          await signOut();
        } catch (error) {
          console.error('❌ Error signing out:', error);
        }
      }
    });
  }
  
  // Settings handlers
  setupSettingsHandlers();
  
  // Load saved settings
  loadUserSettings();
  
  console.log('✅ Authenticated handlers setup complete');
}

function setupSettingsHandlers() {
  const autoSummarizeCheckbox = document.getElementById('auto-summarize');
  const summaryStyleSelect = document.getElementById('summary-style');
  
  // Auto-summarize setting
  autoSummarizeCheckbox.addEventListener('change', async () => {
    await chrome.storage.local.set({ 'auto_summarize': autoSummarizeCheckbox.checked });
  });
  
  // Summary style setting
  summaryStyleSelect.addEventListener('change', async () => {
    await chrome.storage.local.set({ 'summary_style': summaryStyleSelect.value });
  });
}

async function loadUserSettings() {
  try {
    const settings = await chrome.storage.local.get(['auto_summarize', 'summary_style']);
    
    // Auto-summarize (default: true)
    const autoSummarizeCheckbox = document.getElementById('auto-summarize');
    autoSummarizeCheckbox.checked = settings.auto_summarize !== false;
    
    // Summary style (default: insightful)
    const summaryStyleSelect = document.getElementById('summary-style');
    summaryStyleSelect.value = settings.summary_style || 'insightful';
    
  } catch (error) {
    console.warn('Could not load user settings:', error);
  }
}

async function signOut() {
  try {
    console.log('🚪 SIMPLIFIED POPUP SIGNOUT: Starting...');
    
    // Clear extension storage
    await chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user']);
    console.log('✅ Extension storage cleared');
    
    // Update popup UI immediately
    showView('not-authenticated-view');
    setupNotAuthenticatedHandlers();
    console.log('✅ Popup UI updated');
    
    // SINGLE simple notification to background script
    try {
      chrome.runtime.sendMessage({ 
        action: 'userSignedOut',
        source: 'popup_signout'
      });
      console.log('✅ Background script notified');
    } catch (bgError) {
      console.warn('⚠️ Background notification failed:', bgError);
    }
    
    console.log('✅ SIMPLIFIED POPUP SIGNOUT COMPLETE');
    
  } catch (error) {
    console.error('❌ Popup signout failed:', error);
    
    // Simple fallback
    try {
      await chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user']);
      showView('not-authenticated-view');
      setupNotAuthenticatedHandlers();
    } catch (fallbackError) {
      console.error('❌ Fallback signout failed:', fallbackError);
      alert('Error signing out. Please try again.');
    }
  }
}

function generateInitialsAvatar(name) {
  const initials = getInitials(name);
  const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#8b5cf6"/>
      <text x="50%" y="50%" dy="0.35em" font-family="sans-serif" font-size="14px" fill="white" text-anchor="middle">${initials}</text>
    </svg>
  `;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

function getInitials(name) {
  if (!name) return '?';
  
  const names = name.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

// Refresh usage display without full reinitialization
async function refreshUsageDisplay() {
  try {
    console.log('📊 Refreshing usage display...');
    const result = await chrome.storage.local.get(['youtube_summarizer_token', 'youtube_summarizer_user']);
    
    if (result.youtube_summarizer_token && result.youtube_summarizer_user) {
      const user = JSON.parse(result.youtube_summarizer_user);
      const token = result.youtube_summarizer_token;
      const planType = user.subscription?.planType || 'free';
      
      const summariesElement = document.getElementById('summaries-count');
      if (summariesElement) {
        await fetchAndDisplayUsage(token, summariesElement, planType);
        console.log('✅ Usage display refreshed');
      }
    }
  } catch (error) {
    console.error('❌ Error refreshing usage display:', error);
  }
}

// Handle external links
document.addEventListener('click', (e) => {
  if (e.target.tagName === 'A' && e.target.href && e.target.href.startsWith('http')) {
    e.preventDefault();
    chrome.tabs.create({ url: e.target.href });
  }
});

// Listen for auth changes and usage updates from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'authStatusChanged') {
    // Reinitialize popup when auth status changes
    initializePopup();
  } else if (message.action === 'usageUpdated') {
    // Refresh usage display when user creates summaries or uses chat
    console.log('📊 Usage updated notification received');
    refreshUsageDisplay();
  }
});