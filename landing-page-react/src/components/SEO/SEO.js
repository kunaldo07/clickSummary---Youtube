import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
  title = "ClickSummary - AI-Powered Video Summaries",
  description = "Transform YouTube videos into intelligent summaries with AI-powered insights. Save time and learn faster with our Chrome extension.",
  keywords = "YouTube summary, AI video summary, Chrome extension, video insights, AI chat, video transcription",
  image = "/Click_Summary_Logo_Updated.png",
  url = "",
  type = "website",
  twitterHandle = "@clicksummary"
}) => {
  // Fix: Use consistent production URL without www
  const getCanonicalUrl = () => {
    if (typeof window !== 'undefined') {
      // In browser, determine canonical URL
      const currentHost = window.location.host;
      const currentProtocol = window.location.protocol;
      
      // If we're on the www version, canonical should point to non-www
      if (currentHost === 'www.clicksummary.com') {
        return `${currentProtocol}//clicksummary.com${url}`;
      }
      // Otherwise use the current origin
      return `${window.location.origin}${url}`;
    }
    // Default for SSR/build time - use non-www
    return `https://clicksummary.com${url}`;
  };

  const canonicalUrl = getCanonicalUrl();
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://clicksummary.com';
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="ClickSummary" />
      
      {/* Canonical URL - Always point to non-www version */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:site_name" content="ClickSummary" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImageUrl} />
      <meta property="twitter:creator" content={twitterHandle} />
      <meta property="twitter:site" content={twitterHandle} />
      
      {/* Additional SEO tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />
      <meta name="theme-color" content="#8b5cf6" />
      
      {/* Mobile optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "ClickSummary",
          "description": description,
          "url": "https://clicksummary.com",
          "applicationCategory": "ProductivityApplication",
          "operatingSystem": "Chrome Browser",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "author": {
            "@type": "Organization",
            "name": "ClickSummary"
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
