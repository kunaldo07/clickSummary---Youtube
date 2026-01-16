/**
 * CSS styles for the toolbar and panel (injected into Shadow DOM)
 */
export const toolbarStyles = `
  :host {
    all: initial;
    display: block;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  .reddit-ai-toolbar {
    width: 100%;
    background: #ffffff;
    border: 1px solid #e1e4e8;
    border-radius: 12px;
    padding: 10px 20px;
    margin: 16px auto;
    max-width: 1280px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    animation: slideDown 0.3s ease-out;
  }

  .toolbar-brand-group {
    display: flex;
    align-items: center;
  }

  .toolbar-label {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .toolbar-label img {
    width: 28px;
    height: 28px;
    object-fit: contain;
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
    color: #1a1a1b;
    letter-spacing: -0.3px;
  }

  .brand-tagline {
    font-size: 11px;
    color: #878a8c;
    font-weight: 500;
  }

  .toolbar-buttons {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .language-selector {
    padding: 8px 12px;
    border: 1px solid #edeff1;
    border-radius: 20px;
    background: #f6f7f8;
    font-size: 13px;
    font-weight: 600;
    color: #1a1a1b;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 110px;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a1a1b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 8px;
    padding-right: 30px;
  }

  .language-selector:hover {
    background-color: #eef1f3;
    border-color: #dae0e6;
  }

  .language-selector:focus {
    outline: none;
    border-color: #0079d3;
    box-shadow: 0 0 0 2px rgba(0, 121, 211, 0.2);
  }

  .toolbar-btn {
    padding: 8px 18px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 36px;
  }

  .toolbar-btn.secondary {
    background: #ffffff;
    border: 1px solid #d3d3d3;
    color: #1a1a1b;
  }

  .toolbar-btn.secondary:hover {
    background: #f6f7f8;
    border-color: #1a1a1b;
    transform: translateY(-1px);
  }

  .toolbar-btn.secondary.active {
    background: #0079d3;
    border-color: #0079d3;
    color: #ffffff;
  }

  .toolbar-btn.primary-cta {
    background: #FF4500;
    border: 1px solid #FF4500;
    color: #ffffff;
    box-shadow: 0 2px 4px rgba(255, 69, 0, 0.3);
  }

  .toolbar-btn.primary-cta:hover {
    background: #ff5414;
    border-color: #ff5414;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(255, 69, 0, 0.4);
  }

  .toolbar-btn.primary-cta:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(255, 69, 0, 0.3);
  }


  .toolbar-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .toolbar-btn.loading {
    position: relative;
    color: transparent;
    pointer-events: none;
  }

  .toolbar-btn.loading::after {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    top: 50%;
    left: 50%;
    margin: -7px 0 0 -7px;
    border: 2px solid #e1e4e8;
    border-radius: 50%;
    border-top-color: #0366d6;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Panel Styles */
  .reddit-ai-panel {
    width: 100%;
    background: #ffffff;
    border: 1px solid #e1e4e8;
    border-radius: 8px;
    margin: 12px auto;
    max-width: 1280px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    animation: slideDown 0.3s ease-out;
    overflow: hidden;
    position: relative;
  }

  .panel-close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    color: #878a8c;
    font-size: 24px;
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
    background: #f6f7f8;
    color: #1a1a1b;
  }

  /* Summary scroll container */
  .summary-scroll-container {
    max-height: 400px;
    overflow-y: auto;
    border-bottom: 1px solid #e1e4e8;
  }

  .summary-scroll-container::-webkit-scrollbar {
    width: 8px;
  }

  .summary-scroll-container::-webkit-scrollbar-track {
    background: #f6f8fa;
    border-radius: 4px;
  }

  .summary-scroll-container::-webkit-scrollbar-thumb {
    background: #d1d5da;
    border-radius: 4px;
  }

  .summary-scroll-container::-webkit-scrollbar-thumb:hover {
    background: #959da5;
  }

  .panel-content {
    padding: 24px;
  }

  .panel-section {
    margin-bottom: 24px;
  }

  .panel-section:last-child {
    margin-bottom: 0;
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #24292e;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .section-content {
    font-size: 14px;
    line-height: 1.6;
    color: #1c1c1c;
  }

  .key-points-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .key-points-list li {
    padding: 8px 0;
    padding-left: 24px;
    position: relative;
  }

  .key-points-list li::before {
    content: '▸';
    position: absolute;
    left: 0;
    color: #0079d3;
    font-weight: bold;
  }

  .bottom-line-section {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;
    border-left: 4px solid #FF4500;
  }

  .bottom-line {
    font-weight: 600;
    font-size: 15px;
    color: #1a1a1b;
    line-height: 1.5;
  }

  /* Chat Section */
  .chat-section {
    padding: 24px;
  }

  .chat-empty-state {
    text-align: center;
    padding: 60px 24px;
    color: #878a8c;
  }

  .chat-empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.6;
  }

  .chat-empty-state h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1b;
    margin-bottom: 8px;
  }

  .chat-empty-state p {
    font-size: 14px;
    color: #878a8c;
    margin-bottom: 24px;
    line-height: 1.5;
  }

  .chat-messages {
    max-height: 350px;
    min-height: 350px;
    overflow-y: auto;
    margin-bottom: 16px;
  }

  .chat-messages::-webkit-scrollbar {
    width: 8px;
  }

  .chat-messages::-webkit-scrollbar-track {
    background: #f6f7f8;
    border-radius: 4px;
  }

  .chat-messages::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }

  .chat-message {
    margin-bottom: 16px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    animation: fadeIn 0.2s ease-out;
  }

  .chat-message.user {
    flex-direction: row-reverse;
  }

  .chat-message.assistant {
    flex-direction: row;
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
  }

  .chat-message.user .chat-message-avatar {
    background: #0366d6;
    color: white;
  }

  .chat-message.assistant .chat-message-avatar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .chat-message-bubble {
    max-width: 80%;
    padding: 12px 16px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.5;
  }

  .chat-message.user .chat-message-bubble {
    background: #0366d6;
    color: #ffffff;
    border-bottom-right-radius: 4px;
  }

  .chat-message.assistant .chat-message-bubble {
    background: #f6f8fa;
    color: #24292e;
    border: 1px solid #e1e4e8;
    border-bottom-left-radius: 4px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .chat-message-role {
    display: none;
  }

  .chat-message-content {
    font-size: 14px;
    line-height: 1.5;
  }

  .chat-input-container {
    display: flex;
    gap: 8px;
  }

  .chat-input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #d1d5da;
    border-radius: 24px;
    font-size: 14px;
    color: #24292e;
    transition: all 0.2s;
    background: #ffffff;
  }

  .chat-input::placeholder {
    color: #959da5;
  }

  .chat-input:focus {
    outline: none;
    border-color: #0366d6;
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
  }

  .chat-send-btn {
    width: 40px;
    height: 40px;
    padding: 0;
    background: #0366d6;
    color: #fff;
    border: none;
    border-radius: 50%;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .chat-send-btn:hover {
    background: #0256c7;
    transform: scale(1.05);
  }

  .chat-send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  /* Loading State */
  .loading-state {
    text-align: center;
    padding: 48px 24px;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #edeff1;
    border-top-color: #0079d3;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }

  .loading-text {
    font-size: 14px;
    color: #7c7c7c;
  }

  /* Error State */
  .error-state {
    text-align: center;
    padding: 48px 24px;
  }

  .error-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .error-title {
    font-size: 18px;
    font-weight: 700;
    color: #ea0027;
    margin-bottom: 8px;
  }

  .error-message {
    font-size: 14px;
    color: #d73a49;
    margin-bottom: 16px;
    line-height: 1.5;
  }

  .error-message strong {
    font-weight: 600;
  }

  .retry-btn {
    padding: 8px 20px;
    background: #0366d6;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .retry-btn:hover {
    background: #0256c7;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .reddit-ai-toolbar,
    .reddit-ai-panel {
      background: #1a1a1b;
      border-color: #343536;
    }

    .toolbar-label,
    .section-title,
    .section-content,
    .chat-message-content {
      color: #d7dadc;
    }

    .model-selector,
    .toolbar-btn {
      background: #1a1a1b;
      color: #d7dadc;
      border-color: #343536;
    }

    .toolbar-btn:hover {
      background: #272729;
    }

    .toolbar-btn.primary {
      background: #0079d3;
      color: #fff;
    }

    .chat-message.user {
      background: #272729;
    }

    .chat-message.assistant {
      background: #0d3b66;
    }

    .chat-input {
      background: #1a1a1b;
      color: #d7dadc;
      border-color: #343536;
    }
  }
`;
