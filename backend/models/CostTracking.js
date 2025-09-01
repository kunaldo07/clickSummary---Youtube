const mongoose = require('mongoose');

const costTrackingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  videoId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'summary_generated',
      'summary_cached',
      'chat_query',
      'chat_cached',
      'transcript_analysis'
    ],
    index: true
  },
  model: {
    type: String,
    required: true,
    default: 'gpt-4o-mini'
  },
  inputTokens: {
    type: Number,
    default: 0,
    min: 0
  },
  outputTokens: {
    type: Number,
    default: 0,
    min: 0
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  cached: {
    type: Boolean,
    default: false,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    cacheKey: String,
    responseTime: Number, // in milliseconds
    retryCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
costTrackingSchema.index({ user: 1, timestamp: -1 });
costTrackingSchema.index({ user: 1, action: 1, timestamp: -1 });
costTrackingSchema.index({ timestamp: 1 }); // For cleanup operations
costTrackingSchema.index({ videoId: 1, timestamp: -1 });

// Index for monthly aggregations
costTrackingSchema.index({ 
  user: 1, 
  timestamp: 1 
});

// Index for analytics
costTrackingSchema.index({ 
  action: 1, 
  model: 1, 
  timestamp: -1 
});

// Virtual for total tokens
costTrackingSchema.virtual('totalTokens').get(function() {
  return this.inputTokens + this.outputTokens;
});

// Static method to get monthly cost for a user
costTrackingSchema.statics.getMonthlyCost = async function(userId, month = null, year = null) {
  const date = new Date();
  const targetMonth = month !== null ? month : date.getMonth();
  const targetYear = year !== null ? year : date.getFullYear();
  
  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 1);

  const result = await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        timestamp: {
          $gte: startDate,
          $lt: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalCost: { $sum: '$cost' },
        totalOperations: { $sum: 1 },
        totalInputTokens: { $sum: '$inputTokens' },
        totalOutputTokens: { $sum: '$outputTokens' },
        cachedOperations: {
          $sum: { $cond: ['$cached', 1, 0] }
        },
        actions: {
          $push: {
            action: '$action',
            cost: '$cost',
            tokens: { $add: ['$inputTokens', '$outputTokens'] }
          }
        }
      }
    }
  ]);

  return result[0] || {
    totalCost: 0,
    totalOperations: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    cachedOperations: 0,
    actions: []
  };
};

// Static method to get cost breakdown by action
costTrackingSchema.statics.getCostBreakdown = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$action',
        totalCost: { $sum: '$cost' },
        count: { $sum: 1 },
        avgCost: { $avg: '$cost' },
        totalTokens: { $sum: { $add: ['$inputTokens', '$outputTokens'] } },
        cachedCount: {
          $sum: { $cond: ['$cached', 1, 0] }
        }
      }
    },
    {
      $sort: { totalCost: -1 }
    }
  ]);
};

// Static method to get top spending users (admin only)
costTrackingSchema.statics.getTopSpenders = async function(limit = 10, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$user',
        totalCost: { $sum: '$cost' },
        totalOperations: { $sum: 1 },
        totalTokens: { $sum: { $add: ['$inputTokens', '$outputTokens'] } },
        cachedOperations: {
          $sum: { $cond: ['$cached', 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        email: '$user.email',
        name: '$user.name',
        totalCost: 1,
        totalOperations: 1,
        totalTokens: 1,
        cachedOperations: 1,
        cacheHitRate: {
          $cond: [
            { $gt: ['$totalOperations', 0] },
            { $multiply: [{ $divide: ['$cachedOperations', '$totalOperations'] }, 100] },
            0
          ]
        }
      }
    },
    {
      $sort: { totalCost: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Static method to get cost trends over time
costTrackingSchema.statics.getCostTrends = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        dailyCost: { $sum: '$cost' },
        operations: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    {
      $project: {
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day'
          }
        },
        cost: '$dailyCost',
        operations: 1,
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    },
    {
      $sort: { date: 1 }
    }
  ]);
};

// Method to calculate cost efficiency
costTrackingSchema.methods.getCostEfficiency = function() {
  const totalTokens = this.inputTokens + this.outputTokens;
  if (totalTokens === 0) return 0;
  
  return (this.cost / totalTokens) * 1000; // Cost per 1K tokens
};

// Pre-save middleware to validate cost calculations
costTrackingSchema.pre('save', function(next) {
  // Ensure cost is reasonable based on tokens
  const totalTokens = this.inputTokens + this.outputTokens;
  const maxExpectedCost = (totalTokens / 1000) * 0.002; // Conservative upper bound
  
  if (this.cost > maxExpectedCost) {
    console.warn(`⚠️  High cost detected: $${this.cost} for ${totalTokens} tokens`);
  }
  
  next();
});

// TTL index to automatically remove old records (optional)
costTrackingSchema.index(
  { timestamp: 1 }, 
  { 
    expireAfterSeconds: 365 * 24 * 60 * 60, // 1 year
    partialFilterExpression: { 
      cost: { $lt: 0.001 } // Only auto-delete very small costs
    }
  }
);

module.exports = mongoose.model('CostTracking', costTrackingSchema);
