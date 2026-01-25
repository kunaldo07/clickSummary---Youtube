/**
 * Supabase Subscription Model
 * Helper functions for subscription management with Supabase
 */

const { supabaseAdmin } = require('../config/supabase');

class Subscription {
  /**
   * Get subscription by user ID
   */
  static async findByUserId(userId) {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding subscription:', error);
      return null;
    }

    return data;
  }

  /**
   * Create new subscription
   */
  static async create(subscriptionData) {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update subscription
   */
  static async update(userId, updates) {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }

    return data;
  }

  /**
   * Cancel subscription
   */
  static async cancel(userId, reason = 'user_request', immediate = false) {
    const updates = {
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
      auto_renew: false
    };

    if (immediate) {
      updates.status = 'cancelled';
      updates.end_date = new Date().toISOString();
    }

    return await this.update(userId, updates);
  }

  /**
   * Check if subscription is active
   */
  static isActive(subscription) {
    if (!subscription) return false;
    
    const now = new Date();
    const endDate = new Date(subscription.end_date);
    
    return subscription.status === 'active' && 
           endDate > now &&
           !subscription.cancelled_at;
  }

  /**
   * Get active subscriptions
   */
  static async findActive() {
    const now = new Date().toISOString();
    
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .gt('end_date', now);

    if (error) {
      console.error('Error finding active subscriptions:', error);
      return [];
    }

    return data;
  }

  /**
   * Get expiring subscriptions
   */
  static async findExpiring(days = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .eq('auto_renew', true)
      .gte('end_date', now.toISOString())
      .lte('end_date', futureDate.toISOString());

    if (error) {
      console.error('Error finding expiring subscriptions:', error);
      return [];
    }

    return data;
  }
}

module.exports = Subscription;
