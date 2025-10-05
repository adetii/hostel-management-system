const { User, Booking, BookingArchive, RoomAssignment, Room } = require('../models');
const cacheService = require('../utils/cacheService');
const { syncRoomOccupancy } = require('../utils/roomUtils');

class StudentDeletionService {
  /**
   * Comprehensive student deletion with hybrid approach
   * @param {string} studentId - MongoDB ObjectId of the student
   * @param {string} adminId - ID of the admin performing the deletion
   * @param {object} io - Socket.IO instance for real-time notifications
   * @returns {object} Deletion summary
   */
  // Method: deleteStudentCompletely(studentId, adminId, io = null)
  static async deleteStudentCompletely(studentId, adminId, io = null) {
    const session = await User.startSession();
    
    try {
      await session.withTransaction(async () => {
        console.log(`🗑️ Starting comprehensive deletion for student: ${studentId}`);
        
        // 1. Get student data before deletion
        const student = await User.findById(studentId).session(session);
        if (!student) {
          throw new Error('Student not found');
        }

        const deletionSummary = {
          studentId: student._id,
          studentEmail: student.email,
          studentName: student.fullName,
          deletedAt: new Date(),
          deletedBy: adminId,
          actions: []
        };

        // Track affected rooms across bookings and assignments
        const affectedRoomIds = new Set();

        // 2. Handle active bookings
        const activeBookings = await Booking.find({ studentId: student._id, status: 'active' })
          .populate('roomId')
          .session(session);

        if (activeBookings.length > 0) {
          console.log(`📋 Found ${activeBookings.length} active bookings to cancel`);
          for (const booking of activeBookings) {
            booking.status = 'inactive';
            booking.cancelledAt = new Date();
            booking.cancelledBy = adminId;
            booking.cancellationReason = 'Student account deleted';
            await booking.save({ session });

            // Collect affected room; recompute later after assignment removal
            if (booking.roomId) {
              affectedRoomIds.add(booking.roomId._id.toString());
              deletionSummary.actions.push(`Cancelled booking in Room ${booking.roomId.roomNumber}`);
            }
          }
        }

        // 3. Archive booking records with anonymized data
        const allBookings = await Booking.find({ studentId: student._id }).session(session);
        
        if (allBookings.length > 0) {
          console.log(`📦 Archiving ${allBookings.length} booking records`);
          
          const archivedBookings = allBookings.map(booking => ({
            // Keep system data
            studentId: booking.studentId, // FIX: was null, keep reference to satisfy schema
            roomId: booking.roomId,
            bookingDate: booking.bookingDate,
            termsAgreed: booking.termsAgreed,
            status: 'archived',
            academicYear: booking.academicYear,
            semester: booking.semester,
            originalBookingId: booking._id,
            archivedAt: new Date(),
            archivedBy: adminId,
            originalCreatedAt: booking.createdAt,
            originalUpdatedAt: booking.updatedAt,
            publicId: booking.publicId,
            
            // Preserve admin-created info
            createdByAdmin: booking.createdByAdmin,
            
            // Add deletion metadata
            deletionReason: 'Student account deleted',
            deletedStudentEmail: student.email,
            deletedStudentName: student.fullName
          }));

          await BookingArchive.insertMany(archivedBookings, { session });
          await Booking.deleteMany({ studentId: student._id }).session(session);
          
          deletionSummary.actions.push(`Archived ${allBookings.length} booking records`);
        }

        // 4. Handle room assignments
        const roomAssignments = await RoomAssignment.find({ studentId: student._id }).session(session);
        
        if (roomAssignments.length > 0) {
          console.log(`🏠 Removing ${roomAssignments.length} room assignments`);
          
          // Add affected rooms to the same set (no redeclaration)
          roomAssignments.forEach(a => affectedRoomIds.add(a.roomId.toString()));

          // Delete assignments first so occupancy reflects removal
          await RoomAssignment.deleteMany({ studentId: student._id }).session(session);
          deletionSummary.actions.push(`Removed ${roomAssignments.length} room assignments`);
        }

        // Recalculate room availability after cancellations and assignment removal
        for (const roomId of affectedRoomIds) {
          await this.updateRoomAvailability(roomId, session);
          deletionSummary.actions.push(`Updated occupancy for Room ${roomId}`);
        }

        // 5. Delete user account and personal data
        await User.findByIdAndDelete(student._id).session(session);
        deletionSummary.actions.push('Deleted user account and personal data');

        // 6. Clear all related caches
        await this.clearStudentCaches(student._id);
        deletionSummary.actions.push('Cleared all related caches');

        // 7. Send real-time notifications
        if (io) {
          await this.sendDeletionNotifications(io, student, activeBookings, roomAssignments);
          deletionSummary.actions.push('Sent real-time notifications');
        }

        console.log(`✅ Student deletion completed successfully`);
        return deletionSummary;
      });

    } catch (error) {
      console.error('❌ Student deletion failed:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Update room availability after booking/assignment removal
   */
  // Method: updateRoomAvailability(roomId, session)
  static async updateRoomAvailability(roomId, session) {
    try {
      const room = await Room.findById(roomId).session(session);
      if (!room) return;
  
      // Deduplicate occupancy by studentId to avoid double-counting
      const assignedStudentIds = await RoomAssignment
        .distinct('studentId', { roomId: room._id, status: 'active' })
        .session(session);
  
      const bookingStudentIdsNoAssignment = await Booking
        .distinct('studentId', {
          roomId: room._id,
          status: 'active',
          studentId: { $nin: assignedStudentIds }
        })
        .session(session);
  
      const newOccupancy = assignedStudentIds.length + bookingStudentIdsNoAssignment.length;
  
      room.currentOccupancy = newOccupancy;
      room.isAvailable = newOccupancy < room.capacity;
      await room.save({ session });
  
      console.log(`🏠 Updated Room ${room.roomNumber} occupancy: ${newOccupancy}/${room.capacity}`);
      return room;
    } catch (error) {
      console.error('Error updating room availability:', error);
      throw error;
    }
  }

  /**
   * Clear all caches related to the student
   */
  static async clearStudentCaches(studentId) {
    try {
      // Clear user-specific caches
      await cacheService.invalidateUserCaches();
      
      // Clear booking caches
      await cacheService.invalidateBookingCaches();
      
      // Clear room caches (since occupancy changed)
      await cacheService.invalidateRoomCaches();
      
      console.log(`🧹 Cleared all caches for student: ${studentId}`);
    } catch (error) {
      console.error('Error clearing caches:', error);
      // Don't throw - cache clearing is not critical
    }
  }

  /**
   * Send real-time notifications about the deletion
   */
  static async sendDeletionNotifications(io, student, activeBookings, roomAssignments) {
    try {
      // Notify admins about the deletion
      io.to('admin-room').emit('student-deleted', {
        studentId: student._id,
        studentName: student.fullName,
        studentEmail: student.email,
        deletedAt: new Date(),
        affectedBookings: activeBookings.length,
        affectedAssignments: roomAssignments.length
      });

      // Notify about room availability changes
      const affectedRooms = new Set();
      
      activeBookings.forEach(booking => {
        if (booking.roomId) {
          affectedRooms.add(booking.roomId._id.toString());
        }
      });
      
      roomAssignments.forEach(assignment => {
        affectedRooms.add(assignment.roomId.toString());
      });

      // Send room availability updates
      for (const roomId of affectedRooms) {
        const room = await Room.findById(roomId);
        if (room) {
          io.emit('room-availability-changed', {
            roomId: room._id,
            roomNumber: room.roomNumber,
            available: room.isAvailable, // FIX: reflect the actual isAvailable field
            currentOccupancy: room.currentOccupancy,
            capacity: room.capacity,
            reason: 'Student account deleted'
          });
        }
      }

      console.log(`📡 Sent deletion notifications for ${affectedRooms.size} affected rooms`);
    } catch (error) {
      console.error('Error sending notifications:', error);
      // Don't throw - notifications are not critical
    }
  }

  /**
   * Get deletion preview - shows what will be affected
   */
  static async getDeletionPreview(studentId) {
    try {
      const student = await User.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const activeBookings = await Booking.find({ 
        studentId: student._id, 
        status: 'active' 
      }).populate('roomId');

      const allBookings = await Booking.find({ studentId: student._id });
      
      const roomAssignments = await RoomAssignment.find({ 
        studentId: student._id 
      }).populate('roomId');

      return {
        student: {
          id: student._id,
          name: student.fullName,
          email: student.email,
          programmeOfStudy: student.programmeOfStudy,
          level: student.level
        },
        impact: {
          activeBookings: activeBookings.length,
          totalBookings: allBookings.length,
          roomAssignments: roomAssignments.length,
          affectedRooms: [...new Set([
            ...activeBookings.map(b => b.roomId?.roomNumber).filter(Boolean),
            ...roomAssignments.map(a => a.roomId?.roomNumber).filter(Boolean)
          ])]
        },
        actions: [
          `Cancel ${activeBookings.length} active bookings`,
          `Archive ${allBookings.length} booking records (anonymized)`,
          `Remove ${roomAssignments.length} room assignments`,
          `Update room availability for ${[...new Set([
            ...activeBookings.map(b => b.roomId?.roomNumber).filter(Boolean),
            ...roomAssignments.map(a => a.roomId?.roomNumber).filter(Boolean)
          ])].length} rooms`,
          `Delete user account and personal data`,
          `Clear all related caches`,
          `Send real-time notifications`
        ]
      };
    } catch (error) {
      console.error('Error getting deletion preview:', error);
      throw error;
    }
  }
}

module.exports = StudentDeletionService;
