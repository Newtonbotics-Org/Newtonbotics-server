const notificationService = require('../src/services/notificationService');

// Example usage of the notification service
async function exampleNotificationUsage() {
  console.log('🔔 Notification Service Examples\n');

  try {
    // Example 1: Send a system alert to all admins
    console.log('📢 Example 1: Send system alert to all admins');
    const systemAlert = await notificationService.notifySystemAlert(
      'High CPU Usage Detected',
      'Server CPU usage has exceeded 90% for the past 5 minutes. Please investigate.',
      'high'
    );
    console.log('✅ System alert sent:', systemAlert.length, 'notifications created');
    console.log('');

    // Example 2: Send project approval notification
    console.log('📢 Example 2: Send project approval notification');
    const projectApproval = await notificationService.notifyProjectApproval(
      {
        _id: 'project_request_id',
        title: 'AI-Powered Robot Navigation System'
      },
      'user_id_who_submitted'
    );
    console.log('✅ Project approval notification sent');
    console.log('');

    // Example 3: Send project rejection notification
    console.log('📢 Example 3: Send project rejection notification');
    const projectRejection = await notificationService.notifyProjectRejection(
      {
        _id: 'project_request_id',
        title: 'Blockchain Voting System'
      },
      'user_id_who_submitted',
      'Project scope is too broad and lacks technical feasibility'
    );
    console.log('✅ Project rejection notification sent');
    console.log('');

    // Example 4: Send security alert
    console.log('📢 Example 4: Send security alert');
    const securityAlert = await notificationService.notifySecurityAlert(
      'Suspicious Login Attempt',
      'Multiple failed login attempts detected from IP 192.168.1.100'
    );
    console.log('✅ Security alert sent:', securityAlert.length, 'notifications created');
    console.log('');

    // Example 5: Send contact submission notification
    console.log('📢 Example 5: Send contact submission notification');
    const contactNotification = await notificationService.notifyContactSubmission({
      _id: 'contact_submission_id',
      name: 'John Doe',
      subject: 'Partnership Inquiry',
      email: 'john@example.com'
    });
    console.log('✅ Contact submission notification sent:', contactNotification.length, 'notifications created');
    console.log('');

    console.log('🎉 All notification examples completed successfully!');

  } catch (error) {
    console.error('❌ Notification example failed:', error.message);
  }
}

// Run the examples
exampleNotificationUsage();


