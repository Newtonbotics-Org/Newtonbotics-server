const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Subrole = require('../models/Subrole');
const User = require('../models/User');
const { 
  asyncHandler, 
  validationErrorHandler,
  authorizationErrorHandler,
  notFoundErrorHandler,
  conflictErrorHandler,
} = require('../middleware/errorHandler');
const { 
  verifyToken, 
  requireAdmin 
} = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Validation rules
const createSubroleValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-z_]+$/)
    .withMessage('Name can only contain lowercase letters and underscores'),
  
  body('displayName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Display name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('category')
    .isIn([
      'management_leadership',
      'financial_administrative', 
      'technical_specializations',
      'lab_operations',
      'communication_outreach',
      'event_workshop_management',
      'research_publication',
      'industry_partnerships',
      'student_support',
      'special_designations'
    ])
    .withMessage('Invalid category'),
  
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),
  
  body('permissions.*')
    .optional()
    .isIn([
      'read:projects', 'write:projects', 'delete:projects', 'manage:projects',
      'read:workshops', 'write:workshops', 'delete:workshops',
      'read:events', 'write:events', 'delete:events',
      'read:inventory', 'write:inventory', 'delete:inventory', 'manage:inventory',
      'read:requests', 'write:requests', 'approve:requests',
      'read:news', 'write:news', 'delete:news',
      'read:media', 'write:media', 'delete:media',
      'read:users', 'write:users', 'delete:users',
      'manage:finance',
      'manage:system', 'system:admin'
    ])
    .withMessage('Invalid permission value'),
  
  body('priority')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Priority must be a non-negative integer')
];

const updateSubroleValidation = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Display name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('category')
    .optional()
    .isIn([
      'management_leadership',
      'financial_administrative', 
      'technical_specializations',
      'lab_operations',
      'communication_outreach',
      'event_workshop_management',
      'research_publication',
      'industry_partnerships',
      'student_support',
      'special_designations'
    ])
    .withMessage('Invalid category'),
  
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),
  
  body('permissions.*')
    .optional()
    .isIn([
      'read:projects', 'write:projects', 'delete:projects', 'manage:projects',
      'read:workshops', 'write:workshops', 'delete:workshops',
      'read:events', 'write:events', 'delete:events',
      'read:inventory', 'write:inventory', 'delete:inventory', 'manage:inventory',
      'read:requests', 'write:requests', 'approve:requests',
      'read:news', 'write:news', 'delete:news',
      'read:media', 'write:media', 'delete:media',
      'read:users', 'write:users', 'delete:users',
      'manage:finance',
      'manage:system', 'system:admin'
    ])
    .withMessage('Invalid permission value'),
  
  body('priority')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Priority must be a non-negative integer'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const searchValidation = [
  query('category')
    .optional()
    .isIn([
      'management_leadership',
      'financial_administrative', 
      'technical_specializations',
      'lab_operations',
      'communication_outreach',
      'event_workshop_management',
      'research_publication',
      'industry_partnerships',
      'student_support',
      'special_designations'
    ])
    .withMessage('Invalid category'),
  
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer')
];

// @route   GET /api/subroles
// @desc    Get all subroles (admin only)
// @access  Private (Admin)
router.get('/', requireAdmin, searchValidation, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors);
  }

  const { category, isActive, limit = 50, skip = 0 } = req.query;

  // Build search query
  const searchQuery = {};
  
  if (category) {
    searchQuery.category = category;
  }
  
  if (isActive !== undefined) {
    searchQuery.isActive = isActive === 'true';
  }

  // Execute search
  const subroles = await Subrole.find(searchQuery)
    .populate('createdBy', 'firstName lastName email')
    .populate('lastModifiedBy', 'firstName lastName email')
    .sort({ category: 1, priority: -1, displayName: 1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  const total = await Subrole.countDocuments(searchQuery);

  // Log search operation
  logger.info(`Subroles search performed by ${req.user.id}`, {
    filters: { category, isActive },
    results: subroles.length,
    total
  });

  res.json({
    success: true,
    data: {
      subroles,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + subroles.length
      }
    }
  });
}));

// @route   GET /api/subroles/active
// @desc    Get active subroles (for user assignment)
// @access  Private
router.get('/active', asyncHandler(async (req, res) => {
  const subroles = await Subrole.getActiveSubroles();

  res.json({
    success: true,
    data: {
      subroles: subroles.map(subrole => ({
        name: subrole.name,
        displayName: subrole.displayName,
        description: subrole.description,
        category: subrole.category,
        categoryDisplayName: subrole.categoryDisplayName,
        permissions: subrole.permissions,
        priority: subrole.priority
      }))
    }
  });
}));

// @route   GET /api/subroles/categories
// @desc    Get subrole categories
// @access  Private
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = [
    { value: 'management_leadership', displayName: 'Management & Leadership' },
    { value: 'financial_administrative', displayName: 'Financial & Administrative' },
    { value: 'technical_specializations', displayName: 'Technical Specializations' },
    { value: 'lab_operations', displayName: 'Lab Operations' },
    { value: 'communication_outreach', displayName: 'Communication & Outreach' },
    { value: 'event_workshop_management', displayName: 'Event & Workshop Management' },
    { value: 'research_publication', displayName: 'Research & Publication' },
    { value: 'industry_partnerships', displayName: 'Industry & Partnerships' },
    { value: 'student_support', displayName: 'Student Support' },
    { value: 'special_designations', displayName: 'Special Designations' }
  ];

  res.json({
    success: true,
    data: {
      categories
    }
  });
}));

// @route   GET /api/subroles/:id
// @desc    Get subrole by ID (admin only)
// @access  Private (Admin)
router.get('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subrole = await Subrole.findById(id)
    .populate('createdBy', 'firstName lastName email')
    .populate('lastModifiedBy', 'firstName lastName email');
  
  if (!subrole) {
    throw notFoundErrorHandler('Subrole');
  }

  res.json({
    success: true,
    data: {
      subrole
    }
  });
}));

// @route   POST /api/subroles
// @desc    Create new subrole (admin only)
// @access  Private (Admin)
router.post('/', requireAdmin, createSubroleValidation, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors);
  }

  const { name, displayName, description, category, permissions = [], priority = 0 } = req.body;

  // Check if subrole name already exists
  const existingSubrole = await Subrole.findOne({ name });
  if (existingSubrole) {
    throw conflictErrorHandler('Subrole name already exists');
  }

  // Create subrole
  const subrole = new Subrole({
    name,
    displayName,
    description,
    category,
    permissions,
    priority,
    createdBy: req.user.id,
    lastModifiedBy: req.user.id
  });

  await subrole.save();

  // Populate creator information
  await subrole.populate('createdBy', 'firstName lastName email');

  // Log subrole creation
  logger.info(`Subrole created by admin ${req.user.id}`, {
    subroleId: subrole._id,
    subroleName: subrole.name,
    subroleDisplayName: subrole.displayName
  });

  res.status(201).json({
    success: true,
    message: 'Subrole created successfully',
    data: {
      subrole
    }
  });
}));

// @route   PUT /api/subroles/:id
// @desc    Update subrole (admin only)
// @access  Private (Admin)
router.put('/:id', requireAdmin, updateSubroleValidation, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors);
  }

  const { id } = req.params;
  const updateData = { ...req.body };

  const subrole = await Subrole.findById(id);
  
  if (!subrole) {
    throw notFoundErrorHandler('Subrole');
  }

  // Update lastModifiedBy
  updateData.lastModifiedBy = req.user.id;

  // Update subrole
  Object.assign(subrole, updateData);
  await subrole.save();

  // Populate modifier information
  await subrole.populate('lastModifiedBy', 'firstName lastName email');

  // Log subrole update
  logger.info(`Subrole updated by admin ${req.user.id}`, {
    subroleId: id,
    subroleName: subrole.name,
    updatedFields: Object.keys(updateData)
  });

  res.json({
    success: true,
    message: 'Subrole updated successfully',
    data: {
      subrole
    }
  });
}));

// @route   DELETE /api/subroles/:id
// @desc    Delete subrole (admin only) - Soft delete by setting isActive to false
// @access  Private (Admin)
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subrole = await Subrole.findById(id);
  
  if (!subrole) {
    throw notFoundErrorHandler('Subrole');
  }

  // Check if any users are currently assigned this subrole
  const usersWithSubrole = await User.find({ subroles: subrole.name });
  if (usersWithSubrole.length > 0) {
    throw new Error(`Cannot delete subrole "${subrole.displayName}" as it is currently assigned to ${usersWithSubrole.length} user(s). Please reassign users first.`);
  }

  // Soft delete - set isActive to false
  subrole.isActive = false;
  subrole.lastModifiedBy = req.user.id;
  await subrole.save();

  // Log subrole deletion
  logger.info(`Subrole deactivated by admin ${req.user.id}`, {
    subroleId: id,
    subroleName: subrole.name,
    subroleDisplayName: subrole.displayName
  });

  res.json({
    success: true,
    message: 'Subrole deactivated successfully'
  });
}));

// @route   POST /api/subroles/:id/reactivate
// @desc    Reactivate subrole (admin only)
// @access  Private (Admin)
router.post('/:id/reactivate', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subrole = await Subrole.findById(id);
  
  if (!subrole) {
    throw notFoundErrorHandler('Subrole');
  }

  if (subrole.isActive) {
    throw new Error('Subrole is already active');
  }

  // Reactivate subrole
  subrole.isActive = true;
  subrole.lastModifiedBy = req.user.id;
  await subrole.save();

  // Log subrole reactivation
  logger.info(`Subrole reactivated by admin ${req.user.id}`, {
    subroleId: id,
    subroleName: subrole.name,
    subroleDisplayName: subrole.displayName
  });

  res.json({
    success: true,
    message: 'Subrole reactivated successfully'
  });
}));

// @route   POST /api/subroles/seed
// @desc    Seed default subroles (admin only)
// @access  Private (Admin)
router.post('/seed', requireAdmin, asyncHandler(async (req, res) => {
  const seededCount = await Subrole.seedDefaultSubroles(req.user.id);

  res.json({
    success: true,
    message: `Seeded ${seededCount} default subroles`,
    data: {
      seededCount
    }
  });
}));

// @route   GET /api/subroles/:id/users
// @desc    Get users assigned to a specific subrole (admin only)
// @access  Private (Admin)
router.get('/:id/users', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subrole = await Subrole.findById(id);
  
  if (!subrole) {
    throw notFoundErrorHandler('Subrole');
  }

  const users = await User.find({ subroles: subrole.name })
    .select('firstName lastName email role department subroles')
    .sort({ firstName: 1, lastName: 1 });

  res.json({
    success: true,
    data: {
      subrole: {
        id: subrole._id,
        name: subrole.name,
        displayName: subrole.displayName
      },
      users: users.map(user => ({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        department: user.department,
        subroles: user.subroles
      })),
      count: users.length
    }
  });
}));

module.exports = router;
