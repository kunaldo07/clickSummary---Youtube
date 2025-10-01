/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '',  // Ensures correct asset paths for static hosting
  assetPrefix: '',  // Critical for static asset serving
  compiler: {
    styledComponents: true,
  },
  images: {
    unoptimized: true,
    domains: ['clicksummary.com', 'lh3.googleusercontent.com'],
  },
  // Ensure all pages are statically generated  
  distDir: '.next',
  env: {
    CUSTOM_KEY: 'clicksummary-nextjs',
  },
}

module.exports = nextConfig
