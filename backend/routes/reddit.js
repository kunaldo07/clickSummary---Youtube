const express = require('express');
const OpenAI = require('openai');
const { authenticateSupabase } = require('../middleware/supabaseAuth');
const { requireActiveSubscription } = require('../middleware/subscription');
const { checkCostLimit, trackCost } = require('../middleware/costTracking');
const SupabaseUser = require('../models/SupabaseUser');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 60000,
  dangerouslyAllowBrowser: false
});

const CONFIG = {
  PRIMARY_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  MAX_TOKENS: 1500,
  COST_PER_1K_INPUT: 0.00015,
  COST_PER_1K_OUTPUT: 0.0006
};

function calculateCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1000) * CONFIG.COST_PER_1K_INPUT;
  const outputCost = (outputTokens / 1000) * CONFIG.COST_PER_1K_OUTPUT;
  return inputCost + outputCost;
}

/**
 * Format thread content for AI prompt
 */
function formatThreadContent(threadContent) {
  let formatted = '';
  
  if (threadContent.subreddit) {
    formatted += `Subreddit: r/${threadContent.subreddit}\n`;
  }
  if (threadContent.title) {
    formatted += `Title: ${threadContent.title}\n`;
  }
  if (threadContent.author) {
    formatted += `Author: ${threadContent.author}\n`;
  }
  if (threadContent.score) {
    formatted += `Score: ${threadContent.score}\n`;
  }
  formatted += '\n';
  
  if (threadContent.postContent) {
    formatted += `Post Content:\n${threadContent.postContent}\n\n`;
  }
  
  if (threadContent.comments && threadContent.comments.length > 0) {
    formatted += `Top Comments (${threadContent.comments.length}):\n`;
    threadContent.comments.slice(0, 20).forEach((comment, i) => {
      const indent = '  '.repeat(comment.depth || 0);
      formatted += `${indent}${i + 1}. [${comment.author || 'Anonymous'}] (${comment.score || 0} points): ${comment.content?.substring(0, 500) || ''}\n`;
    });
  }
  
  return formatted;
}

// Get usage statistics
router.get('/usage', authenticateSupabase, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📊 Getting Reddit usage for user: ${userId}`);

    const user = await SupabaseUser.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPro = user.subscription_plan === 'monthly' && 
                  user.subscription_status === 'active';

    const limits = isPro ? {
      summariesPerMonth: -1,
      chatQueriesPerMonth: -1
    } : {
      summariesPerMonth: 50,
      chatQueriesPerMonth: 30
    };

    const now = new Date();
    const renewalDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    res.json({
      success: true,
      planType: user.subscription_plan || 'free',
      usage: {
        summaries: {
          used: user.summaries_this_month || 0,
          limit: limits.summariesPerMonth,
          remaining: limits.summariesPerMonth === -1 ? -1 : Math.max(0, limits.summariesPerMonth - (user.summaries_this_month || 0)),
          renewalDate: renewalDate.toISOString()
        },
        chats: {
          used: user.chat_queries_this_month || 0,
          limit: limits.chatQueriesPerMonth,
          remaining: limits.chatQueriesPerMonth === -1 ? -1 : Math.max(0, limits.chatQueriesPerMonth - (user.chat_queries_this_month || 0)),
          renewalDate: renewalDate.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting Reddit usage:', error);
    res.status(500).json({ 
      error: 'Failed to get usage data',
      message: error.message 
    });
  }
});

// Analyze Reddit thread
router.post('/analyze', authenticateSupabase, requireActiveSubscription, checkCostLimit, async (req, res) => {
  try {
    const { threadContent, model, language } = req.body;
    const userId = req.user.id;

    if (!threadContent) {
      return res.status(400).json({ 
        error: 'Missing required field: threadContent' 
      });
    }

    console.log(`📊 Analyzing Reddit thread (user: ${userId})`);
    console.log(`📝 Thread: "${threadContent.title?.substring(0, 50)}..." in r/${threadContent.subreddit}`);

    // Check usage limits
    const summaryCheck = await SupabaseUser.canCreateSummary(userId);
    if (!summaryCheck.allowed) {
      return res.status(429).json({
        error: 'MONTHLY_REDDIT_SUMMARY_LIMIT_EXCEEDED',
        message: `You have used all ${summaryCheck.limit} summaries for this month.`,
        limit: summaryCheck.limit,
        upgradeUrl: 'https://www.clicksummary.com/pricing',
        usage: {
          used: summaryCheck.used,
          limit: summaryCheck.limit,
          remaining: summaryCheck.remaining,
          renewalDate: summaryCheck.renewalDate
        }
      });
    }

    const formattedContent = formatThreadContent(threadContent);
    
    const systemPrompt = `You are an expert Reddit analyst.
Your job is to extract the real substance of a Reddit thread—not just the original post, but the actual discussion.

CRITICAL RULES:
- Avoid generic, motivational, or vague summaries
- Focus on specific claims, numbers, arguments, and disagreements
- Write in a clear, neutral, premium tone
- Be concrete: mention products, numbers, timelines, specific outcomes
- Avoid phrases like "This highlights the importance of…" or "This shows how…"

Return a JSON object with this exact structure:

{
  "threadSummary": "Short paragraph: Who posted, what the thread is about, why it matters. Be concrete with products, numbers, timelines, specific outcomes.",
  "keyPoints": [
    "Specific detail with numbers, events, or concrete claims",
    "Another specific point (avoid vague advice or life lessons)",
    "4-6 total points with real substance"
  ],
  "communitySentiment": {
    "supportive": "What positive reactions people had, specific viewpoints mentioned",
    "skeptical": "Major doubts, criticisms, or accusations raised",
    "neutral": "Clarifications, corrections, or factual discussion (optional)"
  },
  "notableComments": [
    {
      "type": "main_insight",
      "summary": "One-sentence summary of what the commenter said",
      "quote": "Short relevant quote if useful"
    },
    {
      "type": "criticism",
      "summary": "Summary of a strong criticism",
      "quote": "Relevant quote"
    }
  ],
  "practicalTakeaways": [
    "Actionable lesson or concrete strategy",
    "Real-world insight (no motivational language)",
    "3 total bullet points"
  ],
  "bottomLine": "One sentence answering: What's the real conclusion of this thread? Be specific and grounded."
}

Return ONLY valid JSON, no markdown or extra text.${language && language !== 'en' ? ` Respond in ${language}.` : ''}`;

    const completion = await openai.chat.completions.create({
      model: model || CONFIG.PRIMARY_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: formattedContent }
      ],
      max_tokens: CONFIG.MAX_TOKENS,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const rawContent = completion.choices[0].message.content.trim();
    const inputTokens = completion.usage.prompt_tokens;
    const outputTokens = completion.usage.completion_tokens;
    const cost = calculateCost(inputTokens, outputTokens);

    // Parse JSON response
    let analysis;
    try {
      analysis = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', rawContent);
      // Fallback to structured object with raw content
      analysis = {
        threadSummary: rawContent,
        keyPoints: [],
        communitySentiment: { supportive: '', skeptical: '', neutral: '' },
        notableComments: [],
        practicalTakeaways: [],
        bottomLine: ''
      };
    }

    // Track cost
    await trackCost(userId, null, 'reddit_analysis', model || CONFIG.PRIMARY_MODEL, inputTokens, outputTokens, cost);
    
    // Update usage
    await SupabaseUser.incrementUsage(userId, 'summary', cost);

    console.log(`✅ Reddit analysis generated (${inputTokens} + ${outputTokens} tokens, $${cost.toFixed(6)})`);

    res.json({
      success: true,
      data: analysis,
      metadata: {
        model: model || CONFIG.PRIMARY_MODEL,
        inputTokens,
        outputTokens,
        cost: cost.toFixed(6)
      }
    });

  } catch (error) {
    console.error('❌ Reddit analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze Reddit thread',
      message: error.message 
    });
  }
});

// Chat with Reddit thread
router.post('/chat', authenticateSupabase, requireActiveSubscription, checkCostLimit, async (req, res) => {
  try {
    const { message, threadContent, conversationHistory, model } = req.body;
    const userId = req.user.id;

    if (!message || !threadContent) {
      return res.status(400).json({ 
        error: 'Missing required fields: message, threadContent' 
      });
    }

    console.log(`💬 Reddit chat query (user: ${userId})`);

    // Check chat usage limits
    const chatCheck = await SupabaseUser.canUseChat(userId);
    if (!chatCheck.allowed) {
      return res.status(429).json({
        error: 'MONTHLY_REDDIT_CHAT_LIMIT_EXCEEDED',
        message: `You have used all ${chatCheck.limit} chat queries for this month.`,
        limit: chatCheck.limit,
        upgradeUrl: 'https://www.clicksummary.com/pricing',
        usage: {
          used: chatCheck.used,
          limit: chatCheck.limit,
          remaining: chatCheck.remaining,
          renewalDate: chatCheck.renewalDate
        }
      });
    }

    const formattedContent = formatThreadContent(threadContent);

    const systemPrompt = `You are a helpful AI assistant discussing a Reddit thread. You have access to the full thread content including the post and comments. Answer questions about the thread, provide insights, clarify points, or engage in discussion about the topics raised.

Thread Content:
${formattedContent}

Be helpful, accurate, and conversational. If asked about something not in the thread, say so.`;

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach(msg => {
        if (msg.role && msg.content) {
          messages.push({ role: msg.role, content: msg.content });
        }
      });
    }

    messages.push({ role: 'user', content: message });

    const completion = await openai.chat.completions.create({
      model: model || CONFIG.PRIMARY_MODEL,
      messages,
      max_tokens: 500,
      temperature: 0.7
    });

    const answer = completion.choices[0].message.content.trim();
    const inputTokens = completion.usage.prompt_tokens;
    const outputTokens = completion.usage.completion_tokens;
    const cost = calculateCost(inputTokens, outputTokens);

    // Track cost
    await trackCost(userId, null, 'reddit_chat', model || CONFIG.PRIMARY_MODEL, inputTokens, outputTokens, cost);
    
    // Update usage
    await SupabaseUser.incrementUsage(userId, 'chat', cost);

    console.log(`✅ Reddit chat response (${inputTokens} + ${outputTokens} tokens, $${cost.toFixed(6)})`);

    res.json({
      success: true,
      data: answer,
      metadata: {
        model: model || CONFIG.PRIMARY_MODEL,
        inputTokens,
        outputTokens,
        cost: cost.toFixed(6)
      }
    });

  } catch (error) {
    console.error('❌ Reddit chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat',
      message: error.message 
    });
  }
});

module.exports = router;
