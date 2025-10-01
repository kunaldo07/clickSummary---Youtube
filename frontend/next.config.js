/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Essential for creating 'out' directory
  trailingSlash: true,  // Required for static hosting
  compiler: {
    styledComponents: true,
  },
  images: {
    unoptimized: true,  // Required for static export
    domains: ['clicksummary.com', 'lh3.googleusercontent.com'],
  },
  // Redirects don't work with static export, so commenting out
  // async redirects() {
  //   return [
  //     {
  //       source: '/home',
  //       destination: '/',
  //       permanent: true,
  //     },
  //     // Redirect www to non-www (handled at DNS level too)
  //     {
  //       source: '/:path*',
  //       has: [
  //         {
  //           type: 'host',
  //           value: 'www.clicksummary.com',
  //         },
  //       ],
  //       destination: 'https://clicksummary.com/:path*',
  //       permanent: true,
  //     },
  //   ]
  // },
  env: {
    CUSTOM_KEY: 'clicksummary-nextjs',
  },
}

module.exports = nextConfig
