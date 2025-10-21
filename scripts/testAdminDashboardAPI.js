const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3005/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('❌ ADMIN_TOKEN environment variable is required');
  console.log('Please set ADMIN_TOKEN=your_admin_jwt_token');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testDashboardAPI() {
  console.log('🧪 Testing Admin Dashboard API...\n');

  try {
    // Test 1: Get dashboard summary
    console.log('📊 Test 1: Get dashboard summary (30 days)');
    const response1 = await axios.get(`${BASE_URL}/admin/dashboard/summary`, { headers });
    
    console.log('✅ Status:', response1.status);
    console.log('📈 Overview:', JSON.stringify(response1.data.data.overview, null, 2));
    console.log('📊 Recent Activity:', JSON.stringify(response1.data.data.recentActivity, null, 2));
    console.log('');

    // Test 2: Get dashboard summary with charts
    console.log('📊 Test 2: Get dashboard summary with charts (7 days)');
    const response2 = await axios.get(`${BASE_URL}/admin/dashboard/summary?period=7d&includeCharts=true`, { headers });
    
    console.log('✅ Status:', response2.status);
    console.log('📈 Charts available:', Object.keys(response2.data.data.charts || {}));
    console.log('');

    // Test 3: Get dashboard summary for different periods
    console.log('📊 Test 3: Get dashboard summary for 1 year');
    const response3 = await axios.get(`${BASE_URL}/admin/dashboard/summary?period=1y`, { headers });
    
    console.log('✅ Status:', response3.status);
    console.log('📈 Total Users:', response3.data.data.overview.totalUsers);
    console.log('');

    // Test 4: Test with invalid period
    console.log('📊 Test 4: Test with invalid period');
    try {
      const response4 = await axios.get(`${BASE_URL}/admin/dashboard/summary?period=invalid`, { headers });
      console.log('❌ Expected validation error but got success');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation error as expected:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

  } catch (error) {
    console.error('❌ Dashboard API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function testNotificationAPI() {
  console.log('🔔 Testing Notification API...\n');

  try {
    // Test 1: Get notifications
    console.log('📋 Test 1: Get notifications');
    const response1 = await axios.get(`${BASE_URL}/admin/dashboard/notifications`, { headers });
    
    console.log('✅ Status:', response1.status);
    console.log('📊 Stats:', JSON.stringify(response1.data.data.stats, null, 2));
    console.log('📋 Notifications count:', response1.data.data.notifications.length);
    console.log('');

    // Test 2: Get notifications with filters
    console.log('📋 Test 2: Get unread notifications only');
    const response2 = await axios.get(`${BASE_URL}/admin/dashboard/notifications?read=false&limit=10`, { headers });
    
    console.log('✅ Status:', response2.status);
    console.log('📋 Unread notifications:', response2.data.data.notifications.length);
    console.log('');

    // Test 3: Get notifications by priority
    console.log('📋 Test 3: Get high priority notifications');
    const response3 = await axios.get(`${BASE_URL}/admin/dashboard/notifications?priority=high`, { headers });
    
    console.log('✅ Status:', response3.status);
    console.log('📋 High priority notifications:', response3.data.data.notifications.length);
    console.log('');

    // Test 4: Mark notification as read (if any exist)
    if (response1.data.data.notifications.length > 0) {
      const firstNotification = response1.data.data.notifications[0];
      console.log('📋 Test 4: Mark notification as read');
      const response4 = await axios.put(`${BASE_URL}/admin/dashboard/notifications/${firstNotification._id}/read`, {}, { headers });
      
      console.log('✅ Status:', response4.status);
      console.log('✅ Notification marked as read');
      console.log('');
    } else {
      console.log('📋 Test 4: No notifications to mark as read');
      console.log('');
    }

    // Test 5: Mark all notifications as read
    console.log('📋 Test 5: Mark all notifications as read');
    const response5 = await axios.put(`${BASE_URL}/admin/dashboard/notifications/read-all`, {}, { headers });
    
    console.log('✅ Status:', response5.status);
    console.log('✅ Notifications marked as read:', response5.data.data.modifiedCount);
    console.log('');

  } catch (error) {
    console.error('❌ Notification API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function testNotificationSettingsAPI() {
  console.log('⚙️ Testing Notification Settings API...\n');

  try {
    // Test 1: Get notification settings
    console.log('⚙️ Test 1: Get notification settings');
    const response1 = await axios.get(`${BASE_URL}/admin/dashboard/settings`, { headers });
    
    console.log('✅ Status:', response1.status);
    console.log('⚙️ Email settings:', JSON.stringify(response1.data.data.settings.email, null, 2));
    console.log('');

    // Test 2: Update notification settings
    console.log('⚙️ Test 2: Update notification settings');
    const updateData = {
      email: {
        enabled: true,
        projectUpdates: true,
        projectApprovals: true,
        projectRejections: true,
        systemAlerts: true
      },
      push: {
        enabled: true,
        projectUpdates: true,
        systemAlerts: true
      },
      sms: {
        enabled: false,
        emergencyAlerts: true
      },
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00'
      }
    };

    const response2 = await axios.put(`${BASE_URL}/admin/dashboard/settings`, updateData, { headers });
    
    console.log('✅ Status:', response2.status);
    console.log('✅ Settings updated successfully');
    console.log('');

    // Test 3: Verify settings were updated
    console.log('⚙️ Test 3: Verify settings were updated');
    const response3 = await axios.get(`${BASE_URL}/admin/dashboard/settings`, { headers });
    
    console.log('✅ Status:', response3.status);
    console.log('⚙️ Quiet hours enabled:', response3.data.data.settings.quietHours.enabled);
    console.log('⚙️ Quiet hours time:', response3.data.data.settings.quietHours.startTime, '-', response3.data.data.settings.quietHours.endTime);
    console.log('');

  } catch (error) {
    console.error('❌ Notification Settings API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function testWithoutAdminToken() {
  console.log('🔒 Testing Authorization...\n');

  try {
    // Test 1: Dashboard without token
    console.log('🔒 Test 1: Dashboard without admin token');
    try {
      const response1 = await axios.get(`${BASE_URL}/admin/dashboard/summary`);
      console.log('❌ Expected authorization error but got success');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Authorization error as expected:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 2: Notifications without token
    console.log('🔒 Test 2: Notifications without admin token');
    try {
      const response2 = await axios.get(`${BASE_URL}/admin/dashboard/notifications`);
      console.log('❌ Expected authorization error but got success');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Authorization error as expected:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

  } catch (error) {
    console.error('❌ Authorization test failed:', error.message);
    throw error;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Admin Dashboard & Notification API Tests');
  console.log('=' .repeat(60));
  console.log('');

  try {
    await testDashboardAPI();
    await testNotificationAPI();
    await testNotificationSettingsAPI();
    await testWithoutAdminToken();

    console.log('🎉 All tests completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('✅ Dashboard API - Working');
    console.log('✅ Notification API - Working');
    console.log('✅ Notification Settings API - Working');
    console.log('✅ Authorization - Working');
    console.log('');
    console.log('🔗 Available endpoints:');
    console.log('• GET /api/admin/dashboard/summary - Dashboard summary');
    console.log('• GET /api/admin/dashboard/notifications - Get notifications');
    console.log('• PUT /api/admin/dashboard/notifications/:id/read - Mark as read');
    console.log('• PUT /api/admin/dashboard/notifications/read-all - Mark all as read');
    console.log('• GET /api/admin/dashboard/settings - Get notification settings');
    console.log('• PUT /api/admin/dashboard/settings - Update notification settings');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runAllTests();


