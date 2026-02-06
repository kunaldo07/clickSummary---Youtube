// YouTube Video Summarizer Content Script

class YouTubeSummarizer {
  constructor() {
    this.currentVideoId = null;
    this.summaryContainer = null;
    this.isProcessing = false;
    this.currentSummaryType = 'insightful'; // insightful, conversational, funny, actionable
    this.currentFormat = 'list'; // list, qa
    this.currentLength = 'short'; // short, detailed
    this.transcriptData = null;
    this.commentsData = null;
    this.showingTranscript = false;
    this.showingChat = false;
    this.chatHistory = [];
    this.currentUser = null;
    this.isAuthenticated = false;
    this.transcriptSearchTerm = '';
    this.autoScrollEnabled = true;
    this.transcriptSyncInterval = null;
    this.containerMonitoringInterval = null;
    this.reinjectionAttempts = 0;
    this.maxReinjectionAttempts = 10;
    this.init();
  }

  init() {
    // Wait for YouTube to load and then start monitoring
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startMonitoring());
    } else {
      this.startMonitoring();
    }
  }

  startMonitoring() {
    console.log('👁️ Starting YouTube navigation monitoring...');
    
    // Strategy 0: YouTube's native navigation event (most reliable for SPA)
    window.addEventListener('yt-navigate-finish', () => {
      console.log('🔍 yt-navigate-finish event detected');
      this.onPageChange();
    });
    
    // Also listen for yt-page-data-updated as backup
    window.addEventListener('yt-page-data-updated', () => {
      console.log('🔍 yt-page-data-updated event detected');
      setTimeout(() => this.onPageChange(), 500);
    });
    
    // Strategy 1: MutationObserver for DOM changes
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        console.log('🔍 MutationObserver detected URL change');
        lastUrl = url;
        this.onPageChange();
      }
    });
    observer.observe(document, { subtree: true, childList: true });

    // Strategy 2: Listen to popstate event (browser back/forward)
    window.addEventListener('popstate', () => {
      console.log('🔍 popstate event detected');
      this.onPageChange();
    });

    // Strategy 3: Override history.pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      console.log('🔍 history.pushState detected');
      window.dispatchEvent(new Event('pushstate'));
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      console.log('🔍 history.replaceState detected');
      window.dispatchEvent(new Event('replacestate'));
    };
    
    window.addEventListener('pushstate', () => this.onPageChange());
    window.addEventListener('replacestate', () => this.onPageChange());

    // Strategy 4: Polling as fallback (check every 1 second)
    setInterval(() => {
      const currentUrl = location.href;
      const currentVideoId = this.getVideoId();
      
      if (currentVideoId && currentVideoId !== this.currentVideoId) {
        console.log('🔍 Polling detected video change');
        this.onPageChange();
      }
    }, 1000);

    // Handle initial page load
    this.onPageChange();
    
    console.log('✅ Navigation monitoring started with multiple strategies');
  }

  onPageChange() {
    try {
      const videoId = this.getVideoId();
      if (videoId && videoId !== this.currentVideoId) {
        console.log(`🔄 Video changed from ${this.currentVideoId} to ${videoId}`);
        console.log(`💬 Clearing chat history (${this.chatHistory.length} messages) for new video`);
        
        // Clear cache for previous video if it exists
        if (this.currentVideoId) {
          this.clearVideoCache(this.currentVideoId);
        }
        
        this.currentVideoId = videoId;
        this.removePreviousSummary(); // This clears chat history
        setTimeout(() => this.procesVideo(), 2000); // Wait for YouTube to load
      }
    } catch (error) {
      console.error('⚠️ Error in onPageChange:', error.message);
      // Don't let errors break navigation detection
    }
  }

  getVideoId() {
    const url = new URL(window.location.href);
    return url.searchParams.get('v');
  }

  async procesVideo() {
    console.log('🎬 procesVideo called for video:', this.currentVideoId);
    
    if (this.isProcessing) {
      console.log('⚠️ Already processing, skipping...');
      return;
    }
    
    this.isProcessing = true;
    console.log('✅ Starting video processing...');

    try {
      console.log('📦 Creating summary container...');
      this.createSummaryContainer();

      // Extract both transcript and comments in parallel
      const [transcriptData, commentsData] = await Promise.all([
        this.extractTranscript(),
        this.extractTopComments()
      ]);

      this.transcriptData = transcriptData;
      this.commentsData = commentsData;

      if (transcriptData || commentsData) {
        // Initialize empty summaries object
        this.summaries = {};
        
        // Show "Summarize video" button instead of auto-generating
        this.showSummarizeButton();

        // Auto-summarize if enabled in settings (default: true)
        try {
          chrome.storage?.local?.get(['auto_summarize'], (result) => {
            const shouldAuto = result && result.auto_summarize !== false; // default true
            if (shouldAuto) {
              // Delay a bit to ensure UI is ready
              setTimeout(() => this.startSummarization(), 250);
            }
          });
        } catch (e) {
          // Ignore storage errors; user can click the button
        }
      } else {
        this.displayError('Neither transcript nor comments are available for this video');
      }
    } catch (error) {
      console.error('Error processing video:', error);
      this.displayError('Failed to process video: ' + error.message);
    }

    this.isProcessing = false;
  }

  showSummarizeButton() {
    if (!this.summaryContainer) return;
    
    const summaryContent = this.summaryContainer.querySelector('#summary-content');
    summaryContent.innerHTML = `
      <div class="summarize-prompt">
        <div class="summarize-prompt-content">
          <div class="summarize-icon">✨</div>
          <h3 class="summarize-title">Ready to analyze this video</h3>
          <p class="summarize-description">Get AI-powered insights, key points, and answers about this video's content.</p>
          <button id="start-summarize-btn" class="start-summarize-btn">
            <span class="btn-icon">✨</span>
            Summarize Video
          </button>
        </div>
      </div>
    `;

    // Add event listener for the summarize button
    const startBtn = summaryContent.querySelector('#start-summarize-btn');
    startBtn.addEventListener('click', () => {
      this.startSummarization();
    });
  }

  async startSummarization() {
    if (this.isProcessing) return;
    
    try {
      this.isProcessing = true;
      
      // Check authentication first
      const isAuth = await this.checkAuthentication();
      if (!isAuth) {
        this.showSignInPrompt();
        this.isProcessing = false;
        return;
      }
      
      // Show the dropdown controls
      const dropdownControls = this.summaryContainer.querySelector('#dropdown-controls');
      if (dropdownControls) {
        dropdownControls.style.display = 'grid';
      }

      // Reset state
      this.showingTranscript = false;
      this.showingChat = false;
      
      // Activate summary tab
      const summaryBtn = this.summaryContainer.querySelector('.icon-btn[data-tab="summary"]');
      if (summaryBtn) {
        summaryBtn.classList.add('active');
      }
      
      // Show loading state
      this.showLoadingState();
      
      // Generate summary
      await this.generateCurrentSummary();
      
    } catch (error) {
      console.error('Error starting summarization:', error);
      this.displayError(this.formatUserFriendlyError(error.message, 'summary'));
    } finally {
      this.isProcessing = false;
    }
  }

  async extractTranscript() {
    return new Promise((resolve) => {
      console.log('🔍 YouTube Summarizer: Looking for transcript...');
      
      // First, check if transcript is already visible
      let transcriptData = this.getTranscriptSegments();
      if (transcriptData) {
        console.log('✅ Found existing transcript data');
        resolve(transcriptData);
        return;
      }

      // Try to find and click transcript button
      const transcriptButton = this.findTranscriptButton();
      
      if (!transcriptButton) {
        console.log('❌ No transcript button found');
        resolve(null);
        return;
      }

      console.log('🎯 Found transcript button, clicking...');
      transcriptButton.click();
      
      // Wait for transcript to load with multiple attempts
      let attempts = 0;
      const maxAttempts = 5;
      
      const checkForTranscript = () => {
        attempts++;
        const transcriptSegments = this.getTranscriptSegments();
        
        if (transcriptSegments) {
          console.log('✅ Transcript extracted successfully');
          resolve(transcriptSegments);
        } else if (attempts < maxAttempts) {
          console.log(`⏳ Attempt ${attempts}/${maxAttempts} - waiting for transcript...`);
          setTimeout(checkForTranscript, 1000);
        } else {
          console.log('❌ Failed to extract transcript after multiple attempts');
          resolve(null);
        }
      };
      
      setTimeout(checkForTranscript, 1500);
    });
  }

  findTranscriptButton() {
    console.log('🔍 Looking for transcript button...');
    
    // Method 1: Look for transcript button by text content
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      const text = button.textContent.toLowerCase();
      if (text.includes('transcript') || text.includes('show transcript')) {
        console.log('📝 Found transcript button by text');
        return button;
      }
    }

    // Method 2: Look for transcript button by aria-label
    const transcriptByLabel = document.querySelector('button[aria-label*="transcript" i], button[aria-label*="Show transcript" i]');
    if (transcriptByLabel) {
      console.log('📝 Found transcript button by aria-label');
      return transcriptByLabel;
    }

    // Method 3: Look in the description area specifically
    const description = document.querySelector('#description, #meta-contents, ytd-video-secondary-info-renderer');
    if (description) {
      const descButtons = description.querySelectorAll('button');
      for (const button of descButtons) {
        const text = button.textContent.toLowerCase();
        const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
        if (text.includes('transcript') || ariaLabel.includes('transcript')) {
          console.log('📝 Found transcript button in description area');
          return button;
        }
      }
    }

    // Method 4: Look for three-dot menu and expand it
    const moreButton = document.querySelector('#expand, button[aria-label*="more" i]');
    if (moreButton && !moreButton.getAttribute('aria-expanded')) {
      console.log('📋 Expanding description to look for transcript');
      moreButton.click();
      
      // Wait a bit then search again
      setTimeout(() => {
        const expandedTranscript = document.querySelector('button[aria-label*="transcript" i]');
        if (expandedTranscript) {
          console.log('📝 Found transcript after expanding description');
          return expandedTranscript;
        }
      }, 500);
    }

    console.log('❌ No transcript button found');
    return null;
  }

  getTranscriptSegments() {
    console.log('📝 Attempting to extract transcript segments...');
    
    // Method 1: Look for individual transcript segments (proper format)
    const segmentElements = document.querySelectorAll('ytd-transcript-segment-renderer');
    if (segmentElements.length > 0) {
      console.log(`✅ Found ${segmentElements.length} structured transcript segments`);
      const segments = Array.from(segmentElements).map((segmentEl, index) => {
        const timeButton = segmentEl.querySelector('div[class*="cue"] .ytd-transcript-segment-renderer');
        const textEl = segmentEl.querySelector('.segment-text, [class*="segment-text"]');
        
        // Try to extract timestamp
        let timeStr = timeButton?.textContent?.trim() || `${index * 10}s`;
        let startTime = this.parseTimeToSeconds(timeStr);
        
        // Get text content
        let text = textEl?.textContent?.trim() || segmentEl.textContent.trim();
        
        return {
          start: startTime,
          text: text,
          index: index
        };
      }).filter(segment => segment.text.length > 0);
      
      if (segments.length > 0) return segments;
    }

    // Method 2: Look for transcript segments with data-seq attribute  
    const dataSeqElements = document.querySelectorAll('[data-seq]');
    if (dataSeqElements.length > 0) {
      console.log(`✅ Found ${dataSeqElements.length} transcript segments with data-seq`);
      const segments = Array.from(dataSeqElements).map((segment, index) => {
        const text = segment.textContent.trim();
        const startTime = index * 5; // Estimate 5 seconds per segment
        
        return {
          start: startTime,
          text: text,
          index: index
        };
      }).filter(segment => segment.text.length > 0);
      
      if (segments.length > 0) return segments;
    }

    // Method 3: Look for transcript container and try to extract segments
    const transcriptContainer = document.querySelector('ytd-transcript-segment-list-renderer, ytd-transcript-renderer');
    if (transcriptContainer) {
      console.log('📋 Found transcript container, looking for segments...');
      
      // Try to find individual segment elements
      const segmentSelectors = [
        'ytd-transcript-segment-renderer',
        '.ytd-transcript-segment-renderer',
        '[class*="segment"]',
        '.segment-text'
      ];
      
      for (const selector of segmentSelectors) {
        const elements = transcriptContainer.querySelectorAll(selector);
        if (elements.length > 3) { // Need multiple segments
          console.log(`✅ Found segments using selector: ${selector}`);
          const segments = Array.from(elements).map((el, index) => {
            const text = el.textContent.trim();
            const startTime = index * 10; // Estimate timing
            
            return {
              start: startTime,
              text: text,
              index: index
            };
          }).filter(segment => segment.text.length > 5);
          
          if (segments.length > 0) return segments;
        }
      }
      
      // Fallback: split the full transcript text into chunks
      const fullText = transcriptContainer.textContent.trim();
      if (fullText.length > 50) {
        console.log('📄 Using full transcript text, splitting into segments');
        const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const segments = sentences.map((sentence, index) => ({
          start: index * 8, // Estimate 8 seconds per sentence
          text: sentence.trim(),
          index: index
        }));
        
        if (segments.length > 0) return segments;
      }
    }

    // Method 4: Fallback - look for any transcript content and split it
    const allTranscriptElements = document.querySelectorAll('[class*="transcript"], [id*="transcript"]');
    for (const element of allTranscriptElements) {
      const text = element.textContent.trim();
      if (text.length > 100 && !text.includes('Transcript') && !text.includes('Show transcript')) {
        console.log('✅ Found transcript text, converting to segments');
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const segments = sentences.slice(0, 50).map((sentence, index) => ({ // Limit to 50 segments
          start: index * 8,
          text: sentence.trim(),
          index: index
        }));
        
        if (segments.length > 0) return segments;
      }
    }

    console.log('❌ No transcript segments found');
    return null;
  }

  parseTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    
    // Handle formats like "1:23" or "01:23:45" or "1m 23s" 
    timeStr = timeStr.replace(/[^\d:]/g, ''); // Remove non-digits and colons
    
    const parts = timeStr.split(':').map(Number);
    let seconds = 0;
    
    if (parts.length === 1) {
      seconds = parts[0];
    } else if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    
    return seconds;
  }

  async extractTopComments() {
    console.log('💬 Extracting top comments...');
    
    try {
      // Wait for comments to load
      await this.waitForComments();
      
      const comments = document.querySelectorAll('#content-text');
      const topComments = Array.from(comments)
        .slice(0, 10) // Get top 10 comments
        .map(comment => ({
          text: comment.textContent.trim(),
          author: this.getCommentAuthor(comment),
          likes: this.getCommentLikes(comment)
        }))
        .filter(comment => comment.text.length > 10); // Filter out short comments
      
      console.log(`✅ Extracted ${topComments.length} comments`);
      return topComments.length > 0 ? topComments : null;
    } catch (error) {
      console.log('❌ Failed to extract comments:', error);
      return null;
    }
  }

  async waitForComments() {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkComments = () => {
        const comments = document.querySelectorAll('#content-text');
        if (comments.length > 0) {
          resolve();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkComments, 1000);
        } else {
          resolve(); // Continue even if no comments found
        }
      };
      
      checkComments();
    });
  }

  getCommentAuthor(commentElement) {
    try {
      const authorElement = commentElement.closest('ytd-comment-thread-renderer, ytd-comment-renderer')
        ?.querySelector('#author-text');
      return authorElement ? authorElement.textContent.trim() : 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  getCommentLikes(commentElement) {
    try {
      const likesElement = commentElement.closest('ytd-comment-thread-renderer, ytd-comment-renderer')
        ?.querySelector('#vote-count-middle');
      const likesText = likesElement ? likesElement.textContent.trim() : '0';
      return likesText === '' ? 0 : parseInt(likesText) || 0;
    } catch {
      return 0;
    }
  }

  async generateCurrentSummary() {
    console.log(`🤖 Generating ${this.currentSummaryType} ${this.currentLength} summary...`);
    
    // Initialize the nested structure if it doesn't exist
    if (!this.summaries[this.currentSummaryType]) {
      this.summaries[this.currentSummaryType] = {};
    }
    
    // Check if we already have this summary
    const existingSummary = this.summaries[this.currentSummaryType][this.currentLength];
    if (existingSummary) {
      console.log('📋 Summary already exists, using cached version');
      this.updateSummaryDisplay();
      return;
    }
    
    // Show loading state for current summary
    this.showSummaryLoading();
    
    try {
      console.log('🚀 CALLING getSummaryByType - Promise should execute now!');
      const summary = await this.getSummaryByType(this.currentSummaryType, this.currentLength);
      this.summaries[this.currentSummaryType][this.currentLength] = summary;
      console.log(`✅ Generated ${this.currentSummaryType} ${this.currentLength} summary`);
      this.updateSummaryDisplay();
        } catch (error) {
      console.error(`Failed to generate ${this.currentSummaryType} ${this.currentLength} summary:`, error);
      this.summaries[this.currentSummaryType][this.currentLength] = this.formatUserFriendlyError(error.message, 'summary');
      this.updateSummaryDisplay();
    }
  }
  
  showSummaryLoading() {
    const summaryContent = this.summaryContainer.querySelector('#summary-content');
    if (summaryContent) {
      summaryContent.innerHTML = `
        <div class="loading-summary">
          <div class="loading-spinner"></div>
          <span>Generating ${this.currentSummaryType} ${this.currentLength} summary...</span>
        </div>
      `;
    }
  }

  // Helper function to clear all cached summaries
  clearSummaryCache() {
    console.log('🧹 Clearing all cached summaries...');
    this.summaries = {};
    console.log('✅ Summary cache cleared');
  }


  // Debug function to check cache status
  debugCacheStatus() {
    console.log('📊 CACHE DEBUG INFO:');
    console.log('  - Current type:', this.currentSummaryType);
    console.log('  - Current length:', this.currentLength);
    console.log('  - Cache object:', this.summaries);
    
    const hasCached = this.summaries[this.currentSummaryType]?.[this.currentLength];
    console.log('  - Has cached summary:', !!hasCached);
    
    if (hasCached) {
      console.log('  - Cached summary preview:', hasCached.substring(0, 100) + '...');
      console.log('');
      console.log('💡 SOLUTIONS:');
      console.log('  1. Clear cache: window.youtubeSummarizer.clearSummaryCache()');
      console.log('  2. Refresh page to regenerate summary');
    } else {
      console.log('  ✅ No cached summary found - should generate new one');
    }
  }

  async getSummaryByType(type, length) {
    // Convert transcript to string if it's an array
    let transcriptData = this.transcriptData;
    if (Array.isArray(this.transcriptData)) {
      transcriptData = this.transcriptData.map(segment => {
        if (typeof segment === 'string') return segment;
        if (segment && segment.text) return segment.text;
        return String(segment);
      }).join(' ');
    } else if (this.transcriptData && typeof this.transcriptData !== 'string') {
      transcriptData = String(this.transcriptData);
    }
    
    const data = {
      transcript: transcriptData,
      comments: this.commentsData,
      type: type,
      length: length,
      format: this.currentFormat,
      videoId: this.currentVideoId
    };

    console.log('🚀 CALLING getSummaryByType - Promise should execute now!');
    console.log('📊 Message data:', { action: 'summarizeAdvanced', data: data });

    return new Promise((resolve, reject) => {
      console.log('📤 CONTENT SCRIPT: Sending message to background script');
      console.log('📊 Message data:', { action: 'summarizeAdvanced', data: data });
      
      // Add timeout for message response
      const timeout = setTimeout(() => {
        console.log('⏰ CONTENT SCRIPT: Message timed out after 35 seconds');
        reject(new Error('Backend request timed out. Please check your connection and try again.'));
      }, 35000);
      
      chrome.runtime.sendMessage({
        action: 'summarizeAdvanced',
        data: data
      }, (response) => {
        clearTimeout(timeout);
        
        // Check for Chrome runtime errors
        if (chrome.runtime.lastError) {
          console.log('❌ CONTENT SCRIPT: Chrome runtime error:', chrome.runtime.lastError);
          reject(new Error('Extension error: ' + chrome.runtime.lastError.message));
          return;
        }
        
        console.log('📥 CONTENT SCRIPT: Received response from background script');
        console.log('📊 Response:', response);
        
        if (response && response.error) {
          console.log('❌ CONTENT SCRIPT: Background script returned error:', response.error);
          reject(new Error(response.error));
        } else if (response && response.summary) {
          console.log('✅ CONTENT SCRIPT: Successfully received summary');
          resolve(response.summary);
        } else {
          console.log('❌ CONTENT SCRIPT: Invalid response format:', response);
          reject(new Error('Invalid response from background script'));
        }
      });
    });
  }

  formatAsQA(summary) {
    // Parse summary and format as Q&A
    const qaItems = this.extractQAFromSummary(summary);
    
    return `
      <div class="qa-format">
        ${qaItems.map((qa, index) => `
          <div class="qa-item">
            <div class="question">
              <span class="q-icon">Q</span>
              <span class="question-text">${qa.question}</span>
            </div>
            <div class="answer">
              <span class="a-icon">A</span>
              <div class="answer-content">
                ${qa.answer}
                ${qa.timestamps ? qa.timestamps.map(ts => 
                  `<span class="timestamp-highlight" data-time="${ts.time}">${ts.time} ${ts.text}</span>`
                ).join('') : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  formatAsTimestampedList(summary) {
    // Format as sections with individual subheading-description pairs
    const sections = this.extractEngagingSections(summary);
    console.log('🎨 Formatting sections:', sections.length);
    
    const totalPoints = sections.reduce((sum, section) => sum + section.points.length, 0);
    console.log('📝 Total points to display:', totalPoints);
    
    // Cap total points based on current length for better readability
    const maxPoints = this.currentLength === 'detailed' ? 12 : 6;
    let collected = 0;
    const limitedSections = [];
    for (const section of sections) {
      if (collected >= maxPoints) break;
      const remaining = maxPoints - collected;
      const prunedPoints = section.points
        // Prefer meaningful points; deprioritize ultra-short items if we have more content
        .filter(p => typeof p.text === 'string' && p.text.trim().length > 0)
        .slice(0, remaining);
      if (prunedPoints.length > 0) {
        limitedSections.push({ headline: section.headline, points: prunedPoints });
        collected += prunedPoints.length;
      }
    }
    const finalSections = limitedSections.length > 0 ? limitedSections : sections;

    if (totalPoints === 0) {
      // Fallback: split summary into sentences if no structured content found
      const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 20);
      console.log('📝 Fallback: Creating items from sentences:', sentences.length);
      
      if (sentences.length === 0) {
        // Last resort: show full summary as single item
    return `
      <div class="engaging-list">
            <div class="summary-item">
              <div class="item-full-text">📋 Full Summary: ${summary}</div>
                </div>
            </div>
        `;
      }
      
      return `
        <div class="engaging-list">
          ${sentences.map((sentence, index) => {
            return `
              <div class="summary-item">
                <div class="item-full-text">${sentence.trim()}</div>
          </div>
            `;
          }).join('')}
      </div>
    `;
    }
    
    // Display sections with headers and points
    return `
      <div class="engaging-list">
        ${finalSections.map(section => {
          // Check if this section has a meaningful header (not just "Section 1", etc.)
          const hasRealHeader = section.headline && 
                               !section.headline.startsWith('Section ') && 
                               section.headline !== '📋 Summary Points';

          return `
            ${hasRealHeader ? `
              <div class="section-header">
                <h1 class="section-title">${section.headline}</h1>
              </div>
            ` : ''}
            ${section.points.map(point => {
              // Display the full text as a single flowing block
              return `
                <div class="summary-item">
                  <div class="item-full-text">${point.text}</div>
                </div>
              `;
            }).join('')}
          `;
        }).join('')}
      </div>
    `;
  }

  extractSubheadingAndDescription(text) {
    // Split point text into subheading and description
    // Look for patterns like "Topic: Description" or "Emoji Topic - Description"
    
    // Pattern 1: "🎯 Topic: Description"
    let match = text.match(/^([🎯🚀🧠💡🎤🌟🔥⚡📈🌐💰🤖🎨🎭🎪📚🎬🎵⚖️🔮🛠️📊]\s*[^:]+):\s*(.+)$/);
    if (match) {
      return {
        subheading: match[1].trim(),
        description: match[2].trim()
      };
    }
    
    // Pattern 2: "🎯 Topic - Description"
    match = text.match(/^([🎯🚀🧠💡🎤🌟🔥⚡📈🌐💰🤖🎨🎭🎪📚🎬🎵⚖️🔮🛠️📊]\s*[^-]+)\s*-\s*(.+)$/);
    if (match) {
      return {
        subheading: match[1].trim(),
        description: match[2].trim()
      };
    }
    
    // Pattern 3: "Topic: Description" (without emoji)
    match = text.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      return {
        subheading: match[1].trim(),
        description: match[2].trim()
      };
    }
    
    // Pattern 4: "Topic - Description" (without emoji)
    match = text.match(/^([^-]+)\s*-\s*(.+)$/);
    if (match) {
      return {
        subheading: match[1].trim(),
        description: match[2].trim()
      };
    }
    
    // Fallback: Split by first sentence or take first few words as subheading
    const sentences = text.split(/[.!?]/);
    if (sentences.length > 1 && sentences[0].length < 50) {
      return {
        subheading: sentences[0].trim(),
        description: sentences.slice(1).join('.').trim()
      };
    }
    
    // Last resort: Take first few words as subheading
    const words = text.split(' ');
    if (words.length > 6) {
      return {
        subheading: words.slice(0, 4).join(' '),
        description: words.slice(4).join(' ')
      };
    }
    
    // If text is short, use as subheading with empty description
    return {
      subheading: text,
      description: ''
    };
  }

  extractQAFromSummary(summary) {
    // Simple Q&A extraction - in production this would be more sophisticated
    const lines = summary.split('\n').filter(line => line.trim());
    const qaItems = [];
    
    // Generate relevant questions based on summary type
    const questions = this.generateQuestionsForType(this.currentSummaryType);
    
    // Split summary into chunks for answers
    const chunks = this.splitSummaryIntoChunks(lines, questions.length);
    
    questions.forEach((question, index) => {
      const answer = chunks[index] || lines[index] || 'No specific information available.';
      const timestamps = this.extractTimestampsFromText(answer);
      
      qaItems.push({
        question,
        answer: answer.replace(/\d{1,2}:\d{2}/g, ''), // Remove timestamps from answer text
        timestamps: timestamps
      });
    });
    
    return qaItems;
  }

  extractEngagingSections(summary) {
    // Extract sections and individual emoji points from the summary
    console.log('🔍 Parsing summary with length:', summary.length);
    console.log('🔍 Summary preview:', summary.substring(0, 300));
    
    // Step 1: Split by section headers (lines with just emoji + title, no description)
    const sectionHeaderRegex = /(?=^[🎤🌐💡🔥⚡📊🎯🚀🧠🌟🤖🎨🎭🎪📚🎬🎵⚖️🔮🛠️📈💰]\s+[A-Z][^🎯🚀🧠💡🎤🌟🔥⚡📈🌐💰🤖🎨🎭🎪📚🎬🎵⚖️🔮🛠️📊]*$)/m;
    let rawSections = summary.split(sectionHeaderRegex).filter(s => s.trim().length > 5);
    
    console.log('🔍 Raw sections found:', rawSections.length);
    
    // If no clear sections, try splitting by any emoji at start of line
    if (rawSections.length <= 1) {
      const emojiLineRegex = /(?=^[🎯🚀🧠💡🎤🌟🔥⚡📈🌐💰🤖🎨🎭🎪📚🎬🎵⚖️🔮🛠️📊])/m;
      rawSections = summary.split(emojiLineRegex).filter(s => s.trim().length > 10);
      console.log('🔍 Fallback emoji split found:', rawSections.length);
    }
    
    const sections = [];
    
    for (let i = 0; i < rawSections.length; i++) {
      const sectionText = rawSections[i].trim();
      if (!sectionText) continue;
      
      console.log(`🔍 Processing section ${i}:`, sectionText.substring(0, 100));
      
      const lines = sectionText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      if (lines.length === 0) continue;
      
      // Check if first line is a section header (emoji + title only, no long description)
      const firstLine = lines[0];
      const isHeader = /^[🎤🌐💡🔥⚡📊🎯🚀🧠🌟🤖🎨🎭🎪📚🎬🎵⚖️🔮🛠️📈💰]\s+[A-Z][^🎯🚀🧠💡🎤🌟🔥⚡📈🌐💰🤖🎨🎭🎪📚🎬🎵⚖️🔮🛠️📊]*$/.test(firstLine) && firstLine.length < 50;
      
      if (isHeader && lines.length > 1) {
        // This is a section with header + points
        const sectionHeader = firstLine;
        const points = [];
        
        // Process remaining lines as emoji points
        for (let j = 1; j < lines.length; j++) {
          const line = lines[j];
          if (/^[🎯🚀🧠💡🎤🌟🔥⚡📈🌐💰🤖🎨🎭🎪📚🎬🎵⚖️🔮🛠️📊]/.test(line) || /^•\s+/.test(line)) {
            points.push({ text: line });
          } else if (points.length > 0) {
            // Continue previous point if it's a continuation line
            points[points.length - 1].text += ' ' + line;
          }
        }
        
        if (points.length > 0) {
          sections.push({
            headline: sectionHeader,
            points: points
          });
        }
      } else {
        // No clear header, treat each emoji line as individual point
        const points = [];
        
        for (const line of lines) {
          if (/^[🎯🚀🧠💡🎤🌟🔥⚡📈🌐💰🤖🎨🎭🎪📚🎬🎵⚖️🔮🛠️📊]/.test(line) || /^•\s+/.test(line)) {
            points.push({ text: line });
          } else if (points.length > 0) {
            // Continue previous point
            points[points.length - 1].text += ' ' + line;
          }
        }
        
        if (points.length > 0) {
          sections.push({
            headline: `Section ${sections.length + 1}`,
            points: points
          });
        }
      }
    }
    
    // Fallback: if no structured content found, split by sentences
    if (sections.length === 0 || sections.every(s => s.points.length === 0)) {
      console.log('📝 No structured sections found, falling back to sentences');
      const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 20);
      
      if (sentences.length === 0) {
        return [{ headline: '📋 Complete Summary', points: [{ text: summary }] }];
      }
      
      const points = sentences.map(sentence => ({ text: sentence.trim() }));
      return [{ headline: '📋 Summary Points', points: points }];
    }
    
    console.log('✅ Final sections:', sections.length);
    console.log('✅ Total points:', sections.reduce((sum, section) => sum + section.points.length, 0));
    
    return sections;
  }
  
  extractEngagingSectionsOld(summary) {
    // Old method - kept for reference
    const lines = summary.split('\n').filter(line => line.trim());
    const sections = [];
    let currentSection = null;
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Check if it's a section headline (starts with emoji followed by space and title)
      if (trimmedLine.match(/^[🎤🌐💡🚀🔥⚡️📈🎯🧠💰🤖🌟⚖️🔮🛠️]\s+[A-Z]/)) {
        // New section headline
        if (currentSection) sections.push(currentSection);
        currentSection = {
          headline: trimmedLine,
          points: []
        };
      } else if (currentSection && trimmedLine.match(/^[🚀💰🧠🤖🌐🔥⚡️📈🎯💡🎤🌟⚖️🔮🛠️]/)) {
        // This is an insight point starting with emoji
        currentSection.points.push({
          text: trimmedLine
        });
      } else if (!currentSection && trimmedLine.match(/^[🚀💰🧠🤖🌐🔥⚡️📈🎯💡🎤🌟⚖️🔮🛠️]/)) {
        // Handle case where there are insights without section headers
        if (!currentSection) {
          currentSection = {
            headline: this.getHeadlineForType(this.currentSummaryType),
            points: []
          };
        }
        currentSection.points.push({
          text: trimmedLine
        });
      }
    });
    
    if (currentSection) sections.push(currentSection);
    
    // If no sections found, create default structure
    if (sections.length === 0) {
      sections.push({
        headline: this.getHeadlineForType(this.currentSummaryType),
        points: lines.filter(line => line.trim().length > 0 && line.match(/^[🚀💰🧠🤖🌐🔥⚡️📈🎯💡🎤🌟⚖️🔮🛠️]/)).map(line => ({
          text: line.trim()
        }))
      });
    }
    
    return sections;
  }

  generateQuestionsForType(type) {
    const questionSets = {
      insightful: [
        "What are the key insights from this video?",
        "What are the main learning points?",
        "What deeper understanding can we gain?",
        "What are the implications discussed?"
      ],
      funny: [
        "What are the funniest moments in the video?",
        "What jokes or humorous observations are made?",
        "What entertaining elements stand out?",
        "What lighthearted content is included?"
      ],
      actionable: [
        "What specific actions can viewers take?",
        "What practical steps are recommended?",
        "What tools or methods are suggested?",
        "How can viewers implement these ideas?"
      ],
      conversational: [
        "What's this video about in simple terms?",
        "Can you explain the main points casually?",
        "What would you tell a friend about this?",
        "What's the overall vibe of this video?"
      ]
    };
    
    return questionSets[type] || questionSets.insightful;
  }

  getHeadlineForType(type) {
    const headlines = {
      insightful: 'Key Insights & Learnings',
      conversational: 'Casual Breakdown',
      funny: 'Humorous Highlights',
      actionable: 'Action Items & Takeaways'
    };
    
    return headlines[type] || 'Summary Points';
  }

  extractTimestampsFromText(text) {
    const timestampRegex = /(\d{1,2}:\d{2})/g;
    const matches = text.match(timestampRegex) || [];
    
    return matches.map(time => ({
      time: time,
      text: `Jump to ${time}`
    }));
  }

  splitSummaryIntoChunks(lines, numChunks) {
    const chunkSize = Math.ceil(lines.length / numChunks);
    const chunks = [];
    
    for (let i = 0; i < lines.length; i += chunkSize) {
      chunks.push(lines.slice(i, i + chunkSize).join(' '));
    }
    
    return chunks;
  }

  async getTimestampedSummary() {
    const data = {
      transcript: this.transcriptData,
      videoId: this.currentVideoId,
      type: 'timestamped'
    };

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'summarizeTimestamped',
        data: data
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error('Extension was reloaded. Please refresh the page and try again.'));
          return;
        }
        if (!response) {
          reject(new Error('No response from extension. Please refresh the page.'));
          return;
        }
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.summary);
        }
      });
    });
  }

  async getSummary(transcript) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'summarize',
        transcript: transcript,
        videoId: this.currentVideoId
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error('Extension was reloaded. Please refresh the page and try again.'));
          return;
        }
        if (!response) {
          reject(new Error('No response from extension. Please refresh the page.'));
          return;
        }
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.summary);
        }
      });
    });
  }

  createSummaryContainer() {
    console.log('📦 createSummaryContainer called');
    
    if (this.summaryContainer) {
      console.log('⚠️ Container already exists, skipping creation');
      return;
    }

    // Find the video secondary info (below video)
    const secondaryInfo = document.querySelector('#secondary-inner') || 
                         document.querySelector('#secondary') ||
                         document.querySelector('#columns #secondary');
    
    if (!secondaryInfo) {
      console.log('❌ Could not find secondary info container, retrying in 500ms...');
      // Retry up to 10 times (5 seconds total) for YouTube to load the video page layout
      if (!this.containerRetryCount) this.containerRetryCount = 0;
      this.containerRetryCount++;
      if (this.containerRetryCount < 10) {
        setTimeout(() => this.createSummaryContainer(), 500);
      } else {
        console.error('❌ Failed to find secondary container after 10 attempts');
        this.containerRetryCount = 0;
      }
      return;
    }
    this.containerRetryCount = 0;
    
    console.log('✅ Found secondary info container, creating summary container...');

    this.summaryContainer = document.createElement('div');
    this.summaryContainer.id = 'youtube-summarizer-container';
    this.summaryContainer.innerHTML = `
      <div class="summarizer-card">
        <div class="summarizer-header">
          <div class="header-top">
            <div class="header-icons">
              <button class="icon-btn" data-tab="summary" title="Summary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </button>
              <button class="icon-btn" data-tab="transcript" title="Transcript">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <line x1="12" y1="9" x2="8" y2="9"></line>
                </svg>
              </button>
              <button class="icon-btn" data-tab="chat" title="Chat">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
              <button class="icon-btn" data-tab="copy" title="Copy">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <div class="export-dropdown-wrapper">
                <button class="icon-btn" id="export-toggle-btn" title="Export">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </button>
                <div class="export-dropdown-menu" id="export-dropdown-menu" style="display: none;">
                  <button class="export-menu-item" data-action="copy-link">
                    <svg class="export-menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    <span>Copy Link</span>
                  </button>
                  <button class="export-menu-item" data-action="copy-text">
                    <svg class="export-menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>Copy Text</span>
                  </button>
                  <button class="export-menu-item" data-action="export-txt">
                    <svg class="export-menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <span>Export TXT</span>
                  </button>
                  <button class="export-menu-item" data-action="export-doc">
                    <svg class="export-menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="12" y1="18" x2="12" y2="12"></line>
                      <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    <span>Export DOC</span>
                  </button>
                  <button class="export-menu-item" data-action="export-pdf">
                    <svg class="export-menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <path d="M9 15h6"></path>
                      <path d="M12 18v-6"></path>
                    </svg>
                    <span>Export PDF</span>
                  </button>
                  <button class="export-menu-item" data-action="export-markdown">
                    <svg class="export-menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <path d="M10 12h4"></path>
                      <path d="M10 16h4"></path>
                    </svg>
                    <span>Export MD</span>
                  </button>
                </div>
              </div>
            </div>
            <div class="user-avatar-placeholder"></div>
          </div>
          
          <!-- Dropdown Controls (hidden by default) -->
          <div class="dropdown-controls" id="dropdown-controls" style="display: none;">
            <select id="summary-type-select" class="summary-dropdown">
              <option value="insightful">Insightful</option>
              <option value="conversational">Conversational</option>
              <option value="funny">Funny</option>
              <option value="actionable">Actionable</option>
            </select>
            
            <select id="format-select" class="summary-dropdown">
              <option value="list">List</option>
              <option value="qa">Q&A</option>
            </select>
            
            <select id="length-select" class="summary-dropdown">
              <option value="short">Short</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>
        </div>

        <div class="summarizer-body">
          <div id="summary-content">
            <div class="loading-summary">
              <div class="loading-spinner"></div>
              <span>Generating AI summary...</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Insert at the top of secondary content
    secondaryInfo.insertBefore(this.summaryContainer, secondaryInfo.firstChild);

    this.attachEventListeners();
    
    // Start monitoring for container removal
    this.startContainerMonitoring();
  }

  startContainerMonitoring() {
    // Stop any existing monitoring
    if (this.containerMonitoringInterval) {
      clearInterval(this.containerMonitoringInterval);
    }
    
    this.reinjectionAttempts = 0;
    
    // Check every 500ms if container is still in DOM
    this.containerMonitoringInterval = setInterval(() => {
      if (!this.summaryContainer) {
        clearInterval(this.containerMonitoringInterval);
        return;
      }
      
      const stillExists = document.body.contains(this.summaryContainer);
      
      if (!stillExists && this.reinjectionAttempts < this.maxReinjectionAttempts) {
        this.reinjectionAttempts++;
        console.warn(`⚠️ Summary container removed from DOM! Re-injecting (attempt ${this.reinjectionAttempts}/${this.maxReinjectionAttempts})...`);
        
        // Reset container reference
        this.summaryContainer = null;
        
        // Wait for YouTube to finish its DOM updates
        setTimeout(() => {
          const currentVideoId = this.getVideoId();
          if (currentVideoId === this.currentVideoId) {
            this.createSummaryContainer();
            
            // Restore the current view state
            if (this.showingTranscript) {
              this.displayTranscript();
            } else if (this.showingChat) {
              this.displayChat();
            } else {
              this.updateSummaryDisplay();
            }
          }
        }, 300);
      }
      
      // Stop checking after video changes or max attempts
      const currentVideoId = this.getVideoId();
      if (currentVideoId !== this.currentVideoId || this.reinjectionAttempts >= this.maxReinjectionAttempts) {
        clearInterval(this.containerMonitoringInterval);
        this.containerMonitoringInterval = null;
      }
    }, 500);
    
    console.log('👁️ Started container monitoring');
  }

  attachEventListeners() {
    // Icon tab buttons
    const iconBtns = this.summaryContainer.querySelectorAll('.icon-btn[data-tab]');
    iconBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Export dropdown toggle
    const exportToggleBtn = this.summaryContainer.querySelector('#export-toggle-btn');
    const exportDropdownMenu = this.summaryContainer.querySelector('#export-dropdown-menu');
    
    if (exportToggleBtn && exportDropdownMenu) {
      exportToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = exportDropdownMenu.style.display === 'block';
        exportDropdownMenu.style.display = isVisible ? 'none' : 'block';
        exportToggleBtn.classList.toggle('active', !isVisible);
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.export-dropdown-wrapper')) {
          exportDropdownMenu.style.display = 'none';
          exportToggleBtn.classList.remove('active');
        }
      });
    }

    // Export menu items
    const exportMenuItems = this.summaryContainer.querySelectorAll('.export-menu-item');
    exportMenuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleExportAction(action);
        // Close dropdown after action
        exportDropdownMenu.style.display = 'none';
        exportToggleBtn.classList.remove('active');
      });
    });

    // Dropdown for summary type
    const summaryTypeSelect = this.summaryContainer.querySelector('#summary-type-select');
    if (summaryTypeSelect) {
      summaryTypeSelect.addEventListener('change', async (e) => {
        this.currentSummaryType = e.target.value;
        console.log(`🎭 Summary type changed to: ${this.currentSummaryType}`);
        await this.generateCurrentSummary();
      });
    }

    // Dropdown for format
    const formatSelect = this.summaryContainer.querySelector('#format-select');
    if (formatSelect) {
      formatSelect.addEventListener('change', (e) => {
        this.currentFormat = e.target.value;
        console.log(`📋 Format changed to: ${this.currentFormat}`);
        this.updateSummaryDisplay();
      });
    }

    // Dropdown for length
    const lengthSelect = this.summaryContainer.querySelector('#length-select');
    if (lengthSelect) {
      lengthSelect.addEventListener('change', async (e) => {
        this.currentLength = e.target.value;
        console.log(`📏 Length changed to: ${this.currentLength}`);
        await this.generateCurrentSummary();
      });
    }

    // Add timestamp click handlers (will be added dynamically)
    this.summaryContainer.addEventListener('click', (e) => {
      if (e.target.closest('.timestamp-highlight')) {
        const timeStr = e.target.closest('.timestamp-highlight').dataset.time;
        if (timeStr) {
          this.jumpToTime(timeStr);
        }
      }
    });
  }

  switchTab(tab) {
    // Update active icon button
    const iconBtns = this.summaryContainer.querySelectorAll('.icon-btn[data-tab]');
    iconBtns.forEach(btn => {
      if (btn.dataset.tab === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Hide all panels
    const summaryContent = this.summaryContainer.querySelector('#summary-content');
    const dropdownControls = this.summaryContainer.querySelector('#dropdown-controls');
    
    summaryContent.style.display = 'none';

    // Show appropriate content based on tab
    switch(tab) {
      case 'summary':
        summaryContent.style.display = 'block';
        dropdownControls.style.display = 'grid';
        this.showingTranscript = false;
        this.showingChat = false;
        
        // If no summary exists, show loading and generate
        if (!this.summaries || !this.summaries[this.currentSummaryType] || !this.summaries[this.currentSummaryType][this.currentLength]) {
          this.showLoadingState();
          this.generateCurrentSummary();
        } else {
          this.updateSummaryDisplay();
        }
        break;
      case 'transcript':
        summaryContent.style.display = 'block';
        dropdownControls.style.display = 'none';
        this.showingTranscript = true;
        this.showingChat = false;
        this.displayTranscriptInSummaryPanel();
        break;
      case 'chat':
        summaryContent.style.display = 'block';
        dropdownControls.style.display = 'none';
        this.showingChat = true;
        this.showingTranscript = false;
        this.displayChatInSummaryPanel();
        break;
      case 'copy':
        this.copySummaryToClipboard();
        // Switch back to summary tab after copying
        setTimeout(() => this.switchTab('summary'), 500);
        break;
    }
  }

  jumpToTime(timeString) {
    // Convert time string (e.g., "02:30") to seconds
    const parts = timeString.split(':').map(Number);
    let seconds = 0;
    
    if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1]; // MM:SS
    } else if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
    }
    
    // Find YouTube video player and set time
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = seconds;
      video.play();
      console.log(`🎯 Jumped to ${timeString} (${seconds} seconds)`);
    }
  }

  showLoadingState() {
    if (!this.summaryContainer) return;
    
    const summaryContent = this.summaryContainer.querySelector('#summary-content');
    if (summaryContent) {
      summaryContent.innerHTML = `
        <div class="loading-summary">
          <div class="loading-spinner"></div>
          <span>Generating AI summary...</span>
        </div>
      `;
    }
  }

  displayAdvancedSummary() {
    this.updateSummaryDisplay();
  }

  displayCommentsSummary() {
    const commentsDiv = this.summaryContainer.querySelector('#comments-summary');
    
    if (this.commentsData && this.commentsData.length > 0) {
      const topComments = this.commentsData.slice(0, 5);
      commentsDiv.innerHTML = `
        <div class="comments-list">
          ${topComments.map(comment => `
            <div class="comment-item">
              <div class="comment-author">@${comment.author}</div>
              <div class="comment-text">${comment.text}</div>
              <div class="comment-likes">${comment.likes} likes</div>
            </div>
          `).join('')}
        </div>
        <div class="comments-tldr">
          <p><strong>TLDR:</strong> ${this.generateCommentsTLDR()}</p>
        </div>
      `;
    } else {
      commentsDiv.innerHTML = '<p>No comments available for this video</p>';
    }
  }

  generateCommentsTLDR() {
    if (!this.commentsData) return "No comments to summarize";
    
    // Simple TLDR generation based on common themes
    const allText = this.commentsData.map(c => c.text).join(' ').toLowerCase();
    
    if (allText.includes('great') || allText.includes('amazing') || allText.includes('love')) {
      return "Viewers are generally positive about this content";
    } else if (allText.includes('question') || allText.includes('how') || allText.includes('help')) {
      return "Many viewers have questions and are seeking clarification";
    } else if (allText.includes('thanks') || allText.includes('helpful') || allText.includes('useful')) {
      return "Viewers find this content helpful and educational";
    } else {
      return "Mixed reactions and discussions in the comments";
    }
  }

  updateSummaryDisplay() {
    const summaryContent = this.summaryContainer.querySelector('#summary-content');
    
    if (this.summaries && this.summaries[this.currentSummaryType] && this.summaries[this.currentSummaryType][this.currentLength]) {
      const summary = this.summaries[this.currentSummaryType][this.currentLength];
      
      if (summary.startsWith('Failed to generate')) {
        const isLimitError = summary.includes('Free Plan Limit Reached');
        
        if (isLimitError) {
          summaryContent.innerHTML = `
            <div class="summarizer-error limit-error">
              <div class="limit-error-content">
                ${summary.split('\n').map(line => `<div>${line}</div>`).join('')}
              </div>
              <div class="error-actions">
                <button class="upgrade-btn" onclick="window.open('https://www.clicksummary.com/pricing', '_blank');">
                  ✨ Upgrade to Pro Plan
                </button>
              </div>
            </div>
          `;
        } else {
          summaryContent.innerHTML = `
            <div class="summarizer-error">
              <span>⚠️ ${summary}</span>
              <div class="error-actions">
                <button class="refresh-page-btn" onclick="location.reload();">
                  🔄 Refresh Page
                </button>
              </div>
            </div>
          `;
        }
      } else {
        // Display the summary with a regenerate option
        let formattedSummary;
      if (this.currentFormat === 'qa') {
          formattedSummary = this.formatAsQA(summary);
      } else {
          formattedSummary = this.formatAsTimestampedList(summary);
        }
        
        summaryContent.innerHTML = `
          <div class="summary-display">
            <div class="summary-content">
              ${formattedSummary}
            </div>
          </div>
        `;
      }
    } else {
      // Show that we need to generate this summary
      summaryContent.innerHTML = `
        <div class="summary-placeholder">
          <span>Click to generate ${this.currentSummaryType} ${this.currentLength} summary</span>
          <button class="generate-summary-btn" onclick="(function(){if(window.youtubeSummarizer && window.youtubeSummarizer.generateCurrentSummary) {window.youtubeSummarizer.generateCurrentSummary();} else {console.warn('YouTubeSummarizer not loaded, please refresh the page');}})();">
            Generate Summary
          </button>
        </div>
      `;
    }
  }

  formatSummaryWithCategories(summary) {
    // Parse and format the summary into categories like the competitor
    const categories = this.extractCategories(summary);
    
    let html = `<div class="categorized-summary">`;
    
    categories.forEach(category => {
      html += `
        <div class="summary-category">
          <h4>${category.title}</h4>
          <div class="category-content">
            ${category.points.map(point => `<p>• ${point}</p>`).join('')}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  extractCategories(summary) {
    // Simple categorization - in a real app, this would be more sophisticated
    const lines = summary.split('\n').filter(line => line.trim());
    
    const categories = [];
    let currentCategory = null;
    
    lines.forEach(line => {
      if (line.includes(':') && !line.startsWith('•') && !line.startsWith('-')) {
        // Looks like a category header
        if (currentCategory) categories.push(currentCategory);
        currentCategory = {
          title: line.split(':')[0].trim(),
          points: []
        };
      } else if (currentCategory && (line.startsWith('•') || line.startsWith('-'))) {
        // Bullet point
        currentCategory.points.push(line.replace(/^[•\-]\s*/, ''));
      } else if (currentCategory) {
        // Regular content
        currentCategory.points.push(line);
      }
    });
    
    if (currentCategory) categories.push(currentCategory);
    
    // If no categories found, create default ones
    if (categories.length === 0) {
      categories.push({
        title: this.getCategoryTitle(),
        points: lines
      });
    }
    
    return categories;
  }

  getCategoryTitle() {
    switch(this.currentMode) {
      case 'insightful': return 'Key Insights';
      case 'conversational': return 'Casual Chat';
      case 'funny': return 'Humorous Highlights';
      case 'actionable': return 'Action Items';
      default: return 'Summary';
    }
  }

  updateViewDisplay() {
    const mainDiv = this.summaryContainer.querySelector('#main-summary');
    const timestampDiv = this.summaryContainer.querySelector('#timestamped-summary');
    
    if (this.currentView === 'timestamps') {
      mainDiv.style.display = 'none';
      timestampDiv.style.display = 'block';
      this.displayTimestampedSummary();
    } else {
      mainDiv.style.display = 'block';
      timestampDiv.style.display = 'none';
    }
  }

  displayTimestampedSummary() {
    const timestampContent = this.summaryContainer.querySelector('.timestamp-content');
    
    if (this.summaries && this.summaries.timestamped) {
      timestampContent.innerHTML = this.formatTimestampedSummary(this.summaries.timestamped);
    } else {
      timestampContent.innerHTML = '<div class="loading-timestamps">Generating timestamped summary...</div>';
    }
  }

  formatTimestampedSummary(timestampedData) {
    if (typeof timestampedData === 'string') {
      // Parse timestamped summary string
      const lines = timestampedData.split('\n').filter(line => line.trim());
      return `
        <div class="timestamped-summary">
          ${lines.map(line => {
            if (line.includes('💰') || line.includes('🧠') || line.includes('⚡')) {
              const parts = line.split(' ');
              const time = parts.find(part => part.match(/\d{1,2}:\d{2}/));
              const content = line.replace(time || '', '').trim();
              return `
                <div class="timestamp-item" data-time="${time}">
                  <span class="timestamp-time">${time || '00:00'}</span>
                  <span class="timestamp-content">${content}</span>
                </div>
              `;
            }
            return `<p>${line}</p>`;
          }).join('')}
        </div>
      `;
    }
    
    return '<div class="no-timestamps">No timestamped data available</div>';
  }

  displayTranscript() {
    const transcriptDiv = this.summaryContainer.querySelector('.transcript-content');
    
    if (this.transcriptData) {
      // Convert transcript to string if it's an array
      let transcriptString = this.transcriptData;
      if (Array.isArray(this.transcriptData)) {
        transcriptString = this.transcriptData.map(segment => {
          if (typeof segment === 'string') return segment;
          if (segment && segment.text) return segment.text;
          return String(segment);
        }).join(' ');
      } else if (typeof this.transcriptData !== 'string') {
        transcriptString = String(this.transcriptData);
      }
      
      // Format transcript with timestamps if available
      transcriptDiv.innerHTML = `
        <div class="full-transcript">
          <p><strong>00:00</strong> ${transcriptString.substring(0, 200)}...</p>
          <button class="expand-transcript">Show full transcript</button>
        </div>
      `;
    } else {
      transcriptDiv.innerHTML = '<p>Transcript not available for this video</p>';
    }
  }

  displayError(message) {
    if (!this.summaryContainer) return;
    const summaryContent = this.summaryContainer.querySelector('#summary-content');
    
    // Check if this is a free plan limit error
    const isLimitError = message.includes('Free Plan Limit Reached');
    
    if (isLimitError) {
      // Show upgrade prompt with button
      summaryContent.innerHTML = `
        <div class="summarizer-error limit-error">
          <div class="limit-error-content">
            ${message.split('\n').map(line => `<div>${line}</div>`).join('')}
          </div>
          <div class="error-actions">
            <button class="upgrade-btn" onclick="window.open('https://www.clicksummary.com/pricing', '_blank');">
              ✨ Upgrade to Pro Plan
            </button>
          </div>
        </div>
      `;
    } else {
      summaryContent.innerHTML = `
        <div class="summarizer-error">
          <span>⚠️ ${message}</span>
        </div>
      `;
    }
  }

  // Copy and Export functionality
  copySummaryToClipboard() {
    const summaryText = this.getCurrentSummaryText();
    navigator.clipboard.writeText(summaryText).then(() => {
      this.showToast('📋 Summary copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
      this.showToast('❌ Failed to copy summary');
    });
  }

  getCurrentSummaryText() {
    if (!this.summaries || !this.summaries[this.currentSummaryType] || !this.summaries[this.currentSummaryType][this.currentLength]) {
      return 'No summary available';
    }
    
    const summary = this.summaries[this.currentSummaryType][this.currentLength];
    const videoTitle = document.querySelector('h1.ytd-watch-metadata')?.textContent || 'YouTube Video';
    const videoUrl = window.location.href;
    
    return `${videoTitle}\n\n${summary}\n\nSource: ${videoUrl}`;
  }

  handleExportAction(action) {
    const summaryText = this.getCurrentSummaryText();
    const videoTitle = document.querySelector('h1.ytd-watch-metadata')?.textContent || 'YouTube Video Summary';
    const cleanTitle = videoTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
    
    switch(action) {
      case 'copy-link':
        this.copyVideoLink();
        break;
      case 'copy-text':
        this.copySummaryToClipboard();
        break;
      case 'export-txt':
        this.downloadFile(summaryText, `${cleanTitle}.txt`, 'text/plain');
        break;
      case 'export-doc':
        this.exportAsDoc(summaryText, cleanTitle);
        break;
      case 'export-pdf':
        this.exportAsPDF(summaryText, cleanTitle);
        break;
      case 'export-markdown':
        this.exportAsMarkdown(summaryText, cleanTitle);
        break;
    }
  }

  copyVideoLink() {
    const videoUrl = window.location.href;
    navigator.clipboard.writeText(videoUrl).then(() => {
      this.showToast('🔗 Video link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      this.showToast('❌ Failed to copy link');
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast(`📄 Downloaded ${filename}`);
  }

  exportAsDoc(content, title) {
    const videoTitle = document.querySelector('h1.ytd-watch-metadata')?.textContent || 'YouTube Video';
    const videoUrl = window.location.href;
    
    // Remove emojis and special Unicode characters for DOC compatibility
    const cleanContent = content
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
      .replace(/[\u{2600}-\u{26FF}]/gu, '')  // Remove misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')  // Remove dingbats
      .trim();
    
    // Format content with proper paragraphs and lists
    let formattedContent = cleanContent
      .split('\n')
      .map(line => {
        line = line.trim();
        if (!line) return '';
        
        // Check if line is a bullet point or numbered list
        if (line.match(/^[-•*]\s/)) {
          return `<li>${line.replace(/^[-•*]\s/, '')}</li>`;
        } else if (line.match(/^\d+\.\s/)) {
          return `<li>${line.replace(/^\d+\.\s/, '')}</li>`;
        } else if (line.match(/^[A-Z][^.!?]*[:.]/)) {
          // Likely a heading or section title
          return `<p style="font-weight: bold; margin-top: 12pt;">${line}</p>`;
        } else {
          return `<p>${line}</p>`;
        }
      })
      .join('\n');
    
    // Wrap consecutive <li> elements in <ul>
    formattedContent = formattedContent.replace(/(<li>.*?<\/li>\n?)+/g, (match) => {
      return `<ul>${match}</ul>`;
    });
    
    // Create HTML-based DOC with proper Word XML namespace
    const htmlDoc = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${this.escapeHtml(title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { 
      font-family: Calibri, Arial, sans-serif; 
      font-size: 11pt; 
      line-height: 1.6;
      margin: 1in;
    }
    h1 { 
      font-size: 18pt; 
      font-weight: bold; 
      color: #2c3e50;
      margin-bottom: 12pt;
      border-bottom: 2pt solid #3498db;
      padding-bottom: 6pt;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
      color: #34495e;
      margin-top: 12pt;
      margin-bottom: 6pt;
    }
    p { 
      margin: 6pt 0; 
      text-align: justify;
    }
    ul {
      margin: 6pt 0;
      padding-left: 24pt;
    }
    li {
      margin: 3pt 0;
    }
    .footer {
      margin-top: 24pt;
      padding-top: 12pt;
      border-top: 1pt solid #bdc3c7;
      font-size: 9pt;
      color: #7f8c8d;
    }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(videoTitle)}</h1>
  
  <div class="content">
    ${formattedContent}
  </div>
  
  <div class="footer">
    <p><strong>Source:</strong> ${this.escapeHtml(videoUrl)}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    <p><strong>Powered by:</strong> ClickSummary AI</p>
  </div>
</body>
</html>
    `;
    
    const blob = new Blob(['\ufeff', htmlDoc], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast(`📄 Downloaded ${title}.doc`);
  }

  exportAsPDF(content, title) {
    // Create HTML with proper UTF-8 encoding for emojis
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @media print {
            body { margin: 0; }
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
            margin: 40px; 
            line-height: 1.6;
            color: #333;
          }
          h1 { 
            color: #333; 
            border-bottom: 2px solid #8b5cf6; 
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .summary { 
            white-space: pre-wrap; 
            font-size: 14px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <h1>${this.escapeHtml(title)}</h1>
        <div class="summary">${this.escapeHtml(content)}</div>
        <div class="footer">
          <p>Generated by ClickSummary AI on ${new Date().toLocaleDateString()}</p>
          <p>Source: ${window.location.href}</p>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    this.showToast('🖨️ PDF preview opened - use browser print to save as PDF');
  }

  exportAsMarkdown(content, title) {
    const videoTitle = document.querySelector('h1.ytd-watch-metadata')?.textContent || 'YouTube Video';
    const videoUrl = window.location.href;
    
    const markdownContent = `# ${videoTitle}

${content}

---
**Source:** [${videoTitle}](${videoUrl})
**Generated:** ${new Date().toLocaleDateString()}
`;
    
    this.downloadFile(markdownContent, `${title}.md`, 'text/markdown');
  }

  showToast(message) {
    // Create and show a temporary toast notification
    const toast = document.createElement('div');
    toast.className = 'summarizer-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // Transcript functionality
  toggleTranscript() {
    const transcriptBtn = this.summaryContainer.querySelector('#transcript-btn');
    
    if (this.showingTranscript) {
      // Switch back to summary
      this.showingTranscript = false;
      transcriptBtn.innerHTML = `
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        Transcript
      `;
      transcriptBtn.classList.remove('active');
      this.updateSummaryDisplay();
    } else {
      // Switch to transcript
      this.showingTranscript = true;
      this.showingChat = false; // Hide chat if showing
      const chatBtn = this.summaryContainer.querySelector('#chat-btn');
      chatBtn.innerHTML = `
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
        Chat
      `;
      chatBtn.classList.remove('active');
      
      transcriptBtn.innerHTML = `
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Close
      `;
      transcriptBtn.classList.add('active');
      this.displayTranscriptInSummaryPanel();
    }
  }

  // Chat functionality
  toggleChat() {
    const chatBtn = this.summaryContainer.querySelector('#chat-btn');
    
    if (this.showingChat) {
      // Switch back to summary (preserve chat history)
      console.log(`💬 Hiding chat, preserving ${this.chatHistory.length} messages`);
      this.showingChat = false;
      chatBtn.innerHTML = '💬 Chat';
      chatBtn.classList.remove('active');
      this.updateSummaryDisplay();
    } else {
      // Switch to chat (restore previous conversation)
      console.log(`💬 Showing chat, restoring ${this.chatHistory.length} messages`);
      this.showingChat = true;
      this.showingTranscript = false; // Hide transcript if showing
      const transcriptBtn = this.summaryContainer.querySelector('#transcript-btn');
      transcriptBtn.innerHTML = '📝 Transcript';
      transcriptBtn.classList.remove('active');
      
      chatBtn.innerHTML = '💬 Hide';
      chatBtn.classList.add('active');
      this.displayChatInSummaryPanel();
    }
  }

  async displayTranscriptInSummaryPanel() {
    const summaryContent = this.summaryContainer.querySelector('#summary-content');
    
    try {
      let transcript = this.transcriptData;
      
      // If we don't have transcript data, try to extract it
      if (!transcript) {
        summaryContent.innerHTML = `
          <div class="loading-summary">
            <div class="loading-spinner"></div>
            <span>Loading transcript...</span>
          </div>
        `;
        
        transcript = await this.extractTranscript();
        this.transcriptData = transcript;
      }

      // Check if transcript is valid and is an array
      if (!transcript) {
        summaryContent.innerHTML = `
          <div class="summarizer-error">
            <span>⚠️ Transcript not available for this video</span>
            <p>This video may not have subtitles enabled or may be restricted.</p>
          </div>
        `;
        return;
      }

      // Handle transcript format
      let transcriptArray = [];
      if (Array.isArray(transcript)) {
        transcriptArray = transcript;
      } else if (typeof transcript === 'string') {
        const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
        transcriptArray = sentences.slice(0, 50).map((sentence, index) => ({
          start: index * 8,
          text: sentence.trim(),
          index: index
        }));
      }

      if (transcriptArray.length === 0) {
        summaryContent.innerHTML = `
          <div class="summarizer-error">
            <span>⚠️ No transcript content found</span>
          </div>
        `;
        return;
      }

      // Render search bar and controls
      summaryContent.innerHTML = `
        <div class="transcript-display">
          <div class="transcript-search-container">
            <svg class="transcript-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" class="transcript-search-input" placeholder="Search transcript..." value="${this.transcriptSearchTerm}">
          </div>
          
          <div class="transcript-controls">
            <button class="transcript-control-btn ${this.autoScrollEnabled ? 'active' : ''}" id="toggle-autoscroll">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M19 12l-7 7-7-7"/>
              </svg>
              Auto-scroll
            </button>
            <button class="transcript-control-btn" id="copy-transcript">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy All
            </button>
          </div>

          <div class="transcript-segments" id="transcript-list">
            ${this.renderTranscriptSegments(transcriptArray)}
          </div>
        </div>
      `;

      // Attach Event Listeners
      this.attachTranscriptListeners(transcriptArray);
      
      // Start sync
      this.startTranscriptSync();

    } catch (error) {
      console.error('📝 Error displaying transcript:', error);
      summaryContent.innerHTML = `
        <div class="summarizer-error">
          <span>⚠️ Failed to load transcript</span>
          <p class="error-details">${error.message}</p>
        </div>
      `;
    }
  }

  renderTranscriptSegments(transcriptArray) {
    const searchTerm = this.transcriptSearchTerm.toLowerCase();
    
    return transcriptArray.map((segment, index) => {
      const startTime = segment.start || segment.startTime || (index * 8);
      const timeInSeconds = startTime > 3600 ? Math.floor(startTime / 1000) : startTime;
      const timeStr = this.formatTime(timeInSeconds);
      const text = segment.text || segment.snippet || '';
      
      // Filter if searching
      if (searchTerm && !text.toLowerCase().includes(searchTerm)) {
        return '';
      }

      // Highlight search term
      let displayText = text;
      if (searchTerm) {
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        displayText = text.replace(regex, '<span class="search-highlight">$1</span>');
      }
      
      return `
        <div class="transcript-segment" data-start="${timeInSeconds}">
          <span class="transcript-time" data-time="${timeInSeconds}">${timeStr}</span>
          <span class="transcript-text">${displayText}</span>
        </div>
      `;
    }).join('');
  }

  attachTranscriptListeners(transcriptArray) {
    const summaryContent = this.summaryContainer.querySelector('#summary-content');
    
    // Search
    const searchInput = summaryContent.querySelector('.transcript-search-input');
    searchInput.addEventListener('input', (e) => {
      this.transcriptSearchTerm = e.target.value;
      const list = summaryContent.querySelector('#transcript-list');
      list.innerHTML = this.renderTranscriptSegments(transcriptArray);
      // Re-attach click listeners to new elements
      this.attachSegmentClickListeners();
    });

    // Auto-scroll toggle
    const autoScrollBtn = summaryContent.querySelector('#toggle-autoscroll');
    autoScrollBtn.addEventListener('click', () => {
      this.autoScrollEnabled = !this.autoScrollEnabled;
      autoScrollBtn.classList.toggle('active');
    });

    // Copy
    const copyBtn = summaryContent.querySelector('#copy-transcript');
    copyBtn.addEventListener('click', () => {
      const fullText = transcriptArray.map(s => `[${this.formatTime(s.start)}] ${s.text}`).join('\n');
      navigator.clipboard.writeText(fullText).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '✅ Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 2000);
      });
    });

    this.attachSegmentClickListeners();
  }

  attachSegmentClickListeners() {
    const segments = this.summaryContainer.querySelectorAll('.transcript-segment');
    segments.forEach(seg => {
      seg.addEventListener('click', () => {
        const time = seg.dataset.start;
        this.jumpToTime(time);
      });
    });
  }

  jumpToTime(seconds) {
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = parseFloat(seconds);
      video.play();
    }
  }

  startTranscriptSync() {
    if (this.transcriptSyncInterval) clearInterval(this.transcriptSyncInterval);
    
    const video = document.querySelector('video');
    if (!video) return;

    this.transcriptSyncInterval = setInterval(() => {
      if (!this.showingTranscript) {
        clearInterval(this.transcriptSyncInterval);
        return;
      }
      
      const currentTime = video.currentTime;
      this.highlightCurrentTranscriptSegment(currentTime);
    }, 500);
  }

  highlightCurrentTranscriptSegment(currentTime) {
    const segments = this.summaryContainer?.querySelectorAll('.transcript-segment');
    if (!segments) return;

    let activeSegment = null;

    // Find active segment
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const start = parseFloat(segment.dataset.start);
      // Assume segment lasts until next one starts
      const nextStart = segments[i+1] ? parseFloat(segments[i+1].dataset.start) : Infinity;
      
      if (currentTime >= start && currentTime < nextStart) {
        activeSegment = segment;
        break;
      }
    }

    if (activeSegment) {
      // Remove old active class
      const oldActive = this.summaryContainer.querySelector('.transcript-segment.active');
      if (oldActive && oldActive !== activeSegment) {
        oldActive.classList.remove('active');
      }
      
      activeSegment.classList.add('active');

      // Auto-scroll logic
      if (this.autoScrollEnabled) {
        const container = this.summaryContainer.querySelector('.transcript-segments');
        const segmentTop = activeSegment.offsetTop;
        const containerTop = container.offsetTop;
        const scrollPosition = segmentTop - containerTop - (container.clientHeight / 2) + (activeSegment.clientHeight / 2);
        
        container.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  }

  formatTime(seconds) {
    // Handle different input formats
    if (!seconds) return '00:00';
    
    // If seconds is a string, try to parse it
    if (typeof seconds === 'string') {
      seconds = parseFloat(seconds);
    }
    
    if (isNaN(seconds)) return '00:00';
    
    // If the number is very large, it might be in milliseconds
    if (seconds > 86400) { // More than 24 hours suggests milliseconds
      seconds = seconds / 1000;
    }
    
    seconds = Math.floor(seconds);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }

  async displayChatInSummaryPanel() {
    const summaryContent = this.summaryContainer.querySelector('#summary-content');
    
    if (!this.transcriptData) {
      summaryContent.innerHTML = `
        <div class="chat-error">
          <span>⚠️ Chat requires transcript data</span>
          <p>Please wait for the transcript to load or try a different video.</p>
        </div>
      `;
      return;
    }

    summaryContent.innerHTML = `
      <div class="chat-interface">
        <div class="chat-header">
          <h3 class="chat-title">💬 Chat with AI</h3>
        </div>
        
        <div class="chat-messages" id="chat-messages">
          <!-- Messages will be populated by restoreChatHistory -->
        </div>
        
        <div class="chat-input-container">
          <input type="text" id="chat-input" placeholder="Ask a question... (Press Enter to send)" 
                 class="chat-input" maxlength="300">
          <button id="send-chat" class="chat-send-btn" title="Send (Enter)">
            <svg class="send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Restore previous chat history or show welcome message
    this.restoreChatHistory();

    // Add event listeners for chat functionality
    this.attachChatListeners();
    
    // Update chat button indicator
    this.updateChatButtonIndicator();
    
    // Focus on input
    const chatInput = summaryContent.querySelector('#chat-input');
    chatInput.focus();
  }

  attachChatListeners() {
    const summaryContent = this.summaryContainer.querySelector('#summary-content');
    const chatInput = summaryContent.querySelector('#chat-input');
    const sendBtn = summaryContent.querySelector('#send-chat');

    const sendMessage = async () => {
      const question = chatInput.value.trim();
      if (!question) return;

      // Add user message to chat
      this.addMessageToChat('user', question);
      chatInput.value = '';
      chatInput.disabled = true;
      sendBtn.disabled = true;

      try {
        // Show typing indicator
        this.addTypingIndicator();
        
        // Get answer from AI
        const answer = await this.getChatAnswer(question);
        
        // Remove typing indicator and add bot response
        this.removeTypingIndicator();
        this.addMessageToChat('bot', answer);
      } catch (error) {
        this.removeTypingIndicator();
        this.addMessageToChat('bot', this.formatUserFriendlyError(error.message, 'chat'));
        console.error('Chat error:', error);
      }

      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();
    };

    // Send on button click
    sendBtn.addEventListener('click', sendMessage);

    // Send on Enter key
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  restoreChatHistory() {
    const chatMessages = this.summaryContainer.querySelector('#chat-messages');
    
    if (this.chatHistory.length === 0) {
      // Show welcome message if no history
      const welcomeElement = document.createElement('div');
      welcomeElement.className = 'chat-message bot-message';
      welcomeElement.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          Hi! I can answer questions about this video based on the transcript. What would you like to know?
        </div>
      `;
      chatMessages.appendChild(welcomeElement);
    } else {
      // Restore all messages from history
      this.chatHistory.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${msg.type}-message`;
        
        const avatar = msg.type === 'user' ? '👤' : '🤖';
        messageElement.innerHTML = `
          <div class="message-avatar">${avatar}</div>
          <div class="message-content">${msg.content}</div>
        `;
        
        chatMessages.appendChild(messageElement);
      });
      
      // Scroll to bottom to show latest messages
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  addMessageToChat(type, message) {
    const chatMessages = this.summaryContainer.querySelector('#chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${type}-message`;
    
    const avatar = type === 'user' ? '👤' : '🤖';
    
    messageElement.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">${message}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    
    // Save message to chat history (exclude welcome message)
    if (!(type === 'bot' && message.includes('Hi! I can answer questions'))) {
      this.chatHistory.push({
        type: type,
        content: message,
        timestamp: Date.now()
      });
      
      // Update chat button indicator
      this.updateChatButtonIndicator();
    }
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  addTypingIndicator() {
    const chatMessages = this.summaryContainer.querySelector('#chat-messages');
    const typingElement = document.createElement('div');
    typingElement.className = 'chat-message bot-message typing-indicator';
    typingElement.id = 'typing-indicator';
    typingElement.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    
    chatMessages.appendChild(typingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  removeTypingIndicator() {
    const typingIndicator = this.summaryContainer.querySelector('#typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  async getChatAnswer(question) {
    // Convert transcript to string if it's an array
    let transcriptData = this.transcriptData;
    if (Array.isArray(this.transcriptData)) {
      transcriptData = this.transcriptData.map(segment => {
        if (typeof segment === 'string') return segment;
        if (segment && segment.text) return segment.text;
        return String(segment);
      }).join(' ');
    } else if (this.transcriptData && typeof this.transcriptData !== 'string') {
      transcriptData = String(this.transcriptData);
    }

    const data = {
      question: question,
      transcript: transcriptData,
      videoId: this.currentVideoId
    };

    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage({
          action: 'chatQuery',
          data: data
        }, (response) => {
          // Check for extension context invalidation
          if (chrome.runtime.lastError) {
            console.error('❌ Chrome runtime error:', chrome.runtime.lastError);
            reject(new Error('Extension was reloaded. Please refresh the page and try again.'));
            return;
          }
          
          if (!response) {
            reject(new Error('No response from extension. Please refresh the page.'));
            return;
          }
          
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.answer);
          }
        });
      } catch (error) {
        console.error('❌ Error sending chat message:', error);
        reject(new Error('Extension connection lost. Please refresh the page.'));
      }
    });
  }

  updateChatButtonIndicator() {
    if (!this.summaryContainer) return;
    
    const chatBtn = this.summaryContainer.querySelector('#chat-btn');
    if (!chatBtn) return;
    
    if (this.chatHistory.length > 0) {
      chatBtn.classList.add('has-chat-history');
    } else {
      chatBtn.classList.remove('has-chat-history');
    }
  }

  formatUserFriendlyError(errorMessage, type = 'general') {
    // Check for extension reload/context invalidation errors
    if (errorMessage.includes('Extension was reloaded') || 
        errorMessage.includes('Extension context invalidated') || 
        errorMessage.includes('Extension connection lost') ||
        errorMessage.includes('refresh the page')) {
      return `🔄 Extension was updated or reloaded. Please <strong>refresh this page</strong> (F5) to continue using ClickSummary.`;
    }
    
    // Check for daily limit errors
    if (errorMessage.includes('Daily limit reached') || 
        errorMessage.includes('Daily chat limit reached') || 
        errorMessage.includes('Free Plan Limit Reached') ||
        errorMessage.includes('limit') && errorMessage.includes('free summaries')) {
      if (type === 'chat') {
        return `🔒 You've reached your monthly chat limit! Free users get 5 chats per month. <a href="https://www.clicksummary.com/pricing" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Upgrade to Pro Plan</a> for unlimited AI chat conversations.`;
      } else {
        return `🔒 You've reached your daily summary limit! Free users get 3 summaries per day (resets at midnight). <a href="https://www.clicksummary.com/pricing" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Upgrade to Pro Plan</a> for unlimited summaries.`;
      }
    }
    
    // Check for authentication errors
    if (errorMessage.includes('Authentication failed') || errorMessage.includes('Please sign in')) {
      return `🔑 Please sign in to use ClickSummary. <a href="https://www.clicksummary.com/signin" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Sign in here</a> to get started.`;
    }
    
    // Check for subscription required errors
    if (errorMessage.includes('Subscription required') || errorMessage.includes('upgrade your plan')) {
      return `⭐ Premium subscription required for this feature. <a href="https://www.clicksummary.com/pricing" target="_blank" style="color: #8b5cf6; text-decoration: underline;">Upgrade now</a> to unlock all features.`;
    }
    
    // Check for rate limit errors (server-side)
    if (errorMessage.includes('Rate limit exceeded')) {
      return `⏰ Too many requests right now. Please wait 1-2 minutes and try again. If this continues, contact support at <a href="https://www.clicksummary.com/support" target="_blank" style="color: #8b5cf6; text-decoration: underline;">clicksummary.com/support</a>`;
    }
    
    // Check for network/connection errors
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
      return `🌐 Connection issue detected. Try these steps:<br>1. Check your internet connection<br>2. Refresh this page (F5)<br>3. If issue persists, try disabling other extensions temporarily`;
    }
    
    // Check for transcript-related errors
    if (errorMessage.includes('transcript') || errorMessage.includes('captions')) {
      return `📝 This video doesn't have captions available. ClickSummary needs captions to work. Try:<br>1. Choose a different video with captions<br>2. Enable auto-generated captions if available<br>3. Most popular videos have captions`;
    }
    
    // Check for server errors
    if (errorMessage.includes('500') || errorMessage.includes('Internal server error')) {
      return `⚠️ Server error occurred. This is temporary. Try:<br>1. Wait 30 seconds and try again<br>2. Refresh the page (F5)<br>3. If it continues, report at <a href="https://www.clicksummary.com/support" target="_blank" style="color: #8b5cf6; text-decoration: underline;">clicksummary.com/support</a>`;
    }
    
    // Actionable fallback errors
    if (type === 'chat') {
      return `💬 Unable to process your question. Try:<br>1. Rephrase your question more simply<br>2. Make sure the video has been summarized first<br>3. Refresh the page (F5) and try again<br>4. Check if you've reached your monthly chat limit (5 chats/month for free users)`;
    } else {
      return `📄 Unable to generate summary. Try these steps:<br>1. Refresh the page (F5)<br>2. Try a different video<br>3. Check if the video has captions enabled<br>4. Make sure you're signed in<br>5. Check if you've reached your daily limit (3 summaries/day, resets at midnight)`;
    }
  }

  removePreviousSummary() {
    console.log('🧹 Cleaning up previous summary...');
    
    // Stop monitoring
    if (this.containerMonitoringInterval) {
      clearInterval(this.containerMonitoringInterval);
      this.containerMonitoringInterval = null;
    }
    
    if (this.summaryContainer) {
      this.summaryContainer.remove();
      this.summaryContainer = null;
    }
    this.showingTranscript = false;
    this.showingChat = false;
    this.chatHistory = []; // Clear chat history when switching videos
    this.transcriptData = null; // Clear old transcript data
    this.summaries = {}; // Clear internal cache
    this.reinjectionAttempts = 0;
    console.log('🧹 Cleanup complete');
  }
  
  // Clear cache for specific video
  clearVideoCache(videoId) {
    console.log(`🗑️ Clearing cache for video: ${videoId}`);
    
    try {
      chrome.runtime.sendMessage({
        action: 'clearVideoCache',
        videoId: videoId
      }, (response) => {
        // Check for extension context invalidation
        if (chrome.runtime.lastError) {
          console.log('⚠️ Extension context invalidated, skipping cache clear');
          return;
        }
        
        if (response && response.success) {
          console.log(`✅ Cache cleared for video: ${videoId}`);
        } else {
          console.log(`⚠️ Failed to clear cache for video: ${videoId}`);
        }
      });
    } catch (error) {
      console.log('⚠️ Could not clear cache (extension context invalidated)');
    }
  }

  // Authentication Methods
  async checkAuthentication() {
    try {
      // Check if we have a stored token (using CORRECT standardized keys)
      const result = await chrome.storage.local.get(['youtube_summarizer_token', 'youtube_summarizer_user']);

      console.log('🔍 Content script auth check:', {
        hasToken: !!result.youtube_summarizer_token,
        hasUser: !!result.youtube_summarizer_user,
        tokenLength: result.youtube_summarizer_token?.length || 0,
        userLength: result.youtube_summarizer_user?.length || 0
      });
      
      if (result.youtube_summarizer_token && result.youtube_summarizer_user) {
        try {
          const user = JSON.parse(result.youtube_summarizer_user);
          
          // Validate user structure
          if (!user.id || !user.email || !user.name) {
            console.error('❌ Invalid user data structure in content script:', user);
            this.isAuthenticated = false;
            return false;
          }
          
          console.log('✅ User is authenticated in content script:', user.name);
          this.currentUser = user;
          this.isAuthenticated = true;
          return true;
        } catch (parseError) {
          console.error('❌ Error parsing user data in content script:', parseError);
          this.isAuthenticated = false;
          return false;
        }
      }
      
      console.log('❌ User is not authenticated in content script. Storage result:', {
        tokenExists: !!result.youtube_summarizer_token,
        userExists: !!result.youtube_summarizer_user
      });
      this.isAuthenticated = false;
      return false;
      
    } catch (error) {
      console.error('❌ Authentication check failed in content script:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  showSignInPrompt() {
    const signInHTML = `
      <div class="auth-prompt">
        <div class="auth-icon">✨</div>
        <h3>Unlock AI-Powered Summaries</h3>
        <p>Sign in to get instant AI summaries, key insights, and chat with any YouTube video.</p>
        <div class="auth-buttons">
          <button class="auth-btn-primary" id="auth-signin-btn">
            <span class="btn-icon">🚀</span>
            Sign In with Google
          </button>
        </div>
      </div>
    `;

    // Update the summary content to show sign-in prompt
    const summaryContent = this.summaryContainer.querySelector('#summary-content');
    if (summaryContent) {
      summaryContent.innerHTML = signInHTML;
      
      // Attach event listener to button
      const signInBtn = summaryContent.querySelector('#auth-signin-btn');
      
      if (signInBtn) {
        signInBtn.addEventListener('click', () => {
          console.log('🔐 Sign in button clicked');
          this.initiateSignIn();
        });
      }
    }
  }

  async initiateSignIn() {
    try {
      console.log('🔐 Initiating Google sign-in with account picker...');
      
      // Show loading state
      this.showAuthMessage('Opening Google sign-in...');
      
      // Send message to background script to handle OAuth
      chrome.runtime.sendMessage({ action: 'initiateGoogleSignIn' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Sign-in error:', chrome.runtime.lastError);
          this.showAuthError('Sign-in failed. Please try again.');
          return;
        }
        
        if (response && response.success) {
          console.log('✅ Sign-in successful, refreshing auth state...');
          this.showAuthMessage('Sign-in successful! Loading...');
          // Refresh the authentication state
          setTimeout(() => {
            this.checkAuthentication();
          }, 500);
        } else {
          console.error('❌ Sign-in failed:', response?.error);
          if (response?.error === 'Sign-in cancelled') {
            this.showSignInPrompt(); // Show sign-in prompt again
          } else {
            this.showAuthError(response?.error || 'Sign-in failed. Please try again.');
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Sign-in failed:', error);
      this.showAuthError('Sign-in failed. Please try again.');
    }
  }

  openLandingPage() {
    console.log('🌐 Opening landing page for sign-in...');
    
    this.getConfig().then((cfg) => {
      const base = cfg.WEBSITE_URL || 'https://www.clicksummary.com';
      const path = arguments && arguments[0] ? arguments[0] : '/signin';
      const landingPageUrl = `${base}${path}`;
      console.log(`🌍 Opening landing page: ${landingPageUrl}`);
      window.open(landingPageUrl, '_blank');
    }).catch(() => {
      const fallback = 'https://www.clicksummary.com/signin';
      console.log(`🌍 Opening fallback landing page: ${fallback}`);
      window.open(fallback, '_blank');
    });
    
    console.log('✅ Landing page opened in new tab');
    
    // Show message to user
    this.showAuthMessage('Authentication page opened. Follow the instructions there to sign in, then return here and try again.');
  }

  showAuthError(message) {
    const errorHTML = `
      <div class="auth-error">
        <div class="error-icon">❌</div>
        <h3>Authentication Error</h3>
        <p>${message}</p>
        <button class="retry-btn" id="auth-retry-btn">
          <span class="btn-icon">🔄</span>
          Try Again
        </button>
      </div>
    `;

    const summaryContent = this.summaryContainer.querySelector('#summary-content');
    if (summaryContent) {
      summaryContent.innerHTML = errorHTML;
      
      // Attach event listener
      const retryBtn = summaryContent.querySelector('#auth-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          console.log('🔄 Retry button clicked');
          this.showSignInPrompt();
        });
      }
    }
  }

  // Helper to get centralized config from background
  async getConfig() {
    try {
      return await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'getConfig' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          if (!response) {
            reject(new Error('No config response'));
            return;
          }
          resolve(response);
        });
      });
    } catch (e) {
      return { WEBSITE_URL: 'https://www.clicksummary.com', API_BASE_URL: 'https://api.clicksummary.com/api' };
    }
  }

  showAuthMessage(message) {
    const messageHTML = `
      <div class="auth-message">
        <div class="message-icon">✅</div>
        <h3>Almost There!</h3>
        <p>${message}</p>
        <button class="refresh-btn" id="auth-refresh-btn">
          <span class="btn-icon">🔄</span>
          I've Signed In - Try Again
        </button>
      </div>
    `;

    const summaryContent = this.summaryContainer.querySelector('#summary-content');
    if (summaryContent) {
      summaryContent.innerHTML = messageHTML;
      
      // Attach event listener
      const refreshBtn = summaryContent.querySelector('#auth-refresh-btn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          console.log('🔄 Refresh button clicked');
          this.checkAndRetry();
        });
      }
    }
  }

  async checkAndRetry() {
    const isAuth = await this.checkAuthentication();
    if (isAuth) {
      console.log('✅ User is now authenticated, proceeding with summarization');
      this.startSummarization();
    } else {
      this.showAuthMessage('Still not signed in. Please complete sign-in on the landing page first.');
    }
  }
}

// Enhanced initialization with robust error handling and retry logic
console.log('🚀 YouTube Summarizer content script loading...');
console.log('🔍 Script loaded at:', new Date().toLocaleTimeString());
console.log('🔍 Current URL:', window.location.href);
console.log('🔍 Document ready state:', document.readyState);

let summarizer;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 5;
const INIT_RETRY_DELAY = 1000;

function initializeSummarizer() {
  initializationAttempts++;
  console.log(`🔄 Initialization attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS}`);
  
  try {
    if (summarizer) {
      console.log('✅ YouTubeSummarizer already initialized');
      return true;
    }
    
    summarizer = new YouTubeSummarizer();
    console.log('✅ YouTubeSummarizer instance created successfully');
    
    // Make it globally accessible for button clicks
    window.youtubeSummarizer = summarizer;
    console.log('✅ window.youtubeSummarizer exposed globally');
    
    // Add debug function
    window.youtubeSummarizer.debug = function() {
      console.log('🔍 YouTubeSummarizer debug info:', {
        instance: !!window.youtubeSummarizer,
        isAuthenticated: this.isAuthenticated,
        currentUser: this.currentUser,
        currentVideoId: this.currentVideoId,
        summaryContainer: !!this.summaryContainer
      });
    };

    // Add cache management functions for easy console access
    window.youtubeSummarizer.clearCache = function() {
      this.clearSummaryCache();
    };


    window.youtubeSummarizer.debugCache = function() {
      this.debugCacheStatus();
    };

    // Quick fix function for common issues
    window.youtubeSummarizer.quickFix = function() {
      console.log('🔧 YOUTUBE SUMMARIZER QUICK FIX');
      console.log('===============================');
      this.debugCacheStatus();
      console.log('');
      console.log('🚀 Quick Actions:');
      console.log('  clearCache() - Clear all cached summaries');
      console.log('  debugCache() - Show detailed cache information');
    };
    
    // Add enhanced re-authentication method for signouts
    window.youtubeSummarizer.handleSignout = async function() {
      console.log('🚪 Content script: Handling signout notification...');
      
      // Clear current authentication state
      this.isAuthenticated = false;
      this.currentUser = null;
      
      // Re-check authentication (should find nothing after signout)
      const authResult = await this.checkAuthentication();
      
      if (!authResult) {
        console.log('✅ Content script: Authentication cleared, updating UI...');
        
        // Update any existing summary containers to show auth prompt
        if (this.summaryContainer) {
          this.showSignInPrompt();
        }
        
        // Clear any cached data
        this.chatHistory = [];
        this.currentSummary = null;
        
        console.log('✅ Content script: Signout handling complete');
      } else {
        console.warn('⚠️ Content script: Still authenticated after signout - possible sync issue');
      }
    };
    
    // Add method to force authentication recheck
    window.youtubeSummarizer.forceAuthRecheck = async function() {
      console.log('🔄 Content script: Force authentication recheck requested...');
      const authResult = await this.checkAuthentication();
      console.log('🔍 Content script: Auth recheck result:', authResult ? 'authenticated' : 'not authenticated');
      return authResult;
    };
    
    // Add initialization check function
    window.youtubeSummarizer.isReady = function() {
      return !!window.youtubeSummarizer && typeof window.youtubeSummarizer.debug === 'function';
    };
    
    console.log('✅ YouTube Summarizer fully initialized and accessible');
    
    // Test the global object
    if (typeof window.youtubeSummarizer.debug === 'function') {
      window.youtubeSummarizer.debug();
    }
    
    return true;
    
  } catch (error) {
    console.error(`❌ Error creating YouTubeSummarizer (attempt ${initializationAttempts}):`, error);
    console.error('Error stack:', error.stack);
    
    if (initializationAttempts < MAX_INIT_ATTEMPTS) {
      console.log(`🔄 Retrying in ${INIT_RETRY_DELAY}ms...`);
      setTimeout(initializeSummarizer, INIT_RETRY_DELAY);
    } else {
      console.error('❌ Failed to initialize after maximum attempts');
      
      // Create a minimal fallback object to prevent button errors
      window.youtubeSummarizer = {
        initiateSignIn: function() { 
          console.warn('⚠️ YouTubeSummarizer not fully loaded - opening sign-in page');
          const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const url = isDev ? 'http://localhost:3002/signin' : 'https://www.clicksummary.com/signin';
          window.open(url, '_blank');
        },
        openLandingPage: function() { 
          console.warn('⚠️ YouTubeSummarizer not fully loaded - opening landing page');
          const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const url = isDev ? 'http://localhost:3002/signin' : 'https://www.clicksummary.com/signin';
          window.open(url, '_blank');
        },
        debug: function() {
          console.error('❌ YouTubeSummarizer failed to initialize properly');
        },
        isReady: function() { return false; }
      };
      console.log('🔧 Fallback YouTubeSummarizer object created');
    }
    
    return false;
  }
}

// Multiple initialization strategies for YouTube's complex loading
function startInitialization() {
  console.log('🚀 Starting YouTube Summarizer initialization...');
  
  // Strategy 1: Immediate initialization
  if (initializeSummarizer()) {
    return;
  }
  
  // Strategy 2: Wait for DOM content loaded
  if (document.readyState === 'loading') {
    console.log('📄 Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('📄 DOMContentLoaded fired');
      setTimeout(initializeSummarizer, 500);
    });
  }
  
  // Strategy 3: Wait for full page load
  if (document.readyState !== 'complete') {
    console.log('🌐 Waiting for window load...');
    window.addEventListener('load', () => {
      console.log('🌐 Window load fired');
      setTimeout(initializeSummarizer, 1000);
    });
  }
  
  // Strategy 4: YouTube-specific initialization after delay
  setTimeout(() => {
    console.log('⏰ YouTube-specific delayed initialization');
    if (!window.youtubeSummarizer || !window.youtubeSummarizer.isReady()) {
      initializeSummarizer();
    }
  }, 2000);
  
  // Strategy 5: Watch for YouTube page changes
  let lastUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      console.log('🔄 YouTube page changed, checking initialization...');
      setTimeout(() => {
        if (!window.youtubeSummarizer || !window.youtubeSummarizer.isReady()) {
          initializeSummarizer();
        }
      }, 1000);
    }
  });
  
  if (document.body) {
    urlObserver.observe(document.body, { childList: true, subtree: true });
    console.log('👀 YouTube page change observer activated');
  }
}

// Start the initialization process
startInitialization();

// Additional safety check every 5 seconds for the first 30 seconds
let safetyCheckCount = 0;
const safetyInterval = setInterval(() => {
  safetyCheckCount++;
  
  if (!window.youtubeSummarizer || !window.youtubeSummarizer.isReady()) {
    console.warn(`⚠️ Safety check ${safetyCheckCount}: YouTubeSummarizer not ready, attempting initialization...`);
    initializeSummarizer();
  } else {
    console.log(`✅ Safety check ${safetyCheckCount}: YouTubeSummarizer is ready`);
  }
  
  // Stop safety checks after 30 seconds (6 checks)
  if (safetyCheckCount >= 6) {
    clearInterval(safetyInterval);
    console.log('🔒 Safety check interval stopped');
  }
}, 5000);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'triggerSummary') {
    try {
      // Check if we're on a YouTube video page
      if (!window.location.href.includes('youtube.com/watch')) {
        sendResponse({ success: false, error: 'Not on a YouTube video page' });
        return;
      }
      
      // Check if summarizer is available and has a current video
      if (!summarizer || !summarizer.currentVideoId) {
        sendResponse({ success: false, error: 'No video detected' });
        return;
      }
      
      // Trigger summarization
      summarizer.startSummarization();
      sendResponse({ success: true });
      
    } catch (error) {
      console.error('❌ Error triggering summary from popup:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
});

