const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  title: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  
  message: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  
  type: {
    type: String,
    required: true,
    enum: [
      'project_update',
      'project_approval',
      'project_rejection',
      'workshop_update',
      'event_update',
      'news_update',
      'system_alert',
      'role_approval',
      'inventory_alert',
      'contact_submission',
      'security_alert',
      'backup_alert',
      'performance_alert',
      'user_activity',
      'system_health'
    ],
    index: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  
  category: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'system'],
    default: 'info',
    index: true
  },
  
  // Related entity information
  relatedEntity: {
    type: {
      type: String,
      enum: ['project', 'workshop', 'event', 'news', 'user', 'inventory', 'contact', 'system']
    },
    id: { type: mongoose.Schema.Types.ObjectId },
    title: { type: String }
  },
  
  // Action information
  action: {
    type: {
      type: String,
      enum: ['view', 'approve', 'reject', 'edit', 'delete', 'respond', 'none']
    },
    url: { type: String },
    label: { type: String }
  },
  
  // Delivery status
  delivery: {
    email: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      error: { type: String }
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      error: { type: String }
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      error: { type: String }
    },
    inApp: {
      delivered: { type: Boolean, default: true },
      deliveredAt: { type: Date, default: Date.now }
    }
  },
  
  // Read status
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  
  readAt: {
    type: Date
  },
  
  // Archive status
  archived: {
    type: Boolean,
    default: false,
    index: true
  },
  
  archivedAt: {
    type: Date
  },
  
  // Expiration
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, archived: 1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Instance method to archive
notificationSchema.methods.archive = function() {
  this.archived = true;
  this.archivedAt = new Date();
  return this.save();
};

// Instance method to update delivery status
notificationSchema.methods.updateDeliveryStatus = function(channel, status) {
  if (this.delivery[channel]) {
    this.delivery[channel] = {
      ...this.delivery[channel],
      ...status,
      sentAt: status.sent ? new Date() : this.delivery[channel].sentAt
    };
  }
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this({
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: data.type,
    priority: data.priority || 'medium',
    category: data.category || 'info',
    relatedEntity: data.relatedEntity,
    action: data.action,
    expiresAt: data.expiresAt,
    metadata: data.metadata || {}
  });
  
  return await notification.save();
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  // Ensure userId is converted to ObjectId
  const userIdObj = userId instanceof mongoose.Types.ObjectId ? userId : new mongoose.Types.ObjectId(userId);
  const {
    limit = 20,
    skip = 0,
    read = null,
    archived = false,
    type = null,
    priority = null
  } = options;
  
  const query = { userId: userIdObj, archived };
  
  if (read !== null) query.read = read;
  if (type) query.type = type;
  if (priority) query.priority = priority;
  
  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get notification statistics
notificationSchema.statics.getNotificationStats = async function(userId) {
  // Ensure userId is converted to ObjectId
  const userIdObj = userId instanceof mongoose.Types.ObjectId ? userId : new mongoose.Types.ObjectId(userId);
  
  const [baseStats, typeStats, priorityStats] = await Promise.all([
    // Base statistics
    this.aggregate([
      { $match: { userId: userIdObj, archived: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] } },
          read: { $sum: { $cond: [{ $eq: ['$read', true] }, 1, 0] } }
        }
      }
    ]),
    // Statistics by type
    this.aggregate([
      { $match: { userId: userIdObj, archived: false } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]),
    // Statistics by priority
    this.aggregate([
      { $match: { userId: userIdObj, archived: false } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          priority: '$_id',
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ])
  ]);
  
  const base = baseStats[0] || { total: 0, unread: 0, read: 0 };
  
  return {
    total: base.total || 0,
    unread: base.unread || 0,
    read: base.read || 0,
    byType: typeStats || [],
    byPriority: priorityStats || []
  };
};

// Static method to mark multiple notifications as read
notificationSchema.statics.markMultipleAsRead = async function(userId, notificationIds) {
  return await this.updateMany(
    { _id: { $in: notificationIds }, userId },
    { read: true, readAt: new Date() }
  );
};

// Static method to archive old notifications
notificationSchema.statics.archiveOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return await this.updateMany(
    { 
      createdAt: { $lt: cutoffDate },
      archived: false,
      read: true
    },
    { 
      archived: true,
      archivedAt: new Date()
    }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);
