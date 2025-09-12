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

// Test data for updating a news article
const updateData = {
  title: "Updated: Advanced Robotics Workshop 2024",
  content: "Updated content: Join us for an intensive 3-day workshop on advanced robotics and artificial intelligence. This workshop will cover cutting-edge topics including machine learning for robotics, computer vision, and autonomous navigation systems. Participants will have hands-on experience with our latest robotic platforms and will work on real-world projects. NEW: We've added hands-on sessions with ROS2 and simulation environments.",
  excerpt: "Updated: Intensive 3-day workshop on advanced robotics and AI with ROS2",
  isPublished: true,
  isFeatured: true,
  tags: ["robotics", "workshop", "AI", "machine learning", "ROS2", "simulation"],
  featuredImageUrl: "https://example.com/images/updated-robotics-workshop.jpg",
  featureOptions: {
    showInNav: true,
    navLabel: "Updated Workshops",
    navOrder: 2
  },
  application: {
    isEnabled: true,
    type: "workshop",
    requireLogin: true,
    deadline: "2024-12-31T23:59:59.000Z",
    maxApplicants: 30,
    formFields: [
      {
        name: "experience",
        label: "Experience Level",
        type: "select",
        required: true,
        options: ["Beginner", "Intermediate", "Advanced", "Expert"]
      },
      {
        name: "background",
        label: "Educational Background",
        type: "text",
        required: true
      },
      {
        name: "goals",
        label: "Learning Goals",
        type: "textarea",
        required: true
      },
      {
        name: "tools",
        label: "Preferred Tools",
        type: "checkbox",
        required: false,
        options: ["ROS2", "Gazebo", "Python", "C++", "MATLAB"]
      }
    ]
  }
};

async function testAdminNewsUpdate() {
  try {
    console.log('Testing Admin News Update API...');
    
    // First, let's get a list of news articles to find one to update
    console.log('📰 Getting list of news articles...');
    const listResponse = await axios.get(`${BASE_URL}/api/news?limit=5`);
    const newsArticles = listResponse.data.data.items;
    
    if (newsArticles.length === 0) {
      console.log('❌ No news articles found. Please create one first.');
      return;
    }
    
    // Use the first article for testing
    const newsId = newsArticles[0]._id;
    console.log(`🔄 Using news article ID: ${newsId}`);
    console.log(`📝 Original title: ${newsArticles[0].title}`);
    
    console.log('Endpoint:', `${BASE_URL}/api/news/admin/${newsId}`);
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    
    const response = await axios.put(`${BASE_URL}/api/news/admin/${newsId}`, updateData, { headers });
    
    console.log('\n✅ Success!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function testPartialUpdate() {
  try {
    console.log('\n🔄 Testing Partial Update...');
    
    // Get a news article
    const listResponse = await axios.get(`${BASE_URL}/api/news?limit=1`);
    const newsArticles = listResponse.data.data.items;
    
    if (newsArticles.length === 0) {
      console.log('❌ No news articles found for partial update test.');
      return;
    }
    
    const newsId = newsArticles[0]._id;
    
    // Partial update - only update title and tags
    const partialUpdateData = {
      title: "Partially Updated: " + newsArticles[0].title,
      tags: ["partial", "update", "test"]
    };
    
    console.log('Partial update data:', JSON.stringify(partialUpdateData, null, 2));
    
    const response = await axios.put(`${BASE_URL}/api/news/admin/${newsId}`, partialUpdateData, { headers });
    
    console.log('✅ Partial update successful!');
    console.log('Updated title:', response.data.data.item.title);
    console.log('Updated tags:', response.data.data.item.tags);
    
  } catch (error) {
    console.error('❌ Partial update error:', error.response?.data || error.message);
  }
}

async function testPublishUnpublish() {
  try {
    console.log('\n📢 Testing Publish/Unpublish...');
    
    // Get a news article
    const listResponse = await axios.get(`${BASE_URL}/api/news?limit=1`);
    const newsArticles = listResponse.data.data.items;
    
    if (newsArticles.length === 0) {
      console.log('❌ No news articles found for publish test.');
      return;
    }
    
    const newsId = newsArticles[0]._id;
    const originalPublished = newsArticles[0].isPublished;
    
    // Toggle publish status
    const toggleData = {
      isPublished: !originalPublished
    };
    
    console.log(`🔄 Toggling publish status from ${originalPublished} to ${!originalPublished}`);
    
    const response = await axios.put(`${BASE_URL}/api/news/admin/${newsId}`, toggleData, { headers });
    
    console.log('✅ Publish toggle successful!');
    console.log('New publish status:', response.data.data.item.isPublished);
    console.log('Published at:', response.data.data.item.publishedAt);
    
  } catch (error) {
    console.error('❌ Publish toggle error:', error.response?.data || error.message);
  }
}

async function testInvalidUpdate() {
  try {
    console.log('\n🚫 Testing Invalid Update...');
    
    // Get a news article
    const listResponse = await axios.get(`${BASE_URL}/api/news?limit=1`);
    const newsArticles = listResponse.data.data.items;
    
    if (newsArticles.length === 0) {
      console.log('❌ No news articles found for invalid update test.');
      return;
    }
    
    const newsId = newsArticles[0]._id;
    
    // Invalid data - title too short
    const invalidData = {
      title: "Hi", // Too short (min 5 characters)
      content: "Short" // Too short (min 20 characters)
    };
    
    console.log('Invalid update data:', JSON.stringify(invalidData, null, 2));
    
    const response = await axios.put(`${BASE_URL}/api/news/admin/${newsId}`, invalidData, { headers });
    
    console.log('❌ This should have failed!');
    
  } catch (error) {
    console.log('✅ Invalid update correctly rejected!');
    console.log('Status:', error.response.status);
    console.log('Error:', error.response.data.error.message);
  }
}

async function testNonExistentNews() {
  try {
    console.log('\n🔍 Testing Non-Existent News Update...');
    
    const fakeId = "507f1f77bcf86cd799439011";
    const updateData = {
      title: "This should fail"
    };
    
    console.log('Attempting to update non-existent news ID:', fakeId);
    
    const response = await axios.put(`${BASE_URL}/api/news/admin/${fakeId}`, updateData, { headers });
    
    console.log('❌ This should have failed!');
    
  } catch (error) {
    console.log('✅ Non-existent news correctly rejected!');
    console.log('Status:', error.response.status);
    console.log('Error:', error.response.data.error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Admin News Update API Tests\n');
  
  await testAdminNewsUpdate();
  await testPartialUpdate();
  await testPublishUnpublish();
  await testInvalidUpdate();
  await testNonExistentNews();
  
  console.log('\n✨ All tests completed!');
}

// Run the tests
runTests().catch(console.error);
