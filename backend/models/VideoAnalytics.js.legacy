const mongoose = require('mongoose');

const videoAnalyticsSchema = new mongoose.Schema({
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
  videoUrl: {
    type: String,
    required: true
  },
  videoTitle: {
    type: String,
    required: true
  },
  channelName: {
    type: String,
    required: true,
    index: true
  },
  channelId: {
    type: String,
    index: true
  },
  channelUrl: {
    type: String
  },
  videoDuration: {
    type: Number, // in seconds
    min: 0
  },
  videoViews: {
    type: Number,
    min: 0
  },
  uploadDate: {
    type: Date
  },
  categories: [{
    type: String
  }],
  watchedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  summaryGenerated: {
    type: Number,
    default: 0,
    min: 0
  },
  summaryTypes: [{
    type: String,
    enum: ['insightful', 'funny', 'actionable', 'controversial']
  }],
  chatUsed: {
    type: Boolean,
    default: false
  },
  chatQuestions: {
    type: Number,
    default: 0,
    min: 0
  },
  transcriptViewed: {
    type: Boolean,
    default: false
  },
  exported: {
    type: Boolean,
    default: false
  },
  exportFormats: [{
    type: String,
    enum: ['txt', 'pdf', 'markdown', 'json']
  }],
  timeSpent: {
    type: Number, // in seconds
    default: 0,
    min: 0
  },
  deviceInfo: {
    userAgent: String,
    browser: String,
    os: String,
    screenResolution: String
  },
  sessionStartTime: {
    type: Date,
    default: Date.now
  },
  lastInteractionAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
videoAnalyticsSchema.index({ user: 1, videoId: 1 }, { unique: true });
videoAnalyticsSchema.index({ user: 1, watchedAt: -1 });
videoAnalyticsSchema.index({ channelName: 1, watchedAt: -1 });
videoAnalyticsSchema.index({ watchedAt: -1 });
videoAnalyticsSchema.index({ summaryGenerated: 1, watchedAt: -1 });

// Virtual for watch duration in minutes
videoAnalyticsSchema.virtual('timeSpentMinutes').get(function() {
  return Math.round(this.timeSpent / 60);
});

// Virtual for engagement score (0-100)
videoAnalyticsSchema.virtual('engagementScore').get(function() {
  let score = 0;
  
  // Base score for watching
  score += 20;
  
  // Summary generation
  if (this.summaryGenerated > 0) score += 30;
  
  // Chat usage
  if (this.chatUsed) score += 25;
  
  // Transcript viewing
  if (this.transcriptViewed) score += 10;
  
  // Export action
  if (this.exported) score += 15;
  
  return Math.min(score, 100);
});

// Method to update interaction data
videoAnalyticsSchema.methods.updateInteraction = async function(action, data = {}) {
  this.lastInteractionAt = new Date();
  
  switch (action) {
    case 'summary_generated':
      this.summaryGenerated += 1;
      if (data.type && ['insightful', 'funny', 'actionable', 'controversial'].includes(data.type)) {
        if (!this.summaryTypes.includes(data.type)) {
          this.summaryTypes.push(data.type);
        }
      }
      break;
      
    case 'chat_used':
      this.chatUsed = true;
      this.chatQuestions += 1;
      break;
      
    case 'transcript_viewed':
      this.transcriptViewed = true;
      break;
      
    case 'exported':
      this.exported = true;
      if (data.format && ['txt', 'pdf', 'markdown', 'json'].includes(data.format)) {
        if (!this.exportFormats.includes(data.format)) {
          this.exportFormats.push(data.format);
        }
      }
      break;
      
    case 'time_spent':
      if (data.seconds && typeof data.seconds === 'number') {
        this.timeSpent += data.seconds;
      }
      break;
      
    default:
      console.warn(`Unknown interaction action: ${action}`);
  }
  
  await this.save();
};

// Static method to get user's viewing statistics
videoAnalyticsSchema.statics.getUserStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        watchedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalSummaries: { $sum: '$summaryGenerated' },
        totalChatQueries: { $sum: '$chatQuestions' },
        totalTimeSpent: { $sum: '$timeSpent' },
        avgEngagement: { $avg: '$engagementScore' },
        uniqueChannels: { $addToSet: '$channelName' },
        exportCount: { $sum: { $cond: ['$exported', 1, 0] } },
        transcriptViews: { $sum: { $cond: ['$transcriptViewed', 1, 0] } }
      }
    }
  ]);
};

// Static method to get channel popularity
videoAnalyticsSchema.statics.getChannelPopularity = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    {
      $match: {
        watchedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$channelName',
        videoCount: { $sum: 1 },
        summaryCount: { $sum: '$summaryGenerated' },
        chatCount: { $sum: '$chatQuestions' },
        uniqueUsers: { $addToSet: '$user' },
        totalTimeSpent: { $sum: '$timeSpent' },
        avgEngagement: { $avg: '$engagementScore' }
      }
    },
    {
      $project: {
        channelName: '$_id',
        videoCount: 1,
        summaryCount: 1,
        chatCount: 1,
        uniqueUserCount: { $size: '$uniqueUsers' },
        totalTimeSpent: 1,
        avgEngagement: { $round: ['$avgEngagement', 1] },
        popularityScore: {
          $add: [
            { $multiply: ['$videoCount', 1] },
            { $multiply: ['$summaryCount', 2] },
            { $multiply: ['$chatCount', 1.5] },
            { $multiply: [{ $size: '$uniqueUsers' }, 3] }
          ]
        }
      }
    },
    {
      $sort: { popularityScore: -1 }
    }
  ]);
};

// Static method to get trending videos
videoAnalyticsSchema.statics.getTrendingVideos = async function(days = 7, limit = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    {
      $match: {
        watchedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          videoId: '$videoId',
          videoTitle: '$videoTitle',
          channelName: '$channelName'
        },
        views: { $sum: 1 },
        summaries: { $sum: '$summaryGenerated' },
        chats: { $sum: '$chatQuestions' },
        uniqueUsers: { $addToSet: '$user' },
        avgEngagement: { $avg: '$engagementScore' },
        totalTimeSpent: { $sum: '$timeSpent' }
      }
    },
    {
      $project: {
        videoId: '$_id.videoId',
        videoTitle: '$_id.videoTitle',
        channelName: '$_id.channelName',
        views: 1,
        summaries: 1,
        chats: 1,
        uniqueUserCount: { $size: '$uniqueUsers' },
        avgEngagement: { $round: ['$avgEngagement', 1] },
        totalTimeSpent: 1,
        trendingScore: {
          $add: [
            { $multiply: ['$views', 2] },
            { $multiply: ['$summaries', 3] },
            { $multiply: ['$chats', 2] },
            { $multiply: [{ $size: '$uniqueUsers' }, 4] }
          ]
        }
      }
    },
    {
      $sort: { trendingScore: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Static method to get user activity timeline
videoAnalyticsSchema.statics.getUserTimeline = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.find({
    user: userId,
    watchedAt: { $gte: startDate }
  })
  .select('videoTitle channelName watchedAt summaryGenerated chatQuestions timeSpent engagementScore')
  .sort({ watchedAt: -1 })
  .limit(50);
};

// Pre-save middleware
videoAnalyticsSchema.pre('save', function(next) {
  // Update last interaction time
  this.lastInteractionAt = new Date();
  
  // Validate time spent (max 24 hours per session)
  if (this.timeSpent > 24 * 60 * 60) {
    this.timeSpent = 24 * 60 * 60;
  }
  
  next();
});

// Post-save middleware for logging
videoAnalyticsSchema.post('save', function(doc) {
  if (this.isNew) {
    console.log(`📊 Video analytics tracked: ${doc.videoTitle} by user ${doc.user}`);
  }
});

module.exports = mongoose.model('VideoAnalytics', videoAnalyticsSchema);
