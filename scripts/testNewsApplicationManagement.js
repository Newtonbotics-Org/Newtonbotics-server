const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3005';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN; // Set this environment variable with admin token

if (!ADMIN_TOKEN) {
  console.error('Please set ADMIN_TOKEN environment variable');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testGetApplications() {
  try {
    console.log('📋 Testing Get Applications...');
    
    // First get a news article that has applications
    const listResponse = await axios.get(`${BASE_URL}/api/news?limit=10`);
    const newsWithApplications = listResponse.data.data.items.find(news => 
      news.application && news.application.isEnabled
    );
    
    if (!newsWithApplications) {
      console.log('⚠️ No news with applications found, creating one...');
      return null;
    }
    
    const newsId = newsWithApplications._id;
    console.log('News ID:', newsId);
    
    const response = await axios.get(`${BASE_URL}/api/news/${newsId}/applications`, { headers });
    
    console.log('✅ Applications retrieved successfully');
    console.log('Total applications:', response.data.data.pagination.total);
    console.log('Applications returned:', response.data.data.applications.length);
    
    if (response.data.data.applications.length > 0) {
      const app = response.data.data.applications[0];
      console.log('Sample application:');
      console.log('- ID:', app._id);
      console.log('- Status:', app.status);
      console.log('- Applicant:', app.applicant.fullName);
      console.log('- Submitted:', app.submittedAt);
    }
    
    return { newsId, applications: response.data.data.applications };
    
  } catch (error) {
    console.error('❌ Error getting applications:', error.response?.data || error.message);
    return null;
  }
}

async function testApplicationStatus() {
  try {
    console.log('\n🔍 Testing Application Status...');
    
    // Get a news article
    const listResponse = await axios.get(`${BASE_URL}/api/news?limit=1`);
    const newsId = listResponse.data.data.items[0]._id;
    
    const response = await axios.get(`${BASE_URL}/api/news/${newsId}/application-status`, { headers });
    
    console.log('✅ Application status retrieved');
    console.log('Has applied:', response.data.data.hasApplied);
    console.log('Can apply:', response.data.data.canApply);
    console.log('Reason:', response.data.data.reason);
    
    if (response.data.data.application) {
      console.log('Application details:');
      console.log('- ID:', response.data.data.application.id);
      console.log('- Status:', response.data.data.application.status);
      console.log('- Submitted:', response.data.data.application.submittedAt);
    }
    
    return { newsId, status: response.data.data };
    
  } catch (error) {
    console.error('❌ Error getting application status:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdateApplicationStatus() {
  try {
    console.log('\n🔄 Testing Update Application Status...');
    
    // First get applications
    const appsResult = await testGetApplications();
    if (!appsResult || appsResult.applications.length === 0) {
      console.log('⚠️ No applications found to update');
      return null;
    }
    
    const { newsId, applications } = appsResult;
    const applicationId = applications[0]._id;
    
    const updateData = {
      status: 'reviewed',
      notes: 'Application under review - testing status update functionality'
    };
    
    const response = await axios.put(
      `${BASE_URL}/api/news/${newsId}/applications/${applicationId}/status`,
      updateData,
      { headers }
    );
    
    console.log('✅ Application status updated successfully');
    console.log('New status:', response.data.data.application.status);
    console.log('Reviewed at:', response.data.data.application.reviewedAt);
    console.log('Notes:', response.data.data.application.notes);
    
    return { newsId, applicationId, updated: response.data.data.application };
    
  } catch (error) {
    console.error('❌ Error updating application status:', error.response?.data || error.message);
    return null;
  }
}

async function testCreateNewsWithApplicationAndApply() {
  try {
    console.log('\n📝 Testing Create News + Apply + Manage...');
    
    // Create news with application
    const newsData = {
      title: "Test Workshop for Management",
      content: "This is a test workshop to verify the complete application management flow.",
      excerpt: "Test workshop for application management",
      authorId: "68a30681af3f3b7d9e2653a3",
      isPublished: true,
      tags: ["test", "workshop", "management"],
      application: {
        isEnabled: true,
        type: "workshop",
        requireLogin: false,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxApplicants: 5,
        formFields: [
          {
            name: "name",
            label: "Full Name",
            type: "text",
            required: true
          },
          {
            name: "interest",
            label: "Area of Interest",
            type: "select",
            required: true,
            options: ["Robotics", "AI", "IoT", "Other"]
          }
        ]
      }
    };
    
    const createResponse = await axios.post(`${BASE_URL}/api/news/admin`, newsData, { headers });
    const newsId = createResponse.data.data.item._id;
    console.log('✅ News created with application form');
    console.log('News ID:', newsId);
    
    // Apply to the news
    const applicationData = {
      fullName: "Test User",
      email: "test.user@example.com",
      phone: "+1234567890",
      responses: [
        {
          fieldName: "name",
          value: "Test User"
        },
        {
          fieldName: "interest",
          value: "Robotics"
        }
      ]
    };
    
    const applyResponse = await axios.post(`${BASE_URL}/api/news/${newsId}/apply`, applicationData);
    const applicationId = applyResponse.data.data.application._id;
    console.log('✅ Application submitted');
    console.log('Application ID:', applicationId);
    
    // Get applications
    const appsResponse = await axios.get(`${BASE_URL}/api/news/${newsId}/applications`, { headers });
    console.log('✅ Applications retrieved:', appsResponse.data.data.applications.length);
    
    // Update application status
    const statusUpdateData = {
      status: 'accepted',
      notes: 'Excellent application! Welcome to the workshop.'
    };
    
    const updateResponse = await axios.put(
      `${BASE_URL}/api/news/${newsId}/applications/${applicationId}/status`,
      statusUpdateData,
      { headers }
    );
    
    console.log('✅ Application status updated to:', updateResponse.data.data.application.status);
    
    return { newsId, applicationId };
    
  } catch (error) {
    console.error('❌ Error in complete flow test:', error.response?.data || error.message);
    return null;
  }
}

async function testApplicationStatusScenarios() {
  try {
    console.log('\n🎯 Testing Application Status Scenarios...');
    
    // Create news with past deadline
    const pastDeadlineData = {
      title: "Past Deadline Test",
      content: "Testing deadline scenarios",
      authorId: "68a30681af3f3b7d9e2653a3",
      isPublished: true,
      application: {
        isEnabled: true,
        type: "workshop",
        requireLogin: false,
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        maxApplicants: 10,
        formFields: [
          {
            name: "name",
            label: "Name",
            type: "text",
            required: true
          }
        ]
      }
    };
    
    const createResponse = await axios.post(`${BASE_URL}/api/news/admin`, pastDeadlineData, { headers });
    const pastDeadlineNewsId = createResponse.data.data.item._id;
    
    // Check application status for past deadline
    const statusResponse = await axios.get(`${BASE_URL}/api/news/${pastDeadlineNewsId}/application-status`, { headers });
    
    console.log('✅ Past deadline status check:');
    console.log('- Can apply:', statusResponse.data.data.canApply);
    console.log('- Reason:', statusResponse.data.data.reason);
    
    // Create news with max 1 applicant
    const maxApplicantData = {
      title: "Max Applicant Test",
      content: "Testing max applicant scenarios",
      authorId: "68a30681af3f3b7d9e2653a3",
      isPublished: true,
      application: {
        isEnabled: true,
        type: "workshop",
        requireLogin: false,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxApplicants: 1,
        formFields: [
          {
            name: "name",
            label: "Name",
            type: "text",
            required: true
          }
        ]
      }
    };
    
    const maxCreateResponse = await axios.post(`${BASE_URL}/api/news/admin`, maxApplicantData, { headers });
    const maxNewsId = maxCreateResponse.data.data.item._id;
    
    // Apply first time
    const firstApplication = {
      fullName: "First User",
      email: "first@example.com",
      responses: [{ fieldName: "name", value: "First User" }]
    };
    
    await axios.post(`${BASE_URL}/api/news/${maxNewsId}/apply`, firstApplication);
    console.log('✅ First application submitted');
    
    // Check status after first application
    const maxStatusResponse = await axios.get(`${BASE_URL}/api/news/${maxNewsId}/application-status`, { headers });
    console.log('✅ Max applicant status check:');
    console.log('- Can apply:', maxStatusResponse.data.data.canApply);
    console.log('- Reason:', maxStatusResponse.data.data.reason);
    
  } catch (error) {
    console.error('❌ Error testing scenarios:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting News Application Management Tests\n');
  
  await testGetApplications();
  await testApplicationStatus();
  await testUpdateApplicationStatus();
  await testCreateNewsWithApplicationAndApply();
  await testApplicationStatusScenarios();
  
  console.log('\n✨ All management tests completed!');
}

// Run the tests
runTests().catch(console.error);
