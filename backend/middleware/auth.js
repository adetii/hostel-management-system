const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { getSession, touchSession, getCookieName } = require('../utils/sessionService');
const cacheService = require('../utils/cacheService');

const auth = async (req, res, next) => {
  try {
    // Get tab-scoped cookie name
    const cookieName = getCookieName(req.tabId);
    const sessionId = req.cookies?.[cookieName];

    if (!sessionId) {
      return res.status(401).json({ message: 'Access denied. No session.' });
    }

    // Load and refresh sliding TTL
    const session = await getSession(sessionId);
    if (!session) {
      return res.status(401).json({ message: 'Session expired or invalid.' });
    }

    // Validate tab context if session has tab ID
    if (session.tabId && req.tabId && session.tabId !== req.tabId) {
      return res.status(401).json({ message: 'Invalid tab context.' });
    }

    const refreshed = await touchSession(sessionId, session.userId);
    if (!refreshed) {
      return res.status(401).json({ message: 'Session expired.' });
    }

    // Load user by role with caching
    const role = Array.isArray(refreshed.roles) ? refreshed.roles[0] : refreshed.roles;
    const userCacheKey = cacheService.getUserKey(refreshed.userId, role);
    
    let user = await cacheService.get(userCacheKey);
    if (!user) {
      if (role === 'student') {
        user = await User.findById(refreshed.userId).select('-password');
      } else {
        user = await Admin.findById(refreshed.userId).select('-password');
      }
      
      if (user) {
        // Cache user for 30 minutes
        await cacheService.set(userCacheKey, user, cacheService.getTTL('user_profiles'));
      }
    } else {
      // If user is cached, still verify they exist in DB to handle deletions
      let dbUser;
      if (role === 'student') {
        dbUser = await User.findById(refreshed.userId).select('-password');
      } else {
        dbUser = await Admin.findById(refreshed.userId).select('-password');
      }
      
      if (!dbUser) {
        // User was deleted from DB, clear cache and reject
        await cacheService.del(userCacheKey);
        return res.status(401).json({ message: 'Account not found' });
      }
      
      // Update cache with fresh data if user exists
      user = dbUser;
      await cacheService.set(userCacheKey, user, cacheService.getTTL('user_profiles'));
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Account inactive or not found' });
    }

    req.user = user;
    req.userId = refreshed.userId;
    req.userRole = role;
    req.sessionId = sessionId;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Admin middleware
const isAdmin = (req, res, next) => {
  if (req.userRole && (req.userRole === 'admin' || req.userRole === 'super_admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

// Student middleware
const isStudent = (req, res, next) => {
  if (req.userRole && req.userRole === 'student') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Student role required.' });
  }
};

// Super Admin middleware
const isSuperAdmin = (req, res, next) => {
  if (req.userRole && req.userRole === 'super_admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Super Admin role required.' });
  }
};

// Admin or Super Admin middleware
const isAdminOrSuperAdmin = (req, res, next) => {
  if (req.userRole && (req.userRole === 'admin' || req.userRole === 'super_admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin or Super Admin role required.' });
  }
};

// Emergency lockdown check with caching
const checkEmergencyLockdown = async (req, res, next) => {
  try {
    const Settings = require('../models/Settings');
    
    // Fetch settings directly (no cache)
    const settings = await Settings.findOne();
    
    if (settings && settings.emergencyLockdown) {
      // Allow admins and super admins to bypass emergency lockdown
      if (req.userRole === 'super_admin' || req.userRole === 'admin') {
        return next();
      }
      
      return res.status(503).json({ 
        message: 'System is under emergency lockdown. Please try again later.',
        emergencyLockdown: true
      });
    }
    
    next();
  } catch (error) {
    console.error('Emergency lockdown check error:', error);
    next(); // Continue on error to avoid blocking access
  }
};

module.exports = { 
  auth, 
  isAdmin, 
  isStudent, 
  isSuperAdmin, 
  isAdminOrSuperAdmin,
  checkEmergencyLockdown 
};