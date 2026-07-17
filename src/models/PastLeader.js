const mongoose = require('mongoose');
const { coerceTenureDate } = require('../utils/tenureDates');

const pastLeaderSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, maxlength: 200, trim: true, index: true },
    position: { type: String, required: true, maxlength: 100, trim: true, index: true },
    tenureStart: { type: Date, required: true, index: true },
    tenureEnd: { type: Date },
    imageUrl: { type: String, maxlength: 500, trim: true },
    linkedinUrl: { type: String, maxlength: 500, trim: true },
    email: { type: String, maxlength: 200, trim: true, lowercase: true },
    description: { type: String, maxlength: 1000, trim: true },
    achievements: [{ type: String, maxlength: 300, trim: true }],
    order: { type: Number, default: 0, min: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    subrole: { type: String, maxlength: 100, trim: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

pastLeaderSchema.pre('validate', function normalizeTenureDates(next) {
  this.tenureStart = coerceTenureDate(this.tenureStart);
  if (this.tenureEnd != null && this.tenureEnd !== '') {
    this.tenureEnd = coerceTenureDate(this.tenureEnd);
  } else {
    this.tenureEnd = undefined;
  }
  next();
});

pastLeaderSchema.index({ tenureStart: -1, order: 1 });

module.exports = mongoose.model('PastLeader', pastLeaderSchema);
