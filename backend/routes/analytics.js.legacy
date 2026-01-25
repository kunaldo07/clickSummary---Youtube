const express = require('express');
const { auth } = require('../middleware/auth');
const { getMonthlyCostSummary, getSystemCostAnalytics } = require('../middleware/costTracking');

// Try to use MongoDB User model, fall back to DevUser if MongoDB is not available
let User;
try {
  User = require('../models/User');
} catch (error) {
  console.log('📝 Analytics routes: Using in-memory DevUser for development');
  User = require('../models/DevUser');
}

const VideoAnalytics = require('../models/VideoAnalytics');
const ChannelAnalytics = require('../models/ChannelAnalytics');

const router = express.Router();

// Track video view
router.post('/track-video', auth, async (req, res) => {
  try {
    const {
      videoId,
      videoUrl,
      videoTitle,
      channelName,
      channelId,
      channelUrl,
      videoDuration,
      videoViews,
      uploadDate,
      categories
    } = req.body;

    const userId = req.userId;

    // Create or update video analytics record
    let videoAnalytics = await VideoAnalytics.findOne({ 
      user: userId, 
      videoId: videoId 
    });

    if (videoAnalytics) {
      // Update existing record
      videoAnalytics.watchedAt = new Date();
      videoAnalytics.videoTitle = videoTitle || videoAnalytics.videoTitle;
      videoAnalytics.channelName = channelName || videoAnalytics.channelName;
      videoAnalytics.videoDuration = videoDuration || videoAnalytics.videoDuration;
      videoAnalytics.videoViews = videoViews || videoAnalytics.videoViews;
    } else {
      // Create new record
      videoAnalytics = new VideoAnalytics({
        user: userId,
        videoId,
        videoUrl,
        videoTitle,
        channelName,
        channelId,
        channelUrl,
        videoDuration,
        videoViews,
        uploadDate: uploadDate ? new Date(uploadDate) : null,
        categories: categories || [],
        watchedAt: new Date()
      });
    }

    await videoAnalytics.save();

    // Update channel analytics
    if (channelName) {
      await updateChannelAnalytics(channelName, channelId, channelUrl, categories);
    }

    res.json({ success: true, message: 'Video view tracked' });
  } catch (error) {
    console.error('Track video error:', error);
    res.status(500).json({ error: 'Failed to track video view' });
  }
});

// Track user interaction (summary, chat, etc.)
router.post('/track-interaction', auth, async (req, res) => {
  try {
    const { videoId, action, data } = req.body;
    const userId = req.userId;

    if (!videoId || !action) {
      return res.status(400).json({ error: 'videoId and action are required' });
    }

    // Find the video analytics record
    const videoAnalytics = await VideoAnalytics.findOne({ 
      user: userId, 
      videoId: videoId 
    });

    if (!videoAnalytics) {
      return res.status(404).json({ error: 'Video not found in analytics' });
    }

    // Update interaction based on action type
    await videoAnalytics.updateInteraction(action, data);

    res.json({ success: true, message: 'Interaction tracked' });
  } catch (error) {
    console.error('Track interaction error:', error);
    res.status(500).json({ error: 'Failed to track interaction' });
  }
});

// Get user dashboard analytics
router.get('/user-dashboard', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get user's video analytics
    const videoStats = await VideoAnalytics.aggregate([
      {
        $match: {
          user: userId,
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
          uniqueChannels: { $addToSet: '$channelName' }
        }
      }
    ]);

    // Get top channels
    const topChannels = await VideoAnalytics.aggregate([
      {
        $match: {
          user: userId,
          watchedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$channelName',
          count: { $sum: 1 },
          summaries: { $sum: '$summaryGenerated' },
          chatQueries: { $sum: '$chatQuestions' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Get summary type breakdown
    const summaryTypes = await VideoAnalytics.aggregate([
      {
        $match: {
          user: userId,
          watchedAt: { $gte: startDate },
          summaryTypes: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: '$summaryTypes'
      },
      {
        $group: {
          _id: '$summaryTypes',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get recent activity
    const recentActivity = await VideoAnalytics.find({
      user: userId,
      watchedAt: { $gte: startDate }
    })
    .select('videoTitle channelName watchedAt summaryGenerated chatQuestions timeSpent')
    .sort({ watchedAt: -1 })
    .limit(10);

    // Get cost information
    const costSummary = await getMonthlyCostSummary(userId);

    const stats = videoStats[0] || {
      totalVideos: 0,
      totalSummaries: 0,
      totalChatQueries: 0,
      totalTimeSpent: 0,
      uniqueChannels: []
    };

    res.json({
      overview: {
        totalVideos: stats.totalVideos,
        totalSummaries: stats.totalSummaries,
        totalChatQueries: stats.totalChatQueries,
        totalTimeSpent: Math.round(stats.totalTimeSpent / 60), // Convert to minutes
        uniqueChannels: stats.uniqueChannels.length
      },
      topChannels: topChannels.map(channel => ({
        name: channel._id,
        videosWatched: channel.count,
        summariesGenerated: channel.summaries,
        chatQueries: channel.chatQueries
      })),
      summaryTypes: summaryTypes.map(type => ({
        type: type._id,
        count: type.count
      })),
      recentActivity: recentActivity.map(activity => ({
        videoTitle: activity.videoTitle,
        channelName: activity.channelName,
        watchedAt: activity.watchedAt,
        summaryGenerated: activity.summaryGenerated > 0,
        chatQueries: activity.chatQuestions,
        timeSpent: Math.round(activity.timeSpent / 60) // Convert to minutes
      })),
      costs: costSummary,
      period: `${days} days`
    });

  } catch (error) {
    console.error('User dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

// Get admin dashboard analytics (admin only)
router.get('/admin-dashboard', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get system-wide statistics
    const systemStats = await VideoAnalytics.aggregate([
      {
        $match: {
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
          uniqueUsers: { $addToSet: '$user' },
          uniqueChannels: { $addToSet: '$channelName' }
        }
      }
    ]);

    // Get user activity
    const userActivity = await User.aggregate([
      {
        $match: {
          lastActiveAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$lastActiveAt' }
          },
          activeUsers: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Get top channels
    const topChannels = await VideoAnalytics.aggregate([
      {
        $match: {
          watchedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$channelName',
          views: { $sum: 1 },
          summaries: { $sum: '$summaryGenerated' },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $sort: { views: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get cost analytics
    const costAnalytics = await getSystemCostAnalytics();

    const stats = systemStats[0] || {
      totalVideos: 0,
      totalSummaries: 0,
      totalChatQueries: 0,
      totalTimeSpent: 0,
      uniqueUsers: [],
      uniqueChannels: []
    };

    res.json({
      overview: {
        totalVideos: stats.totalVideos,
        totalSummaries: stats.totalSummaries,
        totalChatQueries: stats.totalChatQueries,
        totalTimeSpent: Math.round(stats.totalTimeSpent / 3600), // Convert to hours
        activeUsers: stats.uniqueUsers.length,
        uniqueChannels: stats.uniqueChannels.length
      },
      userActivity: userActivity.map(day => ({
        date: day._id,
        activeUsers: day.activeUsers
      })),
      topChannels: topChannels.map(channel => ({
        name: channel._id,
        views: channel.views,
        summaries: channel.summaries,
        uniqueUsers: channel.uniqueUsers.length
      })),
      costs: costAnalytics,
      period: `${days} days`
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch admin analytics' });
  }
});

// Get public statistics (no auth required)
router.get('/public-stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVideos = await VideoAnalytics.countDocuments();
    
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const recentActivity = await VideoAnalytics.aggregate([
      {
        $match: {
          watchedAt: { $gte: last30Days }
        }
      },
      {
        $group: {
          _id: null,
          summariesGenerated: { $sum: '$summaryGenerated' },
          chatQueries: { $sum: '$chatQuestions' },
          hoursWatched: { $sum: { $divide: ['$timeSpent', 3600] } }
        }
      }
    ]);

    const stats = recentActivity[0] || {
      summariesGenerated: 0,
      chatQueries: 0,
      hoursWatched: 0
    };

    res.json({
      totalUsers: totalUsers,
      totalVideosAnalyzed: totalVideos,
      last30Days: {
        summariesGenerated: stats.summariesGenerated,
        chatQueries: stats.chatQueries,
        hoursWatched: Math.round(stats.hoursWatched)
      }
    });

  } catch (error) {
    console.error('Public stats error:', error);
    res.status(500).json({ error: 'Failed to fetch public statistics' });
  }
});

// Helper function to update channel analytics
async function updateChannelAnalytics(channelName, channelId, channelUrl, categories) {
  try {
    let channelAnalytics = await ChannelAnalytics.findOne({ channelName });

    if (channelAnalytics) {
      await channelAnalytics.updateStats();
    } else {
      channelAnalytics = new ChannelAnalytics({
        channelName,
        channelId,
        channelUrl,
        categories: categories || [],
        totalVideosWatched: 1,
        totalSummariesGenerated: 0,
        totalChatInteractions: 0,
        uniqueUsers: [],
        popularVideos: [],
        lastUpdated: new Date()
      });
      await channelAnalytics.save();
    }
  } catch (error) {
    console.error('Update channel analytics error:', error);
    // Don't throw error as this is not critical
  }
}

module.exports = router;
