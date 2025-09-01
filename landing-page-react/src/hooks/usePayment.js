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

  const subscribeToPremium = async () => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      return { success: false, error: 'Not authenticated' };
    }

    if (user.subscription && user.subscription.status === 'active' && user.subscription.plan === 'premium') {
      toast.error('You are already subscribed to Premium!');
      return { success: false, error: 'Already subscribed' };
    }

    try {
      setLoading(true);
      setPaymentLoading(true);

      // Create subscription on backend
      const response = await paymentService.createSubscription({
        plan: 'premium',
        amount: 1000, // $10 in cents
        currency: 'USD',
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
        key: process.env.REACT_APP_RAZORPAY_KEY || 'rzp_test_your_key_here',
        amount: order.amount,
        currency: order.currency,
        name: 'YouTube Summarizer',
        description: 'Premium Monthly Subscription - $10/month',
        order_id: order.id,
        subscription_id: subscription.id,
        handler: async function(response) {
          console.log('Payment successful:', response);
          const result = await verifyPayment(response);
          resolve(result);
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ''
        },
        notes: {
          user_id: user.id,
          plan: 'premium',
          duration: '1 month'
        },
        theme: {
          color: '#8b5cf6',
          backdrop_color: 'rgba(0, 0, 0, 0.8)'
        },
        modal: {
          backdropclose: false,
          escape: false,
          ondismiss: function() {
            console.log('Payment modal dismissed by user');
            toast('Payment was cancelled. You can try again anytime!', {
              icon: 'ℹ️'
            });
            resolve({ success: false, cancelled: true });
          }
        },
        retry: {
          enabled: true,
          max_count: 3
        }
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', function(response) {
        console.error('Payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description || 'Please try again.'}`);
        resolve({ success: false, error: response.error });
      });

      // Small delay for better UX
      setTimeout(() => {
        razorpay.open();
      }, 500);
    });
  };

  const verifyPayment = async (paymentResponse) => {
    try {
      setPaymentLoading(true);
      toast.loading('Verifying your payment...', { id: 'payment-verify' });

      const response = await paymentService.verifyPayment({
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        subscription_id: paymentResponse.razorpay_subscription_id
      });

      if (response.success) {
        // Update user subscription
        updateUserSubscription(response.subscription);

        toast.dismiss('payment-verify');
        
        // Show success with celebration
        toast.success('🎉 Welcome to Premium! Your subscription is now active.', {
          duration: 6000
        });

        // Refresh user data
        setTimeout(() => {
          refreshUserData();
        }, 1000);

        return { success: true, subscription: response.subscription };
      } else {
        throw new Error(response.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.dismiss('payment-verify');
      toast.error(`Payment verification failed. Please contact support with payment ID: ${paymentResponse.razorpay_payment_id}`);
      return { success: false, error: error.message };
    } finally {
      setPaymentLoading(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      setLoading(true);
      toast.loading('Cancelling subscription...', { id: 'cancel-sub' });

      const response = await paymentService.cancelSubscription();

      if (response.success) {
        updateUserSubscription(response.subscription);
        
        toast.dismiss('cancel-sub');
        toast.success('Subscription cancelled. You will have access to premium features until the end of your billing cycle.');
        
        return { success: true, subscription: response.subscription };
      } else {
        throw new Error(response.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      toast.dismiss('cancel-sub');
      toast.error('Failed to cancel subscription. Please contact support.');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionStatus = async () => {
    try {
      const response = await paymentService.getSubscriptionStatus();
      return response;
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    loading,
    paymentLoading,
    subscribeToPremium,
    cancelSubscription,
    getSubscriptionStatus
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};
