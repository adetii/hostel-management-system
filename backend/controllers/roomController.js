const { Room, User, Booking, RoomAssignment } = require('../models');
const { validationResult } = require('express-validator');
const cacheService = require('../utils/cacheService');

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private
exports.getRooms = async (req, res) => {
  try {
    const cacheKey = cacheService.getRoomsKey();
    
    const transformedRooms = await cacheService.getOrSet(cacheKey, async () => {
      const rooms = await Room.find()
        .populate({
          path: 'assignments',
          match: { status: 'active' },
          populate: {
            path: 'studentId',
            select: 'fullName email'
          }
        })
        .sort({ roomNumber: 1 });

      // Transform the data to match frontend expectations
      return rooms.map(room => {
        const roomData = room.toObject();
        
        // Map roomType to type
        let type = 'single';
        if (roomData.roomType === '2-in-a-room') type = 'double';
        else if (roomData.roomType === '3-in-a-room') type = 'triple';
        else if (roomData.roomType === '4-in-a-room') type = 'deluxe';
        
        // Map isAvailable to status
        let status = roomData.isAvailable ? 'available' : 'occupied';
        
        // Get students from assignments
        const students = roomData.assignments ? 
          roomData.assignments.map(assignment => assignment.studentId).filter(Boolean) : [];
        
        return {
          ...roomData,
          _id: roomData._id.toString(),
          type,
          status,
          students // Add students array for frontend compatibility
        };
      });
    }, cacheService.getTTL('room_details'));

    res.json(transformedRooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get room by ID
// @route   GET /api/rooms/:id
// @access  Private
exports.getRoomById = async (req, res) => {
  try {
    const roomId = req.params.id;
    const cacheKey = cacheService.getRoomByIdKey(roomId);
    
    const room = await cacheService.getOrSet(cacheKey, async () => {
      return await Room.findById(roomId)
        .populate({
          path: 'assignments',
          match: { status: 'active' },
          populate: {
            path: 'studentId',
            select: 'fullName programmeOfStudy level'
          }
        })
        .populate({
          path: 'bookings',
          select: 'bookingDate status'
        });
    }, cacheService.getTTL('room_details'));

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new room
// @route   POST /api/rooms
// @access  Private/Admin
exports.createRoom = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      roomNumber,
      type,
      capacity,
    } = req.body;

    // Validate required fields
    if (!roomNumber) {
      return res.status(400).json({ message: 'Room number is required' });
    }

    if (!type) {
      return res.status(400).json({ message: 'Room type is required' });
    }

    if (!capacity) {
      return res.status(400).json({ message: 'Room capacity is required' });
    }

    // Check if room number already exists
    const roomExists = await Room.findOne({ roomNumber });
    if (roomExists) {
      return res.status(400).json({ message: 'Room number already exists' });
    }

    // Map frontend type to backend roomType
    const typeMapping = {
      'single': '1-in-a-room',
      'double': '2-in-a-room', 
      'triple': '3-in-a-room',
      'deluxe': '4-in-a-room'
    };

    const room = await Room.create({
      roomNumber,
      roomType: typeMapping[type] || '1-in-a-room',
      capacity,
      isAvailable: true,
      currentOccupancy: 0,
    });

    // Invalidate room caches
    await cacheService.invalidateRoomCaches();

    // ADD: Emit socket event for new room
    const io = req.app.get('io');
    if (io) {
      io.emit('room-created', {
        roomId: room._id,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        capacity: room.capacity,
        status: room.isAvailable ? 'available' : 'occupied'
      });
    }

    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private/Admin
exports.updateRoom = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const {
      type,
      capacity,
    } = req.body;

    // Check if new capacity is less than current occupancy
    if (capacity < room.currentOccupancy) {
      return res.status(400).json({
        message: 'New capacity cannot be less than current occupancy',
      });
    }

    // Map frontend type to backend roomType
    const typeMapping = {
      'single': '1-in-a-room',
      'double': '2-in-a-room', 
      'triple': '3-in-a-room',
      'deluxe': '4-in-a-room'
    };

    room.roomType = typeMapping[type] || room.roomType;
    room.capacity = capacity;
    await room.save();

    // Invalidate room caches
    await cacheService.invalidateRoomCaches();

    // ADD: Emit socket event for room update
    const io = req.app.get('io');
    if (io) {
      io.emit('room-updated', {
        roomId: room._id,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        capacity: room.capacity,
        status: room.isAvailable ? 'available' : 'occupied'
      });
    }

    res.json(room);
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if room has any students
    if (room.currentOccupancy > 0) {
      return res.status(400).json({
        message: 'Cannot delete room with current occupants',
      });
    }

    await Room.findByIdAndDelete(req.params.id);

    // Invalidate room caches
    await cacheService.invalidateRoomCaches();

    // ADD: Emit socket event for room deletion
    const io = req.app.get('io');
    if (io) {
      io.emit('room-deleted', {
        roomId: req.params.id
      });
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update room status
// @route   PUT /api/rooms/:id/status
// @access  Private/Admin
exports.updateRoomStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Map status to isAvailable
    const isAvailable = status === 'available';
    
    // If marking as unavailable, check if room is occupied
    if (!isAvailable && room.currentOccupancy > 0) {
      return res.status(400).json({
        message: 'Cannot mark room as unavailable while it has occupants',
      });
    }

    room.isAvailable = isAvailable;
    await room.save();

    // Invalidate room caches
    await cacheService.invalidateRoomCaches();

    // Emit socket event for room status update
    const io = req.app.get('io');
    if (io) {
      io.emit('room-status-updated', {
        roomId: room._id,
        status: room.isAvailable ? 'available' : 'unavailable'
      });
    }

    res.json({
      message: `Room marked as ${status}`,
      room
    });
  } catch (error) {
    console.error('Update room status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get available rooms
// @route   GET /api/rooms/available
// @access  Private
exports.getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      isAvailable: true,
      $expr: { $lt: ['$currentOccupancy', '$capacity'] }
    }).sort({ roomNumber: 1 });

    res.json(rooms);
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get room occupants
// @route   GET /api/rooms/:id/occupants
// @access  Private
exports.getRoomOccupants = async (req, res) => {
  try {
    const roomId = req.params.id;
    
    const assignments = await RoomAssignment.find({
      roomId: roomId,
      status: 'active'
    }).populate('studentId', 'fullName email programmeOfStudy level');

    const occupants = assignments.map(assignment => assignment.studentId);

    res.json(occupants);
  } catch (error) {
    console.error('Get room occupants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};