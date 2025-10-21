const Notification = require('../models/Notification');
const NotificationSettings = require('../models/NotificationSettings');
const User = require('../models/User');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.emailService = null;
    this.pushService = null;
    this.smsService = null;
  }

  // Set external services
  setEmailService(emailService) {
    this.emailService = emailService;
  }

  setPushService(pushService) {
    this.pushService = pushService;
  }

  setSMSService(smsService) {
    this.smsService = smsService;
  }

  // Create and send notification
  async createAndSendNotification(data) {
    try {
      // Create notification record
      const notification = await Notification.createNotification({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority || 'medium',
        category: data.category || 'info',
        relatedEntity: data.relatedEntity,
        action: data.action,
        expiresAt: data.expiresAt,
        metadata: data.metadata
      });

      // Get user notification settings
      const settings = await NotificationSettings.getOrCreateSettings(data.userId);

      // Send notifications based on settings
      const deliveryPromises = [];

      // Email notification
      if (settings.isNotificationEnabled('email', data.type) && this.emailService) {
        deliveryPromises.push(
          this.sendEmailNotification(notification, settings)
        );
      }

      // Push notification
      if (settings.isNotificationEnabled('push', data.type) && this.pushService) {
        deliveryPromises.push(
          this.sendPushNotification(notification, settings)
        );
      }

      // SMS notification
      if (settings.isNotificationEnabled('sms', data.type) && this.smsService) {
        deliveryPromises.push(
          this.sendSMSNotification(notification, settings)
        );
      }

      // Wait for all delivery attempts
      await Promise.allSettled(deliveryPromises);

      return notification;
    } catch (error) {
      logger.error('Failed to create and send notification:', error);
      throw error;
    }
  }

  // Send notification to multiple users
  async sendBulkNotification(data) {
    try {
      const notifications = [];

      for (const userId of data.userIds) {
        const notificationData = {
          ...data,
          userId
        };

        const notification = await this.createAndSendNotification(notificationData);
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      logger.error('Failed to send bulk notification:', error);
      throw error;
    }
  }

  // Send notification to users by role
  async sendNotificationToRole(data) {
    try {
      const users = await User.find({ role: data.role, isActive: true });
      const userIds = users.map(user => user._id);

      return await this.sendBulkNotification({
        ...data,
        userIds
      });
    } catch (error) {
      logger.error('Failed to send notification to role:', error);
      throw error;
    }
  }

  // Send notification to admins
  async sendAdminNotification(data) {
    try {
      return await this.sendNotificationToRole({
        ...data,
        role: 'admin'
      });
    } catch (error) {
      logger.error('Failed to send admin notification:', error);
      throw error;
    }
  }

  // Send email notification
  async sendEmailNotification(notification, settings) {
    try {
      if (!this.emailService) {
        throw new Error('Email service not configured');
      }

      const user = await User.findById(notification.userId);
      if (!user || !user.email) {
        throw new Error('User email not found');
      }

      // Check quiet hours
      if (this.isInQuietHours(settings.quietHours)) {
        logger.info(`Skipping email notification due to quiet hours for user ${user._id}`);
        return;
      }

      const emailData = {
        to: user.email,
        subject: notification.title,
        template: this.getEmailTemplate(notification.type),
        data: {
          user: user.toObject(),
          notification: notification.toObject(),
          actionUrl: notification.action?.url
        }
      };

      await this.emailService.sendEmail(emailData);

      // Update delivery status
      await notification.updateDeliveryStatus('email', { sent: true });

      logger.info(`Email notification sent to ${user.email}`);
    } catch (error) {
      logger.error('Failed to send email notification:', error);
      await notification.updateDeliveryStatus('email', { 
        sent: false, 
        error: error.message 
      });
    }
  }

  // Send push notification
  async sendPushNotification(notification, settings) {
    try {
      if (!this.pushService) {
        throw new Error('Push service not configured');
      }

      const user = await User.findById(notification.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check quiet hours
      if (this.isInQuietHours(settings.quietHours)) {
        logger.info(`Skipping push notification due to quiet hours for user ${user._id}`);
        return;
      }

      const pushData = {
        userId: user._id,
        title: notification.title,
        body: notification.message,
        data: {
          notificationId: notification._id,
          type: notification.type,
          actionUrl: notification.action?.url
        }
      };

      await this.pushService.sendPush(pushData);

      // Update delivery status
      await notification.updateDeliveryStatus('push', { sent: true });

      logger.info(`Push notification sent to user ${user._id}`);
    } catch (error) {
      logger.error('Failed to send push notification:', error);
      await notification.updateDeliveryStatus('push', { 
        sent: false, 
        error: error.message 
      });
    }
  }

  // Send SMS notification
  async sendSMSNotification(notification, settings) {
    try {
      if (!this.smsService) {
        throw new Error('SMS service not configured');
      }

      const user = await User.findById(notification.userId);
      if (!user || !user.phone) {
        throw new Error('User phone not found');
      }

      // Check quiet hours
      if (this.isInQuietHours(settings.quietHours)) {
        logger.info(`Skipping SMS notification due to quiet hours for user ${user._id}`);
        return;
      }

      const smsData = {
        to: user.phone,
        message: `${notification.title}: ${notification.message}`,
        priority: notification.priority
      };

      await this.smsService.sendSMS(smsData);

      // Update delivery status
      await notification.updateDeliveryStatus('sms', { sent: true });

      logger.info(`SMS notification sent to ${user.phone}`);
    } catch (error) {
      logger.error('Failed to send SMS notification:', error);
      await notification.updateDeliveryStatus('sms', { 
        sent: false, 
        error: error.message 
      });
    }
  }

  // Check if current time is in quiet hours
  isInQuietHours(quietHours) {
    if (!quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const startTime = this.parseTime(quietHours.startTime);
    const endTime = this.parseTime(quietHours.endTime);

    if (startTime <= endTime) {
      // Same day quiet hours (e.g., 22:00 to 08:00 next day)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Parse time string to minutes
  parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Get email template name based on notification type
  getEmailTemplate(type) {
    const templateMap = {
      'project_update': 'project-update',
      'project_approval': 'project-approval',
      'project_rejection': 'project-rejection',
      'workshop_update': 'workshop-update',
      'event_update': 'event-update',
      'news_update': 'news-update',
      'system_alert': 'system-alert',
      'role_approval': 'role-approval',
      'inventory_alert': 'inventory-alert',
      'contact_submission': 'contact-submission',
      'security_alert': 'security-alert',
      'backup_alert': 'backup-alert',
      'performance_alert': 'performance-alert',
      'user_activity': 'user-activity',
      'system_health': 'system-health'
    };

    return templateMap[type] || 'default';
  }

  // System notification helpers
  async notifyProjectUpdate(project, action, userId) {
    return await this.createAndSendNotification({
      userId,
      title: `Project ${action}`,
      message: `Project "${project.title}" has been ${action}`,
      type: 'project_update',
      priority: 'medium',
      relatedEntity: {
        type: 'project',
        id: project._id,
        title: project.title
      },
      action: {
        type: 'view',
        url: `/projects/${project._id}`,
        label: 'View Project'
      }
    });
  }

  async notifyProjectApproval(projectRequest, userId) {
    return await this.createAndSendNotification({
      userId,
      title: 'Project Request Approved',
      message: `Your project request "${projectRequest.title}" has been approved!`,
      type: 'project_approval',
      priority: 'high',
      category: 'success',
      relatedEntity: {
        type: 'project',
        id: projectRequest._id,
        title: projectRequest.title
      },
      action: {
        type: 'view',
        url: `/project-requests/${projectRequest._id}`,
        label: 'View Request'
      }
    });
  }

  async notifyProjectRejection(projectRequest, userId, reason) {
    return await this.createAndSendNotification({
      userId,
      title: 'Project Request Rejected',
      message: `Your project request "${projectRequest.title}" has been rejected. ${reason ? `Reason: ${reason}` : ''}`,
      type: 'project_rejection',
      priority: 'high',
      category: 'error',
      relatedEntity: {
        type: 'project',
        id: projectRequest._id,
        title: projectRequest.title
      },
      action: {
        type: 'view',
        url: `/project-requests/${projectRequest._id}`,
        label: 'View Request'
      }
    });
  }

  async notifySystemAlert(title, message, priority = 'medium') {
    return await this.sendAdminNotification({
      title,
      message,
      type: 'system_alert',
      priority,
      category: 'system'
    });
  }

  async notifySecurityAlert(title, message) {
    return await this.sendAdminNotification({
      title,
      message,
      type: 'security_alert',
      priority: 'critical',
      category: 'error'
    });
  }

  async notifyContactSubmission(contactSubmission) {
    return await this.sendAdminNotification({
      title: 'New Contact Submission',
      message: `New contact form submission from ${contactSubmission.name}`,
      type: 'contact_submission',
      priority: 'medium',
      relatedEntity: {
        type: 'contact',
        id: contactSubmission._id,
        title: contactSubmission.subject
      },
      action: {
        type: 'view',
        url: `/admin/contacts/${contactSubmission._id}`,
        label: 'View Submission'
      }
    });
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;


