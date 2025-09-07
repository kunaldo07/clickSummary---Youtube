// YouTube Video Summarizer Content Script

class YouTubeSummarizer {
  constructor() {
    this.currentVideoId = null;
    this.summaryContainer = null;
    this.isProcessing = false;
    this.currentSummaryType = 'insightful'; // insightful, funny, actionable, controversial
    this.currentFormat = 'list'; // list, q&a
    this.currentLength = 'short'; // short, detailed
    this.transcriptData = null;
    this.commentsData = null;
    this.showingTranscript = false;
    this.showingChat = false;
    this.chatHistory = [];
    this.currentUser = null;
    this.isAuthenticated = false;
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
    // Monitor for URL changes (YouTube is a SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        this.onPageChange();
      }
    }).observe(document, { subtree: true, childList: true });

    // Handle initial page load
    this.onPageChange();
  }

  onPageChange() {
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
  }

  getVideoId() {
    const url = new URL(window.location.href);
    return url.searchParams.get('v');
  }

  async procesVideo() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
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
            Summarize video
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
      
      // Show the header controls (dropdowns and action buttons)
      const header = this.summaryContainer.querySelector('#summarizer-header');
      if (header) {
        header.style.display = 'block';
      }
      
      // Show loading state
      this.showLoadingState();
      
      // Show the advanced summary UI
      this.displayAdvancedSummary();
      
      // Generate summary for the currently selected type/length
      await this.generateCurrentSummary();
      
    } catch (error) {
      console.error('Error starting summarization:', error);
      this.displayError('Failed to generate summary: ' + error.message);
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
      this.summaries[this.currentSummaryType][this.currentLength] = `Failed to generate summary: ${error.message}`;
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
        reject(new Error('Backend request timed out after 30 seconds. Please check if backend is running on http://localhost:3001'));
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
        ${sections.map(section => {
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
          if (/^[🎯🚀🧠💡🎤🌟🔥⚡📈🌐💰🤖🎨🎭🎪📚🎬🎵⚖️🔮🛠️📊]/.test(line)) {
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
          if (/^[🎯🚀🧠💡🎤🌟🔥⚡📈🌐💰🤖🎨🎭🎪📚🎬🎵⚖️🔮🛠️📊]/.test(line)) {
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
      controversial: [
        "What controversial points are raised?",
        "What debates or disagreements are discussed?",
        "What opposing viewpoints are presented?",
        "What might generate discussion or controversy?"
      ]
    };
    
    return questionSets[type] || questionSets.insightful;
  }

  getHeadlineForType(type) {
    const headlines = {
      insightful: 'Key Insights & Learnings',
      funny: 'Humorous Highlights',
      actionable: 'Action Items & Takeaways',
      controversial: 'Debate Points & Controversies'
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
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.summary);
        }
      });
    });
  }

  createSummaryContainer() {
    if (this.summaryContainer) return;

    // Find the video secondary info (below video)
    const secondaryInfo = document.querySelector('#secondary-inner') || 
                         document.querySelector('#secondary') ||
                         document.querySelector('#columns #secondary');
    
    if (!secondaryInfo) return;

    this.summaryContainer = document.createElement('div');
    this.summaryContainer.id = 'youtube-summarizer-container';
    this.summaryContainer.innerHTML = `
      <div class="summarizer-header" id="summarizer-header" style="display: none;">
        <div class="header-controls">
          <div class="dropdown-row">
            <div class="dropdown-control">
              <label>Summary Type</label>
              <select id="summary-type-select">
                <option value="insightful">Insightful</option>
                <option value="funny">Funny</option>
                <option value="actionable">Actionable</option>
                <option value="controversial">Controversial</option>
              </select>
            </div>
            
            <div class="dropdown-control">
              <label>Format</label>
              <select id="format-select">
                <option value="list">List</option>
                <option value="qa">Q&A</option>
              </select>
            </div>
            
            <div class="dropdown-control">
              <label>Length</label>
              <select id="length-select">
                <option value="short">Short</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
          </div>
          
          <div class="action-row">
            <button id="transcript-btn" class="action-btn" title="Show/Hide Transcript">
              📝 Transcript
            </button>
            
            <button id="chat-btn" class="action-btn" title="Chat about Video">
              💬 Chat
            </button>
            
            <button id="copy-btn" class="action-btn" title="Copy Summary">
              📋
            </button>
            
            <div class="export-dropdown">
              <button id="export-btn" class="action-btn" title="Export Options">
                📤 Export ▼
              </button>
              <div id="export-menu" class="export-menu" style="display: none;">
                <div class="export-section">
                  <div class="export-section-title">Copy</div>
                  <button class="export-option" data-action="copy-link">Link</button>
                  <button class="export-option" data-action="copy-text">Text</button>
                </div>
                <div class="export-section">
                  <div class="export-section-title">Export</div>
                  <button class="export-option" data-action="export-txt">Txt</button>
                  <button class="export-option" data-action="export-doc">Doc</button>
                  <button class="export-option" data-action="export-pdf">PDF</button>
                  <button class="export-option" data-action="export-markdown">Markdown</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="summary-display-panel">
        <div id="summary-content">
          <div class="loading-summary">
            <div class="loading-spinner"></div>
            <span>Generating AI summary...</span>
          </div>
        </div>
      </div>
    `;

    // Insert at the top of secondary content
    secondaryInfo.insertBefore(this.summaryContainer, secondaryInfo.firstChild);

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Summary Type dropdown
    const summaryTypeSelect = this.summaryContainer.querySelector('#summary-type-select');
    summaryTypeSelect.addEventListener('change', async (e) => {
      this.currentSummaryType = e.target.value;
      console.log(`🎭 Summary type changed to: ${this.currentSummaryType}`);
      
      // Generate summary for the new type if we don't have it
      await this.generateCurrentSummary();
    });

    // Format dropdown
    const formatSelect = this.summaryContainer.querySelector('#format-select');
    formatSelect.addEventListener('change', (e) => {
      this.currentFormat = e.target.value;
      console.log(`📋 Format changed to: ${this.currentFormat}`);
      
      // Just update display format, no need to regenerate summary
      this.updateSummaryDisplay();
    });

    // Length dropdown
    const lengthSelect = this.summaryContainer.querySelector('#length-select');
    lengthSelect.addEventListener('change', async (e) => {
      this.currentLength = e.target.value;
      console.log(`📏 Length changed to: ${this.currentLength}`);
      
      // Generate summary for the new length if we don't have it
      await this.generateCurrentSummary();
    });
    
    // Transcript button
    const transcriptBtn = this.summaryContainer.querySelector('#transcript-btn');
    
    transcriptBtn.addEventListener('click', () => {
      this.toggleTranscript();
    });

    // Chat button
    const chatBtn = this.summaryContainer.querySelector('#chat-btn');
    
    chatBtn.addEventListener('click', () => {
      this.toggleChat();
    });
    
    // Initialize chat button indicator
    this.updateChatButtonIndicator();

    // Copy button
    const copyBtn = this.summaryContainer.querySelector('#copy-btn');
    copyBtn.addEventListener('click', () => {
      this.copySummaryToClipboard();
    });

    // Export dropdown toggle
    const exportBtn = this.summaryContainer.querySelector('#export-btn');
    const exportMenu = this.summaryContainer.querySelector('#export-menu');
    
    exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportMenu.style.display = exportMenu.style.display === 'none' ? 'block' : 'none';
    });

    // Close export menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.export-dropdown')) {
        exportMenu.style.display = 'none';
      }
    });

    // Export options
    const exportOptions = this.summaryContainer.querySelectorAll('.export-option');
    exportOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleExportAction(action);
        exportMenu.style.display = 'none';
      });
    });

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
      case 'funny': return 'Humorous Highlights';
      case 'actionable': return 'Action Items';
      case 'controversial': return 'Debate Points';
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
    summaryContent.innerHTML = `
      <div class="summarizer-error">
        <span>⚠️ ${message}</span>
      </div>
    `;
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
    // Simple RTF format for .doc files
    const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} \\f0\\fs24 ${content.replace(/\n/g, '\\par ')}}`;
    this.downloadFile(rtfContent, `${title}.doc`, 'application/msword');
  }

  exportAsPDF(content, title) {
    // For now, we'll create a simple HTML version that can be printed as PDF
    // In a full implementation, you'd use a PDF library
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #333; border-bottom: 2px solid #333; }
          .summary { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="summary">${content}</div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
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
      transcriptBtn.innerHTML = '📝 Transcript';
      transcriptBtn.classList.remove('active');
      this.updateSummaryDisplay();
    } else {
      // Switch to transcript
      this.showingTranscript = true;
      this.showingChat = false; // Hide chat if showing
      const chatBtn = this.summaryContainer.querySelector('#chat-btn');
      chatBtn.innerHTML = '💬 Chat';
      chatBtn.classList.remove('active');
      
      transcriptBtn.innerHTML = '📝 Hide';
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

      // Debug: Log the transcript format
      console.log('📝 Transcript data received:', transcript);
      console.log('📝 Transcript type:', typeof transcript);
      console.log('📝 Is array:', Array.isArray(transcript));

      // Handle transcript format - should now be an array from getTranscriptSegments
      let transcriptArray = [];
      if (Array.isArray(transcript)) {
        transcriptArray = transcript;
        console.log('📝 Using transcript array directly');
      } else if (typeof transcript === 'string') {
        // If it's still a string (fallback), convert to segments
        console.log('📝 Converting string transcript to segments');
        const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
        transcriptArray = sentences.slice(0, 50).map((sentence, index) => ({
          start: index * 8,
          text: sentence.trim(),
          index: index
        }));
      } else {
        console.error('📝 Unexpected transcript format:', transcript);
        throw new Error(`Transcript is not in expected format. Received: ${typeof transcript}`);
      }

      if (transcriptArray.length === 0) {
        summaryContent.innerHTML = `
          <div class="summarizer-error">
            <span>⚠️ No transcript content found</span>
          </div>
        `;
        return;
      }

      const transcriptHtml = transcriptArray.map((segment, index) => {
        console.log('📝 Processing segment:', segment);
        
        // Get time - should already be in seconds from getTranscriptSegments
        const startTime = segment.start || segment.startTime || segment.tStartMs || segment.time || (index * 8);
        
        // If startTime is very large, it might be in milliseconds
        const timeInSeconds = startTime > 3600 ? Math.floor(startTime / 1000) : startTime;
        const timeStr = this.formatTime(timeInSeconds);
        
        // Get text content
        const text = segment.text || segment.snippet || segment.segs?.[0]?.utf8 || `Segment ${index + 1}`;
        
        return `
          <div class="transcript-segment" data-start="${timeInSeconds}">
            <span class="transcript-time" data-time="${timeStr}">${timeStr}</span>
            <span class="transcript-text">${text}</span>
          </div>
        `;
      }).join('');

      summaryContent.innerHTML = `
        <div class="transcript-display">
          <h3 class="transcript-title">📝 Video Transcript</h3>
          <div class="transcript-segments">${transcriptHtml}</div>
        </div>
      `;

      // Add click handlers for transcript timestamps
      const timeElements = summaryContent.querySelectorAll('.transcript-time');
      timeElements.forEach(timeElement => {
        timeElement.addEventListener('click', () => {
          const timeStr = timeElement.dataset.time;
          this.jumpToTime(timeStr);
        });
      });

    } catch (error) {
      console.error('📝 Error displaying transcript:', error);
      console.error('📝 Error stack:', error.stack);
      console.error('📝 Transcript data that caused error:', transcript);
      
      summaryContent.innerHTML = `
        <div class="summarizer-error">
          <span>⚠️ Failed to load transcript</span>
          <p class="error-details">${error.message}</p>
          <p style="font-size: 12px; color: #656d76; margin-top: 8px;">
            Check browser console for detailed debug information.
          </p>
        </div>
      `;
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
        <h3 class="chat-title">💬 Ask about this video</h3>
        <div class="chat-messages" id="chat-messages">
          <!-- Messages will be populated by restoreChatHistory -->
        </div>
        <div class="chat-input-container">
          <input type="text" id="chat-input" placeholder="Ask a question about the video..." 
                 class="chat-input" maxlength="200">
          <button id="send-chat" class="chat-send-btn" title="Send">
            <span class="send-icon">➤</span>
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
        this.addMessageToChat('bot', 'Sorry, I encountered an error while processing your question. Please try again.');
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
      if (e.key === 'Enter' && !e.shiftKey) {
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
      chrome.runtime.sendMessage({
        action: 'chatQuery',
        data: data
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.answer);
        }
      });
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

  removePreviousSummary() {
    if (this.summaryContainer) {
      this.summaryContainer.remove();
      this.summaryContainer = null;
    }
    this.showingTranscript = false;
    this.showingChat = false;
    this.chatHistory = []; // Clear chat history when switching videos
    this.transcriptData = null; // Clear old transcript data
    this.summaries = {}; // Clear internal cache
  }
  
  // Clear cache for specific video
  clearVideoCache(videoId) {
    console.log(`🗑️ Clearing cache for video: ${videoId}`);
    chrome.runtime.sendMessage({
      action: 'clearVideoCache',
      videoId: videoId
    }, (response) => {
      if (response && response.success) {
        console.log(`✅ Cache cleared for video: ${videoId}`);
      } else {
        console.log(`⚠️ Failed to clear cache for video: ${videoId}`);
      }
    });
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
        <div class="auth-icon">🔐</div>
        <h3>Sign In Required</h3>
        <p>Please sign in with Google to use the AI summarizer with secure backend.</p>
        <div class="auth-buttons">
          <button class="auth-btn-primary" onclick="(function(){if(window.youtubeSummarizer && window.youtubeSummarizer.initiateSignIn) {window.youtubeSummarizer.initiateSignIn();} else {console.warn('YouTubeSummarizer not loaded, opening sign-in directly'); const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'; const url = isDev ? 'http://localhost:3002/signin' : 'https://www.clicksummary.com/signin'; window.open(url, '_blank');}})();">
            <span class="btn-icon">🚀</span>
            Sign In with Google
          </button>
          <button class="auth-btn-secondary" onclick="(function(){if(window.youtubeSummarizer && window.youtubeSummarizer.openLandingPage) {window.youtubeSummarizer.openLandingPage();} else {console.warn('YouTubeSummarizer not loaded, opening landing page directly'); const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'; const url = isDev ? 'http://localhost:3002/signin' : 'https://www.clicksummary.com/signin'; window.open(url, '_blank');}})();">
            <span class="btn-icon">🌐</span>
            Go to Landing Page
          </button>
        </div>
        <p class="auth-note">
          <small>🔒 Your API keys are never exposed. All processing happens securely on our backend.</small>
        </p>
      </div>
    `;

    // Update the summary content to show sign-in prompt
    const summaryContent = this.summaryContainer.querySelector('#summary-content');
    if (summaryContent) {
      summaryContent.innerHTML = signInHTML;
    }
  }

  async initiateSignIn() {
    try {
      console.log('🔐 Initiating Google sign-in...');
      
      // For now, redirect to landing page for sign-in
      // In a full implementation, you'd integrate Google Identity Services here
      this.openLandingPage();
      
    } catch (error) {
      console.error('❌ Sign-in failed:', error);
      this.showAuthError('Sign-in failed. Please try again or use the landing page.');
    }
  }

  openLandingPage() {
    console.log('🌐 Opening landing page for sign-in...');
    
    // Environment-aware URL detection
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         navigator.userAgent.includes('Development');
    
    const landingPageUrl = isDevelopment 
      ? 'http://localhost:3002/signin'
      : 'https://www.clicksummary.com/signin';
    
    console.log(`🌍 Opening landing page (${isDevelopment ? 'DEV' : 'PROD'}): ${landingPageUrl}`);
    window.open(landingPageUrl, '_blank');
    
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
        <button class="retry-btn" onclick="(function(){if(window.youtubeSummarizer && window.youtubeSummarizer.showSignInPrompt) {window.youtubeSummarizer.showSignInPrompt();} else {console.warn('YouTubeSummarizer not loaded, opening sign-in page'); window.open('http://localhost:3002/signin', '_blank');}})();">
          Try Again
        </button>
      </div>
    `;

    const summaryContent = this.summaryContainer.querySelector('#summary-content');
    if (summaryContent) {
      summaryContent.innerHTML = errorHTML;
    }
  }

  showAuthMessage(message) {
    const messageHTML = `
      <div class="auth-message">
        <div class="message-icon">ℹ️</div>
        <h3>Action Required</h3>
        <p>${message}</p>
        <button class="refresh-btn" onclick="(function(){if(window.youtubeSummarizer && window.youtubeSummarizer.checkAndRetry) {window.youtubeSummarizer.checkAndRetry();} else {console.warn('YouTubeSummarizer not loaded, please refresh the page');}})();">
          <span class="btn-icon">🔄</span>
          I've Signed In - Try Again
        </button>
      </div>
    `;

    const summaryContent = this.summaryContainer.querySelector('#summary-content');
    if (summaryContent) {
      summaryContent.innerHTML = messageHTML;
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

