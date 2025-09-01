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
    viewAnalytics: { type: Boolean, default: false },
    manageUsers: { type: Boolean, default: false },
    manageBilling: { type: Boolean, default: false },
    systemConfig: { type: Boolean, default: false }
  },
  subscription: {
    isActive: { type: Boolean, default: false },
    planType: { 
      type: String, 
      enum: ['free', 'monthly', 'quarterly'], 
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
    lastResetDate: { type: Date, default: Date.now }
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
  },
  signInHistory: [{
    timestamp: { type: Date, default: Date.now },
    method: { type: String, enum: ['google_oauth', 'manual'], default: 'google_oauth' },
    ipAddress: String,
    userAgent: String,
    location: {
      country: String,
      city: String,
      region: String
    }
  }],
  analytics: {
    totalSignIns: { type: Number, default: 0 },
    firstSignInAt: { type: Date, default: Date.now },
    deviceInfo: {
      lastDevice: String,
      lastBrowser: String,
      lastOS: String
    }
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

// Method to check if user can use premium features
userSchema.methods.canUsePremiumFeatures = function() {
  // Check if trial is still active
  if (this.subscription.trialEndsAt && new Date() < this.subscription.trialEndsAt) {
    return true;
  }
  
  // Check if subscription is active
  return this.hasActiveSubscription;
};

// Method to increment usage
userSchema.methods.incrementUsage = function(type, cost = 0) {
  this.resetMonthlyUsage(); // Auto-reset if new month
  
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
        viewAnalytics: true,
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

// Method to record sign-in event
userSchema.methods.recordSignIn = function(req) {
  const now = new Date();
  
  // Update basic login timestamps
  this.lastLoginAt = now;
  this.lastActiveAt = now;
  
  // Increment total sign-ins
  if (!this.analytics.totalSignIns) this.analytics.totalSignIns = 0;
  this.analytics.totalSignIns += 1;
  
  // Set first sign-in if not already set
  if (!this.analytics.firstSignInAt) {
    this.analytics.firstSignInAt = now;
  }
  
  // Extract device/browser information from User-Agent
  const userAgent = req.get('User-Agent') || 'Unknown';
  const deviceInfo = this.parseUserAgent(userAgent);
  
  // Update device info
  this.analytics.deviceInfo = {
    lastDevice: deviceInfo.device,
    lastBrowser: deviceInfo.browser,
    lastOS: deviceInfo.os
  };
  
  // Add sign-in event to history (keep last 50 entries)
  const signInEvent = {
    timestamp: now,
    method: 'google_oauth',
    ipAddress: this.getClientIP(req),
    userAgent: userAgent
  };
  
  if (!this.signInHistory) this.signInHistory = [];
  this.signInHistory.unshift(signInEvent);
  
  // Keep only last 50 sign-in records
  if (this.signInHistory.length > 50) {
    this.signInHistory = this.signInHistory.slice(0, 50);
  }
};

// Helper method to parse User-Agent
userSchema.methods.parseUserAgent = function(userAgent) {
  const browser = this.getBrowser(userAgent);
  const os = this.getOS(userAgent);
  const device = this.getDevice(userAgent);
  
  return { browser, os, device };
};

// Helper method to extract browser
userSchema.methods.getBrowser = function(userAgent) {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
};

// Helper method to extract OS
userSchema.methods.getOS = function(userAgent) {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
};

// Helper method to extract device type
userSchema.methods.getDevice = function(userAgent) {
  if (userAgent.includes('Mobile')) return 'Mobile';
  if (userAgent.includes('Tablet')) return 'Tablet';
  return 'Desktop';
};

// Helper method to get client IP (works with both trust proxy enabled/disabled)
userSchema.methods.getClientIP = function(req) {
  // In production with trust proxy, req.ip will have the real client IP
  // In development without trust proxy, fallback to connection details
  
  // Try req.ip first (works with trust proxy)
  if (req.ip && req.ip !== '::1' && req.ip !== '127.0.0.1') {
    return req.ip;
  }
  
  // Fallback to forwarded headers (manual parsing for development)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    const realIP = ips.find(ip => ip !== '::1' && ip !== '127.0.0.1');
    if (realIP) return realIP;
  }
  
  // Fallback to real IP header
  const realIP = req.headers['x-real-ip'];
  if (realIP && realIP !== '::1' && realIP !== '127.0.0.1') {
    return realIP;
  }
  
  // Final fallback to connection details
  return req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
         'localhost';
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
