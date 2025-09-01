import { apiService } from './apiService';

class PaymentService {
  async createSubscription(subscriptionData) {
    try {
      const response = await apiService.post('/payment/create-subscription', subscriptionData);
      return response.data;
    } catch (error) {
      console.error('Create subscription error:', error);
      throw error;
    }
  }

  async verifyPayment(paymentData) {
    try {
      const response = await apiService.post('/payment/verify-payment', paymentData);
      return response.data;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  async getSubscriptionStatus() {
    try {
      const response = await apiService.get('/payment/subscription-status');
      return response.data;
    } catch (error) {
      console.error('Get subscription status error:', error);
      throw error;
    }
  }

  async cancelSubscription() {
    try {
      const response = await apiService.post('/payment/cancel-subscription');
      return response.data;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionData) {
    try {
      const response = await apiService.put('/payment/update-subscription', subscriptionData);
      return response.data;
    } catch (error) {
      console.error('Update subscription error:', error);
      throw error;
    }
  }

  async getPaymentHistory() {
    try {
      const response = await apiService.get('/payment/history');
      return response.data;
    } catch (error) {
      console.error('Get payment history error:', error);
      throw error;
    }
  }

  async downloadInvoice(paymentId) {
    try {
      const response = await apiService.get(`/payment/invoice/${paymentId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Download invoice error:', error);
      throw error;
    }
  }

  // Utility methods
  formatAmount(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount / 100); // Convert from cents
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getSubscriptionStatusText(status) {
    const statusMap = {
      'active': 'Active',
      'inactive': 'Inactive',
      'cancelled': 'Cancelled',
      'past_due': 'Past Due',
      'trialing': 'Trial Period',
      'incomplete': 'Incomplete',
      'incomplete_expired': 'Expired'
    };
    return statusMap[status] || 'Unknown';
  }

  getSubscriptionStatusColor(status) {
    const colorMap = {
      'active': '#10b981',
      'inactive': '#6b7280',
      'cancelled': '#ef4444',
      'past_due': '#f59e0b',
      'trialing': '#3b82f6',
      'incomplete': '#f59e0b',
      'incomplete_expired': '#ef4444'
    };
    return colorMap[status] || '#6b7280';
  }

  calculateNextBilling(subscription) {
    if (!subscription || !subscription.currentPeriodEnd) {
      return null;
    }
    
    const endDate = new Date(subscription.currentPeriodEnd);
    const now = new Date();
    
    if (endDate <= now) {
      return null;
    }
    
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    return {
      date: this.formatDate(subscription.currentPeriodEnd),
      daysRemaining
    };
  }
}

export const paymentService = new PaymentService();
