const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const { optionalAuth, verifyToken, requireMentor, requireAdmin } = require('../middleware/auth');
const ResearchArea = require('../models/ResearchArea');
const { asyncHandler, validationErrorHandler, notFoundErrorHandler } = require('../middleware/errorHandler');

// GET /api/research-areas - List research areas (public)
router.get(
  '/',
  optionalAuth,
  [
    query('isActive').optional().isBoolean().toBoolean(),
    query('isFeatured').optional().isBoolean().toBoolean(),
    query('category').optional().isString(),
    query('q').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    
    const { isActive = true, isFeatured, category, q, limit = 20, skip = 0 } = req.query;
    const filter = { isActive };
    
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;
    if (category) filter.category = category;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { keywords: { $in: [new RegExp(q, 'i')] } },
      ];
    }
    
    const [items, total] = await Promise.all([
      ResearchArea.find(filter)
        .limit(limit)
        .skip(skip)
        .sort({ order: 1, name: 1 })
        .select('-__v'),
      ResearchArea.countDocuments(filter),
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

// GET /api/research-areas/:id - Get research area details (public)
router.get(
  '/:id',
  optionalAuth,
  [param('id').isString()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    
    const item = await ResearchArea.findById(req.params.id).select('-__v');
    if (!item) throw notFoundErrorHandler('Research Area');
    
    res.json({ success: true, data: { item } });
  })
);

// POST /api/research-areas - Create research area (mentor+)
router.post(
  '/',
  verifyToken,
  requireMentor,
  [
    body('name').isString().isLength({ min: 3, max: 200 }),
    body('description').isString().isLength({ min: 10, max: 2000 }),
    body('category').isString().isLength({ min: 2, max: 100 }),
    body('keywords').optional().isArray(),
    body('keywords.*').optional().isString().isLength({ max: 100 }),
    body('color').optional().isString().isLength({ max: 7 }),
    body('order').optional().isInt({ min: 0 }),
    body('focusAreas').optional().isArray(),
    body('focusAreas.*').optional().isString().isLength({ max: 200 }),
    body('requiredEquipment').optional().isArray(),
    body('requiredEquipment.*').optional().isString().isLength({ max: 200 }),
    body('requiredSkills').optional().isArray(),
    body('requiredSkills.*').optional().isString().isLength({ max: 200 }),
    body('collaborationOpportunities').optional().isString().isLength({ max: 1000 }),
    body('fundingInfo').optional().isString().isLength({ max: 1000 }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    
    const created = await ResearchArea.create({
      ...req.body,
      createdBy: req.user.id,
    });
    
    res.status(201).json({
      success: true,
      message: 'Research area created',
      data: { item: created },
    });
  })
);

// PUT /api/research-areas/:id - Update research area (mentor+)
router.put(
  '/:id',
  verifyToken,
  requireMentor,
  [param('id').isString()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    
    const updated = await ResearchArea.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdatedBy: req.user.id },
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!updated) throw notFoundErrorHandler('Research Area');
    
    res.json({
      success: true,
      message: 'Research area updated',
      data: { item: updated },
    });
  })
);

// DELETE /api/research-areas/:id - Delete research area (admin only)
router.delete(
  '/:id',
  verifyToken,
  requireAdmin,
  [param('id').isString()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    
    const deleted = await ResearchArea.findByIdAndDelete(req.params.id);
    if (!deleted) throw notFoundErrorHandler('Research Area');
    
    res.json({
      success: true,
      message: 'Research area deleted',
    });
  })
);

// GET /api/research-areas/categories - List all categories (public)
router.get(
  '/categories',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const categories = await ResearchArea.distinct('category', { isActive: true });
    res.json({
      success: true,
      data: { categories: categories.sort() },
    });
  })
);

module.exports = router;
