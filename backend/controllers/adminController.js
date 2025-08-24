const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin, User, PublicContent, Settings } = require('../models');
const { sendPasswordResetEmail } = require('../utils/email');
const cacheService = require('../utils/cacheService');

// Admin Registration
exports.registerAdmin = async (req, res) => {
  try {
    const {
      email,
      password,
      confirmPassword,
      fullName,
      gender,
      phoneNumber,
      dateOfBirth,
      role = 'admin'
    } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Mongoose
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const admin = await Admin.create({
      email,
      password,
      fullName,
      role,
      gender,
      phoneNumber,
      dateOfBirth
    });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        isActive: admin.isActive
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin Login
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔍 Admin login attempt:', { email, passwordLength: password?.length });

    // Mongoose
    const admin = await Admin.findOne({ email });
    console.log('👤 Admin found:', admin ? 'YES' : 'NO', admin ? `Role: ${admin.role}` : '');
    
    if (!admin) {
      console.log('❌ Admin not found in database');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      console.log('❌ Admin account is inactive');
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    const isPasswordValid = await admin.checkPassword(password);
    console.log('🔐 Password valid:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('❌ Invalid password provided');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Keep response consistent; no nested export
    return res.json({
      message: 'Login successful',
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        isActive: admin.isActive
      }
    });
  } catch (error) {
    console.error('💥 Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get All Admins (Super Admin only)
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({}).select('-password').sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Admin by ID
exports.getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    console.error('Get admin by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Admin
exports.updateAdmin = async (req, res) => {
  try {
    const { fullName, phoneNumber, gender, dateOfBirth, email } = req.body;
    
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Email change: ensure unique across Admins and Users
    if (email !== undefined && email !== admin.email) {
      const existingUser = await User.findOne({ email });
      const existingAdmin = await Admin.findOne({ email, _id: { $ne: admin._id } });
      if (existingUser || existingAdmin) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      admin.email = String(email).toLowerCase();
    }

    if (fullName !== undefined) admin.fullName = fullName;
    if (phoneNumber !== undefined) admin.phoneNumber = phoneNumber;
    if (gender !== undefined) admin.gender = gender;
    if (dateOfBirth !== undefined) admin.dateOfBirth = dateOfBirth;

    await admin.save();

    res.json({
      message: 'Admin updated successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        phoneNumber: admin.phoneNumber,
        gender: admin.gender,
        dateOfBirth: admin.dateOfBirth,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle Admin Status (Super Admin only)
exports.toggleAdminStatus = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    admin.isActive = !admin.isActive;
    await admin.save();
    
    res.json({
      message: `Admin ${admin.isActive ? 'activated' : 'deactivated'} successfully`,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        isActive: admin.isActive
      }
    });
  } catch (error) {
    console.error('Toggle admin status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete Admin (Super Admin only)
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    await admin.deleteOne();
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const isCurrentPasswordValid = await admin.checkPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    admin.password = newPassword; // pre-save hook will hash
    await admin.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Activity Logs (Admin/Super Admin)
// Remove the entire getActivityLogs function (lines 258-283)

// Get Public Content
exports.getPublicContent = async (req, res) => {
  try {
    const cacheKey = cacheService.getPublicContentKey();
    
    const content = await cacheService.getOrSet(cacheKey, async () => {
      // Mongoose: sort by createdAt desc
      return await PublicContent.find({}).sort({ createdAt: -1 });
    }, cacheService.getTTL('public_content'));
    
    res.json(content);
  } catch (error) {
    console.error('Get public content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Public Content
exports.updatePublicContent = async (req, res) => {
  try {
    const { type, title, content, isActive } = req.body;

    // Ensure type is valid if you enforce it at route level; schema already validates.
    const updated = await PublicContent.findOneAndUpdate(
      { type },
      {
        $set: {
          title,
          content,
          isActive: isActive !== undefined ? isActive : true,
          lastUpdatedBy: req.user.id
        }
      },
      { new: true, upsert: true }
    );

    // Invalidate public content caches
    await cacheService.invalidatePublicContentCaches();

    res.json({
      message: 'Public content updated successfully',
      content: updated
    });
  } catch (error) {
    console.error('Update public content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};