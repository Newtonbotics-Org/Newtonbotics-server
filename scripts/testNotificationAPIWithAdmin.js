/**
 * Test script for Admin Dashboard Notifications API with Admin User
 * Usage: ADMIN_EMAIL=<email> ADMIN_PASSWORD=<password> node scripts/testNotificationAPIWithAdmin.js
 * Or: node scripts/testNotificationAPIWithAdmin.js (will prompt or use defaults)
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3005';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'monu2feb2004@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

async function testNotificationAPIWithAdmin() {
  try {
    if (!ADMIN_PASSWORD) {
      console.log('⚠️  ADMIN_PASSWORD not set. Please set it as environment variable.');
      console.log('Usage: ADMIN_PASSWORD=<password> node scripts/testNotificationAPIWithAdmin.js');
      console.log('Or update .env file with ADMIN_PASSWORD');
      process.exit(1);
    }

    console.log('🔔 Testing Admin Dashboard Notifications API (Admin User)\n');
    console.log('='.repeat(80));
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Admin Email: ${ADMIN_EMAIL}\n`);

    // Step 1: Login as admin
    console.log('📋 Step 1: Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!loginResponse.data.success || !loginResponse.data.data.tokens.accessToken) {
      throw new Error('Login failed - no access token received');
    }

    const accessToken = loginResponse.data.data.tokens.accessToken;
    const user = loginResponse.data.data.user;
    
    console.log('✅ Login successful!');
    console.log(`   User: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Has system:admin: ${(user.permissions || []).includes('system:admin')}\n`);

    if (user.role !== 'admin' && !(user.permissions || []).includes('system:admin')) {
      console.log('⚠️  Warning: User does not have admin access');
      console.log('   This test requires admin role or system:admin permission\n');
    }

    // Step 2: Test GET /api/admin/dashboard/notifications
    console.log('📋 Step 2: Testing GET /api/admin/dashboard/notifications?limit=1...\n');
    
    const notificationsResponse = await axios.get(`${BASE_URL}/api/admin/dashboard/notifications`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 1
      }
    });

    console.log('✅ Request successful!\n');
    console.log('📊 Response Summary:');
    console.log('='.repeat(80));
    
    if (notificationsResponse.data.success) {
      const { notifications, stats, pagination } = notificationsResponse.data.data;
      
      console.log(`Status: ${notificationsResponse.status} ${notificationsResponse.statusText}`);
      console.log(`Total Notifications: ${stats.total || 0}`);
      console.log(`Unread: ${stats.unread || 0}`);
      console.log(`Read: ${stats.read || 0}`);
      console.log(`Returned: ${notifications.length}`);
      console.log(`Limit: ${pagination.limit}`);
      console.log(`Skip: ${pagination.skip}`);
      console.log(`Has More: ${pagination.hasMore}\n`);

      if (stats.byType && stats.byType.length > 0) {
        console.log('📈 Notifications by Type:');
        stats.byType.forEach(item => {
          console.log(`   ${item.type}: ${item.count}`);
        });
        console.log();
      }

      if (stats.byPriority && stats.byPriority.length > 0) {
        console.log('📊 Notifications by Priority:');
        stats.byPriority.forEach(item => {
          console.log(`   ${item.priority}: ${item.count}`);
        });
        console.log();
      }

      if (notifications.length > 0) {
        console.log('🔔 Notification Details:');
        notifications.forEach((notif, index) => {
          console.log(`\n   ${index + 1}. ${notif.title || 'No title'}`);
          console.log(`      - Message: ${(notif.message || '').substring(0, 60)}...`);
          console.log(`      - Type: ${notif.type || 'N/A'}`);
          console.log(`      - Priority: ${notif.priority || 'N/A'}`);
          console.log(`      - Read: ${notif.read ? 'Yes' : 'No'}`);
          console.log(`      - Created: ${notif.createdAt || 'N/A'}`);
          console.log(`      - ID: ${notif._id || notif.id}`);
        });
      } else {
        console.log('📭 No notifications found for this user');
      }

      console.log('\n📄 Full Response:');
      console.log('='.repeat(80));
      console.log(JSON.stringify(notificationsResponse.data, null, 2));
      console.log('='.repeat(80));

    } else {
      console.log('❌ Response indicates failure:');
      console.log(JSON.stringify(notificationsResponse.data, null, 2));
    }

    console.log('\n✅ Notification API test completed successfully!');
    return notificationsResponse.data;

  } catch (error) {
    console.error('\n❌ Test Failed!');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Status Text: ${error.response.statusText}`);
      console.error('\nResponse Data:');
      console.error(JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.error('\n💡 Tip: Authentication failed. Check if:');
        console.error('   - The admin credentials are correct');
        console.error('   - The user account is active');
      } else if (error.response.status === 403) {
        console.error('\n💡 Tip: Access denied. The user needs:');
        console.error('   - Admin role, OR');
        console.error('   - system:admin permission');
      }
    } else if (error.request) {
      console.error('No response received. Is the server running?');
      console.error(`URL: ${BASE_URL}/api/admin/dashboard/notifications`);
      console.error('\n💡 Tip: Make sure the server is running on the correct port');
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testNotificationAPIWithAdmin()
    .then(() => {
      console.log('\n🎉 Test script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testNotificationAPIWithAdmin };







