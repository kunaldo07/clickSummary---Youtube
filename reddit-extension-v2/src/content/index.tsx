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

/**
 * Initialize the extension on Reddit thread pages
 */
function initialize() {
  console.log('🚀 AI Reddit Post Analyzer: Initializing...');

  // Check if we're on a thread page
  if (!isRedditThreadPage()) {
    console.log('⏭️  Not a thread page, skipping injection');
    return;
  }

  console.log('✅ Thread page detected');

  // Wait for Reddit's post to be available
  const postContainer = findPostContainer();
  if (!postContainer) {
    console.log('⏳ Post container not found, waiting...');
    setTimeout(initialize, 500);
    return;
  }

  injectToolbar();
}

/**
 * Inject the toolbar into Reddit's DOM (above the post)
 */
function injectToolbar() {
  // Prevent double injection
  if (containerElement) {
    console.log('⚠️  Already injected, skipping');
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
  containerElement.style.cssText = `
    width: 100%;
    max-width: 100%;
    margin: 0 0 16px 0;
    padding: 0;
    box-sizing: border-box;
  `;

  // Insert toolbar directly BEFORE the post
  postContainer.parentElement?.insertBefore(containerElement, postContainer);

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

  // Render React app
  reactRoot = ReactDOM.createRoot(reactContainer);
  reactRoot.render(<App />);

  console.log('✅ Toolbar injected successfully above post');
}

/**
 * Clean up the injection
 */
function cleanup() {
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }

  if (containerElement) {
    containerElement.remove();
    containerElement = null;
  }

  shadowRoot = null;
  console.log('🧹 Cleaned up');
}

/**
 * Handle SPA navigation (Reddit uses client-side routing)
 */
function setupNavigationObserver() {
  let lastUrl = location.href;

  // Watch for URL changes
  const observer = new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      console.log('🔄 Navigation detected:', currentUrl);

      // Clean up old injection
      cleanup();

      // Re-initialize on thread pages
      setTimeout(initialize, 1000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('👀 Navigation observer set up');
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
