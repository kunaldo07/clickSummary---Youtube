import React, { useState, useCallback, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { Panel } from './components/Panel';
import { ThreadSummary, ChatMessage, ChromeMessage, ChromeResponse } from '../types';

// Get a unique key for the current thread
const getThreadKey = () => {
  const url = window.location.href;
  const match = url.match(/\/comments\/([^/]+)/);
  return match ? `thread_${match[1]}` : 'thread_unknown';
};

export const App: React.FC = () => {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [summary, setSummary] = useState<ThreadSummary | undefined>();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState('gpt-4o-mini');
  const [currentMode, setCurrentMode] = useState<'summary' | 'chat'>('summary');

  // Load persisted state on mount
  useEffect(() => {
    const threadKey = getThreadKey();
    chrome.storage.local.get([threadKey], (result) => {
      const savedData = result[threadKey];
      if (savedData) {
        console.log('📦 Loading saved state for thread:', threadKey);
        if (savedData.summary) {
          setSummary(savedData.summary);
          setState('success');
        }
        if (savedData.chatMessages) {
          setChatMessages(savedData.chatMessages);
        }
        if (savedData.mode) {
          setCurrentMode(savedData.mode);
        }
      }
    });
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (state === 'success' && (summary || chatMessages.length > 0)) {
      const threadKey = getThreadKey();
      const dataToSave = {
        summary,
        chatMessages,
        mode: currentMode,
        timestamp: Date.now(),
      };
      chrome.storage.local.set({ [threadKey]: dataToSave }, () => {
        console.log('💾 Saved state for thread:', threadKey);
      });
    }
  }, [summary, chatMessages, currentMode, state]);

  const handleAnalyze = useCallback(async (model: string, mode: 'summary' | 'chat', language: string) => {
    setCurrentModel(model);
    setCurrentMode(mode);
    setError('');

    // If switching to chat, show panel immediately with input ready
    if (mode === 'chat') {
      setState('success'); // Show panel with chat input
      return;
    }

    setState('loading');
    
    try {
      const message: ChromeMessage = {
        action: 'analyzeThread',
        data: { model, mode, language },
      };

      const response = await chrome.runtime.sendMessage(message) as ChromeResponse;

      if (response.success) {
        setSummary(response.data);
        setState('success');
      } else {
        throw new Error(response.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      
      let errorMessage = 'Unknown error occurred';
      
      if (err instanceof Error) {
        if (err.message.includes('Extension context invalidated')) {
          errorMessage = 'Extension was reloaded. Please refresh this page to continue.';
        } else if (err.message.includes('monthly limit')) {
          // Usage limit error - show as-is (already has upgrade link)
          errorMessage = err.message;
        } else if (err.message.includes('sign in')) {
          // Auth error
          errorMessage = err.message;
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setState('error');
    }
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const chromeMessage: ChromeMessage = {
        action: 'chatWithThread',
        data: {
          message,
          model: currentModel,
          conversationHistory: chatMessages,
        },
      };

      const response = await chrome.runtime.sendMessage(chromeMessage) as ChromeResponse;

      if (response.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.data,
          timestamp: Date.now(),
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.error || 'Chat failed');
      }
    } catch (err) {
      console.error('Chat error:', err);
      
      let errorContent = '❌ Sorry, I encountered an error. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('Extension context invalidated')) {
          errorContent = '❌ Extension was reloaded. Please refresh this page to continue.';
        } else if (err.message.includes('monthly limit')) {
          // Usage limit error - show the full message with upgrade link
          errorContent = `❌ ${err.message}`;
        } else if (err.message.includes('sign in')) {
          // Auth error
          errorContent = `❌ ${err.message}`;
        } else {
          errorContent = `❌ ${err.message}`;
        }
      }
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: errorContent,
        timestamp: Date.now(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  }, [currentModel, chatMessages]);

  const handleRetry = useCallback(() => {
    handleAnalyze(currentModel, currentMode, 'en');
  }, [currentModel, currentMode, handleAnalyze]);

  // Show panel when:
  // 1. Summary mode and not idle
  // 2. Chat mode is active (show immediately with input)
  const showPanel = state !== 'idle';

  const handleClosePanel = useCallback(() => {
    setState('idle');
  }, []);

  return (
    <>
      <Toolbar
        onAnalyze={handleAnalyze}
        isLoading={state === 'loading'}
        currentMode={currentMode}
      />
      {showPanel && (
        <Panel
          state={state}
          summary={summary}
          chatMessages={chatMessages}
          error={error}
          onSendMessage={handleSendMessage}
          onRetry={handleRetry}
          onClose={handleClosePanel}
          isChatLoading={isChatLoading}
          mode={currentMode}
        />
      )}
    </>
  );
};
