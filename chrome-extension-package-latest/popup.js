// YouTube Summarizer Popup Script - Multi-Environment Support

// Environment detection for popup
const detectPopupEnvironment = () => {
  // In a Chrome extension popup, we can't use window.location, 
  // so we'll detect based on browser environment indicators
  const isDevelopment = navigator.userAgent.includes('Development') || 
                       navigator.userAgent.includes('Chrome') && 
                       navigator.userAgent.includes('localhost');
  
  return {
    isDevelopment,
    isProduction: !isDevelopment
  };
};

const getEnvironmentURLs = () => {
  const env = detectPopupEnvironment();
  
  if (env.isDevelopment) {
    return {
      WEBSITE_URL: 'http://localhost:3002',
      BACKEND_URL: 'http://localhost:3001/api'
    };
  } else {
    return {
      WEBSITE_URL: 'https://www.clicksummary.com',
      BACKEND_URL: 'https://api.clicksummary.com/api'
    };
  }
};

const { WEBSITE_URL, BACKEND_URL } = getEnvironmentURLs();

console.log(`🌍 Popup Environment: ${detectPopupEnvironment().isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`🌐 Website URL: ${WEBSITE_URL}`);
console.log(`🔗 Backend URL: ${BACKEND_URL}`);

document.addEventListener('DOMContentLoaded', initializePopup);

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
        
        console.log('✅ Found valid auth data in extension storage');
        updateSyncStatus('✅ Authentication found!');
        
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
            console.log('🌉 Comprehensive sync attempt from popup');
            
            // Strategy A: Use auth bridge if available
            if (window.youTubeSummarizerAuthBridge) {
              console.log('🌉 Using auth bridge forceSync');
              window.youTubeSummarizerAuthBridge.forceSync();
            }
            
            // Strategy B: Direct localStorage check and manual sync
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
  
  // Update header
  document.getElementById('header-subtitle').textContent = `Welcome back, ${user.name.split(' ')[0]}!`;
  
  // Update user profile
  const userAvatar = document.getElementById('user-avatar');
  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  
  if (user.picture) {
    userAvatar.src = user.picture;
    userAvatar.onerror = () => {
      userAvatar.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM4YjVjZjYiLz4KPHR4dCB4PSI1MCUiIHk9IjUwJSIgZHk9IjAuMzVlbSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTRweCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPjwvdHh0Pgo8L3N2Zz4K';
    };
  } else {
    userAvatar.src = generateInitialsAvatar(user.name);
  }
  
  userName.textContent = user.name;
  userEmail.textContent = user.email;
  
  // Update plan details
  await updatePlanDetails(user, token);
  
  // Setup authenticated handlers
  setupAuthenticatedHandlers(authData);
  
  // Show authenticated view
  showView('authenticated-view');
}

async function updatePlanDetails(user, token) {
  try {
    // Update basic plan info
    const planName = document.getElementById('plan-name');
    const planStatus = document.getElementById('plan-status');
    const summariesCount = document.getElementById('summaries-count');
    const planExpiry = document.getElementById('plan-expiry');
    const upgradeBtn = document.getElementById('upgrade-plan-btn');
    
    // Determine plan type
    const isActive = user.subscription?.isActive || false;
    const planType = user.subscription?.planType || 'free';
    const trialEndsAt = user.subscription?.trialEndsAt;
    const endDate = user.subscription?.endDate;
    
    if (planType === 'free') {
      planName.textContent = 'Free Plan';
      planStatus.textContent = 'Forever';
      planStatus.className = 'plan-badge trial';
      upgradeBtn.classList.remove('hidden');
      
      if (trialEndsAt) {
        const trialDate = new Date(trialEndsAt);
        const now = new Date();
        const daysLeft = Math.max(0, Math.ceil((trialDate - now) / (1000 * 60 * 60 * 24)));
        planExpiry.textContent = `${daysLeft} days left in trial`;
      } else {
        planExpiry.textContent = 'Trial period';
      }
    } else if (planType === 'monthly') {
      planName.textContent = 'Premium Plan';
      planStatus.textContent = 'Active';
      planStatus.className = 'plan-badge premium';
      upgradeBtn.classList.add('hidden');
      
      if (endDate) {
        const expiryDate = new Date(endDate);
        planExpiry.textContent = expiryDate.toLocaleDateString();
      } else {
        planExpiry.textContent = 'Active subscription';
      }
    }
    
    // Fetch usage information from backend
    await fetchAndDisplayUsage(token, summariesCount);
    
  } catch (error) {
    console.error('Error updating plan details:', error);
  }
}

async function fetchAndDisplayUsage(token, summariesElement) {
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

    // Update summary count with usage info
    if (usageData.limits.summaries === -1) {
      summariesElement.textContent = `${usageData.usage.summaries.today} today (Unlimited)`;
    } else {
      summariesElement.textContent = `${usageData.usage.summaries.today}/${usageData.limits.summaries} today`;
    }

    // Update plan expiry with chat usage info
    const planExpiry = document.getElementById('plan-expiry');
    if (usageData.limits.chatQueries === -1) {
      planExpiry.textContent = `Chat: Unlimited`;
    } else {
      planExpiry.textContent = `Chat: ${usageData.usage.chat.today}/${usageData.limits.chatQueries} today`;
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
    summariesElement.textContent = 'Unable to load usage';
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
    document.getElementById('header-subtitle').textContent = 'AI-powered video summaries';
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

// Handle external links
document.addEventListener('click', (e) => {
  if (e.target.tagName === 'A' && e.target.href && e.target.href.startsWith('http')) {
    e.preventDefault();
    chrome.tabs.create({ url: e.target.href });
  }
});

// Listen for auth changes from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'authStatusChanged') {
    // Reinitialize popup when auth status changes
    initializePopup();
  }
});