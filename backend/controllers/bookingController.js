const { Booking, Room, User, RoomAssignment } = require('../models');
const { validationResult } = require('express-validator');
const { syncRoomOccupancy } = require('../utils/roomUtils');
const cacheService = require('../utils/cacheService');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin
exports.getBookings = async (req, res) => {
  try {
    const cacheKey = cacheService.getBookingsKey();
    
    const bookings = await cacheService.getOrSet(cacheKey, async () => {
      return await Booking.find({})
        .populate('studentId', 'fullName email programmeOfStudy level')
        .populate('roomId', 'roomNumber roomType capacity')
        .sort({ createdAt: -1 });
    }, cacheService.getTTL('booking_history'));

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const cacheKey = cacheService.getBookingByIdKey(bookingId);
    
    const booking = await cacheService.getOrSet(cacheKey, async () => {
      return await Booking.findById(bookingId)
        .populate('studentId', 'fullName email programmeOfStudy level')
        .populate('roomId', 'roomNumber roomType capacity');
    }, cacheService.getTTL('booking_history'));

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is admin or the student who made the booking
    if (req.user.role !== 'admin' && req.user.id !== booking.studentId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { roomId, termsAgreed } = req.body;

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Get current occupancy
    const currentAssignments = await RoomAssignment.countDocuments({
      roomId,
      status: 'active'
    });

    // Check if room is full
    if (currentAssignments >= room.capacity) {
      return res.status(400).json({ message: 'Room is already at full capacity' });
    }

    // Check if student already has an active booking
    const existingBooking = await Booking.findOne({
      studentId: req.user.id,
      status: 'active',
    });

    if (existingBooking) {
      return res.status(400).json({
        message: 'You already have an active booking',
      });
    }

    // Get current user's gender
    const currentUser = await User.findById(req.user.id).select('gender fullName');

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check gender compatibility with existing room occupants
    if (currentAssignments > 0) {
      const existingOccupants = await RoomAssignment.find({
        roomId,
        status: 'active'
      }).populate('studentId', 'gender');
    
      // Check if any existing occupant has a different gender
      const hasGenderConflict = existingOccupants.some(
        assignment => assignment.studentId.gender !== currentUser.gender
      );
    
      if (hasGenderConflict) {
        const occupantGender = existingOccupants[0].studentId.gender;
        return res.status(400).json({
          message: `This room is currently occupied by ${occupantGender} students. ${currentUser.gender === 'male' ? 'Male' : 'Female'} students cannot book the same room as ${occupantGender === 'male' ? 'male' : 'female'} students.`
        });
      }
    }

    // Create booking
    const booking = await Booking.create({
      studentId: req.user.id,
      roomId,
      termsAgreed,
      status: 'active',
    });

    // Create room assignment
    await RoomAssignment.create({
      roomId,
      studentId: req.user.id,
      status: 'active'
    });

    // Sync room occupancy
    await syncRoomOccupancy(roomId);

    // Invalidate related caches
    await cacheService.invalidateRoomCaches();
    await cacheService.invalidateBookingCaches();
    await cacheService.invalidateUserCaches(); // ensure /students/:id is fresh

    // Enhanced socket events
    const io = req.app.get('io');
    if (io) {
      // Notify admins
      io.to('admin-room').emit('new-booking', {
        bookingId: booking._id,
        studentName: currentUser.fullName,
        roomNumber: room.roomNumber,
        studentId: req.user.id
      });
      
      // Notify all students about room availability change
      io.emit('room-availability-changed', {
        roomId: room._id,
        roomNumber: room.roomNumber,
        available: room.currentOccupancy + 1 < room.capacity,
        currentOccupancy: room.currentOccupancy + 1
      });
      
      // Notify the student who booked
      io.to(`user-${req.user.id}`).emit('booking-confirmed', {
        bookingId: booking._id,
        roomNumber: room.roomNumber,
        message: `Successfully booked Room ${room.roomNumber}`
      });

      // Also notify student dashboard to refetch profile
      io.to(`user-${req.user.id}`).emit('booking-status-updated', {
        bookingId: booking._id,
        studentId: req.user.id,
        status: 'active'
      });
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const { cancellationReason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is admin or the student who made the booking
    if (req.user.role !== 'admin' && req.user.id !== booking.studentId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if booking can be cancelled
    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ message: 'Booking cannot be cancelled' });
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancellationReason = cancellationReason;
    booking.cancelledAt = new Date();
    await booking.save();

    // Update room assignment
    await RoomAssignment.updateMany(
      { 
        roomId: booking.roomId,
        studentId: booking.studentId,
        status: 'active'
      },
      { status: 'inactive' }
    );

    // Sync room occupancy
    await syncRoomOccupancy(booking.roomId);

    // Invalidate related caches
    await cacheService.invalidateRoomCaches();
    await cacheService.invalidateBookingCaches();
    await cacheService.invalidateUserCaches(); // ensure /students/:id is fresh

    // Let the affected student refresh
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${booking.studentId}`).emit('booking-status-updated', {
        bookingId: booking._id,
        studentId: booking.studentId,
        status: 'cancelled'
      });
    }

    res.json(booking);
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Validate status
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    booking.status = status;
    await booking.save();

    // If booking is cancelled, update room assignment
    if (status === 'cancelled') {
      await RoomAssignment.updateMany(
        { 
          roomId: booking.roomId,
          studentId: booking.studentId,
          status: 'active'
        },
        { status: 'inactive' }
      );
      // Sync room occupancy
      await syncRoomOccupancy(booking.roomId);
      await cacheService.invalidateRoomCaches();
    }

    // Invalidate booking caches
    await cacheService.invalidateBookingCaches();
    await cacheService.invalidateUserCaches(); // ensure /students/:id is fresh

    // Inform the student to refresh
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${booking.studentId}`).emit('booking-status-updated', {
        bookingId: booking._id,
        studentId: booking.studentId,
        status
      });
    }

    res.json(booking);
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update payment status
// @route   PUT /api/bookings/:id/payment
// @access  Private/Admin
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentMethod } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Validate payment status
    if (!['pending', 'paid', 'refunded'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    booking.paymentStatus = paymentStatus;
    booking.paymentMethod = paymentMethod;
    await booking.save();

    // If payment is made, confirm booking
    if (paymentStatus === 'paid' && booking.status === 'pending') {
      booking.status = 'confirmed';
      await booking.save();
    }

    // Invalidate booking caches
    await cacheService.invalidateBookingCaches();

    res.json(booking);
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update booking room
// @route   PUT /api/bookings/:id/room
// @access  Private/Admin
exports.updateBookingRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if new room exists
    const newRoom = await Room.findById(roomId);
    if (!newRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Get current occupancy of new room
    const currentAssignments = await RoomAssignment.countDocuments({
      roomId,
      status: 'active'
    });

    // Check if new room has capacity
    if (currentAssignments >= newRoom.capacity) {
      return res.status(400).json({ message: 'New room is already at full capacity' });
    }

    // Get student gender for compatibility check
    const student = await User.findById(booking.studentId).select('gender');

    // Check gender compatibility with existing occupants in new room
    if (currentAssignments > 0) {
      const existingOccupants = await RoomAssignment.find({
        roomId,
        status: 'active'
      }).populate('studentId', 'gender');

      const hasGenderConflict = existingOccupants.some(
        assignment => assignment.studentId.gender !== student.gender
      );

      if (hasGenderConflict) {
        const occupantGender = existingOccupants[0].studentId.gender;
        return res.status(400).json({
          message: `Cannot move to this room. It is currently occupied by ${occupantGender} students.`
        });
      }
    }

    const oldRoomId = booking.roomId;

    // IMPORTANT: Remove any existing inactive record for this room+student to avoid unique index conflicts
    await RoomAssignment.deleteMany({
      roomId: oldRoomId,
      studentId: booking.studentId,
      status: 'inactive'
    });

    // Update room assignment (set active -> inactive)
    await RoomAssignment.updateMany(
      { 
        roomId: oldRoomId,
        studentId: booking.studentId,
        status: 'active'
      },
      { status: 'inactive' }
    );

    // Create new active assignment for the new room
    await RoomAssignment.create({
      roomId,
      studentId: booking.studentId,
      status: 'active'
    });

    // Update booking
    booking.roomId = roomId;
    await booking.save();

    // Sync room occupancy for both rooms
    await syncRoomOccupancy(oldRoomId);
    await syncRoomOccupancy(roomId);

    // Invalidate related caches
    await cacheService.invalidateRoomCaches();
    await cacheService.invalidateBookingCaches();
    await cacheService.invalidateUserCaches(); // room change also affects student's booking view

    // Return updated booking with population
    const updatedBooking = await Booking.findById(booking._id)
      .populate('studentId', 'fullName programmeOfStudy level')
      .populate('roomId', 'roomNumber roomType capacity');

    res.json(updatedBooking);
  } catch (error) {
    console.error('Update booking room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private/Admin
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is admin, super admin, or the student who made the booking
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.id !== booking.studentId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete the room assignment
    await RoomAssignment.deleteMany({
      roomId: booking.roomId,
      studentId: booking.studentId,
      status: 'active'
    });

    // Sync room occupancy
    await syncRoomOccupancy(booking.roomId);

    // Delete the booking
    await Booking.findByIdAndDelete(req.params.id);

    // Invalidate related caches
    await cacheService.invalidateRoomCaches();
    await cacheService.invalidateBookingCaches();
    await cacheService.invalidateUserCaches();

    // Emit socket event for booking deletion
    const io = req.app.get('io');
    if (io) {
      const room = await Room.findById(booking.roomId).select('roomNumber');
      
      io.to('admin-room').emit('booking-deleted', {
        bookingId: booking._id,
        roomNumber: room?.roomNumber
      });

      // Notify the student so their dashboard refetches
      io.to(`user-${booking.studentId}`).emit('booking-status-updated', {
        bookingId: booking._id,
        studentId: booking.studentId,
        status: 'deleted'
      });
    }

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Clear all bookings
// @route   DELETE /api/bookings
// @access  Private/Admin
exports.clearAllBookings = async (req, res) => {
  try {
    // Get all active bookings
    const activeBookings = await Booking.find({ status: 'active' });

    // Delete ALL room assignments (both active and inactive)
    await RoomAssignment.deleteMany({});

    // Get all rooms that had active bookings and sync their occupancy
    const roomIds = [...new Set(activeBookings.map(booking => booking.roomId))];
    for (const roomId of roomIds) {
      await syncRoomOccupancy(roomId);
    }

    // Delete all bookings
    const deleteResult = await Booking.deleteMany({});

    // Invalidate related caches
    await cacheService.invalidateRoomCaches();
    await cacheService.invalidateBookingCaches();
    await cacheService.invalidateUserCaches(); // clear student caches too

    res.json({ 
      message: `Successfully cleared ${deleteResult.deletedCount} bookings and all room assignments`,
      deletedCount: deleteResult.deletedCount 
    });
  } catch (error) {
    console.error('Clear all bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create booking for student (Admin only)
// @route   POST /api/bookings/admin-create
// @access  Private/Admin
exports.createBookingForStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, roomId, termsAgreed } = req.body;

    // Verify admin or super admin role
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Check if student exists and is active
    const student = await User.findOne({
      _id: studentId,
      isActive: true
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found or inactive' });
    }

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Get current occupancy
    const currentAssignments = await RoomAssignment.countDocuments({
      roomId,
      status: 'active'
    });

    // Check if room is full
    if (currentAssignments >= room.capacity) {
      return res.status(400).json({ message: 'Room is already at full capacity' });
    }

    // Check if student already has an active booking
    const existingBooking = await Booking.findOne({
      studentId,
      status: 'active',
    });

    if (existingBooking) {
      return res.status(400).json({
        message: 'Student already has an active booking',
      });
    }

    // Check gender compatibility with existing room occupants
    if (currentAssignments > 0) {
      const existingOccupants = await RoomAssignment.find({
        roomId,
        status: 'active'
      }).populate('studentId', 'gender');
    
      // Check if any existing occupant has a different gender
      const hasGenderConflict = existingOccupants.some(
        assignment => assignment.studentId.gender !== student.gender
      );
    
      if (hasGenderConflict) {
        const occupantGender = existingOccupants[0].studentId.gender;
        return res.status(400).json({
          message: `This room is currently occupied by ${occupantGender} students. ${student.gender === 'male' ? 'Male' : 'Female'} students cannot book the same room as ${occupantGender === 'male' ? 'male' : 'female'} students.`
        });
      }
    }

    // Create booking with admin attribution
    const booking = await Booking.create({
      studentId,
      roomId,
      termsAgreed: termsAgreed || true,
      status: 'active',
      createdByAdmin: req.user.id, // Track which admin created the booking
    });

    // Create room assignment
    await RoomAssignment.create({
      roomId,
      studentId,
      status: 'active'
    });

    // Sync room occupancy
    await syncRoomOccupancy(roomId);

    // Invalidate related caches
    await cacheService.invalidateRoomCaches();
    await cacheService.invalidateBookingCaches();
    await cacheService.invalidateUserCaches(); // ensure /students/:id is fresh

    // Enhanced socket events
    const io = req.app.get('io');
    if (io) {
      // Notify admins
      io.to('admin-room').emit('new-booking', {
        bookingId: booking._id,
        studentName: student.fullName,
        roomNumber: room.roomNumber,
        studentId: studentId,
        createdByAdmin: req.user.fullName
      });
      
      // Notify all students about room availability change
      io.emit('room-availability-changed', {
        roomId: room._id,
        roomNumber: room.roomNumber,
        available: room.currentOccupancy + 1 < room.capacity,
        currentOccupancy: room.currentOccupancy + 1
      });
      
      // Notify the student who got booked to refetch profile
      io.to(`user-${studentId}`).emit('booking-status-updated', {
        bookingId: booking._id,
        studentId,
        status: 'active'
      });
    }

    // Fetch the complete booking with relations for response
    const completeBooking = await Booking.findById(booking._id)
      .populate('studentId', 'fullName email programmeOfStudy level')
      .populate('roomId', 'roomNumber roomType capacity');

    res.status(201).json({
      booking: completeBooking,
      message: `Booking created successfully for ${student.fullName}`
    });
  } catch (error) {
    console.error('Admin create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};