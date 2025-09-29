import React from 'react';
import PrivacyPageClient from './PrivacyPageClient';

export const metadata = {
  title: 'Privacy Policy - How We Protect Your Data',
  description: 'Learn how ClickSummary collects, uses, and protects your personal information. We prioritize your privacy and data security.',
  keywords: ['ClickSummary privacy policy', 'data protection', 'privacy rights', 'Chrome extension privacy'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://clicksummary.com/privacy',
    siteName: 'ClickSummary',
    title: 'ClickSummary Privacy Policy',
    description: 'Learn how we collect, use, and protect your personal information. Your privacy matters to us.',
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
    title: 'ClickSummary Privacy Policy',
    description: 'Learn how we collect, use, and protect your personal information. Your privacy matters to us.',
    creator: '@clicksummary',
    site: '@clicksummary',
    images: ['/Click_Summary_Logo_Updated.png'],
  },
  alternates: {
    canonical: 'https://clicksummary.com/privacy',
  },
};

export default function PrivacyPage() {
  return <PrivacyPageClient />;
}