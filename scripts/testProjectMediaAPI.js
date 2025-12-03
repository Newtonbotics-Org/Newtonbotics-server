/**
 * Test script for Project Media Update API
 * Tests the dedicated endpoint for team leaders to update project media
 * Usage: node scripts/testProjectMediaAPI.js
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3005';
const TEST_EMAIL = 'sourabh.s23csai@nst.rishihood.edu.in';
const TEST_PASSWORD = 'Sourabh@motu25';
const TEST_PROJECT_ID = '68f3d44daae2b97eb7be7571'; // Update with actual project ID

async function testProjectMediaAPI() {
  try {
    console.log('📸 Testing Project Media Update API\n');
    console.log('='.repeat(80));
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Test User: ${TEST_EMAIL}`);
    console.log(`Project ID: ${TEST_PROJECT_ID}\n`);

    // Step 1: Login
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

    // Step 2: Get current project to see existing media
    console.log('📋 Step 2: Fetching current project details...\n');
    
    try {
      const projectResponse = await axios.get(`${BASE_URL}/api/projects/${TEST_PROJECT_ID}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (projectResponse.data.success) {
        const project = projectResponse.data.data.project;
        console.log('✅ Project found!');
        console.log(`   Title: ${project.title}`);
        console.log(`   Team Leader ID: ${project.teamLeaderId?._id || project.teamLeaderId}`);
        console.log(`   Current Media:`);
        console.log(`     - Image URL: ${project.imageUrl || 'Not set'}`);
        console.log(`     - Video URL: ${project.videoUrl || 'Not set'}`);
        console.log(`     - GitHub URL: ${project.githubUrl || 'Not set'}`);
        console.log(`     - Documentation URL: ${project.documentationUrl || 'Not set'}\n`);
      }
    } catch (error) {
      console.log('⚠️  Could not fetch project details:', error.response?.data?.error?.message || error.message);
      console.log('   Continuing with media update test...\n');
    }

    // Step 3: Test updating project media
    console.log('📋 Step 3: Testing PUT /api/projects/:id/media...\n');
    
    const mediaUpdate = {
      imageUrl: 'https://example.com/images/test-project.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=test123',
      githubUrl: 'https://github.com/testuser/testproject',
      documentationUrl: 'https://docs.example.com/test-project'
    };

    console.log('📤 Sending media update request...');
    console.log('   Update data:', JSON.stringify(mediaUpdate, null, 2));
    console.log();

    const updateResponse = await axios.put(
      `${BASE_URL}/api/projects/${TEST_PROJECT_ID}/media`,
      mediaUpdate,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Media update successful!\n');
    console.log('📊 Response Summary:');
    console.log('='.repeat(80));
    console.log(`Status: ${updateResponse.status} ${updateResponse.statusText}`);
    console.log(`Message: ${updateResponse.data.message}\n`);

    if (updateResponse.data.success && updateResponse.data.data) {
      const { project, media } = updateResponse.data.data;
      
      console.log('📸 Updated Media:');
      console.log(`   - Image URL: ${media.imageUrl || 'Not set'}`);
      console.log(`   - Video URL: ${media.videoUrl || 'Not set'}`);
      console.log(`   - GitHub URL: ${media.githubUrl || 'Not set'}`);
      console.log(`   - Documentation URL: ${media.documentationUrl || 'Not set'}\n`);

      console.log('📄 Full Response:');
      console.log('='.repeat(80));
      console.log(JSON.stringify(updateResponse.data, null, 2));
      console.log('='.repeat(80));
    }

    // Step 4: Test partial update (only one field)
    console.log('\n📋 Step 4: Testing partial media update (only imageUrl)...\n');
    
    const partialUpdate = {
      imageUrl: 'https://example.com/images/updated-image.png'
    };

    const partialResponse = await axios.put(
      `${BASE_URL}/api/projects/${TEST_PROJECT_ID}/media`,
      partialUpdate,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (partialResponse.data.success) {
      console.log('✅ Partial update successful!');
      console.log(`   Updated Image URL: ${partialResponse.data.data.media.imageUrl}\n`);
    }

    // Step 5: Test clearing a field (empty string)
    console.log('📋 Step 5: Testing clearing a media field (setting to empty)...\n');
    
    const clearUpdate = {
      videoUrl: ''
    };

    const clearResponse = await axios.put(
      `${BASE_URL}/api/projects/${TEST_PROJECT_ID}/media`,
      clearUpdate,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (clearResponse.data.success) {
      console.log('✅ Clear field successful!');
      console.log(`   Video URL cleared: ${clearResponse.data.data.media.videoUrl === null ? 'Yes' : 'No'}\n`);
    }

    console.log('✅ All project media API tests completed successfully!');
    return updateResponse.data;

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
      } else if (error.response.status === 403) {
        console.error('\n💡 Tip: Access denied. The user needs to be:');
        console.error('   - The project team leader, OR');
        console.error('   - The project mentor, OR');
        console.error('   - An admin');
      } else if (error.response.status === 404) {
        console.error('\n💡 Tip: Project not found. Check if:');
        console.error('   - The project ID is correct');
        console.error('   - The project exists in the database');
      } else if (error.response.status === 400) {
        console.error('\n💡 Tip: Validation error. Check if:');
        console.error('   - URLs are in the correct format');
        console.error('   - Image URLs end with .jpg, .jpeg, .png, .gif, or .webp');
        console.error('   - Video URLs are from YouTube, Vimeo, or Dailymotion');
        console.error('   - GitHub URLs are valid GitHub repository URLs');
      }
    } else if (error.request) {
      console.error('No response received. Is the server running?');
      console.error(`URL: ${BASE_URL}/api/projects/${TEST_PROJECT_ID}/media`);
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testProjectMediaAPI()
    .then(() => {
      console.log('\n🎉 Test script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testProjectMediaAPI };








