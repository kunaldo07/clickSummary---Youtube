// Comprehensive Test Script for All Background Script Actions
// Run this in YouTube console to test all extension functionality

console.log('🧪 COMPREHENSIVE EXTENSION ACTION TEST');
console.log('=====================================');

// List of all actions supported by the background script
const ALL_ACTIONS = [
  'summarize',
  'summarizeAdvanced', 
  'summarizeTimestamped',
  'clearCache',
  'clearVideoCache',
  'chatQuery',
  'storeUserToken',
  'userSignedOut',
  'syncAuthData',
  'requestAuthSync'
];

let testResults = {};

// Helper function to test an action
function testAction(action, data = {}) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing action: ${action}`);
    
    const startTime = Date.now();
    chrome.runtime.sendMessage({
      action: action,
      ...data
    }, (response) => {
      const duration = Date.now() - startTime;
      
      if (chrome.runtime.lastError) {
        console.log(`❌ ${action} - Error: ${chrome.runtime.lastError.message}`);
        testResults[action] = { 
          status: 'error', 
          error: chrome.runtime.lastError.message,
          duration: duration
        };
      } else {
        console.log(`✅ ${action} - Success (${duration}ms):`, response);
        testResults[action] = { 
          status: 'success', 
          response: response,
          duration: duration
        };
      }
      resolve();
    });
  });
}

// Test data for different actions
const testData = {
  summarize: {
    transcript: 'This is a test transcript for summarization.',
    videoId: 'test123'
  },
  summarizeAdvanced: {
    data: {
      transcript: 'This is a test transcript for advanced summarization.',
      videoId: 'test123',
      type: 'insightful',
      length: 'auto',
      format: 'list'
    }
  },
  summarizeTimestamped: {
    data: {
      transcript: 'This is a test transcript with timestamps.',
      videoId: 'test123',
      type: 'timestamped'
    }
  },
  clearCache: {},
  clearVideoCache: {
    videoId: 'test123'
  },
  chatQuery: {
    data: {
      query: 'What is this video about?',
      context: 'Test video context',
      videoId: 'test123'
    }
  },
  storeUserToken: {
    token: 'test_token_123',
    user: {
      name: 'Test User',
      email: 'test@example.com',
      id: 'test_user_id'
    }
  },
  userSignedOut: {},
  syncAuthData: {
    authData: {
      token: 'sync_test_token',
      user: '{"name":"Sync Test User","email":"sync@test.com"}'
    }
  },
  requestAuthSync: {
    source: 'test_script'
  }
};

// Main test function
async function runAllTests() {
  console.log('\n🚀 Starting comprehensive action tests...\n');
  
  // Test each action
  for (const action of ALL_ACTIONS) {
    await testAction(action, testData[action] || {});
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Generate test report
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  
  const successful = Object.keys(testResults).filter(action => testResults[action].status === 'success');
  const failed = Object.keys(testResults).filter(action => testResults[action].status === 'error');
  
  console.log(`✅ Successful: ${successful.length}/${ALL_ACTIONS.length}`);
  console.log(`❌ Failed: ${failed.length}/${ALL_ACTIONS.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Working Actions:');
    successful.forEach(action => {
      const result = testResults[action];
      console.log(`  - ${action} (${result.duration}ms)`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Actions:');
    failed.forEach(action => {
      const result = testResults[action];
      console.log(`  - ${action}: ${result.error}`);
    });
  }
  
  // Detailed results
  console.log('\n📋 Detailed Results:', testResults);
  
  return {
    total: ALL_ACTIONS.length,
    successful: successful.length,
    failed: failed.length,
    results: testResults
  };
}

// Test background script communication first
function testBackgroundScriptCommunication() {
  console.log('\n🔗 Testing background script communication...');
  
  chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('❌ Background script not responding:', chrome.runtime.lastError.message);
      console.log('💡 Solution: Go to chrome://extensions/ and reload ClickSummary extension');
      return;
    }
    
    console.log('✅ Background script is responding');
    console.log('🚀 Proceeding with action tests...');
    
    // Run all tests after confirming background script works
    runAllTests().then(summary => {
      console.log('\n🎯 FINAL SUMMARY');
      console.log('=================');
      console.log(`Actions tested: ${summary.total}`);
      console.log(`Working: ${summary.successful}`);
      console.log(`Broken: ${summary.failed}`);
      
      if (summary.failed === 0) {
        console.log('🎉 ALL ACTIONS WORKING PERFECTLY!');
      } else {
        console.log('⚠️ Some actions need attention');
      }
    });
  });
}

// Quick individual action test functions
window.testExtensionActions = {
  testAll: runAllTests,
  testCommunication: testBackgroundScriptCommunication,
  testSummarize: () => testAction('summarize', testData.summarize),
  testSummarizeAdvanced: () => testAction('summarizeAdvanced', testData.summarizeAdvanced),
  testSummarizeTimestamped: () => testAction('summarizeTimestamped', testData.summarizeTimestamped),
  testClearCache: () => testAction('clearCache'),
  testClearVideoCache: () => testAction('clearVideoCache', testData.clearVideoCache),
  testChatQuery: () => testAction('chatQuery', testData.chatQuery),
  testStoreUserToken: () => testAction('storeUserToken', testData.storeUserToken),
  testUserSignedOut: () => testAction('userSignedOut'),
  testSyncAuthData: () => testAction('syncAuthData', testData.syncAuthData),
  testRequestAuthSync: () => testAction('requestAuthSync', testData.requestAuthSync),
  results: () => testResults
};

console.log('\n🛠️ Available Commands:');
console.log('testExtensionActions.testCommunication() - Test background script connection');
console.log('testExtensionActions.testAll() - Test all actions comprehensively');
console.log('testExtensionActions.testSummarizeAdvanced() - Test specific action');
console.log('testExtensionActions.results() - Show last test results');

console.log('\n🔄 Auto-starting communication test...');
testBackgroundScriptCommunication();
