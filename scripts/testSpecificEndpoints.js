#!/usr/bin/env node

/**
 * Test the specific endpoints that were returning 404 errors
 */

const axios = require('axios');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:3005/api';

// Get admin token
const getAdminToken = () => {
  try {
    const output = execSync('node scripts/getAdminToken.js', { encoding: 'utf8' });
    const tokenMatch = output.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    return tokenMatch ? tokenMatch[0] : null;
  } catch (error) {
    console.error('Failed to get admin token:', error.message);
    return null;
  }
};

const testEndpoint = async (name, url, headers = {}) => {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   URL: ${url}`);
    
    const response = await axios.get(url, { headers });
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   ✅ Success: ${response.data.success}`);
    
    if (response.data.data) {
      if (response.data.data.overview) {
        console.log(`   📊 Statistics: ${JSON.stringify(response.data.data.overview, null, 2)}`);
      } else if (Array.isArray(response.data.data.subscriptions)) {
        console.log(`   📋 Subscriptions: ${response.data.data.subscriptions.length} found`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.status || 'Network Error'}`);
    console.log(`   ❌ Message: ${error.response?.data?.message || error.message}`);
    return false;
  }
};

async function testSpecificEndpoints() {
  console.log('🎯 Testing Specific Newsletter Endpoints');
  console.log('=' .repeat(50));
  
  const adminToken = getAdminToken();
  if (!adminToken) {
    console.error('❌ Could not get admin token');
    return;
  }
  
  const headers = { Authorization: `Bearer ${adminToken}` };
  
  // Test the exact endpoints that were failing
  const endpoints = [
    {
      name: 'Admin Statistics',
      url: `${BASE_URL}/newsletter/admin/statistics`
    },
    {
      name: 'Admin Subscriptions (with query params)',
      url: `${BASE_URL}/newsletter/admin/subscriptions?limit=20&skip=0&sortBy=subscribedAt&sortOrder=desc`
    }
  ];
  
  let passed = 0;
  let total = endpoints.length;
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint.name, endpoint.url, headers);
    if (success) passed++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('\n🎉 All endpoints are working correctly!');
    console.log('💡 The 404 errors you experienced were due to:');
    console.log('   • Frontend calling port 3000 instead of 3005');
    console.log('   • Next.js server occupying port 3000');
    console.log('   • Express server running on port 3005');
  } else {
    console.log('\n⚠️ Some endpoints failed. Check the error messages above.');
  }
  
  console.log('\n🔧 Solution:');
  console.log('   Update your frontend to use: http://localhost:3005/api');
  console.log('   Instead of: http://localhost:3000/api');
}

testSpecificEndpoints().catch(console.error);






