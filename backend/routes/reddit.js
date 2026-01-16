const express = require('express');
const OpenAI = require('openai');
const { auth } = require('../middleware/auth');

// Use DevUser in development to avoid ObjectId casts; otherwise use MongoDB User
let User;
if (process.env.NODE_ENV === 'development') {
  console.log('📝 Reddit routes: Development mode - using in-memory DevUser');
  User = require('../models/DevUser');
} else {
  try {
    User = require('../models/User');
  } catch (error) {
    console.log('📝 Reddit routes: MongoDB not available - falling back to DevUser');
    User = require('../models/DevUser');
  }
}

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30000,
});

// Free plan limits for Reddit
const REDDIT_LIMITS = {
  FREE_SUMMARIES_PER_MONTH: 50,
  FREE_CHATS_PER_MONTH: 5
};

// Helper function to check and reset Reddit usage if needed
async function checkAndResetRedditUsage(user) {
  const now = new Date();
  
  // Initialize renewal date if not set (first time user)
  if (!user.usage.redditRenewalDate) {
    user.usage.redditRenewalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    user.usage.redditSummariesThisCycle = 0;
    user.usage.redditChatsThisCycle = 0;
    await user.save();
    return;
  }
  
  // Check if renewal date has passed
  if (now >= user.usage.redditRenewalDate) {
    console.log(`🔄 Resetting Reddit usage for user ${user.email}`);
    user.usage.redditSummariesThisCycle = 0;
    user.usage.redditChatsThisCycle = 0;
    // Set next renewal date (30 days from now)
    user.usage.redditRenewalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await user.save();
  }
}

// Analyze Reddit thread endpoint
router.post('/analyze', auth, async (req, res) => {
  try {
    const { threadContent, model, language } = req.body;
    const userId = req.userId;

    if (!threadContent || !threadContent.title) {
      return res.status(400).json({ error: 'Missing thread content' });
    }

    // Get user and check limits
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check and reset usage if needed
    await checkAndResetRedditUsage(user);

    // Check if user has reached limit (only for free users)
    const planType = user.subscription?.planType || 'free';
    if (planType === 'free') {
      if (user.usage.redditSummariesThisCycle >= REDDIT_LIMITS.FREE_SUMMARIES_PER_MONTH) {
        const daysUntilRenewal = Math.ceil((user.usage.redditRenewalDate - new Date()) / (1000 * 60 * 60 * 24));
        return res.status(429).json({
          error: 'MONTHLY_REDDIT_SUMMARY_LIMIT_EXCEEDED',
          message: `You've reached your monthly limit of ${REDDIT_LIMITS.FREE_SUMMARIES_PER_MONTH} Reddit summaries. Resets in ${daysUntilRenewal} day${daysUntilRenewal === 1 ? '' : 's'}.`,
          limit: REDDIT_LIMITS.FREE_SUMMARIES_PER_MONTH,
          used: user.usage.redditSummariesThisCycle,
          renewalDate: user.usage.redditRenewalDate,
          upgradeUrl: 'https://www.clicksummary.com/pricing'
        });
      }
    }

    console.log(`🤖 Analyzing Reddit thread for user ${user.email}: "${threadContent.title}"`);

    // Build prompt
    const prompt = buildAnalysisPrompt(threadContent, language || 'en');
    
    const systemMessage = language && language !== 'en'
      ? `You are a sharp human analyst who writes extremely useful, high-signal summaries. Write like an expert, not a bot. Never mention "users", "commenters", or "the thread discusses". Never list individual comments one by one. Be concise but prioritize depth over brevity. If the thread lacks depth, say so honestly. IMPORTANT: Respond in ${getLanguageName(language)}. Format as JSON with keys: overview, takeaways (array), perspectives, practicalValue, bottomLine.`
      : `You are a sharp human analyst who writes extremely useful, high-signal summaries. Write like an expert, not a bot. Never mention "users", "commenters", or "the thread discusses". Never list individual comments one by one. Be concise but prioritize depth over brevity. If the thread lacks depth, say so honestly. Format as JSON with keys: overview, takeaways (array), perspectives, practicalValue, bottomLine.`;

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const aiResponse = response.choices[0].message.content;
    const summary = parseAISummary(aiResponse);

    // Increment usage counter
    user.usage.redditSummariesThisCycle += 1;
    await user.save();

    console.log(`✅ Reddit summary generated. Usage: ${user.usage.redditSummariesThisCycle}/${REDDIT_LIMITS.FREE_SUMMARIES_PER_MONTH}`);

    res.json({
      success: true,
      data: summary,
      usage: {
        summariesUsed: user.usage.redditSummariesThisCycle,
        summariesLimit: planType === 'free' ? REDDIT_LIMITS.FREE_SUMMARIES_PER_MONTH : -1,
        renewalDate: user.usage.redditRenewalDate
      }
    });

  } catch (error) {
    console.error('❌ Reddit analysis error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

// Chat with Reddit thread endpoint
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, threadContent, conversationHistory, model } = req.body;
    const userId = req.userId;

    if (!message || !threadContent) {
      return res.status(400).json({ error: 'Missing message or thread content' });
    }

    // Get user and check limits
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check and reset usage if needed
    await checkAndResetRedditUsage(user);

    // Check if user has reached limit (only for free users)
    const planType = user.subscription?.planType || 'free';
    if (planType === 'free') {
      if (user.usage.redditChatsThisCycle >= REDDIT_LIMITS.FREE_CHATS_PER_MONTH) {
        const daysUntilRenewal = Math.ceil((user.usage.redditRenewalDate - new Date()) / (1000 * 60 * 60 * 24));
        return res.status(429).json({
          error: 'MONTHLY_REDDIT_CHAT_LIMIT_EXCEEDED',
          message: `You've reached your monthly limit of ${REDDIT_LIMITS.FREE_CHATS_PER_MONTH} Reddit AI chats. Resets in ${daysUntilRenewal} day${daysUntilRenewal === 1 ? '' : 's'}.`,
          limit: REDDIT_LIMITS.FREE_CHATS_PER_MONTH,
          used: user.usage.redditChatsThisCycle,
          renewalDate: user.usage.redditRenewalDate,
          upgradeUrl: 'https://www.clicksummary.com/pricing'
        });
      }
    }

    console.log(`💬 Reddit chat for user ${user.email}: "${message}"`);

    // Build comprehensive context from thread content
    let contextText = `Reddit Thread: "${threadContent.title}"\n\n`;
    
    if (threadContent.body) {
      contextText += `Original Post:\n${threadContent.body}\n\n`;
    }
    
    if (threadContent.comments && threadContent.comments.length > 0) {
      contextText += `Comments (${threadContent.comments.length} total):\n`;
      threadContent.comments.forEach((comment, index) => {
        if (index < 50) { // Limit to first 50 comments to avoid token limits
          const score = comment.score ? ` [${comment.score} upvotes]` : '';
          // Handle both 'content' (from extension) and 'body'/'text' field names
          const commentText = comment.content || comment.body || comment.text || '';
          if (commentText) {
            contextText += `- ${comment.author}${score}: ${commentText}\n`;
          }
        }
      });
    }

    // Build messages array with enhanced chat system prompt
    const chatSystemPrompt = `You are an expert AI assistant helping users get maximum value from Reddit discussions. You have access to the complete thread content below.

=== THREAD CONTENT ===
${contextText}
=== END THREAD ===

Your capabilities:
- Answer ANY question about this thread with specific details and citations
- Extract and list specific items mentioned (books, products, tools, resources, etc.)
- Identify consensus opinions vs controversial takes
- Find advice, recommendations, and actionable tips
- Summarize specific aspects or perspectives
- Compare different viewpoints in the discussion
- Identify the most upvoted/popular opinions

Guidelines:
- Be specific and cite usernames when referencing comments
- If listing items (books, products, etc.), include context about why they were mentioned
- Highlight highly-upvoted comments as they represent community consensus
- If information isn't in the thread, say so clearly
- Be concise but comprehensive - don't miss important details
- Format lists and structured data clearly for easy reading`;

    const messages = [
      {
        role: 'system',
        content: chatSystemPrompt
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory);
    }

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = response.choices[0].message.content;

    // Increment usage counter
    user.usage.redditChatsThisCycle += 1;
    await user.save();

    console.log(`✅ Reddit chat response generated. Usage: ${user.usage.redditChatsThisCycle}/${REDDIT_LIMITS.FREE_CHATS_PER_MONTH}`);

    res.json({
      success: true,
      data: aiResponse,
      usage: {
        chatsUsed: user.usage.redditChatsThisCycle,
        chatsLimit: planType === 'free' ? REDDIT_LIMITS.FREE_CHATS_PER_MONTH : -1,
        renewalDate: user.usage.redditRenewalDate
      }
    });

  } catch (error) {
    console.error('❌ Reddit chat error:', error);
    res.status(500).json({ error: error.message || 'Chat failed' });
  }
});

// Get Reddit usage endpoint
router.get('/usage', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await checkAndResetRedditUsage(user);

    const planType = user.subscription?.planType || 'free';
    const limits = planType === 'free' ? {
      summaries: REDDIT_LIMITS.FREE_SUMMARIES_PER_MONTH,
      chats: REDDIT_LIMITS.FREE_CHATS_PER_MONTH
    } : {
      summaries: -1,
      chats: -1
    };

    res.json({
      success: true,
      usage: {
        summaries: {
          used: user.usage.redditSummariesThisCycle || 0,
          limit: limits.summaries,
          renewalDate: user.usage.redditRenewalDate
        },
        chats: {
          used: user.usage.redditChatsThisCycle || 0,
          limit: limits.chats,
          renewalDate: user.usage.redditRenewalDate
        }
      },
      planType
    });

  } catch (error) {
    console.error('❌ Error fetching Reddit usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage data' });
  }
});

// Helper functions
function buildAnalysisPrompt(threadContent, language) {
  const languageName = getLanguageName(language);
  const languageInstruction = language !== 'en' 
    ? `\n\nIMPORTANT: Provide your entire response in ${languageName}. All text must be in ${languageName}.`
    : '';

  const hasComments = threadContent.comments && threadContent.comments.length > 0;
  // Handle different field names: selftext (Reddit API), postContent (extension), body
  const postText = threadContent.selftext || threadContent.postContent || threadContent.body || '';
  const hasPostContent = postText && postText.trim().length > 0;

  // Build thread content for prompt
  const threadText = `Title: ${threadContent.title}
Subreddit: r/${threadContent.subreddit || 'Unknown'}

Original Post:
${hasPostContent ? postText : '[Link/image post - no text]'}

Discussion (${threadContent.comments?.length || 0} comments):
${hasComments ? threadContent.comments.slice(0, 30).map((c) => {
  const text = c.content || c.body || c.text || '';
  const score = c.score ? ` [${c.score} upvotes]` : '';
  return `${c.author}${score}: ${text}`;
}).join('\n\n') : '[No comments yet]'}`;

  return `You are given a Reddit thread (post + comments).

<<<THREAD_START>>>
${threadText}
<<<THREAD_END>>>

Task: Write an extremely useful, high-signal summary that allows a reader to fully understand the discussion without reading the thread.

Use this structure exactly:

**Overview** (2–4 sentences)
What this thread is fundamentally about and what makes it interesting.

**The Real Takeaways** (3–6 bullets)
The most important ideas, patterns, or conclusions emerging from the discussion.
Each bullet must represent a meaningful insight, not a paraphrase of a comment.

**Different Perspectives**
A short paragraph explaining disagreements, nuances, or contrasting views (if any).

**Practical Value**
What someone can learn, apply, or understand better after reading this thread.

**Bottom Line**
One strong sentence that captures the essence of the discussion.

Rules:
- Do not mention "users", "commenters", or "the thread discusses"
- Do not list individual comments one by one
- Do not repeat the same idea across sections
- Be concise, but prioritize depth over brevity
- Write like a sharp human analyst, not a bot
- If the thread lacks depth, say so honestly
- Optimize for maximum usefulness to the reader
- If specific items are mentioned (books, products, tools, resources), LIST THEM BY NAME${languageInstruction}

Format your response as JSON:
{
  "overview": "...",
  "takeaways": ["...", "...", "..."],
  "perspectives": "...",
  "practicalValue": "...",
  "bottomLine": "..."
}`;
}

function parseAISummary(response) {
  try {
    // Try to parse as JSON first
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Handle new format (overview, takeaways, perspectives, practicalValue, bottomLine)
      if (parsed.overview || parsed.takeaways) {
        return {
          summary: parsed.overview || '',
          keyPoints: parsed.takeaways || [],
          insights: parsed.perspectives || '',
          practicalValue: parsed.practicalValue || '',
          bottomLine: parsed.bottomLine || ''
        };
      }
      
      // Handle old format (summary, keyPoints, insights)
      return parsed;
    }
    
    // Fallback: return as plain text summary
    return {
      summary: response,
      keyPoints: [],
      insights: '',
      practicalValue: '',
      bottomLine: ''
    };
  } catch (error) {
    console.warn('Failed to parse AI response as JSON, using plain text');
    return {
      summary: response,
      keyPoints: [],
      insights: '',
      practicalValue: '',
      bottomLine: ''
    };
  }
}

function getLanguageName(code) {
  const languages = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi'
  };
  return languages[code] || 'English';
}

module.exports = router;
