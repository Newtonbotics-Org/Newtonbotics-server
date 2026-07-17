const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const { optionalAuth, verifyToken, requireAdmin } = require('../middleware/auth');
const PastLeader = require('../models/PastLeader');
const { asyncHandler, validationErrorHandler, notFoundErrorHandler } = require('../middleware/errorHandler');
const { compareTenureDates, tenureDateValidator } = require('../utils/tenureDates');

// GET /api/past-leaders/positions - List distinct positions (public)
// MUST be defined BEFORE /:id route to avoid route conflicts
router.get(
  '/positions',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const positions = await PastLeader.distinct('position', { isActive: true });
    res.json({
      success: true,
      data: { positions: positions.sort() },
    });
  })
);

// GET /api/past-leaders - List past leaders (public)
router.get(
  '/',
  optionalAuth,
  [
    query('isActive').optional().isBoolean().toBoolean(),
    query('position').optional().isString(),
    query('q').optional().isString(),
    query('userId').optional().isMongoId(),
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const { isActive: isActiveParam, position, q, userId, limit = 100, skip = 0 } = req.query;
    const isAdmin = req.user?.role === 'admin';
    const filter = {};

    if (userId) {
      filter.userId = userId;
      if (isActiveParam !== undefined) filter.isActive = isActiveParam;
    } else if (isActiveParam !== undefined) {
      filter.isActive = isActiveParam;
    } else if (!isAdmin) {
      filter.isActive = true;
    }

    if (position) filter.position = position;
    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { position: { $regex: q, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      PastLeader.find(filter)
        .limit(limit)
        .skip(skip)
        .sort({ tenureStart: -1, order: 1, fullName: 1 })
        .select('-__v'),
      PastLeader.countDocuments(filter),
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

// GET /api/past-leaders/:id - Get past leader details (public)
router.get(
  '/:id',
  optionalAuth,
  [param('id').isMongoId()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const item = await PastLeader.findById(req.params.id).select('-__v');
    if (!item) throw notFoundErrorHandler('Past Leader');

    res.json({ success: true, data: { item } });
  })
);

// Factory so POST (required) and PUT (all optional) get independent validator chains
const pastLeaderValidators = ({ forUpdate = false } = {}) => [
  forUpdate ? body('fullName').optional().isString().trim().isLength({ min: 2, max: 200 })
            : body('fullName').isString().trim().isLength({ min: 2, max: 200 }),
  forUpdate ? body('position').optional().isString().trim().isLength({ min: 2, max: 100 })
            : body('position').isString().trim().isLength({ min: 2, max: 100 }),
  tenureDateValidator('tenureStart', { forUpdate }),
  tenureDateValidator('tenureEnd', { optional: true }),
  body('imageUrl').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
  body('linkedinUrl').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
  body('email').optional({ nullable: true }).isString().trim().isLength({ max: 200 }),
  body('description').optional({ nullable: true }).isString().trim().isLength({ max: 1000 }),
  body('achievements').optional().isArray(),
  body('achievements.*').optional().isString().trim().isLength({ max: 300 }),
  body('order').optional().isInt({ min: 0 }).toInt(),
  body('isActive').optional().isBoolean().toBoolean(),
  body('userId').optional({ nullable: true }).isMongoId(),
  body('subrole').optional({ nullable: true }).isString().trim().isLength({ max: 100 }),
];

// POST /api/past-leaders - Create past leader (admin only)
router.post(
  '/',
  verifyToken,
  requireAdmin,
  pastLeaderValidators(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    if (req.body.tenureEnd && compareTenureDates(req.body.tenureEnd, req.body.tenureStart) < 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'tenureEnd cannot be before tenureStart' },
      });
    }

    const created = await PastLeader.create({
      ...req.body,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Past leader created',
      data: { item: created.toObject() },
    });
  })
);

// PUT /api/past-leaders/:id - Update past leader (admin only)
router.put(
  '/:id',
  verifyToken,
  requireAdmin,
  [param('id').isMongoId(), ...pastLeaderValidators({ forUpdate: true })],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const existing = await PastLeader.findById(req.params.id);
    if (!existing) throw notFoundErrorHandler('Past Leader');

    Object.assign(existing, req.body);
    existing.lastUpdatedBy = req.user.id;

    if (existing.tenureEnd && compareTenureDates(existing.tenureEnd, existing.tenureStart) < 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'tenureEnd cannot be before tenureStart' },
      });
    }

    await existing.save();

    res.json({
      success: true,
      message: 'Past leader updated',
      data: { item: existing.toObject() },
    });
  })
);

// DELETE /api/past-leaders/:id - Delete past leader (admin only)
router.delete(
  '/:id',
  verifyToken,
  requireAdmin,
  [param('id').isMongoId()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const deleted = await PastLeader.findByIdAndDelete(req.params.id);
    if (!deleted) throw notFoundErrorHandler('Past Leader');

    res.json({
      success: true,
      message: 'Past leader deleted',
    });
  })
);

module.exports = router;
