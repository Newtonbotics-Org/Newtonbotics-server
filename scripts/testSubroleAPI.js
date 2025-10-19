// Comprehensive API test for subrole CRUD operations
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
async function testGetActiveSubroles() {
  console.log('\n🧪 Testing GET /api/subroles/active...');
  
  try {
    const response = await makeRequest('GET', '/subroles/active');
    console.log('✅ Successfully retrieved active subroles');
    console.log(`📋 Found ${response.data.subroles.length} active subroles`);
    console.log('📝 Sample subroles:', response.data.subroles.slice(0, 3).map(sr => sr.displayName));
    return true;
  } catch (error) {
    console.log('❌ Failed to get active subroles');
    return false;
  }
}

async function testGetSubroles() {
  console.log('\n🧪 Testing GET /api/subroles (admin only)...');
  
  try {
    const response = await makeRequest('GET', '/subroles');
    console.log('✅ Successfully retrieved all subroles');
    console.log(`📋 Found ${response.data.subroles.length} total subroles`);
    return true;
  } catch (error) {
    console.log('❌ Failed to get all subroles');
    return false;
  }
}

async function testCreateSubrole() {
  console.log('\n🧪 Testing POST /api/subroles (create new subrole)...');
  
  const newSubrole = {
    name: 'api_test_subrole',
    displayName: 'API Test Subrole',
    description: 'A test subrole created via API',
    category: 'special_designations',
    permissions: ['read:projects'],
    priority: 1
  };
  
  try {
    const response = await makeRequest('POST', '/subroles', newSubrole);
    console.log('✅ Successfully created new subrole');
    console.log('📝 Created subrole:', response.data.subrole.displayName);
    return response.data.subrole._id;
  } catch (error) {
    console.log('❌ Failed to create subrole');
    return null;
  }
}

async function testUpdateSubrole(subroleId) {
  console.log('\n🧪 Testing PUT /api/subroles/:id (update subrole)...');
  
  const updateData = {
    description: 'Updated description for API test subrole',
    priority: 5
  };
  
  try {
    const response = await makeRequest('PUT', `/subroles/${subroleId}`, updateData);
    console.log('✅ Successfully updated subrole');
    console.log('📝 Updated subrole:', response.data.subrole.displayName);
    return true;
  } catch (error) {
    console.log('❌ Failed to update subrole');
    return false;
  }
}

async function testGetSubroleById(subroleId) {
  console.log('\n🧪 Testing GET /api/subroles/:id...');
  
  try {
    const response = await makeRequest('GET', `/subroles/${subroleId}`);
    console.log('✅ Successfully retrieved subrole by ID');
    console.log('📝 Subrole:', response.data.subrole.displayName);
    return true;
  } catch (error) {
    console.log('❌ Failed to get subrole by ID');
    return false;
  }
}

async function testGetSubroleCategories() {
  console.log('\n🧪 Testing GET /api/subroles/categories...');
  
  try {
    const response = await makeRequest('GET', '/subroles/categories');
    console.log('✅ Successfully retrieved subrole categories');
    console.log(`📋 Found ${response.data.categories.length} categories`);
    return true;
  } catch (error) {
    console.log('❌ Failed to get subrole categories');
    return false;
  }
}

async function testSoftDeleteSubrole(subroleId) {
  console.log('\n🧪 Testing DELETE /api/subroles/:id (soft delete)...');
  
  try {
    const response = await makeRequest('DELETE', `/subroles/${subroleId}`);
    console.log('✅ Successfully soft deleted subrole');
    return true;
  } catch (error) {
    console.log('❌ Failed to soft delete subrole');
    return false;
  }
}

async function testReactivateSubrole(subroleId) {
  console.log('\n🧪 Testing POST /api/subroles/:id/reactivate...');
  
  try {
    const response = await makeRequest('POST', `/subroles/${subroleId}/reactivate`);
    console.log('✅ Successfully reactivated subrole');
    return true;
  } catch (error) {
    console.log('❌ Failed to reactivate subrole');
    return false;
  }
}

async function testUpdateUserSubroles() {
  console.log('\n🧪 Testing PUT /api/users/:id/subroles...');
  
  // Get a test user first
  let testUserId;
  try {
    const usersResponse = await makeRequest('GET', '/users?limit=1');
    if (usersResponse.data.users.length > 0) {
      testUserId = usersResponse.data.users[0].id;
    } else {
      console.log('❌ No users found for testing');
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to get test user');
    return false;
  }
  
  const testSubroles = ['project_manager', 'team_lead'];
  
  try {
    const response = await makeRequest('PUT', `/users/${testUserId}/subroles`, {
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

async function testInvalidSubroleCreation() {
  console.log('\n🧪 Testing invalid subrole creation...');
  
  const invalidSubrole = {
    name: 'invalid name with spaces', // Invalid name format
    displayName: 'Invalid Subrole',
    category: 'invalid_category' // Invalid category
  };
  
  try {
    await makeRequest('POST', '/subroles', invalidSubrole);
    console.log('❌ Should have failed with invalid subrole data');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Correctly rejected invalid subrole data');
      return true;
    } else {
      console.log('❌ Unexpected error:', error.response?.data);
      return false;
    }
  }
}

async function cleanupTestSubrole(subroleId) {
  console.log('\n🧹 Cleaning up test subrole...');
  
  try {
    await makeRequest('DELETE', `/subroles/${subroleId}`);
    console.log('✅ Cleaned up test subrole');
    return true;
  } catch (error) {
    console.log('❌ Failed to clean up test subrole');
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Subrole CRUD API Tests...\n');
  
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
  
  // Run tests
  const tests = [
    () => testGetActiveSubroles(),
    () => testGetSubroles(),
    () => testGetSubroleCategories(),
    () => testInvalidSubroleCreation()
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
  
  // Test CRUD operations with a created subrole
  console.log('\n📝 Testing CRUD operations with created subrole...');
  const subroleId = await testCreateSubrole();
  
  if (subroleId) {
    const crudTests = [
      () => testGetSubroleById(subroleId),
      () => testUpdateSubrole(subroleId),
      () => testSoftDeleteSubrole(subroleId),
      () => testReactivateSubrole(subroleId),
      () => testUpdateUserSubroles(),
      () => cleanupTestSubrole(subroleId)
    ];
    
    for (const test of crudTests) {
      try {
        const result = await test();
        if (result) passedTests++;
        totalTests++;
      } catch (error) {
        console.log('❌ CRUD test failed with error:', error.message);
        totalTests++;
      }
    }
  }
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Subrole CRUD API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
