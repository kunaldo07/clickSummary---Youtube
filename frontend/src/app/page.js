import React from 'react';
import HomePageClient from './HomePageClient';

export const metadata = {
  title: 'ClickSummary - AI-Powered YouTube Video Summaries',
  description: 'Transform YouTube videos into intelligent summaries with AI-powered insights. Save time and learn faster with our Chrome extension.',
  keywords: ['YouTube summary', 'AI video summary', 'Chrome extension', 'video insights', 'AI chat', 'video transcription'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://clicksummary.com',
    siteName: 'ClickSummary',
    title: 'ClickSummary - AI-Powered YouTube Video Summaries',
    description: 'Transform YouTube videos into intelligent summaries with AI-powered insights. Save time and learn faster with our Chrome extension.',
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
    title: 'ClickSummary - AI-Powered YouTube Video Summaries',
    description: 'Transform YouTube videos into intelligent summaries with AI-powered insights. Save time and learn faster with our Chrome extension.',
    creator: '@clicksummary',
    site: '@clicksummary',
    images: ['/Click_Summary_Logo_Updated.png'],
  },
  alternates: {
    canonical: 'https://clicksummary.com',
  },
};

export default function HomePage() {
  return <HomePageClient />;
}