const mongoose = require('mongoose');

const projectRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 255, trim: true, index: true },
    description: { type: String, required: true, maxlength: 5000 },
    objectives: [{ type: String, maxlength: 500 }],
    expectedOutcomes: [{ type: String, maxlength: 500 }],
    teamSize: { type: Number, required: true, min: 1, max: 20 },
    estimatedDurationMonths: { type: Number, required: true, min: 1, max: 24 },
    budgetEstimate: { type: Number, min: 0 },
    requiredResources: [{ type: String, maxlength: 200 }],
    // Document field - supports both Cloudinary and local file storage
    document: {
      // Cloudinary fields
      secureUrl: { type: String, maxlength: 500 },
      url: { type: String, maxlength: 500 },
      publicId: { type: String, maxlength: 200 },
      public_id: { type: String, maxlength: 200 }, // Alternative naming
      format: { type: String, maxlength: 50 },
      bytes: { type: Number, min: 0 },
      // Local file storage fields
      filename: { type: String, maxlength: 255 },
      originalName: { type: String, maxlength: 255 },
      documentName: { type: String, maxlength: 255 }, // Alternative naming
      path: { type: String, maxlength: 500 },
      mimetype: { type: String, maxlength: 100 },
      size: { type: Number, min: 0 },
      documentSize: { type: Number, min: 0 }, // Alternative naming
      documentFormat: { type: String, maxlength: 50 }, // Alternative naming
      documentUrl: { type: String, maxlength: 500 }, // Alternative naming
      uploadedAt: { type: Date }
    },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    status: { type: String, enum: ['pending', 'under_review', 'approved', 'rejected', 'on_hold'], default: 'pending', index: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    submittedAt: { type: Date, default: Date.now, index: true },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    reviewNotes: { type: String, maxlength: 2000 },
    approvalDate: { type: Date },
    startDate: { type: Date },
    endDate: { type: Date },
    teamMembers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        proposedRole: { type: String, required: true, maxlength: 100 },
        skills: [{ type: String, maxlength: 100 }],
        availabilityHoursPerWeek: { type: Number, min: 1, max: 40 },
      },
    ],
    resources: [
      {
        resourceType: { type: String, enum: ['equipment', 'software', 'funding', 'space', 'other'], required: true },
        description: { type: String, required: true, maxlength: 500 },
        estimatedCost: { type: Number, min: 0 },
        priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
      },
    ],
    // Soft deletion fields
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Audit trail for tracking all changes
    auditTrail: [
      {
        action: { type: String, required: true, enum: ['created', 'updated', 'approved', 'rejected', 'status_changed', 'deleted'] },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        performedAt: { type: Date, default: Date.now },
        changes: {
          field: { type: String, required: true },
          oldValue: { type: mongoose.Schema.Types.Mixed },
          newValue: { type: mongoose.Schema.Types.Mixed },
        },
        reason: { type: String, maxlength: 500 },
        ipAddress: { type: String },
        userAgent: { type: String },
        metadata: { type: mongoose.Schema.Types.Mixed }
      }
    ],
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

// Instance method to add audit trail entry
projectRequestSchema.methods.addAuditEntry = function(action, performedBy, changes, reason = null, req = null) {
  const auditEntry = {
    action,
    performedBy,
    performedAt: new Date(),
    changes,
    reason,
    ipAddress: req ? req.ip : null,
    userAgent: req ? req.get('User-Agent') : null,
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
  };
  
  this.auditTrail.push(auditEntry);
  return this;
};

// Instance method to get audit trail
projectRequestSchema.methods.getAuditTrail = function() {
  return this.auditTrail.sort((a, b) => new Date(b.performedAt) - new Date(a.performedAt));
};

// Instance method to get audit trail by action
projectRequestSchema.methods.getAuditTrailByAction = function(action) {
  return this.auditTrail.filter(entry => entry.action === action);
};

// Instance method to get audit trail by user
projectRequestSchema.methods.getAuditTrailByUser = function(userId) {
  return this.auditTrail.filter(entry => entry.performedBy.toString() === userId.toString());
};

// Static method to get all audit trails (admin only)
projectRequestSchema.statics.getAllAuditTrails = function(limit = 100, skip = 0) {
  return this.find({ 'auditTrail.0': { $exists: true } })
    .select('title auditTrail submittedBy')
    .populate('auditTrail.performedBy', 'firstName lastName email role')
    .populate('submittedBy', 'firstName lastName email')
    .limit(limit)
    .skip(skip)
    .sort({ 'auditTrail.performedAt': -1 });
};

module.exports = mongoose.model('ProjectRequest', projectRequestSchema);


