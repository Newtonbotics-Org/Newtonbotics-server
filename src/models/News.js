const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 255, trim: true },
    content: { type: String, required: true, maxlength: 10000 },
    excerpt: { type: String, maxlength: 500 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'NewsCategory' },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    featuredImageUrl: { type: String, maxlength: 500 },
    tags: [{ type: String, maxlength: 100 }],
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    viewCount: { type: Number, default: 0, min: 0 },
    // Optional display/feature options used by the frontend navigation and surfaces
    featureOptions: {
      showInNav: { type: Boolean, default: false },
      navLabel: { type: String, maxlength: 50, trim: true },
      navOrder: { type: Number, default: 0, min: 0 },
    },
    // Optional application settings to allow users to apply directly from a news item
    application: {
      isEnabled: { type: Boolean, default: false },
      type: {
        type: String,
        enum: ['workshop', 'event', 'competition', 'other'],
        default: 'other',
      },
      requireLogin: { type: Boolean, default: false },
      formApplyStartDate: { type: Date }, // When applications can start being submitted
      formApplyLastDate: { type: Date }, // When applications close (deadline)
      maxApplicants: { type: Number, min: 1 },
      formLink: { type: String, maxlength: 500 }, // External form link for applications
      // Auto-calculated status based on current date
      status: {
        type: String,
        enum: ['active', 'expired', 'not_started'],
        default: 'not_started'
      },
      // Optional target linkage for internal entities like Workshop or Event
      targetType: { type: String, enum: ['Workshop', 'Event', 'Competition', 'Other'], default: 'Other' },
      targetId: { type: mongoose.Schema.Types.ObjectId },
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

// Pre-save middleware to automatically calculate application status
newsSchema.pre('save', function(next) {
  if (this.application && this.application.isEnabled) {
    const now = new Date();
    const startDate = this.application.formApplyStartDate;
    const lastDate = this.application.formApplyLastDate;
    
    if (!startDate || !lastDate) {
      this.application.status = 'not_started';
    } else if (now < startDate) {
      this.application.status = 'not_started';
    } else if (now > lastDate) {
      this.application.status = 'expired';
    } else {
      this.application.status = 'active';
    }
  }
  next();
});

// Pre-find middleware to update status for existing documents
newsSchema.pre('find', function() {
  // IMPORTANT: Do not mutate the active find query here. Using this.updateMany()
  // would turn this operation into an update and yield no documents.
  // Instead, trigger a background model-level update to refresh statuses.
  this.model.updateMany(
    {
      'application.isEnabled': true,
      'application.formApplyStartDate': { $exists: true },
      'application.formApplyLastDate': { $exists: true }
    },
    [
      {
        $set: {
          'application.status': {
            $cond: {
              if: { $lt: ['$application.formApplyStartDate', new Date()] },
              then: {
                $cond: {
                  if: { $gt: ['$application.formApplyLastDate', new Date()] },
                  then: 'active',
                  else: 'expired'
                }
              },
              else: 'not_started'
            }
          }
        }
      }
    ]
  ).catch(() => {});
});

module.exports = mongoose.model('News', newsSchema);


