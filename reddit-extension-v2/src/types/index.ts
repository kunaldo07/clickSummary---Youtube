// Types for thread content
export interface RedditComment {
  author: string;
  content: string;
  score: number;
  depth: number;
}

export interface RedditThread {
  url: string;
  title: string;
  postContent: string;
  author: string;
  subreddit: string;
  score: number;
  comments: RedditComment[];
}

// Types for AI responses
export interface ThreadSummary {
  summary: string;
  keyPoints: string[];
  insights: string;
  practicalValue?: string;
  bottomLine?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Message types for Chrome runtime
export type MessageAction = 
  | 'analyzeThread'
  | 'chatWithThread'
  | 'getApiKey'
  | 'setApiKey';

export interface ChromeMessage {
  action: MessageAction;
  data?: any;
}

export interface ChromeResponse {
  success: boolean;
  data?: any;
  error?: string;
}
