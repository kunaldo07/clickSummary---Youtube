// YouTube Summarizer Background Script - Multi-Environment Support

// Environment detection for unpublished extensions (localhost + production)
let environmentCache = null;

const detectEnvironment = async () => {
  if (environmentCache) {
    return environmentCache;
  }
  
  console.log('🔍 Detecting environment for unpublished extension...');
  
  // First check if user has manually set a preference
  try {
    const stored = await chrome.storage.local.get(['environment_preference']);
    if (stored.environment_preference) {
      console.log('🔧 Using stored environment preference:', stored.environment_preference);
      environmentCache = stored.environment_preference;
      return environmentCache;
    }
  } catch (error) {
    console.log('⚠️ Could not read stored environment preference:', error);
  }
  
  // Test if localhost backend is accessible
  try {
    console.log('🔍 Testing localhost API (http://localhost:3001)...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch('http://localhost:3001/api/health', {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
      cache: 'no-cache'
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ Localhost backend accessible - DEVELOPMENT MODE');
      environmentCache = { isDevelopment: true, isProduction: false };
      return environmentCache;
    } else {
      console.log('⚠️ Localhost backend responded with error:', response.status);
      console.log('⚠️ Localhost not healthy - using PRODUCTION MODE');
      environmentCache = { isDevelopment: false, isProduction: true };
      return environmentCache;
    }
  } catch (error) {
    console.log('⚠️ Localhost backend test failed:', error.message);
    console.log('⚠️ Error type:', error.name);
    
    // In production, users will not have a localhost backend. Default to production
    // unless localhost explicitly succeeds.
    if (error.name === 'AbortError') {
      console.log('⏰ Localhost check timed out - using PRODUCTION MODE');
    } else {
      console.log('🔧 Localhost not reachable - using PRODUCTION MODE');
    }
    console.log('💡 If you want DEVELOPMENT mode, set it manually via setConfig');
    environmentCache = { isDevelopment: false, isProduction: true };
    return environmentCache;
  }
};

const getAPIBaseURL = async () => {
  const env = await detectEnvironment();
  return env.isDevelopment ? 'http://localhost:3001/api' : 'https://api.clicksummary.com/api';
};

const getWebsiteBaseURL = async () => {
  const env = await detectEnvironment();
  return env.isDevelopment ? 'http://localhost:3002' : 'https://www.clicksummary.com';
};

// Initialize CONFIG with async environment detection
// Start with DEVELOPMENT defaults for local testing
let CONFIG = {
  API_BASE_URL: 'http://localhost:3001/api',
  WEBSITE_BASE_URL: 'http://localhost:3002',
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  environment: { isDevelopment: true, isProduction: false }
};

// Initialize environment detection
(async () => {
  try {
    console.log('🚀 Initializing extension environment...');
    
    const environment = await detectEnvironment();
    const apiBaseURL = await getAPIBaseURL();
    const websiteBaseURL = await getWebsiteBaseURL();
    
    // Apply stored overrides if present
    try {
      const stored = await chrome.storage.local.get(['config_overrides']);
      if (stored && stored.config_overrides) {
        if (stored.config_overrides.apiBaseUrl) {
          console.log('🔧 Applying API base URL override from storage');
          CONFIG.API_BASE_URL = stored.config_overrides.apiBaseUrl;
        }
        if (stored.config_overrides.websiteUrl) {
          console.log('🔧 Applying Website base URL override from storage');
          CONFIG.WEBSITE_BASE_URL = stored.config_overrides.websiteUrl;
        }
      }
    } catch (e) {
      console.log('⚠️ Could not read config overrides:', e);
    }
    
    CONFIG = {
      API_BASE_URL: (CONFIG.API_BASE_URL ?? apiBaseURL),
      WEBSITE_BASE_URL: (CONFIG.WEBSITE_BASE_URL ?? websiteBaseURL),
      RETRY_ATTEMPTS: 3,
      RETRY_DELAY: 1000,
      environment
    };
    
    console.log('✅ Environment detection complete');
    console.log(`🌍 Mode: ${CONFIG.environment.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
    console.log(`🔗 API URL: ${CONFIG.API_BASE_URL}`);
    console.log(`🕸️ Website URL: ${CONFIG.WEBSITE_BASE_URL}`);
    
  } catch (error) {
    console.error('❌ Environment detection failed:', error);
    console.log('🔄 Using production fallback');
    CONFIG = {
      API_BASE_URL: 'https://api.clicksummary.com/api',
      WEBSITE_BASE_URL: 'https://www.clicksummary.com',
      RETRY_ATTEMPTS: 3,
      RETRY_DELAY: 1000,
      environment: { isDevelopment: false, isProduction: true }
    };
  }
})();

// Handle messages from EXTERNAL websites (localhost:3002, clicksummary.com)
// This is required for website-to-extension communication via externally_connectable
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('🌐 EXTERNAL message received from website:', {
    action: request.action,
    senderUrl: sender.url,
    senderOrigin: sender.origin,
    timestamp: new Date().toISOString()
  });

  if (request.action === 'storeUserToken') {
    console.log('💾 Storing user token from website...');
    
    const dataToStore = {
      youtube_summarizer_token: request.token
    };
    
    if (request.user) {
      dataToStore.youtube_summarizer_user = JSON.stringify(request.user);
      console.log('✅ Storing user:', request.user.name, request.user.email);
    }
    
    chrome.storage.local.set(dataToStore, () => {
      if (chrome.runtime.lastError) {
        console.error('❌ Failed to store token:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('✅ Token stored successfully from website!');
        chrome.runtime.sendMessage({ action: 'authStatusChanged' }).catch(() => {});
        sendResponse({ success: true });
      }
    });
    return true;
  }

  if (request.action === 'userSignedOut') {
    console.log('🚪 User signed out from website...');
    
    chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user'], () => {
      if (chrome.runtime.lastError) {
        console.error('❌ Failed to clear token:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('✅ User data cleared from website signout');
        chrome.runtime.sendMessage({ action: 'authStatusChanged' }).catch(() => {});
        sendResponse({ success: true });
      }
    });
    return true;
  }

  console.log('⚠️ Unknown external action:', request.action);
  sendResponse({ success: false, error: 'Unknown action' });
  return true;
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Message received in background script:', {
    action: request.action,
    hasData: !!request.data,
    sender: sender.tab ? `Tab ${sender.tab.id}` : 'Extension',
    timestamp: new Date().toISOString()
  });
  
  // Add try-catch around all message handling
  try {
    if (request.action === 'summarize') {
      console.log('🎯 Handling summarize action');
      handleSummarization(request.transcript, request.videoId)
        .then(summary => {
          console.log('✅ Summarize success, sending response');
          sendResponse({ summary });
        })
        .catch(error => {
          console.error('❌ Summarize error:', error);
          sendResponse({ error: error.message });
        });
      return true;
    }
    
    if (request.action === 'getConfig') {
      console.log('🎯 Handling getConfig action');
      sendResponse({
        API_BASE_URL: CONFIG.API_BASE_URL,
        WEBSITE_URL: CONFIG.WEBSITE_BASE_URL,
        environment: CONFIG.environment
      });
      return true;
    }
    
    if (request.action === 'setConfig') {
      console.log('🎯 Handling setConfig action');
      const overrides = request.overrides || {};
      const newOverrides = {};
      
      if (overrides.apiBaseUrl) {
        CONFIG.API_BASE_URL = overrides.apiBaseUrl;
        newOverrides.apiBaseUrl = overrides.apiBaseUrl;
      }
      if (overrides.websiteUrl) {
        CONFIG.WEBSITE_BASE_URL = overrides.websiteUrl;
        newOverrides.websiteUrl = overrides.websiteUrl;
      }
      if (overrides.environmentPreference) {
        environmentCache = overrides.environmentPreference;
        chrome.storage.local.set({ environment_preference: overrides.environmentPreference }, () => {});
      }
      
      chrome.storage.local.get(['config_overrides'], (stored) => {
        const merged = { ...((stored && stored.config_overrides) || {}), ...newOverrides };
        chrome.storage.local.set({ config_overrides: merged }, () => {
          if (chrome.runtime.lastError) {
            console.warn('⚠️ Failed saving config overrides:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            console.log('✅ Config overrides saved');
            sendResponse({ success: true, config: { API_BASE_URL: CONFIG.API_BASE_URL, WEBSITE_URL: CONFIG.WEBSITE_BASE_URL, environment: CONFIG.environment } });
          }
        });
      });
      return true;
    }
    
    if (request.action === 'summarizeAdvanced') {
      console.log('🎯 Handling summarizeAdvanced action');
      console.log('🚀 Summarizing advanced inside listener:', request.data);
      
      handleAdvancedSummarization(request.data)
        .then(summary => {
          console.log('✅ Advanced summarize success, sending response');
          sendResponse({ summary });
          
          // Notify popup to refresh usage display
          chrome.runtime.sendMessage({ action: 'usageUpdated' }).catch(() => {
            // Popup might not be open, ignore error
          });
        })
        .catch(error => {
          console.error('❌ Advanced summarize error:', error);
          sendResponse({ error: error.message });
        });
      return true;
    }
    
    if (request.action === 'summarizeTimestamped') {
      console.log('🎯 Handling summarizeTimestamped action');
      handleTimestampedSummarization(request.data)
        .then(summary => sendResponse({ summary }))
        .catch(error => sendResponse({ error: error.message }));
      return true;
    }
    
    if (request.action === 'clearCache') {
      console.log('🎯 Handling clearCache action');
      clearAllCache()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ error: error.message }));
      return true;
    }
    
    if (request.action === 'clearVideoCache') {
      console.log('🎯 Handling clearVideoCache action');
      clearVideoCache(request.videoId)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ error: error.message }));
      return true;
    }
    
    if (request.action === 'chatQuery') {
      console.log('🎯 Handling chatQuery action');
      handleChatQuery(request.data)
        .then(answer => {
          sendResponse({ answer });
          
          // Notify popup to refresh usage display
          chrome.runtime.sendMessage({ action: 'usageUpdated' }).catch(() => {
            // Popup might not be open, ignore error
          });
        })
        .catch(error => sendResponse({ error: error.message }));
      return true;
    }

    if (request.action === 'storeUserToken') {
      console.log('💾 Storing user token and data from landing page...');
      
      const dataToStore = {
        youtube_summarizer_token: request.token
      };
      
      // Also store user data if provided
      if (request.user) {
        dataToStore.youtube_summarizer_user = JSON.stringify(request.user);
        console.log('✅ Storing user data:', request.user.name, request.user.email);
      }
      
      chrome.storage.local.set(dataToStore, () => {
        if (chrome.runtime.lastError) {
          console.error('❌ Failed to store token:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('✅ Token and user data stored successfully');
          
          // Notify popup about auth change
          chrome.runtime.sendMessage({ action: 'authStatusChanged' }).catch(() => {
            // Popup might not be open, which is fine
          });
          
          sendResponse({ success: true });
        }
      });
      return true;
    }
    
    if (request.action === 'userSignedOut') {
      console.log('🚪 User signed out - clearing stored data...');
      
      chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user'], () => {
        if (chrome.runtime.lastError) {
          console.error('❌ Failed to clear token:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('✅ User data cleared successfully');
          
          // Notify popup and content scripts about auth status change
          chrome.runtime.sendMessage({ action: 'authStatusChanged' }).catch(() => {
            // Popup might not be open, which is fine
            console.log('📭 Popup not open, auth change notification skipped');
          });
          
          // Notify all tabs with content script
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              chrome.tabs.sendMessage(tab.id, { action: 'authStatusChanged' }).catch(() => {
                // Tab might not have content script, which is fine
              });
            });
          });
          
          sendResponse({ success: true });
        }
      });
      return true;
    }
    
    if (request.action === 'syncAuthData') {
      console.log('🔄 Manual auth data sync requested from website...');
      
      const dataToStore = {
        youtube_summarizer_token: request.authData.token,
        youtube_summarizer_user: request.authData.user
      };
      
      chrome.storage.local.set(dataToStore, () => {
        if (chrome.runtime.lastError) {
          console.error('❌ Failed to sync auth data:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('✅ Auth data synced successfully from manual request');
          
          // Notify popup about auth change
          chrome.runtime.sendMessage({ action: 'authStatusChanged' }).catch(() => {
            // Popup might not be open, which is fine
          });
          
          sendResponse({ success: true });
        }
      });
      return true;
    }
    
    if (request.action === 'requestAuthSync') {
      console.log('🔍 Auth sync requested from:', request.source);
      
      // Try to find landing page tabs and trigger sync
      chrome.tabs.query({}, async (tabs) => {
        const landingPageTabs = tabs.filter(tab => 
          tab.url && (
            tab.url.includes('localhost:3002') || 
            tab.url.includes('127.0.0.1:3002') ||
            tab.url.includes('clicksummary.com')
          )
        );
        
        console.log(`🌐 Found ${landingPageTabs.length} landing page tab(s) for background sync`);
        
        if (landingPageTabs.length > 0) {
          for (const tab of landingPageTabs) {
            try {
              console.log(`🔄 Background sync attempt from tab ${tab.id}`);
              
              await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                  console.log('🔄 Direct localStorage sync from background script');
                  
                  const token = localStorage.getItem('youtube_summarizer_token');
                  const user = localStorage.getItem('youtube_summarizer_user');
                  
                  if (token && user) {
                    console.log('📤 Sending auth data to extension');
                    if (typeof chrome !== 'undefined' && chrome.runtime) {
                      chrome.runtime.sendMessage({
                        action: 'syncAuthData',
                        authData: { token: token, user: user }
                      });
                      return true;
                    }
                  }
                  
                  return false;
                }
              });
              
            } catch (error) {
              console.warn(`⚠️ Background sync failed for tab ${tab.id}:`, error);
            }
          }
          
          sendResponse({ 
            success: true, 
            message: `Sync attempted on ${landingPageTabs.length} tabs` 
          });
        } else {
          sendResponse({ 
            success: false, 
            message: 'No landing page tabs found for sync' 
          });
        }
      });
      
      return true;
    }
    
    // Default case for unrecognized actions
    console.log('⚠️ Unrecognized action:', request.action);
    sendResponse({ 
      error: `Unrecognized action: ${request.action}`,
      supportedActions: [
        'summarize', 'summarizeAdvanced', 'summarizeTimestamped',
        'clearCache', 'clearVideoCache', 'chatQuery',
        'storeUserToken', 'userSignedOut', 'syncAuthData', 'requestAuthSync',
        'getConfig', 'setConfig'
      ]
    });
    return true;
    
  } catch (error) {
    console.error('❌ Message listener error:', error);
    sendResponse({ error: 'Internal extension error: ' + error.message });
    return true;
  }
});

// Function to clear all cached summaries (useful for testing different lengths)
async function clearAllCache() {
  console.log('🗑️ Clearing all cached summaries...');
  const storage = await chrome.storage.local.get();
  const keysToRemove = [];
  
  for (const key in storage) {
    if (key.startsWith('summary_') || key.startsWith('cache_')) {
      keysToRemove.push(key);
    }
  }
  
  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
    console.log(`✅ Cleared ${keysToRemove.length} cached summaries`);
  } else {
    console.log('ℹ️ No cached summaries found');
  }
}

// Function to clear cache for a specific video
async function clearVideoCache(videoId) {
  console.log(`🗑️ Clearing cache for video: ${videoId}`);
  const storage = await chrome.storage.local.get();
  const keysToRemove = [];
  
  for (const key in storage) {
    if (key.includes(videoId)) {
      keysToRemove.push(key);
    }
  }
  
  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
    console.log(`✅ Cleared ${keysToRemove.length} cache entries for video ${videoId}`);
  } else {
    console.log(`ℹ️ No cache found for video ${videoId}`);
  }
}

async function callOpenAI(transcript, apiKey) {
  try {
    console.log('🤖 Calling OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5-nano',
        messages: [
          {
            role: 'system',
            content: 'You are an expert summarizer. Create a concise, informative summary of the provided transcript.'
          },
          {
            role: 'user',
            content: `Please summarize this transcript: ${transcript}`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ OpenAI API call failed:', error);
    throw error;
  }
}

async function handleAdvancedSummarization(requestData) {
  try {
    console.log('🔍 handleAdvancedSummarization called with:', {
      hasTranscript: !!requestData.transcript,
      transcriptLength: requestData.transcript ? requestData.transcript.length : 0,
      videoId: requestData.videoId,
      type: requestData.type,
      length: requestData.length,
      format: requestData.format
    });

    // Get user authentication token
    const userToken = await getUserToken();
    console.log('🔑 User token check:', {
      hasToken: !!userToken,
      tokenLength: userToken ? userToken.length : 0
    });
    
    if (!userToken) {
      console.error('❌ No authentication token found');
      throw new Error('Please sign in to use the summarizer');
    }

    // Build source text: prefer transcript; fallback to comments if available
    let sourceText = requestData.transcript && requestData.transcript.trim() !== ''
      ? requestData.transcript
      : '';

    if (!sourceText && Array.isArray(requestData.comments) && requestData.comments.length > 0) {
      console.log('📝 Transcript missing, falling back to comments for summarization');
      try {
        const topComments = requestData.comments
          .filter(c => c && typeof c.text === 'string' && c.text.trim().length > 0)
          .slice(0, 10)
          .map((c, idx) => `Comment ${idx + 1} by ${c.author || 'Unknown'} (${c.likes || 0} likes): ${c.text.trim()}`)
          .join('\n');
        sourceText = `Video top comments context (no transcript available):\n${topComments}`;
      } catch (e) {
        console.warn('⚠️ Failed to build comments fallback text:', e);
      }
    }

    // Validate input data after attempting fallback
    if (!sourceText || sourceText.trim() === '') {
      console.error('❌ No transcript or comments available to summarize');
      throw new Error('No transcript available for this video');
    }

    if (!requestData.videoId) {
      console.error('❌ No video ID provided');
      throw new Error('Video ID is required');
    }

    console.log('🚀 Using secure gpt-5-nano backend for summarization');
    console.log('📊 Request data:', {
      videoId: requestData.videoId,
      type: requestData.type,
      length: requestData.length,
      format: requestData.format,
      transcriptLength: (sourceText && typeof sourceText === 'string') ? sourceText.length : 0
    });

    console.log('🌍 Environment config:', {
      apiBaseUrl: CONFIG.API_BASE_URL,
      isDevelopment: CONFIG.environment?.isDevelopment,
      isProduction: CONFIG.environment?.isProduction
    });

    // Call secure backend with gpt-5-nano
    const response = await callSecureBackend('/summarizer/summarize', {
      transcript: sourceText,
      videoId: requestData.videoId,
      type: requestData.type,
      length: requestData.length,
      format: requestData.format
    }, userToken);

    console.log('✅ Summary generated successfully with gpt-5-nano');
    
    if (response.metadata) {
      console.log('📈 Cost info:', {
        model: response.metadata.model,
        fromCache: response.metadata.fromCache,
        costSaved: response.metadata.costSaved
      });
    }

    if (!response.summary) {
      console.error('❌ No summary in response:', response);
      throw new Error('No summary generated by backend');
    }

    console.log('✅ Returning summary of length:', response.summary.length);
    return response.summary;
    
  } catch (error) {
    console.error('❌ Secure summarization error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Provide more specific error messages
    if (error.message.includes('fetch')) {
      throw new Error('Unable to connect to backend server. Please check if the server is running.');
    } else if (error.message.includes('Authentication')) {
      throw new Error('Authentication failed. Please sign in again.');
    } else if (error.message.includes('Rate limit')) {
      throw new Error('Rate limit exceeded. Please try again in a few minutes.');
    } else {
      throw error;
    }
  }
}

async function handleTimestampedSummarization(requestData) {
  try {
    // Get user authentication token
    const userToken = await getUserToken();
    
    if (!userToken) {
      throw new Error('Please sign in to use the summarizer');
    }

    console.log('🚀 Using secure gpt-5-nano backend for timestamped summarization');
    console.log('📊 Request data:', {
      videoId: requestData.videoId,
      type: requestData.type,
      transcriptLength: requestData.transcript?.length
    });

    // Call secure backend with GPT-4 for timestamped summaries
    const response = await callSecureBackend('/summarizer/timestamped', {
      transcript: requestData.transcript,
      videoId: requestData.videoId,
      type: requestData.type
    }, userToken);

    console.log('✅ Timestamped summary generated successfully');
    return response.summary;
  } catch (error) {
    console.error('Timestamped summarization error:', error);
    throw error;
  }
}

async function handleChatQuery(requestData) {
  try {
    // Get user authentication token
    const userToken = await getUserToken();
    
    if (!userToken) {
      throw new Error('Please sign in to use the chat feature');
    }

    console.log('💬 Processing chat query:', requestData.question);

    // Call secure backend for chat queries
    const response = await callSecureBackend('/summarizer/chat', {
      question: requestData.question,
      transcript: requestData.transcript,
      videoId: requestData.videoId
    }, userToken);

    console.log('✅ Chat response generated successfully');
    return response.answer;
  } catch (error) {
    console.error('Chat query error:', error);
    throw error;
  }
}

async function callSecureBackend(endpoint, data, userToken) {
  const url = `${CONFIG.API_BASE_URL}${endpoint}`;
  
  for (let attempt = 0; attempt < CONFIG.RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`🔗 Calling secure backend: ${endpoint} (attempt ${attempt + 1})`);
      console.log(`🌐 Full URL: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ Backend call timeout after 30 seconds: ${endpoint}`);
        controller.abort();
      }, 30000);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
          'X-Extension-ID': chrome.runtime.id,
          'X-Extension-Version': chrome.runtime.getManifest().version
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log(`📡 Backend response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Backend error response:`, JSON.stringify(errorData, null, 2));
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please sign in again.');
        } else if (response.status === 429) {
          if (errorData.code === 'DAILY_LIMIT_EXCEEDED') {
            const details = errorData.details || {};
            if (details.planType === 'free') {
              throw new Error(`🚀 Free Plan Limit Reached!\n\nYou've used all ${details.limit} free summaries today (${details.used}/${details.limit}).\n\n✨ Subscribe to Pro Plan for:\n• Unlimited summaries\n• Unlimited chat queries\n• Priority support\n\nUpgrade now at clicksummary.com/pricing`);
            } else {
              throw new Error(`Daily limit reached! You've used ${details.used}/${details.limit} summaries today. Limit resets tomorrow.`);
            }
          } else if (errorData.code === 'MONTHLY_CHAT_LIMIT_EXCEEDED') {
            const details = errorData.details || {};
            const renewalDate = details.renewalDate ? new Date(details.renewalDate).toLocaleDateString() : 'soon';
            if (details.planType === 'free') {
              throw new Error(`🚀 Free Plan Limit Reached!\n\nYou've used all ${details.limit} free chat queries this month (${details.used}/${details.limit}).\n\n✨ Subscribe to Pro Plan for:\n• Unlimited summaries\n• Unlimited chat queries\n• Priority support\n\nUpgrade now at clicksummary.com/pricing\n\n📅 Free plan resets on ${renewalDate}`);
            } else {
              throw new Error(`Monthly chat limit reached! You've used ${details.used}/${details.limit} chat queries this month. Limit resets on ${renewalDate}.`);
            }
          } else if (errorData.code === 'DAILY_CHAT_LIMIT_EXCEEDED') {
            // Legacy support for old error code
            const details = errorData.details || {};
            throw new Error(`Chat limit reached! You've used ${details.used}/${details.limit} chat queries. ${details.planType === 'free' ? 'Upgrade to Premium for unlimited chat.' : 'Limit resets soon.'}`);
          } else {
            throw new Error(errorData.error || 'Rate limit exceeded. Please try again later.');
          }
        } else if (response.status === 403) {
          throw new Error('Subscription required. Please upgrade your plan.');
        } else {
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('✅ Backend call successful');
      return result;

    } catch (error) {
      console.error(`❌ Backend call failed (attempt ${attempt + 1}/${CONFIG.RETRY_ATTEMPTS}):`, error.message);
      console.error(`❌ Error details:`, JSON.stringify({
        name: error.name,
        message: error.message,
        url: url,
        endpoint: endpoint,
        stack: error.stack
      }, null, 2));
      
      if (error.name === 'AbortError') {
        throw new Error(`Backend request timed out after 30 seconds. Please check if backend is running on ${CONFIG.API_BASE_URL}`);
      }
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error(`❌ Network error: Cannot reach ${url}`);
        console.error(`💡 Possible causes:`);
        console.error(`   1. Backend server not running on ${CONFIG.API_BASE_URL}`);
        console.error(`   2. CORS issue (check backend CORS settings)`);
        console.error(`   3. Wrong URL configured (check extension config)`);
      }
      
      if (attempt === CONFIG.RETRY_ATTEMPTS - 1) {
        throw new Error(`Unable to connect to backend server at ${CONFIG.API_BASE_URL}. Please check if the server is running.`);
      }
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * (attempt + 1)));
    }
  }
}

// User Token Management
async function getUserToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['youtube_summarizer_token'], (result) => {
      resolve(result.youtube_summarizer_token);
    });
  });
}

// Update user token when user signs in (called from content script)
async function updateUserToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ youtube_summarizer_token: token }, () => {
      console.log('✅ User token updated');
      resolve(true);
    });
  });
}

// Clear user token on sign out
async function clearUserToken() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user'], () => {
      console.log('🗑️ User token and data cleared');
      resolve(true);
    });
  });
}