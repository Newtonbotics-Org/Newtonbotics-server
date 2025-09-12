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

async function testRouteExists() {
  try {
    console.log('🔍 Testing if /api/news/admin route exists...');
    console.log('Endpoint:', `${BASE_URL}/api/news/admin`);
    
    // Test with minimal data to see if route exists
    const testData = {
      title: "Test News Article",
      content: "This is a test article to verify the route exists.",
      authorId: "507f1f77bcf86cd799439011"
    };
    
    const response = await axios.post(`${BASE_URL}/api/news/admin`, testData, { headers });
    
    console.log('\n✅ Route exists and is working!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 404) {
        console.error('\n🔍 Route not found. This could mean:');
        console.error('1. The server needs to be restarted');
        console.error('2. The route is not properly defined');
        console.error('3. There\'s a route order issue');
      }
    } else {
      console.error('Network Error:', error.message);
      console.error('Make sure the server is running on', BASE_URL);
    }
  }
}

async function testHealthCheck() {
  try {
    console.log('\n🏥 Testing server health...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running');
    console.log('Health check response:', response.data);
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
  }
}

async function testNewsList() {
  try {
    console.log('\n📰 Testing news list endpoint...');
    const response = await axios.get(`${BASE_URL}/api/news`);
    console.log('✅ News list endpoint works');
    console.log('News count:', response.data.data.items.length);
  } catch (error) {
    console.error('❌ News list endpoint failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Route Existence Tests\n');
  
  await testHealthCheck();
  await testNewsList();
  await testRouteExists();
  
  console.log('\n✨ Tests completed!');
}

// Run the tests
runTests().catch(console.error);
