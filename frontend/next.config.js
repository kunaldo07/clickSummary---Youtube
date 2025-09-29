/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  images: {
    domains: ['clicksummary.com', 'lh3.googleusercontent.com'],
  },
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      // Redirect www to non-www (handled at DNS level too)
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.clicksummary.com',
          },
        ],
        destination: 'https://clicksummary.com/:path*',
        permanent: true,
      },
    ]
  },
  env: {
    CUSTOM_KEY: 'clicksummary-nextjs',
  },
}

module.exports = nextConfig
