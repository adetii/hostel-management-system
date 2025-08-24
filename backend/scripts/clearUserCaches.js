const cacheService = require('../utils/cacheService');
const { getRedis } = require('../config/redisClient');

async function clearUserCaches() {
  try {
    console.log('🔄 Clearing user-related caches...');
    
    // Clear all user-related caches
    await cacheService.invalidateUserCaches();
    
    // Also clear any session data for students (optional but thorough)
    const redis = getRedis();
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
  } finally {
    process.exit(0);
  }
}

clearUserCaches();