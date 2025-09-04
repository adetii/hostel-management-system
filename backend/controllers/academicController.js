const { AcademicSettings, Booking, BookingArchive } = require('../models');
const cacheService = require('../utils/cacheService');

// Get current academic settings
exports.getCurrentSettings = async (req, res) => {
  try {
    const settings = await AcademicSettings.getCurrent();
    res.json(settings);
  } catch (error) {
    console.error('Get academic settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update current academic period
exports.updateCurrentPeriod = async (req, res) => {
  try {
    const { academicYear, semester } = req.body;
    
    if (!academicYear || !semester) {
      return res.status(400).json({ 
        message: 'Academic year and semester are required' 
      });
    }
    
    if (![1, 2].includes(semester)) {
      return res.status(400).json({ 
        message: 'Semester must be 1 or 2' 
      });
    }
    
    const settings = await AcademicSettings.updateCurrentPeriod(academicYear, semester);
    
    // Clear related caches
    await cacheService.invalidatePattern('student_*_bookings_*');
    
    res.json({
      message: 'Academic period updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update academic period error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Transition to next semester
exports.transitionSemester = async (req, res) => {
  try {
    const settings = await AcademicSettings.getCurrent();
    const transitionInfo = settings.shouldTransitionSemester();
    
    if (!transitionInfo.transition) {
      return res.status(400).json({ 
        message: 'No semester transition needed at this time' 
      });
    }
    
    // Update all active bookings to inactive
    await Booking.updateMany(
      { 
        status: 'active',
        academicYear: settings.currentAcademicYear,
        semester: settings.currentSemester
      },
      { status: 'inactive' }
    );
    
    // Update academic settings
    const updatedSettings = await AcademicSettings.updateCurrentPeriod(
      transitionInfo.newAcademicYear,
      transitionInfo.newSemester
    );
    
    // Clear caches
    await cacheService.invalidatePattern('student_*_bookings_*');
    await cacheService.invalidateBookingCaches();
    
    res.json({
      message: 'Semester transition completed successfully',
      from: `${settings.currentAcademicYear} Semester ${settings.currentSemester}`,
      to: `${transitionInfo.newAcademicYear} Semester ${transitionInfo.newSemester}`,
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Semester transition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Archive bookings from previous academic year
exports.archiveOldBookings = async (req, res) => {
  try {
    const { academicYear, semester } = req.body;
    
    if (!academicYear) {
      return res.status(400).json({ 
        message: 'Academic year is required' 
      });
    }
    
    // Find bookings to archive
    const bookingsToArchive = await Booking.find({
      academicYear,
      semester: semester || { $in: [1, 2] }
    });
    
    if (bookingsToArchive.length === 0) {
      return res.json({ 
        message: 'No bookings found to archive',
        archivedCount: 0
      });
    }
    
    // Archive each booking
    const archivePromises = bookingsToArchive.map(booking => 
      BookingArchive.archiveBooking(booking, req.user?.id)
    );
    
    await Promise.all(archivePromises);
    
    // Delete original bookings
    await Booking.deleteMany({
      _id: { $in: bookingsToArchive.map(b => b._id) }
    });
    
    // Clear caches
    await cacheService.invalidatePattern('student_*_bookings_*');
    await cacheService.invalidateBookingCaches();
    
    res.json({
      message: 'Bookings archived successfully',
      archivedCount: bookingsToArchive.length,
      academicPeriod: semester ? `${academicYear} Semester ${semester}` : academicYear
    });
  } catch (error) {
    console.error('Archive bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get archive statistics
exports.getArchiveStats = async (req, res) => {
  try {
    const [totalArchived, academicYears, recentArchives] = await Promise.all([
      BookingArchive.countDocuments(),
      BookingArchive.distinct('academicYear'),
      BookingArchive.find()
        .sort({ archivedAt: -1 })
        .limit(10)
        .populate('student', 'fullName email')
        .populate('room', 'roomNumber roomType')
    ]);
    
    const yearStats = await Promise.all(
      academicYears.map(async (year) => {
        const [semester1Count, semester2Count] = await Promise.all([
          BookingArchive.countDocuments({ academicYear: year, semester: 1 }),
          BookingArchive.countDocuments({ academicYear: year, semester: 2 })
        ]);
        
        return {
          academicYear: year,
          semester1: semester1Count,
          semester2: semester2Count,
          total: semester1Count + semester2Count
        };
      })
    );
    
    res.json({
      totalArchived,
      academicYears: yearStats,
      recentArchives
    });
  } catch (error) {
    console.error('Get archive stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};