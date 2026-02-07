/**
 * CSS styles for the toolbar and panel (injected into Shadow DOM)
 * Premium UI Design - Indigo/Violet Theme
 */
export const toolbarStyles = `
  :host {
    all: initial;
    display: block;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    --primary: #6366f1; /* Indigo 500 */
    --primary-hover: #4f46e5; /* Indigo 600 */
    --primary-light: #e0e7ff; /* Indigo 100 */
    --bg-surface: #ffffff;
    --bg-subtle: #f9fafb;
    --bg-hover: #f3f4f6;
    --text-main: #111827;
    --text-secondary: #6b7280;
    --text-tertiary: #9ca3af;
    --border: #e5e7eb;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-full: 9999px;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  }

  * {
    box-sizing: border-box;
  }

  /* Toolbar Container */
  .reddit-ai-toolbar {
    width: 100%;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 12px 20px;
    margin: 16px auto;
    max-width: 1280px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    box-shadow: var(--shadow-md);
    animation: slideDown 0.3s ease-out;
    transition: all 0.2s ease;
  }

  .reddit-ai-toolbar:hover {
    box-shadow: var(--shadow-lg);
    border-color: #d1d5db;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Branding */
  .toolbar-brand-group {
    display: flex;
    align-items: center;
  }

  .toolbar-label {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .toolbar-label img {
    width: 32px;
    height: 32px;
    object-fit: contain;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  }

  .brand-text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    line-height: 1.2;
  }

  .brand-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-main);
    letter-spacing: -0.01em;
  }

  .brand-tagline {
    font-size: 12px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  /* Controls Group */
  .toolbar-buttons {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  /* Language Selector */
  .language-selector {
    padding: 8px 32px 8px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg-surface);
    font-size: 13px;
    font-weight: 500;
    color: var(--text-main);
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 120px;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 16px;
  }

  .language-selector:hover {
    background-color: var(--bg-hover);
    border-color: #d1d5db;
  }

  .language-selector:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  /* Buttons */
  .toolbar-btn {
    padding: 8px 16px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 38px;
    border: 1px solid transparent;
  }

  /* Secondary Button (Ask AI) */
  .toolbar-btn.secondary {
    background: var(--bg-surface);
    border-color: var(--border);
    color: var(--text-main);
    box-shadow: var(--shadow-sm);
  }

  .toolbar-btn.secondary:hover {
    background: var(--bg-hover);
    border-color: #d1d5db;
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .toolbar-btn.secondary.active {
    background: var(--primary-light);
    border-color: var(--primary);
    color: var(--primary);
  }

  /* Primary CTA (Summarize) */
  .toolbar-btn.primary-cta {
    background: linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    border: none;
  }

  .toolbar-btn.primary-cta:hover {
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
  }

  .toolbar-btn.primary-cta:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
  }

  .toolbar-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }

  /* Loading State for Buttons */
  .toolbar-btn.loading {
    position: relative;
    color: transparent;
    pointer-events: none;
  }

  .toolbar-btn.loading::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    top: 50%;
    left: 50%;
    margin: -8px 0 0 -8px;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: #ffffff;
    animation: spin 0.6s linear infinite;
  }

  /* Panel Styles */
  .reddit-ai-panel {
    width: 100%;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    margin: 16px auto;
    max-width: 1280px;
    box-shadow: var(--shadow-lg);
    animation: slideDown 0.3s ease-out;
    overflow: hidden;
    position: relative;
  }

  .panel-close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    color: var(--text-tertiary);
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
    z-index: 10;
  }

  .panel-close-btn:hover {
    background: var(--bg-hover);
    color: var(--text-main);
  }

  /* Content Containers */
  .panel-content {
    padding: 24px;
  }

  /* Summary View */
  .summary-scroll-container {
    max-height: 500px;
    overflow-y: auto;
    padding: 0;
  }

  .section-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .section-title::before {
    content: '';
    display: block;
    width: 4px;
    height: 16px;
    background: var(--primary);
    border-radius: 2px;
  }

  .section-content {
    font-size: 15px;
    line-height: 1.6;
    color: var(--text-secondary);
  }

  /* Key Points */
  .key-points-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .key-points-list li {
    padding: 12px 16px;
    background: var(--bg-subtle);
    border-radius: var(--radius-md);
    border-left: 3px solid var(--primary);
    font-size: 14px;
    color: var(--text-main);
    line-height: 1.5;
  }

  /* Panel Section Spacing */
  .panel-section {
    margin-bottom: 24px;
  }

  .panel-section:last-child {
    margin-bottom: 0;
  }

  /* Community Sentiment */
  .sentiment-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .sentiment-item {
    padding: 14px 16px;
    border-radius: var(--radius-md);
    border-left: 3px solid;
  }

  .sentiment-item.supportive {
    background: #f0fdf4;
    border-left-color: #22c55e;
  }

  .sentiment-item.skeptical {
    background: #fef3c7;
    border-left-color: #f59e0b;
  }

  .sentiment-item.neutral {
    background: var(--bg-subtle);
    border-left-color: var(--text-tertiary);
  }

  .sentiment-label {
    font-weight: 600;
    font-size: 13px;
    color: var(--text-main);
    display: block;
    margin-bottom: 6px;
  }

  .sentiment-item p {
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-secondary);
    margin: 0;
  }

  /* Notable Comments */
  .notable-comments {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .notable-comment {
    display: flex;
    gap: 12px;
    padding: 14px 16px;
    background: var(--bg-subtle);
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
  }

  .notable-comment .comment-type {
    font-size: 20px;
    flex-shrink: 0;
  }

  .notable-comment .comment-content {
    flex: 1;
  }

  .notable-comment .comment-summary {
    font-size: 14px;
    color: var(--text-main);
    line-height: 1.5;
    margin: 0 0 8px 0;
  }

  .notable-comment .comment-quote {
    font-size: 13px;
    font-style: italic;
    color: var(--text-secondary);
    margin: 0;
    padding-left: 12px;
    border-left: 2px solid var(--primary);
  }

  /* Bottom Line */
  .bottom-line-section {
    background: linear-gradient(135deg, var(--bg-subtle) 0%, #ffffff 100%);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    margin-top: 24px;
    box-shadow: var(--shadow-sm);
  }
  
  .bottom-line-section .section-title {
    color: var(--primary);
  }

  .bottom-line {
    font-weight: 600;
    font-size: 16px;
    color: var(--text-main);
    line-height: 1.5;
  }

  /* Chat View */
  .chat-section {
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 500px;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: var(--bg-subtle);
  }

  .chat-message {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    max-width: 85%;
    animation: fadeIn 0.2s ease-out;
  }

  .chat-message.user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  .chat-message.assistant {
    align-self: flex-start;
  }

  .chat-message-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 16px;
    box-shadow: var(--shadow-sm);
    background: white;
    border: 1px solid var(--border);
  }
  
  .chat-message.user .chat-message-avatar {
    background: var(--primary);
    color: white;
    border: none;
  }

  .chat-message-bubble {
    padding: 12px 16px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.5;
    position: relative;
    box-shadow: var(--shadow-sm);
  }

  .chat-message.user .chat-message-bubble {
    background: var(--primary);
    color: white;
    border-bottom-right-radius: 4px;
  }

  .chat-message.assistant .chat-message-bubble {
    background: white;
    color: var(--text-main);
    border: 1px solid var(--border);
    border-bottom-left-radius: 4px;
  }

  /* Input Area */
  .chat-input-container {
    padding: 16px 24px;
    background: white;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .chat-input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    font-size: 14px;
    color: var(--text-main);
    transition: all 0.2s;
    background: var(--bg-subtle);
  }

  .chat-input:focus {
    outline: none;
    border-color: var(--primary);
    background: white;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .chat-send-btn {
    width: 42px;
    height: 42px;
    padding: 0;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: var(--shadow-sm);
  }

  .chat-send-btn:hover {
    background: var(--primary-hover);
    transform: scale(1.05);
    box-shadow: var(--shadow-md);
  }

  .chat-send-btn:disabled {
    background: var(--bg-hover);
    color: var(--text-tertiary);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* Loading & Error States */
  .loading-state, .error-state {
    text-align: center;
    padding: 60px 24px;
    color: var(--text-secondary);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--bg-hover);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }

  .error-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .retry-btn {
    padding: 8px 24px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    margin-top: 16px;
  }
  
  .retry-btn:hover {
    background: var(--primary-hover);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 10px;
    border: 2px solid transparent;
    background-clip: content-box;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
`;
