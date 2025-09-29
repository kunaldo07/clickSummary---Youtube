import React from 'react';
import ClientLayout from './ClientLayout';

export const metadata = {
  metadataBase: new URL('https://clicksummary.com'),
  title: {
    default: 'ClickSummary - AI-Powered YouTube Video Summaries',
    template: '%s | ClickSummary'
  },
  description: 'Transform YouTube videos into intelligent summaries with AI-powered insights. Save time and learn faster with our Chrome extension.',
  keywords: ['YouTube summary', 'AI video summary', 'Chrome extension', 'video insights', 'AI chat', 'video transcription'],
  authors: [{ name: 'ClickSummary Team' }],
  creator: 'ClickSummary',
  publisher: 'ClickSummary',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
  other: {
    'theme-color': '#8b5cf6',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" itemScope itemType="https://schema.org/WebApplication">
      <head>
        {/* Favicon Links */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/Click_Summary_Logo_Updated.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/Click_Summary_Logo_Updated.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/Click_Summary_Logo_Updated.png" />
        
        {/* Security */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="referrer" content="no-referrer-when-downgrade" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://checkout.razorpay.com" />
        
        {/* Google Fonts with font-display: swap for performance */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        
        {/* Razorpay Checkout */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" defer></script>
        
        {/* Structured data for better SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "ClickSummary",
              "description": "Transform YouTube videos into intelligent summaries with AI-powered insights. Save time and learn faster with our Chrome extension.",
              "url": "https://clicksummary.com",
              "applicationCategory": "ProductivityApplication",
              "operatingSystem": "Chrome Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR"
              },
              "author": {
                "@type": "Organization",
                "name": "ClickSummary",
                "url": "https://clicksummary.com"
              }
            })
          }}
        />
      </head>
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}