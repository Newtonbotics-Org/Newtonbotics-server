#!/usr/bin/env node

/**
 * Test script for team member API endpoint
 * Usage: node test-team-member-api.js [team-member-id]
 */

const http = require('http');

const TEAM_MEMBER_ID = process.argv[2] || '68f7475bc0e4bc43c9f52c15';
const BASE_URL = process.env.API_URL || 'http://localhost:3001';

console.log(`Testing team member API endpoint...\n`);
console.log(`Team Member ID: ${TEAM_MEMBER_ID}`);
console.log(`Base URL: ${BASE_URL}\n`);

const url = `${BASE_URL}/api/public/team-members/${TEAM_MEMBER_ID}`;

const options = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}\n`);

    try {
      const json = JSON.parse(data);
      console.log('Response:');
      console.log(JSON.stringify(json, null, 2));

      if (res.statusCode === 200 && json.success) {
        console.log('\n✅ SUCCESS: Team member found!');
        if (json.data && json.data.item) {
          console.log(`   Name: ${json.data.item.firstName} ${json.data.item.lastName}`);
          console.log(`   Role: ${json.data.item.role}`);
          console.log(`   Department: ${json.data.item.department || 'N/A'}`);
        }
      } else if (res.statusCode === 404) {
        console.log('\n❌ ERROR: Team member not found');
      } else if (res.statusCode === 400) {
        console.log('\n❌ ERROR: Invalid ID format');
      } else {
        console.log('\n❌ ERROR: Unexpected response');
      }
    } catch (error) {
      console.log('Raw Response:');
      console.log(data);
      console.log('\n❌ ERROR: Failed to parse JSON response');
    }
  });
});

req.on('error', (error) => {
  console.error(`\n❌ ERROR: Request failed`);
  console.error(`   ${error.message}`);
  console.error(`\n   Make sure the server is running at ${BASE_URL}`);
});

req.end();

