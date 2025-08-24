const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Room, Booking, RoomAssignment } = require('../models');
const { sendPasswordResetEmail } = require('../utils/email');
const { validationResult } = require('express-validator');
const cacheService = require('../utils/cacheService');

// Student Registration
exports.registerStudent = async (req, res) => {
  try {
    const {
      email,
      password,
      confirmPassword,
      fullName,
      gender,
      phoneNumber,
      dateOfBirth,
      programmeOfStudy,
      guardianName,
      guardianPhoneNumber,
      level
    } = req.body;

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if student already exists
    const existingStudent = await User.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new student
    const student = await User.create({
      email,
      password,
      fullName,
      gender,
      phoneNumber,
      dateOfBirth,
      programmeOfStudy,
      guardianName,
      guardianPhoneNumber,
      level
    });

    // Invalidate student caches
    await cacheService.invalidateUserCaches();

    // Generate JWT
    const token = jwt.sign(
      { id: student._id, email: student.email, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Student registered successfully',
      token,
      student: {
        id: student._id,
        email: student.email,
        fullName: student.fullName,
        programmeOfStudy: student.programmeOfStudy,
        level: student.level,
        isActive: student.isActive
      }
    });
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Student Login
exports.loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔍 Student login attempt:', { email, passwordLength: password?.length });

    // Find student by email
    const student = await User.findOne({ email });
    console.log('👤 Student found:', student ? 'YES' : 'NO');
    
    if (!student) {
      console.log('❌ Student not found in database');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if student account is active
    if (!student.isActive) {
      console.log('❌ Student account is inactive');
      return res.status(401).json({ message: 'Account deactivated. Please contact administration.' });
    }

    // Verify password
    const isPasswordValid = await student.checkPassword(password);
    console.log('🔐 Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password provided');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Simple cookie auth
    res.cookie('sid', 'simple-auth-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Login successful',
      student: {
        id: student._id,
        email: student.email,
        fullName: student.fullName,
        phoneNumber: student.phoneNumber,
        level: student.level,
        programmeOfStudy: student.programmeOfStudy
      }
    });
  } catch (error) {
    console.error('💥 Student login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all students (Admin access)
exports.getStudents = async (req, res) => {
  try {
    const cacheKey = cacheService.getStudentsKey();

    const students = await cacheService.getOrSet(cacheKey, async () => {
      return await User.find({})
        .select('-password')
        .populate({
          path: 'roomAssignments',
          match: { status: 'active' },
          select: 'assignedDate roomId',
          populate: {
            path: 'roomId',
            select: 'roomNumber roomType capacity'
          }
        })
        .sort({ createdAt: -1 });
    }, cacheService.getTTL('user_lists'));

    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get student by ID
exports.getStudentById = async (req, res) => {
  try {
    const studentId = req.params.id;
    const cacheKey = cacheService.getStudentByIdKey(studentId);

    const student = await cacheService.getOrSet(cacheKey, async () => {
      return await User.findById(studentId)
        .select('-password')
        .populate({
          path: 'bookings',
          select: 'roomId bookingDate status',
          populate: {
            path: 'roomId',
            select: 'roomNumber roomType capacity'
          }
        })
        .populate({
          path: 'roomAssignments',
          match: { status: 'active' },
          select: 'assignedDate roomId',
          populate: {
            path: 'roomId',
            select: 'roomNumber roomType capacity'
          }
        });
    }, cacheService.getTTL('user_profiles'));
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Get student by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update student profile
exports.updateStudent = async (req, res) => {
  try {
    const {
      fullName,
      full_name, // Add this to handle both naming conventions
      gender,
      phoneNumber,
      dateOfBirth, // Add this missing field
      programmeOfStudy,
      guardianName,
      guardianPhoneNumber,
      level,
      email // Add email field for admin updates
    } = req.body;
    
    console.log('Update request body:', req.body); // Debug log
    
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Build update object with only provided fields
    const updateData = {};
    // Handle both fullName and full_name
    if (fullName !== undefined || full_name !== undefined) {
      updateData.fullName = fullName || full_name;
    }
    if (email !== undefined) updateData.email = email;
    if (gender !== undefined) updateData.gender = gender; // Add gender field
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (programmeOfStudy !== undefined) updateData.programmeOfStudy = programmeOfStudy;
    if (guardianName !== undefined) updateData.guardianName = guardianName;
    if (guardianPhoneNumber !== undefined) updateData.guardianPhoneNumber = guardianPhoneNumber;
    if (level !== undefined) updateData.level = level;

    console.log('Update data before save:', updateData); // Debug log

    // Update the student
    const updatedStudent = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .select('-password')
    .populate({
      path: 'bookings',
      select: 'roomId bookingDate status',
      populate: {
        path: 'roomId',
        select: 'roomNumber roomType capacity'
      }
    })
    .populate({
      path: 'roomAssignments',
      match: { status: 'active' },
      select: 'assignedDate roomId',
      populate: {
        path: 'roomId',
        select: 'roomNumber roomType capacity'
      }
    });

    if (!updatedStudent) {
      return res.status(400).json({ message: 'No changes were made or student not found' });
    }

    console.log('Updated student from DB:', updatedStudent?.toJSON()); // Debug log

    // Invalidate related caches
    await cacheService.invalidateUserCaches();

    res.json({
      message: 'Student updated successfully',
      student: updatedStudent
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// exports.getStudentBookings
exports.getStudentBookings = async (req, res) => {
  try {
    const studentId = req.params.id;
    const cacheKey = cacheService.getStudentBookingsKey(studentId);

    const bookings = await cacheService.getOrSet(cacheKey, async () => {
      return await Booking.find({ studentId })
        .populate('roomId', 'roomNumber roomType capacity')
        .sort({ createdAt: -1 });
    }, cacheService.getTTL('booking_history'));

    res.json(bookings);
  } catch (error) {
    console.error('Get student bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete student (Admin only)
exports.deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check for active bookings
    const activeBookings = await Booking.find({
      studentId: student._id,
      status: { $in: ['active'] }
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete student with active bookings'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    // Invalidate related caches
    await cacheService.invalidateUserCaches();

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle student status (Admin only)
exports.toggleStudentStatus = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.isActive = !student.isActive;
    await student.save();

    // Invalidate related caches
    await cacheService.invalidateUserCaches();
    
    res.json({
      message: `Student ${student.isActive ? 'activated' : 'deactivated'} successfully`,
      student: {
        id: student._id,
        email: student.email,
        fullName: student.fullName,
        gender: student.gender,
        phoneNumber: student.phoneNumber,
        dateOfBirth: student.dateOfBirth,
        programmeOfStudy: student.programmeOfStudy,
        guardianName: student.guardianName,
        guardianPhoneNumber: student.guardianPhoneNumber,
        level: student.level,
        isActive: student.isActive,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
      }
    });
  } catch (error) {
    console.error('Toggle student status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await student.checkPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    student.password = newPassword;
    await student.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create Student (Admin only)
exports.createStudent = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      full_name,
      gender,
      phoneNumber,
      dateOfBirth,
      programmeOfStudy,
      guardianName,
      guardianPhoneNumber,
      level
    } = req.body;

    // Check if student already exists
    const existingStudent = await User.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Use either fullName or full_name (handle both frontend formats)
    const studentFullName = fullName || full_name;

    // Create new student with default password if not provided
    const defaultPassword = password || 'student123';
    
    const student = await User.create({
      email,
      password: defaultPassword,
      fullName: studentFullName,
      gender,
      phoneNumber,
      dateOfBirth,
      programmeOfStudy,
      guardianName,
      guardianPhoneNumber,
      level,
      isActive: true // Explicitly set to true for admin-created students
    });

    // Invalidate related caches
    await cacheService.invalidateUserCaches();

    res.status(201).json({
      message: 'Student created successfully',
      student: {
        id: student._id,
        email: student.email,
        fullName: student.fullName,
        gender: student.gender,
        phoneNumber: student.phoneNumber,
        dateOfBirth: student.dateOfBirth,
        programmeOfStudy: student.programmeOfStudy,
        guardianName: student.guardianName,
        guardianPhoneNumber: student.guardianPhoneNumber,
        level: student.level,
        isActive: student.isActive,
        createdAt: student.createdAt
      }
    });
  } catch (error) {
    console.error('Student creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};