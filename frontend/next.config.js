// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  compiler: {
    styledComponents: true,
  },
  images: {
    unoptimized: true,
    domains: ['clicksummary.com', 'lh3.googleusercontent.com'],
  },
};

module.exports = nextConfig;