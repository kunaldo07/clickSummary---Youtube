/**
 * Supabase Authentication Routes
 * Handles OAuth callbacks and session management
 */

const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateSupabase } = require('../middleware/supabaseAuth');
const SupabaseUser = require('../models/SupabaseUser');

const router = express.Router();

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
