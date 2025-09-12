const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN; // Set this environment variable with admin token

if (!ADMIN_TOKEN) {
  console.error('Please set ADMIN_TOKEN environment variable');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

// Test data for creating a news article
const newsData = {
  title: "New Research Breakthrough in Robotics",
  content: "Our team has made significant progress in developing advanced robotic systems that can adapt to dynamic environments. This breakthrough represents a major step forward in autonomous robotics technology.",
  excerpt: "Major breakthrough in adaptive robotics technology",
  authorId: "507f1f77bcf86cd799439011", // Replace with actual user ID
  categoryId: "507f1f77bcf86cd799439012", // Replace with actual category ID (optional)
  isPublished: true,
  isFeatured: true,
  tags: ["robotics", "research", "breakthrough", "technology"],
  featuredImageUrl: "https://example.com/images/robotics-breakthrough.jpg",
  featureOptions: {
    showInNav: true,
    navLabel: "Research News",
    navOrder: 1
  },
  application: {
    isEnabled: true,
    type: "workshop",
    requireLogin: true,
    deadline: "2024-12-31T23:59:59.000Z",
    maxApplicants: 50,
    formFields: [
      {
        name: "experience",
        label: "Years of Experience",
        type: "number",
        required: true
      },
      {
        name: "interests",
        label: "Areas of Interest",
        type: "select",
        required: true,
        options: ["Machine Learning", "Computer Vision", "Control Systems", "Other"]
      }
    ]
  }
};

async function testAdminNewsCreation() {
  try {
    console.log('Testing Admin News Creation API...');
    console.log('Endpoint:', `${BASE_URL}/api/news/admin`);
    console.log('Data:', JSON.stringify(newsData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/news/admin`, newsData, { headers });
    
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

async function testGetNews() {
  try {
    console.log('\nTesting GET News API...');
    console.log('Endpoint:', `${BASE_URL}/api/news`);
    
    const response = await axios.get(`${BASE_URL}/api/news?isPublished=true&limit=5`);
    
    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('News count:', response.data.data.items.length);
    
    if (response.data.data.items.length > 0) {
      console.log('Latest news:', response.data.data.items[0].title);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Admin News API Tests\n');
  
  await testAdminNewsCreation();
  await testGetNews();
  
  console.log('\n✨ Tests completed!');
}

// Run the tests
runTests().catch(console.error);
