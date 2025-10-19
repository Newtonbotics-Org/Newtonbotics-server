// Script to seed default subroles
const mongoose = require('mongoose');
const Subrole = require('../src/models/Subrole');
const User = require('../src/models/User');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://robotics:PasswordRoboticsLab@newtonroboticslab.u5sgpmb.mongodb.net/?retryWrites=true&w=majority&appName=NewtonRoboticsLab');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function seedSubroles() {
  console.log('🌱 Seeding default subroles...\n');

  try {
    // Find an admin user to use as creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }

    console.log(`👤 Using admin user: ${adminUser.firstName} ${adminUser.lastName}`);

    // Seed default subroles
    const seededCount = await Subrole.seedDefaultSubroles(adminUser._id);
    
    if (seededCount > 0) {
      console.log(`✅ Successfully seeded ${seededCount} default subroles`);
    } else {
      console.log('ℹ️  All default subroles already exist');
    }

    // Show summary by category
    const subroles = await Subrole.find({ isActive: true }).sort({ category: 1, displayName: 1 });
    const categories = {};
    
    subroles.forEach(subrole => {
      if (!categories[subrole.category]) {
        categories[subrole.category] = [];
      }
      categories[subrole.category].push(subrole.displayName);
    });

    console.log('\n📋 Subroles by category:');
    Object.entries(categories).forEach(([category, subroleList]) => {
      const categoryDisplayName = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      console.log(`  ${categoryDisplayName}: ${subroleList.length} subroles`);
    });

    console.log(`\n📊 Total active subroles: ${subroles.length}`);

  } catch (error) {
    console.error('❌ Error seeding subroles:', error.message);
  }
}

async function runSeed() {
  await connectDB();
  await seedSubroles();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
}

// Run the seed
if (require.main === module) {
  runSeed().catch(console.error);
}

module.exports = { seedSubroles };
