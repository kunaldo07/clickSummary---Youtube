// Quick test to check if OpenAI API key is working
require('dotenv').config();

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  console.log('🔑 Testing OpenAI API Key...');
  console.log('Key format:', apiKey ? `${apiKey.substring(0, 20)}...` : 'MISSING');
  console.log('Key length:', apiKey ? apiKey.length : 0);
  
  if (!apiKey) {
    console.log('❌ OPENAI_API_KEY not found in environment');
    return;
  }
  
  if (apiKey.startsWith('sk-sk-')) {
    console.log('⚠️  WARNING: API key starts with "sk-sk-" - this looks wrong!');
    console.log('💡 Should start with just "sk-proj-" or "sk-"');
  }
  
  try {
    console.log('🚀 Testing API call with 10-second timeout...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say "API test successful"' }],
        max_tokens: 10
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI API working correctly!');
      console.log('Response:', data.choices[0].message.content);
    } else {
      const error = await response.json();
      console.log('❌ OpenAI API error:', response.status, error);
      
      if (response.status === 401) {
        console.log('💡 SOLUTION: Check your OpenAI API key - it may be invalid or malformed');
      }
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⏰ OpenAI API call timed out after 10 seconds');
      console.log('💡 This explains why your summary is timing out!');
    } else {
      console.log('❌ OpenAI API test failed:', error.message);
    }
  }
}

testOpenAI().catch(console.error);
