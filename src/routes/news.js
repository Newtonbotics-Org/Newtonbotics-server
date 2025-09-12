const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const { optionalAuth, verifyToken, requireMentor, requireAdmin } = require('../middleware/auth');
const News = require('../models/News');
const NewsCategory = require('../models/NewsCategory');
const NewsApplication = require('../models/NewsApplication');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const { asyncHandler, validationErrorHandler, notFoundErrorHandler } = require('../middleware/errorHandler');

// GET /api/news - List news articles
router.get(
  '/',
  optionalAuth,
  [
    query('isPublished').optional().isBoolean().toBoolean(),
    query('isFeatured').optional().isBoolean().toBoolean(),
    query('showInNav').optional().isBoolean().toBoolean(),
    query('categoryId').optional().isString(),
    query('q').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    
    const { isPublished, isFeatured, showInNav, categoryId, q, limit = 20, skip = 0 } = req.query;
    
    const filter = {};
    if (isPublished !== undefined) filter.isPublished = isPublished;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;
    if (showInNav !== undefined) filter['featureOptions.showInNav'] = showInNav;
    if (categoryId) filter.categoryId = categoryId;
    if (q) filter.title = { $regex: q, $options: 'i' };
    
    const [items, total] = await Promise.all([
      News.find(filter).limit(limit).skip(skip).sort({ 'featureOptions.navOrder': 1, publishedAt: -1, createdAt: -1 }),
      News.countDocuments(filter),
    ]);
    
    res.json({ 
      success: true, 
      data: { 
        items, 
        pagination: { 
          total, 
          limit, 
          skip, 
          hasMore: total > skip + items.length 
        } 
      } 
    });
  })
);

// Admin route for creating news articles
router.post(
  '/admin',
  verifyToken,
  requireAdmin,
  [
    body('title').isString().isLength({ min: 5, max: 255 }),
    body('content').isString().isLength({ min: 20, max: 10000 }),
    body('excerpt').optional().isString().isLength({ max: 500 }),
    body('authorId').isString(),
    body('categoryId').optional().isString(),
    body('isPublished').optional().isBoolean().toBoolean(),
    body('isFeatured').optional().isBoolean().toBoolean(),
    body('publishedAt').optional().isISO8601(),
    body('tags').optional().isArray(),
    body('featuredImageUrl').optional().isString().isLength({ max: 500 }),
    body('featureOptions').optional().isObject(),
    body('featureOptions.showInNav').optional().isBoolean(),
    body('featureOptions.navOrder').optional().isInt({ min: 0 }),
    body('featureOptions.navLabel').optional().isString().isLength({ max: 50 }),
    body('application').optional().isObject(),
    body('application.isEnabled').optional().isBoolean(),
    body('application.type').optional().isIn(['workshop', 'event', 'competition', 'other']),
    body('application.requireLogin').optional().isBoolean(),
    body('application.formApplyStartDate').optional().isISO8601(),
    body('application.formApplyLastDate').optional().isISO8601(),
    body('application.maxApplicants').optional().isInt({ min: 1 }),
    body('application.formLink').optional().isString().isLength({ max: 500 }),
    body('application.targetType').optional().isIn(['Workshop', 'Event', 'Competition', 'Other']),
    body('application.targetId').optional().isString(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    
    // Validate authorId exists
    const author = await User.findById(req.body.authorId);
    if (!author) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Author not found' } 
      });
    }
    
    // Validate categoryId if provided
    if (req.body.categoryId) {
      const category = await NewsCategory.findById(req.body.categoryId);
      if (!category) {
        return res.status(400).json({ 
          success: false, 
          error: { message: 'Category not found' } 
        });
      }
    }
    
    // Set publishedAt if isPublished is true and publishedAt is not provided
    if (req.body.isPublished && !req.body.publishedAt) {
      req.body.publishedAt = new Date();
    }
    
    const created = await News.create(req.body);
    res.status(201).json({ 
      success: true, 
      message: 'News article created successfully', 
      data: { item: created } 
    });
  })
);

// Mentor route for creating news articles (existing)
router.post(
  '/',
  verifyToken,
  requireMentor,
  [
    body('title').isString().isLength({ min: 5, max: 255 }),
    body('content').isString().isLength({ min: 20, max: 10000 }),
    body('authorId').isString(),
    body('categoryId').optional().isString(),
    body('isPublished').optional().isBoolean().toBoolean(),
    body('publishedAt').optional().isISO8601(),
    body('tags').optional().isArray(),
    body('featureOptions').optional().isObject(),
    body('featureOptions.showInNav').optional().isBoolean(),
    body('featureOptions.navOrder').optional().isInt({ min: 0 }),
    body('featureOptions.navLabel').optional().isString(),
    body('featuredImageUrl').optional().isString(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    const created = await News.create(req.body);
    res.status(201).json({ success: true, message: 'News created', data: { item: created } });
  })
);

// Categories routes - must come before :id routes to avoid conflicts
router.get('/categories', optionalAuth, asyncHandler(async (req, res) => {
  const items = await NewsCategory.find({}).sort({ name: 1 });
  res.json({ success: true, data: { categories: items } });
}));

router.post('/categories', verifyToken, requireMentor, [body('name').isString().isLength({ min: 2, max: 100 })], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw validationErrorHandler(errors);
  const created = await NewsCategory.create({ name: req.body.name, description: req.body.description, color: req.body.color });
  res.status(201).json({ success: true, message: 'Category created', data: { category: created } });
}));

router.put('/categories/:id', verifyToken, requireMentor, [param('id').isString()], asyncHandler(async (req, res) => {
  const updated = await NewsCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) throw notFoundErrorHandler('NewsCategory');
  res.json({ success: true, message: 'Category updated', data: { category: updated } });
}));

router.delete('/categories/:id', verifyToken, requireAdmin, [param('id').isString()], asyncHandler(async (req, res) => {
  const deleted = await NewsCategory.findByIdAndDelete(req.params.id);
  if (!deleted) throw notFoundErrorHandler('NewsCategory');
  res.json({ success: true, message: 'Category deleted' });
}));

// GET /api/news/:id - Get news article details
router.get(
  '/:id',
  optionalAuth,
  [param('id').isString()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    const item = await News.findById(req.params.id);
    if (!item) throw notFoundErrorHandler('News');
    // Increment view count for published items (best-effort)
    if (item.isPublished) {
      News.findByIdAndUpdate(item._id, { $inc: { viewCount: 1 } }).catch(() => {});
    }
    res.json({ success: true, data: { item } });
  })
);

// POST /api/news/:id/apply - Submit application for a news item with application enabled
router.post(
  '/:id/apply',
  optionalAuth,
  [
    param('id').isString(),
    body('fullName').optional().isString().isLength({ min: 2, max: 200 }),
    body('email').optional().isEmail().isLength({ max: 255 }).normalizeEmail(),
    body('phone').optional().isString().isLength({ max: 50 }),
  ],
  asyncHandler(async (req, res) => {
    const pErrors = validationResult(req);
    if (!pErrors.isEmpty()) throw validationErrorHandler(pErrors);

    const news = await News.findById(req.params.id);
    if (!news) throw notFoundErrorHandler('News');

    const cfg = news.application || {};
    if (!cfg.isEnabled) {
      return res.status(400).json({ success: false, error: { message: 'Applications are not enabled for this news item.' } });
    }

    // Check application status
    if (cfg.status === 'not_started') {
      return res.status(400).json({ success: false, error: { message: 'Applications have not started yet.' } });
    }
    
    if (cfg.status === 'expired') {
      return res.status(400).json({ success: false, error: { message: 'Application deadline has passed.' } });
    }

    // Enforce login if required by config
    if (cfg.requireLogin && !req.user) {
      return res.status(401).json({ success: false, error: { message: 'Login required to apply.' } });
    }

    // Enforce max applicants
    if (cfg.maxApplicants) {
      const currentCount = await NewsApplication.countDocuments({ newsId: news._id });
      if (currentCount >= cfg.maxApplicants) {
        return res.status(400).json({ success: false, error: { message: 'Application limit reached.' } });
      }
    }

    // Build applicant info
    const fullName = req.body.fullName || (req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : undefined);
    const email = req.body.email || (req.user ? req.user.email : undefined);
    const phone = req.body.phone;

    if (!fullName) {
      return res.status(400).json({ success: false, error: { message: 'fullName is required.' } });
    }
    if (!email) {
      return res.status(400).json({ success: false, error: { message: 'email is required.' } });
    }

    const application = await NewsApplication.create({
      newsId: news._id,
      type: cfg.type || 'other',
      applicant: {
        userId: req.user ? req.user.id : undefined,
        fullName,
        email,
        phone,
      },
      responses: [], // No form fields needed
    });

    // Attempt to send acknowledgement email (best-effort)
    try {
      await sendEmail({
        to: email,
        subject: `Application received: ${news.title}`,
        text: `Thanks for applying to ${news.title}. We will review your application and get back to you.`,
      });
    } catch (_) {}

    res.status(201).json({ success: true, message: 'Application submitted', data: { application } });
  })
);

// Admin route for updating news articles
router.put(
  '/admin/:id',
  verifyToken,
  requireAdmin,
  [
    param('id').isString(),
    body('title').optional().isString().isLength({ min: 5, max: 255 }),
    body('content').optional().isString().isLength({ min: 20, max: 10000 }),
    body('excerpt').optional().isString().isLength({ max: 500 }),
    body('authorId').optional().isString(),
    body('categoryId').optional().isString(),
    body('isPublished').optional().isBoolean().toBoolean(),
    body('isFeatured').optional().isBoolean().toBoolean(),
    body('publishedAt').optional().isISO8601(),
    body('tags').optional().isArray(),
    body('featuredImageUrl').optional().isString().isLength({ max: 500 }),
    body('featureOptions').optional().isObject(),
    body('featureOptions.showInNav').optional().isBoolean(),
    body('featureOptions.navOrder').optional().isInt({ min: 0 }),
    body('featureOptions.navLabel').optional().isString().isLength({ max: 50 }),
    body('application').optional().isObject(),
    body('application.isEnabled').optional().isBoolean(),
    body('application.type').optional().isIn(['workshop', 'event', 'competition', 'other']),
    body('application.requireLogin').optional().isBoolean(),
    body('application.formApplyStartDate').optional().isISO8601(),
    body('application.formApplyLastDate').optional().isISO8601(),
    body('application.maxApplicants').optional().isInt({ min: 1 }),
    body('application.formLink').optional().isString().isLength({ max: 500 }),
    body('application.targetType').optional().isIn(['Workshop', 'Event', 'Competition', 'Other']),
    body('application.targetId').optional().isString(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    
    // Check if news article exists
    const existingNews = await News.findById(req.params.id);
    if (!existingNews) {
      return res.status(404).json({ 
        success: false, 
        error: { message: 'News article not found' } 
      });
    }
    
    // Validate authorId if provided
    if (req.body.authorId) {
      const author = await User.findById(req.body.authorId);
      if (!author) {
        return res.status(400).json({ 
          success: false, 
          error: { message: 'Author not found' } 
        });
      }
    }
    
    // Validate categoryId if provided
    if (req.body.categoryId) {
      const category = await NewsCategory.findById(req.body.categoryId);
      if (!category) {
        return res.status(400).json({ 
          success: false, 
          error: { message: 'Category not found' } 
        });
      }
    }
    
    // Handle publishedAt logic
    if (req.body.isPublished !== undefined) {
      if (req.body.isPublished && !req.body.publishedAt && !existingNews.publishedAt) {
        req.body.publishedAt = new Date();
      } else if (!req.body.isPublished) {
        req.body.publishedAt = null;
      }
    }
    
    // Update the news article
    const updated = await News.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { 
        new: true,
        runValidators: true 
      }
    );
    
    res.json({ 
      success: true, 
      message: 'News article updated successfully', 
      data: { item: updated } 
    });
  })
);

// Mentor route for updating news articles (existing)
router.put('/:id', verifyToken, requireMentor, [param('id').isString()], asyncHandler(async (req, res) => {
  const updated = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) throw notFoundErrorHandler('News');
  res.json({ success: true, message: 'News updated', data: { item: updated } });
}));

router.delete('/:id', verifyToken, requireAdmin, [param('id').isString()], asyncHandler(async (req, res) => {
  const deleted = await News.findByIdAndDelete(req.params.id);
  if (!deleted) throw notFoundErrorHandler('News');
  res.json({ success: true, message: 'News deleted' });
}));

// GET /api/news/:id/applications - Get applications for a news item (Admin/Mentor only)
router.get(
  '/:id/applications',
  verifyToken,
  requireMentor,
  [
    param('id').isString(),
    query('status').optional().isIn(['submitted', 'reviewed', 'accepted', 'rejected', 'waitlisted', 'withdrawn']),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const news = await News.findById(req.params.id);
    if (!news) throw notFoundErrorHandler('News');

    const limit = req.query.limit || 20;
    const skip = req.query.skip || 0;
    const statusFilter = req.query.status;

    const filter = { newsId: news._id };
    if (statusFilter) {
      filter.status = statusFilter;
    }

    const applications = await NewsApplication.find(filter)
      .sort({ submittedAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('applicant.userId', 'firstName lastName email');

    const total = await NewsApplication.countDocuments(filter);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + applications.length < total
        }
      }
    });
  })
);

// GET /api/news/:id/application-status - Get application status for current user
router.get(
  '/:id/application-status',
  verifyToken,
  [
    param('id').isString(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const news = await News.findById(req.params.id);
    if (!news) throw notFoundErrorHandler('News');

    if (!news.application.isEnabled) {
      return res.status(400).json({
        success: false,
        error: { message: 'Applications are not enabled for this news item.' }
      });
    }

    // Check if user has already applied
    const existingApplication = await NewsApplication.findOne({
      newsId: news._id,
      'applicant.userId': req.user.id
    });

    if (!existingApplication) {
      return res.json({
        success: true,
        data: {
          hasApplied: false,
          canApply: news.application.status === 'active',
          reason: news.application.status === 'active' ? null : 
                  news.application.status === 'not_started' ? 'Applications have not started yet' :
                  'Application deadline has passed'
        }
      });
    }

    res.json({
      success: true,
      data: {
        hasApplied: true,
        canApply: false,
        reason: 'Already applied',
        application: {
          id: existingApplication._id,
          status: existingApplication.status,
          submittedAt: existingApplication.submittedAt,
          reviewedAt: existingApplication.reviewedAt,
          notes: existingApplication.notes
        }
      }
    });
  })
);

// PUT /api/news/:id/applications/:applicationId/status - Update application status (Admin/Mentor only)
router.put(
  '/:id/applications/:applicationId/status',
  verifyToken,
  requireMentor,
  [
    param('id').isString(),
    param('applicationId').isString(),
    body('status').isIn(['submitted', 'reviewed', 'accepted', 'rejected', 'waitlisted', 'withdrawn']),
    body('notes').optional().isString().isLength({ max: 2000 }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const news = await News.findById(req.params.id);
    if (!news) throw notFoundErrorHandler('News');

    const application = await NewsApplication.findById(req.params.applicationId);
    if (!application || application.newsId.toString() !== req.params.id) {
      return res.status(404).json({
        success: false,
        error: { message: 'Application not found' }
      });
    }

    const updateData = {
      status: req.body.status,
      reviewedAt: new Date(),
      reviewerId: req.user.id
    };

    if (req.body.notes !== undefined) {
      updateData.notes = req.body.notes;
    }

    const updated = await NewsApplication.findByIdAndUpdate(
      req.params.applicationId,
      updateData,
      { new: true }
    ).populate('applicant.userId', 'firstName lastName email');

    // Send email notification to applicant (best-effort)
    try {
      const statusMessages = {
        accepted: 'Congratulations! Your application has been accepted.',
        rejected: 'We regret to inform you that your application has not been accepted.',
        waitlisted: 'Your application has been waitlisted. We will contact you if a spot becomes available.',
        reviewed: 'Your application has been reviewed and is under consideration.'
      };

      const message = statusMessages[req.body.status] || 'Your application status has been updated.';

      await sendEmail({
        to: updated.applicant.email,
        subject: `Application Update: ${news.title}`,
        text: `${message}\n\nStatus: ${req.body.status}\n${req.body.notes ? `Notes: ${req.body.notes}` : ''}`,
      });
    } catch (_) {}

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: { application: updated }
    });
  })
);

module.exports = router;
