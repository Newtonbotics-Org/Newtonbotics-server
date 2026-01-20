const express = require('express');
const { query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler, validationErrorHandler } = require('../middleware/errorHandler');

// Import models
const User = require('../models/User');
const Project = require('../models/Project');
const ProjectRequest = require('../models/ProjectRequest');
const Workshop = require('../models/Workshop');
const Event = require('../models/Event');
const News = require('../models/News');
const Equipment = require('../models/Equipment');
const ContactSubmission = require('../models/ContactSubmission');
const NewsletterSubscription = require('../models/NewsletterSubscription');
const Notification = require('../models/Notification');
const NotificationSettings = require('../models/NotificationSettings');

// @route   GET /api/admin/dashboard/summary
// @desc    Get admin dashboard summary data
// @access  Private (Admin)
router.get('/summary', verifyToken, requireAdmin, [
  query('period').optional().isIn(['7d', '30d', '90d', '1y', 'all']),
  query('includeCharts').optional().isBoolean().toBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw validationErrorHandler(errors);
  
  const { period = '30d', includeCharts = true } = req.query;
  
  // Calculate date range
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'all':
      startDate = new Date('2020-01-01'); // Very old date
      break;
  }
  
  try {
    // Get basic statistics
    const [
      userStats,
      projectStats,
      projectRequestStats,
      workshopStats,
      eventStats,
      newsStats,
      equipmentStats,
      contactStats,
      newsletterStats,
      notificationStats
    ] = await Promise.all([
      getUserStatistics(startDate, now),
      getProjectStatistics(startDate, now),
      getProjectRequestStatistics(startDate, now),
      getWorkshopStatistics(startDate, now),
      getEventStatistics(startDate, now),
      getNewsStatistics(startDate, now),
      getEquipmentStatistics(startDate, now),
      getContactStatistics(startDate, now),
      getNewsletterStatistics(startDate, now),
      getNotificationStatistics(startDate, now, req.user.id)
    ]);
    
    const summary = {
      period,
      dateRange: { start: startDate, end: now },
      overview: {
        totalUsers: userStats.total,
        activeUsers: userStats.active,
        totalProjects: projectStats.total,
        activeProjects: projectStats.active,
        totalWorkshops: workshopStats.total,
        upcomingEvents: eventStats.upcoming,
        totalNews: newsStats.total,
        totalEquipment: equipmentStats.total,
        pendingRequests: projectRequestStats.pending,
        contactSubmissions: contactStats.total,
        newsletterSubscribers: newsletterStats.total,
        unreadNotifications: notificationStats.unread
      },
      recentActivity: {
        newUsers: userStats.recent,
        newProjects: projectStats.recent,
        newRequests: projectRequestStats.recent,
        newWorkshops: workshopStats.recent,
        newEvents: eventStats.recent,
        newNews: newsStats.recent,
        newContacts: contactStats.recent
      },
      statusBreakdown: {
        projects: projectStats.statusBreakdown,
        requests: projectRequestStats.statusBreakdown,
        workshops: workshopStats.statusBreakdown,
        events: eventStats.statusBreakdown,
        equipment: equipmentStats.statusBreakdown
      }
    };
    
    // Add chart data if requested
    if (includeCharts) {
      summary.charts = {
        userGrowth: await getUserGrowthChart(startDate, now),
        projectActivity: await getProjectActivityChart(startDate, now),
        requestTrends: await getRequestTrendsChart(startDate, now),
        equipmentUtilization: await getEquipmentUtilizationChart(),
        notificationTrends: await getNotificationTrendsChart(startDate, now)
      };
    }
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary',
      error: error.message
    });
  }
}));

// @route   GET /api/admin/dashboard/notifications
// @desc    Get admin notifications
// @access  Private (Admin)
router.get('/notifications', verifyToken, requireAdmin, [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('skip').optional().isInt({ min: 0 }).toInt(),
  query('type').optional().isString(),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('read').optional().isBoolean().toBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw validationErrorHandler(errors);
  
  const { limit = 20, skip = 0, type, priority, read } = req.query;
  
  const options = { limit, skip, type, priority, read };
  // Ensure userId is converted to ObjectId if it's a string
  const userId = typeof req.user.id === 'string' ? new mongoose.Types.ObjectId(req.user.id) : req.user.id;
  const notifications = await Notification.getUserNotifications(userId, options);
  const stats = await Notification.getNotificationStats(userId);
  
  res.json({
    success: true,
    data: {
      notifications,
      stats,
      pagination: {
        limit,
        skip,
        hasMore: notifications.length === limit
      }
    }
  });
}));

// @route   PUT /api/admin/dashboard/notifications/:id/read
// @desc    Mark notification as read
// @access  Private (Admin)
router.put('/notifications/:id/read', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }
  
  if (notification.userId.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  await notification.markAsRead();
  
  res.json({
    success: true,
    message: 'Notification marked as read',
    data: { notification }
  });
}));

// @route   PUT /api/admin/dashboard/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private (Admin)
router.put('/notifications/read-all', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  // Ensure userId is converted to ObjectId if it's a string
  const userId = typeof req.user.id === 'string' ? new mongoose.Types.ObjectId(req.user.id) : req.user.id;
  const result = await Notification.updateMany(
    { userId, read: false },
    { read: true, readAt: new Date() }
  );
  
  res.json({
    success: true,
    message: `${result.modifiedCount} notifications marked as read`,
    data: { modifiedCount: result.modifiedCount }
  });
}));

// @route   GET /api/admin/dashboard/settings
// @desc    Get admin notification settings
// @access  Private (Admin)
router.get('/settings', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  // Ensure userId is converted to ObjectId if it's a string
  const userId = typeof req.user.id === 'string' ? new mongoose.Types.ObjectId(req.user.id) : req.user.id;
  const settings = await NotificationSettings.getOrCreateSettings(userId);
  
  res.json({
    success: true,
    data: { settings }
  });
}));

// @route   PUT /api/admin/dashboard/settings
// @desc    Update admin notification settings
// @access  Private (Admin)
router.put('/settings', verifyToken, requireAdmin, asyncHandler(async (req, res) => {
  // Ensure userId is converted to ObjectId if it's a string
  const userId = typeof req.user.id === 'string' ? new mongoose.Types.ObjectId(req.user.id) : req.user.id;
  const settings = await NotificationSettings.getOrCreateSettings(userId);
  
  await settings.updateSettings(req.body);
  
  res.json({
    success: true,
    message: 'Notification settings updated',
    data: { settings }
  });
}));

// Helper functions for statistics
async function getUserStatistics(startDate, endDate) {
  const [total, active, recent] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } })
  ]);
  
  return { total, active, recent };
}

async function getProjectStatistics(startDate, endDate) {
  const [total, active, recent, statusBreakdown] = await Promise.all([
    Project.countDocuments(),
    Project.countDocuments({ status: { $in: ['active', 'in_progress'] } }),
    Project.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
    Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);
  
  return { total, active, recent, statusBreakdown };
}

async function getProjectRequestStatistics(startDate, endDate) {
  const [total, pending, recent, statusBreakdown] = await Promise.all([
    ProjectRequest.countDocuments({ isDeleted: { $ne: true } }),
    ProjectRequest.countDocuments({ status: 'pending', isDeleted: { $ne: true } }),
    ProjectRequest.countDocuments({ 
      createdAt: { $gte: startDate, $lte: endDate },
      isDeleted: { $ne: true }
    }),
    ProjectRequest.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);
  
  return { total, pending, recent, statusBreakdown };
}

async function getWorkshopStatistics(startDate, endDate) {
  const [total, recent, statusBreakdown] = await Promise.all([
    Workshop.countDocuments(),
    Workshop.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
    Workshop.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);
  
  return { total, recent, statusBreakdown };
}

async function getEventStatistics(startDate, endDate) {
  const [total, upcoming, recent, statusBreakdown] = await Promise.all([
    Event.countDocuments(),
    Event.countDocuments({ startDate: { $gte: new Date() } }),
    Event.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
    Event.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);
  
  return { total, upcoming, recent, statusBreakdown };
}

async function getNewsStatistics(startDate, endDate) {
  const [total, recent] = await Promise.all([
    News.countDocuments(),
    News.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } })
  ]);
  
  return { total, recent };
}

async function getEquipmentStatistics(startDate, endDate) {
  const [total, statusBreakdown] = await Promise.all([
    Equipment.countDocuments(),
    Equipment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);
  
  return { total, statusBreakdown };
}

async function getContactStatistics(startDate, endDate) {
  const [total, recent] = await Promise.all([
    ContactSubmission.countDocuments(),
    ContactSubmission.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } })
  ]);
  
  return { total, recent };
}

async function getNewsletterStatistics(startDate, endDate) {
  const [total, recent] = await Promise.all([
    NewsletterSubscription.countDocuments(),
    NewsletterSubscription.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } })
  ]);
  
  return { total, recent };
}

async function getNotificationStatistics(startDate, endDate, userId) {
  const [total, unread] = await Promise.all([
    Notification.countDocuments({ userId }),
    Notification.countDocuments({ userId, read: false })
  ]);
  
  return { total, unread };
}

// Chart data functions
async function getUserGrowthChart(startDate, endDate) {
  return await User.aggregate([
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
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
}

async function getProjectActivityChart(startDate, endDate) {
  return await Project.aggregate([
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
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
}

async function getRequestTrendsChart(startDate, endDate) {
  return await ProjectRequest.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        isDeleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
}

async function getEquipmentUtilizationChart() {
  return await Equipment.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        available: { $sum: { $cond: ['$isAvailable', 1, 0] } }
      }
    }
  ]);
}

async function getNotificationTrendsChart(startDate, endDate) {
  return await Notification.aggregate([
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
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
}

module.exports = router;
