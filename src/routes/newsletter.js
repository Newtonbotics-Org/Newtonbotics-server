const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const NewsletterSubscription = require('../models/NewsletterSubscription');
const NewsletterCampaign = require('../models/NewsletterCampaign');
const { asyncHandler, validationErrorHandler, notFoundErrorHandler } = require('../middleware/errorHandler');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { sendNewsletterCampaign, sendTestNewsletter } = require('../services/emailService');
const logger = require('../utils/logger');

// POST /api/newsletter/subscribe
router.post(
  '/subscribe',
  [
    body('email').isEmail().normalizeEmail().isLength({ max: 255 }),
    body('firstName').optional().isString().isLength({ max: 100 }),
    body('lastName').optional().isString().isLength({ max: 100 }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const { email, firstName, lastName } = req.body;
    const existing = await NewsletterSubscription.findOne({ email });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.unsubscribedAt = undefined;
        if (firstName !== undefined) existing.firstName = firstName;
        if (lastName !== undefined) existing.lastName = lastName;
        await existing.save();
      }
      return res.json({ success: true, message: 'You are already subscribed', data: { subscription: existing } });
    }

    const sub = await NewsletterSubscription.create({ email, firstName, lastName, isActive: true });
    res.status(201).json({ success: true, message: 'Subscribed successfully', data: { subscription: sub } });
  })
);

// GET /api/newsletter/status/:email
router.get(
  '/status/:email',
  [param('email').isEmail().normalizeEmail().isLength({ max: 255 })],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    
    const { email } = req.params;
    const sub = await NewsletterSubscription.findOne({ email });
    
    if (!sub) {
      return res.json({ 
        success: true, 
        message: 'Email not found in subscription list',
        data: { 
          isSubscribed: false,
          subscription: null 
        }
      });
    }
    
    res.json({ 
      success: true, 
      message: sub.isActive ? 'Email is subscribed' : 'Email is unsubscribed',
      data: { 
        isSubscribed: sub.isActive,
        subscription: sub 
      }
    });
  })
);

// DELETE /api/newsletter/unsubscribe
router.delete(
  '/unsubscribe',
  [body('email').isEmail().normalizeEmail().isLength({ max: 255 })],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    const { email } = req.body;
    const sub = await NewsletterSubscription.findOne({ email });
    if (!sub || !sub.isActive) {
      return res.json({ success: true, message: 'Already unsubscribed' });
    }
    sub.isActive = false;
    sub.unsubscribedAt = new Date();
    await sub.save();
    res.json({ success: true, message: 'Unsubscribed successfully' });
  })
);

// ==================== ADMIN ROUTES ====================

// Apply authentication middleware to all admin routes
router.use('/admin', verifyToken, requireAdmin);

// Admin validation rules
const adminSearchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'all'])
    .withMessage('Status must be active, inactive, or all'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer'),
  
  query('sortBy')
    .optional()
    .isIn(['email', 'firstName', 'lastName', 'subscribedAt', 'unsubscribedAt', 'createdAt'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

const adminUpdateValidation = [
  body('firstName').optional().isString().isLength({ max: 100 }),
  body('lastName').optional().isString().isLength({ max: 100 }),
  body('isActive').optional().isBoolean(),
];

const bulkOperationValidation = [
  body('emails').isArray().isLength({ min: 1, max: 100 }),
  body('emails.*').isEmail().normalizeEmail(),
  body('action').isIn(['activate', 'deactivate', 'delete']),
];

// GET /api/newsletter/admin/subscriptions - List all newsletter subscriptions (Admin only)
router.get(
  '/admin/subscriptions',
  adminSearchValidation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const { 
      q, 
      status = 'all', 
      limit = 20, 
      skip = 0, 
      sortBy = 'subscribedAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build search query
    const searchQuery = {};
    
    if (q) {
      searchQuery.$or = [
        { email: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (status !== 'all') {
      searchQuery.isActive = status === 'active';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const subscriptions = await NewsletterSubscription
      .find(searchQuery)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await NewsletterSubscription.countDocuments(searchQuery);

    // Log admin search operation
    logger.info(`Newsletter subscriptions searched by admin ${req.user.id}`, {
      query: q,
      status,
      results: subscriptions.length,
      total
    });

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: total > parseInt(skip) + subscriptions.length
        }
      }
    });
  })
);

// GET /api/newsletter/admin/subscriptions/:id - Get specific subscription (Admin only)
router.get(
  '/admin/subscriptions/:id',
  [param('id').isMongoId()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const subscription = await NewsletterSubscription.findById(req.params.id);
    if (!subscription) throw notFoundErrorHandler('Newsletter subscription');

    res.json({
      success: true,
      data: { subscription }
    });
  })
);

// PUT /api/newsletter/admin/subscriptions/:id - Update subscription (Admin only)
router.put(
  '/admin/subscriptions/:id',
  [param('id').isMongoId(), ...adminUpdateValidation],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const subscription = await NewsletterSubscription.findById(req.params.id);
    if (!subscription) throw notFoundErrorHandler('Newsletter subscription');

    const { firstName, lastName, isActive } = req.body;

    // Update fields if provided
    if (firstName !== undefined) subscription.firstName = firstName;
    if (lastName !== undefined) subscription.lastName = lastName;
    if (isActive !== undefined) {
      subscription.isActive = isActive;
      if (isActive) {
        subscription.unsubscribedAt = undefined;
      } else {
        subscription.unsubscribedAt = new Date();
      }
    }

    await subscription.save();

    // Log admin update
    logger.info(`Newsletter subscription updated by admin ${req.user.id}`, {
      subscriptionId: subscription._id,
      email: subscription.email,
      changes: { firstName, lastName, isActive }
    });

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: { subscription }
    });
  })
);

// DELETE /api/newsletter/admin/subscriptions/:id - Delete subscription (Admin only)
router.delete(
  '/admin/subscriptions/:id',
  [param('id').isMongoId()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const subscription = await NewsletterSubscription.findById(req.params.id);
    if (!subscription) throw notFoundErrorHandler('Newsletter subscription');

    await NewsletterSubscription.findByIdAndDelete(req.params.id);

    // Log admin deletion
    logger.info(`Newsletter subscription deleted by admin ${req.user.id}`, {
      subscriptionId: subscription._id,
      email: subscription.email
    });

    res.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  })
);

// POST /api/newsletter/admin/bulk-operations - Bulk operations on subscriptions (Admin only)
router.post(
  '/admin/bulk-operations',
  bulkOperationValidation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const { emails, action } = req.body;
    let result;

    switch (action) {
      case 'activate':
        result = await NewsletterSubscription.updateMany(
          { email: { $in: emails } },
          { 
            $set: { isActive: true },
            $unset: { unsubscribedAt: 1 }
          }
        );
        break;
      
      case 'deactivate':
        result = await NewsletterSubscription.updateMany(
          { email: { $in: emails } },
          { 
            $set: { 
              isActive: false,
              unsubscribedAt: new Date()
            }
          }
        );
        break;
      
      case 'delete':
        result = await NewsletterSubscription.deleteMany(
          { email: { $in: emails } }
        );
        break;
    }

    // Log bulk operation
    logger.info(`Bulk newsletter operation performed by admin ${req.user.id}`, {
      action,
      emailsCount: emails.length,
      modifiedCount: result.modifiedCount || result.deletedCount
    });

    res.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      data: {
        action,
        emailsProcessed: emails.length,
        modifiedCount: result.modifiedCount || result.deletedCount
      }
    });
  })
);

// GET /api/newsletter/admin/statistics - Get newsletter statistics (Admin only)
router.get(
  '/admin/statistics',
  asyncHandler(async (req, res) => {
    const totalSubscriptions = await NewsletterSubscription.countDocuments();
    const activeSubscriptions = await NewsletterSubscription.countDocuments({ isActive: true });
    const inactiveSubscriptions = await NewsletterSubscription.countDocuments({ isActive: false });

    // Get subscription trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSubscriptions = await NewsletterSubscription.countDocuments({
      subscribedAt: { $gte: thirtyDaysAgo }
    });

    const recentUnsubscriptions = await NewsletterSubscription.countDocuments({
      unsubscribedAt: { $gte: thirtyDaysAgo }
    });

    // Get top domains
    const domainStats = await NewsletterSubscription.aggregate([
      {
        $group: {
          _id: { $arrayElemAt: [{ $split: ['$email', '@'] }, 1] },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get subscription growth by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyGrowth = await NewsletterSubscription.aggregate([
      {
        $match: {
          subscribedAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$subscribedAt' },
            month: { $month: '$subscribedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalSubscriptions,
          activeSubscriptions,
          inactiveSubscriptions,
          recentSubscriptions,
          recentUnsubscriptions
        },
        topDomains: domainStats,
        monthlyGrowth: monthlyGrowth.map(item => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
          count: item.count
        }))
      }
    });
  })
);

// POST /api/newsletter/admin/export - Export subscriptions to CSV (Admin only)
router.post(
  '/admin/export',
  [
    body('format').optional().isIn(['csv', 'json']).withMessage('Format must be csv or json'),
    body('status').optional().isIn(['active', 'inactive', 'all']).withMessage('Status must be active, inactive, or all'),
    body('fields').optional().isArray().withMessage('Fields must be an array'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const { format = 'csv', status = 'all', fields } = req.body;

    // Build query
    const query = {};
    if (status !== 'all') {
      query.isActive = status === 'active';
    }

    // Get subscriptions
    const subscriptions = await NewsletterSubscription.find(query).lean();

    // Log export operation
    logger.info(`Newsletter subscriptions exported by admin ${req.user.id}`, {
      format,
      status,
      count: subscriptions.length
    });

    if (format === 'json') {
      return res.json({
        success: true,
        data: { subscriptions }
      });
    }

    // CSV format
    const csvFields = fields || ['email', 'firstName', 'lastName', 'isActive', 'subscribedAt', 'unsubscribedAt'];
    const csvHeader = csvFields.join(',');
    
    const csvRows = subscriptions.map(sub => {
      return csvFields.map(field => {
        let value = sub[field];
        if (value instanceof Date) {
          value = value.toISOString();
        }
        if (typeof value === 'string' && value.includes(',')) {
          value = `"${value}"`;
        }
        return value || '';
      }).join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=newsletter-subscriptions.csv');
    res.send(csvContent);
  })
);

// ==================== NEWSLETTER CAMPAIGN ADMIN ROUTES ====================

// Campaign validation rules
const campaignValidation = [
  body('title').isString().isLength({ min: 1, max: 255 }).trim(),
  body('subject').isString().isLength({ min: 1, max: 255 }).trim(),
  body('content').isString().isLength({ min: 1, max: 50000 }),
  body('excerpt').optional().isString().isLength({ max: 500 }).trim(),
  body('targetAudience').optional().isIn(['all', 'active', 'inactive', 'custom']),
  body('customEmails').optional().isArray(),
  body('customEmails.*').optional().isEmail().normalizeEmail(),
  body('excludeEmails').optional().isArray(),
  body('excludeEmails.*').optional().isEmail().normalizeEmail(),
  body('template').optional().isIn(['default', 'news', 'announcement', 'event', 'custom']),
  body('tags').optional().isArray(),
  body('tags.*').optional().isString().isLength({ max: 100 }).trim(),
  body('scheduledAt').optional().custom((value) => {
    if (value === null || value === undefined || value === '') {
      return true; // Allow null, undefined, or empty string
    }
    // Check if it's a valid ISO8601 date
    const date = new Date(value);
    return !isNaN(date.getTime()) && value === date.toISOString();
  }).withMessage('scheduledAt must be a valid ISO8601 date string'),
  body('isTest').optional().isBoolean(),
  body('testEmails').optional().isArray(),
  body('testEmails.*').optional().isEmail().normalizeEmail(),
];

const campaignSearchValidation = [
  query('q').optional().isString().isLength({ min: 1, max: 100 }).trim(),
  query('status').optional().isIn(['draft', 'scheduled', 'sending', 'sent', 'cancelled', 'all']),
  query('template').optional().isIn(['default', 'news', 'announcement', 'event', 'custom']),
  query('authorId').optional().isMongoId(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('skip').optional().isInt({ min: 0 }),
  query('sortBy').optional().isIn(['title', 'subject', 'status', 'createdAt', 'scheduledAt', 'sentAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
];

// POST /api/newsletter/admin/campaigns - Create newsletter campaign (Admin only)
router.post(
  '/admin/campaigns',
  campaignValidation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const {
      title,
      subject,
      content,
      excerpt,
      targetAudience = 'all',
      customEmails = [],
      excludeEmails = [],
      template = 'default',
      tags = [],
      scheduledAt,
      isTest = false,
      testEmails = []
    } = req.body;

    const campaign = await NewsletterCampaign.create({
      title,
      subject,
      content,
      excerpt,
      authorId: req.user.id,
      targetAudience,
      customEmails,
      excludeEmails,
      template,
      tags,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      isTest,
      testEmails,
      status: scheduledAt ? 'scheduled' : 'draft'
    });

    // Get recipient count
    const recipientCount = await campaign.getRecipientCount();
    campaign.sendStats.totalRecipients = recipientCount;
    await campaign.save();

    logger.info(`Newsletter campaign created by admin ${req.user.id}`, {
      campaignId: campaign._id,
      title: campaign.title,
      recipientCount
    });

    res.status(201).json({
      success: true,
      message: 'Newsletter campaign created successfully',
      data: { campaign }
    });
  })
);

// GET /api/newsletter/admin/campaigns - List newsletter campaigns (Admin only)
router.get(
  '/admin/campaigns',
  campaignSearchValidation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const {
      q,
      status = 'all',
      template,
      authorId,
      limit = 20,
      skip = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build search query
    const searchQuery = {};

    if (q) {
      searchQuery.$or = [
        { title: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } }
      ];
    }

    if (status !== 'all') {
      searchQuery.status = status;
    }

    if (template) {
      searchQuery.template = template;
    }

    if (authorId) {
      searchQuery.authorId = authorId;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const campaigns = await NewsletterCampaign
      .find(searchQuery)
      .populate('authorId', 'firstName lastName email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await NewsletterCampaign.countDocuments(searchQuery);

    logger.info(`Newsletter campaigns searched by admin ${req.user.id}`, {
      query: q,
      status,
      results: campaigns.length,
      total
    });

    res.json({
      success: true,
      data: {
        campaigns,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: total > parseInt(skip) + campaigns.length
        }
      }
    });
  })
);

// GET /api/newsletter/admin/campaigns/:id - Get specific campaign (Admin only)
router.get(
  '/admin/campaigns/:id',
  [param('id').isMongoId()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const campaign = await NewsletterCampaign
      .findById(req.params.id)
      .populate('authorId', 'firstName lastName email');

    if (!campaign) throw notFoundErrorHandler('Newsletter campaign');

    // Get recipient count and sample recipients
    const recipientCount = await campaign.getRecipientCount();
    const sampleRecipients = await NewsletterCampaign
      .findById(req.params.id)
      .then(c => c.getRecipients())
      .then(recipients => recipients.slice(0, 10)); // First 10 recipients as sample

    res.json({
      success: true,
      data: {
        campaign,
        recipientCount,
        sampleRecipients
      }
    });
  })
);

// PUT /api/newsletter/admin/campaigns/:id - Update campaign (Admin only)
router.put(
  '/admin/campaigns/:id',
  [param('id').isMongoId(), ...campaignValidation],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const campaign = await NewsletterCampaign.findById(req.params.id);
    if (!campaign) throw notFoundErrorHandler('Newsletter campaign');

    // Don't allow editing sent campaigns
    if (campaign.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit sent campaigns'
      });
    }

    const {
      title,
      subject,
      content,
      excerpt,
      targetAudience,
      customEmails,
      excludeEmails,
      template,
      tags,
      scheduledAt
    } = req.body;

    // Update fields
    if (title !== undefined) campaign.title = title;
    if (subject !== undefined) campaign.subject = subject;
    if (content !== undefined) campaign.content = content;
    if (excerpt !== undefined) campaign.excerpt = excerpt;
    if (targetAudience !== undefined) campaign.targetAudience = targetAudience;
    if (customEmails !== undefined) campaign.customEmails = customEmails;
    if (excludeEmails !== undefined) campaign.excludeEmails = excludeEmails;
    if (template !== undefined) campaign.template = template;
    if (tags !== undefined) campaign.tags = tags;
    if (scheduledAt !== undefined) {
      campaign.scheduledAt = scheduledAt ? new Date(scheduledAt) : undefined;
      campaign.status = scheduledAt ? 'scheduled' : 'draft';
    }

    // Update recipient count
    const recipientCount = await campaign.getRecipientCount();
    campaign.sendStats.totalRecipients = recipientCount;

    await campaign.save();

    logger.info(`Newsletter campaign updated by admin ${req.user.id}`, {
      campaignId: campaign._id,
      title: campaign.title,
      recipientCount
    });

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      data: { campaign }
    });
  })
);

// DELETE /api/newsletter/admin/campaigns/:id - Delete campaign (Admin only)
router.delete(
  '/admin/campaigns/:id',
  [param('id').isMongoId()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const campaign = await NewsletterCampaign.findById(req.params.id);
    if (!campaign) throw notFoundErrorHandler('Newsletter campaign');

    // Don't allow deleting sent campaigns
    if (campaign.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete sent campaigns'
      });
    }

    await NewsletterCampaign.findByIdAndDelete(req.params.id);

    logger.info(`Newsletter campaign deleted by admin ${req.user.id}`, {
      campaignId: campaign._id,
      title: campaign.title
    });

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  })
);

// POST /api/newsletter/admin/campaigns/:id/test - Send test newsletter (Admin only)
router.post(
  '/admin/campaigns/:id/test',
  [
    param('id').isMongoId(),
    body('testEmails').isArray().isLength({ min: 1, max: 10 }),
    body('testEmails.*').isEmail().normalizeEmail()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const campaign = await NewsletterCampaign.findById(req.params.id);
    if (!campaign) throw notFoundErrorHandler('Newsletter campaign');

    const { testEmails } = req.body;

    try {
      const results = await sendTestNewsletter({ campaign, testEmails });

      logger.info(`Test newsletter sent by admin ${req.user.id}`, {
        campaignId: campaign._id,
        testEmails,
        results
      });

      res.json({
        success: true,
        message: 'Test newsletter sent successfully',
        data: { results }
      });
    } catch (error) {
      logger.error(`Test newsletter failed for campaign ${campaign._id}`, {
        error: error.message,
        testEmails
      });

      res.status(500).json({
        success: false,
        message: 'Failed to send test newsletter',
        error: error.message
      });
    }
  })
);

// POST /api/newsletter/admin/campaigns/:id/send - Send newsletter campaign (Admin only)
router.post(
  '/admin/campaigns/:id/send',
  [param('id').isMongoId()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const campaign = await NewsletterCampaign.findById(req.params.id);
    if (!campaign) throw notFoundErrorHandler('Newsletter campaign');

    // Check if campaign can be sent
    if (campaign.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Campaign has already been sent'
      });
    }

    if (campaign.status === 'sending') {
      return res.status(400).json({
        success: false,
        message: 'Campaign is currently being sent'
      });
    }

    // Get recipients
    const recipients = await campaign.getRecipients();
    
    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recipients found for this campaign'
      });
    }

    // Update campaign status
    campaign.status = 'sending';
    campaign.sendStats.totalRecipients = recipients.length;
    await campaign.save();

    // Send newsletter in background
    setImmediate(async () => {
      try {
        const results = await sendNewsletterCampaign({ campaign, recipients });

        // Update campaign with results
        campaign.status = 'sent';
        campaign.sendStats.sentCount = results.sent;
        campaign.sendStats.failedCount = results.failed;
        campaign.sentAt = new Date();
        await campaign.save();

        logger.info(`Newsletter campaign sent by admin ${req.user.id}`, {
          campaignId: campaign._id,
          totalRecipients: recipients.length,
          sent: results.sent,
          failed: results.failed
        });
      } catch (error) {
        // Update campaign status to failed
        campaign.status = 'draft';
        await campaign.save();

        logger.error(`Newsletter campaign failed for ${campaign._id}`, {
          error: error.message
        });
      }
    });

    res.json({
      success: true,
      message: 'Newsletter campaign is being sent',
      data: {
        campaignId: campaign._id,
        totalRecipients: recipients.length,
        status: 'sending'
      }
    });
  })
);

// POST /api/newsletter/admin/campaigns/:id/cancel - Cancel scheduled campaign (Admin only)
router.post(
  '/admin/campaigns/:id/cancel',
  [param('id').isMongoId()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const campaign = await NewsletterCampaign.findById(req.params.id);
    if (!campaign) throw notFoundErrorHandler('Newsletter campaign');

    if (campaign.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled campaigns can be cancelled'
      });
    }

    campaign.status = 'cancelled';
    await campaign.save();

    logger.info(`Newsletter campaign cancelled by admin ${req.user.id}`, {
      campaignId: campaign._id,
      title: campaign.title
    });

    res.json({
      success: true,
      message: 'Campaign cancelled successfully',
      data: { campaign }
    });
  })
);

// GET /api/newsletter/admin/campaigns/:id/recipients - Get campaign recipients (Admin only)
router.get(
  '/admin/campaigns/:id/recipients',
  [
    param('id').isMongoId(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('skip').optional().isInt({ min: 0 })
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const campaign = await NewsletterCampaign.findById(req.params.id);
    if (!campaign) throw notFoundErrorHandler('Newsletter campaign');

    const { limit = 100, skip = 0 } = req.query;

    // Get recipients with pagination
    const recipients = await campaign.getRecipients();
    const paginatedRecipients = recipients.slice(parseInt(skip), parseInt(skip) + parseInt(limit));

    res.json({
      success: true,
      data: {
        recipients: paginatedRecipients,
        pagination: {
          total: recipients.length,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: recipients.length > parseInt(skip) + paginatedRecipients.length
        }
      }
    });
  })
);

// GET /api/newsletter/admin/analytics - Get newsletter analytics (Admin only)
router.get(
  '/admin/analytics',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get campaign statistics
    const totalCampaigns = await NewsletterCampaign.countDocuments(dateFilter);
    const sentCampaigns = await NewsletterCampaign.countDocuments({ ...dateFilter, status: 'sent' });
    const draftCampaigns = await NewsletterCampaign.countDocuments({ ...dateFilter, status: 'draft' });
    const scheduledCampaigns = await NewsletterCampaign.countDocuments({ ...dateFilter, status: 'scheduled' });

    // Get total emails sent
    const totalEmailsSent = await NewsletterCampaign.aggregate([
      { $match: { ...dateFilter, status: 'sent' } },
      { $group: { _id: null, total: { $sum: '$sendStats.sentCount' } } }
    ]);

    // Get campaign performance by template
    const performanceByTemplate = await NewsletterCampaign.aggregate([
      { $match: { ...dateFilter, status: 'sent' } },
      {
        $group: {
          _id: '$template',
          count: { $sum: 1 },
          totalSent: { $sum: '$sendStats.sentCount' },
          totalFailed: { $sum: '$sendStats.failedCount' }
        }
      },
      { $sort: { totalSent: -1 } }
    ]);

    // Get recent campaigns
    const recentCampaigns = await NewsletterCampaign
      .find(dateFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('authorId', 'firstName lastName email')
      .select('title subject status createdAt sendStats')
      .lean();

    res.json({
      success: true,
      data: {
        overview: {
          totalCampaigns,
          sentCampaigns,
          draftCampaigns,
          scheduledCampaigns,
          totalEmailsSent: totalEmailsSent[0]?.total || 0
        },
        performanceByTemplate,
        recentCampaigns
      }
    });
  })
);

module.exports = router;







