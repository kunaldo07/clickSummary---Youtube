const mongoose = require('mongoose');

const channelAnalyticsSchema = new mongoose.Schema({
  channelName: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  channelId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  channelUrl: {
    type: String
  },
  subscriberCount: {
    type: Number,
    min: 0
  },
  totalVideosWatched: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSummariesGenerated: {
    type: Number,
    default: 0,
    min: 0
  },
  totalChatInteractions: {
    type: Number,
    default: 0,
    min: 0
  },
  uniqueUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    firstWatchedAt: {
      type: Date,
      default: Date.now
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now
    },
    videosWatched: {
      type: Number,
      default: 1
    },
    summariesGenerated: {
      type: Number,
      default: 0
    }
  }],
  popularVideos: [{
    videoId: String,
    videoTitle: String,
    videoUrl: String,
    watchCount: {
      type: Number,
      default: 1
    },
    summaryCount: {
      type: Number,
      default: 0
    },
    chatCount: {
      type: Number,
      default: 0
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now
    }
  }],
  primaryCategory: {
    type: String
  },
  categories: [{
    type: String
  }],
  averageVideoDuration: {
    type: Number, // in seconds
    min: 0
  },
  totalWatchTime: {
    type: Number, // in seconds
    default: 0,
    min: 0
  },
  engagementMetrics: {
    averageEngagementScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    summaryRate: {
      type: Number, // percentage of videos that get summarized
      min: 0,
      max: 100,
      default: 0
    },
    chatRate: {
      type: Number, // percentage of videos that get chat interactions
      min: 0,
      max: 100,
      default: 0
    },
    exportRate: {
      type: Number, // percentage of summaries that get exported
      min: 0,
      max: 100,
      default: 0
    }
  },
  monthlyStats: [{
    year: Number,
    month: Number,
    videosWatched: {
      type: Number,
      default: 0
    },
    summariesGenerated: {
      type: Number,
      default: 0
    },
    chatInteractions: {
      type: Number,
      default: 0
    },
    uniqueUsers: {
      type: Number,
      default: 0
    },
    totalWatchTime: {
      type: Number,
      default: 0
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
channelAnalyticsSchema.index({ totalVideosWatched: -1 });
channelAnalyticsSchema.index({ totalSummariesGenerated: -1 });
channelAnalyticsSchema.index({ 'engagementMetrics.averageEngagementScore': -1 });
channelAnalyticsSchema.index({ lastUpdated: -1 });
channelAnalyticsSchema.index({ primaryCategory: 1 });

// Virtual for popularity score
channelAnalyticsSchema.virtual('popularityScore').get(function() {
  const videoWeight = 1;
  const summaryWeight = 2;
  const chatWeight = 1.5;
  const userWeight = 3;
  const engagementWeight = 0.5;
  
  return (
    (this.totalVideosWatched * videoWeight) +
    (this.totalSummariesGenerated * summaryWeight) +
    (this.totalChatInteractions * chatWeight) +
    (this.uniqueUsers.length * userWeight) +
    (this.engagementMetrics.averageEngagementScore * engagementWeight)
  );
});

// Virtual for unique user count
channelAnalyticsSchema.virtual('uniqueUserCount').get(function() {
  return this.uniqueUsers.length;
});

// Method to update channel statistics
channelAnalyticsSchema.methods.updateStats = async function() {
  const VideoAnalytics = require('./VideoAnalytics');
  
  try {
    // Get aggregated data from VideoAnalytics
    const stats = await VideoAnalytics.aggregate([
      {
        $match: {
          channelName: this.channelName
        }
      },
      {
        $group: {
          _id: null,
          totalVideos: { $sum: 1 },
          totalSummaries: { $sum: '$summaryGenerated' },
          totalChats: { $sum: '$chatQuestions' },
          totalWatchTime: { $sum: '$timeSpent' },
          avgEngagement: { $avg: '$engagementScore' },
          uniqueUsers: { $addToSet: '$user' },
          categories: { $addToSet: '$categories' },
          avgDuration: { $avg: '$videoDuration' }
        }
      }
    ]);

    if (stats.length > 0) {
      const stat = stats[0];
      
      // Update basic stats
      this.totalVideosWatched = stat.totalVideos;
      this.totalSummariesGenerated = stat.totalSummaries;
      this.totalChatInteractions = stat.totalChats;
      this.totalWatchTime = stat.totalWatchTime;
      this.averageVideoDuration = stat.avgDuration;
      
      // Update engagement metrics
      this.engagementMetrics.averageEngagementScore = Math.round(stat.avgEngagement || 0);
      this.engagementMetrics.summaryRate = stat.totalVideos > 0 
        ? Math.round((stat.totalSummaries / stat.totalVideos) * 100) 
        : 0;
      this.engagementMetrics.chatRate = stat.totalVideos > 0 
        ? Math.round(((stat.totalChats > 0 ? 1 : 0) / stat.totalVideos) * 100) 
        : 0;
      
      // Update categories
      const flatCategories = stat.categories.flat().filter(Boolean);
      this.categories = [...new Set(flatCategories)];
      this.primaryCategory = this.categories[0] || 'General';
      
      // Update unique users
      await this.updateUniqueUsers(stat.uniqueUsers);
    }
    
    // Update popular videos
    await this.updatePopularVideos();
    
    // Update monthly stats
    await this.updateMonthlyStats();
    
    this.lastUpdated = new Date();
    await this.save();
    
  } catch (error) {
    console.error('Error updating channel stats:', error);
    throw error;
  }
};

// Method to update unique users list
channelAnalyticsSchema.methods.updateUniqueUsers = async function(userIds) {
  const VideoAnalytics = require('./VideoAnalytics');
  
  try {
    for (const userId of userIds) {
      // Check if user already exists
      const existingUserIndex = this.uniqueUsers.findIndex(u => u.user.toString() === userId.toString());
      
      // Get user's stats for this channel
      const userStats = await VideoAnalytics.aggregate([
        {
          $match: {
            channelName: this.channelName,
            user: userId
          }
        },
        {
          $group: {
            _id: null,
            videosWatched: { $sum: 1 },
            summariesGenerated: { $sum: '$summaryGenerated' },
            firstWatched: { $min: '$watchedAt' },
            lastWatched: { $max: '$watchedAt' }
          }
        }
      ]);
      
      if (userStats.length > 0) {
        const stats = userStats[0];
        
        if (existingUserIndex >= 0) {
          // Update existing user
          this.uniqueUsers[existingUserIndex].videosWatched = stats.videosWatched;
          this.uniqueUsers[existingUserIndex].summariesGenerated = stats.summariesGenerated;
          this.uniqueUsers[existingUserIndex].lastWatchedAt = stats.lastWatched;
        } else {
          // Add new user
          this.uniqueUsers.push({
            user: userId,
            firstWatchedAt: stats.firstWatched,
            lastWatchedAt: stats.lastWatched,
            videosWatched: stats.videosWatched,
            summariesGenerated: stats.summariesGenerated
          });
        }
      }
    }
  } catch (error) {
    console.error('Error updating unique users:', error);
  }
};

// Method to update popular videos
channelAnalyticsSchema.methods.updatePopularVideos = async function() {
  const VideoAnalytics = require('./VideoAnalytics');
  
  try {
    const popularVideos = await VideoAnalytics.aggregate([
      {
        $match: {
          channelName: this.channelName
        }
      },
      {
        $group: {
          _id: {
            videoId: '$videoId',
            videoTitle: '$videoTitle',
            videoUrl: '$videoUrl'
          },
          watchCount: { $sum: 1 },
          summaryCount: { $sum: '$summaryGenerated' },
          chatCount: { $sum: '$chatQuestions' },
          lastWatchedAt: { $max: '$watchedAt' }
        }
      },
      {
        $sort: { watchCount: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    this.popularVideos = popularVideos.map(video => ({
      videoId: video._id.videoId,
      videoTitle: video._id.videoTitle,
      videoUrl: video._id.videoUrl,
      watchCount: video.watchCount,
      summaryCount: video.summaryCount,
      chatCount: video.chatCount,
      lastWatchedAt: video.lastWatchedAt
    }));
    
  } catch (error) {
    console.error('Error updating popular videos:', error);
  }
};

// Method to update monthly statistics
channelAnalyticsSchema.methods.updateMonthlyStats = async function() {
  const VideoAnalytics = require('./VideoAnalytics');
  
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Get current month stats
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 1);
    
    const monthlyStats = await VideoAnalytics.aggregate([
      {
        $match: {
          channelName: this.channelName,
          watchedAt: { $gte: monthStart, $lt: monthEnd }
        }
      },
      {
        $group: {
          _id: null,
          videosWatched: { $sum: 1 },
          summariesGenerated: { $sum: '$summaryGenerated' },
          chatInteractions: { $sum: '$chatQuestions' },
          uniqueUsers: { $addToSet: '$user' },
          totalWatchTime: { $sum: '$timeSpent' }
        }
      }
    ]);
    
    if (monthlyStats.length > 0) {
      const stats = monthlyStats[0];
      
      // Find or create current month entry
      const existingMonthIndex = this.monthlyStats.findIndex(
        m => m.year === currentYear && m.month === currentMonth
      );
      
      const monthData = {
        year: currentYear,
        month: currentMonth,
        videosWatched: stats.videosWatched,
        summariesGenerated: stats.summariesGenerated,
        chatInteractions: stats.chatInteractions,
        uniqueUsers: stats.uniqueUsers.length,
        totalWatchTime: stats.totalWatchTime
      };
      
      if (existingMonthIndex >= 0) {
        this.monthlyStats[existingMonthIndex] = monthData;
      } else {
        this.monthlyStats.push(monthData);
      }
      
      // Keep only last 12 months
      this.monthlyStats = this.monthlyStats
        .sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))
        .slice(0, 12);
    }
    
  } catch (error) {
    console.error('Error updating monthly stats:', error);
  }
};

// Static method to get top channels
channelAnalyticsSchema.statics.getTopChannels = async function(limit = 10, sortBy = 'popularityScore') {
  const sortOptions = {
    popularityScore: { totalVideosWatched: -1, totalSummariesGenerated: -1 },
    videosWatched: { totalVideosWatched: -1 },
    summariesGenerated: { totalSummariesGenerated: -1 },
    engagement: { 'engagementMetrics.averageEngagementScore': -1 },
    users: { uniqueUserCount: -1 }
  };
  
  return await this.find({})
    .sort(sortOptions[sortBy] || sortOptions.popularityScore)
    .limit(limit)
    .select('channelName totalVideosWatched totalSummariesGenerated engagementMetrics uniqueUsers popularityScore');
};

// Static method to get channels by category
channelAnalyticsSchema.statics.getChannelsByCategory = async function(category) {
  return await this.find({
    $or: [
      { primaryCategory: category },
      { categories: category }
    ]
  })
  .sort({ totalVideosWatched: -1 })
  .select('channelName totalVideosWatched totalSummariesGenerated engagementMetrics');
};

// Static method to get channel growth trends
channelAnalyticsSchema.statics.getGrowthTrends = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await this.aggregate([
    {
      $match: {
        lastUpdated: { $gte: startDate }
      }
    },
    {
      $project: {
        channelName: 1,
        currentMonth: { $arrayElemAt: ['$monthlyStats', 0] },
        previousMonth: { $arrayElemAt: ['$monthlyStats', 1] }
      }
    },
    {
      $project: {
        channelName: 1,
        growth: {
          videosGrowth: {
            $cond: [
              { $gt: ['$previousMonth.videosWatched', 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ['$currentMonth.videosWatched', '$previousMonth.videosWatched'] },
                      '$previousMonth.videosWatched'
                    ]
                  },
                  100
                ]
              },
              0
            ]
          },
          summariesGrowth: {
            $cond: [
              { $gt: ['$previousMonth.summariesGenerated', 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ['$currentMonth.summariesGenerated', '$previousMonth.summariesGenerated'] },
                      '$previousMonth.summariesGenerated'
                    ]
                  },
                  100
                ]
              },
              0
            ]
          }
        }
      }
    },
    {
      $sort: { 'growth.videosGrowth': -1 }
    }
  ]);
};

// Pre-save middleware
channelAnalyticsSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('ChannelAnalytics', channelAnalyticsSchema);
