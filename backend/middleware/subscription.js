const User = require('../models/User');

// Middleware to check if user has an active subscription or trial
const requireActiveSubscription = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Reset monthly usage if needed
    user.resetMonthlyUsage();
    
    // Check if user can use premium features
    if (user.canUsePremiumFeatures()) {
      return next();
    }

    // Check if user is admin (admins get free access)
    if (user.isAdmin) {
      return next();
    }

    // Free tier limits (for users without subscription)
    const FREE_LIMITS = {
      summariesPerMonth: 3,
      chatQueriesPerMonth: 5
    };

    // Allow limited free usage
    if (user.usage.summariesThisMonth < FREE_LIMITS.summariesPerMonth) {
      return next();
    }

    // User has exceeded free limits and doesn't have subscription
    return res.status(403).json({ 
      error: 'Subscription required',
      message: 'You have reached your free usage limit. Please upgrade to continue.',
      limits: {
        summariesUsed: user.usage.summariesThisMonth,
        summariesLimit: FREE_LIMITS.summariesPerMonth,
        chatQueriesUsed: user.usage.chatQueriesThisMonth,
        chatQueriesLimit: FREE_LIMITS.chatQueriesPerMonth
      },
      subscription: {
        isActive: user.hasActiveSubscription,
        planType: user.subscription.planType,
        trialEndsAt: user.subscription.trialEndsAt
      }
    });

  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ error: 'Could not verify subscription status' });
  }
};

// Middleware to check if user has specific plan type
const requirePlan = (requiredPlan) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Admin bypass
      if (user.isAdmin) {
        return next();
      }

      // Check if user has the required plan
      const validPlans = {
        'basic': ['monthly'], // Simplified - only monthly plan available
        'premium': ['monthly'] // Premium also uses monthly plan
      };

      const userPlan = user.subscription.planType;
      const allowedPlans = validPlans[requiredPlan] || [requiredPlan];

      if (!allowedPlans.includes(userPlan) || !user.hasActiveSubscription) {
        return res.status(403).json({
          error: `${requiredPlan} plan required`,
          currentPlan: userPlan,
          requiredPlan: requiredPlan,
          isActive: user.hasActiveSubscription
        });
      }

      next();
    } catch (error) {
      console.error('Plan check error:', error);
      res.status(500).json({ error: 'Could not verify plan status' });
    }
  };
};

// Middleware to get subscription info (doesn't block request)
const getSubscriptionInfo = async (req, res, next) => {
  try {
    if (req.user) {
      const user = req.user;
      user.resetMonthlyUsage();
      
      req.subscriptionInfo = {
        isActive: user.hasActiveSubscription,
        planType: user.subscription.planType,
        trialEndsAt: user.subscription.trialEndsAt,
        endDate: user.subscription.endDate,
        canUsePremium: user.canUsePremiumFeatures(),
        usage: user.usage,
        isAdmin: user.isAdmin
      };
    }
    next();
  } catch (error) {
    console.error('Subscription info error:', error);
    next(); // Don't block the request
  }
};

// Check if user is in trial period
const isInTrial = (user) => {
  return user.subscription.trialEndsAt && new Date() < user.subscription.trialEndsAt;
};

// Check days remaining in trial/subscription
const getDaysRemaining = (user) => {
  const now = new Date();
  let endDate;

  if (isInTrial(user)) {
    endDate = user.subscription.trialEndsAt;
  } else if (user.hasActiveSubscription) {
    endDate = user.subscription.endDate;
  } else {
    return 0;
  }

  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Get usage statistics for user
const getUsageStats = (user) => {
  const limits = {
    free: {
      summariesPerMonth: 3,
      chatQueriesPerMonth: 5
    },
    monthly: {
      summariesPerMonth: 100,
      chatQueriesPerMonth: 200
    }
    // Removed quarterly plan limits - only monthly available now
  };

  const userLimits = user.hasActiveSubscription 
    ? limits[user.subscription.planType] || limits.monthly
    : limits.free;

  return {
    current: user.usage,
    limits: userLimits,
    percentageUsed: {
      summaries: Math.round((user.usage.summariesThisMonth / userLimits.summariesPerMonth) * 100),
      chatQueries: Math.round((user.usage.chatQueriesThisMonth / userLimits.chatQueriesPerMonth) * 100)
    },
    daysRemaining: getDaysRemaining(user),
    isInTrial: isInTrial(user)
  };
};

module.exports = {
  requireActiveSubscription,
  requirePlan,
  getSubscriptionInfo,
  isInTrial,
  getDaysRemaining,
  getUsageStats
};
