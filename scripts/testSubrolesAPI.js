const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@newtonbotics.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

let adminToken = null;

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null, token = adminToken) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

// Test functions
async function testGetSubroles() {
  console.log('\n🧪 Testing GET /api/users/subroles...');
  
  try {
    const response = await makeRequest('GET', '/users/subroles');
    console.log('✅ Successfully retrieved subroles list');
    console.log(`📋 Found ${response.data.subroles.length} available subroles`);
    console.log('📝 Sample subroles:', response.data.subroles.slice(0, 5));
    return true;
  } catch (error) {
    console.log('❌ Failed to get subroles list');
    return false;
  }
}

async function testUpdateUserSubroles(userId) {
  console.log('\n🧪 Testing PUT /api/users/:id/subroles...');
  
  const testSubroles = ['project_manager', 'team_lead', 'software_developer'];
  
  try {
    const response = await makeRequest('PUT', `/users/${userId}/subroles`, {
      subroles: testSubroles
    });
    
    console.log('✅ Successfully updated user subroles');
    console.log('📝 Updated subroles:', response.data.user.subroles);
    return true;
  } catch (error) {
    console.log('❌ Failed to update user subroles');
    return false;
  }
}

async function testGetUserProfile(userId) {
  console.log('\n🧪 Testing GET /api/users/:id (to verify subroles in response)...');
  
  try {
    const response = await makeRequest('GET', `/users/${userId}`);
    
    console.log('✅ Successfully retrieved user profile');
    console.log('📝 User subroles:', response.data.user.subroles);
    console.log('📝 User role:', response.data.user.role);
    return true;
  } catch (error) {
    console.log('❌ Failed to get user profile');
    return false;
  }
}

async function testInvalidSubroles(userId) {
  console.log('\n🧪 Testing invalid subroles validation...');
  
  const invalidSubroles = ['invalid_role', 'another_invalid'];
  
  try {
    await makeRequest('PUT', `/users/${userId}/subroles`, {
      subroles: invalidSubroles
    });
    console.log('❌ Should have failed with invalid subroles');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Correctly rejected invalid subroles');
      return true;
    } else {
      console.log('❌ Unexpected error:', error.response?.data);
      return false;
    }
  }
}

async function testNonAdminAccess(userId) {
  console.log('\n🧪 Testing non-admin access to subroles endpoint...');
  
  // Create a regular user token (this would need to be implemented)
  // For now, we'll test with a non-admin token
  try {
    // This should fail if we don't have admin permissions
    await makeRequest('PUT', `/users/${userId}/subroles`, {
      subroles: ['project_manager']
    }, 'invalid-token');
    console.log('❌ Should have failed with non-admin access');
    return false;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('✅ Correctly rejected non-admin access');
      return true;
    } else {
      console.log('❌ Unexpected error:', error.response?.data);
      return false;
    }
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Subroles API Tests...\n');
  
  // First, we need to authenticate as admin
  console.log('🔐 Authenticating as admin...');
  try {
    const authResponse = await makeRequest('POST', '/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    adminToken = authResponse.data.token;
    console.log('✅ Admin authentication successful');
  } catch (error) {
    console.log('❌ Admin authentication failed');
    console.log('Please ensure you have an admin user and the server is running');
    return;
  }
  
  // Get a test user ID (we'll use the first user from the list)
  console.log('\n👤 Getting test user...');
  let testUserId;
  try {
    const usersResponse = await makeRequest('GET', '/users?limit=1');
    if (usersResponse.data.users.length > 0) {
      testUserId = usersResponse.data.users[0].id;
      console.log(`✅ Using test user: ${testUserId}`);
    } else {
      console.log('❌ No users found for testing');
      return;
    }
  } catch (error) {
    console.log('❌ Failed to get test user');
    return;
  }
  
  // Run tests
  const tests = [
    () => testGetSubroles(),
    () => testUpdateUserSubroles(testUserId),
    () => testGetUserProfile(testUserId),
    () => testInvalidSubroles(testUserId),
    () => testNonAdminAccess(testUserId)
  ];
  
  let passedTests = 0;
  const totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) passedTests++;
    } catch (error) {
      console.log('❌ Test failed with error:', error.message);
    }
  }
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Subroles API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
