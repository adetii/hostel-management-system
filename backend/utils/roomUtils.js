const { Room, RoomAssignment } = require('../models');

/**
 * Synchronize room occupancy and availability based on active assignments
 * @param {string | import('mongoose').Types.ObjectId | null} roomId - Optional specific room ID to sync
 */
async function syncRoomOccupancy(roomId = null) {
  try {
    const filter = roomId ? { _id: roomId } : {};
    const rooms = await Room.find(filter);

    // Get current academic period
    const { AcademicSettings } = require('../models');
    const academicSettings = await AcademicSettings.getCurrent();
    const { academicYear, semester } = academicSettings.getCurrentPeriod();

    for (const room of rooms) {
      // Count active assignments for the current academic period
      const activeAssignments = await RoomAssignment.countDocuments({
        roomId: room._id,
        status: 'active',
        academicYear,
        semester
      });

      // Update room occupancy and availability (current term)
      room.currentOccupancy = activeAssignments;
      room.isAvailable = activeAssignments < room.capacity;
      await room.save();
    }

    console.log(`Synchronized ${rooms.length} room(s)`);
  } catch (error) {
    console.error('Error synchronizing room occupancy:', error);
    throw error;
  }
}

/**
 * Clean up orphaned data and fix inconsistencies
 */
async function cleanupRoomData() {
  try {
    // Remove all inactive assignments (Mongoose)
    await RoomAssignment.deleteMany({ status: 'inactive' });

    // Sync all rooms
    await syncRoomOccupancy();

    console.log('Room data cleanup completed');
  } catch (error) {
    console.error('Error cleaning up room data:', error);
    throw error;
  }
}

module.exports = {
  syncRoomOccupancy,
  cleanupRoomData
};