const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  razorpaySubscriptionId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values but ensures uniqueness when present
    index: true
  },
  razorpayCustomerId: {
    type: String,
    index: true
  },
  planType: {
    type: String,
    enum: ['free', 'monthly', 'quarterly'],
    default: 'free',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'pending', 'failed'],
    default: 'pending',
    index: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    index: true
  },
  trialEndDate: {
    type: Date
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD']
  },
  billingCycle: {
    interval: {
      type: Number,
      default: 1
    },
    intervalType: {
      type: String,
      enum: ['day', 'week', 'month', 'year'],
      default: 'month'
    }
  },
  paymentHistory: [{
    paymentId: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending', 'refunded'],
      required: true
    },
    paidAt: {
      type: Date,
      default: Date.now
    },
    failureReason: String,
    refundId: String,
    refundedAt: Date
  }],
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    enum: ['user_request', 'payment_failed', 'admin_action', 'upgrade', 'downgrade']
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  discounts: [{
    code: String,
    type: {
      type: String,
      enum: ['percentage', 'fixed_amount']
    },
    value: Number,
    appliedAt: {
      type: Date,
      default: Date.now
    },
    validUntil: Date
  }],
  metadata: {
    referralCode: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    upgradeFrom: String,
    notes: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });
subscriptionSchema.index({ createdAt: -1 });
subscriptionSchema.index({ planType: 1, status: 1 });

// Virtual to check if subscription is currently active
subscriptionSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.endDate && 
         this.endDate > now &&
         (!this.cancelledAt || this.endDate > now);
});

// Virtual to get days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate || this.status !== 'active') return 0;
  
  const now = new Date();
  const diffTime = this.endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual to get renewal date
subscriptionSchema.virtual('nextRenewalDate').get(function() {
  if (!this.autoRenew || this.status !== 'active') return null;
  return this.endDate;
});

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         this.endDate && 
         this.endDate > now &&
         !this.cancelledAt;
};

// Method to check if subscription is in trial period
subscriptionSchema.methods.isInTrial = function() {
  if (!this.trialEndDate) return false;
  const now = new Date();
  return now < this.trialEndDate;
};

// Method to extend subscription
subscriptionSchema.methods.extend = function(months) {
  if (!this.endDate) {
    this.endDate = new Date();
  }
  
  const newEndDate = new Date(this.endDate);
  newEndDate.setMonth(newEndDate.getMonth() + months);
  this.endDate = newEndDate;
  
  if (this.status === 'expired' || this.status === 'cancelled') {
    this.status = 'active';
    this.cancelledAt = null;
  }
};

// Method to cancel subscription
subscriptionSchema.methods.cancel = function(reason = 'user_request', immediate = false) {
  this.status = immediate ? 'cancelled' : this.status; // Keep active until end date if not immediate
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  this.autoRenew = false;
  
  if (immediate) {
    this.endDate = new Date();
  }
};

// Method to get billing amount for current plan
subscriptionSchema.methods.getBillingAmount = function() {
  const plans = {
    monthly: 1000, // ₹10 in paise
    quarterly: 2400 // ₹24 in paise
  };
  
  return plans[this.planType] || 0;
};

// Method to add payment record
subscriptionSchema.methods.addPayment = function(paymentData) {
  this.paymentHistory.push({
    paymentId: paymentData.paymentId,
    amount: paymentData.amount,
    currency: paymentData.currency || 'INR',
    status: paymentData.status,
    paidAt: paymentData.paidAt || new Date(),
    failureReason: paymentData.failureReason,
    refundId: paymentData.refundId,
    refundedAt: paymentData.refundedAt
  });
  
  // If successful payment, extend subscription
  if (paymentData.status === 'success') {
    const months = this.planType === 'monthly' ? 1 : 3;
    this.extend(months);
    this.status = 'active';
  }
};

// Method to apply discount
subscriptionSchema.methods.applyDiscount = function(discountCode, type, value, validUntil) {
  this.discounts.push({
    code: discountCode,
    type: type,
    value: value,
    validUntil: validUntil
  });
};

// Static method to find active subscriptions
subscriptionSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    endDate: { $gt: now }
  });
};

// Static method to find expiring subscriptions
subscriptionSchema.statics.findExpiring = function(days = 7) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    endDate: { $gte: now, $lte: futureDate },
    autoRenew: true
  });
};

// Static method to find expired subscriptions
subscriptionSchema.statics.findExpired = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    endDate: { $lt: now }
  });
};

// Static method for revenue analytics
subscriptionSchema.statics.getRevenueAnalytics = async function(startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          planType: '$planType'
        },
        count: { $sum: 1 },
        revenue: { $sum: '$amount' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
};

// Pre-save middleware to handle subscription logic
subscriptionSchema.pre('save', function(next) {
  // Set end date based on plan type if not set
  if (this.isNew && !this.endDate && this.planType !== 'free') {
    const startDate = this.startDate || new Date();
    const endDate = new Date(startDate);
    
    if (this.planType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (this.planType === 'quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    }
    
    this.endDate = endDate;
  }
  
  // Auto-expire if past end date
  if (this.endDate && new Date() > this.endDate && this.status === 'active') {
    this.status = 'expired';
  }
  
  next();
});

// Post-save middleware for logging
subscriptionSchema.post('save', function(doc) {
  if (this.isNew) {
    console.log(`💳 New subscription created: ${doc.planType} for user ${doc.user}`);
  }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
