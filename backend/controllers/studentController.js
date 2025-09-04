const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Room, Booking, BookingArchive, AcademicSettings, RoomAssignment } = require('../models');
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
        publicId: student.publicId,
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
        publicId: student.publicId,
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
      password,
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

    // Update fields directly on the document to trigger middleware
    if (fullName !== undefined || full_name !== undefined) {
      student.fullName = fullName || full_name;
    }
    if (email !== undefined) student.email = email;
    if (password !== undefined) student.password = password; // This will trigger pre-save hashing
    if (gender !== undefined) student.gender = gender;
    if (phoneNumber !== undefined) student.phoneNumber = phoneNumber;
    if (dateOfBirth !== undefined) student.dateOfBirth = dateOfBirth;
    if (programmeOfStudy !== undefined) student.programmeOfStudy = programmeOfStudy;
    if (guardianName !== undefined) student.guardianName = guardianName;
    if (guardianPhoneNumber !== undefined) student.guardianPhoneNumber = guardianPhoneNumber;
    if (level !== undefined) student.level = level;

    console.log('Update data before save:', {
      fullName: student.fullName,
      email: student.email,
      password: password ? '[WILL BE HASHED]' : '[NOT CHANGED]',
      gender: student.gender,
      phoneNumber: student.phoneNumber,
      dateOfBirth: student.dateOfBirth,
      programmeOfStudy: student.programmeOfStudy,
      guardianName: student.guardianName,
      guardianPhoneNumber: student.guardianPhoneNumber,
      level: student.level
    });

    // Save the document (this triggers pre-save middleware)
    await student.save();

    // Fetch the updated student with populated fields
    const updatedStudent = await User.findById(req.params.id)
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

// UPDATED: Get current student bookings with proper filtering
exports.getStudentCurrentBookings = async (req, res) => {
  try {
    const studentId = req.params.id;
    const academicSettings = await AcademicSettings.getCurrent();
    const { academicYear, semester } = academicSettings.getCurrentPeriod();
    
    const cacheKey = `student_current_bookings_${studentId}_${academicYear}_${semester}`;

    const bookings = await cacheService.getOrSet(cacheKey, async () => {
      // First, try to find bookings with academic fields
      let activeBookings = await Booking.find({
        studentId,
        status: 'active',
        academicYear,
        semester
      })
      .populate('roomId', 'roomNumber roomType capacity')
      .sort({ createdAt: -1 });

      // If no bookings found with academic fields, check for legacy bookings
      if (activeBookings.length === 0) {
        activeBookings = await Booking.find({
          studentId,
          status: 'active',
          $or: [
            { academicYear: { $exists: false } },
            { semester: { $exists: false } }
          ]
        })
        .populate('roomId', 'roomNumber roomType capacity')
        .sort({ createdAt: -1 });
      }

      return activeBookings;
    }, cacheService.getTTL('booking_current'));

    res.json({
      bookings,
      academicPeriod: `${academicYear} Semester ${semester}`,
      count: bookings.length
    });
  } catch (error) {
    console.error('Get student current bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get recent student bookings (inactive from previous semester)
exports.getStudentRecentBookings = async (req, res) => {
  try {
    const studentId = req.params.id;
    const academicSettings = await AcademicSettings.getCurrent();
    const currentPeriod = academicSettings.getCurrentPeriod();
    
    // Calculate previous semester
    let prevAcademicYear = currentPeriod.academicYear;
    let prevSemester = currentPeriod.semester - 1;
    
    if (prevSemester < 1) {
      prevSemester = 2;
      const [startYear] = currentPeriod.academicYear.split('/');
      const prevStartYear = parseInt(startYear) - 1;
      const prevEndYear = prevStartYear + 1;
      prevAcademicYear = `${prevStartYear}/${prevEndYear.toString().slice(-2)}`;
    }
    
    const cacheKey = `student_recent_bookings_${studentId}_${prevAcademicYear}_${prevSemester}`;

    const bookings = await cacheService.getOrSet(cacheKey, async () => {
      return await Booking.find({ 
        studentId,
        status: 'inactive',
        academicYear: prevAcademicYear,
        semester: prevSemester
      })
      .populate('roomId', 'roomNumber roomType capacity')
      .sort({ createdAt: -1 });
    }, cacheService.getTTL('booking_recent'));

    res.json({
      bookings,
      academicPeriod: `${prevAcademicYear} Semester ${prevSemester}`,
      count: bookings.length
    });
  } catch (error) {
    console.error('Get student recent bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get archived student bookings (paginated)
exports.getStudentArchivedBookings = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { 
      academicYear, 
      semester, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const options = {
      academicYear,
      semester: semester ? parseInt(semester) : undefined,
      page: parseInt(page),
      limit: parseInt(limit),
      populate: true
    };
    
    const result = await BookingArchive.getStudentArchives(studentId, options);
    
    res.json({
      archives: result.archives,
      pagination: result.pagination,
      totalCount: result.pagination.total
    });
  } catch (error) {
    console.error('Get student archived bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all student bookings summary (current + recent + archived counts)
exports.getStudentBookingsSummary = async (req, res) => {
  try {
    const studentId = req.params.id;
    const academicSettings = await AcademicSettings.getCurrent();
    const currentPeriod = academicSettings.getCurrentPeriod();
    
    // Calculate previous semester
    let prevAcademicYear = currentPeriod.academicYear;
    let prevSemester = currentPeriod.semester - 1;
    
    if (prevSemester < 1) {
      prevSemester = 2;
      const [startYear] = currentPeriod.academicYear.split('/');
      const prevStartYear = parseInt(startYear) - 1;
      const prevEndYear = prevStartYear + 1;
      prevAcademicYear = `${prevStartYear}/${prevEndYear.toString().slice(-2)}`;
    }
    
    const [currentCount, recentCount, archivedCount] = await Promise.all([
      // Current active bookings
      Booking.countDocuments({
        studentId,
        status: 'active',
        academicYear: currentPeriod.academicYear,
        semester: currentPeriod.semester
      }),
      // Recent inactive bookings
      Booking.countDocuments({
        studentId,
        status: 'inactive',
        academicYear: prevAcademicYear,
        semester: prevSemester
      }),
      // Archived bookings
      BookingArchive.countDocuments({ studentId })
    ]);
    
    res.json({
      summary: {
        current: {
          count: currentCount,
          period: `${currentPeriod.academicYear} Semester ${currentPeriod.semester}`
        },
        recent: {
          count: recentCount,
          period: `${prevAcademicYear} Semester ${prevSemester}`
        },
        archived: {
          count: archivedCount,
          totalPeriods: await BookingArchive.distinct('academicYear', { studentId }).then(years => years.length)
        }
      },
      totalBookings: currentCount + recentCount + archivedCount
    });
  } catch (error) {
    console.error('Get student bookings summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update the existing getStudentBookings to use the new system
exports.getStudentBookings = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { type = 'all' } = req.query;
    
    switch (type) {
      case 'current':
        return exports.getStudentCurrentBookings(req, res);
      case 'recent':
        return exports.getStudentRecentBookings(req, res);
      case 'archived':
        return exports.getStudentArchivedBookings(req, res);
      case 'summary':
        return exports.getStudentBookingsSummary(req, res);
      default:
        // Legacy support - return current bookings
        return exports.getStudentCurrentBookings(req, res);
    }
  } catch (error) {
    console.error('Get student bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete student (Admin only) - Comprehensive deletion
exports.deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const adminId = req.user.id;
    const io = req.app.get('io'); // Get Socket.IO instance

    // Get deletion preview first
    const StudentDeletionService = require('../services/studentDeletionService');
    const preview = await StudentDeletionService.getDeletionPreview(studentId);

    // Perform comprehensive deletion
    const deletionSummary = await StudentDeletionService.deleteStudentCompletely(
      studentId, 
      adminId, 
      io
    );

    res.json({
      message: 'Student and all related data deleted successfully',
      summary: deletionSummary,
      preview: preview
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ 
      message: 'Server error during student deletion',
      error: error.message 
    });
  }
};

// Get deletion preview (Admin only)
exports.getDeletionPreview = async (req, res) => {
  try {
    const studentId = req.params.id;
    const StudentDeletionService = require('../services/studentDeletionService');
    
    const preview = await StudentDeletionService.getDeletionPreview(studentId);
    
    res.json(preview);
  } catch (error) {
    console.error('Get deletion preview error:', error);
    res.status(500).json({ 
      message: 'Server error getting deletion preview',
      error: error.message 
    });
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
        password: student.password,
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