const { Settings } = require('../models');

/**
 * Middleware to check if the booking portal is accessible
 * Verifies if the portal is enabled and if the current time is within the open/close time window
 */
exports.checkBookingPortalAccess = async (req, res, next) => {
  try {
    // Skip access check for admin users - they can always create bookings
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // Get booking portal settings
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.status(503).json({ 
        message: 'Booking portal is currently unavailable. Please try again later.' 
      });
    }

    // Check if booking portal is enabled
    if (!settings.bookingPortalEnabled) {
      return res.status(403).json({ 
        message: 'Booking portal is currently disabled. Please contact administration for assistance.' 
      });
    }

    const now = new Date();
    const openTime = settings.bookingPortalOpenDateTime ? new Date(settings.bookingPortalOpenDateTime) : null;
    const closeTime = settings.bookingPortalCloseDateTime ? new Date(settings.bookingPortalCloseDateTime) : null;

    // Check if current time is within the booking portal open/close window
    if (openTime && now < openTime) {
      return res.status(403).json({ 
        message: `Booking portal is not yet open. It will open on ${openTime.toLocaleString()}.` 
      });
    }

    if (closeTime && now > closeTime) {
      return res.status(403).json({ 
        message: `Booking portal is now closed. It was open until ${closeTime.toLocaleString()}.` 
      });
    }

    // If all checks pass, proceed to the next middleware/controller
    next();
  } catch (error) {
    console.error('Booking portal access check error:', error);
    res.status(500).json({ message: 'Server error checking booking portal access' });
  }
};