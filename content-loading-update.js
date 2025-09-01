// Enhanced Loading Functions to Replace in content.js

// Replace the existing updateSummaryDisplay function
updateSummaryDisplay() {
  const summaryContent = this.summaryContainer.querySelector('#summary-content');
  
  if (this.summaries && this.summaries[this.currentSummaryType] && this.summaries[this.currentSummaryType][this.currentLength]) {
    const summary = this.summaries[this.currentSummaryType][this.currentLength];
    
    if (this.currentFormat === 'qa') {
      summaryContent.innerHTML = this.formatAsQA(summary);
    } else {
      summaryContent.innerHTML = this.formatAsTimestampedList(summary);
    }
  } else {
    // Show enhanced loading state
    this.showEnhancedLoadingState(summaryContent);
    
    // Generate the summary if it doesn't exist
    this.generateSummaryIfNeeded();
  }
}

// New function: Show enhanced loading state
showEnhancedLoadingState(container) {
  const summaryType = this.currentSummaryType;
  const format = this.currentFormat;
  const length = this.currentLength;
  
  container.innerHTML = `
    <div class="loading-summary">
      <div class="ai-processing">
        <div class="ai-brain">🧠</div>
        <div class="loading-text">AI Processing</div>
      </div>
      
      <div class="loading-progress">
        <div class="loading-progress-bar"></div>
      </div>
      
      <div class="loading-steps">
        <div class="loading-step active" id="step-extract">
          <div class="loading-step-icon">1</div>
          <span>Extracting video content</span>
        </div>
        <div class="loading-step" id="step-analyze">
          <div class="loading-step-icon">2</div>
          <span>Analyzing with AI</span>
        </div>
        <div class="loading-step" id="step-format">
          <div class="loading-step-icon">3</div>
          <span>Formatting summary</span>
        </div>
        <div class="loading-step" id="step-complete">
          <div class="loading-step-icon">4</div>
          <span>Ready to display</span>
        </div>
      </div>
      
      <div class="loading-message ${summaryType}"></div>
      <div class="loading-format-specific ${format}"></div>
      
      <div class="loading-details">
        <small>Type: <strong>${this.capitalizeFirst(summaryType)}</strong> • Format: <strong>${format.toUpperCase()}</strong> • Length: <strong>${this.capitalizeFirst(length)}</strong></small>
      </div>
    </div>
  `;
  
  // Start the loading animation sequence
  this.animateLoadingSteps();
}

// New function: Animate loading steps
animateLoadingSteps() {
  const steps = ['step-extract', 'step-analyze', 'step-format', 'step-complete'];
  let currentStep = 0;
  
  // Clear any existing interval
  if (this.loadingStepInterval) {
    clearInterval(this.loadingStepInterval);
  }
  
  const stepInterval = setInterval(() => {
    if (currentStep < steps.length) {
      const currentStepEl = document.getElementById(steps[currentStep]);
      const nextStepEl = document.getElementById(steps[currentStep + 1]);
      
      if (currentStepEl) {
        currentStepEl.classList.remove('active');
        currentStepEl.classList.add('completed');
      }
      
      if (nextStepEl && currentStep < steps.length - 1) {
        nextStepEl.classList.add('active');
      }
      
      currentStep++;
      
      if (currentStep >= steps.length) {
        clearInterval(stepInterval);
        this.loadingStepInterval = null;
      }
    }
  }, 800); // Each step takes ~800ms
  
  // Store interval reference for cleanup
  this.loadingStepInterval = stepInterval;
}

// New function: Generate summary if needed (lazy loading)
async generateSummaryIfNeeded() {
  const type = this.currentSummaryType;
  const length = this.currentLength;
  
  if (!this.summaries[type] || !this.summaries[type][length]) {
    try {
      if (!this.summaries[type]) {
        this.summaries[type] = {};
      }
      
      const summary = await this.getSummaryByTypeWithProgress(type, length);
      this.summaries[type][length] = summary;
      
      // Update display once summary is generated
      setTimeout(() => {
        this.updateSummaryDisplay();
      }, 1000); // Small delay to show completion animation
    } catch (error) {
      console.error(`Failed to generate ${type} ${length} summary:`, error);
      this.showErrorState(error.message);
    }
  }
}

// Enhanced getSummaryByType with progress tracking
async getSummaryByTypeWithProgress(type, length) {
  const data = {
    transcript: this.transcriptData,
    comments: this.commentsData,
    type: type,
    length: length,
    format: this.currentFormat,
    videoId: this.currentVideoId
  };

  // Update loading step to "analyzing"
  setTimeout(() => {
    const analyzeStep = document.getElementById('step-analyze');
    if (analyzeStep) {
      const extractStep = document.getElementById('step-extract');
      if (extractStep) {
        extractStep.classList.remove('active');
        extractStep.classList.add('completed');
      }
      analyzeStep.classList.add('active');
    }
  }, 600);

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      action: 'summarizeAdvanced',
      data: data
    }, (response) => {
      // Update loading step to "formatting"
      setTimeout(() => {
        const formatStep = document.getElementById('step-format');
        const analyzeStep = document.getElementById('step-analyze');
        if (formatStep && analyzeStep) {
          analyzeStep.classList.remove('active');
          analyzeStep.classList.add('completed');
          formatStep.classList.add('active');
          
          setTimeout(() => {
            formatStep.classList.remove('active');
            formatStep.classList.add('completed');
            
            const completeStep = document.getElementById('step-complete');
            if (completeStep) {
              completeStep.classList.add('active');
              setTimeout(() => {
                completeStep.classList.remove('active');
                completeStep.classList.add('completed');
              }, 500);
            }
          }, 800);
        }
      }, 200);
      
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response.summary);
      }
    });
  });
}

// New function: Show error state
showErrorState(errorMessage) {
  const summaryContent = this.summaryContainer.querySelector('#summary-content');
  summaryContent.innerHTML = `
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <div class="error-title">Failed to Generate Summary</div>
      <div class="error-message">${errorMessage}</div>
      <button onclick="window.location.reload()" class="retry-btn">
        🔄 Refresh Page
      </button>
    </div>
  `;
}

// New function: Capitalize first letter
capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Enhanced attachEventListeners function
attachEventListeners() {
  // Summary Type dropdown
  const summaryTypeSelect = this.summaryContainer.querySelector('#summary-type-select');
  summaryTypeSelect.addEventListener('change', (e) => {
    this.currentSummaryType = e.target.value;
    console.log(`🎭 Summary type changed to: ${this.currentSummaryType} - clearing cache`);
    
    // Add loading class to dropdown
    summaryTypeSelect.classList.add('dropdown-loading');
    
    // Clear cache and show loading
    chrome.runtime.sendMessage({ action: 'clearCache' });
    this.updateSummaryDisplay();
    
    // Remove loading class after a delay
    setTimeout(() => {
      summaryTypeSelect.classList.remove('dropdown-loading');
    }, 1500);
  });

  // Format dropdown
  const formatSelect = this.summaryContainer.querySelector('#format-select');
  formatSelect.addEventListener('change', (e) => {
    this.currentFormat = e.target.value;
    console.log(`📋 Format changed to: ${this.currentFormat} - clearing cache`);
    
    formatSelect.classList.add('dropdown-loading');
    chrome.runtime.sendMessage({ action: 'clearCache' });
    this.updateSummaryDisplay();
    
    setTimeout(() => {
      formatSelect.classList.remove('dropdown-loading');
    }, 1200);
  });

  // Length dropdown
  const lengthSelect = this.summaryContainer.querySelector('#length-select');
  lengthSelect.addEventListener('change', (e) => {
    this.currentLength = e.target.value;
    console.log(`📏 Length changed to: ${this.currentLength} - clearing cache to ensure new generation`);
    
    lengthSelect.classList.add('dropdown-loading');
    chrome.runtime.sendMessage({ action: 'clearCache' });
    this.updateSummaryDisplay();
    
    setTimeout(() => {
      lengthSelect.classList.remove('dropdown-loading');
    }, 1800);
  });
  
  // Transcript button
  const transcriptBtn = this.summaryContainer.querySelector('#transcript-btn');
  transcriptBtn.addEventListener('click', () => {
    transcriptBtn.classList.add('btn-loading');
    
    setTimeout(() => {
      this.toggleTranscript();
      transcriptBtn.classList.remove('btn-loading');
    }, 600);
  });

  // Copy button
  const copyBtn = this.summaryContainer.querySelector('#copy-btn');
  copyBtn.addEventListener('click', () => {
    copyBtn.classList.add('btn-loading');
    
    setTimeout(() => {
      this.copySummaryToClipboard();
      copyBtn.classList.remove('btn-loading');
    }, 400);
  });

  // Export button
  const exportBtn = this.summaryContainer.querySelector('#export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportBtn.classList.add('btn-loading');
      
      setTimeout(() => {
        exportBtn.classList.remove('btn-loading');
      }, 500);
    });
  }
}

// Enhanced generateAllSummaries function
async generateAllSummaries() {
  console.log('🤖 Generating summaries for all combinations...');
  this.summaries = {};
  
  // Show initial loading state
  this.updateSummaryDisplay();
  
  const summaryTypes = ['insightful', 'funny', 'actionable', 'controversial'];
  const lengths = ['short', 'auto', 'detailed'];
  
  for (const type of summaryTypes) {
    this.summaries[type] = {};
    for (const length of lengths) {
      try {
        // Only generate if this is the current selection to save API calls
        if (type === this.currentSummaryType && length === this.currentLength) {
          const summary = await this.getSummaryByTypeWithProgress(type, length);
          this.summaries[type][length] = summary;
          
          // Update display immediately for current selection
          this.updateSummaryDisplay();
        } else {
          // Placeholder for other combinations (lazy loading)
          this.summaries[type][length] = null;
        }
      } catch (error) {
        console.error(`Failed to generate ${type} ${length} summary:`, error);
        this.summaries[type][length] = `⚠️ Failed to generate ${type} summary: ${error.message}`;
      }
    }
  }
}

// Cleanup function for loading intervals
cleanupLoadingAnimations() {
  if (this.loadingStepInterval) {
    clearInterval(this.loadingStepInterval);
    this.loadingStepInterval = null;
  }
}
