// YouTube Summarizer Background Script - Multi-Environment Support

// Environment detection and configuration
const detectEnvironment = () => {
  // Check if we're in a development environment
  // This can be determined by checking if localhost APIs are accessible
  const isDevelopment = navigator.userAgent.includes('Development') || 
                       location.hostname === 'localhost' ||
                       location.hostname === '127.0.0.1';
  
  return {
    isDevelopment,
    isProduction: !isDevelopment
  };
};

const getAPIBaseURL = () => {
  const env = detectEnvironment();
  
  if (env.isDevelopment) {
    return 'http://localhost:3001/api';
  } else {
    return 'https://api.clicksummary.com/api';
  }
};

const CONFIG = {
  API_BASE_URL: getAPIBaseURL(),
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  environment: detectEnvironment()
};

console.log(`🌍 Extension Environment: ${CONFIG.environment.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log(`🔗 API Base URL: ${CONFIG.API_BASE_URL}`);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('bsdhjcbdjhb 🚀 Request received:', request);
  if (request.action === 'summarize') {
    handleSummarization(request.transcript, request.videoId)
      .then(summary => sendResponse({ summary }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  
  if (request.action === 'summarizeAdvanced') {
    console.log('🚀 Summarizing advanced inside listener :', request.data);
    handleAdvancedSummarization(request.data)
      .then(summary => sendResponse({ summary }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  
  if (request.action === 'summarizeTimestamped') {
    handleTimestampedSummarization(request.data)
      .then(summary => sendResponse({ summary }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  
  if (request.action === 'clearCache') {
    clearAllCache()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  
  if (request.action === 'clearVideoCache') {
    clearVideoCache(request.videoId)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  
  if (request.action === 'chatQuery') {
    handleChatQuery(request.data)
      .then(answer => sendResponse({ answer }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.action === 'storeUserToken') {
    console.log('💾 Storing user token and data from landing page...');
    
    const dataToStore = {
      youtube_summarizer_token: request.token
    };
    
    // Also store user data if provided
    if (request.user) {
      dataToStore.youtube_summarizer_user = JSON.stringify(request.user);
      console.log('✅ Storing user data:', request.user.name, request.user.email);
    }
    
    chrome.storage.local.set(dataToStore, () => {
      if (chrome.runtime.lastError) {
        console.error('❌ Failed to store token:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('✅ Token and user data stored successfully');
        
        // Notify popup about auth change
        chrome.runtime.sendMessage({ action: 'authStatusChanged' }).catch(() => {
          // Popup might not be open, which is fine
        });
        
        sendResponse({ success: true });
      }
    });
    return true;
  }
  
  if (request.action === 'userSignedOut') {
    console.log('🚪 User signed out - clearing stored data...');
    
    chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user'], () => {
      if (chrome.runtime.lastError) {
        console.error('❌ Failed to clear token:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('✅ User data cleared successfully');
        sendResponse({ success: true });
      }
    });
    return true;
  }
  
  if (request.action === 'syncAuthData') {
    console.log('🔄 Manual auth data sync requested from website...');
    
    const dataToStore = {
      youtube_summarizer_token: request.authData.token,
      youtube_summarizer_user: request.authData.user
    };
    
    chrome.storage.local.set(dataToStore, () => {
      if (chrome.runtime.lastError) {
        console.error('❌ Failed to sync auth data:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('✅ Auth data synced successfully from manual request');
        
        // Notify popup about auth change
        chrome.runtime.sendMessage({ action: 'authStatusChanged' }).catch(() => {
          // Popup might not be open, which is fine
        });
        
        sendResponse({ success: true });
      }
    });
    return true;
  }
  
  if (request.action === 'requestAuthSync') {
    console.log('🔍 Auth sync requested from:', request.source);
    
    // Try to find landing page tabs and trigger sync
    chrome.tabs.query({}, async (tabs) => {
      const landingPageTabs = tabs.filter(tab => 
        tab.url && (
          tab.url.includes('localhost:3002') || 
          tab.url.includes('127.0.0.1:3002') ||
          tab.url.includes('clicksummary.com')
        )
      );
      
      console.log(`🌐 Found ${landingPageTabs.length} landing page tab(s) for background sync`);
      
      if (landingPageTabs.length > 0) {
        for (const tab of landingPageTabs) {
          try {
            console.log(`🔄 Background sync attempt from tab ${tab.id}`);
            
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                console.log('🌉 Background sync trigger from background script');
                
                if (window.youTubeSummarizerAuthBridge) {
                  console.log('🌉 Triggering auth bridge sync from background');
                  window.youTubeSummarizerAuthBridge.forceSync();
                  return true;
                }
                
                // Fallback: direct localStorage sync
                const token = localStorage.getItem('youtube_summarizer_token');
                const user = localStorage.getItem('youtube_summarizer_user');
                
                if (token && user) {
                  console.log('📤 Direct background sync attempt');
                  if (typeof chrome !== 'undefined' && chrome.runtime) {
                    chrome.runtime.sendMessage({
                      action: 'syncAuthData',
                      authData: { token: token, user: user }
                    });
                    return true;
                  }
                }
                
                return false;
              }
            });
            
          } catch (error) {
            console.warn(`⚠️ Background sync failed for tab ${tab.id}:`, error);
          }
        }
        
        sendResponse({ 
          success: true, 
          message: `Sync attempted on ${landingPageTabs.length} tabs` 
        });
      } else {
        sendResponse({ 
          success: false, 
          message: 'No landing page tabs found for sync' 
        });
      }
    });
    
    return true;
  }
});

// Function to clear all cached summaries (useful for testing different lengths)
async function clearAllCache() {
  console.log('🗑️ Clearing all cached summaries...');
  const storage = await chrome.storage.local.get();
  const keysToRemove = [];
  
  for (const key of Object.keys(storage)) {
    if (key.startsWith('summary_') || key.startsWith('advanced_')) {
      keysToRemove.push(key);
    }
  }
  
  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
    console.log(`🗑️ Cleared ${keysToRemove.length} cached summaries`);
  }
}

// Function to clear cached summaries for a specific video
async function clearVideoCache(videoId) {
  console.log(`🗑️ Clearing cache for video: ${videoId}`);
  const storage = await chrome.storage.local.get();
  const keysToRemove = [];
  
  for (const key of Object.keys(storage)) {
    if ((key.startsWith('summary_') || key.startsWith('advanced_')) && key.includes(videoId)) {
      keysToRemove.push(key);
    }
  }
  
  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
    console.log(`🗑️ Cleared ${keysToRemove.length} cached summaries for video ${videoId}`);
  } else {
    console.log(`🔍 No cached summaries found for video ${videoId}`);
  }
}

async function handleSummarization(transcript, videoId) {
  try {
    console.log('⚠️  Legacy summarization function called - redirecting to secure backend');
    
    // Redirect to secure advanced summarization with default parameters
    const requestData = {
      transcript: transcript,
      videoId: videoId,
      type: 'insightful',
      length: 'short',
      format: 'list'
    };
    
    return await handleAdvancedSummarization(requestData);
  } catch (error) {
    console.error('Legacy summarization error:', error);
    throw error;
  }
}

async function callOpenAI(transcript, apiKey) {
  const prompt = `Please provide a concise summary of this YouTube video transcript. Focus on the main points, key insights, and actionable information. Keep the summary between 100-200 words and use bullet points for better readability:

Transcript:
${transcript}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise, informative summaries of video transcripts. Always format your response with bullet points for better readability.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function handleAdvancedSummarization(requestData) {
  try {
    // Get user authentication token
    const userToken = await getUserToken();
    
    if (!userToken) {
      throw new Error('Please sign in to use the summarizer');
    }

    console.log('🚀 Using secure GPT-5 nano backend for summarization');
    console.log('📊 Request data:', {
      videoId: requestData.videoId,
      type: requestData.type,
      length: requestData.length,
      format: requestData.format
    });

    // Call secure backend with GPT-5 nano
    const response = await callSecureBackend('/summarizer/summarize', {
      transcript: requestData.transcript,
      videoId: requestData.videoId,
      type: requestData.type,
      length: requestData.length,
      format: requestData.format
    }, userToken);

    console.log('✅ Summary generated successfully with GPT-5 nano');
    
    if (response.metadata) {
      console.log('📈 Cost info:', {
        model: response.metadata.model,
        fromCache: response.metadata.fromCache,
        costSaved: response.metadata.costSaved
      });
    }

    return response.summary;
  } catch (error) {
    console.error('Secure summarization error:', error);
    throw error;
  }
}

async function handleTimestampedSummarization(requestData) {
  try {
    console.log('⚠️  Legacy timestamped summarization called - redirecting to secure backend');
    
    // Redirect to secure advanced summarization with timestamped format
    const mappedRequest = {
      transcript: requestData.transcript,
      videoId: requestData.videoId,
      type: 'insightful',
      length: 'short',
      format: 'timestamped'
    };
    
    return await handleAdvancedSummarization(mappedRequest);
  } catch (error) {
    console.error('Legacy timestamped summarization error:', error);
    throw error;
  }
}

async function callOpenAIAdvanced(requestData, apiKey) {
  const { transcript, comments, type, length, format } = requestData;
  
  let systemPrompt = getSystemPromptForType(type, length, format);
  
  let userContent = '';
  if (transcript) {
    // Convert transcript to string if it's an array
    let transcriptString = transcript;
    if (Array.isArray(transcript)) {
      transcriptString = transcript.map(segment => {
        if (typeof segment === 'string') return segment;
        if (segment && segment.text) return segment.text;
        return String(segment);
      }).join(' ');
    } else if (typeof transcript !== 'string') {
      transcriptString = String(transcript);
    }
    userContent += `Video Transcript:\n${transcriptString.substring(0, 6000)}\n\n`;
  }
  if (comments && comments.length > 0) {
    userContent += `Top Comments:\n${comments.map(c => `${c.author}: ${c.text}`).join('\n')}\n\n`;
  }
  
  const formatInstruction = format === 'qa' ? 'in Q&A format' : 'as a timestamped list with clickable timestamps';
  const lengthEmphasis = {
    short: 'VERY SHORT and concise',
    detailed: 'CONCISE but thorough'
  };
  
  const exampleFormat = length === 'short' ? 
    `Health and Longevity

🧬 Bryan Johnson's "Don't Die" movement aims to systematically remove death-causing factors like contaminated water, toxins, poor sleep, and unhealthy lifestyle choices, leveraging AI to inform and nudge humans towards healthier decisions.

AI and Human Health

🤖 Johnson believes AI will inevitably surpass human capabilities in healthcare, becoming better at taking care of humans than doctors or individuals themselves, potentially making optimal health the default rather than a luxury.` 
    : 
    `Health and Longevity

🧬 Bryan Johnson's "Don't Die" movement aims to systematically eliminate death-causing factors like contaminated water, toxins, poor sleep, and unhealthy lifestyle choices.


🤖 AI is expected to become better at managing human health than humans or doctors, potentially making optimal health the default rather than a luxury.

Lifestyle Priorities

😴 Johnson prioritizes sleep as his number one life priority, especially when adapting to a new environment, followed by exercise to start his day.


🏋️ The "Don't Die" philosophy promotes healthier lifestyle habits as a core purpose, not just for longevity but for overall well-being.`;

  userContent += `Please provide a ${lengthEmphasis[length] || length} ${type} summary of this YouTube video content ${formatInstruction}. 

  EXACT FORMAT REQUIRED (match this competitor-level example EXACTLY):
  ${exampleFormat}

  STRICT FORMATTING RULES:
  - ${length === 'short' ? 'EXACTLY 2 sections with 1 insight each' : 'EXACTLY 2 sections with 2 insights each'}
  - Section headers: ONLY specific topic names (Health and Longevity, Lifestyle Priorities, AI Integration, Global Impact, Business Strategy, Personal Development, Technology Adoption, Future Impact, etc.)
  - Section headers must be plain text with NO emojis
  - After each section header, add ONE blank line
  - Each insight: start with emoji + exactly 1-2 sentences
  - After each insight, add TWO blank lines for spacing (except last insight in section gets ONE blank line)
  - Each insight must be concrete and specific, not abstract

  FORBIDDEN HEADER PATTERNS (DO NOT USE):
  - "🎤 Exploring Key Themes"
  - "🌐 Strategic Implications" 
  - "💡 Insights on Health and Longevity"
  - "⚡️ The Role of AI in Health"
  - "Key Themes"
  - "Strategic Implications"
  - "Main Points"
  - Any header starting with an emoji

  REQUIRED HEADER EXAMPLES (USE THESE STYLES):
  - "Health and Longevity"
  - "Lifestyle Priorities"
  - "AI Integration"
  - "Global Impact"
  - "Business Strategy"
  - "Personal Development"

  SPACING REQUIREMENTS:
  - Section header
  - ONE blank line
  - First insight with emoji
  - TWO blank lines
  - Second insight with emoji (if detailed)
  - ONE blank line before next section

  NO markdown formatting (##, **, -, *)
  NO timestamps anywhere
  This must be a ${length.toUpperCase()} summary`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userContent
        }
      ],
      max_tokens: getMaxTokensForLength(length),
      temperature: getTemperatureForType(type),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function callOpenAITimestamped(requestData, apiKey) {
  const { transcript } = requestData;
  
  const prompt = `Create a timestamped summary of this YouTube video transcript. Extract the key points and organize them with timestamps. Format like this:

💰 00:00 The AI market, set to reach $1.8 trillion by 2030, presents a massive wealth opportunity for those who leverage it wisely, unlike the missed chances of past investment booms.

🧠 02:19 To get rich during the AI gold rush, focus on adding value by creating something new on top of AI infrastructure, rather than just using it, and abandon the mindset that success requires struggle.

Transcript:
${Array.isArray(transcript) 
  ? transcript.map(s => typeof s === 'string' ? s : s?.text || String(s)).join(' ').substring(0, 8000)
  : String(transcript).substring(0, 8000)}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function handleChatQuery(requestData) {
  try {
    // Get user authentication token
    const userToken = await getUserToken();
    
    if (!userToken) {
      throw new Error('Please sign in to use the chat feature');
    }

    console.log('💬 Using secure GPT-5 nano backend for chat');

    // Call secure backend chat endpoint
    const response = await callSecureBackend('/summarizer/chat', {
      question: requestData.question,
      transcript: requestData.transcript,
      videoId: requestData.videoId
    }, userToken);

    console.log('✅ Chat response generated successfully with GPT-5 nano');

    return response.answer;
  } catch (error) {
    console.error('Secure chat error:', error);
    throw error;
  }
}

async function callOpenAIChat(requestData, apiKey) {
  const { question, transcript } = requestData;
  
  // Convert transcript to string if it's an array
  let transcriptString = transcript;
  if (Array.isArray(transcript)) {
    transcriptString = transcript.map(segment => {
      if (typeof segment === 'string') return segment;
      if (segment && segment.text) return segment.text;
      return String(segment);
    }).join(' ');
  } else if (typeof transcript !== 'string') {
    transcriptString = String(transcript);
  }

  // Limit transcript length for context window
  const maxTranscriptLength = 4000;
  const truncatedTranscript = transcriptString.length > maxTranscriptLength 
    ? transcriptString.substring(0, maxTranscriptLength) + "..."
    : transcriptString;

  const systemPrompt = `You are a helpful assistant that answers questions about YouTube videos based on their transcripts. 

Instructions:
- Answer the user's question based ONLY on the information provided in the transcript
- Be concise but informative
- If the transcript doesn't contain information to answer the question, say so clearly
- Use a friendly, conversational tone
- Don't make up information not in the transcript
- If asked about specific timestamps, you can refer to parts of the video but don't make up exact times`;

  const userPrompt = `Based on this video transcript, please answer the following question:

Question: ${question}

Video Transcript:
${truncatedTranscript}

Please provide a helpful answer based on the transcript content.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

function getSystemPromptForType(type, length, format) {
  const basePrompts = {
    insightful: "You are an expert content analyst who creates professional, competitor-level summaries. Extract the most valuable insights and organize them into specific, meaningful topic sections. Focus on concrete, actionable information rather than abstract concepts. NEVER use generic section headers with emojis like '🎤 Exploring Key Themes' or '🌐 Strategic Implications'.",
    funny: "You are a professional content analyst who identifies humorous, entertaining aspects while maintaining high-quality organization. Create topic-focused sections with concise, specific points about comedy and entertainment elements.",
    actionable: "You are a productivity expert who creates professional summaries focused on practical implementation. Organize content into clear topic sections with specific, actionable advice that viewers can immediately apply.",
    controversial: "You are a professional analyst who identifies debate-worthy content while maintaining objective, high-quality organization. Create topic-focused sections with specific points about conflicting viewpoints and discussion topics."
  };
  
  const lengthInstructions = {
    short: "Create EXACTLY 2 specific topic sections. Under each section, provide EXACTLY 1 insight (1-2 sentences max) starting with a relevant emoji.",
    detailed: "Create EXACTLY 2 specific topic sections. Under each section, provide EXACTLY 2 insights (1-2 sentences each) starting with relevant emojis."
  };

  const formatInstructions = {
    qa: getQAInstructionForLength(length),
    list: `EXACT COMPETITOR FORMAT REQUIREMENTS:
    1. Section headers: SPECIFIC TOPICS only (examples: 'Health and Longevity', 'AI Integration', 'Lifestyle Priorities', 'Global Impact', 'Business Strategy', 'Personal Development')
    2. NEVER EVER use these headers: 'Key Themes', 'Strategic Implications', 'Main Points', 'Exploring Themes', 'Insights on', 'The Role of' or any header starting with an emoji
    3. Structure: ${length === 'short' ? '2 sections, 1 insight each' : '2 sections, 2 insights each'}
    4. Each insight: single emoji + exactly 1-2 sentences, ultra-specific and concrete
    5. Proper spacing: section header + blank line + insight + double blank lines + next insight
    6. Focus on factual, actionable content rather than abstract analysis
    7. NO markdown formatting (no ##, **, or -)
    8. NO timestamps anywhere
    9. Use topic-relevant emojis: 🧬😴🏋️🤖🧠💡🔬🌍📊💰⚡🎯🔥🌟📈🎤💼🏆🚀`
  };

  function getQAInstructionForLength(length) {
    switch(length) {
      case 'short': return "Format as Q&A with exactly 2 questions and very brief answers.";
      case 'detailed': return "Format as Q&A with exactly 3 questions and concise but thorough answers.";
      default: return "Format as Q&A with 2 questions and brief answers.";
    }
  }
  
  return `${basePrompts[type]} ${lengthInstructions[length]} ${formatInstructions[format]} Create competitor-level professional summaries with specific topics and concise, focused insights. CRITICAL: Never use generic emoji headers like '🎤 Exploring Key Themes'.`;
}

function getMaxTokensForLength(length) {
  switch(length) {
    case 'short': return 120;   // 2 sections, 1 insight each
    case 'detailed': return 200; // 2 sections, 2 insights each (half of previous size)
    default: return 120;
  }
}

function getTemperatureForType(type) {
  switch(type) {
    case 'funny': return 0.8;
    case 'controversial': return 0.6;
    case 'actionable': return 0.5;
    case 'insightful': return 0.7;
    default: return 0.7;
  }
}

// Helper function to check if summary is cached
async function getCachedSummary(cacheKey) {
  const result = await chrome.storage.local.get([cacheKey]);
  const cached = result[cacheKey];
  
  if (cached) {
    // Check if cache is still fresh (reduced to 1 hour for testing)
    const isExpired = Date.now() - cached.timestamp > 60 * 60 * 1000; // 1 hour instead of 24
    if (!isExpired) {
      console.log('✅ Cache hit for:', cacheKey);
      return cached.summary;
    } else {
      console.log('⏰ Cache expired for:', cacheKey);
      // Remove expired cache
      await chrome.storage.local.remove([cacheKey]);
    }
  } else {
    console.log('❌ No cache found for:', cacheKey);
  }
  
  return null;
}

// Clean up old cached summaries periodically and clear cache on startup to force length differentiation
chrome.runtime.onStartup.addListener(async () => {
  console.log('🧹 Cleaning up cached summaries on startup...');
  const storage = await chrome.storage.local.get();
  const keysToRemove = [];
  
  for (const [key, value] of Object.entries(storage)) {
    if (key.startsWith('summary_') || key.startsWith('advanced_')) {
      // Remove all old summaries to force regeneration with new length prompts
      if (value && value.timestamp) {
        // Remove summaries older than 1 day to ensure new length differences take effect
        if (Date.now() - value.timestamp > 24 * 60 * 60 * 1000) {
          keysToRemove.push(key);
        }
      }
    }
  }
  
  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
    console.log(`🧹 Cleaned up ${keysToRemove.length} cached summaries`);
  }
});

// Secure Backend Helper Functions
async function callSecureBackend(endpoint, data, userToken) {
  const url = `${CONFIG.API_BASE_URL}${endpoint}`;
  
  for (let attempt = 0; attempt < CONFIG.RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`🔗 Calling secure backend: ${endpoint} (attempt ${attempt + 1})`);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ Backend call timeout after 30 seconds: ${endpoint}`);
        controller.abort();
      }, 30000); // 30 second timeout
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
          'X-Extension-ID': chrome.runtime.id,
          'X-Extension-Version': chrome.runtime.getManifest().version
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please sign in again.');
        } else if (response.status === 429) {
          throw new Error(errorData.error || 'Rate limit exceeded. Please try again later.');
        } else if (response.status === 403) {
          throw new Error('Subscription required. Please upgrade your plan.');
        } else {
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('✅ Backend call successful');
      return result;

    } catch (error) {
      console.error(`❌ Backend call failed (attempt ${attempt + 1}):`, error);
      
      // Handle timeout specifically
      if (error.name === 'AbortError') {
        throw new Error('Backend request timed out after 30 seconds. Please check if backend is running on http://localhost:3001');
      }
      
      if (attempt === CONFIG.RETRY_ATTEMPTS - 1) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * (attempt + 1)));
    }
  }
}

// User Token Management
async function getUserToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['youtube_summarizer_token'], (result) => {
      resolve(result.youtube_summarizer_token);
    });
  });
}

// Update user token when user signs in (called from content script)
async function updateUserToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ youtube_summarizer_token: token }, () => {
      console.log('✅ User token updated');
      resolve(true);
    });
  });
}

// Clear user token on sign out
async function clearUserToken() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['youtube_summarizer_token', 'youtube_summarizer_user'], () => {
      console.log('🗑️ User token and data cleared');
      resolve(true);
    });
  });
}

// Test 1: Check if background script is alive
console.log('🔍 Testing background script communication...');
chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
  if (chrome.runtime.lastError) {
    console.log('❌ Background script ERROR:', chrome.runtime.lastError.message);
    console.log('💡 SOLUTION: Reload extension in chrome://extensions/');
  } else {
    console.log('✅ Background script is responding');
  }
});

// Test 2: Test the exact message that's failing
console.log('🔍 Testing summarizeAdvanced message...');
chrome.runtime.sendMessage({
  action: 'summarizeAdvanced',
  data: { test: 'debug message' }
}, (response) => {
  if (chrome.runtime.lastError) {
    console.log('❌ summarizeAdvanced message ERROR:', chrome.runtime.lastError.message);
  } else {
    console.log('✅ summarizeAdvanced message sent successfully');
    console.log('📥 Response:', response);
  }
});
