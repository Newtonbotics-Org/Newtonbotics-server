const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('❌ ADMIN_TOKEN environment variable is required');
  console.log('Please set ADMIN_TOKEN=your_admin_jwt_token');
  process.exit(1);
}

async function testDeletedProjectsAPI() {
  console.log('🧪 Testing Deleted Projects API...\n');

  try {
    // Test 1: Get all deleted projects
    console.log('📋 Test 1: Get all deleted projects');
    const response1 = await axios.get(`${BASE_URL}/project-requests/deleted`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    
    console.log('✅ Status:', response1.status);
    console.log('📊 Response:', JSON.stringify(response1.data, null, 2));
    console.log('');

    // Test 2: Get deleted projects with pagination
    console.log('📋 Test 2: Get deleted projects with pagination (limit=5)');
    const response2 = await axios.get(`${BASE_URL}/project-requests/deleted?limit=5&skip=0`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    
    console.log('✅ Status:', response2.status);
    console.log('📊 Response:', JSON.stringify(response2.data, null, 2));
    console.log('');

    // Test 3: Get deleted projects sorted by deletion date
    console.log('📋 Test 3: Get deleted projects sorted by deletion date (desc)');
    const response3 = await axios.get(`${BASE_URL}/project-requests/deleted?sortBy=deletedAt&sortOrder=desc`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    
    console.log('✅ Status:', response3.status);
    console.log('📊 Response:', JSON.stringify(response3.data, null, 2));
    console.log('');

    // Test 4: Test with invalid sort parameter (should fail validation)
    console.log('📋 Test 4: Test with invalid sort parameter');
    try {
      const response4 = await axios.get(`${BASE_URL}/project-requests/deleted?sortBy=invalidField`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });
      console.log('❌ Expected validation error but got success');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation error as expected:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 5: Test without admin token (should fail authorization)
    console.log('📋 Test 5: Test without admin token');
    try {
      const response5 = await axios.get(`${BASE_URL}/project-requests/deleted`);
      console.log('❌ Expected authorization error but got success');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Authorization error as expected:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the tests
testDeletedProjectsAPI();
