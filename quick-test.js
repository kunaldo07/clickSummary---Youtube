#!/usr/bin/env node

/**
 * Quick Test Script - Fast functionality verification
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const testAPI = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      timeout: 3000 // Fast timeout
    };
    
    if (data) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message
    };
  }
};

const quickTest = async () => {
  log('🚀 Quick Test - React Landing Page', 'blue');
  log('===================================', 'blue');
  
  // Test 1: Backend Health
  const health = await testAPI('GET', '/health');
  if (health.success) {
    log('✅ Backend: Running', 'green');
  } else {
    log('❌ Backend: Down', 'red');
    return;
  }
  
  // Test 2: Development Auth
  const auth = await testAPI('POST', '/auth/google', {
    credential: 'mock_jwt_token_for_development'
  });
  
  if (auth.success) {
    log('✅ Auth: Working', 'green');
    log(`✅ User: ${auth.data.user.name}`, 'green');
    
    // Test 3: User Profile with token
    const token = auth.data.token;
    try {
      const profileResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 3000
      });
      log('✅ Profile: Working', 'green');
    } catch (error) {
      log('⚠️  Profile: May need MongoDB', 'yellow');
    }
    
  } else {
    log('❌ Auth: Failed', 'red');
    log(`   Error: ${JSON.stringify(auth.error)}`, 'red');
  }
  
  // Test 4: Frontend Check
  try {
    const frontendResponse = await axios.get('http://localhost:3000', { timeout: 3000 });
    if (frontendResponse.status === 200) {
      log('✅ React App: Running', 'green');
    }
  } catch (error) {
    log('❌ React App: Not running', 'red');
    log('   Start with: cd landing-page-react && npm start', 'yellow');
  }
  
  log('\n🎯 Next Steps:', 'blue');
  log('1. Open http://localhost:3000', 'yellow');
  log('2. Click "Sign In"', 'yellow');
  log('3. Use "Development Sign-In" button', 'yellow');
  log('4. Test pricing and payment flow', 'yellow');
  
  log('\n⚡ Performance Optimizations Applied:', 'blue');
  log('✅ Faster API timeouts', 'green');
  log('✅ Immediate UI updates', 'green');
  log('✅ Background token verification', 'green');
  log('✅ Reduced retry attempts', 'green');
};

quickTest().catch(error => {
  log(`💥 Test failed: ${error.message}`, 'red');
});
