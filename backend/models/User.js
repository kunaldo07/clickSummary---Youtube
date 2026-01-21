const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  picture: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'creator'],
    default: 'user'
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  adminPermissions: {
    manageUsers: { type: Boolean, default: false },
    manageBilling: { type: Boolean, default: false },
    systemConfig: { type: Boolean, default: false }
  },
  subscription: {
    isActive: { type: Boolean, default: false },
    planType: { 
      type: String, 
      enum: ['free', 'monthly'], // Removed quarterly - simplified to Free and Monthly only 
      default: 'free' 
    },
    razorpaySubscriptionId: String,
    razorpayCustomerId: String,
    startDate: Date,
    endDate: Date,
    trialEndsAt: Date,
    cancelledAt: Date
  },
  usage: {
    summariesThisMonth: { type: Number, default: 0 },
    chatQueriesThisMonth: { type: Number, default: 0 },
    costThisMonth: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now },
    // YouTube usage tracking (monthly cycles)
    youtubeRenewalDate: { type: Date, default: null },
    // Reddit usage tracking (monthly cycles from account creation)
    redditSummariesThisCycle: { type: Number, default: 0 },
    redditChatsThisCycle: { type: Number, default: 0 },
    redditRenewalDate: { type: Date, default: null }
  },
  preferences: {
    defaultSummaryType: { 
      type: String, 
      enum: ['insightful', 'funny', 'actionable', 'controversial'], 
      default: 'insightful' 
    },
    defaultLength: { 
      type: String, 
      enum: ['short', 'detailed'], 
      default: 'short' 
    },
    defaultFormat: { 
      type: String, 
      enum: ['list', 'paragraph', 'timestamped'], 
      default: 'list' 
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ email: 1, googleId: 1 });
userSchema.index({ 'subscription.isActive': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActiveAt: -1 });

// Virtual for checking if subscription is active
userSchema.virtual('hasActiveSubscription').get(function() {
  if (!this.subscription.isActive) return false;
  if (!this.subscription.endDate) return false;
  return new Date() < this.subscription.endDate;
});

// Method to reset monthly usage
userSchema.methods.resetMonthlyUsage = function() {
  const now = new Date();
  const lastReset = this.usage.lastResetDate;
  
  // Check if it's a new month
  if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
    this.usage.summariesThisMonth = 0;
    this.usage.chatQueriesThisMonth = 0;
    this.usage.costThisMonth = 0;
    this.usage.lastResetDate = now;
    return true;
  }
  return false;
};

// Method to reset YouTube usage (monthly cycles from account creation)
userSchema.methods.resetYouTubeUsage = function() {
  const now = new Date();
  
  // Initialize youtubeRenewalDate if not set (for existing users)
  if (!this.usage.youtubeRenewalDate) {
    this.usage.youtubeRenewalDate = new Date(this.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
  
  // Check if renewal date has passed
  if (now >= this.usage.youtubeRenewalDate) {
    this.usage.summariesThisMonth = 0;
    this.usage.chatQueriesThisMonth = 0;
    // Set next renewal date (30 days from now)
    this.usage.youtubeRenewalDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return true;
  }
  return false;
};

// Method to check if user can use premium features
userSchema.methods.canUsePremiumFeatures = function() {
  // Check if trial is still active
  if (this.subscription.trialEndsAt && new Date() < this.subscription.trialEndsAt) {
    return true;
  }
  
  // Check if subscription is active
  return this.hasActiveSubscription;
};

// Get monthly limits based on subscription plan
userSchema.methods.getMonthlyLimits = function() {
  // Only paid plans (monthly) get unlimited access, not trial users
  const isPaid = this.subscription.planType === 'monthly' && this.hasActiveSubscription;
  
  return {
    summaries: isPaid ? -1 : 50, // -1 means unlimited, free users get 50/month
    chatQueries: isPaid ? -1 : 3 // For paid users unlimited, free users get 3/month
  };
};

// Check if user can create a summary
userSchema.methods.canCreateSummary = function() {
  this.resetYouTubeUsage(); // Auto-reset if 30-day cycle passed
  
  const limits = this.getMonthlyLimits();
  
  // Unlimited for paid users
  if (limits.summaries === -1) {
    return { allowed: true, remaining: -1 };
  }
  
  // Check free user limits
  const remaining = limits.summaries - this.usage.summariesThisMonth;
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    limit: limits.summaries,
    used: this.usage.summariesThisMonth,
    renewalDate: this.usage.youtubeRenewalDate
  };
};


// Check if user can use chat feature
userSchema.methods.canUseChat = function() {
  this.resetYouTubeUsage(); // Auto-reset if 30-day cycle passed
  
  // Only paid plans (monthly) get unlimited access, not trial users
  const isPaid = this.subscription.planType === 'monthly' && this.hasActiveSubscription;
  
  // Unlimited for paid users
  if (isPaid) {
    return { allowed: true, remaining: -1 };
  }
  
  // Check free user monthly limits (3 chats per 30-day cycle)
  const limit = 3;
  const remaining = limit - this.usage.chatQueriesThisMonth;
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    limit: limit,
    used: this.usage.chatQueriesThisMonth,
    renewalDate: this.usage.youtubeRenewalDate
  };
};

// Method to increment usage
userSchema.methods.incrementUsage = function(type, cost = 0) {
  this.resetMonthlyUsage(); // Auto-reset if new month (for cost tracking)
  this.resetYouTubeUsage(); // Auto-reset if 30-day cycle passed
  
  if (type === 'summary') {
    this.usage.summariesThisMonth += 1;
  } else if (type === 'chat') {
    this.usage.chatQueriesThisMonth += 1;
  }
  
  this.usage.costThisMonth += cost;
  this.lastActiveAt = new Date();
};

// Pre-save middleware to make first user an admin
userSchema.pre('save', async function(next) {
  if (this.isNew) {
    const userCount = await mongoose.model('User').countDocuments();
    if (userCount === 0) {
      // First user becomes admin
      this.isAdmin = true;
      this.role = 'admin';
      this.adminPermissions = {
        manageUsers: true,
        manageBilling: true,
        systemConfig: true
      };
      console.log('🔑 First user registered as admin:', this.email);
    }
  }
  next();
});

// Method to check if user has specific permission
userSchema.methods.hasPermission = function(permission) {
  if (!this.isAdmin) return false;
  return this.adminPermissions[permission] || false;
};

// Method to update login timestamp
userSchema.methods.recordSignIn = function(req) {
  const now = new Date();
  this.lastLoginAt = now;
  this.lastActiveAt = now;
};

// Static method to find by Google ID
userSchema.statics.findByGoogleId = function(googleId) {
  return this.findOne({ googleId });
};

// Static method to find active subscribers
userSchema.statics.findActiveSubscribers = function() {
  return this.find({
    'subscription.isActive': true,
    'subscription.endDate': { $gt: new Date() }
  });
};

module.exports = mongoose.model('User', userSchema);
