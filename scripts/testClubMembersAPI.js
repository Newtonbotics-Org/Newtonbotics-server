const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3005';

// Test configuration
const testConfig = {
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

// Test data
let adminToken = null;

async function getAdminToken() {
  try {
    console.log('🔐 Getting admin token...');
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: process.env.ADMIN_EMAIL || 'admin@newtonbotics.com',
      password: process.env.ADMIN_PASSWORD || 'Admin123!'
    });

    if (response.data.success) {
      adminToken = response.data.data.token;
      console.log('✅ Admin token obtained successfully');
      return adminToken;
    } else {
      throw new Error('Failed to get admin token');
    }
  } catch (error) {
    console.error('❌ Error getting admin token:', error.response?.data || error.message);
    throw error;
  }
}

async function testClubMembersAPI() {
  try {
    console.log('\n🧪 Testing Club Members API...');
    
    if (!adminToken) {
      await getAdminToken();
    }

    const headers = {
      ...testConfig.headers,
      'Authorization': `Bearer ${adminToken}`
    };

    // Test 1: Get all club members
    console.log('\n📋 Test 1: Get all club members');
    const response1 = await axios.get(`${BASE_URL}/api/users/club-members`, { headers });
    
    if (response1.data.success) {
      console.log('✅ Successfully retrieved club members');
      console.log(`📊 Total club members: ${response1.data.data.pagination.total}`);
      console.log(`📄 Returned: ${response1.data.data.clubMembers.length} members`);
      
      // Display role distribution
      const roleCounts = {};
      response1.data.data.clubMembers.forEach(member => {
        roleCounts[member.role] = (roleCounts[member.role] || 0) + 1;
      });
      console.log('👥 Role distribution:', roleCounts);
      
      // Verify no students are included
      const hasStudents = response1.data.data.clubMembers.some(member => member.role === 'student');
      if (hasStudents) {
        console.log('❌ ERROR: Students found in club members response!');
      } else {
        console.log('✅ Confirmed: No students in club members response');
      }
      
      // Display first few members
      console.log('\n👤 Sample club members:');
      response1.data.data.clubMembers.slice(0, 3).forEach((member, index) => {
        console.log(`  ${index + 1}. ${member.displayName} (${member.role}) - ${member.department || 'No department'}`);
      });
    } else {
      console.log('❌ Failed to retrieve club members');
    }

    // Test 2: Search club members by query
    console.log('\n🔍 Test 2: Search club members by query');
    const searchQuery = 'test'; // This will search in firstName, lastName, skills, bio
    const response2 = await axios.get(`${BASE_URL}/api/users/club-members?q=${searchQuery}`, { headers });
    
    if (response2.data.success) {
      console.log(`✅ Search query "${searchQuery}" returned ${response2.data.data.clubMembers.length} results`);
    } else {
      console.log('❌ Search query failed');
    }

    // Test 3: Filter by department
    console.log('\n🏢 Test 3: Filter by department');
    const departments = ['Computer Science', 'Engineering', 'Mathematics']; // Common departments
    for (const dept of departments) {
      try {
        const response3 = await axios.get(`${BASE_URL}/api/users/club-members?department=${encodeURIComponent(dept)}`, { headers });
        if (response3.data.success) {
          console.log(`✅ Department "${dept}": ${response3.data.data.clubMembers.length} members`);
        }
      } catch (error) {
        console.log(`ℹ️  Department "${dept}": No members found`);
      }
    }

    // Test 4: Pagination
    console.log('\n📄 Test 4: Test pagination');
    const response4 = await axios.get(`${BASE_URL}/api/users/club-members?limit=5&skip=0`, { headers });
    
    if (response4.data.success) {
      console.log(`✅ Pagination test: ${response4.data.data.clubMembers.length} members returned`);
      console.log(`📊 Pagination info:`, response4.data.data.pagination);
    } else {
      console.log('❌ Pagination test failed');
    }

    // Test 5: Verify response structure
    console.log('\n🔍 Test 5: Verify response structure');
    if (response1.data.success && response1.data.data.clubMembers.length > 0) {
      const sampleMember = response1.data.data.clubMembers[0];
      const requiredFields = [
        'id', 'email', 'firstName', 'lastName', 'fullName', 'displayName', 
        'role', 'subroles', 'specialization', 'experienceYears', 'department',
        'yearOfStudy', 'phone', 'profileImageUrl', 'bio', 'skills', 
        'achievements', 'socialLinks', 'currentProjects', 'emailVerified',
        'lastLogin', 'createdAt', 'updatedAt'
      ];
      
      const missingFields = requiredFields.filter(field => !(field in sampleMember));
      
      if (missingFields.length === 0) {
        console.log('✅ Response structure is correct - all required fields present');
      } else {
        console.log('❌ Missing fields in response:', missingFields);
      }
    }

    console.log('\n🎉 Club Members API testing completed!');

  } catch (error) {
    console.error('❌ Error testing Club Members API:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('💡 Tip: Make sure you have valid admin credentials in your .env file');
    }
  }
}

async function testUnauthorizedAccess() {
  try {
    console.log('\n🔒 Testing unauthorized access...');
    
    // Test without token
    try {
      await axios.get(`${BASE_URL}/api/users/club-members`);
      console.log('❌ ERROR: API should require authentication!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

    // Test with invalid token
    try {
      const headers = {
        ...testConfig.headers,
        'Authorization': 'Bearer invalid_token'
      };
      await axios.get(`${BASE_URL}/api/users/club-members`, { headers });
      console.log('❌ ERROR: API should reject invalid token!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejects invalid token');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

  } catch (error) {
    console.error('❌ Error testing unauthorized access:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Club Members API Tests');
  console.log('=====================================');
  
  try {
    await testClubMembersAPI();
    await testUnauthorizedAccess();
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testClubMembersAPI,
  testUnauthorizedAccess,
  runTests
};
