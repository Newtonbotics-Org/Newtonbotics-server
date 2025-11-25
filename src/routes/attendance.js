const express = require('express');
const { body, param, query, validationResult } = require('express-validator');

const router = express.Router();

const Attendance = require('../models/Attendance');
const User = require('../models/User');
const logger = require('../utils/logger');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const {
  asyncHandler,
  validationErrorHandler,
  notFoundErrorHandler,
  authorizationErrorHandler,
} = require('../middleware/errorHandler');

const ATTENDANCE_STATUSES = Attendance.STATUSES || ['present', 'absent', 'late', 'excused', 'remote', 'on_leave'];

const normalizeDate = (input) => {
  if (!input) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today;
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const buildDateFilter = ({ from, to }) => {
  const filter = {};
  if (from) {
    const fromDate = normalizeDate(from);
    if (fromDate) {
      filter.$gte = fromDate;
    }
  }
  if (to) {
    const toDate = normalizeDate(to);
    if (toDate) {
      // Include the to date by taking end of day
      const endDate = new Date(toDate);
      endDate.setUTCHours(23, 59, 59, 999);
      filter.$lte = endDate;
    }
  }
  return Object.keys(filter).length ? filter : undefined;
};

const validateRequest = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors);
  }
};

const populateAttendance = (docOrQuery) =>
  docOrQuery.populate([
    { path: 'userId', select: 'firstName lastName email role department' },
    { path: 'markedBy', select: 'firstName lastName email role' },
  ]);

const throwValidation = (message) => {
  throw validationErrorHandler({
    array: () => [{ msg: message }],
  });
};

router.post(
  '/',
  verifyToken,
  requireAdmin,
  [
    body('userId').isString().withMessage('User ID is required'),
    body('date').optional().isISO8601().withMessage('Date must be ISO8601 formatted'),
    body('status')
      .optional()
      .isIn(ATTENDANCE_STATUSES)
      .withMessage(`Status must be one of: ${ATTENDANCE_STATUSES.join(', ')}`),
    body('notes').optional().isString().isLength({ max: 1000 }),
    body('checkInTime').optional().isISO8601(),
    body('checkOutTime').optional().isISO8601(),
    body('location').optional().isString().isLength({ max: 255 }),
  ],
  asyncHandler(async (req, res) => {
    validateRequest(req);

    const normalizedDate = normalizeDate(req.body.date);
    if (!normalizedDate) {
      throw validationErrorHandler({
        array: () => [{ msg: 'Invalid date supplied' }],
      });
    }

    const targetUser = await User.findById(req.body.userId).select(
      'firstName lastName email role department isActive'
    );
    if (!targetUser) {
      throw notFoundErrorHandler('User');
    }
    if (!targetUser.isActive) {
      throwValidation('Cannot mark attendance for inactive users');
    }
    if (targetUser.role !== 'team_member') {
      throwValidation('Attendance can only be marked for team members');
    }

    const existingRecord = await Attendance.findOne({
      userId: targetUser._id,
      date: normalizedDate,
    });
    if (existingRecord) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already recorded for this user and date',
        data: { attendanceId: existingRecord._id },
      });
    }

    const attendance = await Attendance.create({
      userId: targetUser._id,
      date: normalizedDate,
      status: req.body.status || 'present',
      notes: req.body.notes,
      checkInTime: req.body.checkInTime,
      checkOutTime: req.body.checkOutTime,
      location: req.body.location,
      markedBy: req.user.id,
      userSnapshot: {
        name: `${targetUser.firstName} ${targetUser.lastName}`.trim() || targetUser.email,
        email: targetUser.email,
        role: targetUser.role,
        department: targetUser.department,
      },
      markedBySnapshot: {
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email,
        email: req.user.email,
      },
    });

    logger.info('Attendance marked', {
      attendanceId: attendance._id,
      markedBy: req.user.id,
      targetUserId: targetUser._id,
      date: normalizedDate.toISOString(),
    });

    const populated = await populateAttendance(attendance);

    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: { attendance: populated },
    });
  })
);

router.get(
  '/',
  verifyToken,
  requireAdmin,
  [
    query('userId').optional().isString(),
    query('status').optional().isIn(ATTENDANCE_STATUSES),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt(),
    query('sort').optional().isIn(['asc', 'desc']),
  ],
  asyncHandler(async (req, res) => {
    validateRequest(req);
    const { userId, status, from, to, limit = 20, skip = 0, sort = 'desc' } = req.query;

    const filter = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    const dateFilter = buildDateFilter({ from, to });
    if (dateFilter) filter.date = dateFilter;

    const sortOrder = sort === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      populateAttendance(
        Attendance.find(filter)
          .sort({ date: sortOrder, createdAt: -1 })
          .skip(skip)
          .limit(limit)
      ),
      Attendance.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          limit,
          skip,
          hasMore: total > skip + items.length,
        },
      },
    });
  })
);

router.get(
  '/mine',
  verifyToken,
  [
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt(),
    query('sort').optional().isIn(['asc', 'desc']),
  ],
  asyncHandler(async (req, res) => {
    validateRequest(req);
    const { from, to, limit = 20, skip = 0, sort = 'desc' } = req.query;

    const filter = { userId: req.user.id };
    const dateFilter = buildDateFilter({ from, to });
    if (dateFilter) filter.date = dateFilter;

    const sortOrder = sort === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      populateAttendance(
        Attendance.find(filter)
          .sort({ date: sortOrder })
          .skip(skip)
          .limit(limit)
      ),
      Attendance.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          limit,
          skip,
          hasMore: total > skip + items.length,
        },
      },
    });
  })
);

router.get(
  '/:id',
  verifyToken,
  [param('id').isString()],
  asyncHandler(async (req, res) => {
    validateRequest(req);
    const attendance = await populateAttendance(Attendance.findById(req.params.id));
    if (!attendance) {
      throw notFoundErrorHandler('Attendance record');
    }
    const isAdmin = req.user.role === 'admin';
    const isOwner = attendance.userId && `${attendance.userId._id}` === `${req.user.id}`;
    if (!isAdmin && !isOwner) {
      throw authorizationErrorHandler('Access denied. You can only view your own attendance.');
    }
    res.json({ success: true, data: { attendance } });
  })
);

router.put(
  '/:id',
  verifyToken,
  requireAdmin,
  [
    param('id').isString(),
    body('userId').optional().isString(),
    body('date').optional().isISO8601(),
    body('status').optional().isIn(ATTENDANCE_STATUSES),
    body('notes').optional().isString().isLength({ max: 1000 }),
    body('checkInTime').optional().isISO8601(),
    body('checkOutTime').optional().isISO8601(),
    body('location').optional().isString().isLength({ max: 255 }),
  ],
  asyncHandler(async (req, res) => {
    validateRequest(req);

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      throw notFoundErrorHandler('Attendance record');
    }

    if (req.body.userId) {
      const targetUser = await User.findById(req.body.userId).select(
        'firstName lastName email role department isActive'
      );
      if (!targetUser || !targetUser.isActive) {
        throwValidation('Cannot assign attendance to the specified user');
      }
      if (targetUser.role !== 'team_member') {
        throwValidation('Attendance can only be assigned to team members');
      }
      attendance.userId = targetUser._id;
      attendance.userSnapshot = {
        name: `${targetUser.firstName} ${targetUser.lastName}`.trim() || targetUser.email,
        email: targetUser.email,
        role: targetUser.role,
        department: targetUser.department,
      };
    }

    if (req.body.date) {
      const normalizedDate = normalizeDate(req.body.date);
      if (!normalizedDate) {
        throwValidation('Invalid date supplied');
      }
      attendance.date = normalizedDate;
    }

    ['status', 'notes', 'checkInTime', 'checkOutTime', 'location'].forEach((field) => {
      if (req.body[field] !== undefined) {
        attendance[field] = req.body[field];
      }
    });

    attendance.markedBy = req.user.id;
    attendance.markedBySnapshot = {
      name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email,
      email: req.user.email,
    };

    await attendance.save();

    logger.info('Attendance updated', { attendanceId: attendance._id, updatedBy: req.user.id });

    const populated = await populateAttendance(attendance);
    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: { attendance: populated },
    });
  })
);

router.delete(
  '/:id',
  verifyToken,
  requireAdmin,
  [param('id').isString()],
  asyncHandler(async (req, res) => {
    validateRequest(req);
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) {
      throw notFoundErrorHandler('Attendance record');
    }
    logger.warn('Attendance deleted', { attendanceId: req.params.id, deletedBy: req.user.id });
    res.json({ success: true, message: 'Attendance deleted successfully' });
  })
);

module.exports = router;

