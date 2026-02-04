/**
 * Supabase Authentication Routes
 * Handles OAuth callbacks and session management
 */

const express = require('express');
const { supabaseAdmin, supabaseAnon } = require('../config/supabase');
const { authenticateSupabase } = require('../middleware/supabaseAuth');
const SupabaseUser = require('../models/SupabaseUser');

const router = express.Router();

router.post('/google-callback', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code required' });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ success: false, message: 'OAuth not properly configured' });
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
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

    if (!tokenResponse.ok || tokenData.error) {
      return res.status(400).json({
        success: false,
        message: tokenData.error_description || tokenData.error || 'Token exchange failed'
      });
    }

    const idToken = tokenData.id_token;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Missing id_token from Google token exchange' });
    }

    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithIdToken({
      provider: 'google',
      token: idToken
    });

    if (signInError || !signInData?.session?.access_token) {
      return res.status(401).json({
        success: false,
        message: signInError?.message || 'Failed to authenticate with Supabase'
      });
    }

    const accessToken = signInData.session.access_token;
    const refreshToken = signInData.session.refresh_token;

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        message: userError?.message || 'Invalid session'
      });
    }

    let profile = await SupabaseUser.findById(user.id);

    if (!profile) {
      profile = await SupabaseUser.create({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email.split('@')[0],
        picture: user.user_metadata?.picture || user.user_metadata?.avatar_url,
        google_id: user.user_metadata?.provider_id || user.id,
        last_login_at: new Date().toISOString()
      });
    } else {
      await SupabaseUser.update(user.id, {
        last_login_at: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      token: accessToken,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        role: profile.role || 'user',
        subscription: {
          plan: profile.subscription_plan,
          status: profile.subscription_status
        }
      },
      session: {
        access_token: accessToken,
        refresh_token: refreshToken
      }
    });
  } catch (error) {
    console.error('❌ Google callback error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Authentication failed'
    });
  }
});

/**
 * Extension-native Google OAuth token exchange
 * Chrome extension uses chrome.identity to get Google token, then exchanges it here
 */
router.post('/extension/google', async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'Google access token required' });
    }

    // Get user info from Google
    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!googleResponse.ok) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const googleUser = await googleResponse.json();

    // Find or create user in our database by email
    let profile = await SupabaseUser.findByEmail(googleUser.email);

    if (!profile) {
      // Create new user with Supabase-generated UUID
      const { v4: uuidv4 } = require('uuid');
      profile = await SupabaseUser.create({
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        google_id: googleUser.id,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log('✅ New extension user registered:', googleUser.email);
    } else {
      // Update existing user
      await SupabaseUser.update(profile.id, {
        last_login_at: new Date().toISOString(),
        picture: googleUser.picture,
        name: googleUser.name
      });
      console.log('✅ Extension user logged in:', googleUser.email);
    }

    // Generate a simple JWT or use the Google token as session identifier
    // For now, we'll use the profile ID as the token (you should use proper JWT)
    const sessionToken = Buffer.from(JSON.stringify({
      userId: profile.id,
      email: profile.email,
      timestamp: Date.now()
    })).toString('base64');

    res.json({
      success: true,
      token: sessionToken,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        role: profile.role || 'user',
        subscription: {
          plan: profile.subscription_plan || 'free',
          status: profile.subscription_status || 'active'
        }
      }
    });

  } catch (error) {
    console.error('❌ Extension Google auth error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: error.message 
    });
  }
});

/**
 * Exchange Supabase session for user data
 * Frontend will handle OAuth flow, then send session to backend
 */
router.post('/session', async (req, res) => {
  try {
    const { access_token, refresh_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // Verify the session with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token);

    if (error || !user) {
      console.error('❌ Session verification failed:', error?.message);
      return res.status(401).json({ 
        error: 'Invalid session',
        message: 'Please sign in again'
      });
    }

    // Get or create user profile
    let profile = await SupabaseUser.findById(user.id);

    if (!profile) {
      // Create new user profile
      profile = await SupabaseUser.create({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.email.split('@')[0],
        picture: user.user_metadata?.picture || user.user_metadata?.avatar_url,
        google_id: user.user_metadata?.provider_id || user.id,
        last_login_at: new Date().toISOString()
      });
      console.log('✅ New user registered:', user.email);
    } else {
      // Update last login
      await SupabaseUser.update(user.id, {
        last_login_at: new Date().toISOString()
      });
      console.log('✅ Existing user logged in:', user.email);
    }

    // Return user data and tokens
    res.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        subscription: {
          plan: profile.subscription_plan,
          status: profile.subscription_status
        }
      },
      session: {
        access_token,
        refresh_token
      }
    });

  } catch (error) {
    console.error('❌ Session exchange error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: error.message 
    });
  }
});

/**
 * Get current user profile
 */
router.get('/me', authenticateSupabase, async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
        subscription: {
          plan: user.subscription_plan,
          status: user.subscription_status,
          currentPeriodEnd: user.current_period_end,
          trialEndsAt: user.trial_ends_at
        },
        usage: {
          summariesThisMonth: user.summaries_this_month,
          chatQueriesThisMonth: user.chat_queries_this_month,
          costThisMonth: user.cost_this_month,
          renewalDate: user.youtube_renewal_date
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * Sign out (handled client-side with Supabase, this is just for logging)
 */
router.post('/signout', authenticateSupabase, async (req, res) => {
  try {
    console.log('👋 User signed out:', req.user.email);
    res.json({ success: true, message: 'Signed out successfully' });
  } catch (error) {
    console.error('❌ Sign out error:', error);
    res.status(500).json({ error: 'Sign out failed' });
  }
});

/**
 * Verify token (for extensions and frontend)
 */
router.get('/verify', authenticateSupabase, async (req, res) => {
  try {
    res.json({
      success: true,
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
      }
    });
  } catch (error) {
    res.status(401).json({ 
      success: false,
      valid: false,
      error: 'Invalid token' 
    });
  }
});

module.exports = router;
