const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fullName: { type: String, maxlength: 200 },
    email: { type: String, maxlength: 255, lowercase: true, trim: true },
    phone: { type: String, maxlength: 50 },
  },
  { _id: false }
);

const responseSchema = new mongoose.Schema(
  {
    fieldName: { type: String, required: true, trim: true, maxlength: 100 },
    value: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const newsApplicationSchema = new mongoose.Schema(
  {
    newsId: { type: mongoose.Schema.Types.ObjectId, ref: 'News', required: true, index: true },
    type: { type: String, enum: ['workshop', 'event', 'competition', 'other'], default: 'other', index: true },
    applicant: applicantSchema,
    responses: [responseSchema],
    status: { type: String, enum: ['submitted', 'reviewed', 'accepted', 'rejected', 'waitlisted', 'withdrawn'], default: 'submitted', index: true },
    submittedAt: { type: Date, default: Date.now, index: true },
    reviewedAt: { type: Date },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, maxlength: 2000 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('NewsApplication', newsApplicationSchema);


