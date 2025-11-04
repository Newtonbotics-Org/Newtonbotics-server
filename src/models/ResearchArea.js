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
    memberCount: { type: Number, default: 0, min: 0 }, // Auto-calculated from studentIds
    // Students/Team members working on this research area
    studentIds: [{ type: String, trim: true, maxlength: 50 }], // Array of student/user IDs
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

// Method to calculate and update memberCount based on studentIds
researchAreaSchema.methods.calculateMemberCount = async function() {
  if (!this.studentIds || this.studentIds.length === 0) {
    this.memberCount = 0;
    return 0;
  }
  
  // Count unique active users whose _id or studentId matches any studentId
  const User = mongoose.model('User');
  const validIds = this.studentIds.filter(id => id && typeof id === 'string' && id.trim().length > 0);
  
  if (validIds.length === 0) {
    this.memberCount = 0;
    return 0;
  }
  
  // Try to match by ObjectId first, then by studentId
  const objectIds = validIds.filter(id => mongoose.Types.ObjectId.isValid(id));
  const studentIdStrings = validIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
  
  let count = 0;
  
  // Count users by ObjectId
  if (objectIds.length > 0) {
    const objectIdMatches = await User.countDocuments({
      _id: { $in: objectIds.map(id => new mongoose.Types.ObjectId(id)) },
      isActive: true
    });
    count += objectIdMatches;
  }
  
  // Count users by studentId (avoid double-counting if same user matches both)
  if (studentIdStrings.length > 0) {
    // Get users that match by studentId but don't already match by _id
    const studentIdMatches = await User.countDocuments({
      studentId: { $in: studentIdStrings },
      isActive: true,
      ...(objectIds.length > 0 ? {
        _id: { $nin: objectIds.map(id => new mongoose.Types.ObjectId(id)) }
      } : {})
    });
    count += studentIdMatches;
  }
  
  this.memberCount = count;
  return count;
};

// Pre-save hook to automatically calculate memberCount
researchAreaSchema.pre('save', async function(next) {
  // Only calculate if studentIds is being modified or if it's a new document
  if (this.isNew || this.isModified('studentIds')) {
    try {
      await this.calculateMemberCount();
    } catch (error) {
      // If calculation fails, set to 0 and continue
      this.memberCount = 0;
    }
  }
  next();
});

// Compound index for efficient queries
researchAreaSchema.index({ category: 1, isActive: 1 });
researchAreaSchema.index({ keywords: 1, isActive: 1 });

module.exports = mongoose.model('ResearchArea', researchAreaSchema);
