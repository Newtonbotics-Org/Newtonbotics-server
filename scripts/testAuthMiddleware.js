require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGEzMDY4MWFmM2YzYjdkOWUyNjUzYTMiLCJlbWFpbCI6Im1vbnUyZmViMjAwNEBnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJyZWFkOnByb2plY3RzIiwid3JpdGU6cHJvamVjdHMiLCJkZWxldGU6cHJvamVjdHMiLCJyZWFkOndvcmtzaG9wcyIsIndyaXRlOndvcmtzaG9wcyIsImRlbGV0ZTp3b3Jrc2hvcHMiLCJyZWFkOmV2ZW50cyIsIndyaXRlOmV2ZW50cyIsImRlbGV0ZTpldmVudHMiLCJyZWFkOmludmVudG9yeSIsIndyaXRlOmludmVudG9yeSIsImRlbGV0ZTppbnZlbnRvcnkiLCJyZWFkOnJlcXVlc3RzIiwid3JpdGU6cmVxdWVzdHMiLCJhcHByb3ZlOnJlcXVlc3RzIiwicmVhZDpuZXdzIiwid3JpdGU6bmV3cyIsImRlbGV0ZTpuZXdzIiwicmVhZDptZWRpYSIsIndyaXRlOm1lZGlhIiwiZGVsZXRlOm1lZGlhIiwicmVhZDp1c2VycyIsIndyaXRlOnVzZXJzIiwiZGVsZXRlOnVzZXJzIiwibWFuYWdlOnN5c3RlbSIsInN5c3RlbTphZG1pbiJdLCJpYXQiOjE3NTY1NTMyMjAsImV4cCI6MTc1NjYzOTYyMH0.4aVThGrw0hAsUD4OhmgwbsAFVrj2ybX1OlbGr94vwVw';

async function testAuthMiddleware() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/newtonbotics';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    console.log('🔍 Testing Authentication Middleware');
    console.log('==================================');

    // Step 1: Verify JWT token
    console.log('\n📋 Step 1: Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ JWT token is valid');
    console.log('User ID:', decoded.sub);
    console.log('Email:', decoded.email);
    console.log('Role:', decoded.role);

    // Step 2: Check if user exists in database
    console.log('\n📋 Step 2: Checking if user exists in database...');
    const user = await User.findById(decoded.sub).select('-passwordHash');
    
    if (user) {
      console.log('✅ User found in database');
      console.log('ID:', user._id);
      console.log('Email:', user.email);
      console.log('Name:', user.firstName, user.lastName);
      console.log('Role:', user.role);
      console.log('Active:', user.isActive);
      console.log('Email Verified:', user.emailVerified);
    } else {
      console.log('❌ User not found in database');
      console.log('Looking for user with ID:', decoded.sub);
      
      // Check if user exists by email
      const userByEmail = await User.findOne({ email: decoded.email });
      if (userByEmail) {
        console.log('✅ User found by email but ID mismatch:');
        console.log('Token User ID:', decoded.sub);
        console.log('Database User ID:', userByEmail._id);
        console.log('This might be the issue!');
      } else {
        console.log('❌ No user found with email:', decoded.email);
      }
    }

    // Step 3: Check if user is active
    if (user && !user.isActive) {
      console.log('\n❌ User is not active');
    } else if (user) {
      console.log('\n✅ User is active');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testAuthMiddleware();

