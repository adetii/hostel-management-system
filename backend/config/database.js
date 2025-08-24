const mongoose = require('mongoose');

// Test database connection
const testConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      
    });
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

module.exports = mongoose;
module.exports.testConnection = testConnection;