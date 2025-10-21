const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Email notification settings
  email: {
    enabled: { type: Boolean, default: true },
    projectUpdates: { type: Boolean, default: true },
    projectApprovals: { type: Boolean, default: true },
    projectRejections: { type: Boolean, default: true },
    workshopUpdates: { type: Boolean, default: true },
    eventUpdates: { type: Boolean, default: true },
    newsUpdates: { type: Boolean, default: true },
    systemAlerts: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: true },
    roleApprovals: { type: Boolean, default: true },
    inventoryAlerts: { type: Boolean, default: true },
    contactSubmissions: { type: Boolean, default: true }
  },
  
  // Push notification settings
  push: {
    enabled: { type: Boolean, default: true },
    projectUpdates: { type: Boolean, default: true },
    projectApprovals: { type: Boolean, default: true },
    projectRejections: { type: Boolean, default: true },
    workshopUpdates: { type: Boolean, default: true },
    eventUpdates: { type: Boolean, default: true },
    newsUpdates: { type: Boolean, default: true },
    systemAlerts: { type: Boolean, default: true },
    roleApprovals: { type: Boolean, default: true },
    inventoryAlerts: { type: Boolean, default: true },
    contactSubmissions: { type: Boolean, default: true }
  },
  
  // SMS notification settings
  sms: {
    enabled: { type: Boolean, default: false },
    projectApprovals: { type: Boolean, default: false },
    projectRejections: { type: Boolean, default: false },
    systemAlerts: { type: Boolean, default: false },
    emergencyAlerts: { type: Boolean, default: true }
  },
  
  // In-app notification settings
  inApp: {
    enabled: { type: Boolean, default: true },
    projectUpdates: { type: Boolean, default: true },
    projectApprovals: { type: Boolean, default: true },
    projectRejections: { type: Boolean, default: true },
    workshopUpdates: { type: Boolean, default: true },
    eventUpdates: { type: Boolean, default: true },
    newsUpdates: { type: Boolean, default: true },
    systemAlerts: { type: Boolean, default: true },
    roleApprovals: { type: Boolean, default: true },
    inventoryAlerts: { type: Boolean, default: true },
    contactSubmissions: { type: Boolean, default: true }
  },
  
  // Notification frequency settings
  frequency: {
    immediate: { type: Boolean, default: true },
    daily: { type: Boolean, default: false },
    weekly: { type: Boolean, default: false },
    monthly: { type: Boolean, default: false }
  },
  
  // Quiet hours settings
  quietHours: {
    enabled: { type: Boolean, default: false },
    startTime: { type: String, default: '22:00' }, // 24-hour format
    endTime: { type: String, default: '08:00' },   // 24-hour format
    timezone: { type: String, default: 'UTC' }
  },
  
  // Admin-specific notification settings
  adminSettings: {
    criticalAlerts: { type: Boolean, default: true },
    systemHealth: { type: Boolean, default: true },
    userActivity: { type: Boolean, default: true },
    securityAlerts: { type: Boolean, default: true },
    backupAlerts: { type: Boolean, default: true },
    performanceAlerts: { type: Boolean, default: true }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notificationSettingsSchema.index({ userId: 1 });
notificationSettingsSchema.index({ 'email.enabled': 1 });
notificationSettingsSchema.index({ 'push.enabled': 1 });

// Instance method to get notification settings for a specific type
notificationSettingsSchema.methods.getSettingsForType = function(type) {
  const settings = {
    email: this.email,
    push: this.push,
    sms: this.sms,
    inApp: this.inApp
  };
  
  return settings[type] || {};
};

// Instance method to check if a specific notification type is enabled
notificationSettingsSchema.methods.isNotificationEnabled = function(channel, type) {
  const channelSettings = this[channel];
  if (!channelSettings || !channelSettings.enabled) {
    return false;
  }
  
  return channelSettings[type] !== false;
};

// Instance method to update notification settings
notificationSettingsSchema.methods.updateSettings = function(updates) {
  Object.keys(updates).forEach(key => {
    if (this.schema.paths[key]) {
      this[key] = updates[key];
    }
  });
  return this.save();
};

// Static method to get or create notification settings for a user
notificationSettingsSchema.statics.getOrCreateSettings = async function(userId) {
  let settings = await this.findOne({ userId });
  
  if (!settings) {
    settings = await this.create({ userId });
  }
  
  return settings;
};

// Static method to get users who should receive a specific notification type
notificationSettingsSchema.statics.getUsersForNotification = async function(channel, type) {
  const query = {
    [`${channel}.enabled`]: true,
    [`${channel}.${type}`]: true
  };
  
  const settings = await this.find(query).populate('userId', 'email firstName lastName role');
  return settings.map(setting => setting.userId);
};

module.exports = mongoose.model('NotificationSettings', notificationSettingsSchema);


