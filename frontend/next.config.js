/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' - use standard Next.js build instead
  compiler: {
    styledComponents: {
      displayName: true,
      ssr: true,
      fileName: false,
      cssProp: true,
      namespace: '',
      topLevelImportPaths: [],
      meaninglessFileNames: ['index'],
    },
  },
  images: {
    domains: ['clicksummary.com', 'lh3.googleusercontent.com'],
  },
  env: {
    CUSTOM_KEY: 'clicksummary-nextjs',
  },
};

module.exports = nextConfig;
