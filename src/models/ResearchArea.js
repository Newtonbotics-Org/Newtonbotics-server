const mongoose = require('mongoose');

const researchAreaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 200, trim: true, index: true },
    description: { type: String, required: true, maxlength: 2000, trim: true },
    category: { type: String, required: true, maxlength: 100, trim: true, index: true },
    keywords: [{ type: String, maxlength: 100, trim: true, index: true }],
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    featuredImageUrl: { type: String, maxlength: 500 },
    color: { type: String, maxlength: 7 }, // Hex color for UI
    order: { type: Number, default: 0, min: 0, index: true }, // Display order
    // Statistics (can be updated periodically)
    projectCount: { type: Number, default: 0, min: 0 },
    publicationCount: { type: Number, default: 0, min: 0 },
    memberCount: { type: Number, default: 0, min: 0 },
    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    externalLinks: [
      {
        title: { type: String, required: true, maxlength: 100, trim: true },
        url: { type: String, required: true, maxlength: 500, trim: true },
        description: { type: String, maxlength: 500, trim: true },
      },
    ],
    // Research focus areas
    focusAreas: [{ type: String, maxlength: 200, trim: true }],
    // Equipment and resources specific to this area
    requiredEquipment: [{ type: String, maxlength: 200, trim: true }],
    // Skills and expertise needed
    requiredSkills: [{ type: String, maxlength: 200, trim: true }],
    // Collaboration opportunities
    collaborationOpportunities: { type: String, maxlength: 1000, trim: true },
    // Funding and grants information
    fundingInfo: { type: String, maxlength: 1000, trim: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

// Compound index for efficient queries
researchAreaSchema.index({ category: 1, isActive: 1 });
researchAreaSchema.index({ keywords: 1, isActive: 1 });

module.exports = mongoose.model('ResearchArea', researchAreaSchema);
