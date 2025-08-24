const express = require('express');
const mongoose = require('mongoose');
const { User } = require('../models');
const { auth, isAdmin, isStudent, isSuperAdmin, isAdminOrSuperAdmin, checkEmergencyLockdown } = require('../middleware/auth');
const { csrfProtect } = require('../middleware/csrf');
const { checkBookingPortalAccess } = require('../middleware/bookingPortal');

// Import controllers
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const studentController = require('../controllers/studentController');
const roomController = require('../controllers/roomController');
const bookingController = require('../controllers/bookingController');
const settingsController = require('../controllers/settingsController');
const superAdminController = require('../controllers/superAdminController');
const contactController = require('../controllers/contactController');

const router = express.Router();

// ==============================================
// TAB-SCOPED ROUTES (for multi-session support)
// ==============================================

// Define middleware first
const extractTabContext = (req, res, next) => {
  const tabId = req.params.tabId || req.query.tabId;
  if (tabId) {
    req.tabId = tabId;
  }
  next();
};

// Apply middleware
router.use(extractTabContext);

// Student authentication routes (NO CSRF for register/login)
router.post('/tab/:tabId/student/register', extractTabContext, checkEmergencyLockdown, studentController.registerStudent);
router.post('/tab/:tabId/student/login', extractTabContext, checkEmergencyLockdown, studentController.loginStudent);
router.post('/tab/:tabId/student/change-password', extractTabContext, auth, csrfProtect, checkEmergencyLockdown, studentController.changePassword);

// ================================================================
// TAB-SCOPED AUTH ROUTES (NO CSRF for register/login/forgot/reset)
// ================================================================
router.post('/tab/:tabId/auth/register', extractTabContext, authController.register);
router.post('/tab/:tabId/auth/login', extractTabContext, authController.login);
router.post('/tab/:tabId/auth/forgot-password', extractTabContext, authController.forgotPassword);
router.post('/tab/:tabId/auth/reset-password', extractTabContext, authController.resetPassword);
router.get('/tab/:tabId/auth/me', extractTabContext, auth, checkEmergencyLockdown, authController.getCurrentUser);
router.post('/tab/:tabId/auth/logout', extractTabContext, auth, csrfProtect, authController.logout);

// CSRF token endpoint (protected, client calls after login)
router.get('/tab/:tabId/auth/csrf-token', extractTabContext, auth, authController.getCsrfToken);

// Session management (authenticated routes with CSRF)
router.get('/tab/:tabId/auth/sessions', extractTabContext, auth, authController.listSessions);
router.delete('/tab/:tabId/auth/sessions/:id', extractTabContext, auth, csrfProtect, authController.revokeSession);

// ================================================================
// TAB-SCOPED ADMIN MANAGEMENT ROUTES (all authenticated with CSRF)
// ================================================================
router.get('/tab/:tabId/admins', extractTabContext, auth, isSuperAdmin, adminController.getAllAdmins);
router.get('/tab/:tabId/admins/:id', extractTabContext, auth, isAdminOrSuperAdmin, adminController.getAdminById);
router.put('/tab/:tabId/admins/:id', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, adminController.updateAdmin);
router.put('/tab/:tabId/admins/:id/status', extractTabContext, auth, csrfProtect, isSuperAdmin, adminController.toggleAdminStatus);
router.delete('/tab/:tabId/admins/:id', extractTabContext, auth, csrfProtect, isSuperAdmin, adminController.deleteAdmin);

// Admin public content (tab-scoped)
router.get('/tab/:tabId/admin/public-content', extractTabContext, auth, isAdminOrSuperAdmin, adminController.getPublicContent);
router.put('/tab/:tabId/admin/public-content', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, adminController.updatePublicContent);

// ===========================================
// TAB-SCOPED STUDENT MANAGEMENT ROUTES
// ===========================================
router.post('/tab/:tabId/students', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, studentController.createStudent);
router.get('/tab/:tabId/students', extractTabContext, auth, isAdminOrSuperAdmin, studentController.getStudents);

// Add the new student search route for admin
router.get('/tab/:tabId/students/search', extractTabContext, auth, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const students = await User.find({
      isActive: true,
      $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('_id fullName email programmeOfStudy level gender phoneNumber isActive')
    .limit(10);

    res.json(students);
  } catch (error) {
    console.error('Search students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/tab/:tabId/students/:id', extractTabContext, auth, checkEmergencyLockdown, studentController.getStudentById);
router.put('/tab/:tabId/students/:id', extractTabContext, auth, csrfProtect, checkEmergencyLockdown, studentController.updateStudent);
router.delete('/tab/:tabId/students/:id', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, studentController.deleteStudent);
router.put('/tab/:tabId/students/:id/status', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, studentController.toggleStudentStatus);
router.get('/tab/:tabId/students/:id/bookings', extractTabContext, auth, checkEmergencyLockdown, studentController.getStudentBookings);

// ===========================================
// TAB-SCOPED ROOM MANAGEMENT ROUTES
// ===========================================
router.get('/tab/:tabId/rooms', extractTabContext, auth, checkEmergencyLockdown, roomController.getRooms);
router.get('/tab/:tabId/rooms/available', extractTabContext, auth, checkEmergencyLockdown, roomController.getAvailableRooms);

// Add the new gender-filtered available rooms route for admin
router.get('/tab/:tabId/rooms/available-by-gender', extractTabContext, auth, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { gender } = req.query;

    if (!gender || !['male', 'female'].includes(String(gender))) {
      return res.status(400).json({ message: 'Gender parameter is required and must be male or female' });
    }

    const Room = require('../models/Room');
    const { User, RoomAssignment } = require('../models');

    // 1) Get all rooms that are marked available and have space
    const rooms = await Room.find({ 
      isAvailable: true,
      $expr: { $lt: ['$currentOccupancy', '$capacity'] }
    }).sort({ roomNumber: 1 });

    if (!rooms.length) {
      return res.json([]);
    }

    // 2) Fetch all active assignments for these rooms with user gender info
    const roomIds = rooms.map(r => r._id);

    const assignments = await RoomAssignment.find({ 
      roomId: { $in: roomIds }, 
      status: 'active' 
    }).populate('studentId', 'gender');

    // 3) Group assignments by roomId
    const assignmentsByRoomId = assignments.reduce((acc, assignment) => {
      const roomIdStr = assignment.roomId.toString();
      acc[roomIdStr] = acc[roomIdStr] || [];
      acc[roomIdStr].push(assignment);
      return acc;
    }, {});

    // 4) Filter rooms that have space and match gender requirement
    const availableRooms = rooms.filter(room => {
      const roomIdStr = room._id.toString();
      const roomAssignments = assignmentsByRoomId[roomIdStr] || [];
      
      // Must have available space
      const hasSpace = room.currentOccupancy < room.capacity;
      if (!hasSpace) return false;
      
      // Empty rooms are available for any gender
      if (roomAssignments.length === 0) return true;
      
      // All current occupants must match the requested gender
      return roomAssignments.every(assignment => 
        assignment.studentId && assignment.studentId.gender === gender
      );
    });

    res.json(availableRooms);
  } catch (error) {
    console.error('Get available rooms by gender error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/tab/:tabId/rooms/:id', extractTabContext, auth, checkEmergencyLockdown, roomController.getRoomById);
router.post('/tab/:tabId/rooms', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, roomController.createRoom);
router.put('/tab/:tabId/rooms/:id', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, roomController.updateRoom);
router.delete('/tab/:tabId/rooms/:id', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, roomController.deleteRoom);
router.put('/tab/:tabId/rooms/:id/status', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, roomController.updateRoomStatus);
router.get('/tab/:tabId/rooms/:id/occupants', extractTabContext, auth, roomController.getRoomOccupants);

// ===========================================
// TAB-SCOPED BOOKING MANAGEMENT ROUTES
// ===========================================
router.get('/tab/:tabId/bookings', extractTabContext, auth, isAdminOrSuperAdmin, bookingController.getBookings);
router.get('/tab/:tabId/bookings/:id', extractTabContext, auth, checkEmergencyLockdown, bookingController.getBookingById);
router.post('/tab/:tabId/bookings', extractTabContext, auth, csrfProtect, checkEmergencyLockdown, checkBookingPortalAccess, bookingController.createBooking);

// Add the new admin-assisted booking route
router.post('/tab/:tabId/bookings/admin-create', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, bookingController.createBookingForStudent);
router.put('/tab/:tabId/bookings/:id/room', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, bookingController.updateBookingRoom);
router.put('/tab/:tabId/bookings/:id/status', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, bookingController.updateBookingStatus);
router.post('/tab/:tabId/bookings/:id/cancel', extractTabContext, auth, csrfProtect, checkEmergencyLockdown, bookingController.cancelBooking);
router.delete('/tab/:tabId/bookings/:id', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, bookingController.deleteBooking);
router.delete('/tab/:tabId/bookings', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, bookingController.clearAllBookings);

// ===========================================
// TAB-SCOPED SETTINGS ROUTES
// ===========================================
router.get('/tab/:tabId/settings', extractTabContext, auth, isAdminOrSuperAdmin, settingsController.getSettings);
router.put('/tab/:tabId/settings', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, settingsController.updateSettings);
router.put('/tab/:tabId/settings/maintenance', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, settingsController.toggleMaintenanceMode);
router.put('/tab/:tabId/settings/theme', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, settingsController.updateTheme);
router.put('/tab/:tabId/settings/smtp', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, settingsController.updateSmtpConfig);
router.get('/tab/:tabId/settings/portal-schedule', extractTabContext, auth, settingsController.getPortalScheduleStatus);
router.post('/tab/:tabId/settings/send-notice', extractTabContext, auth, csrfProtect, isAdminOrSuperAdmin, settingsController.uploadAttachment, settingsController.sendNoticeToStudents);
router.get('/tab/:tabId/settings/public', extractTabContext, settingsController.getPublicSettings);

// ===========================================
// TAB-SCOPED SUPER ADMIN ROUTES
// ===========================================
// TAB-SCOPED SUPER ADMIN ROUTES
router.get('/tab/:tabId/super-admin/admins', extractTabContext, auth, isSuperAdmin, superAdminController.getAllAdmins);
router.post('/tab/:tabId/super-admin/admins', extractTabContext, auth, csrfProtect, isSuperAdmin, superAdminController.createAdmin);
router.put('/tab/:tabId/super-admin/admins/:adminId', extractTabContext, auth, csrfProtect, isSuperAdmin, superAdminController.updateAdmin);
router.delete('/tab/:tabId/super-admin/admins/:adminId', extractTabContext, auth, csrfProtect, isSuperAdmin, superAdminController.deleteAdmin);
router.put('/tab/:tabId/super-admin/admins/:adminId/status', extractTabContext, auth, csrfProtect, isSuperAdmin, superAdminController.updateAdminStatus);
router.get('/tab/:tabId/super-admin/content', extractTabContext, auth, isSuperAdmin, superAdminController.getPublicContent);
// REMOVE this line - it's the duplicate that's causing the conflict:
// router.put('/tab/:tabId/super-admin/content/:type', extractTabContext, auth, csrfProtect, isSuperAdmin, superAdminController.updatePublicContent);

// Add missing tab-scoped content management routes to match frontend editor
router.post('/tab/:tabId/super-admin/content', extractTabContext, auth, csrfProtect, isSuperAdmin, superAdminController.createPublicContent);

// Put the :id route BEFORE the :type route and use ObjectId pattern
router.put('/tab/:tabId/super-admin/content/:id([0-9a-fA-F]{24})', extractTabContext, auth, csrfProtect, isSuperAdmin, (req, res, next) => {
  return superAdminController.updatePublicContentById(req, res, next);
});

// Keep the :type route after, restrict to letters/dashes
router.put('/tab/:tabId/super-admin/content/:type([a-zA-Z-]+)', extractTabContext, auth, csrfProtect, isSuperAdmin, superAdminController.updatePublicContent);
router.patch('/tab/:tabId/super-admin/content/:id/status', extractTabContext, auth, csrfProtect, isSuperAdmin, superAdminController.updateContentStatus);
router.get('/tab/:tabId/super-admin/content/:id/versions', extractTabContext, auth, isSuperAdmin, superAdminController.getContentVersions);
router.post('/tab/:tabId/super-admin/content/restore-version/:versionId', extractTabContext, auth, csrfProtect, isSuperAdmin, superAdminController.restoreContentVersion);

// Emergency Control Routes
router.get('/tab/:tabId/super-admin/emergency-status', extractTabContext, auth, isSuperAdmin, superAdminController.getEmergencyStatus);
router.post('/tab/:tabId/super-admin/emergency-lock', extractTabContext, auth, csrfProtect, isSuperAdmin, superAdminController.activateEmergencyLock);
router.post('/tab/:tabId/super-admin/emergency-unlock', extractTabContext, auth, csrfProtect, isSuperAdmin, superAdminController.deactivateEmergencyLock);
router.put('/tab/:tabId/super-admin/emergency-lockdown', extractTabContext, auth, csrfProtect, isSuperAdmin, superAdminController.toggleEmergencyLockdown);

// ========================================================================
// LEGACY ROUTES (for backward compatibility) - NO CSRF for auth endpoints
// ========================================================================

// Student authentication routes - apply checkEmergencyLockdown BEFORE login
router.post('/student/register', checkEmergencyLockdown, studentController.registerStudent);
router.post('/student/login', checkEmergencyLockdown, studentController.loginStudent);
router.post('/student/change-password', auth, csrfProtect, checkEmergencyLockdown, studentController.changePassword);

// ============================================================================
// LEGACY AUTH ROUTES (for backward compatibility) - NO CSRF for auth endpoints
// ============================================================================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.get('/auth/me', auth, checkEmergencyLockdown, authController.getCurrentUser);
router.post('/auth/logout', auth, csrfProtect, authController.logout);

// CSRF token endpoint (protected, client calls after login)
router.get('/auth/csrf-token', auth, authController.getCsrfToken);

// Session management
router.get('/auth/sessions', auth, authController.listSessions);
router.delete('/auth/sessions/:id', auth, csrfProtect, authController.revokeSession);

// ===========================================
// PUBLIC ROUTES (NO CSRF protection needed)
// ===========================================
router.post('/public/contact', contactController.submitContactForm);

// ===========================================
// SUPER ADMIN PUBLIC CONTENT MANAGEMENT
// ===========================================
router.get('/super-admin/public-content', auth, isSuperAdmin, superAdminController.getPublicContent);
router.put('/super-admin/public-content/:type', auth, csrfProtect, isSuperAdmin, superAdminController.updatePublicContent);

// PUBLIC content by type (tab-scoped) - new route to support frontend baseURL /api/tab/:tabId
router.get('/tab/:tabId/public/content/:type', extractTabContext, superAdminController.getPublicContentByType);
router.get('/settings/attachments/:filename', settingsController.downloadAttachment);

// Legacy/public non-tabbed routes
router.get('/public/content/:type', superAdminController.getPublicContentByType);
router.get('/super-admin/public-content', auth, isSuperAdmin, superAdminController.getPublicContent);
router.put('/super-admin/public-content/:type', auth, csrfProtect, isSuperAdmin, superAdminController.updatePublicContent);

module.exports = router;

