const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3005';
const ADMIN_TOKEN = process.argv[2] || 'your-admin-token-here';

console.log('📰 Testing News API Endpoints');
console.log('=============================');
console.log('Base URL:', BASE_URL);
console.log('Token:', ADMIN_TOKEN.substring(0, 20) + '...');

async function testNewsAPI() {
  try {
    // Test 1: GET /api/news/categories
    console.log('\n📋 Test 1: GET /api/news/categories');
    console.log('-----------------------------------');
    
    const categoriesResponse = await axios.get(`${BASE_URL}/api/news/categories`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', categoriesResponse.status);
    console.log('📦 Categories Response:', JSON.stringify(categoriesResponse.data, null, 2));
    
    // Test 2: POST /api/news - Create news article
    console.log('\n📋 Test 2: POST /api/news - Create news article');
    console.log('------------------------------------------------');
    
    const newsData = {
      title: 'Test News Article',
      content: 'This is a test news article content. It should be at least 20 characters long.',
      authorId: '68a30681af3f3b7d9e2653a3', // Admin user ID
      isPublished: false,
      tags: ['test', 'api'],
      featuredImageUrl: 'https://via.placeholder.com/800x400'
    };
    
    const createResponse = await axios.post(`${BASE_URL}/api/news`, newsData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', createResponse.status);
    console.log('📦 Create Response:', JSON.stringify(createResponse.data, null, 2));
    
    // Test 3: GET /api/news - List news articles
    console.log('\n📋 Test 3: GET /api/news - List news articles');
    console.log('-----------------------------------------------');
    
    const listResponse = await axios.get(`${BASE_URL}/api/news?limit=5`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', listResponse.status);
    console.log('📦 List Response:', JSON.stringify(listResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Error Message:', error.response?.data?.error?.message);
    console.log('Full Error:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 401) {
      console.log('\n💡 401 Unauthorized - This means:');
      console.log('   - Token is missing or invalid');
      console.log('   - Token has expired');
      console.log('   - JWT_SECRET is incorrect');
    } else if (error.response?.status === 403) {
      console.log('\n💡 403 Forbidden - This means:');
      console.log('   - User is authenticated but not a mentor/admin');
      console.log('   - User role is insufficient');
    } else if (error.response?.status === 404) {
      console.log('\n💡 404 Not Found - This means:');
      console.log('   - Route not found');
      console.log('   - Resource not found');
    }
  }
}

// Run the test
testNewsAPI();

