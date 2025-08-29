const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testContactAPI() {
  console.log('🧪 Testing Contact API...\n');

  try {
    // Test 1: Submit a contact form
    console.log('1. Testing contact form submission...');
    const contactData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      subject: 'Test Contact Message',
      message: 'This is a test message to verify the contact API is working correctly.',
      phone: '+1-555-0123',
      category: 'General'
    };

    const response = await axios.post(`${BASE_URL}/api/contact/submit`, contactData);
    
    if (response.data.success) {
      console.log('✅ Contact submission successful!');
      console.log(`   Message ID: ${response.data.data.id}`);
      console.log(`   Response: ${response.data.message}\n`);
    } else {
      console.log('❌ Contact submission failed:', response.data.error);
    }

    // Test 2: Get contact submissions (admin endpoint)
    console.log('2. Testing contact submissions retrieval...');
    try {
      const submissionsResponse = await axios.get(`${BASE_URL}/api/contact/submissions`);
      if (submissionsResponse.data.success) {
        console.log('✅ Contact submissions retrieved successfully!');
        console.log(`   Total submissions: ${submissionsResponse.data.data.pagination.total}\n`);
      } else {
        console.log('❌ Failed to retrieve submissions:', submissionsResponse.data.error);
      }
    } catch (error) {
      console.log('⚠️ Submissions endpoint may require authentication:', error.response?.data?.error || error.message);
    }

    // Test 3: Get contact statistics
    console.log('3. Testing contact statistics...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/api/contact/stats`);
      if (statsResponse.data.success) {
        console.log('✅ Contact statistics retrieved successfully!');
        const stats = statsResponse.data.data.overview;
        console.log(`   Total: ${stats.total}, New: ${stats.new}, In Progress: ${stats.inProgress}, Resolved: ${stats.resolved}, Closed: ${stats.closed}`);
      } else {
        console.log('❌ Failed to retrieve statistics:', statsResponse.data.error);
      }
    } catch (error) {
      console.log('⚠️ Statistics endpoint may require authentication:', error.response?.data?.error || error.message);
    }

    console.log('\n🎉 Contact API testing completed!');

  } catch (error) {
    console.error('❌ Error testing contact API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testContactAPI();
}

module.exports = testContactAPI;
