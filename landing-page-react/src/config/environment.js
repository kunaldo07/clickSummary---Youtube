// Environment configuration for React frontend
const detectEnvironment = () => {
  // Check various indicators to determine if we're in development
  const hostname = window.location.hostname;
  const isDevelopment = 
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('.local') ||
    process.env.NODE_ENV === 'development';

  return {
    isDevelopment,
    isProduction: !isDevelopment,
    hostname
  };
};

const getConfig = () => {
  const env = detectEnvironment();
  
  if (env.isDevelopment) {
    return {
      API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      WEBSITE_URL: process.env.REACT_APP_WEBSITE_URL || 'http://localhost:3002',
      GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || '837073239595-d82jmt90dcg6pg1suilajc7rl2auf2b8.apps.googleusercontent.com',
      DEBUG: true,
      ENVIRONMENT: 'development'
    };
  } else {
    return {
      API_URL: process.env.REACT_APP_API_URL || 'https://api.clicksummary.com/api',
      WEBSITE_URL: process.env.REACT_APP_WEBSITE_URL || 'https://www.clicksummary.com',
      GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || '837073239595-d82jmt90dcg6pg1suilajc7rl2auf2b8.apps.googleusercontent.com',
      DEBUG: false,
      ENVIRONMENT: 'production'
    };
  }
};

const config = getConfig();

// Log environment info
console.log(`🌍 React Environment: ${config.ENVIRONMENT.toUpperCase()}`);
console.log(`🔗 API URL: ${config.API_URL}`);
console.log(`🌐 Website URL: ${config.WEBSITE_URL}`);

export default config;
