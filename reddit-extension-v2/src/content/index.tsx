import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '../ui/App';
import { toolbarStyles } from '../ui/styles/toolbar';
import { isRedditThreadPage, findPostContainer, extractRedditThread } from '../utils/redditExtractor';

// Expose extraction function for background script
(window as any).__redditAIAnalyzer_extractThread = extractRedditThread;

/**
 * Content Script Entry Point
 * Injects the React app into Reddit's DOM using Shadow DOM
 */

let shadowRoot: ShadowRoot | null = null;
let reactRoot: ReactDOM.Root | null = null;
let containerElement: HTMLElement | null = null;
let currentThreadId: string | null = null;
let toolbarObserver: MutationObserver | null = null;
let monitoringInterval: NodeJS.Timeout | null = null;
let reinjectionAttempts = 0;
const MAX_REINJECTION_ATTEMPTS = 10;

/**
 * Get the thread ID from the current URL
 */
function getThreadIdFromUrl(): string | null {
  const match = window.location.pathname.match(/\/comments\/([a-z0-9]+)/i);
  return match ? match[1] : null;
}

/**
 * Initialize the extension on Reddit thread pages
 */
function initialize() {
  console.log('🚀 AI Reddit Post Analyzer: Initializing...');

  // Check if we're on a thread page
  if (!isRedditThreadPage()) {
    console.log('⏭️  Not a thread page, skipping injection');
    return false;
  }

  const threadId = getThreadIdFromUrl();
  console.log('✅ Thread page detected, ID:', threadId);

  // Check if already injected for this thread
  if (containerElement && currentThreadId === threadId) {
    console.log('⚠️ Already injected for this thread, skipping');
    return true;
  }

  // Wait for Reddit's post to be available
  const postContainer = findPostContainer();
  if (!postContainer) {
    console.log('⏳ Post container not found yet');
    return false;
  }

  console.log('✅ Post container found, injecting toolbar');
  currentThreadId = threadId;
  injectToolbar();
  return true;
}

/**
 * Inject the toolbar into Reddit's DOM (above the post)
 */
function injectToolbar() {
  // Prevent double injection
  if (containerElement && document.body.contains(containerElement)) {
    console.log('⚠️  Already injected and in DOM, skipping');
    return;
  }

  console.log('💉 Injecting toolbar...');

  // Find the post container
  const postContainer = findPostContainer();
  if (!postContainer) {
    console.error('❌ Post container not found');
    return;
  }

  console.log('✅ Found post container:', postContainer.tagName);

  // Create container for our extension
  containerElement = document.createElement('div');
  containerElement.id = 'reddit-ai-analyzer-root';
  containerElement.setAttribute('data-extension-injected', 'true');
  containerElement.style.cssText = `
    width: 100%;
    max-width: 100%;
    margin: 0 0 16px 0;
    padding: 0;
    box-sizing: border-box;
    position: relative;
    z-index: 1000;
  `;

  // Insert toolbar directly BEFORE the post
  const parent = postContainer.parentElement;
  if (!parent) {
    console.error('❌ Post container has no parent');
    return;
  }
  
  parent.insertBefore(containerElement, postContainer);
  console.log('📍 Toolbar inserted into:', parent.tagName);

  // Create Shadow DOM for style isolation
  shadowRoot = containerElement.attachShadow({ mode: 'open' });

  // Create style element
  const styleElement = document.createElement('style');
  styleElement.textContent = toolbarStyles;
  shadowRoot.appendChild(styleElement);

  // Create React root container
  const reactContainer = document.createElement('div');
  reactContainer.id = 'react-root';
  shadowRoot.appendChild(reactContainer);

  // Render React app with error handling
  try {
    reactRoot = ReactDOM.createRoot(reactContainer);
    reactRoot.render(<App />);
    console.log('✅ Toolbar injected successfully above post');
  } catch (error: any) {
    console.error('❌ Error rendering React app:', error.message);
    // If extension context is invalidated, the page needs a refresh
    if (error.message?.includes('Extension context invalidated')) {
      console.warn('⚠️ Extension was reloaded. Please refresh the page for the toolbar to work.');
      // Clean up and don't start monitoring
      if (containerElement) {
        containerElement.remove();
        containerElement = null;
      }
      return;
    }
  }
  
  // Start continuous monitoring for removal
  startToolbarMonitoring();
}

/**
 * Monitor toolbar and re-inject if removed by Reddit
 */
function startToolbarMonitoring() {
  // Stop any existing monitoring
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }
  if (toolbarObserver) {
    toolbarObserver.disconnect();
  }
  
  reinjectionAttempts = 0;
  
  // Check every 500ms if toolbar is still in DOM
  monitoringInterval = setInterval(() => {
    if (!containerElement) {
      if (monitoringInterval) clearInterval(monitoringInterval);
      return;
    }
    
    const stillExists = document.body.contains(containerElement);
    
    if (!stillExists && reinjectionAttempts < MAX_REINJECTION_ATTEMPTS) {
      reinjectionAttempts++;
      console.warn(`⚠️ Toolbar removed from DOM! Re-injecting (attempt ${reinjectionAttempts}/${MAX_REINJECTION_ATTEMPTS})...`);
      
      // Reset state
      containerElement = null;
      reactRoot = null;
      shadowRoot = null;
      
      // Wait for Reddit to finish its DOM updates
      setTimeout(() => {
        if (isRedditThreadPage() && getThreadIdFromUrl() === currentThreadId) {
          injectToolbar();
        }
      }, 200);
    }
    
    // Stop checking after thread changes or max attempts
    if (getThreadIdFromUrl() !== currentThreadId || reinjectionAttempts >= MAX_REINJECTION_ATTEMPTS) {
      if (monitoringInterval) clearInterval(monitoringInterval);
      monitoringInterval = null;
    }
  }, 500);
  
  console.log('👁️ Started toolbar monitoring');
}

/**
 * Clean up the injection
 */
function cleanup() {
  console.log('🧹 Cleaning up...');
  
  // Stop monitoring
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  if (toolbarObserver) {
    toolbarObserver.disconnect();
    toolbarObserver = null;
  }
  
  if (reactRoot) {
    try {
      reactRoot.unmount();
    } catch (e) {
      console.warn('Error unmounting React:', e);
    }
    reactRoot = null;
  }

  if (containerElement) {
    try {
      if (document.body.contains(containerElement)) {
        containerElement.remove();
      }
    } catch (e) {
      console.warn('Error removing container:', e);
    }
    containerElement = null;
  }

  shadowRoot = null;
  currentThreadId = null;
  reinjectionAttempts = 0;
  console.log('🧹 Cleanup complete');
}

/**
 * Handle SPA navigation (Reddit uses client-side routing)
 * Uses multiple strategies to ensure we catch all navigations
 */
function setupNavigationObserver() {
  let lastUrl = location.href;
  let lastThreadId = getThreadIdFromUrl();
  
  // Main check function - runs on any potential navigation
  const checkForNavigation = () => {
    const currentUrl = location.href;
    const currentThreadId = getThreadIdFromUrl();
    
    // URL changed
    if (currentUrl !== lastUrl) {
      console.log('🔄 URL changed:', lastUrl, '->', currentUrl);
      lastUrl = currentUrl;
      
      // If we left a thread page, cleanup
      if (!isRedditThreadPage()) {
        cleanup();
        lastThreadId = null;
        return;
      }
    }
    
    // Thread ID changed (navigated to different thread)
    if (currentThreadId && currentThreadId !== lastThreadId) {
      console.log('🔄 Thread changed:', lastThreadId, '->', currentThreadId);
      lastThreadId = currentThreadId;
      cleanup();
      
      // Try to initialize immediately, then retry
      tryInitialize();
    }
    
    // Check if we're on a thread page but not injected yet
    if (isRedditThreadPage() && !containerElement) {
      tryInitialize();
    }
  };
  
  // Try to initialize with retries
  const tryInitialize = () => {
    let attempts = 0;
    const maxAttempts = 30;
    
    const attempt = () => {
      attempts++;
      if (initialize()) {
        console.log(`✅ Initialized on attempt ${attempts}`);
        return;
      }
      
      if (attempts < maxAttempts) {
        setTimeout(attempt, 200);
      } else {
        console.error('❌ Failed to initialize after', maxAttempts, 'attempts');
      }
    };
    
    attempt();
  };

  // Strategy 1: MutationObserver on document
  const observer = new MutationObserver(() => {
    checkForNavigation();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // Strategy 2: popstate for back/forward
  window.addEventListener('popstate', () => {
    console.log('🔙 Popstate event');
    setTimeout(checkForNavigation, 50);
  });

  // Strategy 3: Override history API
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    console.log('📍 pushState');
    setTimeout(checkForNavigation, 50);
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    setTimeout(checkForNavigation, 50);
  };

  // Strategy 4: Polling as ultimate fallback (every 500ms)
  setInterval(checkForNavigation, 500);

  // Strategy 5: Watch for shreddit-post elements appearing
  const postObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          if (node.tagName === 'SHREDDIT-POST' || node.querySelector?.('shreddit-post')) {
            console.log('📌 shreddit-post element detected!');
            setTimeout(checkForNavigation, 100);
          }
        }
      }
    }
  });
  postObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('👀 Navigation observer ready (5 strategies)');
}

/**
 * Entry point
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initialize();
    setupNavigationObserver();
  });
} else {
  initialize();
  setupNavigationObserver();
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Content script received message:', message);
  
  if (message.action === 'ping') {
    sendResponse({ success: true, message: 'pong' });
    return true;
  }
  
  if (message.action === 'extractThread') {
    // Extract thread content and send back
    extractRedditThread()
      .then(threadData => {
        console.log('✅ Thread extracted successfully:', threadData);
        sendResponse({ success: true, data: threadData });
      })
      .catch(error => {
        console.error('❌ Error extracting thread:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
  
  return true;
});

console.log('✅ AI Reddit Post Analyzer content script loaded');
