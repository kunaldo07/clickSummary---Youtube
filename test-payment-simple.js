#!/usr/bin/env node

/**
 * Simple Payment Test - Test without JWT dependency
 */

const http = require('http');

console.log('🔧 Testing Payment Endpoint (Simple)...\n');

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
    'Authorization': 'Bearer test_token_will_fail_auth_but_show_structure',
    'Content-Length': Buffer.byteLength(paymentData)
  }
};

const req = http.request(options, (res) => {
  console.log(`📊 Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📋 Response:');
    try {
      const jsonResponse = JSON.parse(data);
      console.log(JSON.stringify(jsonResponse, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. 🌐 Open frontend: http://localhost:3002');
    console.log('2. 🔐 Sign in with Google');
    console.log('3. 💳 Try to subscribe to premium');
    console.log('4. 👀 Watch backend console for 500 error details');
    console.log('5. 🔍 Check browser network tab for full error response');
    
    console.log('\n📊 Expected Flow:');
    console.log('   ✅ Frontend sends request with valid JWT token');
    console.log('   ✅ Backend auth middleware validates token');
    console.log('   ❌ Backend payment route fails with 500 error');
    console.log('   🔍 Backend console shows actual error details');
    
    console.log('\n🔧 To Debug:');
    console.log('   1. Keep backend running in one terminal');
    console.log('   2. Make payment request from frontend');
    console.log('   3. Check backend terminal for error logs');
    console.log('   4. Look for "Subscription creation error:" in logs');
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e);
});

req.write(paymentData);
req.end();
