require('dotenv').config();
const mongoose = require('mongoose');
const { Room } = require('../models');

async function seedRooms() {
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

    // Check if rooms already exist
    const roomCount = await Room.countDocuments();
    
    if (roomCount > 0) {
      console.log(`${roomCount} rooms already exist in the database. Skipping seeding.`);
      await mongoose.connection.close();
      return;
    }

    console.log('🏠 Starting room seeding process...');
    
    // Create rooms based on specifications
    const roomsToCreate = [];
    
    // 1-in-a-room (A001-010)
    console.log('Creating 1-in-a-room units (A001-A010)...');
    for (let i = 1; i <= 10; i++) {
      const roomNumber = `A${String(i).padStart(3, '0')}`;
      roomsToCreate.push({
        roomNumber,
        capacity: 1,
        roomType: '1-in-a-room',
        isAvailable: true
      });
    }
    
    // 2-in-a-room (A011-050)
    console.log('Creating 2-in-a-room units (A011-A050)...');
    for (let i = 11; i <= 50; i++) {
      const roomNumber = `A${String(i).padStart(3, '0')}`;
      roomsToCreate.push({
        roomNumber,
        capacity: 2,
        roomType: '2-in-a-room',
        isAvailable: true
      });
    }
    
    // 3-in-a-room (A051-150)
    console.log('Creating 3-in-a-room units (A051-A150)...');
    for (let i = 51; i <= 150; i++) {
      const roomNumber = `A${String(i).padStart(3, '0')}`;
      roomsToCreate.push({
        roomNumber,
        capacity: 3,
        roomType: '3-in-a-room',
        isAvailable: true
      });
    }
    
    // 4-in-a-room (A151-300)
    console.log('Creating 4-in-a-room units (A151-A300)...');
    for (let i = 151; i <= 300; i++) {
      const roomNumber = `A${String(i).padStart(3, '0')}`;
      roomsToCreate.push({
        roomNumber,
        capacity: 4,
        roomType: '4-in-a-room',
        isAvailable: true
      });
    }
    
    console.log(`📊 Total rooms to create: ${roomsToCreate.length}`);
    console.log('💾 Inserting rooms into database...');
    
    // Bulk create all rooms using insertMany (MongoDB equivalent of bulkCreate)
    await Room.insertMany(roomsToCreate);
    
    // Get final count and breakdown
    const finalCount = await Room.countDocuments();
    const roomBreakdown = await Room.aggregate([
      {
        $group: {
          _id: "$roomType",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    console.log(`✅ Successfully seeded ${finalCount} rooms!`);
    console.log('\n📋 Room Breakdown:');
    roomBreakdown.forEach(item => {
      console.log(`   ${item._id}: ${item.count} rooms`);
    });
    
    console.log('\n🎉 Room seeding completed successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding rooms:', error);
    
    // Close connection on error
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error('❌ Error closing connection:', closeError.message);
    }
    
    process.exit(1);
  }
}

const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
  }
};

module.exports = { seedRooms, closeConnection };

// Run the seeding function if called directly
if (require.main === module) {
  seedRooms();
}