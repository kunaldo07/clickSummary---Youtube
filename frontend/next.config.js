/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
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
    unoptimized: true,
    domains: ['clicksummary.com', 'lh3.googleusercontent.com'],
  },
  env: {
    CUSTOM_KEY: 'clicksummary-nextjs',
  },
};

module.exports = nextConfig;
