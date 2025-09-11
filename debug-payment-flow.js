#!/usr/bin/env node

/**
 * Debug Payment Flow - Test the complete authentication and payment flow
 */

const https = require('https');
const http = require('http');

console.log('🔧 Debugging Payment Flow...\n');

// Test 1: Check if backend server is responding
console.log('📡 Step 1: Testing backend server connectivity...');
const healthCheck = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/test',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  console.log(`✅ Backend server status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`📋 Response: ${data}\n`);
    
    // Test 2: Check payment route without auth
    console.log('📡 Step 2: Testing payment endpoint (expect 401)...');
    testPaymentEndpoint();
  });
});

healthCheck.on('error', (err) => {
  console.error('❌ Backend server not reachable:', err.message);
  console.log('\n🔧 Solutions:');
  console.log('1. Make sure backend is running: cd backend && npm start');
  console.log('2. Check backend port is 3001');
  console.log('3. Check for any server startup errors');
});

healthCheck.end();

function testPaymentEndpoint() {
  const paymentTest = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/payment/create-subscription',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, (res) => {
    console.log(`✅ Payment endpoint status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`📋 Response: ${data}\n`);
      
      if (res.statusCode === 401) {
        console.log('✅ Expected 401 - Authentication is working');
        console.log('🔍 The 500 error you saw is likely happening AFTER authentication');
        console.log('\n🔧 To fix:');
        console.log('1. Make sure you\'re signed in on the frontend');
        console.log('2. Check browser console for authentication errors');
        console.log('3. Check if JWT token is being sent properly');
        console.log('4. Verify Razorpay environment variables in backend/.env');
        console.log('\n📋 Backend environment check:');
        checkBackendEnv();
      } else if (res.statusCode === 500) {
        console.log('❌ 500 error even without auth - server issue');
        try {
          const errorData = JSON.parse(data);
          console.log('Error details:', errorData);
        } catch (e) {
          console.log('Raw error:', data);
        }
      }
    });
  });

  paymentTest.on('error', (err) => {
    console.error('❌ Payment endpoint error:', err.message);
  });

  // Send minimal test data
  paymentTest.write(JSON.stringify({ planType: 'monthly' }));
  paymentTest.end();
}

function checkBackendEnv() {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const envPath = path.join(__dirname, 'backend', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const hasRazorpayKey = envContent.includes('RAZORPAY_KEY_ID');
    const hasRazorpaySecret = envContent.includes('RAZORPAY_KEY_SECRET');
    const hasRazorpayPlan = envContent.includes('RAZORPAY_MONTHLY_PLAN_ID');
    
    console.log(`   🔑 RAZORPAY_KEY_ID: ${hasRazorpayKey ? '✅ Present' : '❌ Missing'}`);
    console.log(`   🔐 RAZORPAY_KEY_SECRET: ${hasRazorpaySecret ? '✅ Present' : '❌ Missing'}`);
    console.log(`   📋 RAZORPAY_MONTHLY_PLAN_ID: ${hasRazorpayPlan ? '✅ Present' : '❌ Missing'}`);
    
    if (!hasRazorpayKey || !hasRazorpaySecret || !hasRazorpayPlan) {
      console.log('\n❌ Missing Razorpay configuration in backend/.env');
      console.log('🔧 This could cause 500 errors during payment creation');
    } else {
      console.log('\n✅ Razorpay configuration looks complete');
    }
    
  } catch (error) {
    console.log('❌ Could not read backend/.env file');
    console.log('🔧 Make sure backend/.env exists with Razorpay credentials');
  }
}
