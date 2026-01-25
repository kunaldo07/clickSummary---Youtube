const SupabaseUser = require('../models/SupabaseUser');

// Maximum monthly cost per user (configurable via environment)
const MAX_MONTHLY_COST = parseFloat(process.env.MAX_MONTHLY_COST_PER_USER) || 2.50;

// Middleware to check if user has exceeded cost limits
const checkCostLimit = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin bypass
    if (user.is_admin) {
      return next();
    }

    // Check current month's cost
    const currentCost = user.cost_this_month || 0;

    if (currentCost >= MAX_MONTHLY_COST) {
      return res.status(429).json({
        error: 'Monthly cost limit exceeded',
        message: `You have reached the monthly cost limit of $${MAX_MONTHLY_COST.toFixed(2)}. Limit will reset next month.`,
        currentCost: currentCost.toFixed(4),
        limit: MAX_MONTHLY_COST.toFixed(2),
        resetDate: getNextMonthDate()
      });
    }

    // Warn when approaching limit (at 80%)
    const warningThreshold = MAX_MONTHLY_COST * 0.8;
    if (currentCost >= warningThreshold) {
      req.costWarning = {
        message: `Approaching monthly cost limit. Used: $${currentCost.toFixed(4)} of $${MAX_MONTHLY_COST.toFixed(2)}`,
        percentageUsed: Math.round((currentCost / MAX_MONTHLY_COST) * 100)
      };
    }

    next();
  } catch (error) {
    console.error('Cost limit check error:', error);
    res.status(500).json({ error: 'Could not verify cost limits' });
  }
};

// Function to track costs - simplified for Supabase
// NOTE: videoId is NOT stored for user privacy
const trackCost = async (userId, videoId, action, model, inputTokens, outputTokens, cost, cached = false) => {
  try {
    // Just log the cost - we track it in the user's cost_this_month field
    console.log(`💰 Cost tracked: $${cost.toFixed(6)} for ${action} (user: ${userId})`);
    // Cost is already updated via SupabaseUser.incrementUsage()
  } catch (error) {
    console.error('Cost tracking error:', error);
    // Don't fail the request if cost tracking fails
  }
};

// Get user's cost summary for current month
const getMonthlyCostSummary = async (userId) => {
  try {
    const user = await SupabaseUser.findById(userId);
    if (!user) return null;

    const totalCost = user.cost_this_month || 0;

    return {
      totalCost: totalCost.toFixed(6),
      limit: MAX_MONTHLY_COST.toFixed(2),
      remaining: (MAX_MONTHLY_COST - totalCost).toFixed(6),
      percentageUsed: ((totalCost / MAX_MONTHLY_COST) * 100).toFixed(1)
    };
  } catch (error) {
    console.error('Cost summary error:', error);
    return null;
  }
};

// Helper function to get next month's date
function getNextMonthDate() {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  nextMonth.setHours(0, 0, 0, 0);
  return nextMonth.toISOString().split('T')[0];
}

module.exports = {
  checkCostLimit,
  trackCost,
  getMonthlyCostSummary,
  getNextMonthDate,
  MAX_MONTHLY_COST
};
