const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3005';
const ADMIN_TOKEN = process.argv[2] || 'your-admin-token-here';

console.log('📰 Testing News POST API with Dummy Data');
console.log('========================================');
console.log('Base URL:', BASE_URL);
console.log('Token:', ADMIN_TOKEN.substring(0, 20) + '...');

async function testNewsPostAPI() {
  try {
    // Test 1: Basic News Article
    console.log('\n📋 Test 1: Basic News Article');
    console.log('-------------------------------');
    
    const basicNewsData = {
      title: 'Welcome to NewtonBotics Robotics Club',
      content: 'We are excited to announce the launch of our robotics club! This is a comprehensive introduction to our mission, goals, and upcoming activities. Our club focuses on fostering innovation in robotics, AI, and automation technologies.',
      authorId: '68a30681af3f3b7d9e2653a3',
      isPublished: true,
      tags: ['announcement', 'robotics', 'club'],
      featuredImageUrl: 'https://via.placeholder.com/800x400/007bff/ffffff?text=NewtonBotics'
    };
    
    const basicResponse = await axios.post(`${BASE_URL}/api/news`, basicNewsData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', basicResponse.status);
    console.log('📦 Basic News Response:', JSON.stringify(basicResponse.data, null, 2));
    
    // Test 2: News with Category
    console.log('\n📋 Test 2: News with Category');
    console.log('-------------------------------');
    
    const categoryNewsData = {
      title: 'Advanced ROS2 Workshop Series Announced',
      content: 'Join us for an intensive workshop series on ROS2 (Robot Operating System 2). This comprehensive program will cover topics from basic concepts to advanced implementations including navigation, perception, and control systems. Perfect for students and professionals looking to enhance their robotics skills.',
      authorId: '68a30681af3f3b7d9e2653a3',
      categoryId: '68a5b781804d614ae3e4cd84', // Workshops category
      isPublished: false,
      tags: ['workshop', 'ros2', 'robotics', 'training'],
      featuredImageUrl: 'https://via.placeholder.com/800x400/28a745/ffffff?text=ROS2+Workshop'
    };
    
    const categoryResponse = await axios.post(`${BASE_URL}/api/news`, categoryNewsData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', categoryResponse.status);
    console.log('📦 Category News Response:', JSON.stringify(categoryResponse.data, null, 2));
    
    // Test 3: News with Application Form
    console.log('\n📋 Test 3: News with Application Form');
    console.log('--------------------------------------');
    
    const applicationNewsData = {
      title: 'Robotics Competition Team Recruitment',
      content: 'We are recruiting talented students for our robotics competition team! This is a unique opportunity to represent our university in national and international robotics competitions. The team will work on cutting-edge projects and develop practical robotics skills.',
      authorId: '68a30681af3f3b7d9e2653a3',
      categoryId: '68a5b781804d614ae3e4cd8d', // Competitions category
      isPublished: true,
      tags: ['competition', 'recruitment', 'team', 'robotics'],
      featuredImageUrl: 'https://via.placeholder.com/800x400/dc3545/ffffff?text=Competition+Team',
      application: {
        isEnabled: true,
        type: 'competition',
        requireLogin: true,
        deadline: '2025-09-15T23:59:59.000Z',
        maxApplicants: 50,
        formFields: [
          {
            name: 'experience',
            label: 'Robotics Experience Level',
            type: 'select',
            required: true,
            options: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
          },
          {
            name: 'motivation',
            label: 'Why do you want to join the team?',
            type: 'textarea',
            required: true,
            options: []
          },
          {
            name: 'availability',
            label: 'Weekly Availability (hours)',
            type: 'number',
            required: true,
            options: []
          },
          {
            name: 'skills',
            label: 'Technical Skills',
            type: 'text',
            required: false,
            options: []
          }
        ]
      }
    };
    
    const applicationResponse = await axios.post(`${BASE_URL}/api/news`, applicationNewsData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', applicationResponse.status);
    console.log('📦 Application News Response:', JSON.stringify(applicationResponse.data, null, 2));
    
    // Test 4: Featured News Article
    console.log('\n📋 Test 4: Featured News Article');
    console.log('----------------------------------');
    
    const featuredNewsData = {
      title: 'Breakthrough in Autonomous Navigation Research',
      content: 'Our research team has achieved a significant breakthrough in autonomous navigation algorithms. The new SLAM (Simultaneous Localization and Mapping) technique shows 40% improvement in accuracy and 60% reduction in computational requirements. This research has been accepted for publication in the prestigious IEEE Robotics and Automation Letters journal.',
      authorId: '68a30681af3f3b7d9e2653a3',
      categoryId: '68a32449ab4082effd1caa73', // Research category
      isPublished: true,
      isFeatured: true,
      tags: ['research', 'autonomous', 'slam', 'publication', 'breakthrough'],
      featuredImageUrl: 'https://via.placeholder.com/800x400/6f42c1/ffffff?text=Research+Breakthrough',
      featureOptions: {
        showInNav: true,
        navOrder: 1,
        navLabel: 'Research'
      }
    };
    
    const featuredResponse = await axios.post(`${BASE_URL}/api/news`, featuredNewsData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', featuredResponse.status);
    console.log('📦 Featured News Response:', JSON.stringify(featuredResponse.data, null, 2));
    
    // Test 5: Event Announcement
    console.log('\n📋 Test 5: Event Announcement');
    console.log('------------------------------');
    
    const eventNewsData = {
      title: 'Annual Robotics Showcase 2025',
      content: 'Join us for our annual robotics showcase where students will demonstrate their innovative projects! This year\'s event will feature autonomous robots, computer vision systems, and AI-powered applications. The showcase is open to all students, faculty, and industry professionals. Don\'t miss this opportunity to see cutting-edge robotics technology in action!',
      authorId: '68a30681af3f3b7d9e2653a3',
      categoryId: '68a5b781804d614ae3e4cd89', // Events category
      isPublished: true,
      tags: ['event', 'showcase', 'annual', 'demonstration'],
      featuredImageUrl: 'https://via.placeholder.com/800x400/ffc107/000000?text=Robotics+Showcase',
      application: {
        isEnabled: true,
        type: 'event',
        requireLogin: false,
        deadline: '2025-10-01T23:59:59.000Z',
        maxApplicants: 200,
        formFields: [
          {
            name: 'attendance',
            label: 'Will you attend the showcase?',
            type: 'radio',
            required: true,
            options: ['Yes', 'No', 'Maybe']
          },
          {
            name: 'dietary',
            label: 'Dietary Restrictions',
            type: 'text',
            required: false,
            options: []
          },
          {
            name: 'interests',
            label: 'Areas of Interest',
            type: 'checkbox',
            required: false,
            options: ['Autonomous Robots', 'Computer Vision', 'AI Applications', 'Control Systems']
          }
        ]
      }
    };
    
    const eventResponse = await axios.post(`${BASE_URL}/api/news`, eventNewsData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status:', eventResponse.status);
    console.log('📦 Event News Response:', JSON.stringify(eventResponse.data, null, 2));
    
    // Test 6: Validation Error Test
    console.log('\n📋 Test 6: Validation Error Test (Expected to Fail)');
    console.log('---------------------------------------------------');
    
    const invalidNewsData = {
      title: 'Short', // Too short
      content: 'Too short', // Too short
      // Missing authorId
      tags: 'not-an-array' // Should be array
    };
    
    try {
      const invalidResponse = await axios.post(`${BASE_URL}/api/news`, invalidNewsData, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Unexpected success:', invalidResponse.status);
    } catch (error) {
      console.log('✅ Expected validation error:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data?.error?.message);
    }
    
    console.log('\n🎉 All News POST API Tests Completed!');
    
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
    } else if (error.response?.status === 400) {
      console.log('\n💡 400 Bad Request - This means:');
      console.log('   - Validation error in request data');
      console.log('   - Missing required fields');
    }
  }
}

// Run the test
testNewsPostAPI();

