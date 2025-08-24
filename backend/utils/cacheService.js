const { getRedis } = require('../config/redisClient');

class CacheService {
  constructor() {
    this.defaultTTL = 3600; // 1 hour
  }

  // Cache key generators
  generateKey(prefix, ...parts) {
    return `${prefix}:${parts.filter(Boolean).join(':')}`;
  }

  // High Impact Areas - Settings/Configuration (rarely change)
  getSettingsKey() {
    return this.generateKey('settings', 'all');
  }

  getPublicSettingsKey() {
    return this.generateKey('settings', 'public');
  }

  // High Impact - Room Availability (frequently accessed)
  getRoomAvailabilityKey(type = 'all', capacity = null) {
    return this.generateKey('rooms', 'available', type, capacity);
  }

  getRoomsKey() {
    return this.generateKey('rooms', 'all');
  }

  getRoomByIdKey(roomId) {
    return this.generateKey('room', roomId);
  }

  // Room occupants (moderate frequency)
  getRoomOccupantsKey(roomId) {
    return this.generateKey('room_occupants', roomId);
  }

  // High Impact - User Session Data Enhancement
  getUserKey(userId, role) {
    return this.generateKey('user', role, userId);
  }

  // Medium Impact - Student/Admin Lists
  getStudentsKey() {
    return this.generateKey('students', 'all');
  }

  getStudentByIdKey(studentId) {
    return this.generateKey('student', studentId);
  }

  getAdminsKey() {
    return this.generateKey('admins', 'all');
  }

  getAdminByIdKey(adminId) {
    return this.generateKey('admin', adminId);
  }

  // Medium Impact - Booking History
  getBookingsKey() {
    return this.generateKey('bookings', 'all');
  }

  getBookingByIdKey(bookingId) {
    return this.generateKey('booking', bookingId);
  }

  // Per-student bookings
  getStudentBookingsKey(studentId) {
    return this.generateKey('student_bookings', studentId);
  }

  // Low Impact - Public Content (rarely changes)
  getPublicContentKey() {
    return this.generateKey('public_content', 'all');
  }

  getPublicContentByTypeKey(type) {
    return this.generateKey('public_content', 'type', type);
  }

  // Dashboard Statistics (high impact)
  getDashboardStatsKey() {
    return this.generateKey('dashboard', 'stats');
  }

  getRoomOccupancyStatsKey() {
    return this.generateKey('stats', 'occupancy');
  }

  // Cache operations
  async get(key) {
    try {
      const redis = getRedis();
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, data, ttl = this.defaultTTL) {
    try {
      const redis = getRedis();
      await redis.setEx(key, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      const redis = getRedis();
      const count = await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async delPattern(pattern) {
    try {
      const redis = getRedis();
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        const deleted = await redis.del(...keys); // spread arguments for node-redis v4
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  }

  // Cache invalidation helpers
  async invalidateRoomCaches() {
    await this.delPattern('rooms:*');
    await this.delPattern('room:*');
    await this.delPattern('room_occupants:*');
    await this.delPattern('stats:*');
    await this.delPattern('dashboard:*');
  }

  async invalidateUserCaches() {
    await this.delPattern('user:*');
    await this.delPattern('students:*');
    await this.delPattern('student:*');
    await this.delPattern('admins:*');
    await this.delPattern('admin:*');
    await this.delPattern('student_bookings:*');
    await this.delPattern('room_occupants:*'); // User changes affect room occupants
  }

  async invalidateBookingCaches() {
    await this.delPattern('bookings:*');
    await this.delPattern('booking:*');
    await this.delPattern('student_bookings:*');
    await this.delPattern('room_occupants:*'); // Booking changes affect room occupants
    await this.delPattern('stats:*');
    await this.delPattern('dashboard:*');
  }

  async invalidateSettingsCaches() {
    await this.delPattern('settings:*');
  }

  async invalidatePublicContentCaches() {
    await this.delPattern('public_content:*');
  }

  // Cache-aside pattern helpers
  async getOrSet(key, fetchFunction, ttl = this.defaultTTL) {
    let data = await this.get(key);
    if (data === null) {
      console.log(`[CACHE][MISS] key=${key}`);
      data = await fetchFunction();
      if (data !== null && data !== undefined) {
        await this.set(key, data, ttl);
      }
    } else {
      console.log(`[CACHE][HIT] key=${key}`);
    }
    return data;
  }

  // TTL configurations by data type
  getTTL(type) {
    const ttls = {
      // High frequency, high impact - shorter TTL
      'room_availability': 30,      // 5 minutes
      'dashboard_stats': 30,      // 10 minutes
      
      // Medium frequency - medium TTL
      'room_details': 300,         // 30 minutes
      'room_occupants': 60,         // 15 minutes (moderate frequency)
      'user_profiles': 1800,         // 30 minutes
      'booking_history': 3600,       // 1 hour
      
      // Low frequency, high consistency - longer TTL
      'settings': 5,              // 2 hours
      'public_settings': 7200,       // 2 hours
      'public_content': 14400,       // 4 hours (rarely changes)
      'user_lists': 3600,            // 1 hour
      
      // Default
      'default': 300                // 1 hour
    };
    return ttls[type] || ttls.default;
  }
}

module.exports = new CacheService();