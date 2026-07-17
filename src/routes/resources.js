const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const { verifyToken, requireMentor } = require('../middleware/auth');
const Resource = require('../models/Resource');
const { RESOURCE_TYPES, RESOURCE_CATEGORIES } = require('../models/Resource');
const { asyncHandler, validationErrorHandler, notFoundErrorHandler } = require('../middleware/errorHandler');

router.get(
  '/categories',
  verifyToken,
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      data: {
        categories: RESOURCE_CATEGORIES.map((id) => ({
          id,
          label: id.charAt(0).toUpperCase() + id.slice(1),
        })),
        resourceTypes: RESOURCE_TYPES,
      },
    });
  })
);

router.get(
  '/',
  verifyToken,
  [
    query('resourceType').optional().isIn(RESOURCE_TYPES),
    query('category').optional().isIn(RESOURCE_CATEGORIES),
    query('q').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt(),
    query('all').optional().isIn(['true', 'false']),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const { resourceType, category, q, limit = 50, skip = 0, all } = req.query;
    const filter = {};

    // Mentors/researchers/admins can request unpublished items via ?all=true
    const canManageAll =
      req.user &&
      ['mentor', 'researcher', 'admin'].includes(req.user.role);
    if (!(all === 'true' && canManageAll)) {
      filter.isPublished = true;
    }

    if (resourceType) filter.resourceType = resourceType;
    if (category) filter.category = category;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Resource.find(filter)
        .populate('createdBy', 'firstName lastName role')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip),
      Resource.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: { total, limit, skip, hasMore: total > skip + items.length },
      },
    });
  })
);

router.get(
  '/:id',
  verifyToken,
  [param('id').isMongoId()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const item = await Resource.findOne({ _id: req.params.id, isPublished: true }).populate(
      'createdBy',
      'firstName lastName role'
    );
    if (!item) throw notFoundErrorHandler('Resource');

    res.json({ success: true, data: { item } });
  })
);

router.post(
  '/',
  verifyToken,
  requireMentor,
  [
    body('title').isString().trim().isLength({ min: 2, max: 255 }),
    body('description').optional().isString().isLength({ max: 2000 }),
    body('resourceType').isIn(RESOURCE_TYPES),
    body('category').optional().isIn(RESOURCE_CATEGORIES),
    body('externalUrl').optional().isString().isLength({ max: 1000 }),
    body('fileUrl').optional().isString().isLength({ max: 1000 }),
    body('thumbnailUrl').optional().isString().isLength({ max: 1000 }),
    body('tags').optional().isArray(),
    body('isPublished').optional().isBoolean(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const { resourceType, externalUrl, fileUrl, thumbnailUrl } = req.body;
    const resolvedFileUrl = fileUrl || (resourceType === 'image' ? thumbnailUrl : undefined);

    if (resourceType === 'link' && !externalUrl) {
      return res.status(400).json({
        success: false,
        message: 'External URL is required for link resources',
      });
    }

    if (resourceType !== 'link' && !resolvedFileUrl) {
      return res.status(400).json({
        success: false,
        message: 'File or cover image is required for media resources',
      });
    }

    const created = await Resource.create({
      ...req.body,
      fileUrl: resolvedFileUrl,
      createdBy: req.user.id,
    });

    const item = await Resource.findById(created._id).populate('createdBy', 'firstName lastName role');
    res.status(201).json({ success: true, message: 'Resource created', data: { item } });
  })
);

router.put(
  '/:id',
  verifyToken,
  requireMentor,
  [
    param('id').isMongoId(),
    body('title').optional().isString().trim().isLength({ min: 2, max: 255 }),
    body('description').optional().isString().isLength({ max: 2000 }),
    body('resourceType').optional().isIn(RESOURCE_TYPES),
    body('category').optional().isIn(RESOURCE_CATEGORIES),
    body('externalUrl').optional().isString().isLength({ max: 1000 }),
    body('fileUrl').optional().isString().isLength({ max: 1000 }),
    body('thumbnailUrl').optional().isString().isLength({ max: 1000 }),
    body('tags').optional().isArray(),
    body('isPublished').optional().isBoolean(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const item = await Resource.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'firstName lastName role');

    if (!item) throw notFoundErrorHandler('Resource');

    res.json({ success: true, message: 'Resource updated', data: { item } });
  })
);

router.delete(
  '/:id',
  verifyToken,
  requireMentor,
  [param('id').isMongoId()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const item = await Resource.findByIdAndDelete(req.params.id);
    if (!item) throw notFoundErrorHandler('Resource');

    res.json({ success: true, message: 'Resource deleted' });
  })
);

module.exports = router;
