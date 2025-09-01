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
      cancelAtPeriodEnd: false
    };
    this.lastLoginAt = data.lastLoginAt || new Date();
    this.lastActiveAt = data.lastActiveAt || new Date();
    this.signInHistory = data.signInHistory || [];
    this.analytics = data.analytics || {
      totalSignIns: 0,
      firstSignInAt: new Date(),
      deviceInfo: {
        lastDevice: 'Unknown',
        lastBrowser: 'Unknown',
        lastOS: 'Unknown'
      }
    };
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
    
    // Update basic login timestamps
    this.lastLoginAt = now;
    this.lastActiveAt = now;
    
    // Increment total sign-ins
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
    
    this.signInHistory.unshift(signInEvent);
    
    // Keep only last 50 sign-in records
    if (this.signInHistory.length > 50) {
      this.signInHistory = this.signInHistory.slice(0, 50);
    }
  }

  parseUserAgent(userAgent) {
    const browser = this.getBrowser(userAgent);
    const os = this.getOS(userAgent);
    const device = this.getDevice(userAgent);
    
    return { browser, os, device };
  }

  getBrowser(userAgent) {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  getOS(userAgent) {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  getDevice(userAgent) {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  }

  getClientIP(req) {
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
      lastLoginAt: this.lastLoginAt,
      lastActiveAt: this.lastActiveAt,
      signInHistory: this.signInHistory,
      analytics: this.analytics,
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
