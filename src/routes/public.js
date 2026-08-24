const express = require('express');
const path = require('path');
const router = express.Router();
const Project = require('../models/Project');
const News = require('../models/News');
const User = require('../models/User');
const Workshop = require('../models/Workshop');
const Event = require('../models/Event');
const ResearchArea = require('../models/ResearchArea');
const { getPublicImpactMetrics } = require('../services/impactMetricsService');
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
function mapPublicUser(userDoc, options = {}) {
  const { forceIncludeEmail = false } = options;
  const user = userDoc.toObject({ virtuals: true });
  const visibility = user.preferences?.privacy?.profileVisibility || 'members';
  const showEmail = forceIncludeEmail || Boolean(user.preferences?.privacy?.showEmail);
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
      ...(forceIncludeEmail && { email: user.email }),
    };
  }

  return payload;
}

// GET /api/public/metrics
// Returns comprehensive impact metrics (projects, publications, lab members, industry partners, awards, workshops)
router.get(
  '/metrics',
  asyncHandler(async (req, res) => {
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

    try {
      const payload = await getPublicImpactMetrics();
      return res.json(payload);
    } catch (error) {
      const isInitError = /before initial connection is complete/i.test(error?.message || '');
      return res.status(isInitError ? 503 : 500).json({
        success: false,
        error: {
          message: isInitError
            ? 'Database is starting up. Please retry shortly.'
            : 'Failed to fetch impact metrics',
          details: error.message,
          code: isInitError ? 'DATABASE_NOT_READY' : 'METRICS_ERROR',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      });
    }
  })
);

// GET /api/public/people
// List lab people with optional role filter and pagination
// Query: role in [team_member, mentor, researcher], q, department, limit, skip
router.get(
  '/people',
  asyncHandler(async (req, res) => {
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
    const { role, q, department } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);

    const validRoles = ['team_member', 'mentor', 'researcher'];
    const filter = { isActive: true, role: { $in: validRoles } };
    if (role && validRoles.includes(role)) filter.role = role;
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
      const isInitError = /before initial connection is complete/i.test(error?.message || '');
      return res.status(isInitError ? 503 : 500).json({
        success: false,
        error: {
          message: isInitError
            ? 'Database is starting up. Please retry shortly.'
            : 'Database operation failed',
          details: error.message,
          code: isInitError ? 'DATABASE_NOT_READY' : 'DATABASE_ERROR',
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      });
    }
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

    const items = users.map(user => mapPublicUser(user, { forceIncludeEmail: true }));

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

    const items = users.map(user => mapPublicUser(user, { forceIncludeEmail: true }));

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

// GET /api/public/team-members/:id - Get team member details by ID (public)
// MUST be defined BEFORE /team-members route to avoid route conflicts
router.get(
  '/team-members/:id',
  asyncHandler(async (req, res) => {
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

    const { id } = req.params;

    // Validate ID format (MongoDB ObjectId is 24 hex characters)
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid team member ID format',
          code: 'INVALID_ID'
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    }

    try {
      // Find user by ID, must be active team_member
      const user = await User.findOne({
        _id: id,
        isActive: true,
        role: 'team_member'
      }).select(publicUserProjection);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Team member not found or not available',
            code: 'TEAM_MEMBER_NOT_FOUND'
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }

      // Map to public user format with email forced to be included
      const publicUser = mapPublicUser(user, { forceIncludeEmail: true });

      res.json({
        success: true,
        data: {
          item: publicUser
        }
      });
    } catch (error) {
      // Handle invalid ObjectId format
      if (error.name === 'CastError' || error.kind === 'ObjectId') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid team member ID format',
            code: 'INVALID_ID'
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method
        });
      }

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
  })
);

// Shortcut endpoints (must be AFTER /team-members/:id)
router.get('/team-members', getPeopleByRole('team_member'));
router.get('/mentors', getPeopleByRole('mentor'));
router.get('/researchers', getPeopleByRole('researcher'));

// Download: Equipment Guide PDF
router.get('/equipment-guide.pdf', (req, res) => {
  const pdfPath = path.join(__dirname, '../../docs/EQUIPMENT_GUIDE.pdf');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="EQUIPMENT_GUIDE.pdf"');
  res.sendFile(pdfPath, (err) => {
    if (err) {
      res.status(err.statusCode || 500).json({ success: false, error: 'File not found or unavailable' });
    }
  });
});

module.exports = router;



