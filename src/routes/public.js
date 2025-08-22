const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const News = require('../models/News');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { getRedisClient } = require('../config/redis');
const { getConnectionStatus } = require('../config/database');

const isRedisEnabled = () => process.env.REDIS_ENABLED === 'true';

// Helper function to check database connection
const checkDatabaseConnection = () => {
  const status = getConnectionStatus();
  if (!status.isConnected && !status.hasMongoURI) {
    return {
      success: false,
      error: {
        message: 'Database not configured. Please set MONGODB_URI environment variable.',
        code: 'DATABASE_NOT_CONFIGURED'
      }
    };
  }
  if (!status.isConnected) {
    return {
      success: false,
      error: {
        message: 'Database connection failed. Please check your MongoDB connection.',
        code: 'DATABASE_CONNECTION_FAILED'
      }
    };
  }
  return null; // No error
};

// Common projection for public user profiles (never expose passwordHash or sensitive fields)
const publicUserProjection = {
  passwordHash: 0,
  permissions: 0,
  emailVerified: 0,
  preferences: 0,
  lastLogin: 0,
  __v: 0,
};

// Builds a safe public payload for a user respecting privacy preferences
function mapPublicUser(userDoc) {
  const user = userDoc.toObject({ virtuals: true });
  const visibility = user.preferences?.privacy?.profileVisibility || 'members';
  const showEmail = Boolean(user.preferences?.privacy?.showEmail);
  const showPhone = Boolean(user.preferences?.privacy?.showPhone);

  // Only expose email/phone if flagged to show; otherwise omit them
  const payload = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    displayName: user.displayName,
    role: user.role,
    subroles: user.subroles || [],
    specialization: user.specialization,
    experienceYears: user.experienceYears,
    department: user.department,
    profileImageUrl: user.profileImageUrl,
    bio: user.bio,
    skills: user.skills,
    achievements: user.achievements || [],
    socialLinks: user.socialLinks || {},
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  if (showEmail) payload.email = user.email;
  if (showPhone) payload.phone = user.phone;

  // For profileVisibility 'private', restrict to minimal set
  if (visibility === 'private') {
    return {
      id: user._id,
      displayName: user.displayName,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
    };
  }

  return payload;
}

// GET /api/public/metrics
// Returns homepage metrics (projects, publications, lab members)
router.get(
  '/metrics',
  asyncHandler(async (req, res) => {
    const cacheKey = 'public:metrics:v1';
    if (isRedisEnabled()) {
      try {
        const redis = getRedisClient();
        const cached = await redis.get(cacheKey);
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      } catch (_) { /* ignore cache errors */ }
    }

    const [researchProjects, publications, labMembers] = await Promise.all([
      // Count all projects as research projects for now
      Project.countDocuments({}),
      // Approximate publications by News items tagged as paper or category named Research
      News.countDocuments({ $or: [ { tags: 'paper' }, { categoryId: { $exists: true } } ] }),
      // Active lab members (exclude admin/community)
      User.countDocuments({ isActive: true, role: { $in: ['team_member', 'mentor', 'researcher'] } }),
    ]);

    const payload = {
      success: true,
      data: {
        counts: { researchProjects, publications, labMembers },
        labels: {
          researchProjects: `${researchProjects}+`,
          publications: `${publications}+`,
          labMembers: `${labMembers}+`,
        },
      },
    };

    if (isRedisEnabled()) {
      try {
        const redis = getRedisClient();
        await redis.setEx(cacheKey, 300, JSON.stringify(payload));
      } catch (_) { /* ignore cache errors */ }
    }

    res.json(payload);
  })
);

// GET /api/public/people
// List lab people with optional role filter and pagination
// Query: role in [team_member, mentor, researcher], q, department, limit, skip
router.get(
  '/people',
  asyncHandler(async (req, res) => {
    const { role, q, department } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);

    const validRoles = ['team_member', 'mentor', 'researcher'];
    const filter = { isActive: true, role: { $in: validRoles } };
    if (role && validRoles.includes(role)) filter.role = role;
    if (department) filter.department = department;
    if (q) filter.$text = { $search: q };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(publicUserProjection)
        .limit(limit)
        .skip(skip)
        .sort({ role: 1, createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    const items = users.map(mapPublicUser);

    res.json({
      success: true,
      data: {
        items,
        pagination: { total, limit, skip, hasMore: total > skip + items.length },
      },
    });
  })
);

// Helper function for role-specific endpoints
const getPeopleByRole = (targetRole) => asyncHandler(async (req, res) => {
  // Check database connection first
  const dbError = checkDatabaseConnection();
  if (dbError) {
    return res.status(503).json({
      ...dbError,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }

  const { q, department } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);

  const filter = { isActive: true, role: targetRole };
  if (department) filter.department = department;
  if (q) filter.$text = { $search: q };

  try {
    const [users, total] = await Promise.all([
      User.find(filter)
        .select(publicUserProjection)
        .limit(limit)
        .skip(skip)
        .sort({ role: 1, createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    const items = users.map(mapPublicUser);

    res.json({
      success: true,
      data: {
        items,
        pagination: { total, limit, skip, hasMore: total > skip + items.length },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Database operation failed',
        details: error.message
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }
});

// Leadership Team - team members with at least one subrole
router.get('/leadership-team', asyncHandler(async (req, res) => {
  // Check database connection first
  const dbError = checkDatabaseConnection();
  if (dbError) {
    return res.status(503).json({
      ...dbError,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }

  const { q, department } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);

  const filter = { 
    isActive: true, 
    role: 'team_member',
    subroles: { $exists: true, $ne: [], $not: { $size: 0 } } // Has at least one subrole
  };
  
  if (department) filter.department = department;
  if (q) filter.$text = { $search: q };

  try {
    const [users, total] = await Promise.all([
      User.find(filter)
        .select(publicUserProjection)
        .limit(limit)
        .skip(skip)
        .sort({ 'subroles.0': 1, firstName: 1 }),
      User.countDocuments(filter),
    ]);

    const items = users.map(mapPublicUser);

    res.json({
      success: true,
      data: {
        items,
        pagination: { total, limit, skip, hasMore: total > skip + items.length },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Database operation failed',
        details: error.message
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }
}));

// Team Directory - team members with NO subroles (basic team members)
router.get('/team-directory', asyncHandler(async (req, res) => {
  // Check database connection first
  const dbError = checkDatabaseConnection();
  if (dbError) {
    return res.status(503).json({
      ...dbError,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }

  const { q, department } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);

  const filter = { 
    isActive: true, 
    role: 'team_member',
    $or: [
      { subroles: { $exists: false } }, // No subroles field
      { subroles: { $size: 0 } }, // Empty subroles array
      { subroles: null } // Null subroles
    ]
  };
  
  if (department) filter.department = department;
  if (q) filter.$text = { $search: q };

  try {
    const [users, total] = await Promise.all([
      User.find(filter)
        .select(publicUserProjection)
        .limit(limit)
        .skip(skip)
        .sort({ firstName: 1 }),
      User.countDocuments(filter),
    ]);

    const items = users.map(mapPublicUser);

    res.json({
      success: true,
      data: {
        items,
        pagination: { total, limit, skip, hasMore: total > skip + items.length },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Database operation failed',
        details: error.message
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    });
  }
}));

// Shortcut endpoints
router.get('/team-members', getPeopleByRole('team_member'));
router.get('/mentors', getPeopleByRole('mentor'));
router.get('/researchers', getPeopleByRole('researcher'));

module.exports = router;



