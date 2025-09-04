require('dotenv').config();
const { initRedis, getRedis } = require('../config/redisClient');
const cacheService = require('../utils/cacheService');

async function clearUserCaches() {
  let redis = null;
  
  try {
    console.log('🔄 Initializing Redis connection...');
    
    // Initialize Redis connection first
    await initRedis();
    redis = getRedis();
    console.log('✅ Redis connection established');

    console.log('🔄 Clearing user-related caches...');
    
    // Clear all user-related caches
    await cacheService.invalidateUserCaches();
    
    // Also clear any session data for students (optional but thorough)
    if (redis) {
      const sessionKeys = await redis.keys('sess:*');
      const userSessionKeys = await redis.keys('user:sessions:*');
      
      if (sessionKeys.length > 0) {
        await redis.del(...sessionKeys);
        console.log(`🗑️ Cleared ${sessionKeys.length} session keys`);
      }
      
      if (userSessionKeys.length > 0) {
        await redis.del(...userSessionKeys);
        console.log(`🗑️ Cleared ${userSessionKeys.length} user session tracking keys`);
      }
    }
    
    console.log('✅ Cache clearing completed successfully');
    console.log('📝 Effects:');
    console.log('  - Student sessions will be invalidated (logout on next request)');
    console.log('  - Admin dashboard will show updated student counts');
    console.log('  - User profile caches refreshed');
    
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
    process.exit(1);
  } finally {
    // Always close Redis connection
    try {
      if (redis) {
        // Try different methods to close the Redis connection
        if (typeof redis.quit === 'function') {
          await redis.quit();
          console.log('🔌 Redis connection closed with quit()');
        } else if (typeof redis.disconnect === 'function') {
          await redis.disconnect();
          console.log('🔌 Redis connection closed with disconnect()');
        } else if (typeof redis.close === 'function') {
          await redis.close();
          console.log('🔌 Redis connection closed with close()');
        } else {
          console.log('ℹ️ No explicit close method found, connection may close automatically');
        }
      }
    } catch (closeError) {
      console.error('Error closing Redis:', closeError);
    }
    process.exit(0);
  }
}

// Alternative: Clear specific cache patterns manually
async function clearSpecificCaches() {
  let redis = null;
  
  try {
    await initRedis();
    redis = getRedis();
    
    // Clear user-related cache patterns
    const patterns = [
      'user:*',
      'users:*', 
      'auth:*',
      'session:*',
      'profile:*'
    ];
    
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`🗑️  Cleared ${keys.length} keys matching pattern: ${pattern}`);
      } else {
        console.log(`ℹ️  No keys found for pattern: ${pattern}`);
      }
    }
    
    console.log('✅ Specific cache patterns cleared!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (redis) {
      try {
        if (typeof redis.quit === 'function') {
          await redis.quit();
        } else if (typeof redis.disconnect === 'function') {
          await redis.disconnect();
        } else if (typeof redis.close === 'function') {
          await redis.close();
        }
      } catch (closeError) {
        console.error('Error closing Redis:', closeError);
      }
    }
    process.exit(0);
  }
}

clearUserCaches();