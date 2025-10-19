const User = require('../models/User');
const CostTracking = require('../models/CostTracking');

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
    if (user.isAdmin) {
      return next();
    }

    // Reset monthly usage if needed
    user.resetMonthlyUsage();

    // Check current month's cost
    const currentCost = user.usage.costThisMonth || 0;

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

// Function to track costs in database
const trackCost = async (userId, videoId, action, model, inputTokens, outputTokens, cost, cached = false) => {
  try {
    // In development with in-memory users, skip writing cost rows that expect ObjectId
    if (process.env.NODE_ENV === 'development' && typeof userId === 'string' && userId.startsWith('user_')) {
      console.log(`🧪 Dev mode: skipping CostTracking save for in-memory user ${userId}`);
      return;
    }
    const costRecord = new CostTracking({
      user: userId,
      videoId,
      action,
      model,
      inputTokens: inputTokens || 0,
      outputTokens: outputTokens || 0,
      cost: cost || 0,
      cached,
      timestamp: new Date()
    });

    await costRecord.save();
    
    console.log(`💰 Cost tracked: $${cost.toFixed(6)} for ${action} (user: ${userId})`);
  } catch (error) {
    console.error('Cost tracking error:', error);
    // Don't fail the request if cost tracking fails
  }
};

// Get user's cost summary for current month
const getMonthlyCostSummary = async (userId) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const costs = await CostTracking.aggregate([
      {
        $match: {
          user: userId,
          timestamp: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$action',
          totalCost: { $sum: '$cost' },
          count: { $sum: 1 },
          totalInputTokens: { $sum: '$inputTokens' },
          totalOutputTokens: { $sum: '$outputTokens' },
          cachedCount: {
            $sum: { $cond: ['$cached', 1, 0] }
          }
        }
      }
    ]);

    const totalCost = costs.reduce((sum, item) => sum + item.totalCost, 0);
    const totalOperations = costs.reduce((sum, item) => sum + item.count, 0);
    const totalCached = costs.reduce((sum, item) => sum + item.cachedCount, 0);

    return {
      totalCost: totalCost.toFixed(6),
      totalOperations,
      totalCached,
      cacheHitRate: totalOperations > 0 ? ((totalCached / totalOperations) * 100).toFixed(1) : '0.0',
      breakdown: costs.map(cost => ({
        action: cost._id,
        cost: cost.totalCost.toFixed(6),
        count: cost.count,
        cachedCount: cost.cachedCount,
        avgCostPerOperation: (cost.totalCost / cost.count).toFixed(6)
      })),
      limit: MAX_MONTHLY_COST.toFixed(2),
      remaining: (MAX_MONTHLY_COST - totalCost).toFixed(6),
      percentageUsed: ((totalCost / MAX_MONTHLY_COST) * 100).toFixed(1)
    };
  } catch (error) {
    console.error('Cost summary error:', error);
    return null;
  }
};

// Get system-wide cost analytics (admin only)
const getSystemCostAnalytics = async () => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const analytics = await CostTracking.aggregate([
      {
        $match: {
          timestamp: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$cost' },
          totalOperations: { $sum: 1 },
          totalInputTokens: { $sum: '$inputTokens' },
          totalOutputTokens: { $sum: '$outputTokens' },
          uniqueUsers: { $addToSet: '$user' },
          uniqueVideos: { $addToSet: '$videoId' },
          cachedOperations: {
            $sum: { $cond: ['$cached', 1, 0] }
          }
        }
      }
    ]);

    const modelUsage = await CostTracking.aggregate([
      {
        $match: {
          timestamp: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$model',
          count: { $sum: 1 },
          cost: { $sum: '$cost' }
        }
      }
    ]);

    const result = analytics[0] || {};
    
    return {
      totalCost: (result.totalCost || 0).toFixed(6),
      totalOperations: result.totalOperations || 0,
      uniqueUsers: (result.uniqueUsers || []).length,
      uniqueVideos: (result.uniqueVideos || []).length,
      cacheHitRate: result.totalOperations > 0 
        ? (((result.cachedOperations || 0) / result.totalOperations) * 100).toFixed(1)
        : '0.0',
      avgCostPerOperation: result.totalOperations > 0 
        ? ((result.totalCost || 0) / result.totalOperations).toFixed(6)
        : '0.000000',
      modelUsage: modelUsage.map(model => ({
        model: model._id,
        operations: model.count,
        cost: model.cost.toFixed(6),
        percentage: result.totalOperations > 0 
          ? ((model.count / result.totalOperations) * 100).toFixed(1)
          : '0.0'
      }))
    };
  } catch (error) {
    console.error('System cost analytics error:', error);
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

// Cleanup old cost records (keep last 12 months)
const cleanupOldCostRecords = async () => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const result = await CostTracking.deleteMany({
      timestamp: { $lt: twelveMonthsAgo }
    });

    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} old cost records`);
    }
  } catch (error) {
    console.error('Cost cleanup error:', error);
  }
};

// Schedule monthly cleanup (call this from your main server file)
const scheduleCostCleanup = () => {
  // Run cleanup once a day
  setInterval(cleanupOldCostRecords, 24 * 60 * 60 * 1000);
};

module.exports = {
  checkCostLimit,
  trackCost,
  getMonthlyCostSummary,
  getSystemCostAnalytics,
  getNextMonthDate,
  cleanupOldCostRecords,
  scheduleCostCleanup,
  MAX_MONTHLY_COST
};
