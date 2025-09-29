// Environment configuration for Next.js
const detectEnvironment = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1' || process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    isDevelopment,
    isProduction,
    hostname
  };
};

const getConfig = () => {
  const env = detectEnvironment();
  
  if (env.isDevelopment) {
    return {
      API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      WEBSITE_URL: process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3002',
      GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '837073239595-d82jmt90dcg6pg1suilajc7rl2auf2b8.apps.googleusercontent.com',
      EXTENSION_ID: process.env.NEXT_PUBLIC_EXTENSION_ID || 'cijajcbmplbiidgaeooocnfhjhcahnil',
      DEBUG: true,
      ENVIRONMENT: 'development'
    };
  } else {
    return {
      API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.clicksummary.com/api',
      WEBSITE_URL: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://clicksummary.com',
      GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '837073239595-d82jmt90dcg6pg1suilajc7rl2auf2b8.apps.googleusercontent.com',
      EXTENSION_ID: process.env.NEXT_PUBLIC_EXTENSION_ID || 'cijajcbmplbiidgaeooocnfhjhcahnil',
      DEBUG: false,
      ENVIRONMENT: 'production'
    };
  }
};

const config = getConfig();

// Log environment info only in development
if (config.DEBUG) {
  console.log(`🌍 Environment: ${config.ENVIRONMENT}`);
  console.log(`🔗 API URL: ${config.API_URL}`);
  console.log(`🌐 Website URL: ${config.WEBSITE_URL}`);
}

export default config;
