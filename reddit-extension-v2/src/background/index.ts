/**
 * Background Service Worker
 * Handles API calls to OpenAI
 */

import { ChromeMessage, ChromeResponse, RedditThread, ThreadSummary } from '../types';
import { extractRedditThread } from '../utils/redditExtractor';

// Environment detection for unpublished extensions
let environmentCache: { isDevelopment: boolean; isProduction: boolean } | null = null;

const detectEnvironment = async (): Promise<{ isDevelopment: boolean; isProduction: boolean }> => {
  if (environmentCache) {
    return environmentCache;
  }
  
  console.log('🔍 Detecting environment for Reddit extension...');
  
  // Test if localhost backend is accessible
  try {
    console.log('🔍 Testing localhost API (http://localhost:3001)...');
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
      console.log('✅ Localhost backend accessible - DEVELOPMENT MODE');
      environmentCache = { isDevelopment: true, isProduction: false };
      return environmentCache;
    } else {
      console.log('⚠️ Localhost not healthy - using PRODUCTION MODE');
      environmentCache = { isDevelopment: false, isProduction: true };
      return environmentCache;
    }
  } catch (error: any) {
    console.log('⚠️ Localhost backend test failed:', error.message);
    console.log('🔧 Localhost not reachable - using PRODUCTION MODE');
    environmentCache = { isDevelopment: false, isProduction: true };
    return environmentCache;
  }
};

const getAPIBaseURL = async (): Promise<string> => {
  const env = await detectEnvironment();
  return env.isDevelopment ? 'http://localhost:3001/api' : 'https://api.clicksummary.com/api';
};

// Store conversation history per tab
const conversationHistory = new Map<number, any[]>();

// Initialize environment on startup
(async () => {
  try {
    const env = await detectEnvironment();
    const apiUrl = await getAPIBaseURL();
    console.log('✅ Reddit extension environment initialized');
    console.log(`🌍 Mode: ${env.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
    console.log(`🔗 API URL: ${apiUrl}`);
  } catch (error) {
    console.error('❌ Environment detection failed:', error);
  }
})();

// Initialize
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🚀 AI Reddit Post Analyzer installed:', details.reason);
});

// Listen for EXTERNAL messages from website (for token sync)
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('🌐 EXTERNAL message received from website:', request.action, 'from:', sender.url);
  
  if (request.action === 'storeUserToken') {
    // Store token and user info from website
    const { token, user } = request;
    
    if (token && user) {
      chrome.storage.local.set({
        'youtube_summarizer_token': token,
        'youtube_summarizer_user': JSON.stringify(user)
      }, () => {
        console.log('✅ Token stored from external website');
        sendResponse({ success: true, message: 'Token stored successfully' });
      });
    } else {
      console.warn('⚠️ Missing token or user in external message');
      sendResponse({ success: false, error: 'Missing token or user' });
    }
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'userSignedOut') {
    // Clear stored auth data
    chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user'], () => {
      console.log('🚪 User signed out - cleared auth data (external)');
      sendResponse({ success: true, message: 'Auth data cleared' });
    });
    return true;
  }
  
  return false;
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
  console.log('📨 Background received message:', message.action);

  if (message.action === 'analyzeThread') {
    handleAnalyzeThread(message.data, sender.tab?.id)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  if (message.action === 'chatWithThread') {
    handleChatWithThread(message.data, sender.tab?.id)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.action === 'getApiKey') {
    sendResponse({ success: true, data: 'configured' });
    return false;
  }

  // Handle token storage from content scripts (website-sync.js)
  if ((message as any).action === 'storeUserToken') {
    const { token, user } = message as any;
    if (token && user) {
      chrome.storage.local.set({
        'youtube_summarizer_token': token,
        'youtube_summarizer_user': typeof user === 'string' ? user : JSON.stringify(user)
      }, () => {
        console.log('✅ Token stored from content script');
        sendResponse({ success: true });
      });
    } else {
      sendResponse({ success: false, error: 'Missing token or user' });
    }
    return true;
  }

  // Handle auth status check
  if ((message as any).action === 'getAuthStatus') {
    chrome.storage.local.get(['youtube_summarizer_token', 'youtube_summarizer_user'], (result) => {
      sendResponse({
        success: true,
        isAuthenticated: !!result.youtube_summarizer_token,
        user: result.youtube_summarizer_user ? JSON.parse(result.youtube_summarizer_user) : null
      });
    });
    return true;
  }
});

/**
 * Handle thread analysis
 */
async function handleAnalyzeThread(data: any, tabId?: number): Promise<ThreadSummary> {
  console.log('🤖 Starting thread analysis...');

  // Get thread content from the active tab
  const threadContent = await getThreadContentFromTab(tabId);
  
  if (!threadContent) {
    throw new Error('Failed to extract thread content');
  }

  // Get auth token
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Please sign in to use AI Reddit Post Analyzer. Visit https://www.clicksummary.com to sign in.');
  }

  // Get API URL
  const API_BASE_URL = await getAPIBaseURL();
  
  // Call backend API
  const response = await fetch(`${API_BASE_URL}/reddit/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      threadContent,
      model: data.model || 'gpt-4o-mini',
      language: data.language || 'en'
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Handle authentication errors
    if (response.status === 401) {
      // Clear expired token
      await chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user']);
      throw new Error('Session expired. Please visit clicksummary.com and sign in again, then refresh this page.');
    }
    
    // Handle usage limit errors
    if (response.status === 429) {
      if (errorData.error === 'MONTHLY_REDDIT_SUMMARY_LIMIT_EXCEEDED') {
        throw new Error(`You've reached your monthly limit of ${errorData.limit} Reddit summaries. Upgrade to Pro for unlimited summaries: ${errorData.upgradeUrl}`);
      }
    }
    
    throw new Error(errorData.message || errorData.error || 'Failed to analyze thread');
  }

  const result = await response.json();
  const summary = result.data;

  // Store thread content for chat
  if (tabId) {
    conversationHistory.set(tabId, [{ threadContent }]);
  }

  return summary;
}

/**
 * Get language name from code
 */
function getLanguageName(code: string): string {
  const languages: { [key: string]: string } = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi',
  };
  return languages[code] || 'English';
}

/**
 * Handle chat with thread
 */
async function handleChatWithThread(data: any, tabId?: number): Promise<string> {
  console.log('💬 Handling chat message...');

  // Get auth token
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Please sign in to use AI Reddit Post Analyzer. Visit https://www.clicksummary.com to sign in.');
  }

  // Get thread content
  const threadContent = await getThreadContentFromTab(tabId);
  if (!threadContent) {
    throw new Error('Failed to extract thread content for chat');
  }

  // Get conversation history
  let history = tabId ? conversationHistory.get(tabId) : [];
  if (!history) {
    history = [];
  }
  const conversationHistoryForAPI = history.filter(msg => msg.role && msg.content);

  // Get API URL
  const API_BASE_URL = await getAPIBaseURL();
  
  // Call backend API
  const response = await fetch(`${API_BASE_URL}/reddit/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: data.message,
      threadContent,
      conversationHistory: conversationHistoryForAPI,
      model: data.model || 'gpt-4o-mini'
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Handle authentication errors
    if (response.status === 401) {
      // Clear expired token
      await chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user']);
      throw new Error('Session expired. Please visit clicksummary.com and sign in again, then refresh this page.');
    }
    
    // Handle usage limit errors
    if (response.status === 429) {
      if (errorData.error === 'MONTHLY_REDDIT_CHAT_LIMIT_EXCEEDED') {
        throw new Error(`You've reached your monthly limit of ${errorData.limit} Reddit AI chats. Upgrade to Pro for unlimited chats: ${errorData.upgradeUrl}`);
      }
    }
    
    throw new Error(errorData.message || errorData.error || 'Chat failed');
  }

  const result = await response.json();
  const aiResponse = result.data;

  // Update conversation history
  if (!history || history.length === 0) {
    history = [];
  }
  history.push({ role: 'user', content: data.message });
  history.push({ role: 'assistant', content: aiResponse });
  
  if (tabId) {
    conversationHistory.set(tabId, history);
  }

  return aiResponse;
}

/**
 * Get thread content from active tab
 */
async function getThreadContentFromTab(tabId?: number): Promise<RedditThread | null> {
  if (!tabId) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    tabId = tabs[0]?.id;
  }

  if (!tabId) {
    return null;
  }

  try {
    // Send message to content script to extract thread content
    const response = await chrome.tabs.sendMessage(tabId, { 
      action: 'extractThread' 
    });

    if (response && response.success) {
      return response.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting thread:', error);
    return null;
  }
}

/**
 * Get authentication token from storage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(['youtube_summarizer_token']);
    return result.youtube_summarizer_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

console.log('✅ Background service worker loaded');
