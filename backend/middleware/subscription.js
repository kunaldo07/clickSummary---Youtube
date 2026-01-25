const SupabaseUser = require('../models/SupabaseUser');

// Helper to check if user can use premium features
const canUsePremiumFeatures = (user) => {
  if (user.trial_ends_at && new Date() < new Date(user.trial_ends_at)) {
    return true;
  }
  
  return user.subscription_status === 'active' &&
         user.current_period_end &&
         new Date() < new Date(user.current_period_end);
};

// Helper to get summaries count
const getSummariesThisMonth = (user) => {
  return user.summaries_this_month || 0;
};

// Helper to get chat queries count
const getChatQueriesThisMonth = (user) => {
  return user.chat_queries_this_month || 0;
};

// Middleware to check if user has an active subscription or trial
const requireActiveSubscription = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if user can use premium features
    if (canUsePremiumFeatures(user)) {
      return next();
    }

    // Check if user is admin (admins get free access)
    if (user.is_admin) {
      return next();
    }

    // Free tier limits
    const FREE_LIMITS = {
      summariesPerMonth: 50,
      chatQueriesPerMonth: 30
    };

    // Allow limited free usage
    const summariesUsed = getSummariesThisMonth(user);
    if (summariesUsed < FREE_LIMITS.summariesPerMonth) {
      return next();
    }

    // User has exceeded free limits
    return res.status(403).json({ 
      error: 'Subscription required',
      message: 'You have reached your free usage limit. Please upgrade to continue.',
      limits: {
        summariesUsed,
        summariesLimit: FREE_LIMITS.summariesPerMonth,
        chatQueriesUsed: getChatQueriesThisMonth(user),
        chatQueriesLimit: FREE_LIMITS.chatQueriesPerMonth
      },
      subscription: {
        isActive: user.subscription_status === 'active',
        planType: user.subscription_plan,
        trialEndsAt: user.trial_ends_at
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
      if (user.is_admin) {
        return next();
      }

      const validPlans = {
        'basic': ['monthly'],
        'premium': ['monthly']
      };

      const userPlan = user.subscription_plan;
      const allowedPlans = validPlans[requiredPlan] || [requiredPlan];
      const hasActiveSubscription = user.subscription_status === 'active';

      if (!allowedPlans.includes(userPlan) || !hasActiveSubscription) {
        return res.status(403).json({
          error: `${requiredPlan} plan required`,
          currentPlan: userPlan,
          requiredPlan: requiredPlan,
          isActive: hasActiveSubscription
        });
      }

      next();
    } catch (error) {
      console.error('Plan check error:', error);
      res.status(500).json({ error: 'Could not verify plan status' });
    }
  };
};

// Middleware to get subscription info
const getSubscriptionInfo = async (req, res, next) => {
  try {
    if (req.user) {
      const user = req.user;
      
      req.subscriptionInfo = {
        isActive: user.subscription_status === 'active',
        planType: user.subscription_plan,
        trialEndsAt: user.trial_ends_at,
        endDate: user.current_period_end,
        canUsePremium: canUsePremiumFeatures(user),
        usage: {
          summariesThisMonth: getSummariesThisMonth(user),
          chatQueriesThisMonth: getChatQueriesThisMonth(user)
        },
        isAdmin: user.is_admin
      };
    }
    next();
  } catch (error) {
    console.error('Subscription info error:', error);
    next();
  }
};

// Check if user is in trial period
const isInTrial = (user) => {
  return user.trial_ends_at && new Date() < new Date(user.trial_ends_at);
};

// Check days remaining in trial/subscription
const getDaysRemaining = (user) => {
  const now = new Date();
  let endDate;

  if (isInTrial(user)) {
    endDate = new Date(user.trial_ends_at);
  } else {
    const hasActiveSubscription = user.subscription_status === 'active';
    if (hasActiveSubscription) {
      endDate = new Date(user.current_period_end);
    } else {
      return 0;
    }
  }

  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Get usage statistics for user
const getUsageStats = (user) => {
  const limits = {
    free: {
      summariesPerMonth: 50,
      chatQueriesPerMonth: 3
    },
    monthly: {
      summariesPerMonth: -1,
      chatQueriesPerMonth: -1
    }
  };

  const hasActiveSubscription = user.subscription_status === 'active';
  const planType = user.subscription_plan || 'free';
  const userLimits = hasActiveSubscription 
    ? limits[planType] || limits.monthly
    : limits.free;

  const summariesUsed = getSummariesThisMonth(user);
  const chatQueriesUsed = getChatQueriesThisMonth(user);

  return {
    current: {
      summariesThisMonth: summariesUsed,
      chatQueriesThisMonth: chatQueriesUsed
    },
    limits: userLimits,
    percentageUsed: {
      summaries: userLimits.summariesPerMonth === -1 ? 0 : Math.round((summariesUsed / userLimits.summariesPerMonth) * 100),
      chatQueries: userLimits.chatQueriesPerMonth === -1 ? 0 : Math.round((chatQueriesUsed / userLimits.chatQueriesPerMonth) * 100)
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
