const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const { optionalAuth, verifyToken, requireMentor, requireAdmin } = require('../middleware/auth');
const ResearchArea = require('../models/ResearchArea');
const { asyncHandler, validationErrorHandler, notFoundErrorHandler } = require('../middleware/errorHandler');

// GET /api/research-areas/categories - List all categories (public)
// MUST be defined BEFORE /:id route to avoid route conflicts
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

// POST /api/research-areas/:id/recalculate-members - Recalculate memberCount (mentor+)
router.post(
  '/:id/recalculate-members',
  verifyToken,
  requireMentor,
  [param('id').isString()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    
    const researchArea = await ResearchArea.findById(req.params.id);
    if (!researchArea) throw notFoundErrorHandler('Research Area');
    
    const oldCount = researchArea.memberCount;
    await researchArea.calculateMemberCount();
    await researchArea.save();
    
    res.json({
      success: true,
      message: 'Member count recalculated',
      data: {
        oldCount,
        newCount: researchArea.memberCount,
        item: researchArea.toObject(),
      },
    });
  })
);

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
    
    // Recalculate memberCount for all items and convert to objects
    const itemsWithStudentIds = await Promise.all(items.map(async (item) => {
      // Recalculate memberCount to ensure it's up-to-date
      await item.calculateMemberCount();
      if (item.isModified('memberCount')) {
        await item.save();
      }
      
      const itemObj = item.toObject();
      itemObj.studentIds = item.studentIds || [];
      return itemObj;
    }));
    
    res.json({
      success: true,
      data: {
        items: itemsWithStudentIds,
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
    
    // Recalculate memberCount to ensure it's up-to-date
    await item.calculateMemberCount();
    if (item.isModified('memberCount')) {
      await item.save();
    }
    
    // Convert to object and explicitly include studentIds
    const itemObj = item.toObject();
    itemObj.studentIds = item.studentIds || [];
    
    res.json({ success: true, data: { item: itemObj } });
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
    body('externalLinks').optional().isArray(),
    body('externalLinks.*.title').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('externalLinks.*.url').optional().isString().trim().isLength({ min: 1, max: 500 }).isURL(),
    body('externalLinks.*.description').optional().isString().trim().isLength({ max: 500 }),
    body('studentIds').optional().isArray(),
    body('studentIds.*').optional().isString().trim().isLength({ min: 1, max: 50 }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    
    // Prepare data for creation, ensuring studentIds is properly formatted
    const researchAreaData = { ...req.body };
    researchAreaData.createdBy = req.user.id;
    
    // Normalize studentIds if provided
    if (researchAreaData.studentIds !== undefined) {
      researchAreaData.studentIds = Array.isArray(researchAreaData.studentIds)
        ? researchAreaData.studentIds.filter(id => id && typeof id === 'string').map(id => id.trim()).filter(id => id.length > 0)
        : [];
    }
    
    const created = await ResearchArea.create(researchAreaData);
    
    // Calculate memberCount after creation
    await created.calculateMemberCount();
    await created.save();
    
    // Convert to object and explicitly include studentIds
    const createdObj = created.toObject();
    createdObj.studentIds = created.studentIds || [];
    
    res.status(201).json({
      success: true,
      message: 'Research area created',
      data: { item: createdObj },
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
    
    // Find existing research area
    const existing = await ResearchArea.findById(req.params.id);
    if (!existing) throw notFoundErrorHandler('Research Area');
    
    // Update the existing document
    Object.assign(existing, req.body);
    existing.lastUpdatedBy = req.user.id;
    
    // Explicitly ensure studentIds are set if provided (even if empty array or null)
    // This must be done AFTER Object.assign to ensure it's not overwritten
    if (req.body.studentIds !== undefined) {
      const normalizedStudentIds = Array.isArray(req.body.studentIds) 
        ? req.body.studentIds.filter(id => id && typeof id === 'string').map(id => String(id).trim()).filter(id => id.length > 0)
        : [];
      existing.set('studentIds', normalizedStudentIds);
    }
    
    // Save the document (pre-save hook will calculate memberCount)
    await existing.save();
    
    // Fetch the updated document to ensure all fields are included
    const updated = await ResearchArea.findById(req.params.id).select('-__v');
    if (!updated) throw notFoundErrorHandler('Research Area');
    
    // Convert to object and explicitly include studentIds
    const updatedObj = updated.toObject();
    updatedObj.studentIds = Array.isArray(updated.studentIds) ? updated.studentIds : [];
    
    res.json({
      success: true,
      message: 'Research area updated',
      data: { item: updatedObj },
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

module.exports = router;
