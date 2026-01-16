import React from 'react';
import { ThreadSummary, ChatMessage } from '../../types';
import { SummaryView } from './SummaryView';
import { ChatView } from './ChatView';

interface PanelProps {
  state: 'idle' | 'loading' | 'success' | 'error';
  summary?: ThreadSummary;
  chatMessages: ChatMessage[];
  error?: string;
  onSendMessage: (message: string) => void;
  onRetry: () => void;
  onClose: () => void;
  isChatLoading: boolean;
  mode: 'summary' | 'chat';
}

export const Panel: React.FC<PanelProps> = ({
  state,
  summary,
  chatMessages,
  error,
  onSendMessage,
  onRetry,
  onClose,
  isChatLoading,
  mode,
}) => {
  if (state === 'idle') {
    return null;
  }

  return (
    <div className="reddit-ai-panel">
      <button className="panel-close-btn" onClick={onClose} aria-label="Close">
        ×
      </button>

      {state === 'loading' && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p className="loading-text">Analyzing thread with AI...</p>
        </div>
      )}

      {state === 'error' && (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3 className="error-title">Analysis Failed</h3>
          <p className="error-message">{error || 'Something went wrong'}</p>
          <button className="retry-btn" onClick={onRetry}>
            Try Again
          </button>
        </div>
      )}

      {state === 'success' && (
        <>
          {mode === 'summary' && summary && <SummaryView summary={summary} />}
          {mode === 'chat' && (
            <div className="panel-content">
              <ChatView
                messages={chatMessages}
                onSendMessage={onSendMessage}
                isLoading={isChatLoading}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
