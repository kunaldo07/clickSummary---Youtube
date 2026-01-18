import React from 'react';
import YouTubePageClient from './YouTubePageClient';

export const metadata = {
  title: 'YouTube Summarizer - AI-Powered Video Insights | ClickSummary',
  description: 'Summarize YouTube videos instantly with AI. Get key insights, chat with video content, and search transcripts. Save time watching long videos.',
  openGraph: {
    title: 'YouTube Summarizer - AI-Powered Video Insights',
    description: 'Summarize YouTube videos instantly with AI. Save time watching long videos.',
  }
};

export default function YouTubePage() {
  return <YouTubePageClient />;
}
