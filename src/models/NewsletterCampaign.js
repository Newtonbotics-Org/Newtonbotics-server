const mongoose = require('mongoose');

const newsletterCampaignSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true, 
      maxlength: 255, 
      trim: true 
    },
    subject: { 
      type: String, 
      required: true, 
      maxlength: 255, 
      trim: true 
    },
    content: { 
      type: String, 
      required: true, 
      maxlength: 50000 
    },
    excerpt: { 
      type: String, 
      maxlength: 500, 
      trim: true 
    },
    authorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'cancelled'],
      default: 'draft'
    },
    scheduledAt: { 
      type: Date 
    },
    sentAt: { 
      type: Date 
    },
    targetAudience: {
      type: String,
      enum: ['all', 'active', 'inactive', 'custom'],
      default: 'all'
    },
    customEmails: [{ 
      type: String, 
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format'
      }
    }],
    excludeEmails: [{ 
      type: String, 
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format'
      }
    }],
    sendStats: {
      totalRecipients: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
      openedCount: { type: Number, default: 0 },
      clickedCount: { type: Number, default: 0 },
      unsubscribedCount: { type: Number, default: 0 }
    },
    template: {
      type: String,
      enum: ['default', 'news', 'announcement', 'event', 'custom'],
      default: 'default'
    },
    tags: [{ 
      type: String, 
      maxlength: 100, 
      trim: true 
    }],
    isTest: { 
      type: Boolean, 
      default: false 
    },
    testEmails: [{ 
      type: String, 
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format'
      }
    }],
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },
  { 
    timestamps: { 
      createdAt: 'createdAt', 
      updatedAt: 'updatedAt' 
    } 
  }
);

// Indexes for better query performance
newsletterCampaignSchema.index({ status: 1, scheduledAt: 1 });
newsletterCampaignSchema.index({ authorId: 1, createdAt: -1 });
newsletterCampaignSchema.index({ tags: 1 });

// Virtual for campaign URL (if needed for tracking)
newsletterCampaignSchema.virtual('campaignUrl').get(function() {
  return `${process.env.APP_BASE_URL || 'http://localhost:3000'}/newsletter/campaigns/${this._id}`;
});

// Method to get recipient count
newsletterCampaignSchema.methods.getRecipientCount = async function() {
  const NewsletterSubscription = mongoose.model('NewsletterSubscription');
  
  let query = {};
  
  switch (this.targetAudience) {
    case 'active':
      query.isActive = true;
      break;
    case 'inactive':
      query.isActive = false;
      break;
    case 'custom':
      query.email = { $in: this.customEmails };
      break;
    case 'all':
    default:
      // No additional filter
      break;
  }
  
  // Exclude specific emails if provided
  if (this.excludeEmails && this.excludeEmails.length > 0) {
    query.email = { ...query.email, $nin: this.excludeEmails };
  }
  
  return await NewsletterSubscription.countDocuments(query);
};

// Method to get recipients
newsletterCampaignSchema.methods.getRecipients = async function() {
  const NewsletterSubscription = mongoose.model('NewsletterSubscription');
  
  let query = {};
  
  switch (this.targetAudience) {
    case 'active':
      query.isActive = true;
      break;
    case 'inactive':
      query.isActive = false;
      break;
    case 'custom':
      query.email = { $in: this.customEmails };
      break;
    case 'all':
    default:
      // No additional filter
      break;
  }
  
  // Exclude specific emails if provided
  if (this.excludeEmails && this.excludeEmails.length > 0) {
    query.email = { ...query.email, $nin: this.excludeEmails };
  }
  
  return await NewsletterSubscription.find(query).select('email firstName lastName').lean();
};

// Pre-save middleware to update sendStats
newsletterCampaignSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'sent' && !this.sentAt) {
    this.sentAt = new Date();
  }
  next();
});

module.exports = mongoose.model('NewsletterCampaign', newsletterCampaignSchema);



