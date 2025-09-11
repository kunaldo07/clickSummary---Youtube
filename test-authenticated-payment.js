#!/usr/bin/env node

/**
 * Test Authenticated Payment - Simulate a real payment request with auth
 */

const http = require('http');
const jwt = require('jsonwebtoken'); // You'll need to install this: npm install jsonwebtoken

console.log('🔧 Testing Authenticated Payment Request...\n');

// Create a test JWT token (simulate logged-in user)
const testUser = {
  id: '66e0cb9bef905d7b7e9f2e8a', // Mock user ID
  email: 'test@example.com',
  name: 'Test User'
};

// Create a mock JWT token for testing
// Note: In production, this would come from the Google OAuth flow
const testToken = 'mock_jwt_token_for_testing';

console.log('📡 Testing payment endpoint with simulated authentication...');

const paymentData = JSON.stringify({
  planType: 'monthly'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/payment/create-subscription',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${testToken}`,
    'Content-Length': Buffer.byteLength(paymentData)
  }
};

const req = http.request(options, (res) => {
  console.log(`📊 Status Code: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📋 Response Body:');
    try {
      const jsonResponse = JSON.parse(data);
      console.log(JSON.stringify(jsonResponse, null, 2));
      
      if (res.statusCode === 500) {
        console.log('\n❌ 500 Internal Server Error Details:');
        console.log('🔍 Error:', jsonResponse.error);
        console.log('🔍 Details:', jsonResponse.details);
        
        // Analyze common 500 error causes
        analyzeError(jsonResponse);
      } else if (res.statusCode === 401) {
        console.log('\n🔐 Still getting 401 - need real authentication');
        console.log('💡 To get real token, sign in through frontend and check localStorage');
      } else {
        console.log('\n✅ Payment request processed successfully!');
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e);
});

req.write(paymentData);
req.end();

function analyzeError(errorResponse) {
  const errorMessage = errorResponse.details || errorResponse.error || '';
  
  console.log('\n🔍 Error Analysis:');
  
  if (errorMessage.includes('plan') || errorMessage.includes('Plan')) {
    console.log('❌ LIKELY CAUSE: Razorpay Plan Issue');
    console.log('🔧 Solutions:');
    console.log('   1. Check if the plan exists in Razorpay dashboard');
    console.log('   2. Verify RAZORPAY_MONTHLY_PLAN_ID in backend/.env');
    console.log('   3. Create the plan if it doesn\'t exist');
  } else if (errorMessage.includes('customer') || errorMessage.includes('Customer')) {
    console.log('❌ LIKELY CAUSE: Razorpay Customer Issue');
    console.log('🔧 Solutions:');
    console.log('   1. Check Razorpay API credentials');
    console.log('   2. Verify user data format');
  } else if (errorMessage.includes('save') || errorMessage.includes('database')) {
    console.log('❌ LIKELY CAUSE: Database Issue');
    console.log('🔧 Solutions:');
    console.log('   1. Check MongoDB connection');
    console.log('   2. Verify user model schema');
  } else if (errorMessage.includes('key') || errorMessage.includes('secret')) {
    console.log('❌ LIKELY CAUSE: Razorpay Credentials Issue');
    console.log('🔧 Solutions:');
    console.log('   1. Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
    console.log('   2. Check if using test vs live keys correctly');
  } else {
    console.log('❓ UNKNOWN ERROR - Check backend logs');
    console.log('🔧 Solutions:');
    console.log('   1. Check backend console for detailed error logs');
    console.log('   2. Add more logging to payment route');
    console.log('   3. Check Razorpay dashboard for failed requests');
  }
}
