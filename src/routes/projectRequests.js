const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const { optionalAuth, verifyToken, requireTeamMember, requireMentor, requireAdmin } = require('../middleware/auth');
const ProjectRequest = require('../models/ProjectRequest');
const { sendProjectRequestStatusEmail } = require('../services/emailService');
const User = require('../models/User');
const { asyncHandler, validationErrorHandler, notFoundErrorHandler, authorizationErrorHandler } = require('../middleware/errorHandler');

// Project requests routes - allows any authenticated user to submit project ideas
// - GET /api/project-requests - List project requests
// - GET /api/project-requests/:id - Get project request details
// - GET /api/project-requests/my-requests - Get current user's project requests
// - POST /api/project-requests - Create project request (any authenticated user)
// - PUT /api/project-requests/:id - Update project request (owner or mentor+)
// - DELETE /api/project-requests/:id - Delete project request (owner or admin)
// - POST /api/project-requests/:id/approve - Approve project request (mentors only)
// - POST /api/project-requests/:id/reject - Reject project request (mentors only)
// - GET /api/project-requests/:id/audit-trail - Get audit trail for specific request (owner or admin)
// - GET /api/project-requests/audit-trails/all - Get all audit trails (admin only)
// - GET /api/project-requests/deleted - Get all deleted project requests (admin only)

router.get(
  '/',
  optionalAuth,
  [
    query('status').optional().isIn(['pending', 'under_review', 'approved', 'rejected', 'on_hold']),
    query('mentorId').optional().isString(),
    query('submittedBy').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    const { status, mentorId, submittedBy, limit = 20, skip = 0 } = req.query;
    const filter = { isDeleted: { $ne: true } }; // Exclude soft-deleted records
    if (status) filter.status = status;
    if (mentorId) filter.mentorId = mentorId;
    if (submittedBy) filter.submittedBy = submittedBy;
    const [items, total] = await Promise.all([
      ProjectRequest.find(filter).limit(limit).skip(skip).sort({ submittedAt: -1 }),
      ProjectRequest.countDocuments(filter),
    ]);
    res.json({ success: true, data: { items, pagination: { total, limit, skip, hasMore: total > skip + items.length } } });
  })
);

// @route   GET /api/project-requests/my-requests
// @desc    Get current user's project requests
// @access  Private
router.get('/my-requests', verifyToken, [
  query('status').optional().isIn(['pending', 'under_review', 'approved', 'rejected', 'on_hold']),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('skip').optional().isInt({ min: 0 }).toInt(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw validationErrorHandler(errors);
  
  const { status, limit = 20, skip = 0 } = req.query;
  const filter = { submittedBy: req.user.id, isDeleted: { $ne: true } }; // Exclude soft-deleted records
  
  if (status) filter.status = status;
  
  const [items, total] = await Promise.all([
    ProjectRequest.find(filter)
      .populate('mentorId', 'firstName lastName email role')
      .populate('teamMembers.userId', 'firstName lastName email role')
      .limit(limit)
      .skip(skip)
      .sort({ submittedAt: -1 }),
    ProjectRequest.countDocuments(filter),
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
}));

// @route   GET /api/project-requests/deleted
// @desc    Get all deleted project requests (admin only)
// @access  Private (Admin)
router.get('/deleted', verifyToken, requireAdmin, [
  query('status').optional().isIn(['pending', 'under_review', 'approved', 'rejected', 'on_hold']),
  query('submittedBy').optional().isString(),
  query('deletedBy').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('skip').optional().isInt({ min: 0 }).toInt(),
  query('sortBy').optional().isIn(['deletedAt', 'submittedAt', 'title']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw validationErrorHandler(errors);
  
  const { 
    status, 
    submittedBy, 
    deletedBy, 
    limit = 20, 
    skip = 0, 
    sortBy = 'deletedAt', 
    sortOrder = 'desc' 
  } = req.query;
  
  // Build filter for deleted projects
  const filter = { isDeleted: true };
  
  if (status) filter.status = status;
  if (submittedBy) filter.submittedBy = submittedBy;
  if (deletedBy) filter.deletedBy = deletedBy;
  
  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  
  const [items, total] = await Promise.all([
    ProjectRequest.find(filter)
      .populate('submittedBy', 'firstName lastName email role')
      .populate('deletedBy', 'firstName lastName email role')
      .populate('mentorId', 'firstName lastName email role')
      .populate('teamMembers.userId', 'firstName lastName email role')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort(sort),
    ProjectRequest.countDocuments(filter),
  ]);
  
  res.json({ 
    success: true, 
    data: { 
      items, 
      pagination: { 
        total, 
        limit: parseInt(limit), 
        skip: parseInt(skip), 
        hasMore: total > parseInt(skip) + items.length 
      } 
    } 
  });
}));

router.get('/:id', [param('id').isString()], asyncHandler(async (req, res) => {
  const item = await ProjectRequest.findById(req.params.id);
  if (!item) throw notFoundErrorHandler('ProjectRequest');
  res.json({ success: true, data: { item } });
}));

router.post(
  '/',
  verifyToken,
  [
    body('title').isString().isLength({ min: 5, max: 255 }),
    body('description').isString().isLength({ min: 20, max: 5000 }),
    body('teamSize').isInt({ min: 1, max: 20 }).toInt(),
    body('estimatedDurationMonths').isInt({ min: 1, max: 24 }).toInt(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    const payload = { ...req.body, submittedBy: req.user.id, submittedAt: new Date() };
    const created = await ProjectRequest.create(payload);
    
    // Add audit trail entry for creation
    created.addAuditEntry('created', req.user.id, {
      field: 'project_request',
      oldValue: null,
      newValue: 'Project request created'
    }, 'Initial project request submission', req);
    await created.save();
    
    res.status(201).json({ success: true, message: 'Project request created', data: { item: created } });
  })
);

// @route   PUT /api/project-requests/:id
// @desc    Update project request (owner or mentor+)
// @access  Private (Owner or Mentor+)
router.put('/:id', verifyToken, [param('id').isString()], asyncHandler(async (req, res) => {
  const projectRequest = await ProjectRequest.findById(req.params.id);
  if (!projectRequest) throw notFoundErrorHandler('ProjectRequest');
  
  // Check if user is the owner or has mentor+ privileges
  const isOwner = projectRequest.submittedBy.toString() === req.user.id.toString();
  const isMentorOrHigher = ['mentor', 'researcher', 'admin'].includes(req.user.role);
  
  if (!isOwner && !isMentorOrHigher) {
    throw authorizationErrorHandler('Access denied. You can only update your own project requests or need mentor+ privileges');
  }
  
  // If user is owner, restrict updates based on status
  if (isOwner && !isMentorOrHigher) {
    if (projectRequest.status === 'approved') {
      throw authorizationErrorHandler('Cannot update approved project requests');
    }
    if (projectRequest.status === 'rejected') {
      throw authorizationErrorHandler('Cannot update rejected project requests. Please create a new request.');
    }
  }
  
  // Track changes for audit trail
  const changes = [];
  const updateData = { ...req.body };
  
  // Compare each field and track changes
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined && projectRequest[key] !== updateData[key]) {
      changes.push({
        field: key,
        oldValue: projectRequest[key],
        newValue: updateData[key]
      });
    }
  });
  
  // Update the project request
  Object.assign(projectRequest, updateData);
  
  // Add audit trail entries for each change
  if (changes.length > 0) {
    changes.forEach(change => {
      projectRequest.addAuditEntry('updated', req.user.id, change, 
        `Updated ${change.field}`, req);
    });
  }
  
  await projectRequest.save();
  
  res.json({ success: true, message: 'Project request updated', data: { item: projectRequest } });
}));

router.post('/:id/approve', verifyToken, requireMentor, async (req, res) => {
  const pr = await ProjectRequest.findById(req.params.id);
  if (!pr) return res.status(404).json({ success: false, message: 'Request not found' });
  
  const oldStatus = pr.status;
  pr.status = 'approved';
  pr.approvalDate = new Date();
  
  // Add audit trail entry for approval
  pr.addAuditEntry('approved', req.user.id, {
    field: 'status',
    oldValue: oldStatus,
    newValue: 'approved'
  }, req.body.reason || 'Project request approved', req);
  
  await pr.save();
  
  try {
    const submitter = await User.findById(pr.submittedBy);
    await sendProjectRequestStatusEmail({ request: pr.toObject(), newStatus: 'approved', recipientEmail: submitter?.email });
  } catch (_) {}
  res.json({ success: true, message: 'Request approved', data: { request: pr } });
});

router.post('/:id/reject', verifyToken, requireMentor, async (req, res) => {
  const pr = await ProjectRequest.findById(req.params.id);
  if (!pr) return res.status(404).json({ success: false, message: 'Request not found' });
  
  const oldStatus = pr.status;
  pr.status = 'rejected';
  pr.reviewedAt = new Date();
  pr.reviewNotes = req.body?.reason;
  
  // Add audit trail entry for rejection
  pr.addAuditEntry('rejected', req.user.id, {
    field: 'status',
    oldValue: oldStatus,
    newValue: 'rejected'
  }, req.body?.reason || 'Project request rejected', req);
  
  await pr.save();
  
  try {
    const submitter = await User.findById(pr.submittedBy);
    await sendProjectRequestStatusEmail({ request: pr.toObject(), newStatus: 'rejected', recipientEmail: submitter?.email });
  } catch (_) {}
  res.json({ success: true, message: 'Request rejected', data: { request: pr } });
});

// @route   DELETE /api/project-requests/:id
// @desc    Delete project request (owner or admin)
// @access  Private (Owner or Admin)
router.delete('/:id', verifyToken, [param('id').isString()], asyncHandler(async (req, res) => {
  const projectRequest = await ProjectRequest.findById(req.params.id);
  if (!projectRequest) throw notFoundErrorHandler('ProjectRequest');
  
  // Check if user is the owner or admin
  const isOwner = projectRequest.submittedBy.toString() === req.user.id.toString();
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    throw authorizationErrorHandler('Access denied. You can only delete your own project requests or need admin privileges');
  }
  
  // If user is owner, restrict deletion based on status
  if (isOwner && !isAdmin) {
    if (projectRequest.status === 'approved') {
      throw authorizationErrorHandler('Cannot delete approved project requests. Contact admin if needed.');
    }
    if (projectRequest.status === 'under_review') {
      throw authorizationErrorHandler('Cannot delete project requests under review. Contact mentor to withdraw.');
    }
  }
  
  // Add audit trail entry for deletion
  projectRequest.addAuditEntry('deleted', req.user.id, {
    field: 'project_request',
    oldValue: projectRequest.title,
    newValue: null
  }, req.body.reason || 'Project request deleted', req);
  
  await projectRequest.save();
  
  // Soft delete - mark as deleted instead of removing
  projectRequest.isDeleted = true;
  projectRequest.deletedAt = new Date();
  projectRequest.deletedBy = req.user.id;
  await projectRequest.save();
  
  res.json({ success: true, message: 'Project request deleted' });
}));

// @route   GET /api/project-requests/:id/audit-trail
// @desc    Get audit trail for a specific project request
// @access  Private (Owner or Admin)
router.get('/:id/audit-trail', verifyToken, [param('id').isString()], asyncHandler(async (req, res) => {
  const projectRequest = await ProjectRequest.findById(req.params.id)
    .populate('auditTrail.performedBy', 'firstName lastName email role');
  
  if (!projectRequest) throw notFoundErrorHandler('ProjectRequest');
  
  // Check if user is the owner or admin
  const isOwner = projectRequest.submittedBy.toString() === req.user.id.toString();
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    throw authorizationErrorHandler('Access denied. You can only view audit trail for your own project requests or need admin privileges');
  }
  
  const auditTrail = projectRequest.getAuditTrail();
  
  res.json({ 
    success: true, 
    data: { 
      projectRequestId: req.params.id,
      projectTitle: projectRequest.title,
      auditTrail 
    } 
  });
}));

// @route   GET /api/project-requests/audit-trails/all
// @desc    Get all audit trails (admin only)
// @access  Private (Admin)
router.get('/audit-trails/all', verifyToken, requireAdmin, [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('skip').optional().isInt({ min: 0 }).toInt(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw validationErrorHandler(errors);
  
  const { limit = 50, skip = 0 } = req.query;
  
  const projectRequests = await ProjectRequest.getAllAuditTrails(parseInt(limit), parseInt(skip));
  
  res.json({ 
    success: true, 
    data: { 
      projectRequests,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    } 
  });
}));

module.exports = router;
