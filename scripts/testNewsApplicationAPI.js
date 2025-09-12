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

async function testCreateNewsWithApplication() {
  try {
    console.log('📝 Testing Create News with Application Form...');
    
    const newsData = {
      title: "Robotics Workshop with Application Form",
      content: "Join our advanced robotics workshop. This workshop will cover cutting-edge topics including machine learning for robotics, computer vision, and autonomous navigation systems.",
      excerpt: "Advanced robotics workshop with application form",
      authorId: "68a30681af3f3b7d9e2653a3",
      isPublished: true,
      tags: ["robotics", "workshop", "application"],
      application: {
        isEnabled: true,
        type: "workshop",
        requireLogin: false,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        maxApplicants: 25,
        formFields: [
          {
            name: "experience",
            label: "Experience Level",
            type: "select",
            required: true,
            options: ["Beginner", "Intermediate", "Advanced"]
          },
          {
            name: "motivation",
            label: "Why do you want to join?",
            type: "textarea",
            required: true
          },
          {
            name: "availability",
            label: "Available Dates",
            type: "checkbox",
            required: false,
            options: ["March 15-17", "April 12-14", "May 10-12"]
          }
        ]
      }
    };
    
    const response = await axios.post(`${BASE_URL}/api/news/admin`, newsData, { headers });
    
    console.log('✅ News created with application form');
    console.log('News ID:', response.data.data.item._id);
    console.log('Application enabled:', response.data.data.item.application.isEnabled);
    console.log('Deadline:', response.data.data.item.application.deadline);
    console.log('Max applicants:', response.data.data.item.application.maxApplicants);
    console.log('Form fields count:', response.data.data.item.application.formFields.length);
    
    return response.data.data.item._id;
    
  } catch (error) {
    console.error('❌ Error creating news with application:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdateNewsApplication() {
  try {
    console.log('\n🔄 Testing Update News Application...');
    
    // First get a news article
    const listResponse = await axios.get(`${BASE_URL}/api/news?limit=1`);
    const newsId = listResponse.data.data.items[0]._id;
    
    const updateData = {
      application: {
        isEnabled: true,
        type: "competition",
        requireLogin: true,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        maxApplicants: 50,
        formFields: [
          {
            name: "teamName",
            label: "Team Name",
            type: "text",
            required: true
          },
          {
            name: "members",
            label: "Team Members",
            type: "textarea",
            required: true
          },
          {
            name: "project",
            label: "Project Description",
            type: "textarea",
            required: true
          }
        ]
      }
    };
    
    const response = await axios.put(`${BASE_URL}/api/news/admin/${newsId}`, updateData, { headers });
    
    console.log('✅ News application updated');
    console.log('Updated deadline:', response.data.data.item.application.deadline);
    console.log('Updated max applicants:', response.data.data.item.application.maxApplicants);
    console.log('Updated form fields count:', response.data.data.item.application.formFields.length);
    
    return newsId;
    
  } catch (error) {
    console.error('❌ Error updating news application:', error.response?.data || error.message);
    return null;
  }
}

async function testApplyToNews(newsId) {
  try {
    console.log('\n📋 Testing Apply to News...');
    
    const applicationData = {
      fullName: "John Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
      responses: [
        {
          fieldName: "experience",
          value: "Intermediate"
        },
        {
          fieldName: "motivation",
          value: "I want to learn advanced robotics techniques and work on real-world projects."
        },
        {
          fieldName: "availability",
          value: ["March 15-17", "April 12-14"]
        }
      ]
    };
    
    const response = await axios.post(`${BASE_URL}/api/news/${newsId}/apply`, applicationData);
    
    console.log('✅ Application submitted successfully');
    console.log('Application ID:', response.data.data.application._id);
    console.log('Status:', response.data.data.application.status);
    console.log('Submitted at:', response.data.data.application.submittedAt);
    
    return response.data.data.application._id;
    
  } catch (error) {
    console.error('❌ Error applying to news:', error.response?.data || error.message);
    return null;
  }
}

async function testDeadlineEnforcement(newsId) {
  try {
    console.log('\n⏰ Testing Deadline Enforcement...');
    
    // Create a news article with past deadline
    const pastDeadlineData = {
      title: "Past Deadline Test",
      content: "This news has a past deadline for testing.",
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
    
    // Try to apply to past deadline news
    const applicationData = {
      fullName: "Test User",
      email: "test@example.com",
      responses: [
        {
          fieldName: "name",
          value: "Test User"
        }
      ]
    };
    
    try {
      await axios.post(`${BASE_URL}/api/news/${pastDeadlineNewsId}/apply`, applicationData);
      console.log('❌ Should have failed - deadline passed');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('deadline')) {
        console.log('✅ Deadline enforcement working correctly');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing deadline enforcement:', error.response?.data || error.message);
  }
}

async function testMaxApplicantsEnforcement(newsId) {
  try {
    console.log('\n👥 Testing Max Applicants Enforcement...');
    
    // Create a news article with max 1 applicant
    const maxApplicantData = {
      title: "Max Applicants Test",
      content: "This news has max 1 applicant for testing.",
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
    
    const createResponse = await axios.post(`${BASE_URL}/api/news/admin`, maxApplicantData, { headers });
    const maxApplicantNewsId = createResponse.data.data.item._id;
    
    // Apply first time (should succeed)
    const firstApplication = {
      fullName: "First User",
      email: "first@example.com",
      responses: [{ fieldName: "name", value: "First User" }]
    };
    
    await axios.post(`${BASE_URL}/api/news/${maxApplicantNewsId}/apply`, firstApplication);
    console.log('✅ First application submitted');
    
    // Try to apply second time (should fail)
    const secondApplication = {
      fullName: "Second User",
      email: "second@example.com",
      responses: [{ fieldName: "name", value: "Second User" }]
    };
    
    try {
      await axios.post(`${BASE_URL}/api/news/${maxApplicantNewsId}/apply`, secondApplication);
      console.log('❌ Should have failed - max applicants reached');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('limit')) {
        console.log('✅ Max applicants enforcement working correctly');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing max applicants enforcement:', error.response?.data || error.message);
  }
}

async function testGetNewsWithApplicationInfo() {
  try {
    console.log('\n📰 Testing Get News with Application Info...');
    
    // Get a news article
    const listResponse = await axios.get(`${BASE_URL}/api/news?limit=1`);
    const newsId = listResponse.data.data.items[0]._id;
    
    const response = await axios.get(`${BASE_URL}/api/news/${newsId}`);
    const news = response.data.data.item;
    
    console.log('✅ News retrieved with application info');
    console.log('Title:', news.title);
    console.log('Application enabled:', news.application.isEnabled);
    
    if (news.application.isEnabled) {
      console.log('Application type:', news.application.type);
      console.log('Deadline:', news.application.deadline);
      console.log('Max applicants:', news.application.maxApplicants);
      console.log('Require login:', news.application.requireLogin);
      console.log('Form fields count:', news.application.formFields.length);
      
      // Check if deadline is in the future
      const deadline = new Date(news.application.deadline);
      const now = new Date();
      const isDeadlineActive = deadline > now;
      console.log('Deadline active:', isDeadlineActive);
      
      // Calculate days until deadline
      const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      console.log('Days until deadline:', daysUntilDeadline);
    }
    
  } catch (error) {
    console.error('❌ Error getting news with application info:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting News Application API Tests\n');
  
  const newsId = await testCreateNewsWithApplication();
  await testUpdateNewsApplication();
  
  if (newsId) {
    await testApplyToNews(newsId);
  }
  
  await testDeadlineEnforcement();
  await testMaxApplicantsEnforcement();
  await testGetNewsWithApplicationInfo();
  
  console.log('\n✨ All tests completed!');
}

// Run the tests
runTests().catch(console.error);
