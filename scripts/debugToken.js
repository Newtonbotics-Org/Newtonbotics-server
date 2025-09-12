const jwt = require('jsonwebtoken');
require('dotenv').config();

// Replace this with your actual token
const token = process.argv[2] || 'eyJhbGciOiJIUzI1NiIs...'; // Your token here

console.log('🔍 JWT Token Debug Script');
console.log('========================');

if (!token || token === 'eyJhbGciOiJIUzI1NiIs...') {
  console.log('❌ Please provide a valid token as an argument');
  console.log('Usage: node scripts/debugToken.js <your-jwt-token>');
  process.exit(1);
}

console.log('📋 Token:', token.substring(0, 20) + '...');
console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');

try {
  // Decode token without verification first
  const decodedWithoutVerification = jwt.decode(token);
  console.log('\n📖 Token Payload (without verification):');
  console.log(JSON.stringify(decodedWithoutVerification, null, 2));
  
  if (decodedWithoutVerification) {
    const exp = new Date(decodedWithoutVerification.exp * 1000);
    const now = new Date();
    console.log('\n⏰ Token Expiration:', exp.toISOString());
    console.log('🕐 Current Time:', now.toISOString());
    console.log('⏳ Token Expired:', exp < now ? '❌ Yes' : '✅ No');
    console.log('👤 User ID:', decodedWithoutVerification.sub);
  }
  
  // Now verify the token
  console.log('\n🔐 Verifying token...');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('✅ Token is valid!');
  console.log('📋 Verified Payload:', JSON.stringify(decoded, null, 2));
  
} catch (error) {
  console.log('❌ Token verification failed:');
  console.log('Error name:', error.name);
  console.log('Error message:', error.message);
  
  if (error.name === 'JsonWebTokenError') {
    console.log('💡 This usually means the token is malformed or the JWT_SECRET is wrong');
  } else if (error.name === 'TokenExpiredError') {
    console.log('💡 The token has expired. You need to login again');
  } else {
    console.log('💡 Unknown error occurred');
  }
}

console.log('\n�� Debug complete');

