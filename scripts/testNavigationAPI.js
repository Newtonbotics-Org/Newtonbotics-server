const axios = require('axios');

const BASE_URL = 'http://localhost:3005';

async function testNavigationAPI() {
  try {
    console.log('🧪 Testing Navigation API...\n');
    
    const response = await axios.get(`${BASE_URL}/api/events/navigation`);
    
    console.log('✅ Navigation API Response:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Total Items:', response.data.data.total);
    console.log('Events Count:', response.data.data.eventsCount);
    console.log('News Count:', response.data.data.newsCount);
    
    console.log('\n📋 Navigation Items:');
    response.data.data.items.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.type.toUpperCase()}: ${item.title}`);
      console.log(`   ID: ${item.id}`);
      console.log(`   Category: ${item.category || 'N/A'}`);
      console.log(`   Nav Label: ${item.featureOptions?.navLabel || 'N/A'}`);
      console.log(`   Nav Order: ${item.featureOptions?.navOrder || 0}`);
      
      if (item.type === 'event') {
        console.log(`   Requires Registration: ${item.requiresRegistration}`);
        console.log(`   Registration Form Link: ${item.registrationFormLink || 'N/A'}`);
        console.log(`   Registrations Count: ${item.registrations?.length || 0}`);
      } else if (item.type === 'news') {
        console.log(`   Application Enabled: ${item.application?.isEnabled || false}`);
        console.log(`   Application Type: ${item.application?.type || 'N/A'}`);
        console.log(`   Application Status: ${item.application?.status || 'N/A'}`);
      }
    });
    
    console.log('\n🎉 Navigation API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Navigation API test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testNavigationAPI();



