const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const { optionalAuth, verifyToken, requireTeamMember, requireMentor, requireAdmin } = require('../middleware/auth');
const Event = require('../models/Event');
const News = require('../models/News');
const { asyncHandler, validationErrorHandler, notFoundErrorHandler } = require('../middleware/errorHandler');

// TODO: Implement events routes
// - GET /api/events - List events
// - GET /api/events/:id - Get event details
// - POST /api/events - Create event
// - PUT /api/events/:id - Update event
// - DELETE /api/events/:id - Delete event
// - POST /api/events/:id/register - Register for event
// - DELETE /api/events/:id/register - Unregister from event

// Navigation API - Get all events and news with showInNav: true
router.get(
  '/navigation',
  optionalAuth,
  asyncHandler(async (req, res) => {
    try {
      // Get events with showInNav: true
      const events = await Event.find({ 'featureOptions.showInNav': true })
        .select('_id title description category type startDate endDate startTime endTime location maxCapacity currentRegistrations registrationDeadline isFeatured imageUrl organizerId status requiresRegistration registrationFormLink featureOptions registrations createdAt updatedAt')
        .populate('organizerId', 'name email')
        .sort({ 'featureOptions.navOrder': 1, createdAt: -1 });
      
      // Update status for each event based on current date/time (only if not cancelled)
      for (const event of events) {
        if (event.status !== 'cancelled') {
          const calculatedStatus = event.calculateStatus();
          if (calculatedStatus !== event.status) {
            event.status = calculatedStatus;
            await event.save();
          }
        }
      }

      // Get news with showInNav: true
      const news = await News.find({ 'featureOptions.showInNav': true })
        .select('_id title content excerpt categoryId authorId featuredImageUrl tags isFeatured isPublished publishedAt viewCount featureOptions application createdAt updatedAt')
        .populate('categoryId', 'name')
        .populate('authorId', 'name email')
        .sort({ 'featureOptions.navOrder': 1, createdAt: -1 });

      // Format events for navigation
      const formattedEvents = events.map(event => ({
        id: event._id,
        type: 'event',
        title: event.title,
        description: event.description,
        category: event.category,
        eventType: event.type, // 'workshop', 'seminar', 'exhibition', etc.
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        maxCapacity: event.maxCapacity,
        currentRegistrations: event.currentRegistrations,
        registrationDeadline: event.registrationDeadline,
        isFeatured: event.isFeatured,
        imageUrl: event.imageUrl,
        organizer: event.organizerId ? {
          id: event.organizerId._id,
          name: event.organizerId.name,
          email: event.organizerId.email
        } : null,
        status: event.status, // 'upcoming', 'ongoing', 'completed', 'cancelled'
        requiresRegistration: event.requiresRegistration,
        registrationFormLink: event.registrationFormLink,
        featureOptions: event.featureOptions,
        registrations: event.registrations.map(reg => ({
          userId: reg.userId,
          registrationDate: reg.registrationDate,
          attendanceStatus: reg.attendanceStatus
        })),
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      }));

      // Format news for navigation
      const formattedNews = news.map(newsItem => ({
        id: newsItem._id,
        type: 'news',
        title: newsItem.title,
        content: newsItem.content,
        excerpt: newsItem.excerpt,
        category: newsItem.categoryId ? {
          id: newsItem.categoryId._id,
          name: newsItem.categoryId.name
        } : null,
        author: newsItem.authorId ? {
          id: newsItem.authorId._id,
          name: newsItem.authorId.name,
          email: newsItem.authorId.email
        } : null,
        featuredImageUrl: newsItem.featuredImageUrl,
        tags: newsItem.tags,
        isFeatured: newsItem.isFeatured,
        isPublished: newsItem.isPublished,
        publishedAt: newsItem.publishedAt,
        viewCount: newsItem.viewCount,
        featureOptions: newsItem.featureOptions,
        application: newsItem.application ? {
          isEnabled: newsItem.application.isEnabled,
          type: newsItem.application.type, // 'workshop', 'event', 'competition', 'other'
          requireLogin: newsItem.application.requireLogin,
          formApplyStartDate: newsItem.application.formApplyStartDate,
          formApplyLastDate: newsItem.application.formApplyLastDate,
          maxApplicants: newsItem.application.maxApplicants,
          formLink: newsItem.application.formLink,
          status: newsItem.application.status, // 'active', 'expired', 'not_started'
          targetType: newsItem.application.targetType, // 'Workshop', 'Event', 'Competition', 'Other'
          targetId: newsItem.application.targetId
        } : null,
        createdAt: newsItem.createdAt,
        updatedAt: newsItem.updatedAt
      }));

      // Combine and sort by navOrder
      const navigationItems = [...formattedEvents, ...formattedNews]
        .sort((a, b) => {
          const orderA = a.featureOptions?.navOrder || 0;
          const orderB = b.featureOptions?.navOrder || 0;
          return orderA - orderB;
        });

      res.json({
        success: true,
        data: {
          items: navigationItems,
          total: navigationItems.length,
          eventsCount: formattedEvents.length,
          newsCount: formattedNews.length
        }
      });
    } catch (error) {
      console.error('Navigation API Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch navigation items',
        error: error.message
      });
    }
  })
);

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
    
    // Update status for each event based on current date/time (only if not cancelled)
    const updatedItems = await Promise.all(items.map(async (item) => {
      if (item.status !== 'cancelled') {
        const calculatedStatus = item.calculateStatus();
        if (calculatedStatus !== item.status) {
          // Only update if status changed to avoid unnecessary saves
          item.status = calculatedStatus;
          await item.save();
        }
      }
      return item;
    }));
    
    res.json({ success: true, data: { items: updatedItems, pagination: { total, limit, skip, hasMore: total > skip + items.length } } });
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
    body('startDate')
      .isISO8601().withMessage('Start date must be a valid ISO8601 date (e.g., 2024-01-15 or 2024-01-15T00:00:00Z)'),
    body('endDate')
      .isISO8601().withMessage('End date must be a valid ISO8601 date (e.g., 2024-01-15 or 2024-01-15T00:00:00Z)'),
    body('startTime')
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .matches(/^([01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/)
      .withMessage('Start time must be in HH:MM or HH:MM:SS format (24-hour, e.g., 14:00 or 14:00:00)'),
    body('endTime')
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .matches(/^([01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/)
      .withMessage('End time must be in HH:MM or HH:MM:SS format (24-hour, e.g., 17:00 or 17:00:00)'),
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
    
    // Ensure endDate is not before startDate
    const { startDate, endDate, startTime, endTime } = req.body;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // If both dates are the same day and times are provided, validate time relationship
      if (start.toDateString() === end.toDateString() && startTime && endTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const startTimeMinutes = startHour * 60 + startMin;
        const endTimeMinutes = endHour * 60 + endMin;
        
        if (endTimeMinutes < startTimeMinutes) {
          return res.status(400).json({
            success: false,
            message: 'End time must be after start time when both dates are the same'
          });
        }
      }
      
      if (end < start) {
        return res.status(400).json({
          success: false,
          message: 'End date must be the same as or after start date'
        });
      }
    }
    
    // Normalize and trim time fields
    let normalizedStartTime = startTime;
    let normalizedEndTime = endTime;
    
    if (startTime !== undefined) {
      if (typeof startTime === 'string') {
        const trimmed = startTime.trim();
        normalizedStartTime = trimmed === '' ? null : trimmed;
      } else if (startTime === null || startTime === '') {
        normalizedStartTime = null;
      }
    }
    
    if (endTime !== undefined) {
      if (typeof endTime === 'string') {
        const trimmed = endTime.trim();
        normalizedEndTime = trimmed === '' ? null : trimmed;
      } else if (endTime === null || endTime === '') {
        normalizedEndTime = null;
      }
    }
    
    // If startTime is provided, endTime should also be provided (and vice versa for consistency)
    if ((normalizedStartTime && !normalizedEndTime) || (!normalizedStartTime && normalizedEndTime)) {
      return res.status(400).json({
        success: false,
        message: 'Both start time and end time must be provided together, or neither'
      });
    }
    
    // Update request body with normalized values
    if (normalizedStartTime !== undefined) req.body.startTime = normalizedStartTime;
    if (normalizedEndTime !== undefined) req.body.endTime = normalizedEndTime;
    
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
    
    // Ensure time fields are explicitly set before creating
    const eventData = { ...req.body };
    if (req.body.startTime !== undefined) {
      eventData.startTime = req.body.startTime || null;
    }
    if (req.body.endTime !== undefined) {
      eventData.endTime = req.body.endTime || null;
    }
    
    const created = await Event.create(eventData);
    
    // Convert to object and explicitly include time fields
    const createdObj = created.toObject();
    createdObj.startTime = created.startTime;
    createdObj.endTime = created.endTime;
    
    res.status(201).json({ success: true, message: 'Event created', data: { item: createdObj } });
  })
);

router.put('/:id', verifyToken, requireMentor, [
  param('id').isString(),
  body('startDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Start date must be a valid ISO8601 date (e.g., 2024-01-15 or 2024-01-15T00:00:00Z)'),
  body('endDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('End date must be a valid ISO8601 date (e.g., 2024-01-15 or 2024-01-15T00:00:00Z)'),
  body('startTime')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null) return true;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return true; // Allow empty string to clear
        const timePattern = /^([01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/;
        return timePattern.test(trimmed);
      }
      return false;
    })
    .withMessage('Start time must be in HH:MM or HH:MM:SS format (24-hour, e.g., 14:00 or 14:00:00), or empty string to clear'),
  body('endTime')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null) return true;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed === '') return true; // Allow empty string to clear
        const timePattern = /^([01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/;
        return timePattern.test(trimmed);
      }
      return false;
    })
    .withMessage('End time must be in HH:MM or HH:MM:SS format (24-hour, e.g., 17:00 or 17:00:00), or empty string to clear'),
  body('requiresRegistration').optional().isBoolean().toBoolean(),
  body('registrationFormLink').optional().isString().isLength({ max: 500 }),
  body('registrationDeadline').optional({ checkFalsy: true }).isISO8601().withMessage('Registration deadline must be a valid ISO8601 date'),
  body('featureOptions.showInNav').optional().isBoolean().toBoolean(),
  body('featureOptions.navLabel').optional({ checkFalsy: true }).isString().isLength({ min: 2, max: 50 }),
  body('featureOptions.navOrder').optional().isInt({ min: 0 }).toInt(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw validationErrorHandler(errors);
  
  // For partial updates, ensure endDate is not before startDate
  const existing = await Event.findById(req.params.id);
  if (!existing) throw notFoundErrorHandler('Event');
  const nextStart = req.body.startDate ? new Date(req.body.startDate) : new Date(existing.startDate);
  const nextEnd = req.body.endDate ? new Date(req.body.endDate) : new Date(existing.endDate);
  // Normalize and trim time fields
  if (req.body.startTime !== undefined) {
    if (typeof req.body.startTime === 'string') {
      const trimmed = req.body.startTime.trim();
      req.body.startTime = trimmed === '' ? null : trimmed;
    } else if (req.body.startTime === null || req.body.startTime === '') {
      req.body.startTime = null;
    }
  }
  if (req.body.endTime !== undefined) {
    if (typeof req.body.endTime === 'string') {
      const trimmed = req.body.endTime.trim();
      req.body.endTime = trimmed === '' ? null : trimmed;
    } else if (req.body.endTime === null || req.body.endTime === '') {
      req.body.endTime = null;
    }
  }
  
  const nextStartTime = req.body.startTime !== undefined ? req.body.startTime : existing.startTime;
  const nextEndTime = req.body.endTime !== undefined ? req.body.endTime : existing.endTime;
  
  // If both dates are the same day and times are provided, validate time relationship
  if (nextStart.toDateString() === nextEnd.toDateString() && nextStartTime && nextEndTime) {
    const [startHour, startMin] = nextStartTime.split(':').map(Number);
    const [endHour, endMin] = nextEndTime.split(':').map(Number);
    const startTimeMinutes = startHour * 60 + startMin;
    const endTimeMinutes = endHour * 60 + endMin;
    
    if (endTimeMinutes < startTimeMinutes) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time when both dates are the same'
      });
    }
  }
  
  if (nextEnd < nextStart) {
    return res.status(400).json({
      success: false,
      message: 'End date must be the same as or after start date'
    });
  }
  
  // If startTime is provided, endTime should also be provided (and vice versa for consistency)
  // Only validate if one is being updated (not when both are undefined/null)
  const isUpdatingStartTime = req.body.startTime !== undefined;
  const isUpdatingEndTime = req.body.endTime !== undefined;
  if (isUpdatingStartTime || isUpdatingEndTime) {
    const finalStartTime = nextStartTime || null;
    const finalEndTime = nextEndTime || null;
    if ((finalStartTime && !finalEndTime) || (!finalStartTime && finalEndTime)) {
      return res.status(400).json({
        success: false,
        message: 'Both start time and end time must be provided together, or neither'
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
  
  // Prepare update data, but exclude status unless it's being set to 'cancelled'
  // This ensures status is always calculated based on dates/times (unless cancelled)
  const updateData = { ...req.body };
  const preserveCancelled = req.body.status === 'cancelled' || existing.status === 'cancelled';
  
  // If status is not being set to 'cancelled', don't include it in update
  // The pre-save hook will recalculate it based on dates/times
  if (updateData.status !== undefined && updateData.status !== 'cancelled') {
    delete updateData.status;
  }
  
  // Update the existing document directly to ensure all fields are saved
  // This approach ensures mongoose properly handles new optional fields
  // Use Object.assign to merge updates, which handles nested objects correctly
  Object.assign(existing, updateData);
  
  // Explicitly ensure time fields are set if provided (even if null)
  // This is important for new fields that might not exist in old documents
  if (req.body.startTime !== undefined) {
    existing.set('startTime', req.body.startTime);
  }
  if (req.body.endTime !== undefined) {
    existing.set('endTime', req.body.endTime);
  }
  
  // If preserving cancelled status, set it explicitly
  if (preserveCancelled) {
    existing.status = 'cancelled';
  }
  
  // Save the document - this will persist all changes including new optional fields
  // The pre-save hook will automatically recalculate status based on dates/times
  // unless status is explicitly 'cancelled'
  await existing.save();
  
  // Fetch the updated document to ensure we have all fields
  const updated = await Event.findById(req.params.id);
  if (!updated) throw notFoundErrorHandler('Event');
  
  // Convert to object and explicitly include time fields
  const updatedObj = updated.toObject();
  updatedObj.startTime = updated.startTime;
  updatedObj.endTime = updated.endTime;
  
  res.json({ success: true, message: 'Event updated', data: { item: updatedObj } });
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
  
  // Update status if not cancelled
  if (item.status !== 'cancelled') {
    const calculatedStatus = item.calculateStatus();
    if (calculatedStatus !== item.status) {
      item.status = calculatedStatus;
      await item.save();
    }
  }
  
  // Convert to object and explicitly include time fields
  const itemObj = item.toObject();
  itemObj.startTime = item.startTime;
  itemObj.endTime = item.endTime;
  
  res.json({ success: true, data: { item: itemObj } });
}));

module.exports = router;
