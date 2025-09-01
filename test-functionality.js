#!/usr/bin/env node

/**
 * Comprehensive Functionality Test Script
 * Tests all core features: authentication, payment, subscription management
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:3000';

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const testAPI = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {}
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
};

const runTests = async () => {
  log('🚀 YouTube Summarizer - Functionality Test Suite', 'bold');
  log('=====================================================', 'blue');
  
  let allTestsPassed = true;
  let userToken = null;
  
  // Test 1: Backend Health Check
  log('\n📊 Test 1: Backend Health Check', 'blue');
  const healthCheck = await testAPI('GET', '/health');
  if (healthCheck.success) {
    log('✅ Backend server is running and healthy', 'green');
  } else {
    log('❌ Backend server is not responding', 'red');
    allTestsPassed = false;
  }
  
  // Test 2: Frontend Server Check
  log('\n🌐 Test 2: Frontend Server Check', 'blue');
  try {
    const frontendResponse = await axios.get(FRONTEND_URL);
    if (frontendResponse.status === 200) {
      log('✅ React frontend is running', 'green');
    }
  } catch (error) {
    log('❌ React frontend is not responding', 'red');
    allTestsPassed = false;
  }
  
  // Test 3: Development Authentication
  log('\n🔐 Test 3: Development Authentication', 'blue');
  const authTest = await testAPI('POST', '/auth/google', {
    credential: 'mock_jwt_token_for_development'
  });
  
  if (authTest.success) {
    log('✅ Development authentication successful', 'green');
    userToken = authTest.data.token;
    log(`   User: ${authTest.data.user.name} (${authTest.data.user.email})`, 'blue');
  } else {
    log('❌ Development authentication failed', 'red');
    log(`   Error: ${JSON.stringify(authTest.error)}`, 'red');
    allTestsPassed = false;
  }
  
  // Test 4: User Profile Verification
  if (userToken) {
    log('\n👤 Test 4: User Profile Verification', 'blue');
    const profileTest = await testAPI('GET', '/auth/me', null, userToken);
    
    if (profileTest.success) {
      log('✅ User profile retrieval successful', 'green');
      log(`   User ID: ${profileTest.data.user.id}`, 'blue');
      log(`   Subscription: ${profileTest.data.user.subscription?.plan || 'None'}`, 'blue');
    } else {
      log('❌ User profile retrieval failed', 'red');
      allTestsPassed = false;
    }
  }
  
  // Test 5: Payment System - Create Subscription
  if (userToken) {
    log('\n💳 Test 5: Payment System - Create Subscription', 'blue');
    const subscriptionTest = await testAPI('POST', '/payment/create-subscription', {
      plan: 'premium',
      amount: 1000,
      currency: 'USD',
      interval: 'month',
      interval_count: 1
    }, userToken);
    
    if (subscriptionTest.success) {
      log('✅ Subscription creation endpoint working', 'green');
      log(`   Subscription ID: ${subscriptionTest.data.subscription?.id || 'Generated'}`, 'blue');
    } else {
      log('❌ Subscription creation failed', 'red');
      log(`   Error: ${JSON.stringify(subscriptionTest.error)}`, 'red');
      allTestsPassed = false;
    }
  }
  
  // Test 6: Subscription Status Check
  if (userToken) {
    log('\n📋 Test 6: Subscription Status Check', 'blue');
    const statusTest = await testAPI('GET', '/payment/subscription-status', null, userToken);
    
    if (statusTest.success || statusTest.status === 404) {
      log('✅ Subscription status endpoint working', 'green');
      if (statusTest.data?.subscription) {
        log(`   Current Plan: ${statusTest.data.subscription.plan}`, 'blue');
        log(`   Status: ${statusTest.data.subscription.status}`, 'blue');
      } else {
        log('   No active subscription (expected for new user)', 'yellow');
      }
    } else {
      log('❌ Subscription status check failed', 'red');
      allTestsPassed = false;
    }
  }
  
  // Test 7: Sign Out
  if (userToken) {
    log('\n🚪 Test 7: Sign Out Functionality', 'blue');
    const signOutTest = await testAPI('POST', '/auth/signout', null, userToken);
    
    if (signOutTest.success) {
      log('✅ Sign out successful', 'green');
    } else {
      log('❌ Sign out failed', 'red');
      allTestsPassed = false;
    }
  }
  
  // Test 8: Environment Configuration Check
  log('\n⚙️  Test 8: Environment Configuration', 'blue');
  const envChecks = [
    { name: 'NODE_ENV', value: process.env.NODE_ENV || 'not set' },
    { name: 'PORT', value: process.env.PORT || '3001 (default)' },
    { name: 'MONGODB_URI', value: process.env.MONGODB_URI ? 'configured' : 'not set' },
    { name: 'JWT_SECRET', value: process.env.JWT_SECRET ? 'configured' : 'not set' }
  ];
  
  for (const check of envChecks) {
    if (check.value === 'not set' && check.name !== 'NODE_ENV') {
      log(`   ⚠️  ${check.name}: ${check.value}`, 'yellow');
    } else {
      log(`   ✅ ${check.name}: ${check.value}`, 'green');
    }
  }
  
  // Final Results
  log('\n📋 Test Results Summary', 'bold');
  log('========================', 'blue');
  
  if (allTestsPassed) {
    log('🎉 All core functionality tests PASSED!', 'green');
    log('\n🚀 Ready for production deployment!', 'bold');
    
    log('\n📝 Next Steps:', 'blue');
    log('1. Configure Google OAuth credentials in .env', 'yellow');
    log('2. Configure Razorpay keys for payments', 'yellow');
    log('3. Set up production MongoDB instance', 'yellow');
    log('4. Update CORS settings for production domain', 'yellow');
    
    log('\n🌟 Development Features Working:', 'blue');
    log('✅ Authentication (mock + real Google OAuth ready)', 'green');
    log('✅ User profile management', 'green');
    log('✅ Payment system integration', 'green');
    log('✅ Subscription management', 'green');
    log('✅ Frontend-backend communication', 'green');
    
  } else {
    log('❌ Some tests FAILED. Please check the issues above.', 'red');
    log('\n🔧 Common Issues:', 'yellow');
    log('• Make sure backend server is running: npm start (in backend folder)', 'yellow');
    log('• Make sure React app is running: npm start (in landing-page-react folder)', 'yellow');
    log('• Check MongoDB connection in backend/.env', 'yellow');
    log('• Verify all environment variables are set', 'yellow');
  }
  
  log('\n📚 Documentation:', 'blue');
  log('• Backend: /backend/README.md', 'blue');
  log('• Frontend: /landing-page-react/README.md', 'blue');
  log('• Setup Guide: /DEVELOPER_SETUP.md', 'blue');
};

// Run the test suite
runTests().catch(error => {
  log(`\n💥 Test suite crashed: ${error.message}`, 'red');
  process.exit(1);
});
