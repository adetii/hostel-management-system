require('dotenv').config();
const { createClient } = require('redis');

async function testRedisCloudConnection() {
  const client = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    }
  });

  client.on('error', err => console.log('Redis Client Error', err));

  try {
    await client.connect();
    console.log('✅ Connected to Redis Cloud');
    
    // Test basic operations
    await client.set('test-key', 'test-value');
    const result = await client.get('test-key');
    console.log('✅ Test result:', result);
    
    // Clean up
    await client.del('test-key');
    await client.disconnect();
    
    console.log('🎉 Redis Cloud connection successful!');
  } catch (error) {
    console.error('❌ Redis Cloud test failed:', error);
  }
}

testRedisCloudConnection();