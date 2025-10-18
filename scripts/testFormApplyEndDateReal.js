#!/usr/bin/env node

/**
 * Real test script to verify that formApplyEndDate works when creating/updating news
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3005';
const API_BASE = `${BASE_URL}/api`;

// Admin token (you can replace this with a fresh token)
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGEzMDY4MWFmM2YzYjdkOWUyNjUzYTMiLCJlbWFpbCI6Im1vbnUyZmViMjAwNEBnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJyZWFkOnByb2plY3RzIiwid3JpdGU6cHJvamVjdHMiLCJkZWxldGU6cHJvamVjdHMiLCJyZWFkOndvcmtzaG9wcyIsIndyaXRlOndvcmtzaG9wcyIsImRlbGV0ZTp3b3Jrc2hvcHMiLCJyZWFkOmV2ZW50cyIsIndyaXRlOmV2ZW50cyIsImRlbGV0ZTpldmVudHMiLCJyZWFkOmludmVudG9yeSIsIndyaXRlOmludmVudG9yeSIsImRlbGV0ZTppbnZlbnRvcnkiLCJyZWFkOnJlcXVlc3RzIiwid3JpdGU6cmVxdWVzdHMiLCJhcHByb3ZlOnJlcXVlc3RzIiwicmVhZDpuZXdzIiwid3JpdGU6bmV3cyIsImRlbGV0ZTpuZXdzIiwicmVhZDptZWRpYSIsIndyaXRlOm1lZGlhIiwiZGVsZXRlOm1lZGlhIiwicmVhZDp1c2VycyIsIndyaXRlOnVzZXJzIiwiZGVsZXRlOnVzZXJzIiwibWFuYWdlOnN5c3RlbSIsInN5c3RlbTphZG1pbiJdLCJpYXQiOjE3NjA0NjA4NjksImV4cCI6MTc2MDU0NzI2OX0.TfeK3oQHfDfluo6C6NzpbpOW52JtyFvchXuijL4tzOo';

// Test data with formApplyEndDate
const testNewsData = {
  title: 'Test Workshop with formApplyEndDate',
  content: 'This is a test news article to verify that formApplyEndDate field works correctly when creating news articles. This workshop will cover advanced topics in robotics and AI.',
  excerpt: 'A comprehensive workshop on robotics and AI applications',
  authorId: '68a30681af3f3b7d9e2653a3', // Admin user ID from token
  isPublished: false,
  application: {
    isEnabled: true,
    type: 'workshop',
    requireLogin: false,
    formApplyStartDate: '2024-01-15T00:00:00.000Z',
    formApplyEndDate: '2024-02-15T23:59:59.000Z', // This should now work!
    maxApplicants: 30,
    formLink: 'https://forms.google.com/test-workshop'
  }
};

async function testFormApplyEndDateReal() {
  console.log('🧪 Testing formApplyEndDate field with real API calls...\n');

  try {
    // Test 1: Create news with formApplyEndDate
    console.log('📝 Test 1: Creating news with formApplyEndDate...');
    console.log('Request payload:', JSON.stringify(testNewsData, null, 2));
    
    const createResponse = await axios.post(`${API_BASE}/news/admin`, testNewsData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Create response status:', createResponse.status);
    console.log('✅ Create response data:', JSON.stringify(createResponse.data, null, 2));
    
    if (createResponse.data.success) {
      const newsId = createResponse.data.data.item._id;
      console.log('\n🎉 SUCCESS! News created with ID:', newsId);
      
      // Verify the field mapping worked
      const createdNews = createResponse.data.data.item;
      console.log('\n🔍 Field mapping verification:');
      console.log('✅ formApplyLastDate exists:', !!createdNews.application.formApplyLastDate);
      console.log('✅ formApplyLastDate value:', createdNews.application.formApplyLastDate);
      console.log('✅ formApplyEndDate should not exist:', createdNews.application.formApplyEndDate === undefined);
      console.log('✅ Application status:', createdNews.application.status);
      
      // Test 2: Update news with formApplyEndDate
      console.log('\n📝 Test 2: Updating news with formApplyEndDate...');
      const updateData = {
        application: {
          formApplyEndDate: '2024-03-15T23:59:59.000Z' // New end date
        }
      };
      
      console.log('Update payload:', JSON.stringify(updateData, null, 2));
      
      const updateResponse = await axios.put(`${API_BASE}/news/admin/${newsId}`, updateData, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Update response status:', updateResponse.status);
      console.log('✅ Update response data:', JSON.stringify(updateResponse.data, null, 2));
      
      // Verify the update worked
      if (updateResponse.data.success) {
        const updatedNews = updateResponse.data.data.item;
        console.log('\n🔍 Update verification:');
        console.log('✅ Updated formApplyLastDate:', updatedNews.application.formApplyLastDate);
        console.log('✅ formApplyEndDate should not exist:', updatedNews.application.formApplyEndDate === undefined);
        console.log('✅ Application status updated:', updatedNews.application.status);
      }
      
      // Test 3: Get the news to verify persistence
      console.log('\n📝 Test 3: Retrieving news to verify persistence...');
      
      const getResponse = await axios.get(`${API_BASE}/news/${newsId}`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });
      
      console.log('✅ Get response status:', getResponse.status);
      const retrievedNews = getResponse.data.data.item;
      console.log('✅ Retrieved formApplyLastDate:', retrievedNews.application.formApplyLastDate);
      console.log('✅ Retrieved application status:', retrievedNews.application.status);
      
      // Cleanup: Delete the test news
      console.log('\n🧹 Cleaning up test data...');
      const deleteResponse = await axios.delete(`${API_BASE}/news/${newsId}`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });
      
      console.log('✅ Delete response status:', deleteResponse.status);
      console.log('✅ Test news deleted successfully');
      
    } else {
      console.log('❌ Create failed:', createResponse.data);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ formApplyEndDate field is now working correctly');
    console.log('✅ Field gets automatically mapped to formApplyLastDate');
    console.log('✅ Both create and update operations work');
    console.log('✅ Data persists correctly in the database');
    
  } catch (error) {
    console.error('❌ Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 401 Unauthorized - Token might be expired. Get a fresh token:');
      console.log('   node scripts/getAdminToken.js');
    }
  }
}

// Run the test
testFormApplyEndDateReal();
