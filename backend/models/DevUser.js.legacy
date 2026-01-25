/**
 * Development User Model - In-Memory Storage
 * Used when MongoDB is not available for development testing
 */

class DevUser {
  constructor(data) {
    this.id = data.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.googleId = data.googleId;
    this.email = data.email;
    this.name = data.name;
    this.picture = data.picture || '';
    this.role = data.role || 'user';
    this.isAdmin = data.isAdmin || false;
    this.adminPermissions = data.adminPermissions || [];
    this.subscription = data.subscription || {
      plan: 'free',
      status: 'active',
      subscriptionId: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      cancelAtPeriodEnd: false,
      isActive: false,
      planType: 'free',
      trialEndsAt: null
    };
    this.usage = data.usage || {
      summariesThisMonth: 0,
      chatQueriesThisMonth: 0,
      costThisMonth: 0,
      lastResetDate: new Date(),
      youtubeRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    this.lastLoginAt = data.lastLoginAt || new Date();
    this.lastActiveAt = data.lastActiveAt || new Date();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  save() {
    this.updatedAt = new Date();
    DevUser.users.set(this.googleId, this);
    return Promise.resolve(this);
  }

  recordSignIn(req) {
    const now = new Date();
    this.lastLoginAt = now;
    this.lastActiveAt = now;
  }

  // Virtual for checking if subscription is active
  get hasActiveSubscription() {
    if (!this.subscription.isActive) return false;
    if (!this.subscription.currentPeriodEnd) return false;
    return new Date() < this.subscription.currentPeriodEnd;
  }

  // Method to reset YouTube usage (monthly cycles from account creation)
  resetYouTubeUsage() {
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
  }

  // Method to reset monthly usage
  resetMonthlyUsage() {
    const now = new Date();
    const lastReset = this.usage.lastResetDate || new Date(0);

    const monthChanged =
      now.getFullYear() !== lastReset.getFullYear() ||
      now.getMonth() !== lastReset.getMonth();

    if (monthChanged) {
      this.usage.summariesThisMonth = 0;
      this.usage.chatQueriesThisMonth = 0;
      this.usage.costThisMonth = 0;
      this.usage.lastResetDate = now;
      return true;
    }
    return false;
  }

  // Method to check if user can use premium features
  canUsePremiumFeatures() {
    // Check if trial is still active
    if (this.subscription.trialEndsAt && new Date() < this.subscription.trialEndsAt) {
      return true;
    }
    
    // Check if subscription is active
    return this.hasActiveSubscription;
  }

  // Get monthly limits based on subscription plan
  getMonthlyLimits() {
    // Only paid plans (monthly) get unlimited access, not trial users
    const isPaid = this.subscription.planType === 'monthly' && this.hasActiveSubscription;
    
    return {
      summaries: isPaid ? -1 : 50, // -1 means unlimited, free users get 50/month
      chatQueries: isPaid ? -1 : 3 // For paid users unlimited, free users get 3/month
    };
  }


  // Check if user can create a summary
  canCreateSummary() {
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
  }

  // Check if user can use chat feature
  canUseChat() {
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
  }

  // Method to increment usage
  incrementUsage(type, cost = 0) {
    this.resetMonthlyUsage(); // Auto-reset if new month (for cost tracking)
    this.resetYouTubeUsage(); // Auto-reset if 30-day cycle passed
    
    if (type === 'summary') {
      this.usage.summariesThisMonth += 1;
    } else if (type === 'chat') {
      this.usage.chatQueriesThisMonth += 1;
    }
    
    this.usage.costThisMonth += cost;
    this.lastActiveAt = new Date();
  }

  static findByGoogleId(googleId) {
    const user = DevUser.users.get(googleId);
    return Promise.resolve(user || null);
  }

  static findByEmail(email) {
    for (const user of DevUser.users.values()) {
      if (user.email === email) {
        return Promise.resolve(user);
      }
    }
    return Promise.resolve(null);
  }

  static findById(id) {
    for (const user of DevUser.users.values()) {
      if (user.id === id) {
        return Promise.resolve(user);
      }
    }
    return Promise.resolve(null);
  }

  static create(userData) {
    const user = new DevUser(userData);
    return user.save();
  }

  static findByIdAndUpdate(id, updateData) {
    for (const user of DevUser.users.values()) {
      if (user.id === id) {
        Object.assign(user, updateData);
        user.updatedAt = new Date();
        return Promise.resolve(user);
      }
    }
    return Promise.resolve(null);
  }

  // Convert to plain object
  toObject() {
    return {
      id: this.id,
      googleId: this.googleId,
      email: this.email,
      name: this.name,
      picture: this.picture,
      role: this.role,
      isAdmin: this.isAdmin,
      adminPermissions: this.adminPermissions,
      subscription: this.subscription,
      usage: this.usage,
      lastLoginAt: this.lastLoginAt,
      lastActiveAt: this.lastActiveAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Convert to JSON
  toJSON() {
    return this.toObject();
  }
}

// In-memory storage
DevUser.users = new Map();

// Initialize with a default development user
DevUser.create({
  googleId: 'dev_user_123',
  email: 'developer@test.com',
  name: 'Development User',
  picture: 'https://via.placeholder.com/96x96/8b5cf6/ffffff?text=DEV',
  role: 'user'
});

console.log('🚧 DevUser: In-memory user storage initialized for development');

module.exports = DevUser;
