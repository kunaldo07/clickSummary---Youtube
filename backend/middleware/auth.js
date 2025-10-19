const jwt = require('jsonwebtoken');

// Always use DevUser for development to avoid MongoDB connection issues
let User;
if (process.env.NODE_ENV === 'development') {
  console.log('📝 Auth Middleware: Using in-memory DevUser for development');
  User = require('../models/DevUser');
} else {
  try {
    User = require('../models/User');
    console.log('📊 Auth Middleware: Using MongoDB User model');
  } catch (error) {
    console.log('📝 Auth Middleware: MongoDB not available, falling back to DevUser');
    User = require('../models/DevUser');
  }
}

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No valid token provided.' });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database to ensure they still exist
      let user = await User.findById(decoded.userId);
      
      // Development convenience: try to recover using googleId/email embedded in token
      if (!user && process.env.NODE_ENV === 'development') {
        try {
          if (decoded.googleId && typeof User.findByGoogleId === 'function') {
            user = await User.findByGoogleId(decoded.googleId);
          }
          if (!user) {
            const DevUser = require('../models/DevUser');
            user = await DevUser.create({
              id: decoded.userId,
              googleId: decoded.googleId || decoded.userId,
              email: decoded.email || 'dev@local',
              name: decoded.name || 'Developer',
              picture: '',
              subscription: {
                planType: 'free',
                status: 'active',
                isActive: true,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              }
            });
            console.log('🛠️ Dev fallback: recreated user from token payload', {
              userId: decoded.userId,
              googleId: decoded.googleId,
              email: decoded.email
            });
          }
        } catch (e) {
          console.warn('⚠️ Dev fallback user recovery failed:', e.message);
        }
      }
      
      if (!user) {
        return res.status(401).json({ error: 'User not found. Please sign in again.' });
      }

      req.user = user;
      req.userId = user._id || user.id;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired. Please sign in again.' });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token. Please sign in again.' });
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Middleware to verify Chrome extension
const verifyExtension = (req, res, next) => {
  const extensionId = req.header('X-Extension-ID');
  const extensionVersion = req.header('X-Extension-Version');
  
  if (!extensionId) {
    return res.status(400).json({ error: 'Extension ID required' });
  }
  
  // In production, you might want to verify against a whitelist
  if (process.env.NODE_ENV === 'production' && extensionId !== process.env.EXTENSION_ID) {
    return res.status(403).json({ error: 'Unauthorized extension' });
  }
  
  req.extensionId = extensionId;
  req.extensionVersion = extensionVersion;
  next();
};

// Optional auth - continues even if no token is provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next(); // Continue without authentication
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    } catch (jwtError) {
      // Silent fail for optional auth - just continue without user
      console.log('Optional auth failed:', jwtError.message);
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even on error
  }
};

// Generate JWT token
const generateToken = (userId, extra = {}) => {
  return jwt.sign(
    { userId, ...extra },
    process.env.JWT_SECRET,
    { 
      expiresIn: '30d',
      issuer: 'youtube-summarizer',
      audience: 'youtube-summarizer-extension'
    }
  );
};

// Verify and decode token without requiring request
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  auth,
  optionalAuth,
  verifyExtension,
  generateToken,
  verifyToken
};
