/**
 * Supabase User Model
 * Helper functions for user management with Supabase
 */

const { supabaseAdmin } = require('../config/supabase');

class SupabaseUser {
  /**
   * Get user by ID
   */
  static async findById(userId) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }

    return data;
  }

  /**
   * Get user by email
   */
  static async findByEmail(email) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error finding user by email:', error);
      return null;
    }

    return data;
  }

  /**
   * Get user by Google ID
   */
  static async findByGoogleId(googleId) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding user by Google ID:', error);
      return null;
    }

    return data;
  }

  /**
   * Create new user
   */
  static async create(userData) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update user
   */
  static async update(userId, updates) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }

    return data;
  }

  /**
   * Reset YouTube usage (monthly cycle)
   */
  static async resetYouTubeUsage(userId) {
    const user = await this.findById(userId);
    if (!user) return false;

    const now = new Date();
    const renewalDate = new Date(user.youtube_renewal_date);

    if (now >= renewalDate) {
      await this.update(userId, {
        summaries_this_month: 0,
        chat_queries_this_month: 0,
        youtube_renewal_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      return true;
    }

    return false;
  }

  /**
   * Get monthly limits based on subscription
   */
  static getMonthlyLimits(user) {
    const isPaid = user.subscription_plan === 'monthly' && 
                   user.subscription_status === 'active' &&
                   user.current_period_end &&
                   new Date() < new Date(user.current_period_end);

    return {
      summaries: isPaid ? -1 : 50, // -1 = unlimited
      chatQueries: isPaid ? -1 : 30 // Free plan: 30 chats/month
    };
  }

  /**
   * Check if user can create summary
   */
  static async canCreateSummary(userId) {
    await this.resetYouTubeUsage(userId);
    const user = await this.findById(userId);
    
    if (!user) {
      return { allowed: false, remaining: 0 };
    }

    const limits = this.getMonthlyLimits(user);

    if (limits.summaries === -1) {
      return { 
        allowed: true, 
        remaining: -1,
        limit: -1,
        used: user.summaries_this_month,
        renewalDate: user.youtube_renewal_date
      };
    }

    const remaining = limits.summaries - user.summaries_this_month;
    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
      limit: limits.summaries,
      used: user.summaries_this_month,
      renewalDate: user.youtube_renewal_date
    };
  }

  /**
   * Check if user can use chat
   */
  static async canUseChat(userId) {
    await this.resetYouTubeUsage(userId);
    const user = await this.findById(userId);
    
    if (!user) {
      return { allowed: false, remaining: 0 };
    }

    const limits = this.getMonthlyLimits(user);

    if (limits.chatQueries === -1) {
      return { 
        allowed: true, 
        remaining: -1,
        limit: -1,
        used: user.chat_queries_this_month,
        renewalDate: user.youtube_renewal_date
      };
    }

    const remaining = limits.chatQueries - user.chat_queries_this_month;
    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
      limit: limits.chatQueries,
      used: user.chat_queries_this_month,
      renewalDate: user.youtube_renewal_date
    };
  }

  /**
   * Increment usage
   */
  static async incrementUsage(userId, type, cost = 0) {
    const user = await this.findById(userId);
    if (!user) return;

    const updates = {
      cost_this_month: parseFloat(user.cost_this_month || 0) + cost,
      last_active_at: new Date().toISOString()
    };

    if (type === 'summary') {
      updates.summaries_this_month = user.summaries_this_month + 1;
    } else if (type === 'chat') {
      updates.chat_queries_this_month = user.chat_queries_this_month + 1;
    }

    await this.update(userId, updates);
  }

  /**
   * Check if user can use premium features
   */
  static canUsePremiumFeatures(user) {
    // Check trial
    if (user.trial_ends_at && new Date() < new Date(user.trial_ends_at)) {
      return true;
    }

    // Check active subscription
    return user.subscription_status === 'active' &&
           user.current_period_end &&
           new Date() < new Date(user.current_period_end);
  }
}

module.exports = SupabaseUser;
