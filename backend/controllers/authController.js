const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, PasswordResetToken } = require('../models');
const Admin = require('../models/Admin');
const Settings = require('../models/Settings');
const cacheService = require('../utils/cacheService');
const { validationResult } = require('express-validator');
const { sendPasswordResetEmail } = require('../utils/email');
const { createSession, deleteSession, listUserSessions, getCookieName } = require('../utils/sessionService');
const { sendVerificationEmail } = require('../utils/email');

// Store refresh tokens in memory (in production, use Redis or database)
const refreshTokens = new Map();

// Generate Access Token (15 minutes)
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Generate Refresh Token (7 days)
const generateRefreshToken = (userId, role) => {
  const refreshToken = jwt.sign(
    { userId, role, type: 'refresh', tokenId: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  // Store refresh token
  refreshTokens.set(userId, refreshToken);
  return refreshToken;
};

// Generate token pair
const generateTokenPair = (userId, role) => {
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId, role);
  return { accessToken, refreshToken };
};

// CSRF cookie name (can override via env)
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'csrf_token';

// Helper to get production cookie options
const getSecureCookieOptions = (tabId, isProd) => ({
  httpOnly: true,
  secure: isProd, // Secure flag for production HTTPS
  sameSite: 'lax', // CSRF protection
  path: tabId ? `/api/tab/${tabId}/` : '/',
});

// Helper to get CSRF cookie options (HttpOnly for synchronizer pattern)
const getCsrfCookieOptions = (tabId, isProd) => ({
  httpOnly: true, // HttpOnly for synchronizer token pattern
  secure: isProd,
  sameSite: 'lax',
  path: tabId ? `/api/tab/${tabId}/` : '/',
});

// @desc    Register a new user
// @route   POST /api/tab/:tabId/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check for emergency lockdown before allowing student registration
    const settings = await Settings.getSingletonSettings();
    if (settings && settings.emergencyLockdown) {
      return res.status(503).json({ 
        message: 'Student registration is temporarily disabled due to emergency lockdown. Please try again later.',
        emergencyLockdown: true
      });
    }

    const { 
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
    } = req.body;

    // Existing or new user
    let user = await User.findOne({ email });

    // 24h expiry and token
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const token = crypto.randomBytes(32).toString('hex');

    // Build management-prefixed base URL
    const managementBaseUrl = (process.env.VITE_MANAGEMENT_SYSTEM_URL 
      || process.env.SITE_URL 
      || `${req.protocol}://${req.get('host')}/management`).replace(/\/+$/, '');

    if (user) {
      if (user.emailVerified) {
        return res.status(400).json({ message: 'User already exists' });
      }

      user.password = password;
      user.fullName = fullName;
      user.gender = gender;
      user.phoneNumber = phoneNumber;
      user.dateOfBirth = dateOfBirth;
      user.programmeOfStudy = programmeOfStudy;
      user.guardianName = guardianName;
      user.guardianPhoneNumber = guardianPhoneNumber;
      user.level = level;
      user.verificationToken = token;
      user.verificationTokenExpiresAt = expiresAt;
      await user.save();

      const verifyUrl = `${managementBaseUrl}/verify-email/${token}`;
      await sendVerificationEmail(user.email, user.fullName, verifyUrl);

      return res.status(200).json({
        message: 'Account pending verification. Please check your email to verify.',
        verificationRequired: true
      });
    }

    user = await User.create({
      email,
      password,
      fullName,
      gender,
      phoneNumber,
      dateOfBirth,
      programmeOfStudy,
      guardianName,
      guardianPhoneNumber,
      level,
      emailVerified: false,
      verificationToken: token,
      verificationTokenExpiresAt: expiresAt
    });

    const verifyUrl = `${managementBaseUrl}/verify-email/${token}`;
    await sendVerificationEmail(user.email, user.fullName, verifyUrl);

    return res.status(201).json({
      message: 'Registration successful. Please verify your email to continue.',
      verificationRequired: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/tab/:tabId/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    let role = 'student';

    if (!user) {
      user = await Admin.findOne({ email });
      if (user) role = user.role; // 'admin' or 'super_admin'
    }

    if (!user) {
      // Clear any existing cookies to avoid stale sessions after a failed login
      const tabPath = req.tabId ? `/api/tab/${req.tabId}/` : '/';
      res.clearCookie(getCookieName(req.tabId), { path: tabPath });
      res.clearCookie(process.env.SESSION_COOKIE_NAME, { path: '/' });
      res.clearCookie(`${CSRF_COOKIE_NAME}_${req.tabId || 'default'}`, { path: tabPath });
      res.clearCookie(`${CSRF_COOKIE_NAME}_default`, { path: '/' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated', accountDeactivated: true });
    }

    const isMatch = await user.checkPassword(password);
    if (!isMatch) {
      // Clear any existing cookies to avoid stale sessions after a failed login
      const tabPath = req.tabId ? `/api/tab/${req.tabId}/` : '/';
      res.clearCookie(getCookieName(req.tabId), { path: tabPath });
      res.clearCookie(process.env.SESSION_COOKIE_NAME, { path: '/' });
      res.clearCookie(`${CSRF_COOKIE_NAME}_${req.tabId || 'default'}`, { path: tabPath });
      res.clearCookie(`${CSRF_COOKIE_NAME}_default`, { path: '/' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Block student login if not verified
    if (role === 'student' && user.emailVerified === false) {
      return res.status(403).json({
        message: 'Email not verified. Please verify your email to log in.',
        emailNotVerified: true
      });
    }

    // Enforce emergency lockdown for students only (admins and super_admins bypass)
    try {
      const settings = await Settings.getSingletonSettings();
      if (settings && settings.emergencyLockdown && role === 'student') {
        return res.status(503).json({
          message: 'System is under emergency lockdown. Please try again later.',
          emergencyLockdown: true
        });
      }
    } catch (lockErr) {
      console.error('Login lockdown check error:', lockErr);
      // Fail-open to avoid blocking admins due to transient errors
    }

    // Create session with tab context
    const { sessionId, session } = await createSession({
      userId: user._id,
      roles: [role],
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      tabId: req.tabId
    });

    const cookieName = getCookieName(req.tabId);
    const isProd = process.env.NODE_ENV === 'production';

    // Set secure session cookie
    res.cookie(cookieName, sessionId, {
      ...getSecureCookieOptions(req.tabId, isProd),
      maxAge: 24 * 60 * 60 * 1000 // 24h
    });

    // Set secure CSRF cookie (HttpOnly for synchronizer pattern)
    res.cookie(`${CSRF_COOKIE_NAME}_${req.tabId || 'default'}`, session.csrfToken, 
      getCsrfCookieOptions(req.tabId, isProd)
    );

    return res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        fullName: role === 'student' ? user.fullName : user.fullName,
        role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Provide CSRF token to authenticated clients
exports.getCsrfToken = async (req, res) => {
  try {
    const cookieName = getCookieName(req.tabId);
    const sessionId = req.cookies?.[cookieName];
    if (!sessionId) return res.status(401).json({ message: 'No session' });

    // Load session to read the CSRF token
    const session = await require('../utils/sessionService').getSession(sessionId);
    if (!session) return res.status(401).json({ message: 'Invalid session' });

    // Build user payload from auth middleware-injected state
    const userDoc = req.user;
    const role = req.userRole;

    const userPayload = userDoc
      ? {
          id: userDoc._id,
          email: userDoc.email,
          fullName: userDoc.fullName,
          role,
          isActive: userDoc.isActive,
        }
      : null;

    // Return token + user + isAuthenticated for frontend hydration
    res.json({
      csrfToken: session.csrfToken,
      user: userPayload,
      isAuthenticated: !!userPayload,
    });
  } catch (error) {
    console.error('Get CSRF token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// In exports.logout
exports.logout = async (req, res) => {
  try {
    const cookieName = getCookieName(req.tabId);
    const tabPath = req.tabId ? `/api/tab/${req.tabId}/` : '/';

    // Clear tab-scoped cookies
    res.clearCookie(cookieName, { path: tabPath });
    res.clearCookie(`${CSRF_COOKIE_NAME}_${req.tabId || 'default'}`, { path: tabPath });

    // Also clear global (non-tab) cookies if present
    res.clearCookie(process.env.SESSION_COOKIE_NAME, { path: '/' });
    res.clearCookie(`${CSRF_COOKIE_NAME}_default`, { path: '/' });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    // Use values set by auth middleware
    const userId = req.userId;
    const role = req.userRole;

    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    let user;
    if (role === 'student') {
      user = await User.findById(userId).select('-password');
    } else {
      user = await Admin.findById(userId).select('-password');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listSessions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessions = await listUserSessions(userId);
    res.json(sessions);
  } catch (error) {
    console.error('List sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.revokeSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    await deleteSession(sessionId);
    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check both User and Admin models
    let user = await User.findOne({ email });
    let userModel = 'User';
    
    if (!user) {
      user = await Admin.findOne({ email });
      userModel = 'Admin';
    }

    if (!user) {
      // Don't reveal whether user exists
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Delete any existing reset tokens for this user
    await PasswordResetToken.deleteMany({ userId: user._id });

    // Create new reset token
    await PasswordResetToken.create({
      userId: user._id,
      userModel,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Build absolute reset URL and send email
    try {
      const siteUrl = process.env.SITE_URL || process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
      const resetUrl = `${siteUrl.replace(/\/$/, '')}/management/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail(user.email, resetUrl);
      res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (emailError) {
      console.error('Password reset email error:', emailError);
      res.status(500).json({ message: 'Error sending password reset email' });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid reset token
    const resetToken = await PasswordResetToken.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() }
    });

    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Find the user
    let user;
    if (resetToken.userModel === 'User') {
      user = await User.findById(resetToken.userId);
    } else {
      user = await Admin.findById(resetToken.userId);
    }

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Delete the reset token
    await PasswordResetToken.deleteOne({ _id: resetToken._id });

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify email by token
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    return res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }
    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.verificationToken = token;
    user.verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const managementBaseUrl =
      (process.env.VITE_MANAGEMENT_SYSTEM_URL || `${req.protocol}://${req.get('host')}/management`).replace(/\/+$/, '');
    const verifyUrl = `${managementBaseUrl}/verify-email/${token}`;
    
    await sendVerificationEmail(user.email, user.fullName, verifyUrl);

    return res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};