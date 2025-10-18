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
let teamLeaderToken = null;
let regularUserToken = null;
let testProjectId = null;

async function getTeamLeaderToken() {
  try {
    console.log('🔐 Getting team leader token...');
    
    // You'll need to replace these with actual credentials from your system
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: process.env.TEAM_LEADER_EMAIL || 'teamleader@newtonbotics.com',
      password: process.env.TEAM_LEADER_PASSWORD || 'TeamLeader123!'
    });

    if (response.data.success) {
      teamLeaderToken = response.data.data.token;
      console.log('✅ Team leader token obtained successfully');
      return teamLeaderToken;
    } else {
      throw new Error('Failed to get team leader token');
    }
  } catch (error) {
    console.error('❌ Error getting team leader token:', error.response?.data || error.message);
    throw error;
  }
}

async function getRegularUserToken() {
  try {
    console.log('🔐 Getting regular user token...');
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: process.env.REGULAR_USER_EMAIL || 'user@newtonbotics.com',
      password: process.env.REGULAR_USER_PASSWORD || 'User123!'
    });

    if (response.data.success) {
      regularUserToken = response.data.data.token;
      console.log('✅ Regular user token obtained successfully');
      return regularUserToken;
    } else {
      throw new Error('Failed to get regular user token');
    }
  } catch (error) {
    console.error('❌ Error getting regular user token:', error.response?.data || error.message);
    throw error;
  }
}

async function createTestProject() {
  try {
    console.log('📝 Creating test project...');
    
    if (!teamLeaderToken) {
      await getTeamLeaderToken();
    }

    const headers = {
      ...testConfig.headers,
      'Authorization': `Bearer ${teamLeaderToken}`
    };

    const projectData = {
      title: 'Test Project for Deletion API',
      description: 'This is a test project created to test the deletion API functionality.',
      category: 'Testing',
      status: 'upcoming',
      startDate: new Date().toISOString(),
      budget: 1000,
      priority: 'medium',
      difficulty: 'intermediate'
    };

    const response = await axios.post(`${BASE_URL}/api/projects`, projectData, { headers });
    
    if (response.data.success) {
      testProjectId = response.data.data.project._id;
      console.log(`✅ Test project created successfully with ID: ${testProjectId}`);
      return testProjectId;
    } else {
      throw new Error('Failed to create test project');
    }
  } catch (error) {
    console.error('❌ Error creating test project:', error.response?.data || error.message);
    throw error;
  }
}

async function testProjectSelfDeletionAPI() {
  try {
    console.log('\n🧪 Testing Project Self-Deletion API...');
    
    // Create a test project first
    await createTestProject();
    
    if (!teamLeaderToken) {
      await getTeamLeaderToken();
    }

    const headers = {
      ...testConfig.headers,
      'Authorization': `Bearer ${teamLeaderToken}`
    };

    // Test 1: Delete own project (should succeed)
    console.log('\n📋 Test 1: Delete own project (team leader)');
    const response1 = await axios.delete(`${BASE_URL}/api/projects/${testProjectId}/self`, { headers });
    
    if (response1.data.success) {
      console.log('✅ Successfully deleted own project');
      console.log(`📊 Deleted project: ${response1.data.data.deletedProject.title}`);
      console.log(`🕒 Deleted at: ${response1.data.data.deletedProject.deletedAt}`);
    } else {
      console.log('❌ Failed to delete own project');
      console.log('Response:', response1.data);
    }

    // Test 2: Try to delete non-existent project
    console.log('\n📋 Test 2: Try to delete non-existent project');
    try {
      const fakeProjectId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but non-existent
      const response2 = await axios.delete(`${BASE_URL}/api/projects/${fakeProjectId}/self`, { headers });
      console.log('❌ Should have failed for non-existent project');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Correctly returned 404 for non-existent project');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

    // Test 3: Try to delete project with regular user token (should fail)
    console.log('\n📋 Test 3: Try to delete project with regular user token');
    try {
      if (!regularUserToken) {
        await getRegularUserToken();
      }
      
      const regularHeaders = {
        ...testConfig.headers,
        'Authorization': `Bearer ${regularUserToken}`
      };
      
      // Create another test project for this test
      const projectData = {
        title: 'Test Project for Regular User Test',
        description: 'This project will be used to test regular user deletion.',
        category: 'Testing',
        status: 'upcoming'
      };
      
      const createResponse = await axios.post(`${BASE_URL}/api/projects`, projectData, { 
        headers: { ...testConfig.headers, 'Authorization': `Bearer ${teamLeaderToken}` }
      });
      
      const anotherProjectId = createResponse.data.data.project._id;
      
      const response3 = await axios.delete(`${BASE_URL}/api/projects/${anotherProjectId}/self`, { headers: regularHeaders });
      console.log('❌ Should have failed for regular user trying to delete team leader project');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Correctly returned 403 for unauthorized deletion attempt');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

    // Test 4: Try to delete without authentication
    console.log('\n📋 Test 4: Try to delete without authentication');
    try {
      await axios.delete(`${BASE_URL}/api/projects/507f1f77bcf86cd799439011/self`);
      console.log('❌ Should have failed without authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly returned 401 for unauthenticated request');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

    // Test 5: Try to delete with invalid token
    console.log('\n📋 Test 5: Try to delete with invalid token');
    try {
      const invalidHeaders = {
        ...testConfig.headers,
        'Authorization': 'Bearer invalid_token'
      };
      
      await axios.delete(`${BASE_URL}/api/projects/507f1f77bcf86cd799439011/self`, { headers: invalidHeaders });
      console.log('❌ Should have failed with invalid token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly returned 401 for invalid token');
      } else {
        console.log('❌ Unexpected error:', error.response?.status);
      }
    }

    console.log('\n🎉 Project Self-Deletion API testing completed!');

  } catch (error) {
    console.error('❌ Error testing Project Self-Deletion API:', error.response?.data || error.message);
  }
}

async function testProjectWithActiveMembers() {
  try {
    console.log('\n🧪 Testing Project Deletion with Active Members...');
    
    if (!teamLeaderToken) {
      await getTeamLeaderToken();
    }

    const headers = {
      ...testConfig.headers,
      'Authorization': `Bearer ${teamLeaderToken}`
    };

    // Create a project with team members
    const projectData = {
      title: 'Test Project with Team Members',
      description: 'This project has team members and should not be deletable.',
      category: 'Testing',
      status: 'upcoming',
      teamMembers: [
        {
          userId: '507f1f77bcf86cd799439011', // Valid ObjectId format
          role: 'Developer',
          skills: ['JavaScript', 'Node.js'],
          responsibilities: ['Backend development'],
          isActive: true
        }
      ]
    };

    const createResponse = await axios.post(`${BASE_URL}/api/projects`, projectData, { headers });
    
    if (createResponse.data.success) {
      const projectWithMembersId = createResponse.data.data.project._id;
      
      // Try to delete project with active members
      try {
        const deleteResponse = await axios.delete(`${BASE_URL}/api/projects/${projectWithMembersId}/self`, { headers });
        console.log('❌ Should have failed to delete project with active members');
      } catch (error) {
        if (error.response?.status === 400) {
          console.log('✅ Correctly prevented deletion of project with active members');
          console.log(`📊 Active members count: ${error.response.data.error.details.activeMembersCount}`);
        } else {
          console.log('❌ Unexpected error:', error.response?.status);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error testing project with active members:', error.response?.data || error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Project Self-Deletion API Tests');
  console.log('==========================================');
  
  try {
    await testProjectSelfDeletionAPI();
    await testProjectWithActiveMembers();
    
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
  testProjectSelfDeletionAPI,
  testProjectWithActiveMembers,
  runTests
};
