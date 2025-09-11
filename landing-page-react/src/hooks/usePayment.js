import React, { createContext, useContext, useState } from 'react';
import { paymentService } from '../services/paymentService';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

const PaymentContext = createContext();

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export const PaymentProvider = ({ children }) => {
  const { user, updateUserSubscription, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Simplified for single monthly plan
  const subscribeToPremium = async () => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return { success: false, error: 'Not authenticated' };
    }

    if (user.subscription && user.subscription.status === 'active' && user.subscription.plan === 'monthly') {
      toast.error('You are already subscribed to Premium!');
      return { success: false, error: 'Already subscribed' };
    }

    try {
      setLoading(true);
      setPaymentLoading(true);

      // Create subscription on backend - simplified for single plan
      const response = await paymentService.createSubscription({
        planType: 'monthly', // Always monthly since it's the only paid plan
        amount: 80000, // ₹800 in paise (to match Razorpay plan)
        currency: 'INR', // Matches Razorpay plan currency
        interval: 'month',
        interval_count: 1
      });

      if (response.success) {
        setPaymentLoading(false);
        
        // Initialize Razorpay payment
        return await initiateRazorpayPayment(response.subscription, response.order);
      } else {
        throw new Error(response.message || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to create subscription. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
      setPaymentLoading(false);
    }
  };

  const initiateRazorpayPayment = (subscription, order) => {
    return new Promise((resolve) => {
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        subscription_id: subscription.id,
        amount: subscription.amount,
        currency: subscription.currency,
        name: 'ClickSummary',
        description: 'Premium Monthly Subscription - ₹800/month',
        // Removed order_id: order.id - not needed for subscriptions and order can be null
        handler: async function (response) {
          console.log('Payment successful:', response);
          
          try {
            // Verify payment with backend
            const verificationResult = await paymentService.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verificationResult.success) {
              // Update user subscription status
              await updateUserSubscription({
                isActive: true,
                planType: 'monthly',
                status: 'active'
              });
              
              // Refresh user data
              await refreshUserData();
              
              toast.success('🎉 Welcome to Premium! You now have unlimited access.');
              resolve({ success: true, subscription: verificationResult.subscription });
            } else {
              toast.error('Payment verification failed. Please contact support.');
              resolve({ success: false, error: 'Payment verification failed' });
            }
          } catch (verificationError) {
            console.error('Payment verification error:', verificationError);
            toast.error('Payment verification failed. Please contact support.');
            resolve({ success: false, error: verificationError.message });
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ''
        },
        notes: {
          user_id: user.id,
          plan_type: 'monthly'
        },
        theme: {
          color: '#8b5cf6'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            setPaymentLoading(false);
            resolve({ success: false, error: 'Payment cancelled by user' });
          }
        }
      };

      if (window.Razorpay) {
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        toast.error('Payment system not loaded. Please refresh and try again.');
        resolve({ success: false, error: 'Razorpay not loaded' });
      }
    });
  };

  const getSubscriptionStatus = async () => {
    try {
      const response = await paymentService.getSubscriptionStatus();
      return response;
    } catch (error) {
      console.error('Get subscription status error:', error);
      return { success: false, error: error.message };
    }
  };

  const cancelSubscription = async () => {
    try {
      setLoading(true);
      
      const response = await paymentService.cancelSubscription();
      
      if (response.success) {
        // Update user subscription status
        await updateUserSubscription({
          isActive: false,
          planType: 'free',
          status: 'cancelled'
        });
        
        // Refresh user data
        await refreshUserData();
        
        toast.success('Subscription cancelled successfully');
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      toast.error('Failed to cancel subscription. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getPaymentHistory = async () => {
    try {
      const response = await paymentService.getPaymentHistory();
      return response;
    } catch (error) {
      console.error('Get payment history error:', error);
      return { success: false, error: error.message };
    }
  };

  const downloadInvoice = async (paymentId) => {
    try {
      const response = await paymentService.downloadInvoice(paymentId);
      return response;
    } catch (error) {
      console.error('Download invoice error:', error);
      toast.error('Failed to download invoice');
      return { success: false, error: error.message };
    }
  };

  // Helper function to check if user has active subscription
  const hasActiveSubscription = () => {
    return user?.subscription?.isActive && user?.subscription?.planType === 'monthly';
  };

  // Helper function to get current plan details
  const getCurrentPlan = () => {
    if (hasActiveSubscription()) {
      return {
        type: 'monthly',
        name: 'Premium',
        price: '₹800',
        period: 'per month',
        features: [
          'Unlimited summaries',
          'Unlimited AI chat',
          'All formats',
          'Priority support',
          'Export summaries',
          'Custom formats'
        ]
      };
    } else {
      return {
        type: 'free',
        name: 'Free',
        price: '₹0',
        period: 'forever',
        features: [
          '5 summaries per day',
          '1 AI chat per day',
          'Basic formats only'
        ]
      };
    }
  };

  const value = {
    // State
    loading,
    setLoading,
    paymentLoading,
    setPaymentLoading,
    
    // Actions
    subscribeToPremium, // Simplified - only monthly plan
    getSubscriptionStatus,
    cancelSubscription,
    getPaymentHistory,
    downloadInvoice,
    
    // Helpers
    hasActiveSubscription,
    getCurrentPlan,
    
    // User data
    user
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};