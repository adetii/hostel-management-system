const { Settings } = require('../models');
const { validationResult } = require('express-validator');
const { sendNoticeToStudents } = require('../utils/email');
const { User } = require('../models');
const cacheService = require('../utils/cacheService');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private/Admin
// getSettings
exports.getSettings = async (req, res) => {
  try {
    const cacheKey = cacheService.getSettingsKey();
    
    const settings = await cacheService.getOrSet(cacheKey, async () => {
      return await Settings.findOne();
    }, cacheService.getTTL('settings'));

    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get public system settings (accessible to all authenticated users)
// @route   GET /api/settings/public
// @access  Private (any authenticated user)
// getPublicSettings
exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    const publicSettings = {
      bookingPortalEnabled: settings.bookingPortalEnabled,
      bookingPortalOpenDateTime: settings.bookingPortalOpenDateTime,
      bookingPortalCloseDateTime: settings.bookingPortalCloseDateTime
    };

    res.json(publicSettings);
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get portal schedule status
// @route   GET /api/settings/portal-schedule
// @access  Private
exports.getPortalScheduleStatus = async (req, res) => {
  try {
    const portalScheduler = req.app.get('portalScheduler');
    const nextChange = await portalScheduler.getNextStatusChange();
    
    const settings = await Settings.findOne();
    const now = new Date();
    const openTime = settings?.bookingPortalOpenDateTime ? new Date(settings.bookingPortalOpenDateTime) : null;
    const closeTime = settings?.bookingPortalCloseDateTime ? new Date(settings.bookingPortalCloseDateTime) : null;
    
    let currentStatus = 'closed';
    if (openTime && closeTime && now >= openTime && now <= closeTime) {
      currentStatus = 'open';
    } else if (openTime && now < openTime) {
      currentStatus = 'scheduled';
    }
    
    res.json({
      currentStatus,
      isEnabled: settings?.bookingPortalEnabled || false,
      openTime: openTime?.toISOString(),
      closeTime: closeTime?.toISOString(),
      nextChange
    });
  } catch (error) {
    console.error('Get portal schedule status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get settings to update from request body
    const { bookingPortalEnabled, bookingPortalOpenDateTime, bookingPortalCloseDateTime } = req.body;

    // Enforce both open and close dates together if either is provided
    const hasOpen = bookingPortalOpenDateTime !== undefined && bookingPortalOpenDateTime !== null && bookingPortalOpenDateTime !== '';
    const hasClose = bookingPortalCloseDateTime !== undefined && bookingPortalCloseDateTime !== null && bookingPortalCloseDateTime !== '';

    if ((hasOpen && !hasClose) || (!hasOpen && hasClose)) {
      return res.status(400).json({ message: 'Both bookingPortalOpenDateTime and bookingPortalCloseDateTime are required.' });
    }

    // Validate open < close when both provided
    if (hasOpen && hasClose) {
      const open = new Date(bookingPortalOpenDateTime);
      const close = new Date(bookingPortalCloseDateTime);
      if (isNaN(open.getTime()) || isNaN(close.getTime())) {
        return res.status(400).json({ message: 'Invalid date values for booking portal schedule.' });
      }
      if (open >= close) {
        return res.status(400).json({ message: 'Portal open date/time must be before close date/time.' });
      }
    }

    // Find or create settings
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create new settings if none exist
      settings = await Settings.create({
        bookingPortalEnabled: bookingPortalEnabled || false,
        bookingPortalOpenDateTime,
        bookingPortalCloseDateTime
      });
    } else {
      // Update existing settings
      settings.set({
        bookingPortalEnabled: bookingPortalEnabled !== undefined ? bookingPortalEnabled : settings.bookingPortalEnabled,
        bookingPortalOpenDateTime: bookingPortalOpenDateTime !== undefined ? bookingPortalOpenDateTime : settings.bookingPortalOpenDateTime,
        bookingPortalCloseDateTime: bookingPortalCloseDateTime !== undefined ? bookingPortalCloseDateTime : settings.bookingPortalCloseDateTime
      });
      await settings.save();
    }

    // Invalidate settings cache (if cacheService available)
    if (typeof cacheService !== 'undefined' && cacheService.invalidateSettingsCaches) {
      await cacheService.invalidateSettingsCaches();
    }

    // Fetch updated settings
    const updatedSettings = await Settings.findOne();

    // Emit socket event for settings update (if io present)
    const io = req.app.get('io');
    if (io && io.emit) {
      // Notify all users about booking portal changes
      io.emit('settings-updated', {
        bookingPortalEnabled: updatedSettings.bookingPortalEnabled,
        bookingPortalOpenDateTime: updatedSettings.bookingPortalOpenDateTime,
        bookingPortalCloseDateTime: updatedSettings.bookingPortalCloseDateTime
      });
      
      // Notify admins about all settings changes (if admin room exists)
      if (io.to) {
        io.to('admin-room').emit('admin-settings-updated', updatedSettings);
      }
    }

    // After updating settings, trigger immediate portal status check (if portalScheduler attached)
    const portalScheduler = req.app.get('portalScheduler');
    if (portalScheduler && typeof portalScheduler.checkAndUpdatePortalStatus === 'function') {
      await portalScheduler.checkAndUpdatePortalStatus();
    }
    return res.json(updatedSettings);
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// @desc    Toggle maintenance mode
// @route   PUT /api/settings/maintenance
// @access  Private/Admin
exports.toggleMaintenanceMode = async (req, res) => {
  try {
    const settings = await Settings.findOne();

    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    await settings.update({
      maintenanceMode: !settings.maintenanceMode,
      updatedBy: req.user.id,
    });

    // Invalidate settings cache
    await cacheService.invalidateSettingsCaches();

    res.json(settings);
  } catch (error) {
    console.error('Toggle maintenance mode error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update theme settings
// @route   PUT /api/settings/theme
// @access  Private/Admin
exports.updateTheme = async (req, res) => {
  try {
    const { theme } = req.body;
    const settings = await Settings.findOne();

    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    await settings.update({
      theme,
      updatedBy: req.user.id,
    });

    // Invalidate settings cache
    await cacheService.invalidateSettingsCaches();

    res.json(settings);
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update SMTP settings
// @route   PUT /api/settings/smtp
// @access  Private/Admin
exports.updateSmtpConfig = async (req, res) => {
  try {
    const { smtpConfig } = req.body;
    const settings = await Settings.findOne();

    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    await settings.update({
      smtpConfig,
      updatedBy: req.user.id,
    });

    // Invalidate settings cache
    await cacheService.invalidateSettingsCaches();

    res.json(settings);
  } catch (error) {
    console.error('Update SMTP config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update payment settings
// @route   PUT /api/settings/payment
// @access  Private/Admin
exports.updatePaymentConfig = async (req, res) => {
  try {
    const { paymentConfig } = req.body;
    const settings = await Settings.findOne();

    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    await settings.update({
      paymentConfig,
      updatedBy: req.user.id,
    });

    // Invalidate settings cache
    await cacheService.invalidateSettingsCaches();

    res.json(settings);
  } catch (error) {
    console.error('Update payment config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send notice to all students
// @route   POST /api/settings/send-notice
// @access  Private/Admin
// Add multer import at the top
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/notices');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Update multer configuration to save files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

exports.sendNoticeToStudents = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const attachment = req.file;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    // Get all active students
    const students = await User.find({ isActive: true }).select('email fullName');

    if (students.length === 0) {
      return res.status(404).json({ message: 'No active students found' });
    }

    const studentEmails = students.map(student => student.email);

    // Prepare attachment data for email
    let emailAttachment = null;
    let attachmentUrl = null;
    
    if (attachment) {
      // For email attachment
      emailAttachment = {
        originalname: attachment.originalname,
        buffer: fs.readFileSync(attachment.path),
        mimetype: attachment.mimetype
      };
      
      // For web download
      attachmentUrl = `/api/settings/attachments/${attachment.filename}`;
    }

    // Send emails with attachment
    const result = await sendNoticeToStudents(studentEmails, subject, message, emailAttachment, attachmentUrl);

    res.json({ 
      message: result.totalFailed === 0 
        ? `Notice sent successfully to all ${result.totalSent} students`
        : `Notice sent to ${result.totalSent} students, ${result.totalFailed} failed`,
      success: result.success,
      attachmentUrl: attachmentUrl,
      details: {
        totalRecipients: result.totalRecipients,
        totalSent: result.totalSent,
        totalFailed: result.totalFailed,
        batches: result.batches
      }
    });
  } catch (error) {
    console.error('Send notice error:', error);
    res.status(500).json({ message: 'Failed to send notice' });
  }
};

exports.uploadAttachment = upload.single('attachment');

// Add file download endpoint
exports.downloadAttachment = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/notices', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Send file
    res.download(filePath);
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};