import React from 'react';
import RedditPageClient from './RedditPageClient';

export const metadata = {
  title: 'Reddit Post Analyzer - AI-Powered Insights',
  description: 'Instantly analyze Reddit posts and comments with AI. Get sentiment analysis, key insights, and smart summaries. Save time browsing Reddit.',
  keywords: ['Reddit analyzer', 'Reddit AI', 'Reddit post summary', 'Reddit sentiment analysis', 'Chrome extension'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://clicksummary.com/reddit',
    siteName: 'ClickSummary',
    title: 'ClickSummary Reddit Analyzer - AI-Powered Reddit Insights',
    description: 'Instantly analyze Reddit posts and comments with AI. Get sentiment analysis, key insights, and smart summaries.',
    images: [
      {
        url: '/Click_Summary_Logo_Updated.png',
        width: 800,
        height: 600,
        alt: 'ClickSummary Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClickSummary Reddit Analyzer - AI-Powered Reddit Insights',
    description: 'Instantly analyze Reddit posts and comments with AI. Get sentiment analysis, key insights, and smart summaries.',
    creator: '@clicksummary',
    site: '@clicksummary',
    images: ['/Click_Summary_Logo_Updated.png'],
  },
  alternates: {
    canonical: 'https://clicksummary.com/reddit',
  },
};

export default function RedditPage() {
  return <RedditPageClient />;
}
