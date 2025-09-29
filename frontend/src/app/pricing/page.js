import React from 'react';
import PricingPageClient from './PricingPageClient';

export const metadata = {
  title: 'Pricing - Simple & Affordable Plans',
  description: 'Choose the perfect plan for your YouTube summary needs. Start free, upgrade when you\'re ready. Premium features at ₹800/month.',
  keywords: ['ClickSummary pricing', 'YouTube summary plans', 'AI video summary cost', 'Premium Chrome extension'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://clicksummary.com/pricing',
    siteName: 'ClickSummary',
    title: 'ClickSummary Pricing - Simple & Affordable Plans',
    description: 'Choose the perfect plan for your YouTube summary needs. Start free, upgrade when you\'re ready.',
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
    title: 'ClickSummary Pricing - Simple & Affordable Plans',
    description: 'Choose the perfect plan for your YouTube summary needs. Start free, upgrade when you\'re ready.',
    creator: '@clicksummary',
    site: '@clicksummary',
    images: ['/Click_Summary_Logo_Updated.png'],
  },
  alternates: {
    canonical: 'https://clicksummary.com/pricing',
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}