require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function checkUser() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/newtonbotics';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Check if admin user exists
    const userId = '68a30681af3f3b7d9e2653a3';
    const user = await User.findById(userId).select('-passwordHash');
    
    if (user) {
      console.log('✅ User found:');
      console.log('ID:', user._id);
      console.log('Email:', user.email);
      console.log('Name:', user.firstName, user.lastName);
      console.log('Role:', user.role);
      console.log('Active:', user.isActive);
      console.log('Email Verified:', user.emailVerified);
    } else {
      console.log('❌ User not found with ID:', userId);
      
      // Check if user exists by email
      const userByEmail = await User.findOne({ email: 'monu2feb2004@gmail.com' });
      if (userByEmail) {
        console.log('✅ User found by email:');
        console.log('ID:', userByEmail._id);
        console.log('Email:', userByEmail.email);
        console.log('Name:', userByEmail.firstName, userByEmail.lastName);
        console.log('Role:', userByEmail.role);
        console.log('Active:', userByEmail.isActive);
      } else {
        console.log('❌ No user found with email: monu2feb2004@gmail.com');
      }
    }

    // List all users
    console.log('\n📋 All users in database:');
    const allUsers = await User.find().select('email firstName lastName role isActive');
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.firstName} ${user.lastName}) - ${user.role} - Active: ${user.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkUser();

