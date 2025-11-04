const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis');
const isRedisEnabled = () => process.env.REDIS_ENABLED === 'true';
const User = require('../models/User');
const { asyncHandler, validationErrorHandler, conflictErrorHandler, authenticationErrorHandler, authorizationErrorHandler } = require('../middleware/errorHandler');
const { authRateLimit, verifyToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const { sendPasswordResetEmail, sendPasswordResetOtpEmail } = require('../services/emailService');
const RoleApproval = require('../models/RoleApproval');

const router = express.Router();

// Validation rules
const registerValidation = [
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
    .optional()
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

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('desiredRole')
    .optional()
    .isIn(['student', 'team_member', 'mentor', 'researcher', 'community', 'admin'])
    .withMessage('Invalid desired role specified'),
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];

// OTP-based reset validations
const sendOtpValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
];

const verifyOtpValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .matches(/^\d{6}$/)
    .withMessage('OTP must be numeric'),
  body('otpToken')
    .optional()
    .isString(),
];

const resetWithTokenValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors);
  }

  const {
    email,
    password,
    firstName,
    lastName,
    role = 'student',
    studentId,
    department,
    yearOfStudy,
    phone
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw conflictErrorHandler('User with this email already exists');
  }

  // Check if student ID is already taken
  if (studentId) {
    const existingStudentId = await User.findOne({ studentId });
    if (existingStudentId) {
      throw conflictErrorHandler('Student ID is already taken');
    }
  }

  // Validate requested role against pre-approvals
  let assignedRole = role || 'student';
  let roleAdjusted = false;
  let requestedRole = role;
  if (assignedRole && assignedRole !== 'student') {
    const approval = await RoleApproval.findOne({ email: email.toLowerCase(), isActive: true });
    if (!approval || !approval.allowedRoles.includes(assignedRole)) {
      assignedRole = 'student';
      roleAdjusted = true;
    }
  }

  // Create new user
  const user = new User({
    email,
    passwordHash: password, // Will be hashed by pre-save middleware
    firstName,
    lastName,
    role: assignedRole,
    studentId,
    department,
    yearOfStudy,
    phone
  });

  await user.save();

  // Generate tokens
  const accessToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  // Store refresh token hash only when Redis is enabled
  if (isRedisEnabled()) {
    const redisClient = getRedisClient();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await redisClient.setEx(
      `refresh_token:${user._id}`,
      parseInt(process.env.JWT_REFRESH_EXPIRES_IN) || 7 * 24 * 60 * 60, // 7 days
      refreshTokenHash
    );
  }

  // Log successful registration
  logger.logAuth('user_registration', user._id, true, {
    email: user.email,
    role: user.role,
    ip: req.ip
  });

  // Send response
  res.status(201).json({
    success: true,
    message: roleAdjusted
      ? `User registered successfully. Requested role '${requestedRole}' is not pre-approved; assigned 'student'.`
      : 'User registered successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        yearOfStudy: user.yearOfStudy,
        phone: user.phone,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      },
      roleNotice: roleAdjusted ? {
        requestedRole,
        assignedRole: user.role,
        message: 'Your requested role is not pre-approved. You have been registered as a student. An admin can update your role later.'
      } : undefined
    }
  });
}));

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors);
  }

  const { email, password, desiredRole } = req.body;

  // Find user by email
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw authenticationErrorHandler('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw authorizationErrorHandler('Account is deactivated. Please contact administrator.');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    // Log failed login attempt
    logger.logAuth('login_attempt', user._id, false, {
      email: user.email,
      ip: req.ip,
      reason: 'invalid_password'
    });
    throw authenticationErrorHandler('Invalid email or password');
  }

  // Update last login
  await user.updateLastLogin();

  // Optional desired role check (no auto-upgrade, only notice)
  let roleNotice;
  if (desiredRole && desiredRole !== user.role) {
    const approval = await RoleApproval.findOne({ email: user.email.toLowerCase(), isActive: true });
    if (!approval || !approval.allowedRoles.includes(desiredRole)) {
      roleNotice = {
        requestedRole: desiredRole,
        assignedRole: user.role,
        message: `Requested role '${desiredRole}' is not pre-approved. Continuing as '${user.role}'. Please log in as student or contact admin.`
      };
    } else {
      roleNotice = {
        requestedRole: desiredRole,
        assignedRole: user.role,
        message: `Requested role '${desiredRole}' is approved but not yet assigned to your account. Continuing as '${user.role}'. An admin can update your role.`
      };
    }
  }

  // Generate tokens
  const accessToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  if (isRedisEnabled()) {
    const redisClient = getRedisClient();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await redisClient.setEx(
      `refresh_token:${user._id}`,
      parseInt(process.env.JWT_REFRESH_EXPIRES_IN) || 7 * 24 * 60 * 60, // 7 days
      refreshTokenHash
    );
  }

  // Log successful login
  logger.logAuth('login_success', user._id, true, {
    email: user.email,
    role: user.role,
    ip: req.ip
  });

  // Send response
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        yearOfStudy: user.yearOfStudy,
        phone: user.phone,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        permissions: user.permissions,
        lastLogin: user.lastLogin
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      },
      roleNotice
    }
  });
}));

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // If Redis is enabled, optionally validate against stored hash
    if (isRedisEnabled()) {
      const redisClient = getRedisClient();
      const storedTokenHash = await redisClient.get(`refresh_token:${decoded.sub}`);
      if (!storedTokenHash) {
        throw new Error('Refresh token not found or expired');
      }
      const isValidToken = await bcrypt.compare(refreshToken, storedTokenHash);
      if (!isValidToken) {
        throw new Error('Invalid refresh token');
      }
    }

    // Get user
    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate new tokens
    const newAccessToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();

    if (isRedisEnabled()) {
      const redisClient = getRedisClient();
      const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
      await redisClient.setEx(
        `refresh_token:${user._id}`,
        parseInt(process.env.JWT_REFRESH_EXPIRES_IN) || 7 * 24 * 60 * 60, // 7 days
        newRefreshTokenHash
      );
    }

    // Log token refresh
    logger.logAuth('token_refresh', user._id, true, {
      email: user.email,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    throw error;
  }
}));

// @route   POST /api/auth/logout
// @desc    Logout user (blacklist tokens)
// @access  Private
router.post('/logout', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  try {
    // Verify refresh token to get user ID
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    if (isRedisEnabled()) {
      const redisClient = getRedisClient();
      await redisClient.del(`refresh_token:${decoded.sub}`);
      if (req.headers.authorization) {
        const accessToken = req.headers.authorization.substring(7);
        await redisClient.setEx(
          `blacklist:${accessToken}`,
          parseInt(process.env.JWT_EXPIRES_IN) || 24 * 60 * 60,
          'revoked'
        );
      }
    }

    // Log logout
    logger.logAuth('user_logout', decoded.sub, true, {
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    throw error;
  }
}));

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', forgotPasswordValidation, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors);
  }

  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists or not
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  }

  // Generate reset token
  const resetToken = jwt.sign(
    { sub: user._id, type: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  if (isRedisEnabled()) {
    const redisClient = getRedisClient();
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    await redisClient.setEx(
      `password_reset:${user._id}`,
      3600,
      resetTokenHash
    );
  }

  // Send password reset email (logs if SMTP not configured)
  await sendPasswordResetEmail({ email: user.email, token: resetToken });

  // Log password reset request
  logger.logAuth('password_reset_request', user._id, true, {
    email: user.email,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent'
  });
}));

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', resetPasswordValidation, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors);
  }

  const { token, newPassword } = req.body;

  try {
    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password_reset') {
      throw new Error('Invalid token type');
    }

    if (isRedisEnabled()) {
      const redisClient = getRedisClient();
      const storedTokenHash = await redisClient.get(`password_reset:${decoded.sub}`);
      if (!storedTokenHash) {
        throw new Error('Reset token not found or expired');
      }
      const isValidToken = await bcrypt.compare(token, storedTokenHash);
      if (!isValidToken) {
        throw new Error('Invalid reset token');
      }
    }

    // Get user
    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save middleware
    await user.save();

    if (isRedisEnabled()) {
      const redisClient = getRedisClient();
      await redisClient.del(`password_reset:${user._id}`);
    }

    // Log password reset
    logger.logAuth('password_reset_success', user._id, true, {
      email: user.email,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid reset token');
    }
    if (error.name === 'TokenExpiredError') {
      throw new Error('Reset token expired');
    }
    throw error;
  }
}));

// @route   POST /api/auth/forgot-password-otp
// @desc    Send 6-digit OTP for password reset
// @access  Public
router.post('/forgot-password-otp', sendOtpValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors);
  }

  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ success: false, message: 'No account found with this email address' });
  }

  // Simple rate limit per email (5 per hour) when Redis is available
  if (isRedisEnabled()) {
    const redisClient = getRedisClient();
    const key = `otp_req:${email}`;
    const count = await redisClient.incr(key);
    if (count === 1) {
      await redisClient.expire(key, 3600);
    }
    if (count > 5) {
      return res.status(429).json({ success: false, message: 'Too many OTP requests. Try again later.' });
    }
  }

  // Generate OTP
  const otp = (Math.floor(100000 + Math.random() * 900000)).toString();

  if (isRedisEnabled()) {
    const redisClient = getRedisClient();
    const otpHash = await bcrypt.hash(otp, 10);
    await redisClient.setEx(`password_reset_otp:${user._id}`, 600, otpHash); // 10 minutes
    await sendPasswordResetOtpEmail({ email: user.email, otp });
    logger.logAuth('password_reset_otp_sent', user._id, true, { email: user.email, ip: req.ip });
    return res.json({ success: true, message: 'OTP has been sent to your email address' });
  } else {
    // No Redis: embed hashed OTP in a short-lived JWT returned to client
    const otpHash = await bcrypt.hash(otp, 10);
    const otpToken = jwt.sign(
      { sub: user._id, type: 'password_reset_otp_challenge', otpHash },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );
    await sendPasswordResetOtpEmail({ email: user.email, otp });
    logger.logAuth('password_reset_otp_sent', user._id, true, { email: user.email, ip: req.ip });
    return res.json({ success: true, message: 'OTP has been sent to your email address', data: { otpToken } });
  }
}));

// @route   POST /api/auth/verify-reset-otp
// @desc    Verify OTP and issue short-lived reset token
// @access  Public
router.post('/verify-reset-otp', verifyOtpValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors);
  }

  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid OTP or email');
  }

  if (isRedisEnabled()) {
    const redisClient = getRedisClient();
    const storedHash = await redisClient.get(`password_reset_otp:${user._id}`);
    if (!storedHash) {
      throw new Error('OTP expired or not found');
    }
    const ok = await bcrypt.compare(otp, storedHash);
    if (!ok) {
      throw new Error('Invalid OTP');
    }
    // consume OTP
    await redisClient.del(`password_reset_otp:${user._id}`);
  } else {
    const { otpToken } = req.body;
    if (!otpToken) {
      throw new Error('OTP token is required');
    }
    try {
      const decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
      if (decoded.type !== 'password_reset_otp_challenge' || String(decoded.sub) !== String(user._id)) {
        throw new Error('Invalid OTP token');
      }
      const ok = await bcrypt.compare(otp, decoded.otpHash);
      if (!ok) {
        throw new Error('Invalid OTP');
      }
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new Error('OTP token expired');
      }
      throw e;
    }
  }

  // Issue a short-lived reset token (15 minutes)
  const token = jwt.sign({ sub: user._id, type: 'password_reset_otp' }, process.env.JWT_SECRET, { expiresIn: '15m' });

  logger.logAuth('password_reset_otp_verified', user._id, true, { email: user.email, ip: req.ip });

  res.json({ success: true, data: { token }, message: 'OTP verified' });
}));

// @route   POST /api/auth/reset-password-otp
// @desc    Reset password using short-lived token from OTP verification
// @access  Public
router.post('/reset-password-otp', resetWithTokenValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors);
  }

  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'password_reset_otp') {
      throw new Error('Invalid token type');
    }

    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    user.passwordHash = newPassword;
    await user.save();

    if (isRedisEnabled()) {
      const redisClient = getRedisClient();
      await redisClient.del(`refresh_token:${user._id}`);
    }

    logger.logAuth('password_reset_via_otp', user._id, true, { email: user.email, ip: req.ip });

    res.json({ success: true, message: 'Password reset successfully' });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid reset token');
    }
    if (error.name === 'TokenExpiredError') {
      throw new Error('Reset token expired');
    }
    throw error;
  }
}));

// @route   POST /api/auth/change-password
// @desc    Change password (authenticated)
// @access  Private
router.post('/change-password', verifyToken, changePasswordValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors);
  }

  const { currentPassword, newPassword } = req.body;

  // Get full user with password
  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!user) {
    throw authenticationErrorHandler('User not found');
  }

  // Verify current password
  const isCurrentValid = await user.comparePassword(currentPassword);
  if (!isCurrentValid) {
    // Log failed password change attempt
    logger.logAuth('password_change_attempt', req.user.id, false, {
      ip: req.ip,
      reason: 'invalid_current_password'
    });
    throw authenticationErrorHandler('Current password is incorrect');
  }

  // Prevent reusing the same password
  const isSame = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSame) {
    throw validationErrorHandler({
      array: () => [{ msg: 'New password must be different from the current password' }]
    });
  }

  // Update password
  user.passwordHash = newPassword;
  await user.save();

  // Revoke tokens where possible
  if (isRedisEnabled()) {
    const redisClient = getRedisClient();
    // Remove stored refresh token so client must login again
    await redisClient.del(`refresh_token:${user._id}`);

    // Blacklist current access token if provided
    if (req.headers.authorization) {
      const accessToken = req.headers.authorization.substring(7);
      await redisClient.setEx(
        `blacklist:${accessToken}`,
        parseInt(process.env.JWT_EXPIRES_IN) || 24 * 60 * 60,
        'revoked'
      );
    }
  }

  // Log success
  logger.logAuth('password_change', req.user.id, true, { ip: req.ip });

  res.json({
    success: true,
    message: 'Password changed successfully. Please log in again.'
  });
}));

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email address
// @access  Public
router.get('/verify-email/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  try {
    // Verify email verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'email_verification') {
      throw new Error('Invalid token type');
    }

    // Get user
    const user = await User.findById(decoded.sub);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.json({
        success: true,
        message: 'Email already verified'
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    await user.save();

    // Log email verification
    logger.logAuth('email_verification', user._id, true, {
      email: user.email
    });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid verification token');
    }
    if (error.name === 'TokenExpiredError') {
      throw new Error('Verification token expired');
    }
    throw error;
  }
}));

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', asyncHandler(async (req, res) => {
  // User info is already attached by auth middleware
  const user = req.user;

  // Get full user data from database
  const fullUser = await User.findById(user.id).select('-passwordHash');
  
  if (!fullUser) {
    throw new Error('User not found');
  }

  res.json({
    success: true,
    data: {
      user: {
        id: fullUser._id,
        email: fullUser.email,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        role: fullUser.role,
        subroles: fullUser.subroles || [],
        studentId: fullUser.studentId,
        department: fullUser.department,
        yearOfStudy: fullUser.yearOfStudy,
        phone: fullUser.phone,
        profileImageUrl: fullUser.profileImageUrl,
        bio: fullUser.bio,
        skills: fullUser.skills,
        isActive: fullUser.isActive,
        emailVerified: fullUser.emailVerified,
        permissions: fullUser.permissions,
        preferences: fullUser.preferences,
        lastLogin: fullUser.lastLogin,
        createdAt: fullUser.createdAt,
        updatedAt: fullUser.updatedAt
      }
    }
  });
}));

module.exports = router;
