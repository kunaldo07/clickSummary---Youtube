/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  compiler: {
    styledComponents: {
      displayName: true,
      ssr: true,
    },
  },
  images: {
    unoptimized: true,
    domains: ['clicksummary.com', 'lh3.googleusercontent.com'],
  },
  env: {
    CUSTOM_KEY: 'clicksummary-nextjs',
  },
};

module.exports = nextConfig;