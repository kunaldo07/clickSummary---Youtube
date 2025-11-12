const express = require('express');
const OpenAI = require('openai');
const crypto = require('crypto');
const { auth } = require('../middleware/auth');
const { requireActiveSubscription } = require('../middleware/subscription');
const { checkCostLimit, trackCost } = require('../middleware/costTracking');

// Use DevUser in development to avoid ObjectId casts; otherwise use MongoDB User
let User;
if (process.env.NODE_ENV === 'development') {
  console.log('📝 Summarizer routes: Development mode - using in-memory DevUser');
  User = require('../models/DevUser');
} else {
  try {
    User = require('../models/User');
  } catch (error) {
    console.log('📝 Summarizer routes: MongoDB not available - falling back to DevUser');
    User = require('../models/DevUser');
  }
}

const router = express.Router();

// Initialize OpenAI with GPT-4o Mini configuration and network retry settings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30000, // 30 seconds
  dangerouslyAllowBrowser: false
});

// Configuration
const CONFIG = {
  PRIMARY_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  BACKUP_MODEL: process.env.OPENAI_BACKUP_MODEL || 'gpt-3.5-turbo',
  MAX_TOKENS: {
    short: parseInt(process.env.OPENAI_MAX_TOKENS_SHORT) || 220,
    detailed: parseInt(process.env.OPENAI_MAX_TOKENS_DETAILED) || 380,
    chat: parseInt(process.env.OPENAI_MAX_TOKENS_CHAT) || 150
  },
  MAX_TRANSCRIPT_LENGTH: parseInt(process.env.MAX_TRANSCRIPT_LENGTH) || 8000,
  COST_PER_1K_INPUT: parseFloat(process.env.COST_PER_1K_INPUT_TOKENS) || 0.00015,
  COST_PER_1K_OUTPUT: parseFloat(process.env.COST_PER_1K_OUTPUT_TOKENS) || 0.0006,
  COST_PER_1K_CACHED: parseFloat(process.env.COST_PER_1K_CACHED_TOKENS) || 0.000075
};

// Summarize endpoint with GPT-4o Mini
router.post('/summarize', auth, requireActiveSubscription, checkCostLimit, async (req, res) => {
  try {
    const { transcript, videoId, type, length, format } = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!transcript || !videoId || !type || !length || !format) {
      return res.status(400).json({ 
        error: 'Missing required fields: transcript, videoId, type, length, format' 
      });
    }

    // Validate enum values
    const validTypes = ['insightful', 'funny', 'actionable', 'controversial'];
    const validLengths = ['short', 'detailed'];
    const validFormats = ['list', 'paragraph', 'timestamped'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be: ' + validTypes.join(', ') });
    }
    if (!validLengths.includes(length)) {
      return res.status(400).json({ error: 'Invalid length. Must be: ' + validLengths.join(', ') });
    }
    if (!validFormats.includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Must be: ' + validFormats.join(', ') });
    }

    console.log('🚀 RECEIVED DATA:', { transcript, videoId, type, length, format });
    console.log(`🎯 Generating ${type} ${length} summary for video ${videoId} (user: ${userId})`);

    // Get user and check usage limits
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user can create a summary
    const summaryCheck = user.canCreateSummary();
    if (!summaryCheck.allowed) {
      const limits = user.getDailyLimits();
      return res.status(429).json({ 
        error: 'Daily summary limit reached',
        code: 'DAILY_LIMIT_EXCEEDED',
        details: {
          limit: limits.summaries,
          used: summaryCheck.used,
          remaining: summaryCheck.remaining,
          planType: user.subscription.planType,
          resetTime: new Date(Date.now() + (24 * 60 * 60 * 1000)) // Tomorrow
        }
      });
    }

    // Optimize transcript for GPT-4o Mini
    const optimizedTranscript = optimizeTranscriptForModel(transcript);

    console.log('🚀 OPTIMIZED TRANSCRIPT:', optimizedTranscript);
    
    // Generate summary with GPT-4o Mini
    const result = await generateOptimizedSummary({
      transcript: optimizedTranscript,
      type,
      length,
      format
    });

    // Calculate cost
    const cost = calculateCost(result.inputTokens, result.outputTokens);
    
    // Track cost and usage
    await trackCost(userId, videoId, 'summary_generated', CONFIG.PRIMARY_MODEL, result.inputTokens, result.outputTokens, cost);
    
    // Update user usage
    user.incrementUsage('summary', cost);
    await user.save();

    console.log(`✅ Summary generated successfully (cost: $${cost.toFixed(6)})`);

    res.json({
      summary: result.summary,
      metadata: {
        model: CONFIG.PRIMARY_MODEL,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cost: cost,
        fromCache: false
      }
    });

  } catch (error) {
    console.error('Summarization error:', error);
    
    if (error.message.includes('rate limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    if (error.message.includes('quota')) {
      return res.status(503).json({ error: 'AI service temporarily unavailable. Please try again later.' });
    }
    
    res.status(500).json({ error: 'Failed to generate summary. Please try again.' });
  }
});

// Chat endpoint with GPT-4o Mini
router.post('/chat', auth, requireActiveSubscription, checkCostLimit, async (req, res) => {
  try {
    const { question, transcript, videoId } = req.body;
    const userId = req.userId;

    if (!question || !transcript || !videoId) {
      return res.status(400).json({ 
        error: 'Missing required fields: question, transcript, videoId' 
      });
    }

    console.log(`💬 Processing chat query for video ${videoId} (user: ${userId})`);

    // Get user and check usage limits
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user can use chat feature
    const chatCheck = user.canUseChat();
    if (!chatCheck.allowed) {
      const limits = user.getDailyLimits();
      return res.status(429).json({ 
        error: 'Daily chat limit reached',
        code: 'DAILY_CHAT_LIMIT_EXCEEDED',
        details: {
          limit: limits.chatQueries,
          used: chatCheck.used,
          remaining: chatCheck.remaining,
          planType: user.subscription.planType,
          resetTime: new Date(Date.now() + (24 * 60 * 60 * 1000)) // Tomorrow
        }
      });
    }

    // Optimize transcript for context
    const optimizedTranscript = optimizeTranscriptForModel(transcript);
    
    // Generate chat response
    const result = await generateOptimizedChatResponse({
      question,
      transcript: optimizedTranscript
    });

    // Calculate cost
    const cost = calculateCost(result.inputTokens, result.outputTokens);
    
    // Track cost and usage
    await trackCost(userId, videoId, 'chat_query', CONFIG.PRIMARY_MODEL, result.inputTokens, result.outputTokens, cost);
    
    // Update user usage
    user.incrementUsage('chat', cost);
    await user.save();

    console.log(`✅ Chat response generated (cost: $${cost.toFixed(6)})`);

    res.json({
      answer: result.answer,
      metadata: {
        model: CONFIG.PRIMARY_MODEL,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cost: cost
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    
    if (error.message.includes('rate limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    res.status(500).json({ error: 'Failed to generate chat response. Please try again.' });
  }
});

// Helper Functions

// Timeout wrapper for OpenAI API calls
async function callOpenAIWithTimeout(apiCall, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`OpenAI API call timed out after ${timeoutMs/1000} seconds`));
    }, timeoutMs);

    apiCall()
      .then(result => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

async function generateOptimizedSummary({ transcript, type, length, format }) {
  const prompt = getOptimizedPromptForGPT4oMini(type, length, format);
  const maxTokens = getMaxTokensForLength(length);
  const inputText = `${prompt}\n\nTranscript: ${transcript}`;
  
  try {
    console.log(`🤖 Calling ${CONFIG.PRIMARY_MODEL} (Chat Completions API) for summary generation (25s timeout)`);
    
    const completion = await callOpenAIWithTimeout(async () => {
      return await openai.chat.completions.create({
        model: CONFIG.PRIMARY_MODEL,
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: `Transcript: ${transcript}`
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      });
    }, 25000);

    const summaryText = (completion.choices[0]?.message?.content || '').trim();
    const cleaned = ensureSummaryCompleteness(summaryText, length);
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const outputTokens = completion.usage?.completion_tokens || 0;

    return {
      summary: cleaned,
      inputTokens,
      outputTokens
    };
  } catch (error) {
    console.warn(`❌ ${CONFIG.PRIMARY_MODEL} failed (${error.message}), trying backup model:`);
    
    try {
      const completion = await callOpenAIWithTimeout(async () => {
        return await openai.chat.completions.create({
          model: CONFIG.BACKUP_MODEL,
          messages: [
            {
              role: 'system',
              content: prompt
            },
            {
              role: 'user',
              content: `Transcript: ${transcript}`
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.7
        });
      }, 25000);

      const summaryText = (completion.choices[0]?.message?.content || '').trim();
      const cleaned = ensureSummaryCompleteness(summaryText, length);
      const inputTokens = completion.usage?.prompt_tokens || 0;
      const outputTokens = completion.usage?.completion_tokens || 0;

      return {
        summary: cleaned,
        inputTokens,
        outputTokens
      };
    } catch (backupError) {
      console.warn(`❌ Backup model failed (${backupError.message}).`);
      // Development fallback: synthesize a structured summary to avoid 500s locally
      if (process.env.NODE_ENV === 'development' || !process.env.OPENAI_API_KEY) {
        console.log('🔧 Using development fallback summary generation');
        const total = (length === 'detailed') ? 12 : 6;
        const sentences = String(transcript)
          .split(/[.!?]+/)
          .map(s => s.trim())
          .filter(Boolean)
          .slice(0, total);
        const perSection = Math.max(1, Math.floor(total / 4));
        const sections = {
          key: sentences.slice(0, perSection),
          why: sentences.slice(perSection, perSection * 2),
          evidence: sentences.slice(perSection * 2, perSection * 3),
          actions: sentences.slice(perSection * 3, total)
        };
        const toBullets = arr => (arr.length ? arr.map(s => `• ${s}`).join('\n') : '• N/A');
        const fallback = `🎯 Key Ideas\n${toBullets(sections.key)}\n\n📌 Why It Matters\n${toBullets(sections.why)}\n\n🔍 Evidence / Context\n${toBullets(sections.evidence)}\n\n✅ Actionable Takeaways\n${toBullets(sections.actions)}`;
        return { summary: fallback, inputTokens: 0, outputTokens: 0 };
      }
      throw backupError;
    }
  }
}

async function generateOptimizedChatResponse({ question, transcript }) {
  const prompt = `You are a helpful AI assistant that answers questions about YouTube videos based on their transcripts. 

Guidelines:
- Answer directly and concisely
- Base your answer only on the provided transcript
- If the transcript doesn't contain relevant information, say so
- Keep responses under 150 words
- Be conversational but informative`;

  try {
    console.log(`🤖 Chat response with ${CONFIG.PRIMARY_MODEL} (Chat Completions API, 25s timeout)`);
    const completion = await callOpenAIWithTimeout(async () => {
      return await openai.chat.completions.create({
        model: CONFIG.PRIMARY_MODEL,
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: `Transcript: ${transcript}\n\nQuestion: ${question}`
          }
        ],
        max_tokens: CONFIG.MAX_TOKENS.chat,
        temperature: 0.7
      });
    }, 25000);

    const answerText = (completion.choices[0]?.message?.content || '').trim();
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const outputTokens = completion.usage?.completion_tokens || 0;

    return {
      answer: answerText,
      inputTokens,
      outputTokens
    };
  } catch (error) {
    console.warn(`❌ ${CONFIG.PRIMARY_MODEL} failed for chat (${error.message}), trying backup:`);
    
    try {
      console.log(`🔄 Chat backup with ${CONFIG.BACKUP_MODEL} (Chat Completions API, 25s timeout)`);
      const completion = await callOpenAIWithTimeout(async () => {
        return await openai.chat.completions.create({
          model: CONFIG.BACKUP_MODEL,
          messages: [
            {
              role: 'system',
              content: prompt
            },
            {
              role: 'user',
              content: `Transcript: ${transcript}\n\nQuestion: ${question}`
            }
          ],
          max_tokens: CONFIG.MAX_TOKENS.chat,
          temperature: 0.7
        });
      }, 25000);

      const answerText = (completion.choices[0]?.message?.content || '').trim();
      const inputTokens = completion.usage?.prompt_tokens || 0;
      const outputTokens = completion.usage?.completion_tokens || 0;

      return {
        answer: answerText,
        inputTokens,
        outputTokens
      };
    } catch (backupError) {
      console.warn(`❌ Chat backup model failed (${backupError.message}).`);
      if (process.env.NODE_ENV === 'development' || !process.env.OPENAI_API_KEY) {
        console.log('🔧 Using development fallback chat response');
        const fallback = 'Sorry, I could not generate a response right now. Based on the transcript, try rephrasing your question or summarizing the main topic.';
        return { answer: fallback, inputTokens: 0, outputTokens: 0 };
      }
      throw backupError;
    }
  }
}

function optimizeTranscriptForModel(transcript) {
  // Convert to string if array of segments
  let text = Array.isArray(transcript)
    ? transcript.map(s => (s && s.text) ? s.text : String(s)).join(' ')
    : String(transcript || '');

  // Normalize line breaks
  text = text.replace(/\r\n|\r/g, '\n');

  // Remove bracketed tags and common noise (e.g., [Music], [Applause])
  text = text
    .replace(/\[(?:music|applause|laughter|silence|intro|outro|music[^\]]*|sound[^\]]*)\]/gi, ' ')
    .replace(/\((?:music|applause|laughter|silence|intro|outro)\)/gi, ' ');

  // Remove standalone timestamps at line starts and inline time markers
  text = text
    .replace(/^\s*\d{1,2}:\d{2}(?::\d{2})?\s*/gm, ' ')
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ');

  // Remove leftover bullet glyphs and normalize spaces
  text = text.replace(/[•·►▪︎]/g, ' ').replace(/\s+/g, ' ').trim();

  // Truncate if too long for the model (post-cleaning)
  if (text.length > CONFIG.MAX_TRANSCRIPT_LENGTH) {
    console.log(`⚡ Truncating transcript from ${text.length} to ${CONFIG.MAX_TRANSCRIPT_LENGTH} chars`);
    text = text.substring(0, CONFIG.MAX_TRANSCRIPT_LENGTH) + '...';
  }

  return text;
}

function calculateCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1000) * CONFIG.COST_PER_1K_INPUT;
  const outputCost = (outputTokens / 1000) * CONFIG.COST_PER_1K_OUTPUT;
  return inputCost + outputCost;
}

function getOptimizedPromptForGPT4oMini(type, length, format) {
  const totalPoints = length === 'detailed' ? 12 : 6;

  const rules = `You are an expert summarizer. Produce a high-signal summary from the cleaned transcript.
Output rules:
- Organize into ALL of the following sections with emoji headers (in this exact order):
  🎯 Key Ideas
  📌 Why It Matters
  🔍 Evidence / Context
  ✅ Actionable Takeaways
- Each section MUST be present with at least 1 bullet. For short summaries, keep 1–2 bullets per section.
- Write concise bullets (1–2 sentences each). Distribute a total of at most ${totalPoints} bullets across all sections.
- Do NOT quote the transcript verbatim; synthesize and paraphrase.
- Remove fluff (e.g., "um"), ignore stage directions like [Music], and ignore timestamps.
- Ensure there are no partial or cut-off bullets; end with a complete bullet.
- If content is thin, prioritize “🎯 Key Ideas” and “✅ Actionable Takeaways”.`;

  const style = (() => {
    switch (type) {
      case 'funny':
        return 'Tone: light and witty where appropriate, but keep it informative.';
      case 'actionable':
        return 'Tone: practical and implementation-focused. Emphasize concrete steps.';
      case 'controversial':
        return 'Tone: balanced; present opposing viewpoints clearly.';
      default:
        return 'Tone: clear, objective, insightful.';
    }
  })();

  return `${rules}\n${style}\nFormat exactly as:\n🎯 Key Ideas\n• ...\n• ...\n\n📌 Why It Matters\n• ...\n\n🔍 Evidence / Context\n• ...\n\n✅ Actionable Takeaways\n• ...`;
}

function getMaxTokensForLength(length) {
  return CONFIG.MAX_TOKENS[length] || CONFIG.MAX_TOKENS.short;
}

function hashString(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

// Ensure all required sections exist and there are no dangling bullets
function ensureSummaryCompleteness(text, length) {
  const headers = [
    '🎯 Key Ideas',
    '📌 Why It Matters',
    '🔍 Evidence / Context',
    '✅ Actionable Takeaways'
  ];
  let s = String(text || '').trim();
  // Add missing headers with at least one bullet
  headers.forEach((h) => {
    if (!s.includes(h)) {
      s += `${s.endsWith('\n') ? '' : '\n\n'}${h}\n• N/A`;
    }
  });
  // Remove a dangling bullet at the end like "\n•" or "\n•   "
  s = s.replace(/\n•\s*$/, '');
  return s.trim();
}

// Get user usage information
router.get('/usage', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Reset daily usage if needed
    user.resetDailyUsage();
    
    // Get limits and usage info
    const limits = user.getDailyLimits();
    const summaryCheck = user.canCreateSummary();
    const chatCheck = user.canUseChat();

    res.json({
      planType: user.subscription.planType,
      isPaid: user.canUsePremiumFeatures(),
      limits: {
        summaries: limits.summaries,
        chatQueries: limits.chatQueries
      },
      usage: {
        summaries: {
          today: user.usage.summariesToday,
          remaining: summaryCheck.remaining,
          canUse: summaryCheck.allowed
        },
        chat: {
          today: user.usage.chatQueriesToday,
          remaining: chatCheck.remaining,
          canUse: chatCheck.allowed
        }
      },
      resetTime: new Date(Date.now() + (24 * 60 * 60 * 1000)) // Tomorrow
    });

  } catch (error) {
    console.error('Usage info error:', error);
    res.status(500).json({ error: 'Failed to get usage information' });
  }
});

// Test OpenAI connection endpoint (development only)
router.get('/test-openai', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Test endpoint only available in development' });
  }

  try {
    console.log('🧪 Testing OpenAI connection...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello, OpenAI connection is working!"' }
      ],
      max_tokens: 20
    });

    const response = completion.choices[0]?.message?.content || 'No response';
    
    res.json({
      success: true,
      message: 'OpenAI connection successful',
      response: response,
      model: completion.model,
      usage: completion.usage
    });

  } catch (error) {
    console.error('❌ OpenAI test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      details: {
        message: error.message,
        cause: error.cause?.message || 'Unknown',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
});

module.exports = router;