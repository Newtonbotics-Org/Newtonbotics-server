const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3005';
const LOGIN_ENDPOINT = '/api/auth/login';

// Admin credentials
const ADMIN_EMAIL = 'monu2feb2004@gmail.com';
const ADMIN_PASSWORD = 'Monu@2004';

console.log('🔑 Getting Admin Token for Testing');
console.log('==================================');
console.log('Email:', ADMIN_EMAIL);
console.log('Base URL:', BASE_URL);

async function getAdminToken() {
  try {
    console.log('\n📝 Attempting to login...');
    
    const response = await axios.post(`${BASE_URL}${LOGIN_ENDPOINT}`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success && response.data.data.tokens?.accessToken) {
      console.log('✅ Login successful!');
      console.log('👤 User:', response.data.data.user.firstName, response.data.data.user.lastName);
      console.log('🎭 Role:', response.data.data.user.role);
      console.log('🔑 Access Token:', response.data.data.tokens.accessToken.substring(0, 50) + '...');
      
      console.log('\n📋 Use this token for testing:');
      console.log('==============================');
      console.log(response.data.data.tokens.accessToken);
      
      console.log('\n🧪 Test the role approvals endpoint:');
      console.log('====================================');
      console.log(`node scripts/testRoleApprovals.js "${response.data.data.tokens.accessToken}"`);
      
      return response.data.data.tokens.accessToken;
    } else {
      console.log('❌ Login failed - no token in response');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Login failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data?.error?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 401 Unauthorized - Check if:');
      console.log('   - Admin user exists in database');
      console.log('   - Password is correct');
      console.log('   - User is active');
    }
  }
}

// Run the script
getAdminToken();
