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
export interface NotableComment {
  type: 'main_insight' | 'criticism' | 'advice';
  summary: string;
  quote?: string;
}

export interface CommunitySentiment {
  supportive: string;
  skeptical: string;
  neutral?: string;
}

export interface ThreadSummary {
  // New structure
  threadSummary?: string;
  keyPoints: string[];
  communitySentiment?: CommunitySentiment;
  notableComments?: NotableComment[];
  practicalTakeaways?: string[];
  bottomLine?: string;
  // Legacy fields for backwards compatibility
  summary?: string;
  insights?: string;
  practicalValue?: string;
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
