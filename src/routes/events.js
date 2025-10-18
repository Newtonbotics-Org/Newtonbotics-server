const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const { optionalAuth, verifyToken, requireTeamMember, requireMentor, requireAdmin } = require('../middleware/auth');
const Event = require('../models/Event');
const { asyncHandler, validationErrorHandler, notFoundErrorHandler } = require('../middleware/errorHandler');

// TODO: Implement events routes
// - GET /api/events - List events
// - GET /api/events/:id - Get event details
// - POST /api/events - Create event
// - PUT /api/events/:id - Update event
// - DELETE /api/events/:id - Delete event
// - POST /api/events/:id/register - Register for event
// - DELETE /api/events/:id/register - Unregister from event

router.get(
  '/',
  optionalAuth,
  [
    query('status').optional().isIn(['upcoming', 'ongoing', 'completed', 'cancelled']),
    query('type').optional().isString(),
    query('category').optional().isString(),
    query('isFeatured').optional().isBoolean().toBoolean(),
    query('requiresRegistration').optional().isBoolean().toBoolean(),
    query('showInNav').optional().isBoolean().toBoolean(),
    query('q').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    const { status, type, category, isFeatured, requiresRegistration, showInNav, q, limit = 20, skip = 0 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;
    if (requiresRegistration !== undefined) filter.requiresRegistration = requiresRegistration;
    if (showInNav !== undefined) filter['featureOptions.showInNav'] = showInNav;
    if (q) filter.title = { $regex: q, $options: 'i' };
    const [items, total] = await Promise.all([
      Event.find(filter).limit(limit).skip(skip).sort({ startDate: 1 }),
      Event.countDocuments(filter),
    ]);
    
    if (items.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No events found',
        data: { 
          items: [], 
          pagination: { total: 0, limit, skip, hasMore: false } 
        } 
      });
    }
    
    res.json({ success: true, data: { items, pagination: { total, limit, skip, hasMore: total > skip + items.length } } });
  })
);

router.post(
  '/',
  verifyToken,
  requireMentor,
  [
    body('title').isString().isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),
    body('description').isString().isLength({ min: 10, max: 5000 }).withMessage('Description must be between 10 and 5000 characters'),
    body('type').isString().withMessage('Event type is required'),
    body('startDate').isISO8601().withMessage('Start date must be a valid ISO8601 date'),
    body('endDate').isISO8601().withMessage('End date must be a valid ISO8601 date'),
    body('organizerId').optional().isString(),
    body('location').optional().isString(),
    body('maxCapacity').optional().isInt({ min: 1 }).toInt(),
    body('isFeatured').optional().isBoolean().toBoolean(),
    body('requiresRegistration').optional().isBoolean().toBoolean(),
    body('registrationFormLink').optional().isString().isLength({ max: 500 }),
    body('registrationDeadline').optional({ checkFalsy: true }).isISO8601().withMessage('Registration deadline must be a valid ISO8601 date'),
    body('featureOptions.showInNav').optional().isBoolean().toBoolean(),
    body('featureOptions.navLabel').optional({ checkFalsy: true }).isString().isLength({ min: 2, max: 50 }),
    body('featureOptions.navOrder').optional().isInt({ min: 0 }).toInt(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    
    // Ensure endDate is not before startDate (same day allowed)
    const { startDate, endDate } = req.body;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        return res.status(400).json({
          success: false,
          message: 'End date must be the same as or after start date'
        });
      }
    }
    
    // Validate registration form link if registration is required
    if (req.body.requiresRegistration && !req.body.registrationFormLink) {
      return res.status(400).json({
        success: false,
        message: 'Registration form link is required when registration is required'
      });
    }
    
    // Validate navigation label if show in nav is enabled
    if (req.body.featureOptions && req.body.featureOptions.showInNav && !req.body.featureOptions.navLabel) {
      return res.status(400).json({
        success: false,
        message: 'Navigation label is required when show in navigation is enabled'
      });
    }
    
    const created = await Event.create(req.body);
    res.status(201).json({ success: true, message: 'Event created', data: { item: created } });
  })
);

router.put('/:id', verifyToken, requireMentor, [
  param('id').isString(),
  body('requiresRegistration').optional().isBoolean().toBoolean(),
  body('registrationFormLink').optional().isString().isLength({ max: 500 }),
  body('registrationDeadline').optional({ checkFalsy: true }).isISO8601().withMessage('Registration deadline must be a valid ISO8601 date'),
  body('featureOptions.showInNav').optional().isBoolean().toBoolean(),
  body('featureOptions.navLabel').optional({ checkFalsy: true }).isString().isLength({ min: 2, max: 50 }),
  body('featureOptions.navOrder').optional().isInt({ min: 0 }).toInt(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw validationErrorHandler(errors);
  
  // For partial updates, ensure endDate is not before startDate (same day allowed)
  const existing = await Event.findById(req.params.id);
  if (!existing) throw notFoundErrorHandler('Event');
  const nextStart = req.body.startDate ? new Date(req.body.startDate) : new Date(existing.startDate);
  const nextEnd = req.body.endDate ? new Date(req.body.endDate) : new Date(existing.endDate);
  if (nextEnd < nextStart) {
    return res.status(400).json({
      success: false,
      message: 'End date must be the same as or after start date'
    });
  }
  
  // Validate registration form link if registration is required
  if (req.body.requiresRegistration && !req.body.registrationFormLink) {
    return res.status(400).json({
      success: false,
      message: 'Registration form link is required when registration is required'
    });
  }
  
  // Validate navigation label if show in nav is enabled
  if (req.body.featureOptions && req.body.featureOptions.showInNav && !req.body.featureOptions.navLabel) {
    return res.status(400).json({
      success: false,
      message: 'Navigation label is required when show in navigation is enabled'
    });
  }
  
  const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) throw notFoundErrorHandler('Event');
  res.json({ success: true, message: 'Event updated', data: { item: updated } });
}));

router.delete('/:id', verifyToken, requireAdmin, [param('id').isString()], asyncHandler(async (req, res) => {
  const deleted = await Event.findByIdAndDelete(req.params.id);
  if (!deleted) throw notFoundErrorHandler('Event');
  res.json({ success: true, message: 'Event deleted' });
}));

router.get('/:id', [param('id').isString()], asyncHandler(async (req, res) => {
  const item = await Event.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ 
      success: false, 
      message: 'Event not found',
      data: null 
    });
  }
  res.json({ success: true, data: { item } });
}));

module.exports = router;
