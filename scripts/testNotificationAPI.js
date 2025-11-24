/**
 * Test script for Admin Dashboard Notifications API
 * Usage: node scripts/testNotificationAPI.js
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3005';
const TEST_EMAIL = 'sourabh.s23csai@nst.rishihood.edu.in';
const TEST_PASSWORD = 'Sourabh@motu25';

async function testNotificationAPI() {
  try {
    console.log('🔔 Testing Admin Dashboard Notifications API\n');
    console.log('='.repeat(80));
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Test User: ${TEST_EMAIL}`);
    console.log('Note: This endpoint requires admin role or system:admin permission\n');

    // Step 1: Login to get access token
    console.log('📋 Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
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
    console.log(`   Subroles: ${(user.subroles || []).join(', ') || 'None'}`);
    console.log(`   Permissions: ${(user.permissions || []).length} permissions`);
    console.log(`   Has system:admin permission: ${(user.permissions || []).includes('system:admin')}`);
    console.log(`   User ID: ${user.id}\n`);

    // Step 2: Test GET /api/admin/dashboard/notifications
    console.log('📋 Step 2: Testing GET /api/admin/dashboard/notifications...\n');
    
    try {
      const notificationsResponse = await axios.get(`${BASE_URL}/api/admin/dashboard/notifications`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 20,
          skip: 0
        }
      });

      console.log('✅ Request successful!\n');
      console.log('📊 Response Summary:');
      console.log('='.repeat(80));
      
      if (notificationsResponse.data.success) {
        const { notifications, stats, pagination } = notificationsResponse.data.data;
        
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
          console.log('🔔 Sample Notifications (first 3):');
          notifications.slice(0, 3).forEach((notif, index) => {
            console.log(`\n   ${index + 1}. ${notif.title || 'No title'}`);
            console.log(`      - Message: ${(notif.message || '').substring(0, 50)}...`);
            console.log(`      - Type: ${notif.type || 'N/A'}`);
            console.log(`      - Priority: ${notif.priority || 'N/A'}`);
            console.log(`      - Read: ${notif.read ? 'Yes' : 'No'}`);
            console.log(`      - Created: ${notif.createdAt || 'N/A'}`);
            console.log(`      - ID: ${notif._id || notif.id}`);
          });

          if (notifications.length > 3) {
            console.log(`\n   ... and ${notifications.length - 3} more notifications`);
          }
        } else {
          console.log('📭 No notifications found');
        }

        console.log('\n📄 Full Response Structure:');
        console.log('='.repeat(80));
        console.log(JSON.stringify(notificationsResponse.data, null, 2));
        console.log('='.repeat(80));

      } else {
        console.log('❌ Response indicates failure:');
        console.log(JSON.stringify(notificationsResponse.data, null, 2));
      }

      // Step 3: Test with query parameters
      console.log('\n📋 Step 3: Testing with query parameters (read=false, limit=5)...\n');
      
      const filteredResponse = await axios.get(`${BASE_URL}/api/admin/dashboard/notifications`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          read: false,
          limit: 5
        }
      });

      if (filteredResponse.data.success) {
        console.log('✅ Filtered request successful!');
        console.log(`   Returned: ${filteredResponse.data.data.notifications.length} unread notifications`);
        console.log(`   Limit applied: ${filteredResponse.data.data.pagination.limit}`);
      }

      // Step 4: Test mark as read (if there are notifications)
      if (notificationsResponse.data.success && 
          notificationsResponse.data.data.notifications.length > 0) {
        const firstNotification = notificationsResponse.data.data.notifications[0];
        const notificationId = firstNotification._id || firstNotification.id;
        
        console.log('\n📋 Step 4: Testing PUT /api/admin/dashboard/notifications/:id/read...\n');
        
        try {
          const markReadResponse = await axios.put(
            `${BASE_URL}/api/admin/dashboard/notifications/${notificationId}/read`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (markReadResponse.data.success) {
            console.log('✅ Mark as read successful!');
            console.log(`   Notification ID: ${notificationId}`);
            console.log(`   Message: ${markReadResponse.data.message}`);
          }
        } catch (error) {
          if (error.response) {
            console.log(`⚠️  Mark as read failed: ${error.response.status} - ${error.response.data.error?.message || error.response.data.message}`);
          } else {
            console.log(`⚠️  Mark as read failed: ${error.message}`);
          }
        }
      }

      console.log('\n✅ All notification API tests completed successfully!');
      return notificationsResponse.data;

    } catch (error) {
      console.error('\n❌ Notification API Test Failed!');
      
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Status Text: ${error.response.statusText}`);
        console.error('\nResponse Data:');
        console.error(JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 401) {
          console.error('\n💡 Tip: Authentication failed. Check if:');
          console.error('   - The user credentials are correct');
          console.error('   - The user account is active');
        } else if (error.response.status === 403) {
          console.error('\n💡 Tip: Access denied. The user needs:');
          console.error('   - Admin role, OR');
          console.error('   - system:admin permission');
          console.error(`\n   Current user role: ${user.role}`);
          console.error(`   Current permissions: ${JSON.stringify(user.permissions || [])}`);
        }
      } else if (error.request) {
        console.error('No response received. Is the server running?');
        console.error(`URL: ${BASE_URL}/api/admin/dashboard/notifications`);
      } else {
        console.error('Error:', error.message);
      }
      
      throw error;
    }

  } catch (error) {
    console.error('\n❌ Test Failed!');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received. Is the server running?');
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testNotificationAPI()
    .then(() => {
      console.log('\n🎉 Test script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testNotificationAPI };

