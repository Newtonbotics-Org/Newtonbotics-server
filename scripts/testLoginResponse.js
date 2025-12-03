/**
 * Test script to check login response structure
 * Usage: node scripts/testLoginResponse.js
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3005';
const TEST_EMAIL = 'sourabh.s23csai@nst.rishihood.edu.in';
const TEST_PASSWORD = 'Sourabh@motu25';

async function testLogin() {
  try {
    console.log('🔐 Testing Login Endpoint...\n');
    console.log(`Email: ${TEST_EMAIL}`);
    console.log(`Base URL: ${BASE_URL}\n`);

    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Login Successful!\n');
    console.log('📋 Response Structure:');
    console.log('='.repeat(80));
    console.log(JSON.stringify(response.data, null, 2));
    console.log('='.repeat(80));

    // Detailed breakdown
    if (response.data.success && response.data.data) {
      const { user, tokens, roleNotice } = response.data.data;
      
      console.log('\n📊 User Information:');
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Name: ${user.firstName} ${user.lastName}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Role: ${user.role}`);
      console.log(`  - Subroles: ${JSON.stringify(user.subroles || [])}`);
      console.log(`  - Department: ${user.department || 'N/A'}`);
      console.log(`  - Permissions Count: ${(user.permissions || []).length}`);
      
      if (user.projectsInvolvement) {
        console.log('\n📁 Project Involvement:');
        console.log(`  - Total Projects: ${user.projectsInvolvement.total}`);
        console.log(`  - Leading: ${user.projectsInvolvement.ledProjectsCount}`);
        console.log(`  - Mentoring: ${user.projectsInvolvement.mentoredProjectsCount}`);
        console.log(`  - Member: ${user.projectsInvolvement.memberProjectsCount}`);
        
        if (user.projectsInvolvement.projects.length > 0) {
          console.log('\n  Projects:');
          user.projectsInvolvement.projects.forEach((project, index) => {
            console.log(`    ${index + 1}. ${project.title}`);
            console.log(`       - Status: ${project.status}`);
            console.log(`       - Category: ${project.category || 'N/A'}`);
            console.log(`       - Role: ${project.roleDisplay}`);
            console.log(`       - ID: ${project.projectId}`);
          });
        }
      } else {
        console.log('\n📁 Project Involvement: None');
      }

      console.log('\n🔑 Tokens:');
      console.log(`  - Access Token: ${tokens.accessToken.substring(0, 50)}...`);
      console.log(`  - Refresh Token: ${tokens.refreshToken.substring(0, 50)}...`);
      console.log(`  - Expires In: ${tokens.expiresIn}`);

      if (roleNotice) {
        console.log('\n⚠️  Role Notice:');
        console.log(`  - Requested: ${roleNotice.requestedRole}`);
        console.log(`  - Assigned: ${roleNotice.assignedRole}`);
        console.log(`  - Message: ${roleNotice.message}`);
      }
    }

    console.log('\n✅ Test completed successfully!');
    return response.data;

  } catch (error) {
    console.error('\n❌ Login Failed!');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received. Is the server running?');
      console.error(`URL: ${BASE_URL}/api/auth/login`);
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testLogin()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testLogin };








