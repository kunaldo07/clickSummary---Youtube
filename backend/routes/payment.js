const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { auth } = require('../middleware/auth');

// Try to use MongoDB User model, fall back to DevUser if MongoDB is not available
let User;
try {
  User = require('../models/User');
} catch (error) {
  console.log('📝 Payment routes: Using in-memory DevUser for development');
  User = require('../models/DevUser');
}

const Subscription = require('../models/Subscription');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Simplified subscription plans configuration - Only Free and Monthly
const PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Plan',
    amount: 80000, // ₹800.00 in paise (to match your Razorpay plan)
    currency: 'INR', // Matches your Razorpay plan currency
    interval: 1,
    interval_type: 'month',
    features: ['Unlimited summaries', 'AI chat', 'All formats', 'Priority support']
  }
  // Removed quarterly plan - simplified to only Free and Monthly
};

// Create subscription
router.post('/create-subscription', auth, async (req, res) => {
  try {
    const { planType } = req.body;
    const user = req.user;

    // Simplified validation - only 'monthly' is valid for paid plans
    if (!planType || !PLANS[planType]) {
      return res.status(400).json({ 
        error: 'Invalid plan type. Available plans: monthly' 
      });
    }

    const plan = PLANS[planType];

    // Create or get Razorpay customer
    let customerId = user.razorpayCustomerId;
    
    if (!customerId) {
      try {
        console.log('🔍 Creating new Razorpay customer for:', user.email);
        const customer = await razorpay.customers.create({
          name: user.name,
          email: user.email,
          contact: user.phone || '',
          notes: {
            userId: user._id.toString()
          }
        });
        
        console.log('✅ Razorpay customer created:', customer.id);
        user.razorpayCustomerId = customer.id;
        await user.save();
        customerId = customer.id;
      } catch (customerError) {
        // If customer already exists, find the existing customer
        if (customerError.error && customerError.error.description && 
            customerError.error.description.includes('Customer already exists')) {
          console.log('🔍 Customer already exists, searching for existing customer...');
          
          try {
            // Search for existing customer by email
            const existingCustomers = await razorpay.customers.all({
              count: 100 // Get up to 100 customers to search through
            });
            
            const existingCustomer = existingCustomers.items.find(c => c.email === user.email);
            
            if (existingCustomer) {
              console.log('✅ Found existing Razorpay customer:', existingCustomer.id);
              user.razorpayCustomerId = existingCustomer.id;
              await user.save();
              customerId = existingCustomer.id;
            } else {
              throw new Error('Customer exists but could not be found in search results');
            }
          } catch (searchError) {
            console.error('❌ Error searching for existing customer:', searchError);
            throw new Error('Could not create or find Razorpay customer');
          }
        } else {
          console.error('❌ Error creating Razorpay customer:', customerError);
          throw customerError;
        }
      }
    } else {
      console.log('✅ Using existing Razorpay customer:', customerId);
    }

    // Create Razorpay subscription - simplified for single plan
    const planId = process.env.RAZORPAY_MONTHLY_PLAN_ID || 'plan_monthly_clicksummary';
    console.log('🔍 Using Razorpay Plan ID:', planId);
    
    console.log('🔍 Creating Razorpay subscription with:', {
      plan_id: planId,
      customer_id: customerId,
      quantity: 1,
      total_count: 12
    });
    
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId, // Simplified - only one plan needed
      customer_id: customerId,
      quantity: 1,
      total_count: 12, // 12 months (simplified since only monthly)
      addons: [],
      notes: {
        userId: user._id.toString(),
        planType: planType,
        createdAt: new Date().toISOString()
      }
    });
    
    console.log('✅ Razorpay subscription created:', subscription.id);

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        customerId: customerId,
        planType: planType,
        amount: plan.amount,
        currency: plan.currency,
        features: plan.features
      },
      order: null // Razorpay subscriptions don't use orders
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create subscription',
      details: error.message 
    });
  }
});

// Verify payment
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { 
      razorpay_payment_id, 
      razorpay_subscription_id, 
      razorpay_signature 
    } = req.body;

    const user = req.user;

    // Verify signature
    const body = razorpay_payment_id + "|" + razorpay_subscription_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Get subscription details from Razorpay
      const subscription = await razorpay.subscriptions.fetch(razorpay_subscription_id);
      
      // Update user subscription in database
      user.subscription = {
        isActive: true,
        planType: 'monthly', // Always monthly since it's the only paid plan
        razorpaySubscriptionId: razorpay_subscription_id,
        razorpayCustomerId: user.razorpayCustomerId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'active'
      };

      await user.save();

      // Create subscription record
      await Subscription.create({
        userId: user._id,
        razorpaySubscriptionId: razorpay_subscription_id,
        razorpayCustomerId: user.razorpayCustomerId,
        planType: 'monthly',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        amount: PLANS.monthly.amount,
        currency: PLANS.monthly.currency
      });

      res.json({
        success: true,
        message: 'Payment verified successfully',
        subscription: {
          isActive: true,
          planType: 'monthly',
          status: 'active'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      error: 'Payment verification failed',
      details: error.message 
    });
  }
});

// Get subscription status
router.get('/subscription-status', auth, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.subscription.isActive) {
      return res.json({
        success: true,
        subscription: {
          isActive: false,
          planType: 'free',
          status: 'inactive'
        }
      });
    }

    // For active subscriptions, get latest status from Razorpay
    if (user.subscription.razorpaySubscriptionId) {
      try {
        const razorpaySubscription = await razorpay.subscriptions.fetch(
          user.subscription.razorpaySubscriptionId
        );

        // Update local status based on Razorpay status
        const isActive = ['active', 'authenticated'].includes(razorpaySubscription.status);
        
        if (!isActive && user.subscription.isActive) {
          // Subscription was cancelled/expired, update user
          user.subscription.isActive = false;
          user.subscription.status = razorpaySubscription.status;
          await user.save();
        }

        res.json({
          success: true,
          subscription: {
            isActive: isActive,
            planType: isActive ? 'monthly' : 'free',
            status: razorpaySubscription.status,
            currentPeriodStart: razorpaySubscription.current_start,
            currentPeriodEnd: razorpaySubscription.current_end,
            nextBilling: razorpaySubscription.current_end
          }
        });
      } catch (razorpayError) {
        console.error('Razorpay fetch error:', razorpayError);
        // Fallback to local data
        res.json({
          success: true,
          subscription: {
            isActive: user.subscription.isActive,
            planType: user.subscription.isActive ? 'monthly' : 'free',
            status: user.subscription.status || 'unknown'
          }
        });
      }
    } else {
      res.json({
        success: true,
        subscription: {
          isActive: user.subscription.isActive,
          planType: user.subscription.isActive ? 'monthly' : 'free',
          status: user.subscription.status || 'active'
        }
      });
    }
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ 
      error: 'Failed to get subscription status',
      details: error.message 
    });
  }
});

// Cancel subscription
router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user.subscription.razorpaySubscriptionId) {
      return res.status(400).json({
        error: 'No active subscription found'
      });
    }

    // Cancel subscription in Razorpay
    const cancelledSubscription = await razorpay.subscriptions.cancel(
      user.subscription.razorpaySubscriptionId
    );

    // Update user subscription status
    user.subscription.isActive = false;
    user.subscription.status = 'cancelled';
    user.subscription.endDate = new Date(); // End immediately
    await user.save();

    // Update subscription record
    await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: user.subscription.razorpaySubscriptionId },
      { 
        status: 'cancelled',
        endDate: new Date()
      }
    );

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: {
        isActive: false,
        planType: 'free',
        status: 'cancelled'
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ 
      error: 'Failed to cancel subscription',
      details: error.message 
    });
  }
});

// Update subscription
router.put('/update-subscription', auth, async (req, res) => {
  try {
    const { planType } = req.body;
    const user = req.user;

    if (!PLANS[planType]) {
      return res.status(400).json({
        error: 'Invalid plan type'
      });
    }

    if (!user.subscription.razorpaySubscriptionId) {
      return res.status(400).json({
        error: 'No active subscription found'
      });
    }

    // Since we only have monthly plan now, this endpoint is mainly for future use
    // For now, just return current subscription
    res.json({
      success: true,
      message: 'Subscription update successful',
      subscription: {
        isActive: user.subscription.isActive,
        planType: 'monthly',
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ 
      error: 'Failed to update subscription',
      details: error.message 
    });
  }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Get subscription records for this user
    const subscriptions = await Subscription.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const paymentHistory = subscriptions.map(sub => ({
      id: sub._id,
      date: sub.createdAt,
      amount: sub.amount,
      currency: sub.currency,
      planType: sub.planType,
      status: sub.status,
      razorpaySubscriptionId: sub.razorpaySubscriptionId
    }));

    res.json({
      success: true,
      payments: paymentHistory
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ 
      error: 'Failed to get payment history',
      details: error.message 
    });
  }
});

// Download invoice
router.get('/invoice/:paymentId', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const user = req.user;

    // This is a placeholder - you would implement actual invoice generation here
    res.json({
      success: false,
      error: 'Invoice download not implemented yet'
    });
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ 
      error: 'Failed to download invoice',
      details: error.message 
    });
  }
});

// Get current usage statistics
router.get('/usage', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Reset daily usage if needed
    await user.resetDailyUsage();
    
    const limits = user.getDailyLimits();
    const resetTime = new Date();
    resetTime.setHours(24, 0, 0, 0); // Next midnight
    
    res.json({
      success: true,
      usage: {
        plan: {
          type: user.hasActiveSubscription ? 'monthly' : 'free', // Simplified plan types
          isActive: user.hasActiveSubscription,
          features: user.hasActiveSubscription ? 
            PLANS.monthly.features : 
            ['5 summaries per day', '1 chat per day', 'Basic features']
        },
        summaries: {
          used: user.usage.summariesToday,
          limit: limits.summaries,
          remaining: Math.max(0, limits.summaries - user.usage.summariesToday),
          unlimited: user.hasActiveSubscription
        },
        chat: {
          used: user.usage.chatQueriesToday,
          limit: limits.chat,
          remaining: Math.max(0, limits.chat - user.usage.chatQueriesToday),
          unlimited: user.hasActiveSubscription
        },
        resetTime: resetTime.toISOString(),
        lastReset: user.usage.lastDailyReset
      }
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ 
      error: 'Failed to get usage statistics',
      details: error.message 
    });
  }
});

module.exports = router;