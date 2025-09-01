const express = require('express');
const OpenAI = require('openai');
const crypto = require('crypto');
const { auth } = require('../middleware/auth');
const { requireActiveSubscription } = require('../middleware/subscription');
const { checkCostLimit, trackCost } = require('../middleware/costTracking');

// Try to use MongoDB User model, fall back to DevUser if MongoDB is not available
let User;
try {
  User = require('../models/User');
} catch (error) {
  console.log('📝 Summarizer routes: Using in-memory DevUser for development');
  User = require('../models/DevUser');
}

const router = express.Router();

// Initialize OpenAI with GPT-4o Mini configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration
const CONFIG = {
  PRIMARY_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  BACKUP_MODEL: process.env.OPENAI_BACKUP_MODEL || 'gpt-4o-mini',
  MAX_TOKENS: {
    short: parseInt(process.env.OPENAI_MAX_TOKENS_SHORT) || 120,
    detailed: parseInt(process.env.OPENAI_MAX_TOKENS_DETAILED) || 200,
    chat: parseInt(process.env.OPENAI_MAX_TOKENS_CHAT) || 150
  },
  MAX_TRANSCRIPT_LENGTH: parseInt(process.env.MAX_TRANSCRIPT_LENGTH) || 8000,
  COST_PER_1K_INPUT: parseFloat(process.env.COST_PER_1K_INPUT_TOKENS) || 0.00005,
  COST_PER_1K_OUTPUT: parseFloat(process.env.COST_PER_1K_OUTPUT_TOKENS) || 0.0004,
  COST_PER_1K_CACHED: parseFloat(process.env.COST_PER_1K_CACHED_TOKENS) || 0.000005
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
    const user = await User.findById(userId);
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
    const user = await User.findById(userId);
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
  
  try {
    console.log(`🤖 Calling ${CONFIG.PRIMARY_MODEL} for summary generation (25s timeout)`);
    
    const completion = await callOpenAIWithTimeout(async () => {
      return await openai.chat.completions.create({
        model: CONFIG.PRIMARY_MODEL,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `Transcript: ${transcript}` }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });
    }, 25000); // 25 second timeout

    return {
      summary: completion.choices[0].message.content.trim(),
      inputTokens: completion.usage.prompt_tokens,
      outputTokens: completion.usage.completion_tokens
    };
  } catch (error) {
    console.warn(`❌ ${CONFIG.PRIMARY_MODEL} failed (${error.message}), trying backup model:`);
    
    // Fallback to backup model
    console.log(`🔄 Trying backup model ${CONFIG.BACKUP_MODEL} (25s timeout)`);
    const completion = await callOpenAIWithTimeout(async () => {
      return await openai.chat.completions.create({
        model: CONFIG.BACKUP_MODEL,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `Transcript: ${transcript}` }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      });
    }, 25000); // 25 second timeout

    return {
      summary: completion.choices[0].message.content.trim(),
      inputTokens: completion.usage.prompt_tokens,
      outputTokens: completion.usage.completion_tokens
    };
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
    console.log(`🤖 Chat response with ${CONFIG.PRIMARY_MODEL} (25s timeout)`);
    const completion = await callOpenAIWithTimeout(async () => {
      return await openai.chat.completions.create({
        model: CONFIG.PRIMARY_MODEL,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `Transcript: ${transcript}\n\nQuestion: ${question}` }
        ],
        max_tokens: CONFIG.MAX_TOKENS.chat,
        temperature: 0.7
      });
    }, 25000); // 25 second timeout

    return {
      answer: completion.choices[0].message.content.trim(),
      inputTokens: completion.usage.prompt_tokens,
      outputTokens: completion.usage.completion_tokens
    };
  } catch (error) {
    console.warn(`❌ ${CONFIG.PRIMARY_MODEL} failed for chat (${error.message}), trying backup:`);
    
    console.log(`🔄 Chat backup with ${CONFIG.BACKUP_MODEL} (25s timeout)`);
    const completion = await callOpenAIWithTimeout(async () => {
      return await openai.chat.completions.create({
        model: CONFIG.BACKUP_MODEL,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `Transcript: ${transcript}\n\nQuestion: ${question}` }
        ],
        max_tokens: CONFIG.MAX_TOKENS.chat,
        temperature: 0.7
      });
    }, 25000); // 25 second timeout

    return {
      answer: completion.choices[0].message.content.trim(),
      inputTokens: completion.usage.prompt_tokens,
      outputTokens: completion.usage.completion_tokens
    };
  }
}

function optimizeTranscriptForModel(transcript) {
  // Convert to string if array
  let text = Array.isArray(transcript) 
    ? transcript.map(segment => segment.text || segment).join(' ')
    : String(transcript);
  
  // Remove excessive whitespace and clean up
  text = text.replace(/\s+/g, ' ').trim();
  
  // Truncate if too long for GPT-4o Mini
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
  const baseRules = `Create a ${length} summary in ${format} format. Follow these strict rules:

FORMATTING RULES:
- No emoji section headers (❌ Bad: "🎯 Key Points") 
- Use simple text headers (✅ Good: "Key Points")
- Each point must be 1-2 sentences maximum
- No repetition between points
- Content must be concrete and specific

LENGTH REQUIREMENTS:
- Short: Maximum 3 sections, 2 points each (6 total points)
- Detailed: Maximum 4 sections, 3 points each (12 total points)

SECTION SPACING:
- Exactly 2 blank lines between sections
- No blank lines within sections
- Points start with emoji + space`;

  const typePrompts = {
    insightful: `${baseRules}

TYPE: Insightful Analysis
Focus on: Key learnings, important concepts, valuable insights, practical takeaways
Style: Educational and thought-provoking`,

    funny: `${baseRules}

TYPE: Funny Highlights  
Focus on: Humorous moments, witty comments, entertaining stories, amusing observations
Style: Light-hearted and engaging`,

    actionable: `${baseRules}

TYPE: Actionable Takeaways
Focus on: Specific steps, practical advice, implementable strategies, clear instructions  
Style: Direct and implementation-focused`,

    controversial: `${baseRules}

TYPE: Controversial Points
Focus on: Debatable topics, opposing viewpoints, provocative statements, discussion-worthy claims
Style: Balanced and thought-provoking`
  };

  return typePrompts[type] || typePrompts.insightful;
}

function getMaxTokensForLength(length) {
  return CONFIG.MAX_TOKENS[length] || CONFIG.MAX_TOKENS.short;
}

function hashString(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

module.exports = router;