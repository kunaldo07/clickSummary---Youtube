import React from 'react';
import SignInPageClient from './SignInPageClient';

export const metadata = {
  title: 'Sign In - Access Your AI Video Summaries',
  description: 'Sign in to ClickSummary to access your AI-powered video summaries, premium features, and personalized dashboard.',
  keywords: ['ClickSummary sign in', 'YouTube summary login', 'Google OAuth', 'AI video summary account'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://clicksummary.com/signin',
    siteName: 'ClickSummary',
    title: 'Sign In - ClickSummary',
    description: 'Sign in to access your AI-powered video summaries and premium features.',
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
    title: 'Sign In - ClickSummary',
    description: 'Sign in to access your AI-powered video summaries and premium features.',
    creator: '@clicksummary',
    site: '@clicksummary',
    images: ['/Click_Summary_Logo_Updated.png'],
  },
  alternates: {
    canonical: 'https://clicksummary.com/signin',
  },
  robots: {
    index: false, // Don't index signin pages
    follow: true,
  },
};

export default function SignInPage() {
  return <SignInPageClient />;
}