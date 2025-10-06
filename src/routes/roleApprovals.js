const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { asyncHandler, validationErrorHandler, notFoundErrorHandler } = require('../middleware/errorHandler');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const RoleApproval = require('../models/RoleApproval');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Derive enums from schema so router stays in sync
const ROLE_ENUM = (RoleApproval.schema.path('allowedRoles').caster && RoleApproval.schema.path('allowedRoles').caster.enumValues) || ['student', 'team_member', 'mentor', 'researcher', 'community', 'admin'];
const SUBROLE_ENUM = (RoleApproval.schema.path('allowedSubroles') && RoleApproval.schema.path('allowedSubroles').caster && RoleApproval.schema.path('allowedSubroles').caster.enumValues) || [];

const upsertValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('allowedRoles')
    .isArray({ min: 1 })
    .withMessage('allowedRoles must be a non-empty array'),
  body('allowedRoles.*')
    .isIn(ROLE_ENUM)
    .withMessage('Invalid role value in allowedRoles'),
  body('allowedSubroles')
    .optional()
    .isArray()
    .withMessage('allowedSubroles must be an array when provided'),
  body('allowedSubroles.*')
    .optional()
    .custom((val) => SUBROLE_ENUM.includes(val))
    .withMessage('Invalid subrole value in allowedSubroles'),
  body('note')
    .optional()
    .isString()
    .isLength({ max: 500 })
];

// @route   GET /api/role-approvals
// @desc    List all role approvals
// @access  Private (Admin)
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const approvals = await RoleApproval.find().sort({ email: 1 });
  res.json({ success: true, data: { approvals } });
}));

// @route   GET /api/role-approvals/:email
// @desc    Get role approval by email
// @access  Private (Admin)
router.get('/:email', requireAdmin, asyncHandler(async (req, res) => {
  const email = req.params.email.toLowerCase();
  const approval = await RoleApproval.findOne({ email });
  if (!approval) {
    throw notFoundErrorHandler('RoleApproval');
  }
  res.json({ success: true, data: { approval } });
}));

// @route   POST /api/role-approvals
// @desc    Create or update role approval for email
// @access  Private (Admin)
router.post('/', requireAdmin, upsertValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors);
  }

  const { email, allowedRoles, allowedSubroles, note } = req.body;
  const update = {
    email: email.toLowerCase(),
    allowedRoles: Array.from(new Set(allowedRoles)),
    ...(Array.isArray(allowedSubroles) ? { allowedSubroles: Array.from(new Set(allowedSubroles)) } : {}),
    note,
    updatedBy: req.user?.id,
  };

  const approval = await RoleApproval.findOneAndUpdate(
    { email: update.email },
    { $set: update, $setOnInsert: { createdBy: req.user?.id, isActive: true } },
    { upsert: true, new: true }
  );

  res.status(201).json({ success: true, message: 'Role approval saved', data: { approval } });
}));

// @route   DELETE /api/role-approvals/:email
// @desc    Delete role approval
// @access  Private (Admin)
router.delete('/:email', requireAdmin, asyncHandler(async (req, res) => {
  const email = req.params.email.toLowerCase();
  const approval = await RoleApproval.findOneAndDelete({ email });
  if (!approval) {
    throw notFoundErrorHandler('RoleApproval');
  }
  res.json({ success: true, message: 'Role approval removed' });
}));

// @route   GET /api/role-approvals/enums
// @desc    List allowed roles and subroles for the admin UI
// @access  Private (Admin)
router.get('/enums/list', requireAdmin, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      roles: ROLE_ENUM,
      subroles: SUBROLE_ENUM,
      baseRolesForSubroles: ['team_member', 'mentor', 'researcher', 'community'],
    },
  });
}));

module.exports = router;


