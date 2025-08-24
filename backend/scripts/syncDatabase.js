require('dotenv').config();
const mongoose = require('mongoose');
const { Admin, 
  User, 
  Room, 
  Booking, 
  Settings, 
  PasswordResetToken, 
  RoomAssignment, 
  PublicContent } = require('../models');

const syncDatabase = async () => {
  try {
    console.log('🔄 Starting MongoDB database synchronization...');
    
    // Get MongoDB connection string from environment variables
    const mongoUri = process.env.MONGODB_URI;
    
    // Test database connection
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('📡 MongoDB connection established.');
    console.log(`🔗 Connected to: ${mongoose.connection.name}`);
    
    // Get all model names from the connection
    const modelNames = Object.keys(mongoose.models);
    
    if (modelNames.length === 0) {
      console.log('⚠️  No models found. Make sure your models are properly imported.');
    } else {
      console.log('📋 Available models:', modelNames.join(', '));
    }
    
    // Create indexes for all models (equivalent to Sequelize sync)
    console.log('🔧 Creating indexes for all models...');
    
    const indexPromises = modelNames.map(async (modelName) => {
      try {
        const model = mongoose.models[modelName];
        await model.createIndexes();
        console.log(`✅ Indexes created for ${modelName}`);
        return { model: modelName, status: 'success' };
      } catch (error) {
        console.log(`⚠️  Index creation failed for ${modelName}:`, error.message);
        return { model: modelName, status: 'failed', error: error.message };
      }
    });
    
    const indexResults = await Promise.allSettled(indexPromises);
    const successful = indexResults.filter(result => 
      result.status === 'fulfilled' && result.value.status === 'success'
    ).length;
    
    console.log(`📊 Index creation completed: ${successful}/${modelNames.length} models processed successfully`);
    
    // Optionally, you can also create collections explicitly (though Mongoose does this automatically)
    console.log('📚 Ensuring collections exist...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Existing collections:', collections.map(col => col.name).join(', '));
    
    console.log('✅ MongoDB database synchronized successfully!');
    
  } catch (error) {
    console.error('❌ MongoDB synchronization failed:', error.message);
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

module.exports = { syncDatabase, closeConnection };

// Run sync if called directly
if (require.main === module) {
  const runSync = async () => {
    try {
      await syncDatabase();
      console.log('🎉 MongoDB sync completed successfully!');
      await closeConnection();
      process.exit(0);
    } catch (error) {
      console.error('💥 MongoDB sync failed:', error);
      await closeConnection();
      process.exit(1);
    }
  };
  
  runSync();
}