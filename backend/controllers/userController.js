const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { sendPasswordResetEmail } = require('../utils/email');

// Register new student
const register = async (req, res) => {
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
      level
    } = req.body;

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const [result] = await pool.execute(
      `INSERT INTO users (
        email, password, full_name, role, gender, phone_number,
        date_of_birth, programme_of_study, level
      ) VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?)`,
      [email, hashedPassword, fullName, gender, phoneNumber, dateOfBirth, programmeOfStudy, level]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: result.insertId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: result.insertId,
        email,
        fullName,
        role: 'student'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error during registration' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const [users] = await pool.execute(
      'SELECT id, email FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: users[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Store reset token
    await pool.execute(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
      [users[0].id, resetToken]
    );
    
    // Build absolute reset URL and send email
    const siteUrl = process.env.SITE_URL || process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${siteUrl.replace(/\/$/, '')}/management/reset-password?token=${encodeURIComponent(resetToken)}`;
    await sendPasswordResetEmail(email, resetUrl);
    
    res.json({ message: 'Password reset instructions sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error processing forgot password request' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token exists and is valid
    const [tokens] = await pool.execute(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, decoded.id]
    );

    // Delete used token
    await pool.execute(
      'DELETE FROM password_reset_tokens WHERE token = ?',
      [token]
    );

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

// Update student level
const updateLevel = async (req, res) => {
  try {
    const { level } = req.body;
    const userId = req.user.id;

    await pool.execute(
      'UPDATE users SET level = ? WHERE id = ?',
      [level, userId]
    );

    res.json({ message: 'Level updated successfully' });
  } catch (error) {
    console.error('Update level error:', error);
    res.status(500).json({ message: 'Error updating level' });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  updateLevel
};