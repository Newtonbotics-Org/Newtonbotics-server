const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const router = express.Router();
const {
  optionalAuth,
  verifyToken,
  requireTeamMember,
  requireMentor,
  requireAdmin,
  requireProjectTeamMember,
  requireProjectLeaderAccess,
} = require('../middleware/auth');
const { asyncHandler, validationErrorHandler, notFoundErrorHandler } = require('../middleware/errorHandler');
const Project = require('../models/Project');
const User = require('../models/User');
const { sendProjectCreatedNotification, sendProjectStatusChangedEmail } = require('../services/emailService');
const logger = require('../utils/logger');

// Helpers
const ensureObjectId = (id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null);

// GET /api/projects - list with filters
router.get(
  '/',
  optionalAuth,
  [
    query('q').optional().isString().isLength({ min: 1, max: 200 }),
    query('status').optional().isIn(['upcoming', 'ongoing', 'completed', 'on_hold']),
    query('category').optional().isString().isLength({ min: 1, max: 100 }),
    query('mentorId').optional().isString(),
    query('teamLeaderId').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt(),
    query('sort').optional().isIn(['createdAt', 'startDate', 'endDate', 'progress']).default('createdAt'),
    query('order').optional().isIn(['asc', 'desc']).default('desc'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const {
      q,
      status,
      category,
      mentorId,
      teamLeaderId,
      limit = 20,
      skip = 0,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    const filter = {};
    if (q) filter.$text = { $search: q };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (mentorId && ensureObjectId(mentorId)) filter.mentorId = ensureObjectId(mentorId);
    if (teamLeaderId && ensureObjectId(teamLeaderId)) filter.teamLeaderId = ensureObjectId(teamLeaderId);

    const sortSpec = { [sort]: order === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      Project.find(filter)
        .populate('mentorId', 'firstName lastName email role')
        .populate('teamLeaderId', 'firstName lastName email role')
        .populate('teamMembers.userId', 'firstName lastName email role profileImageUrl')
        .limit(limit)
        .skip(skip)
        .sort(sortSpec),
      Project.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        projects: items,
        pagination: { total, limit, skip, hasMore: total > skip + items.length },
      },
    });
  })
);

// GET /api/projects/:id - details
router.get(
  '/:id',
  [param('id').isString()],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const objId = ensureObjectId(id);
    if (!objId) throw notFoundErrorHandler('Project');
    // Atomically increment view count and return updated doc
    const project = await Project.findByIdAndUpdate(
      objId,
      { $inc: { viewCount: 1 } },
      { new: true }
    )
      .populate('mentorId', 'firstName lastName email role')
      .populate('teamLeaderId', 'firstName lastName email role')
      .populate('teamMembers.userId', 'firstName lastName email role profileImageUrl');
    if (!project) throw notFoundErrorHandler('Project');
    res.json({ success: true, data: { project } });
  })
);

// POST /api/projects - create
router.post(
  '/',
  verifyToken,
  [
    body('title').isString().isLength({ min: 5, max: 255 }),
    body('description').isString().isLength({ min: 20, max: 5000 }),
    body('category').optional().isString().isLength({ min: 1, max: 100 }),
    body('status').optional().isIn(['upcoming', 'ongoing', 'completed', 'on_hold']).default('upcoming'),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('budget').optional().isFloat({ min: 0 }),
    body('mentorId').optional().isString(),
    body('teamLeaderId').isString(),
    body('teamMembers').optional().isArray(),
    body('teamMembers.*.userId').optional().isString(),
    body('teamMembers.*.role').optional().isString().isLength({ min: 2, max: 100 }),
    body('teamMembers.*.skills').optional().isArray(),
    body('teamMembers.*.responsibilities').optional().isArray(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const {
      title,
      description,
      category,
      status = 'upcoming',
      startDate,
      endDate,
      budget,
      mentorId,
      teamLeaderId,
      teamMembers = [],
      imageUrl,
      videoUrl,
      githubUrl,
      documentationUrl,
      achievements,
      tags,
    } = req.body;

    const newProject = await Project.create({
      title,
      description,
      category,
      status,
      startDate,
      endDate,
      budget,
      mentorId: mentorId && ensureObjectId(mentorId),
      teamLeaderId: ensureObjectId(teamLeaderId),
      imageUrl,
      videoUrl,
      githubUrl,
      documentationUrl,
      achievements,
      tags,
    });

    // Add team members if provided
    if (teamMembers && teamMembers.length > 0) {
      const User = require('../models/User');
      for (const member of teamMembers) {
        const memberUserId = ensureObjectId(member.userId);
        if (memberUserId) {
          try {
            const user = await User.findById(memberUserId);
            if (user && user.isActive) {
              const memberName = `${user.firstName} ${user.lastName}`.trim();
              newProject.teamMembers.push({
                userId: memberUserId,
                userName: memberName,
                role: member.role || 'Member',
                skills: member.skills || [],
                responsibilities: member.responsibilities || [],
                joinedAt: new Date()
              });
            }
          } catch (error) {
            logger.warn(`Failed to add team member ${member.userId}: ${error.message}`);
          }
        }
      }
      await newProject.save();
    }

    const populated = await Project.findById(newProject._id)
      .populate('mentorId', 'firstName lastName email role')
      .populate('teamLeaderId', 'firstName lastName email role')
      .populate('teamMembers.userId', 'firstName lastName email role profileImageUrl');

    // Notify mentor and team leader if emails exist
    const recipients = [populated?.mentorId?.email, populated?.teamLeaderId?.email].filter(Boolean);
    try { await sendProjectCreatedNotification({ project: populated.toObject(), recipients }); } catch (_) {}

    res.status(201).json({ success: true, message: 'Project created', data: { project: populated } });
  })
);

// PUT /api/projects/:id - update core fields
// Project leaders (team members who are leaders) can fully manage their projects including images
router.put(
  '/:id',
  verifyToken,
  requireProjectLeaderAccess,
  [
    param('id').isString(),
    body('title').optional().isString().isLength({ min: 3, max: 255 }),
    body('description').optional().isString().isLength({ min: 10, max: 5000 }),
    body('category').optional().isString().isLength({ min: 1, max: 100 }),
    body('status').optional().isIn(['upcoming', 'ongoing', 'completed', 'on_hold']),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('budget').optional().isFloat({ min: 0 }),
    body('mentorId').optional().isString(),
    body('imageUrl').optional().isString(),
    body('videoUrl').optional().isString(),
    body('githubUrl').optional().isString(),
    body('documentationUrl').optional().isString(),
    body('achievements').optional().isArray(),
    body('tags').optional().isArray(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    const { id } = req.params;
    const objId = ensureObjectId(id);
    if (!objId) throw notFoundErrorHandler('Project');

    const updateData = { ...req.body };
    if (updateData.mentorId) {
      updateData.mentorId = ensureObjectId(updateData.mentorId);
    }

    // Load current project before mutating for permission checks and notifications
    const before = await Project.findById(objId);

    if (!before) throw notFoundErrorHandler('Project');

    let teamLeaderChanged = false;
    if (Object.prototype.hasOwnProperty.call(updateData, 'teamLeaderId')) {
      const normalizedLeaderId = ensureObjectId(updateData.teamLeaderId);
      if (!normalizedLeaderId) {
        return res.status(400).json({ success: false, message: 'Invalid teamLeaderId' });
      }

      const isAdmin = req.user.role === 'admin';
      const isMentor = before.mentorId?.toString() === req.user.id.toString();
      const isCurrentLeader = before.teamLeaderId?.toString() === req.user.id.toString();
      // Project leaders (team members who are leaders) can reassign team leader
      if (!isAdmin && !isMentor && !isCurrentLeader) {
        return res.status(403).json({ success: false, message: 'Only admin, mentor, or current team leader can reassign team leader' });
      }

      const newLeader = await User.findById(normalizedLeaderId);
      if (!newLeader) {
        return res.status(404).json({ success: false, message: 'New team leader not found' });
      }
      if (!newLeader.isActive) {
        return res.status(400).json({ success: false, message: 'New team leader must be an active user' });
      }
      if (!['team_member', 'mentor', 'researcher', 'admin'].includes(newLeader.role)) {
        return res.status(400).json({ success: false, message: 'New team leader must have an eligible role' });
      }

      const currentLeaderId = before.teamLeaderId?.toString();
      teamLeaderChanged = currentLeaderId !== normalizedLeaderId.toString();
      updateData.teamLeaderId = normalizedLeaderId;
    }

    const project = await Project.findByIdAndUpdate(objId, updateData, { new: true })
      .populate('mentorId', 'firstName lastName email role')
      .populate('teamLeaderId', 'firstName lastName email role')
      .populate('teamMembers.userId', 'firstName lastName email role profileImageUrl');
    if (!project) throw notFoundErrorHandler('Project');
    if (before && updateData.status && before.status !== updateData.status) {
      const recipients = [project?.mentorId?.email, project?.teamLeaderId?.email].filter(Boolean);
      try { await sendProjectStatusChangedEmail({ project: project.toObject(), oldStatus: before.status, newStatus: updateData.status, recipients }); } catch (_) {}
    }
    if (teamLeaderChanged) {
      logger.info('Project team leader updated', {
        projectId: project._id,
        previousLeaderId: before.teamLeaderId,
        newLeaderId: project.teamLeaderId,
        updatedBy: req.user.id,
      });
    }

    res.json({ success: true, message: 'Project updated', data: { project } });
  })
);

// PUT /api/projects/:id/media - update project media (project leaders, mentors, or admins)
// Dedicated endpoint for updating media URLs
router.put(
  '/:id/media',
  verifyToken,
  requireProjectLeaderAccess,
  [
    param('id').isString(),
    body('imageUrl').optional().isString().matches(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i).withMessage('Image must be a valid image URL'),
    body('videoUrl').optional().isString().matches(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)\/.+/i).withMessage('Video must be a valid video platform URL'),
    body('githubUrl').optional().isString().matches(/^https?:\/\/(www\.)?github\.com\/.+/i).withMessage('GitHub URL must be a valid GitHub repository URL'),
    body('documentationUrl').optional().isString().matches(/^https?:\/\/.+/i).withMessage('Documentation must be a valid URL'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    
    const { id } = req.params;
    const objId = ensureObjectId(id);
    if (!objId) throw notFoundErrorHandler('Project');

    const project = await Project.findById(objId);
    if (!project) throw notFoundErrorHandler('Project');

    // Only allow updating media fields
    const mediaFields = ['imageUrl', 'videoUrl', 'githubUrl', 'documentationUrl'];
    const updateData = {};
    
    mediaFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // If all fields are empty strings, treat as clearing the field
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '') {
        updateData[key] = null;
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No media fields provided for update'
      });
    }

    // Update only media fields
    Object.assign(project, updateData);
    await project.save();

    // Populate and return updated project
    const updated = await Project.findById(project._id)
      .populate('mentorId', 'firstName lastName email role')
      .populate('teamLeaderId', 'firstName lastName email role')
      .populate('teamMembers.userId', 'firstName lastName email role profileImageUrl');

    logger.info('Project media updated', {
      projectId: project._id,
      projectTitle: project.title,
      updatedFields: Object.keys(updateData),
      updatedBy: req.user.id,
      updatedByEmail: req.user.email
    });

    res.json({
      success: true,
      message: 'Project media updated successfully',
      data: {
        project: updated,
        media: {
          imageUrl: updated.imageUrl,
          videoUrl: updated.videoUrl,
          githubUrl: updated.githubUrl,
          documentationUrl: updated.documentationUrl
        }
      }
    });
  })
);

// DELETE /api/projects/:id - delete (project leaders, mentors, or admins)
router.delete(
  '/:id',
  verifyToken,
  [param('id').isString()],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const objId = ensureObjectId(id);
    if (!objId) throw notFoundErrorHandler('Project');
    
    // First check if project exists
    const project = await Project.findById(objId);
    if (!project) throw notFoundErrorHandler('Project');
    
    // Check permissions: admin, mentor, or project leader can delete
    const isAdmin = req.user.role === 'admin';
    const isMentor = ['mentor', 'researcher'].includes(req.user.role);
    const isProjectLeader = project.teamLeaderId?.toString() === req.user.id.toString();
    
    if (!isAdmin && !isMentor && !isProjectLeader) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Only project leaders, mentors, or admins can delete projects.',
          statusCode: 403
        }
      });
    }
    
    // Log the deletion for audit purposes
    const deletedBy = isProjectLeader ? 'team_leader' : (isAdmin ? 'admin' : 'mentor');
    logger.info(`Project deleted by ${deletedBy}`, {
      projectId: id,
      projectTitle: project.title,
      deletedBy: req.user.id,
      deletedByEmail: req.user.email,
      deletedByRole: req.user.role,
      deletedAt: new Date().toISOString()
    });
    
    const deleted = await Project.findByIdAndDelete(objId);
    if (!deleted) {
      // This should not happen since we already checked project existence above
      logger.error(`Project deletion failed - project not found during deletion`, {
        projectId: id,
        deletedBy: req.user.id,
        deletedByEmail: req.user.email
      });
      throw notFoundErrorHandler('Project');
    }
    
    res.json({ 
      success: true, 
      message: 'Project deleted successfully',
      data: {
        deletedProject: {
          id: deleted._id,
          title: deleted.title,
          deletedAt: new Date().toISOString()
        }
      }
    });
  })
);

// DELETE /api/projects/:id/self - delete own project (team leader only)
router.delete(
  '/:id/self',
  verifyToken,
  [param('id').isString()],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const objId = ensureObjectId(id);
    if (!objId) throw notFoundErrorHandler('Project');
    
    const project = await Project.findById(objId);
    if (!project) throw notFoundErrorHandler('Project');
    
    // Check if user is the team leader of this project
    if (project.teamLeaderId?.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. You can only delete projects where you are the team leader.',
          details: {
            statusCode: 403,
            isOperational: true,
            message: 'Access denied. You can only delete projects where you are the team leader.'
          }
        },
        timestamp: new Date().toISOString(),
        path: `/api/projects/${id}/self`,
        method: 'DELETE'
      });
    }
    
    // Additional safety check: prevent deletion of projects with active team members
    const activeMembers = project.teamMembers.filter(member => member.isActive);
    if (activeMembers.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot delete project with active team members. Please remove all team members first or transfer leadership.',
          details: {
            statusCode: 400,
            isOperational: true,
            message: 'Cannot delete project with active team members. Please remove all team members first or transfer leadership.',
            activeMembersCount: activeMembers.length
          }
        },
        timestamp: new Date().toISOString(),
        path: `/api/projects/${id}/self`,
        method: 'DELETE'
      });
    }
    
    // Log the deletion for audit purposes
    logger.info(`Project deleted by team leader`, {
      projectId: id,
      projectTitle: project.title,
      teamLeaderId: req.user.id,
      teamLeaderEmail: req.user.email,
      deletedAt: new Date().toISOString()
    });
    
    const deleted = await Project.findByIdAndDelete(objId);
    if (!deleted) {
      // This should not happen since we already checked project existence above
      // But let's handle it gracefully
      logger.error(`Project deletion failed - project not found during deletion`, {
        projectId: id,
        teamLeaderId: req.user.id,
        teamLeaderEmail: req.user.email
      });
      throw notFoundErrorHandler('Project');
    }
    
    res.json({ 
      success: true, 
      message: 'Project deleted successfully',
      data: {
        deletedProject: {
          id: deleted._id,
          title: deleted.title,
          deletedAt: new Date().toISOString()
        }
      }
    });
  })
);

// GET /api/projects/:id/members
router.get(
  '/:id/members',
  [param('id').isString()],
  asyncHandler(async (req, res) => {
    const objId = ensureObjectId(req.params.id);
    if (!objId) throw notFoundErrorHandler('Project');
    const project = await Project.findById(objId).populate('teamMembers.userId', 'firstName lastName email role profileImageUrl');
    if (!project) throw notFoundErrorHandler('Project');
    res.json({ success: true, data: { members: project.teamMembers } });
  })
);

// POST /api/projects/:id/members - project leaders (team members who are leaders) can add members
router.post(
  '/:id/members',
  verifyToken,
  requireProjectLeaderAccess,
  [param('id').isString(), body('userId').isString(), body('role').isString().isLength({ min: 2, max: 100 })],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    const objId = ensureObjectId(req.params.id);
    if (!objId) throw notFoundErrorHandler('Project');
    const project = await Project.findById(objId);
    if (!project) throw notFoundErrorHandler('Project');

    // Project leaders (team members who are leaders) can add members
    // This is already checked by requireProjectLeaderAccess middleware

    const newMemberUserId = ensureObjectId(req.body.userId);
    if (!newMemberUserId) throw validationErrorHandler({ array: () => [{ msg: 'Invalid userId' }] });

    await project.addTeamMember(newMemberUserId, req.body.role, req.body.skills || [], req.body.responsibilities || []);
    const populated = await Project.findById(objId).populate('teamMembers.userId', 'firstName lastName email role profileImageUrl');
    res.status(201).json({ success: true, message: 'Member added', data: { members: populated.teamMembers } });
  })
);

// PUT/PATCH /api/projects/:id/members/:memberId - update member by membershipId or userId
// Project leaders (team members who are leaders) can update members
const updateMemberHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw validationErrorHandler(errors);

  const objId = ensureObjectId(req.params.id);
  if (!objId) throw notFoundErrorHandler('Project');

  const project = await Project.findById(objId);
  if (!project) throw notFoundErrorHandler('Project');

  // Project leaders (team members who are leaders) can update members
  // This is already checked by requireProjectLeaderAccess middleware

  const updates = req.body || {};
  const allowed = ['role', 'skills', 'responsibilities', 'isActive'];
  const toApply = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      toApply[key] = updates[key];
    }
  }

  // If nothing to update, return early
  if (Object.keys(toApply).length === 0) {
    return res.status(400).json({ success: false, message: 'No updatable fields provided' });
  }

  const memberParam = req.params.memberId;
  const asObjectId = ensureObjectId(memberParam);

  // Try membership subdocument _id first
  let memberDoc = asObjectId ? project.teamMembers.id(asObjectId) : null;

  // Fallback: try by userId
  if (!memberDoc && asObjectId) {
    memberDoc = project.teamMembers.find(m => m.userId && m.userId.toString() === asObjectId.toString());
  }

  if (!memberDoc) {
    return res.status(404).json({ success: false, message: 'Member not found' });
  }

  // Apply updates
  if (toApply.role !== undefined) memberDoc.role = toApply.role;
  if (toApply.skills !== undefined) memberDoc.skills = Array.isArray(toApply.skills) ? toApply.skills : [];
  if (toApply.responsibilities !== undefined) memberDoc.responsibilities = Array.isArray(toApply.responsibilities) ? toApply.responsibilities : [];
  if (toApply.isActive !== undefined) memberDoc.isActive = Boolean(toApply.isActive);

  await project.save();
  const populated = await Project.findById(objId).populate('teamMembers.userId', 'firstName lastName email role profileImageUrl');
  return res.json({ success: true, message: 'Member updated', data: { members: populated.teamMembers } });
};

router.put(
  '/:id/members/:memberId',
  verifyToken,
  requireProjectLeaderAccess,
  [param('id').isString(), param('memberId').isString()],
  asyncHandler(updateMemberHandler)
);

router.patch(
  '/:id/members/:memberId',
  verifyToken,
  requireProjectLeaderAccess,
  [param('id').isString(), param('memberId').isString()],
  asyncHandler(updateMemberHandler)
);

// PUT/PATCH /api/projects/:id/members with body { userId, ... }
// Project leaders (team members who are leaders) can update members
const updateMemberByBodyHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw validationErrorHandler(errors);

  const objId = ensureObjectId(req.params.id);
  if (!objId) throw notFoundErrorHandler('Project');
  const project = await Project.findById(objId);
  if (!project) throw notFoundErrorHandler('Project');

  // Project leaders (team members who are leaders) can update members
  // This is already checked by requireProjectLeaderAccess middleware

  const userIdObj = ensureObjectId(req.body.userId);
  if (!userIdObj) return res.status(400).json({ success: false, message: 'Invalid userId' });

  const memberDoc = project.teamMembers.find(m => m.userId && m.userId.toString() === userIdObj.toString());
  if (!memberDoc) return res.status(404).json({ success: false, message: 'Member not found' });

  const updates = req.body || {};
  const allowed = ['role', 'skills', 'responsibilities', 'isActive'];
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      if (key === 'skills' || key === 'responsibilities') {
        memberDoc[key] = Array.isArray(updates[key]) ? updates[key] : [];
      } else if (key === 'isActive') {
        memberDoc[key] = Boolean(updates[key]);
      } else {
        memberDoc[key] = updates[key];
      }
    }
  }

  await project.save();
  const populated = await Project.findById(objId).populate('teamMembers.userId', 'firstName lastName email role profileImageUrl');
  return res.json({ success: true, message: 'Member updated', data: { members: populated.teamMembers } });
};

router.put(
  '/:id/members',
  verifyToken,
  requireProjectLeaderAccess,
  [param('id').isString(), body('userId').isString()],
  asyncHandler(updateMemberByBodyHandler)
);

router.patch(
  '/:id/members',
  verifyToken,
  requireProjectLeaderAccess,
  [param('id').isString(), body('userId').isString()],
  asyncHandler(updateMemberByBodyHandler)
);

// DELETE /api/projects/:id/members/:memberId - memberId is userId
// Project leaders (team members who are leaders) can remove members
router.delete(
  '/:id/members/:memberId',
  verifyToken,
  requireProjectLeaderAccess,
  [param('id').isString(), param('memberId').isString()],
  asyncHandler(async (req, res) => {
    const objId = ensureObjectId(req.params.id);
    if (!objId) throw notFoundErrorHandler('Project');

    const project = await Project.findById(objId);
    if (!project) throw notFoundErrorHandler('Project');

    // Project leaders (team members who are leaders) can remove members
    // This is already checked by requireProjectLeaderAccess middleware

    const memberParam = req.params.memberId;
    const asObjectId = ensureObjectId(memberParam);

    // Try membership subdocument _id first
    let memberDoc = asObjectId ? project.teamMembers.id(asObjectId) : null;
    let targetUserId = null;

    if (memberDoc && memberDoc.userId) {
      targetUserId = memberDoc.userId;
    } else {
      // Fallback: treat param as userId
      const maybeUserId = asObjectId;
      if (maybeUserId) {
        memberDoc = project.teamMembers.find(m => m.userId && m.userId.toString() === maybeUserId.toString());
        if (memberDoc) targetUserId = maybeUserId;
      }
    }

    if (!targetUserId) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    try {
      await project.removeTeamMember(targetUserId);
    } catch (err) {
      if (String(err && err.message) === 'User is not a team member') {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }
      throw err;
    }

    const populated = await Project.findById(objId).populate('teamMembers.userId', 'firstName lastName email role profileImageUrl');
    return res.json({ success: true, message: 'Member removed', data: { members: populated.teamMembers } });
  })
);

// GET /api/projects/:id/milestones
router.get(
  '/:id/milestones',
  [param('id').isString()],
  asyncHandler(async (req, res) => {
    const objId = ensureObjectId(req.params.id);
    if (!objId) throw notFoundErrorHandler('Project');
    const project = await Project.findById(objId);
    if (!project) throw notFoundErrorHandler('Project');
    res.json({ success: true, data: { milestones: project.milestones } });
  })
);

// POST /api/projects/:id/milestones
router.post(
  '/:id/milestones',
  verifyToken,
  requireProjectTeamMember,
  [
    param('id').isString(),
    body('title').isString().isLength({ min: 3, max: 255 }),
    body('description').optional().isString().isLength({ max: 1000 }),
    body('dueDate').isISO8601(),
    body('assignedTo').optional().isString(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    const objId = ensureObjectId(req.params.id);
    if (!objId) throw notFoundErrorHandler('Project');
    const project = await Project.findById(objId);
    if (!project) throw notFoundErrorHandler('Project');

    project.addMilestone(req.body.title, req.body.description, req.body.dueDate, req.body.assignedTo && ensureObjectId(req.body.assignedTo));
    await project.save();
    res.status(201).json({ success: true, message: 'Milestone added', data: { milestones: project.milestones } });
  })
);

// PUT /api/projects/:id/milestones/:milestoneId
router.put(
  '/:id/milestones/:milestoneId',
  verifyToken,
  requireProjectTeamMember,
  [
    param('id').isString(),
    param('milestoneId').isString(),
    body('title').optional().isString().isLength({ min: 3, max: 255 }),
    body('description').optional().isString().isLength({ max: 1000 }),
    body('dueDate').optional().isISO8601(),
    body('status').optional().isIn(['pending', 'in_progress', 'completed', 'overdue']),
    body('completedAt').optional().isISO8601(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);
    const objId = ensureObjectId(req.params.id);
    if (!objId) throw notFoundErrorHandler('Project');
    const project = await Project.findById(objId);
    if (!project) throw notFoundErrorHandler('Project');

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

    const up = req.body;
    if (up.title !== undefined) milestone.title = up.title;
    if (up.description !== undefined) milestone.description = up.description;
    if (up.dueDate !== undefined) milestone.dueDate = up.dueDate;
    if (up.status !== undefined) {
      milestone.status = up.status;
      if (up.status === 'completed' && up.completedAt) milestone.completedAt = up.completedAt;
    }

    await project.save();
    res.json({ success: true, message: 'Milestone updated', data: { milestones: project.milestones } });
  })
);

module.exports = router;
