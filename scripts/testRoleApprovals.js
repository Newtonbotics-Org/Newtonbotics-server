const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3005';
const ENDPOINT = '/api/role-approvals';

// Test token - replace with a valid admin token
const TEST_TOKEN = process.argv[2] || 'your-admin-token-here';

console.log('🧪 Testing Role Approvals Endpoint');
console.log('==================================');
console.log('Base URL:', BASE_URL);
console.log('Endpoint:', ENDPOINT);
console.log('Token:', TEST_TOKEN.substring(0, 20) + '...');

async function testRoleApprovals() {
  try {
    // Test 1: GET /api/role-approvals
    console.log('\n📋 Test 1: GET /api/role-approvals');
    console.log('-----------------------------------');
    
    const response = await axios.get(`${BASE_URL}${ENDPOINT}`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', response.status);
    console.log('📦 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Error Message:', error.response?.data?.error?.message);
    console.log('Full Error:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 401) {
      console.log('\n💡 401 Unauthorized - This means:');
      console.log('   - Token is missing or invalid');
      console.log('   - Token has expired');
      console.log('   - JWT_SECRET is incorrect');
    } else if (error.response?.status === 403) {
      console.log('\n💡 403 Forbidden - This means:');
      console.log('   - User is authenticated but not an admin');
      console.log('   - User role is insufficient');
    }
  }
}

// Run the test
testRoleApprovals();

