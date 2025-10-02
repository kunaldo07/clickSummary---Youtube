// next.config.js - Remove static export
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export'
  compiler: {
    styledComponents: true,
  },
  images: {
    domains: ['clicksummary.com', 'lh3.googleusercontent.com'],
  },
};

module.exports = nextConfig;