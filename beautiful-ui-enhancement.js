// Beautiful UI Enhancement for YouTube Summarizer
// Replace the createSummaryContainer() function in content.js

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
    <div class="summarizer-card">
      <!-- Elegant Header with Logo -->
      <div class="summarizer-header">
        <div class="header-brand">
          <div class="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="brand-text">
            <h3 class="brand-title">AI Summarizer</h3>
            <p class="brand-subtitle">AI-powered summaries</p>
          </div>
        </div>
        <div class="header-badge">
          <span class="status-indicator"></span>
          <span class="status-text">Ready</span>
        </div>
      </div>

      <!-- Beautiful Control Panel -->
      <div class="control-panel">
        <div class="control-section">
          <h4 class="section-title">
            <span class="section-icon">🎯</span>
            Customize Your Summary
          </h4>
          
          <div class="control-grid">
            <div class="control-group">
              <label class="control-label">
                <span class="label-icon">🧠</span>
                Summary Type
              </label>
              <div class="select-wrapper">
                <select id="summary-type-select" class="beautiful-select">
                  <option value="insightful">💡 Insightful</option>
                  <option value="funny">😄 Funny</option>
                  <option value="actionable">⚡ Actionable</option>
                  <option value="controversial">🔥 Controversial</option>
                </select>
                <div class="select-arrow">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div class="control-group">
              <label class="control-label">
                <span class="label-icon">📋</span>
                Format
              </label>
              <div class="select-wrapper">
                <select id="format-select" class="beautiful-select">
                  <option value="list">📝 Bullet List</option>
                  <option value="qa">❓ Q&A Format</option>
                </select>
                <div class="select-arrow">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div class="control-group">
              <label class="control-label">
                <span class="label-icon">📏</span>
                Length
              </label>
              <div class="select-wrapper">
                <select id="length-select" class="beautiful-select">
                  <option value="short">⚡ Short</option>
                  <option value="auto">🎯 Auto</option>
                  <option value="detailed">📚 Detailed</option>
                </select>
                <div class="select-arrow">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Beautiful Action Buttons -->
        <div class="action-section">
          <h4 class="section-title">
            <span class="section-icon">🎮</span>
            Actions
          </h4>
          
          <div class="action-buttons">
            <button id="transcript-btn" class="action-button primary" title="Show/Hide Transcript">
              <span class="button-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor"/>
                  <path d="M14 2V8H20" stroke="white" stroke-width="2"/>
                  <path d="M16 13H8M16 17H8M10 9H8" stroke="white" stroke-width="2"/>
                </svg>
              </span>
              <span class="button-text">Transcript</span>
            </button>
            
            <button id="copy-btn" class="action-button secondary" title="Copy Summary">
              <span class="button-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                  <path d="M5 15H4C2.9 15 2 14.1 2 13V4C2 2.9 2.9 2 4 2H13C14.1 2 15 2.9 15 4V5" stroke="currentColor" stroke-width="2"/>
                </svg>
              </span>
              <span class="button-text">Copy</span>
            </button>
            
            <div class="export-dropdown">
              <button id="export-btn" class="action-button success" title="Export Options">
                <span class="button-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" stroke-width="2"/>
                    <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 15V3" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </span>
                <span class="button-text">Export</span>
                <span class="button-arrow">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </span>
              </button>
              
              <div id="export-menu" class="export-menu" style="display: none;">
                <div class="export-section">
                  <div class="export-section-title">
                    <span class="section-icon">📋</span>
                    Copy
                  </div>
                  <button class="export-option" data-action="copy-link">
                    <span class="option-icon">🔗</span>
                    Video Link
                  </button>
                  <button class="export-option" data-action="copy-text">
                    <span class="option-icon">📝</span>
                    Summary Text
                  </button>
                </div>
                <div class="export-divider"></div>
                <div class="export-section">
                  <div class="export-section-title">
                    <span class="section-icon">💾</span>
                    Export File
                  </div>
                  <button class="export-option" data-action="export-txt">
                    <span class="option-icon">📄</span>
                    Text (.txt)
                  </button>
                  <button class="export-option" data-action="export-doc">
                    <span class="option-icon">📘</span>
                    Word (.doc)
                  </button>
                  <button class="export-option" data-action="export-pdf">
                    <span class="option-icon">📕</span>
                    PDF (.pdf)
                  </button>
                  <button class="export-option" data-action="export-markdown">
                    <span class="option-icon">📓</span>
                    Markdown (.md)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Elegant Summary Display -->
      <div class="summary-display">
        <div class="summary-header">
          <div class="summary-title">
            <span class="title-icon">✨</span>
            <h4>AI-Generated Summary</h4>
          </div>
          <div class="summary-stats">
            <span class="stat-item">
              <span class="stat-icon">⚡</span>
              <span class="stat-text">Processing...</span>
            </span>
          </div>
        </div>
        
        <div id="summary-content" class="summary-content">
          <div class="beautiful-loading">
            <div class="loading-animation">
              <div class="loading-brain">🧠</div>
              <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div class="loading-text">
              <h4>AI is analyzing your video...</h4>
              <p>This will take just a few seconds</p>
            </div>
            <div class="loading-progress">
              <div class="progress-bar"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Insert at the top of secondary content
  secondaryInfo.insertBefore(this.summaryContainer, secondaryInfo.firstChild);

  this.attachEventListeners();
}
