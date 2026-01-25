const express = require('express');
const OpenAI = require('openai');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { authenticateSupabase } = require('../middleware/supabaseAuth');
const { requireActiveSubscription } = require('../middleware/subscription');
const { checkCostLimit, trackCost } = require('../middleware/costTracking');
const SupabaseUser = require('../models/SupabaseUser');

const router = express.Router();

// Initialize OpenAI with GPT-4o Mini configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30000,
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

// Load summary prompts
const promptsPath = path.join(__dirname, '../config/summaryPrompts.json');
let PROMPTS = {};
try {
  const promptsData = fs.readFileSync(promptsPath, 'utf8');
  const rawPrompts = JSON.parse(promptsData);
  
  // Restructure prompts to use descriptive keys (e.g., "insightful_list_short")
  Object.values(rawPrompts).forEach(prompt => {
    if (prompt.key) {
      PROMPTS[prompt.key] = prompt;
    }
  });
  
  console.log(`✅ Loaded ${Object.keys(PROMPTS).length} prompts from summaryPrompts.json`);
} catch (error) {
  console.error('❌ Failed to load summary prompts:', error.message);
  process.exit(1);
}

// Helper functions
function calculateCost(inputTokens, outputTokens, cached = false) {
  const inputCost = (inputTokens / 1000) * (cached ? CONFIG.COST_PER_1K_CACHED : CONFIG.COST_PER_1K_INPUT);
  const outputCost = (outputTokens / 1000) * CONFIG.COST_PER_1K_OUTPUT;
  return inputCost + outputCost;
}

function truncateTranscript(transcript, maxLength = CONFIG.MAX_TRANSCRIPT_LENGTH) {
  if (transcript.length <= maxLength) return transcript;
  return transcript.substring(0, maxLength) + '... [truncated]';
}

// Summarize endpoint
router.post('/summarize', authenticateSupabase, requireActiveSubscription, checkCostLimit, async (req, res) => {
  try {
    const { transcript, videoId, type, length, format } = req.body;
    const userId = req.user.id;

    if (!transcript || !videoId || !type || !length || !format) {
      return res.status(400).json({ 
        error: 'Missing required fields: transcript, videoId, type, length, format' 
      });
    }

    const validTypes = ['insightful', 'funny', 'actionable', 'controversial', 'eli5'];
    const validLengths = ['short', 'detailed'];
    const validFormats = ['list', 'qa'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be: ' + validTypes.join(', ') });
    }
    if (!validLengths.includes(length)) {
      return res.status(400).json({ error: 'Invalid length. Must be: ' + validLengths.join(', ') });
    }
    if (!validFormats.includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Must be: ' + validFormats.join(', ') });
    }

    console.log('🚀 RECEIVED DATA:', { transcriptLength: transcript.length, type, length, format });
    console.log(`🎯 Generating ${type} ${length} summary (user: ${userId})`);

    // Check usage limits
    const summaryCheck = await SupabaseUser.canCreateSummary(userId);
    if (!summaryCheck.allowed) {
      return res.status(429).json({
        error: 'Monthly summary limit reached',
        message: `You have used all ${summaryCheck.limit} summaries for this month. Limit resets on ${new Date(summaryCheck.renewalDate).toLocaleDateString()}.`,
        usage: {
          used: summaryCheck.used,
          limit: summaryCheck.limit,
          remaining: summaryCheck.remaining,
          renewalDate: summaryCheck.renewalDate
        }
      });
    }

    // Get prompt
    const promptKey = `${type}_${format}_${length}`;
    const systemPrompt = PROMPTS[promptKey];
    
    if (!systemPrompt) {
      return res.status(400).json({ 
        error: `No prompt found for combination: ${promptKey}` 
      });
    }

    console.log('🔍 Debug - promptKey:', promptKey);
    console.log('🔍 Debug - systemPrompt type:', typeof systemPrompt);
    console.log('🔍 Debug - systemPrompt.prompt type:', typeof systemPrompt.prompt);
    console.log('🔍 Debug - systemPrompt.prompt preview:', systemPrompt.prompt?.substring(0, 100));

    const truncatedTranscript = truncateTranscript(transcript);
    const maxTokens = CONFIG.MAX_TOKENS[length] || 300;

    // Generate summary
    const completion = await openai.chat.completions.create({
      model: CONFIG.PRIMARY_MODEL,
      messages: [
        { role: 'system', content: systemPrompt.prompt },
        { role: 'user', content: truncatedTranscript }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 0.9
    });

    const summary = completion.choices[0].message.content.trim();
    const inputTokens = completion.usage.prompt_tokens;
    const outputTokens = completion.usage.completion_tokens;
    const cost = calculateCost(inputTokens, outputTokens);

    // Track cost
    await trackCost(userId, videoId, 'summary_generated', CONFIG.PRIMARY_MODEL, inputTokens, outputTokens, cost);
    
    // Update usage
    await SupabaseUser.incrementUsage(userId, 'summary', cost);

    console.log(`✅ Summary generated (${inputTokens} + ${outputTokens} tokens, $${cost.toFixed(6)})`);

    res.json({
      summary,
      metadata: {
        model: CONFIG.PRIMARY_MODEL,
        inputTokens,
        outputTokens,
        cost: cost.toFixed(6),
        type,
        length,
        format
      }
    });

  } catch (error) {
    console.error('❌ Summarization error:', error);
    res.status(500).json({ 
      error: 'Failed to generate summary',
      message: error.message 
    });
  }
});

// Chat endpoint
router.post('/chat', authenticateSupabase, requireActiveSubscription, checkCostLimit, async (req, res) => {
  try {
    const { question, transcript, videoId } = req.body;
    const userId = req.user.id;

    if (!question || !transcript || !videoId) {
      return res.status(400).json({ 
        error: 'Missing required fields: question, transcript, videoId' 
      });
    }

    console.log(`💬 Processing chat query (user: ${userId})`);

    // Check usage limits
    const chatCheck = await SupabaseUser.canUseChat(userId);
    if (!chatCheck.allowed) {
      return res.status(429).json({
        error: 'Monthly chat limit reached',
        message: `You have used all ${chatCheck.limit} chat queries for this month. Limit resets on ${new Date(chatCheck.renewalDate).toLocaleDateString()}.`,
        usage: {
          used: chatCheck.used,
          limit: chatCheck.limit,
          remaining: chatCheck.remaining,
          renewalDate: chatCheck.renewalDate
        }
      });
    }

    const truncatedTranscript = truncateTranscript(transcript);
    const systemPrompt = `You are a helpful assistant analyzing a video transcript. Answer the user's question based on the transcript content. Be concise and accurate.`;

    const completion = await openai.chat.completions.create({
      model: CONFIG.PRIMARY_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Transcript: ${truncatedTranscript}\n\nQuestion: ${question}` }
      ],
      max_tokens: CONFIG.MAX_TOKENS.chat,
      temperature: 0.7
    });

    const answer = completion.choices[0].message.content.trim();
    const inputTokens = completion.usage.prompt_tokens;
    const outputTokens = completion.usage.completion_tokens;
    const cost = calculateCost(inputTokens, outputTokens);

    // Track cost
    await trackCost(userId, videoId, 'chat_query', CONFIG.PRIMARY_MODEL, inputTokens, outputTokens, cost);
    
    // Update usage
    await SupabaseUser.incrementUsage(userId, 'chat', cost);

    console.log(`✅ Chat response generated (${inputTokens} + ${outputTokens} tokens, $${cost.toFixed(6)})`);

    res.json({
      answer,
      metadata: {
        model: CONFIG.PRIMARY_MODEL,
        inputTokens,
        outputTokens,
        cost: cost.toFixed(6)
      }
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat query',
      message: error.message 
    });
  }
});

// Usage endpoint
router.get('/usage', authenticateSupabase, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await SupabaseUser.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const limits = SupabaseUser.getMonthlyLimits(user);
    const summaryCheck = await SupabaseUser.canCreateSummary(userId);
    const chatCheck = await SupabaseUser.canUseChat(userId);

    res.json({
      planType: user.subscription_plan || 'free',
      isPaid: SupabaseUser.canUsePremiumFeatures(user),
      limits: {
        summaries: limits.summaries,
        chatQueries: limits.chatQueries
      },
      usage: {
        summaries: {
          thisMonth: user.summaries_this_month,
          remaining: summaryCheck.remaining,
          canUse: summaryCheck.allowed,
          renewalDate: summaryCheck.renewalDate
        },
        chat: {
          thisMonth: user.chat_queries_this_month,
          remaining: chatCheck.remaining,
          canUse: chatCheck.allowed,
          renewalDate: chatCheck.renewalDate
        }
      },
      renewalDate: user.youtube_renewal_date
    });

  } catch (error) {
    console.error('❌ Usage fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch usage data' });
  }
});

// Reset usage endpoint (admin only)
router.post('/reset-usage', authenticateSupabase, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await SupabaseUser.findById(userId);

    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { targetUserId } = req.body;
    const resetUserId = targetUserId || userId;

    await SupabaseUser.update(resetUserId, {
      summaries_this_month: 0,
      chat_queries_this_month: 0,
      youtube_renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    res.json({ 
      success: true,
      message: 'Usage reset successfully',
      userId: resetUserId
    });

  } catch (error) {
    console.error('❌ Reset usage error:', error);
    res.status(500).json({ error: 'Failed to reset usage' });
  }
});

module.exports = router;
