/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: false,  // Try without trailing slash
  distDir: 'build',      // Change output directory
  compiler: {
    styledComponents: true,  // Simplified
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;