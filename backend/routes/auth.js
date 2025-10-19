const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
// Using native fetch (Node.js 18+)

// Always use DevUser for development to avoid MongoDB connection issues
let User;
if (process.env.NODE_ENV === 'development') {
  console.log('📝 Development mode: Using in-memory DevUser for authentication');
  User = require('../models/DevUser');
} else {
  try {
    User = require('../models/User');
    console.log('📊 Production mode: Using MongoDB User model');
  } catch (error) {
    console.log('📝 MongoDB not available, falling back to DevUser');
    User = require('../models/DevUser');
  }
}

const { auth, generateToken } = require('../middleware/auth');

const router = express.Router();

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verify Google ID token and create/login user
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: 'Google credential required' });
    }

    let payload;
    
    // Handle development mock token
    if (credential === 'mock_jwt_token_for_development' && process.env.NODE_ENV === 'development') {
      console.log('🚧 Using development mock authentication');
      payload = {
        sub: 'dev_user_123',
        email: 'developer@test.com',
        name: 'Development User',
        picture: 'https://via.placeholder.com/96x96/8b5cf6/ffffff?text=DEV'
      };
    } else {
      // Verify the Google ID token
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    }

    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findByGoogleId(googleId);

    if (user) {
      // Record sign-in event with analytics
      user.recordSignIn(req);
      await user.save();
      console.log('✅ Existing user logged in:', email, `(${user.analytics.totalSignIns} total sign-ins)`);
    } else {
      // Create new user
      user = await User.create({
        googleId,
        email,
        name,
        picture,
        subscription: {
          plan: 'free',
          status: 'active',
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days trial
        }
      });
      
      // Record first sign-in event
      user.recordSignIn(req);
      await user.save();
      console.log('✅ New user registered:', email);
    }

    // Generate JWT token (embed helpful fields for dev recovery)
    const token = generateToken(user.id || user._id, {
      googleId,
      email,
      name
    });

    // Return user data and token
    res.json({
      success: true,
      token,
      user: {
        id: user.id || user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
        isAdmin: user.isAdmin,
        subscription: {
          isActive: user.hasActiveSubscription,
          planType: user.subscription.planType,
          trialEndsAt: user.subscription.trialEndsAt,
          endDate: user.subscription.endDate
        },
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    
    if (error.message && error.message.includes('Token used too early')) {
      return res.status(400).json({ error: 'Invalid token timing. Please try again.' });
    }
    
    if (error.message && error.message.includes('Invalid token signature')) {
      return res.status(400).json({ error: 'Invalid Google token. Please sign in again.' });
    }
    
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

// Google OAuth callback handler (for manual OAuth flow)
router.post('/google-callback', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    
    console.log('📝 OAuth callback received:', { code: code ? 'present' : 'missing', redirectUri });
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code required' });
    }

    // Validate required environment variables
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('❌ GOOGLE_CLIENT_ID not configured');
      return res.status(500).json({ success: false, message: 'OAuth not properly configured' });
    }

    if (!process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET === 'your_google_client_secret_here') {
      console.error('❌ GOOGLE_CLIENT_SECRET not configured');
      
      // Development workaround - create a test user
      if (process.env.NODE_ENV === 'development') {
        console.log('🚧 Using development workaround for OAuth...');
        
        const testUser = {
          sub: 'dev_test_user',
          email: 'test@developer.com',
          name: 'Test Developer',
          picture: 'https://via.placeholder.com/96x96/8b5cf6/ffffff?text=DEV'
        };
        
        // Skip to user creation/login with test data
        const { sub: googleId, email, name, picture } = testUser;
        
        let user = await User.findByGoogleId(googleId);
        
        if (!user) {
          user = await User.create({
            googleId,
            email,
            name,
            picture,
            subscription: {
              plan: 'free',
              status: 'active',
              trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          });
          console.log('✅ Development test user created:', email);
        } else {
          console.log('✅ Development test user logged in:', email);
        }
        
        user.recordSignIn(req);
        await user.save();
        
        const token = generateToken(user.id || user._id);
        
        return res.json({
          success: true,
          token,
          user: {
            id: user.id || user._id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            role: user.role,
            isAdmin: user.isAdmin,
            subscription: {
              isActive: user.hasActiveSubscription,
              planType: user.subscription.planType,
              trialEndsAt: user.subscription.trialEndsAt,
              endDate: user.subscription.endDate
            },
            usage: {
              summariesToday: user.usage.summariesToday,
              chatQueriesToday: user.usage.chatQueriesToday,
              totalSummaries: user.usage.totalSummaries,
              totalChatQueries: user.usage.totalChatQueries
            }
          }
        });
      }
      
      return res.status(500).json({ success: false, message: 'OAuth not properly configured' });
    }
    
    // Exchange code for tokens
    console.log('🔄 Exchanging code for tokens...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });
    
    const tokenData = await tokenResponse.json();
    console.log('📋 Token response:', tokenData.error ? { error: tokenData.error } : { success: true });
    
    if (tokenData.error) {
      console.error('❌ Token exchange failed:', tokenData);
      throw new Error(tokenData.error_description || `Token exchange failed: ${tokenData.error}`);
    }

    if (!tokenData.access_token) {
      console.error('❌ No access token received:', tokenData);
      throw new Error('No access token received from Google');
    }
    
    // Get user info
    console.log('👤 Fetching user info...');
    const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`);
    
    if (!userResponse.ok) {
      console.error('❌ Failed to fetch user info:', userResponse.status, userResponse.statusText);
      throw new Error(`Failed to fetch user info: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    console.log('👤 User data received:', { email: userData.email, name: userData.name });
    
    if (!userData.id || !userData.email) {
      console.error('❌ Invalid user data received:', userData);
      throw new Error('Invalid user data received from Google');
    }

    // Create or find user (similar to existing logic)
    const { id: googleId, email, name, picture } = userData;
    
    let user = await User.findByGoogleId(googleId);
    
    if (user) {
      // Record sign-in event with analytics
      user.recordSignIn(req);
      await user.save();
      console.log('✅ Existing user logged in:', email, `(${user.analytics.totalSignIns} total sign-ins)`);
    } else {
      // Create new user
      user = await User.create({
        googleId,
        email,
        name,
        picture,
        subscription: {
          plan: 'free',
          status: 'active',
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days trial
        }
      });
      
      // Record first sign-in event
      user.recordSignIn(req);
      await user.save();
      console.log('✅ New user registered via OAuth callback:', email);
    }
    
    const token = generateToken(user.id || user._id, {
      googleId,
      email,
      name
    });
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id || user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
        isAdmin: user.isAdmin,
        subscription: {
          isActive: user.hasActiveSubscription,
          planType: user.subscription.planType,
          trialEndsAt: user.subscription.trialEndsAt,
          endDate: user.subscription.endDate
        },
        preferences: user.preferences
      }
    });
    
  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    
    // Handle specific OAuth errors
    if (error.message.includes('invalid_grant')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Authorization code expired or invalid. Please try signing in again.' 
      });
    }
    
    if (error.message.includes('redirect_uri_mismatch')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Redirect URI mismatch. Please check OAuth configuration.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Authentication failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Reset monthly usage if needed
    user.resetMonthlyUsage();
    await user.save();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
        isAdmin: user.isAdmin,
        subscription: {
          isActive: user.hasActiveSubscription,
          planType: user.subscription.planType,
          trialEndsAt: user.subscription.trialEndsAt,
          endDate: user.subscription.endDate
        },
        usage: user.usage,
        preferences: user.preferences,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Could not fetch user profile' });
  }
});

// Update user preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const { defaultSummaryType, defaultLength, defaultFormat } = req.body;
    const user = req.user;

    // Validate preferences
    const validTypes = ['insightful', 'funny', 'actionable', 'controversial'];
    const validLengths = ['short', 'detailed'];
    const validFormats = ['list', 'paragraph', 'timestamped'];

    if (defaultSummaryType && !validTypes.includes(defaultSummaryType)) {
      return res.status(400).json({ error: 'Invalid summary type' });
    }

    if (defaultLength && !validLengths.includes(defaultLength)) {
      return res.status(400).json({ error: 'Invalid length preference' });
    }

    if (defaultFormat && !validFormats.includes(defaultFormat)) {
      return res.status(400).json({ error: 'Invalid format preference' });
    }

    // Update preferences
    if (defaultSummaryType) user.preferences.defaultSummaryType = defaultSummaryType;
    if (defaultLength) user.preferences.defaultLength = defaultLength;
    if (defaultFormat) user.preferences.defaultFormat = defaultFormat;

    await user.save();

    res.json({
      success: true,
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Could not update preferences' });
  }
});

// Verify token endpoint (for extension to check if token is still valid)
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        subscription: {
          isActive: user.hasActiveSubscription,
          planType: user.subscription.planType
        }
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ valid: false, error: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ valid: false, error: 'Invalid token' });
    }
    
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
});

// Sign out (invalidate token on client side)
router.post('/signout', auth, async (req, res) => {
  try {
    // In a more sophisticated setup, you might maintain a blacklist of tokens
    // For now, we'll just confirm the signout
    res.json({ success: true, message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ error: 'Could not sign out' });
  }
});

// Admin endpoint to get user statistics
router.get('/admin/stats', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const totalUsers = await User.countDocuments();
    const activeSubscribers = await User.countDocuments({
      'subscription.isActive': true,
      'subscription.endDate': { $gt: new Date() }
    });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    res.json({
      totalUsers,
      activeSubscribers,
      newUsersThisMonth,
      freeUsers: totalUsers - activeSubscribers
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Could not fetch user statistics' });
  }
});

// Get user's own analytics and sign-in history
router.get('/profile/analytics', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return analytics data (excluding sensitive info like IP addresses for privacy)
    const analytics = {
      totalSignIns: user.analytics.totalSignIns,
      firstSignInAt: user.analytics.firstSignInAt,
      lastLoginAt: user.lastLoginAt,
      memberSince: user.createdAt,
      currentDevice: user.analytics.deviceInfo,
      recentSignIns: user.signInHistory.slice(0, 10).map(signin => ({
        timestamp: signin.timestamp,
        browser: signin.userAgent ? user.getBrowser(signin.userAgent) : 'Unknown',
        device: signin.userAgent ? user.getDevice(signin.userAgent) : 'Unknown'
        // Note: IP address excluded for privacy
      }))
    };

    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Profile analytics error:', error);
    res.status(500).json({ error: 'Could not fetch user analytics' });
  }
});

// Admin endpoint to get detailed user analytics (includes IP addresses)
router.get('/admin/user-analytics/:userId', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return complete analytics for admin
    const analytics = {
      userId: user.id,
      email: user.email,
      name: user.name,
      totalSignIns: user.analytics.totalSignIns,
      firstSignInAt: user.analytics.firstSignInAt,
      lastLoginAt: user.lastLoginAt,
      memberSince: user.createdAt,
      currentDevice: user.analytics.deviceInfo,
      signInHistory: user.signInHistory.slice(0, 20).map(signin => ({
        timestamp: signin.timestamp,
        method: signin.method,
        ipAddress: signin.ipAddress,
        browser: signin.userAgent ? user.getBrowser(signin.userAgent) : 'Unknown',
        device: signin.userAgent ? user.getDevice(signin.userAgent) : 'Unknown',
        os: signin.userAgent ? user.getOS(signin.userAgent) : 'Unknown'
      }))
    };

    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Admin user analytics error:', error);
    res.status(500).json({ error: 'Could not fetch user analytics' });
  }
});

// Admin endpoint to get platform-wide analytics
router.get('/admin/platform-analytics', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const totalUsers = await User.countDocuments();
    const activeSubscribers = await User.countDocuments({
      'subscription.isActive': true,
      'subscription.endDate': { $gt: new Date() }
    });
    
    // Get users who signed in within last 30 days
    const activeUsers = await User.countDocuments({
      lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Get new users this month
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    // Get most popular browsers/devices (aggregate from recent sign-ins)
    const deviceStats = await User.aggregate([
      { $match: { 'analytics.deviceInfo.lastBrowser': { $ne: null } } },
      { $group: { 
        _id: '$analytics.deviceInfo.lastBrowser', 
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const analytics = {
      totalUsers,
      activeSubscribers,
      freeUsers: totalUsers - activeSubscribers,
      activeUsers,
      newUsersThisMonth,
      popularBrowsers: deviceStats
    };

    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Platform analytics error:', error);
    res.status(500).json({ error: 'Could not fetch platform analytics' });
  }
});

// Test endpoint for debugging
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Test endpoint called');
    console.log('Environment vars:', {
      NODE_ENV: process.env.NODE_ENV,
      JWT_SECRET: !!process.env.JWT_SECRET,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET === 'your_google_client_secret_here' ? 'PLACEHOLDER' : 'CONFIGURED'
    });
    
    // Test user creation
    const testUser = await User.create({
      googleId: 'test_123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'test.jpg'
    });
    
    res.json({
      success: true,
      message: 'Test successful',
      userId: testUser.id || testUser._id
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;