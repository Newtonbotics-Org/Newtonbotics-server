#!/usr/bin/env node

/**
 * Newsletter Backend Functionality Test Script
 * Tests all newsletter endpoints including admin functionality
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = 'http://localhost:3005/api';
const TEST_EMAIL = 'test.backend@example.com';
const ADMIN_EMAIL = 'monu2feb2004@gmail.com';
const ADMIN_PASSWORD = 'Monu@123';

let adminToken = '';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper functions
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`.blue),
  success: (msg) => console.log(`✅ ${msg}`.green),
  error: (msg) => console.log(`❌ ${msg}`.red),
  warning: (msg) => console.log(`⚠️  ${msg}`.yellow),
  test: (msg) => console.log(`🧪 ${msg}`.cyan)
};

const recordTest = (name, passed, details = '') => {
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
    log.success(`${name} - PASSED`);
  } else {
    results.failed++;
    log.error(`${name} - FAILED: ${details}`);
  }
};

// Test functions
async function testServerHealth() {
  log.test('Testing server health...');
  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    recordTest('Server Health Check', response.status === 200, `Status: ${response.status}`);
    return true;
  } catch (error) {
    recordTest('Server Health Check', false, error.message);
    return false;
  }
}

async function getAdminToken() {
  log.test('Getting admin authentication token...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (response.data.success && response.data.data.token) {
      adminToken = response.data.data.token;
      recordTest('Admin Authentication', true, 'Token obtained successfully');
      return true;
    } else {
      recordTest('Admin Authentication', false, 'No token in response');
      return false;
    }
  } catch (error) {
    recordTest('Admin Authentication', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testNewsletterSubscribe() {
  log.test('Testing newsletter subscription...');
  try {
    const response = await axios.post(`${BASE_URL}/newsletter/subscribe`, {
      email: TEST_EMAIL,
      firstName: 'Backend',
      lastName: 'Test'
    });
    
    const success = response.status === 201 && response.data.success;
    recordTest('Newsletter Subscription', success, 
      success ? 'Subscription created' : response.data.message);
    return success;
  } catch (error) {
    recordTest('Newsletter Subscription', false, 
      error.response?.data?.message || error.message);
    return false;
  }
}

async function testNewsletterStatus() {
  log.test('Testing newsletter status check...');
  try {
    const response = await axios.get(`${BASE_URL}/newsletter/status/${encodeURIComponent(TEST_EMAIL)}`);
    
    const success = response.status === 200 && response.data.success;
    recordTest('Newsletter Status Check', success, 
      success ? `Status: ${response.data.data.isSubscribed}` : response.data.message);
    return success;
  } catch (error) {
    recordTest('Newsletter Status Check', false, 
      error.response?.data?.message || error.message);
    return false;
  }
}

async function testNewsletterUnsubscribe() {
  log.test('Testing newsletter unsubscription...');
  try {
    const response = await axios.delete(`${BASE_URL}/newsletter/unsubscribe`, {
      data: { email: TEST_EMAIL }
    });
    
    const success = response.status === 200 && response.data.success;
    recordTest('Newsletter Unsubscription', success, 
      success ? 'Unsubscribed successfully' : response.data.message);
    return success;
  } catch (error) {
    recordTest('Newsletter Unsubscription', false, 
      error.response?.data?.message || error.message);
    return false;
  }
}

async function testAdminStatistics() {
  log.test('Testing admin statistics endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/newsletter/admin/statistics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const success = response.status === 200 && response.data.success;
    const hasData = success && response.data.data && response.data.data.overview;
    recordTest('Admin Statistics', hasData, 
      hasData ? `Total: ${response.data.data.overview.totalSubscriptions}` : 'No data returned');
    return hasData;
  } catch (error) {
    recordTest('Admin Statistics', false, 
      error.response?.data?.message || error.message);
    return false;
  }
}

async function testAdminSubscriptions() {
  log.test('Testing admin subscriptions list...');
  try {
    const response = await axios.get(`${BASE_URL}/newsletter/admin/subscriptions?limit=10&skip=0&sortBy=subscribedAt&sortOrder=desc`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const success = response.status === 200 && response.data.success;
    const hasData = success && response.data.data && Array.isArray(response.data.data.subscriptions);
    recordTest('Admin Subscriptions List', hasData, 
      hasData ? `Found ${response.data.data.subscriptions.length} subscriptions` : 'No subscriptions data');
    return hasData;
  } catch (error) {
    recordTest('Admin Subscriptions List', false, 
      error.response?.data?.message || error.message);
    return false;
  }
}

async function testAdminSearch() {
  log.test('Testing admin search functionality...');
  try {
    const response = await axios.get(`${BASE_URL}/newsletter/admin/subscriptions?q=gmail&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const success = response.status === 200 && response.data.success;
    const hasData = success && response.data.data && Array.isArray(response.data.data.subscriptions);
    recordTest('Admin Search', hasData, 
      hasData ? `Search returned ${response.data.data.subscriptions.length} results` : 'No search results');
    return hasData;
  } catch (error) {
    recordTest('Admin Search', false, 
      error.response?.data?.message || error.message);
    return false;
  }
}

async function testAdminBulkOperations() {
  log.test('Testing admin bulk operations...');
  try {
    // First, create a test subscription for bulk operations
    await axios.post(`${BASE_URL}/newsletter/subscribe`, {
      email: 'bulk.test@example.com',
      firstName: 'Bulk',
      lastName: 'Test'
    });

    const response = await axios.post(`${BASE_URL}/newsletter/admin/bulk-operations`, {
      emails: ['bulk.test@example.com'],
      action: 'deactivate'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const success = response.status === 200 && response.data.success;
    recordTest('Admin Bulk Operations', success, 
      success ? `Bulk operation completed: ${response.data.data.modifiedCount} modified` : response.data.message);
    return success;
  } catch (error) {
    recordTest('Admin Bulk Operations', false, 
      error.response?.data?.message || error.message);
    return false;
  }
}

async function testAdminExport() {
  log.test('Testing admin export functionality...');
  try {
    const response = await axios.post(`${BASE_URL}/newsletter/admin/export`, {
      format: 'json',
      status: 'all'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const success = response.status === 200 && response.data.success;
    const hasData = success && response.data.data && Array.isArray(response.data.data.subscriptions);
    recordTest('Admin Export', hasData, 
      hasData ? `Exported ${response.data.data.subscriptions.length} subscriptions` : 'No export data');
    return hasData;
  } catch (error) {
    recordTest('Admin Export', false, 
      error.response?.data?.message || error.message);
    return false;
  }
}

async function testUnauthorizedAccess() {
  log.test('Testing unauthorized access protection...');
  try {
    await axios.get(`${BASE_URL}/newsletter/admin/statistics`);
    recordTest('Unauthorized Access Protection', false, 'Should have returned 401');
    return false;
  } catch (error) {
    const isUnauthorized = error.response?.status === 401;
    recordTest('Unauthorized Access Protection', isUnauthorized, 
      isUnauthorized ? 'Correctly blocked unauthorized access' : `Unexpected status: ${error.response?.status}`);
    return isUnauthorized;
  }
}

async function testInvalidToken() {
  log.test('Testing invalid token handling...');
  try {
    await axios.get(`${BASE_URL}/newsletter/admin/statistics`, {
      headers: { Authorization: 'Bearer invalid-token-123' }
    });
    recordTest('Invalid Token Handling', false, 'Should have returned 401');
    return false;
  } catch (error) {
    const isUnauthorized = error.response?.status === 401;
    recordTest('Invalid Token Handling', isUnauthorized, 
      isUnauthorized ? 'Correctly rejected invalid token' : `Unexpected status: ${error.response?.status}`);
    return isUnauthorized;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Newsletter Backend Functionality Test Suite'.rainbow);
  console.log('=' .repeat(60).gray);
  
  // Check if server is running
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    log.error('Server is not responding. Please ensure the backend server is running on port 3005.');
    process.exit(1);
  }
  
  console.log('\n📋 Running Newsletter API Tests...'.yellow);
  console.log('-'.repeat(40).gray);
  
  // Get admin token first
  const authSuccess = await getAdminToken();
  if (!authSuccess) {
    log.warning('Admin authentication failed. Some admin tests will be skipped.');
  }
  
  // Public API tests
  console.log('\n🔓 Public API Tests:'.yellow);
  await testNewsletterSubscribe();
  await testNewsletterStatus();
  await testNewsletterUnsubscribe();
  
  // Admin API tests (only if authenticated)
  if (authSuccess) {
    console.log('\n🔐 Admin API Tests:'.yellow);
    await testAdminStatistics();
    await testAdminSubscriptions();
    await testAdminSearch();
    await testAdminBulkOperations();
    await testAdminExport();
  }
  
  // Security tests
  console.log('\n🛡️  Security Tests:'.yellow);
  await testUnauthorizedAccess();
  await testInvalidToken();
  
  // Print summary
  console.log('\n' + '='.repeat(60).gray);
  console.log('📊 TEST SUMMARY'.rainbow);
  console.log('='.repeat(60).gray);
  console.log(`✅ Passed: ${results.passed}`.green);
  console.log(`❌ Failed: ${results.failed}`.red);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`.cyan);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:'.red);
    results.tests
      .filter(test => !test.passed)
      .forEach(test => console.log(`   • ${test.name}: ${test.details}`.red));
  }
  
  console.log('\n🎯 Backend Status:'.yellow);
  if (results.failed === 0) {
    console.log('🎉 All tests passed! Backend is working perfectly.'.green);
  } else if (results.passed > results.failed) {
    console.log('⚠️  Most tests passed. Backend is mostly functional.'.yellow);
  } else {
    console.log('💥 Many tests failed. Backend needs attention.'.red);
  }
  
  console.log('\n💡 Note: The 404 errors you experienced are due to port mismatch.'.blue);
  console.log('   Frontend should connect to http://localhost:3005/api instead of port 3000.'.blue);
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log.error(`Unhandled rejection: ${error.message}`);
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  log.error(`Test suite failed: ${error.message}`);
  process.exit(1);
});





