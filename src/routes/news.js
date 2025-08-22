const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const { optionalAuth, verifyToken, requireMentor, requireAdmin } = require('../middleware/auth');
const News = require('../models/News');
const NewsCategory = require('../models/NewsCategory');
const NewsApplication = require('../models/NewsApplication');
const { sendEmail } = require('../services/emailService');
const { asyncHandler, validationErrorHandler, notFoundErrorHandler } = require('../middleware/errorHandler');

// TODO: Implement news routes
// - GET /api/news - List news articles
// - GET /api/news/:id - Get news article details
// - POST /api/news - Create news article
// - PUT /api/news/:id - Update news article
// - DELETE /api/news/:id - Delete news article
// - GET /api/news/categories - List news categories
// - POST /api/newsletter/subscribe - Subscribe to newsletter

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
    res.json({ success: true, data: { items, pagination: { total, limit, skip, hasMore: total > skip + items.length } } });
  })
);

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
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    const created = await News.create(req.body);
    res.status(201).json({ success: true, message: 'News created', data: { item: created } });
  })
);

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
    body('responses').optional(),
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

    // Enforce login if required by config
    if (cfg.requireLogin && !req.user) {
      return res.status(401).json({ success: false, error: { message: 'Login required to apply.' } });
    }

    // Enforce deadline
    if (cfg.deadline && new Date(cfg.deadline).getTime() < Date.now()) {
      return res.status(400).json({ success: false, error: { message: 'Application deadline has passed.' } });
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

    // Normalize responses into array of { fieldName, value }
    let responses = [];
    const provided = req.body.responses;
    if (Array.isArray(provided)) {
      responses = provided
        .filter(r => r && typeof r.fieldName === 'string')
        .map(r => ({ fieldName: String(r.fieldName), value: r.value }));
    } else if (provided && typeof provided === 'object') {
      responses = Object.entries(provided).map(([k, v]) => ({ fieldName: k, value: v }));
    }

    // Validate against configured form fields
    const requiredMissing = [];
    const invalidOptions = [];
    if (Array.isArray(cfg.formFields) && cfg.formFields.length > 0) {
      const responseMap = new Map(responses.map(r => [r.fieldName, r.value]));
      for (const field of cfg.formFields) {
        if (field.required) {
          const val = responseMap.get(field.name);
          const isEmpty = val === undefined || val === null || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0);
          if (isEmpty) requiredMissing.push(field.name);
        }
        if (field.options && field.options.length > 0) {
          const val = responseMap.get(field.name);
          if (val !== undefined && val !== null) {
            if (Array.isArray(val)) {
              const bad = val.some(v => !field.options.includes(v));
              if (bad) invalidOptions.push(field.name);
            } else if (!field.options.includes(val)) {
              invalidOptions.push(field.name);
            }
          }
        }
      }
    }

    if (requiredMissing.length > 0) {
      return res.status(400).json({ success: false, error: { message: `Missing required fields: ${requiredMissing.join(', ')}` } });
    }
    if (invalidOptions.length > 0) {
      return res.status(400).json({ success: false, error: { message: `Invalid options for fields: ${invalidOptions.join(', ')}` } });
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
      responses,
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

router.get('/categories', optionalAuth, asyncHandler(async (req, res) => {
  const items = await NewsCategory.find({}).sort({ name: 1 });
  res.json({ success: true, data: { items } });
}));

router.post('/categories', verifyToken, requireMentor, [body('name').isString().isLength({ min: 2, max: 100 })], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw validationErrorHandler(errors);
  const created = await NewsCategory.create({ name: req.body.name, description: req.body.description, color: req.body.color });
  res.status(201).json({ success: true, message: 'Category created', data: { item: created } });
}));

router.put('/categories/:id', verifyToken, requireMentor, [param('id').isString()], asyncHandler(async (req, res) => {
  const updated = await NewsCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) throw notFoundErrorHandler('NewsCategory');
  res.json({ success: true, message: 'Category updated', data: { item: updated } });
}));

router.delete('/categories/:id', verifyToken, requireAdmin, [param('id').isString()], asyncHandler(async (req, res) => {
  const deleted = await NewsCategory.findByIdAndDelete(req.params.id);
  if (!deleted) throw notFoundErrorHandler('NewsCategory');
  res.json({ success: true, message: 'Category deleted' });
}));

module.exports = router;
