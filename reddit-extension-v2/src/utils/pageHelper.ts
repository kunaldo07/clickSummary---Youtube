/**
 * Helper script to expose extraction function to background script
 * This is injected into the page context
 */

import { extractRedditThread } from '../utils/redditExtractor';

// Expose extraction function to window object
declare global {
  interface Window {
    __redditAIAnalyzer_extractThread: () => Promise<any>;
  }
}

window.__redditAIAnalyzer_extractThread = extractRedditThread;
