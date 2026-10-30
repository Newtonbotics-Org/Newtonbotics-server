const mongoose = require('mongoose');

const auditEntrySchema = new mongoose.Schema({
  action: { type: String, required: true, enum: ['created', 'updated', 'deleted'] },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  performedAt: { type: Date, default: Date.now, required: true },
  changes: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String, maxlength: 100 },
  userAgent: { type: String, maxlength: 500 },
}, { _id: false });

const projectComponentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 255 },
  nameKey: { type: String, required: true, trim: true, lowercase: true, maxlength: 255 },
  category: { type: String, required: true, trim: true, maxlength: 100 },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    validate: { validator: Number.isInteger, message: 'Quantity must be a whole number' },
  },
  minimumQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    validate: { validator: Number.isInteger, message: 'Minimum quantity must be a whole number' },
  },
  location: { type: String, trim: true, maxlength: 255 },
  description: { type: String, trim: true, maxlength: 2000 },
  isDeleted: { type: Boolean, default: false, index: true },
  auditTrail: { type: [auditEntrySchema], default: [] },
}, {
  timestamps: true,
  optimisticConcurrency: true,
});

projectComponentSchema.index({ projectId: 1, nameKey: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
projectComponentSchema.index({ projectId: 1, isDeleted: 1, category: 1, name: 1 });

module.exports = mongoose.model('ProjectComponent', projectComponentSchema);