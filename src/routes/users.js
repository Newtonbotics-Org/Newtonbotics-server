const express = require('express');
const { body, validationResult, query } = require('express-validator');
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
  requireRole, 
  requirePermission,
  requireAdmin 
} = require('../middleware/auth');
const logger = require('../utils/logger');
const Project = require('../models/Project');
const Event = require('../models/Event');
const Workshop = require('../models/Workshop');
const InternalMessage = require('../models/InternalMessage');
const NewsApplication = require('../models/NewsApplication');
const ProjectRequest = require('../models/ProjectRequest');
const { sendRoleAssignedEmail } = require('../services/emailService');

const router = express.Router();

// Apply authentication middleware to all routes except public endpoints we define explicitly
router.use(verifyToken);

// Validation rules
const createUserValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 255 })
    .withMessage('Email cannot exceed 255 characters'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('role')
    .isIn(['student', 'team_member', 'mentor', 'researcher', 'community'])
    .withMessage('Invalid role specified'),
  
  body('studentId')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Student ID cannot exceed 50 characters'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department cannot exceed 100 characters'),
  
  body('yearOfStudy')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Year of study must be between 1 and 8'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
];

const updateUserValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('role')
    .optional()
    .isIn(['student', 'team_member', 'mentor', 'researcher', 'community', 'admin'])
    .withMessage('Invalid role specified'),
  
  body('studentId')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Student ID cannot exceed 50 characters'),
  
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department cannot exceed 100 characters'),
  
  body('yearOfStudy')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Year of study must be between 1 and 8'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio cannot exceed 1000 characters'),
  
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  
  body('skills.*')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Skill cannot exceed 100 characters'),
  
  body('profileImageUrl')
    .optional()
    .trim()
    .isURL({ protocols: ['http','https'], require_protocol: true })
    .withMessage('Profile image must be a valid URL'),
  
  body('subroles')
    .optional()
    .isArray()
    .withMessage('Subroles must be an array'),
  
  body('subroles.*')
    .optional()
    .custom(async (subroleName) => {
      const Subrole = require('../models/Subrole');
      const subrole = await Subrole.findOne({ name: subroleName, isActive: true });
      if (!subrole) {
        throw new Error('Invalid or inactive subrole');
      }
      return true;
    })
];

const searchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('role')
    .optional()
    .isIn(['student', 'team_member', 'mentor', 'researcher', 'community', 'admin'])
    .withMessage('Invalid role specified'),
  
  query('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department cannot exceed 100 characters'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer'),
];

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/', requireAdmin, searchValidation, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors);
  }

  const { q, role, department, skills, limit = 20, skip = 0 } = req.query;

  // Build search query
  const searchQuery = { isActive: true };
  
  if (q) {
    searchQuery.$text = { $search: q };
  }
  
  if (role) {
    searchQuery.role = role;
  }
  
  if (department) {
    searchQuery.department = department;
  }
  
  if (skills && skills.length > 0) {
    searchQuery.skills = { $in: skills };
  }

  // Execute search
  const users = await User.search(q, { role, department, skills, limit: parseInt(limit), skip: parseInt(skip) });
  const total = await User.countDocuments(searchQuery);

  // Log search operation
  logger.info(`User search performed by ${req.user.id}`, {
    query: q,
    filters: { role, department, skills },
    results: users.length,
    total
  });

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + users.length
      }
    }
  });
}));

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  
  if (!user) {
    throw notFoundErrorHandler('User');
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subroles: user.subroles || [],
        studentId: user.studentId,
        department: user.department,
        yearOfStudy: user.yearOfStudy,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        skills: user.skills,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        permissions: user.permissions,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
}));

// @route   GET /api/users/dashboard
// @desc    Get current user's dashboard
// @access  Private
router.get('/dashboard', asyncHandler(async (req, res) => {
  const dashboard = await buildUserDashboard(req.user.id);
  if (!dashboard) {
    throw notFoundErrorHandler('User');
  }
  res.json({ success: true, data: { dashboard } });
}));

// @route   GET /api/users/club-members
// @desc    Get all club members (team_member, mentor, researcher, admin, community - excluding students)
// @access  Private
router.get('/club-members', asyncHandler(async (req, res) => {
  const { q, department, skills, limit = 50, skip = 0 } = req.query;

  // Build search query to exclude students
  const searchQuery = { 
    isActive: true,
    role: { $in: ['team_member', 'mentor', 'researcher', 'admin', 'community'] }
  };
  
  if (q) {
    searchQuery.$text = { $search: q };
  }
  
  if (department) {
    searchQuery.department = department;
  }
  
  if (skills && skills.length > 0) {
    searchQuery.skills = { $in: skills };
  }

  // Execute search with club member roles only
  const users = await User.find(searchQuery)
    .select('-passwordHash')
    .limit(parseInt(limit))
    .skip(parseInt(skip))
    .sort({ role: 1, firstName: 1, lastName: 1 });

  const total = await User.countDocuments(searchQuery);

  // Log search operation
  logger.info(`Club members search performed by ${req.user.id}`, {
    query: q,
    filters: { department, skills },
    results: users.length,
    total
  });

  res.json({
    success: true,
    data: {
      clubMembers: users.map(user => ({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        displayName: user.displayName,
        role: user.role,
        subroles: user.subroles || [],
        specialization: user.specialization,
        experienceYears: user.experienceYears,
        department: user.department,
        yearOfStudy: user.yearOfStudy,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        skills: user.skills || [],
        achievements: user.achievements || [],
        socialLinks: user.socialLinks || {},
        currentProjects: user.currentProjects || [],
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + users.length
      }
    }
  });
}));

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Users can only view their own profile unless they're admin
  if (id !== req.user.id && req.user.role !== 'admin') {
    throw authorizationErrorHandler('Access denied. You can only view your own profile');
  }

  const user = await User.findById(id).select('-passwordHash');
  
  if (!user) {
    throw notFoundErrorHandler('User');
  }

  // Check if user is active (admin can view inactive users)
  if (!user.isActive && req.user.role !== 'admin') {
    throw notFoundErrorHandler('User');
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subroles: user.subroles || [],
        studentId: user.studentId,
        department: user.department,
        yearOfStudy: user.yearOfStudy,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        skills: user.skills,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        permissions: user.permissions,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
}));

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', updateUserValidation, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors);
  }

  const updateData = { ...req.body };
  
  // Remove fields that cannot be updated by regular users
  delete updateData.role;
  delete updateData.permissions;
  delete updateData.isActive;
  delete updateData.emailVerified;
  delete updateData.email;

  const user = await User.findById(req.user.id);
  
  if (!user) {
    throw notFoundErrorHandler('User');
  }

  // Check if student ID is being updated and if it's already taken
  if (updateData.studentId && updateData.studentId !== user.studentId) {
    const existingUser = await User.findOne({ studentId: updateData.studentId });
    if (existingUser) {
      throw conflictErrorHandler('Student ID is already taken');
    }
  }

  // Update user
  Object.assign(user, updateData);
  await user.save();

  // Log profile update
  logger.info(`User profile updated by ${req.user.id}`, {
    updatedFields: Object.keys(updateData)
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subroles: user.subroles || [],
        studentId: user.studentId,
        department: user.department,
        yearOfStudy: user.yearOfStudy,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        skills: user.skills,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        permissions: user.permissions,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
}));

// @route   PUT /api/users/:id
// @desc    Update user by ID (admin only)
// @access  Private (Admin)
router.put('/:id', requireAdmin, updateUserValidation, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors);
  }

  const { id } = req.params;
  const updateData = { ...req.body };

  const user = await User.findById(id);
  
  if (!user) {
    throw notFoundErrorHandler('User');
  }

  // Check if student ID is being updated and if it's already taken
  if (updateData.studentId && updateData.studentId !== user.studentId) {
    const existingUser = await User.findOne({ studentId: updateData.studentId });
    if (existingUser) {
      throw conflictErrorHandler('Student ID is already taken');
    }
  }

  // Update user
  Object.assign(user, updateData);
  await user.save();

  // Log user update by admin
  logger.info(`User updated by admin ${req.user.id}`, {
    targetUserId: id,
    updatedFields: Object.keys(updateData)
  });

  // Notify user if role changed
  if (updateData.role && updateData.role !== user.role) {
    try {
      await sendRoleAssignedEmail({ email: user.email, fullName: `${user.firstName} ${user.lastName}`, role: updateData.role });
    } catch (_) {}
  }

  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subroles: user.subroles || [],
        studentId: user.studentId,
        department: user.department,
        yearOfStudy: user.yearOfStudy,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
        skills: user.skills,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        permissions: user.permissions,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
}));

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private (Admin)
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Cannot delete self
  if (id === req.user.id) {
    throw new Error('Cannot delete your own account');
  }

  const user = await User.findById(id);
  
  if (!user) {
    throw notFoundErrorHandler('User');
  }

  // Soft delete - mark as inactive instead of removing
  user.isActive = false;
  await user.save();

  // Log user deactivation
  logger.info(`User deactivated by admin ${req.user.id}`, {
    targetUserId: id,
    targetUserEmail: user.email
  });

  res.json({
    success: true,
    message: 'User deactivated successfully'
  });
}));

// @route   POST /api/users/:id/reactivate
// @desc    Reactivate user (admin only)
// @access  Private (Admin)
router.post('/:id/reactivate', requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  
  if (!user) {
    throw notFoundErrorHandler('User');
  }

  if (user.isActive) {
    throw new Error('User is already active');
  }

  // Reactivate user
  user.isActive = true;
  await user.save();

  // Log user reactivation
  logger.info(`User reactivated by admin ${req.user.id}`, {
    targetUserId: id,
    targetUserEmail: user.email
  });

  res.json({
    success: true,
    message: 'User reactivated successfully'
  });
}));

// @route   GET /api/users/statistics
// @desc    Get user statistics (admin only)
// @access  Private (Admin)
router.get('/statistics', requireAdmin, asyncHandler(async (req, res) => {
  const stats = await User.getStatistics();

  res.json({
    success: true,
    data: {
      statistics: stats
    }
  });
}));

// @route   GET /api/users/departments
// @desc    Get list of departments
// @access  Private
router.get('/departments', asyncHandler(async (req, res) => {
  const departments = await User.distinct('department', { isActive: true });

  res.json({
    success: true,
    data: {
      departments: departments.filter(dept => dept).sort()
    }
  });
}));

// @route   GET /api/users/roles
// @desc    Get list of roles
// @access  Private
router.get('/roles', asyncHandler(async (req, res) => {
  const roles = ['student', 'team_member', 'mentor', 'researcher', 'community', 'admin'];

  res.json({
    success: true,
    data: {
      roles
    }
  });
}));

// @route   GET /api/users/subroles
// @desc    Get list of available subroles (deprecated - use /api/subroles/active instead)
// @access  Private
router.get('/subroles', asyncHandler(async (req, res) => {
  const Subrole = require('../models/Subrole');
  const subroles = await Subrole.getActiveSubroles();
  
  const subroleNames = subroles.map(subrole => subrole.name);

  res.json({
    success: true,
    data: {
      subroles: subroleNames
    },
    message: 'This endpoint is deprecated. Use /api/subroles/active for detailed subrole information.'
  });
}));

// @route   PUT /api/users/:id/subroles
// @desc    Update user subroles (admin only)
// @access  Private (Admin)
router.put('/:id/subroles', requireAdmin, [
  body('subroles')
    .isArray()
    .withMessage('Subroles must be an array'),
  
  body('subroles.*')
    .custom(async (subroleName) => {
      const Subrole = require('../models/Subrole');
      const subrole = await Subrole.findOne({ name: subroleName, isActive: true });
      if (!subrole) {
        throw new Error('Invalid or inactive subrole');
      }
      return true;
    })
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors);
  }

  const { id } = req.params;
  const { subroles } = req.body;

  const user = await User.findById(id);
  
  if (!user) {
    throw notFoundErrorHandler('User');
  }

  // Update subroles
  user.subroles = subroles;
  await user.save();

  // Log subrole update by admin
  logger.info(`User subroles updated by admin ${req.user.id}`, {
    targetUserId: id,
    targetUserEmail: user.email,
    newSubroles: subroles,
    previousSubroles: user.subroles
  });

  res.json({
    success: true,
    message: 'User subroles updated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        subroles: user.subroles,
        department: user.department,
        updatedAt: user.updatedAt
      }
    }
  });
}));

module.exports = router;

// Dashboard helpers and routes

// Build a consolidated dashboard for a single userId
async function buildUserDashboard(userId) {
  const [
    user,
    leadOrMemberProjects,
    organizedEvents,
    registeredEvents,
    instructedWorkshops,
    registeredWorkshops,
    inboxMessages,
    sentMessages,
    newsApplications,
    projectRequestsSubmitted
  ] = await Promise.all([
    User.findById(userId).select('-passwordHash'),
    Project.find({ $or: [{ teamLeaderId: userId }, { 'teamMembers.userId': userId }] })
      .select('title status startDate endDate teamLeaderId teamMembers achievements category progress')
      .lean(),
    Event.find({ organizerId: userId })
      .select('title type startDate endDate status')
      .lean(),
    Event.find({ 'registrations.userId': userId })
      .select('title type startDate endDate status registrations')
      .lean(),
    Workshop.find({ instructorId: userId })
      .select('title startDate endDate status credits')
      .lean(),
    Workshop.find({ 'registrations.userId': userId })
      .select('title startDate endDate status credits registrations')
      .lean(),
    InternalMessage.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(50).lean(),
    InternalMessage.find({ senderId: userId }).sort({ createdAt: -1 }).limit(50).lean(),
    NewsApplication.find({ 'applicant.userId': userId }).select('type status submittedAt').lean(),
    ProjectRequest.find({ submittedBy: userId }).select('title status submittedAt').lean(),
  ]);

  if (!user) return null;

  // Derive counts and highlights
  const competitionsParticipated = (registeredEvents || []).filter(e => e.type === 'competition');
  const totalCompetitions = competitionsParticipated.length;
  const achievements = Array.isArray(user.achievements) ? user.achievements : [];

  // Reduce event/workshop registrations to the entry for this user for status if needed
  function pickRegistrationStatus(docArray) {
    return (docArray || []).map(d => {
      const reg = Array.isArray(d.registrations)
        ? d.registrations.find(r => String(r.userId) === String(userId))
        : null;
      return {
        id: d._id,
        title: d.title,
        type: d.type,
        startDate: d.startDate,
        endDate: d.endDate,
        status: d.status,
        registrationStatus: reg?.attendanceStatus || 'registered'
      };
    });
  }

  const dashboard = {
    user: {
      id: user._id,
      displayName: user.displayName,
      role: user.role,
      department: user.department,
      subroles: user.subroles || [],
      profileCompletion: user.profileCompletion,
      createdAt: user.createdAt,
    },
    achievements,
    projects: {
      total: leadOrMemberProjects.length,
      items: leadOrMemberProjects.map(p => ({
        id: p._id,
        title: p.title,
        status: p.status,
        category: p.category,
        progress: p.progress,
        startDate: p.startDate,
        endDate: p.endDate,
        teamLeaderId: p.teamLeaderId,
        teamSize: (p.teamMembers?.length || 0) + 1,
        achievements: p.achievements || [],
      }))
    },
    events: {
      organized: organizedEvents,
      registered: pickRegistrationStatus(registeredEvents)
    },
    workshops: {
      instructed: instructedWorkshops,
      registered: pickRegistrationStatus(registeredWorkshops)
    },
    competitions: {
      participatedCount: totalCompetitions
    },
    communications: {
      inboxCount: inboxMessages.length,
      sentCount: sentMessages.length,
      recentInbox: inboxMessages.slice(0, 10).map(m => ({ id: m._id, subject: m.subject, isRead: m.isRead, createdAt: m.createdAt }))
    },
    applications: {
      newsApplications,
      projectRequests: projectRequestsSubmitted
    }
  };

  return dashboard;
}

// @route   GET /api/users/dashboard
// @desc    Get current user's dashboard
// @access  Private
router.get('/dashboard', asyncHandler(async (req, res) => {
  const dashboard = await buildUserDashboard(req.user.id);
  if (!dashboard) {
    throw notFoundErrorHandler('User');
  }
  res.json({ success: true, data: { dashboard } });
}));

// @route   GET /api/users/:id/dashboard
// @desc    Get a specific user's dashboard (self or admin)
// @access  Private
router.get('/:id/dashboard', asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (id !== req.user.id && req.user.role !== 'admin') {
    throw authorizationErrorHandler('Access denied. You can only view your own dashboard');
  }
  const dashboard = await buildUserDashboard(id);
  if (!dashboard) {
    throw notFoundErrorHandler('User');
  }
  res.json({ success: true, data: { dashboard } });
}));

// @route   GET /api/users/dashboards
// @desc    Get dashboards summary for all users (admin only)
// @access  Private (Admin)
router.get('/dashboards/all', requireAdmin, asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true }).select('_id firstName lastName role department createdAt');
  const results = await Promise.all(users.map(async u => {
    const d = await buildUserDashboard(u._id);
    return {
      userId: u._id,
      name: `${u.firstName} ${u.lastName}`,
      role: u.role,
      department: u.department,
      createdAt: u.createdAt,
      stats: {
        projects: d?.projects?.total || 0,
        achievements: (d?.achievements || []).length,
        competitionsParticipated: d?.competitions?.participatedCount || 0,
        inboxMessages: d?.communications?.inboxCount || 0
      }
    };
  }));
  res.json({ success: true, data: { dashboards: results } });
}));
