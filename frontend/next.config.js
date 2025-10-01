/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',          // Static export
  trailingSlash: true,       // Required for static hosting
  compiler: {
    styledComponents: true,
  },
  images: {
    unoptimized: true,
    domains: ['clicksummary.com', 'lh3.googleusercontent.com'],
  },
  env: {
    CUSTOM_KEY: 'clicksummary-nextjs',
  },
}

module.exports = nextConfig;
