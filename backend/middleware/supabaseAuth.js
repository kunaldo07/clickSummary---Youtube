/**
 * Supabase Authentication Middleware
 * Validates Supabase JWT tokens and attaches user to request
 */

const { supabaseAdmin } = require('../config/supabase');

/**
 * Middleware to verify Supabase JWT token
 */
async function authenticateSupabase(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'No authorization token provided',
        message: 'Please sign in to continue'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    let userId = null;
    let isExtensionToken = false;

    // Try to decode as extension token first (base64-encoded JSON)
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      if (decoded.userId && decoded.email && decoded.timestamp) {
        // Validate token age (24 hours max)
        const tokenAge = Date.now() - decoded.timestamp;
        if (tokenAge < 24 * 60 * 60 * 1000) {
          userId = decoded.userId;
          isExtensionToken = true;
          console.log('✅ Extension token validated for user:', decoded.email);
        } else {
          console.warn('⚠️ Extension token expired');
        }
      }
    } catch (decodeError) {
      // Not an extension token, try Supabase JWT
    }

    // If not extension token, verify with Supabase
    if (!isExtensionToken) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        console.error('❌ Token verification failed:', error?.message);
        return res.status(401).json({ 
          error: 'Invalid or expired token',
          message: 'Please sign in again'
        });
      }

      userId = user.id;
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError);
      return res.status(500).json({ 
        error: 'Failed to fetch user profile'
      });
    }

    if (!profile) {
      console.error('❌ User profile not found for ID:', userId);
      return res.status(404).json({ 
        error: 'User profile not found',
        message: 'Please sign in again'
      });
    }

    req.user = profile;

    // Update last active timestamp
    await supabaseAdmin
      .from('users')
      .update({ 
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      message: error.message 
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && user) {
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      req.user = profile;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('⚠️ Optional auth error:', error);
    req.user = null;
    next();
  }
}

module.exports = {
  authenticateSupabase,
  optionalAuth
};
