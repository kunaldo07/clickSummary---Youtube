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

// Subscription plans configuration
const PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Plan',
    amount: 1000, // ₹10.00 in paise
    currency: 'INR',
    interval: 1,
    interval_type: 'month',
    features: ['Unlimited summaries', 'AI chat', 'All formats', 'Priority support']
  },
  quarterly: {
    id: 'quarterly',
    name: 'Quarterly Plan',
    amount: 2400, // ₹24.00 in paise
    currency: 'INR',
    interval: 3,
    interval_type: 'month',
    features: ['Unlimited summaries', 'AI chat', 'All formats', 'Priority support', '20% savings']
  }
};

// Create subscription
router.post('/create-subscription', auth, async (req, res) => {
  try {
    const { planType } = req.body;
    const user = req.user;

    if (!planType || !PLANS[planType]) {
      return res.status(400).json({ 
        error: 'Invalid plan type. Available plans: monthly, quarterly' 
      });
    }

    const plan = PLANS[planType];

    // Create Razorpay customer if doesn't exist
    let customerId = user.subscription?.razorpayCustomerId;
    
    if (!customerId) {
      const customer = await razorpay.customers.create({
        name: user.name,
        email: user.email,
        contact: user.phone || '',
        notes: {
          userId: user._id.toString(),
          planType: planType
        }
      });
      customerId = customer.id;
    }

    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planType === 'monthly' ? 'plan_monthly_id' : 'plan_quarterly_id', // You need to create these plans in Razorpay dashboard
      customer_id: customerId,
      quantity: 1,
      total_count: planType === 'monthly' ? 12 : 4, // 12 months or 4 quarters
      addons: [],
      notes: {
        userId: user._id.toString(),
        planType: planType,
        createdAt: new Date().toISOString()
      }
    });

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
      razorpayKey: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Verify payment and activate subscription
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { 
      razorpay_payment_id, 
      razorpay_subscription_id, 
      razorpay_signature,
      planType 
    } = req.body;

    const user = req.user;

    // Verify signature
    const body = razorpay_payment_id + '|' + razorpay_subscription_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Get subscription details from Razorpay
    const subscriptionDetails = await razorpay.subscriptions.fetch(razorpay_subscription_id);
    
    if (subscriptionDetails.status !== 'active') {
      return res.status(400).json({ error: 'Subscription is not active' });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    
    if (planType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planType === 'quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    }

    // Create or update subscription record
    let subscription = await Subscription.findOne({ user: user._id });
    
    if (subscription) {
      subscription.razorpaySubscriptionId = razorpay_subscription_id;
      subscription.razorpayCustomerId = subscriptionDetails.customer_id;
      subscription.planType = planType;
      subscription.status = 'active';
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.paymentHistory.push({
        paymentId: razorpay_payment_id,
        amount: PLANS[planType].amount,
        currency: 'INR',
        status: 'success',
        paidAt: new Date()
      });
    } else {
      subscription = new Subscription({
        user: user._id,
        razorpaySubscriptionId: razorpay_subscription_id,
        razorpayCustomerId: subscriptionDetails.customer_id,
        planType: planType,
        status: 'active',
        startDate: startDate,
        endDate: endDate,
        amount: PLANS[planType].amount,
        currency: 'INR',
        paymentHistory: [{
          paymentId: razorpay_payment_id,
          amount: PLANS[planType].amount,
          currency: 'INR',
          status: 'success',
          paidAt: new Date()
        }]
      });
    }

    await subscription.save();

    // Update user subscription info
    user.subscription = {
      isActive: true,
      planType: planType,
      razorpaySubscriptionId: razorpay_subscription_id,
      razorpayCustomerId: subscriptionDetails.customer_id,
      startDate: startDate,
      endDate: endDate
    };

    await user.save();

    console.log(`✅ Subscription activated for user ${user.email}: ${planType}`);

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: {
        planType: planType,
        status: 'active',
        startDate: startDate,
        endDate: endDate,
        features: PLANS[planType].features
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Get subscription status
router.get('/subscription-status', auth, async (req, res) => {
  try {
    const user = req.user;
    
    const subscription = await Subscription.findOne({ user: user._id });
    
    if (!subscription) {
      return res.json({
        isActive: false,
        planType: 'free',
        message: 'No active subscription'
      });
    }

    // Check if subscription is still active
    const isActive = subscription.isActive();
    
    res.json({
      isActive: isActive,
      planType: subscription.planType,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      status: subscription.status,
      features: PLANS[subscription.planType]?.features || [],
      paymentHistory: subscription.paymentHistory.slice(-5) // Last 5 payments
    });

  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ error: 'Could not fetch subscription status' });
  }
});

// Cancel subscription
router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    const user = req.user;
    
    const subscription = await Subscription.findOne({ user: user._id });
    
    if (!subscription || !subscription.razorpaySubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel subscription in Razorpay
    await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId, {
      cancel_at_cycle_end: true // Will cancel at the end of current billing cycle
    });

    // Update subscription status
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    await subscription.save();

    // Update user subscription info
    user.subscription.cancelledAt = new Date();
    await user.save();

    console.log(`🚫 Subscription cancelled for user ${user.email}`);

    res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of current billing cycle',
      endDate: subscription.endDate
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Get available plans
router.get('/plans', (req, res) => {
  const plansWithFeatures = Object.entries(PLANS).map(([key, plan]) => ({
    id: key,
    ...plan,
    priceDisplay: `₹${(plan.amount / 100).toFixed(0)}`,
    savings: key === 'quarterly' ? '20%' : null
  }));

  res.json({
    plans: plansWithFeatures,
    currency: 'INR'
  });
});

// Webhook to handle Razorpay events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
      .update(req.body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).send('Invalid signature');
    }

    const event = JSON.parse(req.body);
    
    console.log('📨 Razorpay webhook received:', event.event);

    switch (event.event) {
      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload.subscription.entity, event.payload.payment.entity);
        break;
        
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook error');
  }
});

// Webhook handlers
async function handleSubscriptionCharged(subscriptionData, paymentData) {
  try {
    const subscription = await Subscription.findOne({ 
      razorpaySubscriptionId: subscriptionData.id 
    });
    
    if (subscription) {
      subscription.paymentHistory.push({
        paymentId: paymentData.id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: 'success',
        paidAt: new Date(paymentData.created_at * 1000)
      });
      
      // Extend subscription
      const currentEnd = subscription.endDate;
      const newEnd = new Date(currentEnd);
      
      if (subscription.planType === 'monthly') {
        newEnd.setMonth(newEnd.getMonth() + 1);
      } else if (subscription.planType === 'quarterly') {
        newEnd.setMonth(newEnd.getMonth() + 3);
      }
      
      subscription.endDate = newEnd;
      await subscription.save();
      
      console.log(`💳 Subscription renewed for user ${subscription.user}`);
    }
  } catch (error) {
    console.error('Handle subscription charged error:', error);
  }
}

async function handleSubscriptionCancelled(subscriptionData) {
  try {
    const subscription = await Subscription.findOne({ 
      razorpaySubscriptionId: subscriptionData.id 
    });
    
    if (subscription) {
      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      await subscription.save();
      
      console.log(`🚫 Subscription cancelled for user ${subscription.user}`);
    }
  } catch (error) {
    console.error('Handle subscription cancelled error:', error);
  }
}

async function handlePaymentFailed(paymentData) {
  try {
    // Log failed payment for monitoring
    console.warn(`❌ Payment failed: ${paymentData.id}, Amount: ${paymentData.amount}`);
    
    // You could send notification emails here
  } catch (error) {
    console.error('Handle payment failed error:', error);
  }
}

module.exports = router;
