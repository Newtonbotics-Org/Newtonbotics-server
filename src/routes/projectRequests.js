const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const { optionalAuth, verifyToken, requireTeamMember, requireMentor, requireAdmin } = require('../middleware/auth');
const ProjectRequest = require('../models/ProjectRequest');
const { sendProjectRequestStatusEmail } = require('../services/emailService');
const User = require('../models/User');
const { asyncHandler, validationErrorHandler, notFoundErrorHandler, authorizationErrorHandler } = require('../middleware/errorHandler');
const { uploadProjectDocument } = require('../utils/upload');

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
      ProjectRequest.find(filter)
        .populate('submittedBy', 'firstName lastName email role')
        .populate('mentorId', 'firstName lastName email role')
        .limit(limit)
        .skip(skip)
        .sort({ submittedAt: -1 }),
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
  const item = await ProjectRequest.findById(req.params.id)
    .populate('submittedBy', 'firstName lastName email role')
    .populate('mentorId', 'firstName lastName email role')
    .populate('teamMembers.userId', 'firstName lastName email role');
  if (!item) throw notFoundErrorHandler('ProjectRequest');
  res.json({ success: true, data: { item } });
}));

// @route   GET /api/project-requests/:id/document
// @desc    Download project request document
// @access  Private (Owner, Mentor, or Admin)
router.get('/:id/document', verifyToken, [param('id').isString()], asyncHandler(async (req, res) => {
  const projectRequest = await ProjectRequest.findById(req.params.id);
  if (!projectRequest) throw notFoundErrorHandler('ProjectRequest');
  
  // Check if document exists (support both local files and Cloudinary URLs)
  if (!projectRequest.document || (!projectRequest.document.path && !projectRequest.document.url && !projectRequest.document.secureUrl && !projectRequest.document.documentUrl)) {
    return res.status(404).json({
      success: false,
      message: 'Document not found for this project request'
    });
  }
  
  // Check if user is the owner, mentor+, or admin
  const isOwner = projectRequest.submittedBy.toString() === req.user.id.toString();
  const isAdmin = req.user.role === 'admin';
  const isMentorOrHigher = ['mentor', 'researcher', 'admin'].includes(req.user.role);
  
  // Admin can always view documents (including approved projects)
  if (isAdmin) {
    // Admin has full access - proceed
  } else {
    // For non-admin users, check basic permissions
    if (!isOwner && !isMentorOrHigher) {
      throw authorizationErrorHandler('Access denied. You can only view documents for your own project requests or need mentor+ privileges');
    }
    
    // For approved projects, additional restrictions for non-admin
    if (projectRequest.status === 'approved' && !isOwner) {
      // Allow mentors to view documents of approved projects
      if (!isMentorOrHigher) {
        throw authorizationErrorHandler('Access denied. Only administrators, owners, or mentors can view documents of approved projects.');
      }
    }
  }
  
  // Handle Cloudinary URL documents - redirect to URL
  if (projectRequest.document.secureUrl || projectRequest.document.url || projectRequest.document.documentUrl) {
    const documentUrl = projectRequest.document.secureUrl || projectRequest.document.url || projectRequest.document.documentUrl;
    return res.redirect(302, documentUrl);
  }
  
  // Handle local file documents
  if (projectRequest.document.path) {
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, '../../', projectRequest.document.path);
    
    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Document file not found on server'
      });
    }
    
    // Send the file
    res.download(filePath, projectRequest.document.originalName || projectRequest.document.documentName || projectRequest.document.filename, (err) => {
      if (err) {
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error downloading file'
          });
        }
      }
    });
  } else {
    return res.status(404).json({
      success: false,
      message: 'Document path or URL not found'
    });
  }
}));

router.post(
  '/',
  verifyToken,
  (req, res, next) => {
    // Handle multer errors before validation
    uploadProjectDocument(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
          error: err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Maximum size is 10MB.' : err.message
        });
      }
      next();
    });
  },
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
    
    // Handle document - supports both Cloudinary (JSON) and local file upload
    if (req.file) {
      // Local file upload via multipart/form-data
      const path = require('path');
      const relativePath = path.relative(path.join(__dirname, '../../'), req.file.path);
      payload.document = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        documentName: req.file.originalname,
        path: relativePath,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bytes: req.file.size,
        documentSize: req.file.size,
        format: path.extname(req.file.originalname).replace('.', ''),
        documentFormat: path.extname(req.file.originalname).replace('.', ''),
        uploadedAt: new Date()
      };
    } else if (req.body.document) {
      // Cloudinary document data from JSON body
      const docData = typeof req.body.document === 'string' ? JSON.parse(req.body.document) : req.body.document;
      payload.document = {
        secureUrl: docData.secureUrl || docData.url,
        url: docData.url || docData.secureUrl,
        publicId: docData.publicId || docData.public_id,
        public_id: docData.public_id || docData.publicId,
        format: docData.format || docData.documentFormat,
        documentFormat: docData.documentFormat || docData.format,
        bytes: docData.bytes || docData.size || docData.documentSize,
        size: docData.size || docData.bytes || docData.documentSize,
        documentSize: docData.documentSize || docData.bytes || docData.size,
        originalName: docData.originalName || docData.documentName,
        documentName: docData.documentName || docData.originalName,
        filename: docData.filename || docData.originalName || docData.documentName,
        mimetype: docData.mimetype || `application/${docData.format || docData.documentFormat}`,
        path: docData.path || docData.url || docData.secureUrl,
        documentUrl: docData.documentUrl || docData.url || docData.secureUrl,
        uploadedAt: docData.uploadedAt ? new Date(docData.uploadedAt) : new Date()
      };
    } else if (req.body.documentUrl) {
      // Support legacy format with separate document fields
      payload.document = {
        secureUrl: req.body.documentUrl,
        url: req.body.documentUrl,
        documentUrl: req.body.documentUrl,
        originalName: req.body.documentName || 'document',
        documentName: req.body.documentName || 'document',
        filename: req.body.documentName || 'document',
        size: req.body.documentSize || 0,
        bytes: req.body.documentSize || 0,
        documentSize: req.body.documentSize || 0,
        format: req.body.documentFormat || 'pdf',
        documentFormat: req.body.documentFormat || 'pdf',
        mimetype: `application/${req.body.documentFormat || 'pdf'}`,
        path: req.body.documentUrl,
        uploadedAt: new Date()
      };
      // Remove separate document fields from payload to avoid duplication
      delete payload.documentUrl;
      delete payload.documentName;
      delete payload.documentSize;
      delete payload.documentFormat;
    }
    
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
router.put('/:id', verifyToken, [param('id').isString()], 
  (req, res, next) => {
    // Handle optional file upload
    uploadProjectDocument(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
          error: err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Maximum size is 10MB.' : err.message
        });
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    const projectRequest = await ProjectRequest.findById(req.params.id);
    if (!projectRequest) throw notFoundErrorHandler('ProjectRequest');
    
    // Check user roles
    const isOwner = projectRequest.submittedBy.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';
    const isMentorOrHigher = ['mentor', 'researcher', 'admin'].includes(req.user.role);
    
    // CRITICAL: If project is approved, ONLY admin can make updates
    if (projectRequest.status === 'approved' && !isAdmin) {
      throw authorizationErrorHandler('Cannot update approved project requests. Only administrators can modify approved projects.');
    }
    
    // Admin can always update (including status changes on approved projects)
    if (isAdmin) {
      // Admin has full access - proceed with update
    } else {
      // For non-admin users, check basic permissions
      if (!isOwner && !isMentorOrHigher) {
        throw authorizationErrorHandler('Access denied. You can only update your own project requests or need mentor+ privileges');
      }
      
      // If user is owner (but not admin), restrict updates based on status
      if (isOwner && !isMentorOrHigher) {
        if (projectRequest.status === 'rejected') {
          throw authorizationErrorHandler('Cannot update rejected project requests. Please create a new request.');
        }
      }
    }
    
    // Track changes for audit trail
    const changes = [];
    const updateData = { ...req.body };
    
    // Handle document update - supports both Cloudinary (JSON) and local file upload
    if (req.file) {
      // Local file upload via multipart/form-data
      const fs = require('fs');
      const path = require('path');
      
      // Delete old document file if it exists (only for local files)
      if (projectRequest.document && projectRequest.document.path && !projectRequest.document.url) {
        const oldFilePath = path.join(__dirname, '../../', projectRequest.document.path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      // Store relative path from project root for easier access
      const relativePath = path.relative(path.join(__dirname, '../../'), req.file.path);
      updateData.document = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        documentName: req.file.originalname,
        path: relativePath,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bytes: req.file.size,
        documentSize: req.file.size,
        format: path.extname(req.file.originalname).replace('.', ''),
        documentFormat: path.extname(req.file.originalname).replace('.', ''),
        uploadedAt: new Date()
      };
    } else if (req.body.document) {
      // Cloudinary document data from JSON body
      const docData = typeof req.body.document === 'string' ? JSON.parse(req.body.document) : req.body.document;
      updateData.document = {
        secureUrl: docData.secureUrl || docData.url,
        url: docData.url || docData.secureUrl,
        publicId: docData.publicId || docData.public_id,
        public_id: docData.public_id || docData.publicId,
        format: docData.format || docData.documentFormat,
        documentFormat: docData.documentFormat || docData.format,
        bytes: docData.bytes || docData.size || docData.documentSize,
        size: docData.size || docData.bytes || docData.documentSize,
        documentSize: docData.documentSize || docData.bytes || docData.size,
        originalName: docData.originalName || docData.documentName,
        documentName: docData.documentName || docData.originalName,
        filename: docData.filename || docData.originalName || docData.documentName,
        mimetype: docData.mimetype || `application/${docData.format || docData.documentFormat}`,
        path: docData.path || docData.url || docData.secureUrl,
        documentUrl: docData.documentUrl || docData.url || docData.secureUrl,
        uploadedAt: docData.uploadedAt ? new Date(docData.uploadedAt) : new Date()
      };
    } else if (req.body.documentUrl) {
      // Support legacy format with separate document fields
      updateData.document = {
        secureUrl: req.body.documentUrl,
        url: req.body.documentUrl,
        documentUrl: req.body.documentUrl,
        originalName: req.body.documentName || 'document',
        documentName: req.body.documentName || 'document',
        filename: req.body.documentName || 'document',
        size: req.body.documentSize || 0,
        bytes: req.body.documentSize || 0,
        documentSize: req.body.documentSize || 0,
        format: req.body.documentFormat || 'pdf',
        documentFormat: req.body.documentFormat || 'pdf',
        mimetype: `application/${req.body.documentFormat || 'pdf'}`,
        path: req.body.documentUrl,
        uploadedAt: new Date()
      };
      // Remove separate document fields from updateData to avoid duplication
      delete updateData.documentUrl;
      delete updateData.documentName;
      delete updateData.documentSize;
      delete updateData.documentFormat;
    }
    
    // Special handling for status updates: Admin can always update status, even on approved projects
    const isStatusUpdate = updateData.status !== undefined && updateData.status !== projectRequest.status;
    
    // If updating status on an approved project, only admin can do this
    if (isStatusUpdate && projectRequest.status === 'approved' && !isAdmin) {
      throw authorizationErrorHandler('Cannot change status of approved project requests. Only administrators can modify the status of approved projects.');
    }
    
    // Compare each field and track changes
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && JSON.stringify(projectRequest[key]) !== JSON.stringify(updateData[key])) {
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
  })
);

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
