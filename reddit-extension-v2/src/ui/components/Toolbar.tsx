import React, { useState } from 'react';
import { CONFIG } from '../../utils/config';

interface ToolbarProps {
  onAnalyze: (model: string, mode: 'summary' | 'chat', language: string) => void;
  isLoading: boolean;
  currentMode?: 'summary' | 'chat';
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAnalyze, isLoading, currentMode }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(CONFIG.DEFAULT_LANGUAGE);

  const handleModeClick = (mode: 'summary' | 'chat') => {
    if (isLoading) return;
    onAnalyze(CONFIG.DEFAULT_MODEL, mode, selectedLanguage);
  };

  return (
    <div className="reddit-ai-toolbar">
      <div className="toolbar-brand-group">
        <div className="toolbar-label">
          <img 
            src={chrome.runtime.getURL('icons/reddit48.png')} 
            alt="Reddit AI" 
            style={{ width: '24px', height: '24px' }}
          />
          <div className="brand-text">
            <span className="brand-name">AI Reddit Post Analyzer</span>
            <span className="brand-tagline">Save time reading</span>
          </div>
        </div>
      </div>

      <div className="toolbar-buttons">
        <select
          className="language-selector"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          disabled={isLoading}
        >
          {CONFIG.LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        
        <button
          className={`toolbar-btn secondary ${currentMode === 'chat' ? 'active' : ''}`}
          onClick={() => handleModeClick('chat')}
          disabled={isLoading}
        >
          💬 Ask AI
        </button>
        
        <button
          className={`toolbar-btn primary-cta ${isLoading ? 'loading' : ''} ${currentMode === 'summary' ? 'active' : ''}`}
          onClick={() => handleModeClick('summary')}
          disabled={isLoading}
        >
          ⚡ Summarize
        </button>
      </div>
    </div>
  );
};
