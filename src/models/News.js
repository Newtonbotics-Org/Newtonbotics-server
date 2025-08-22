const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 255, trim: true, index: true },
    content: { type: String, required: true, maxlength: 10000 },
    excerpt: { type: String, maxlength: 500 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'NewsCategory', index: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    featuredImageUrl: { type: String, maxlength: 500 },
    tags: [{ type: String, maxlength: 100, index: true }],
    isFeatured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, index: true },
    viewCount: { type: Number, default: 0, min: 0 },
    // Optional display/feature options used by the frontend navigation and surfaces
    featureOptions: {
      showInNav: { type: Boolean, default: false, index: true },
      navLabel: { type: String, maxlength: 50, trim: true },
      navOrder: { type: Number, default: 0, min: 0 },
    },
    // Optional application settings to allow users to apply directly from a news item
    application: {
      isEnabled: { type: Boolean, default: false, index: true },
      type: {
        type: String,
        enum: ['workshop', 'event', 'competition', 'other'],
        default: 'other',
        index: true,
      },
      requireLogin: { type: Boolean, default: false },
      deadline: { type: Date },
      maxApplicants: { type: Number, min: 1 },
      formFields: [
        {
          name: { type: String, required: true, trim: true, maxlength: 100 },
          label: { type: String, required: true, trim: true, maxlength: 255 },
          type: {
            type: String,
            enum: ['text', 'email', 'phone', 'textarea', 'select', 'radio', 'checkbox', 'url', 'number'],
            default: 'text',
          },
          required: { type: Boolean, default: false },
          options: [{ type: String, maxlength: 100 }],
        },
      ],
      // Optional target linkage for internal entities like Workshop or Event
      targetType: { type: String, enum: ['Workshop', 'Event', 'Competition', 'Other'], default: 'Other' },
      targetId: { type: mongoose.Schema.Types.ObjectId },
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('News', newsSchema);


