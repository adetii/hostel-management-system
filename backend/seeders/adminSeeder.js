require('dotenv').config();
const mongoose = require('mongoose');
const { Admin } = require('../models');

const createDefaultAdmins = async () => {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({
      role: 'super_admin'
    });

    if (existingSuperAdmin) {
      console.log('Super admin already exists:', existingSuperAdmin.email);
    } else {
      // Create default super admin
      const superAdmin = await Admin.create({
        email: 'superadmin@hostel.com',
        password: 'SuperAdmin123!',
        fullName: 'Super Administrator',
        phoneNumber: '+233243655362',
        gender: 'male',
        dateOfBirth: new Date('1990-01-01'),
        role: 'super_admin',
        isActive: true
      });
      
      console.log('✅ Super admin created successfully!');
      console.log('📧 Email:', superAdmin.email);
      console.log('🔑 Password: SuperAdmin123!');
    }

    // Check if regular admin exists
    const existingAdmin = await Admin.findOne({
      role: 'admin'
    });

    if (existingAdmin) {
      console.log('Regular admin already exists:', existingAdmin.email);
    } else {
      // Create default admin
      const admin = await Admin.create({
        email: 'admin@hostel.com',
        password: 'Admin123!',
        fullName: 'System Administrator',
        phoneNumber: '+233243655363',
        gender: 'male',
        dateOfBirth: new Date('1992-01-01'),
        role: 'admin',
        isActive: true
      });
      
      console.log('✅ Regular admin created successfully!');
      console.log('📧 Email:', admin.email);
      console.log('🔑 Password: Admin123!');
    }
    
    console.log('⚠️  Please change the passwords after first login!');

  } catch (error) {
    console.error('❌ Error creating admins:', error.message);
    throw error;
  }
};

const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
  }
};

module.exports = { createDefaultAdmins };

// Run seeder if called directly
if (require.main === module) {
  const runSeeder = async () => {
    try {
      // Get MongoDB connection string from environment variables
      const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/your-database-name';
      
      // Connect to MongoDB
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      console.log('📡 MongoDB connection established.');
      console.log(`🔗 Connected to: ${mongoose.connection.name}`);
      
      await createDefaultAdmins();
      
      console.log('🎉 Admin seeding completed successfully!');
      
      await closeConnection();
      process.exit(0);
    } catch (error) {
      console.error('💥 Admin seeding failed:', error);
      await closeConnection();
      process.exit(1);
    }
  };
  
  runSeeder();
}