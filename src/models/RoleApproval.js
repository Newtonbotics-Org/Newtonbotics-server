const mongoose = require('mongoose');

const BASE_ROLES_FOR_SUBROLES = ['team_member', 'mentor', 'researcher', 'community'];
const ROLE_ENUM = ['student', 'team_member', 'mentor', 'researcher', 'community', 'admin'];
const SUBROLE_ENUM = [
  'project_manager',
  'event_manager',
  'finance_manager',
  'team_manager',
  'social_media_manager',
  'poc',
];

const roleApprovalSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    maxlength: 255,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
  },
  allowedRoles: [{
    type: String,
    enum: ROLE_ENUM,
    required: true,
  }],
  allowedSubroles: [{
    type: String,
    enum: SUBROLE_ENUM,
  }],
  note: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

roleApprovalSchema.pre('validate', function enforceSubroleRules(next) {
  const doc = this;
  const hasAdmin = Array.isArray(doc.allowedRoles) && doc.allowedRoles.includes('admin');
  const hasSubroles = Array.isArray(doc.allowedSubroles) && doc.allowedSubroles.length > 0;

  if (!hasSubroles) return next();

  if (hasAdmin) return next();

  const hasBaseRole = (doc.allowedRoles || []).some(r => BASE_ROLES_FOR_SUBROLES.includes(r));
  if (!hasBaseRole) {
    return next(new Error('Subroles can only be assigned when allowedRoles contains one of team_member, mentor, researcher, community'));
  }

  // De-duplicate subroles
  doc.allowedSubroles = Array.from(new Set(doc.allowedSubroles));
  return next();
});

roleApprovalSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });

module.exports = mongoose.model('RoleApproval', roleApprovalSchema);


