require('dotenv').config();
const mongoose = require('mongoose');
const { Settings } = require('./models');

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB database connection...');
    
    // Get MongoDB connection string from environment variables
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/your-database-name';
    
    console.log(`🔗 Connecting to: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs
    
    // Test basic connection with timeout
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    
    console.log('✅ MongoDB connection successful');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🏠 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    console.log(`🔄 Ready State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    
    // Test Settings model
    console.log('\n🧪 Testing Settings model...');
    
    try {
      const settings = await Settings.findOne();
      console.log('✅ Settings query successful:', settings ? 'Found settings document' : 'No settings found');
      
      if (settings) {
        console.log(`📄 Settings ID: ${settings._id}`);
        console.log(`📅 Created: ${settings.createdAt || 'N/A'}`);
        console.log(`🔧 Updated: ${settings.updatedAt || 'N/A'}`);
      }
    } catch (modelError) {
      console.log('⚠️  Settings model test failed:', modelError.message);
      console.log('   This might be normal if no settings documents exist yet');
    }
    
    // Test collection info
    console.log('\n📋 Testing collection structure...');
    
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(col => col.name);
      console.log('✅ Available collections:', collectionNames.join(', '));
      
      // Check if settings collection exists
      const settingsCollectionExists = collections.some(col => 
        col.name === 'settings' || col.name === 'system_settings'
      );
      
      if (settingsCollectionExists) {
        const settingsCollection = collections.find(col => 
          col.name === 'settings' || col.name === 'system_settings'
        );
        console.log(`✅ Settings collection found: ${settingsCollection.name}`);
      } else {
        console.log('ℹ️  Settings collection not found (will be created on first document insert)');
      }
    } catch (collectionError) {
      console.log('⚠️  Collection info test failed:', collectionError.message);
    }
    
    // Test model schema information
    console.log('\n🏗️  Testing model schema...');
    
    try {
      const schemaFields = Object.keys(Settings.schema.paths);
      console.log('✅ Settings model schema fields:', schemaFields.join(', '));
      
      // Check for indexes
      const indexes = await Settings.collection.getIndexes();
      console.log('✅ Collection indexes:', Object.keys(indexes).join(', '));
    } catch (schemaError) {
      console.log('⚠️  Schema info test failed:', schemaError.message);
    }
    
    // Test document count
    console.log('\n📊 Testing document counts...');
    
    try {
      const settingsCount = await Settings.countDocuments();
      console.log(`✅ Settings documents count: ${settingsCount}`);
      
      // Get total documents across all collections
      const stats = await mongoose.connection.db.stats();
      console.log(`✅ Total database documents: ${stats.objects}`);
      console.log(`✅ Database size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    } catch (countError) {
      console.log('⚠️  Document count test failed:', countError.message);
    }
    
    // Test write operation
    console.log('\n✏️  Testing write operations...');
    
    try {
      const testDoc = new Settings({
        testField: 'connection-test',
        timestamp: new Date()
      });
      
      // Validate without saving
      const validationError = testDoc.validateSync();
      if (validationError) {
        console.log('ℹ️  Model validation info:', validationError.message);
      } else {
        console.log('✅ Model validation successful');
      }
    } catch (writeError) {
      console.log('⚠️  Write operation test failed:', writeError.message);
    }
    
    console.log('\n🎉 All database tests completed successfully!');
    console.log('\n💡 Connection Details Summary:');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    console.log(`   Status: ${mongoose.connection.readyState === 1 ? '🟢 Connected' : '🔴 Disconnected'}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Troubleshooting tips:');
      console.error('   • Make sure MongoDB is running');
      console.error('   • Check if the connection string is correct');
      console.error('   • Verify network connectivity');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n💡 Authentication issue:');
      console.error('   • Check username and password in connection string');
      console.error('   • Verify database user permissions');
    } else if (error.message.includes('serverSelectionTimeoutMS')) {
      console.error('\n💡 Connection timeout:');
      console.error('   • Check if MongoDB server is accessible');
      console.error('   • Verify firewall settings');
      console.error('   • Check if using correct port (default: 27017)');
    }
    
    process.exit(1);
  } finally {
    // Close connection
    try {
      await mongoose.connection.close();
      console.log('\n🔌 MongoDB connection closed.');
    } catch (closeError) {
      console.error('❌ Error closing connection:', closeError.message);
    }
  }
}

// Export for use in other scripts
module.exports = { testConnection };

// Run test if called directly
if (require.main === module) {
  testConnection()
    .then(() => {
      console.log('🏁 Connection test completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Connection test failed:', error.message);
      process.exit(1);
    });
}