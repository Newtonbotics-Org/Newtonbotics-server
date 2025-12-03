/**
 * Test script for /api/users/club-members endpoint
 * Usage: node scripts/testClubMembersEndpoint.js
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3005';
const TEST_EMAIL = 'sourabh.s23csai@nst.rishihood.edu.in';
const TEST_PASSWORD = 'Sourabh@motu25';

async function testClubMembersAPI() {
  try {
    console.log('🔐 Testing Club Members API Endpoint\n');
    console.log('='.repeat(80));
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Test User: ${TEST_EMAIL}\n`);

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
    console.log(`   User ID: ${user.id}\n`);

    // Step 2: Test club-members endpoint
    console.log('📋 Step 2: Testing GET /api/users/club-members...\n');
    
    const clubMembersResponse = await axios.get(`${BASE_URL}/api/users/club-members`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Request successful!\n');
    console.log('📊 Response Summary:');
    console.log('='.repeat(80));
    
    if (clubMembersResponse.data.success) {
      const { clubMembers, pagination } = clubMembersResponse.data.data;
      
      console.log(`Total Club Members: ${pagination.total}`);
      console.log(`Returned: ${clubMembers.length}`);
      console.log(`Limit: ${pagination.limit}`);
      console.log(`Skip: ${pagination.skip}`);
      console.log(`Has More: ${pagination.hasMore}\n`);

      // Group by role
      const roleCounts = {};
      clubMembers.forEach(member => {
        roleCounts[member.role] = (roleCounts[member.role] || 0) + 1;
      });

      console.log('📈 Members by Role:');
      Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`   ${role}: ${count}`);
      });

      // Show first 5 members as sample
      console.log('\n👥 Sample Members (first 5):');
      clubMembers.slice(0, 5).forEach((member, index) => {
        console.log(`\n   ${index + 1}. ${member.fullName || `${member.firstName} ${member.lastName}`}`);
        console.log(`      - Role: ${member.role}`);
        console.log(`      - Email: ${member.email}`);
        console.log(`      - Department: ${member.department || 'N/A'}`);
        console.log(`      - Subroles: ${(member.subroles || []).length > 0 ? member.subroles.join(', ') : 'None'}`);
        console.log(`      - Skills: ${(member.skills || []).length > 0 ? member.skills.slice(0, 3).join(', ') : 'None'}`);
        console.log(`      - ID: ${member.id}`);
      });

      if (clubMembers.length > 5) {
        console.log(`\n   ... and ${clubMembers.length - 5} more members`);
      }

      console.log('\n📄 Full Response Structure:');
      console.log('='.repeat(80));
      console.log(JSON.stringify(clubMembersResponse.data, null, 2));
      console.log('='.repeat(80));

    } else {
      console.log('❌ Response indicates failure:');
      console.log(JSON.stringify(clubMembersResponse.data, null, 2));
    }

    // Step 3: Test with query parameters
    console.log('\n📋 Step 3: Testing with query parameters (limit=5)...\n');
    
    const filteredResponse = await axios.get(`${BASE_URL}/api/users/club-members?limit=5`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (filteredResponse.data.success) {
      console.log('✅ Filtered request successful!');
      console.log(`   Returned: ${filteredResponse.data.data.clubMembers.length} members`);
      console.log(`   Limit applied: ${filteredResponse.data.data.pagination.limit}`);
    }

    console.log('\n✅ All tests completed successfully!');
    return clubMembersResponse.data;

  } catch (error) {
    console.error('\n❌ Test Failed!');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Status Text: ${error.response.statusText}`);
      console.error('\nResponse Data:');
      console.error(JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.error('\n💡 Tip: Authentication failed. Check if:');
        console.error('   - The user credentials are correct');
        console.error('   - The user account is active');
        console.error('   - The JWT_SECRET is configured correctly');
      } else if (error.response.status === 403) {
        console.error('\n💡 Tip: Access denied. Check if:');
        console.error('   - The user has the required permissions');
        console.error('   - The route requires a specific role');
      }
    } else if (error.request) {
      console.error('No response received. Is the server running?');
      console.error(`URL: ${BASE_URL}/api/users/club-members`);
      console.error('\n💡 Tip: Make sure the server is running on the correct port');
    } else {
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testClubMembersAPI()
    .then(() => {
      console.log('\n🎉 Test script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testClubMembersAPI };







