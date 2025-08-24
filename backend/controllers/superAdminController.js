const { User, Admin, PublicContent, Settings, ContentVersion } = require('../models');
const bcrypt = require('bcryptjs');
// Remove Sequelize Op import - no longer needed
const cacheService = require('../utils/cacheService');

// Admin Management
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({ role: 'admin' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { email, password, fullName, phoneNumber, gender, dateOfBirth } = req.body;
    
    // Validation
    if (!email || !password || !fullName || !phoneNumber || !gender || !dateOfBirth) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check both User and Admin models for existing email
    const existingUser = await User.findOne({ email });
    const existingAdmin = await Admin.findOne({ email });
    
    if (existingUser || existingAdmin) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const admin = await Admin.create({
      email,
      password,
      fullName,
      role: 'admin',
      gender,
      phoneNumber,
      dateOfBirth
    });

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        phoneNumber: admin.phoneNumber,
        gender: admin.gender,
        dateOfBirth: admin.dateOfBirth,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { email, password, fullName, phoneNumber, gender, dateOfBirth } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== admin.email) {
      const existingUser = await User.findOne({ email });
      const existingAdmin = await Admin.findOne({ 
        email,
        _id: { $ne: adminId } // Exclude current admin
      });
      
      if (existingUser || existingAdmin) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Prepare update data
    const updateData = {};
    if (email) updateData.email = email;
    if (password) updateData.password = password; // Will be hashed by model hook
    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (gender) updateData.gender = gender;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;

    const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updateData, { new: true }).select('-password');

    res.json({
      message: 'Admin updated successfully',
      admin: {
        id: updatedAdmin._id,
        email: updatedAdmin.email,
        fullName: updatedAdmin.fullName,
        phoneNumber: updatedAdmin.phoneNumber,
        gender: updatedAdmin.gender,
        dateOfBirth: updatedAdmin.dateOfBirth,
        role: updatedAdmin.role,
        isActive: updatedAdmin.isActive,
        createdAt: updatedAdmin.createdAt,
        updatedAt: updatedAdmin.updatedAt
      }
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Prevent super admin from deleting themselves
    if (admin.role === 'super_admin' && admin._id.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Cannot delete your own super admin account' });
    }

    // Prevent deleting super admins
    if (admin.role === 'super_admin') {
      return res.status(400).json({ message: 'Cannot delete super admin accounts' });
    }

    await Admin.findByIdAndDelete(adminId);
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAdminStatus = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { isActive } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Prevent deactivating super admins
    if (admin.role === 'super_admin' && !isActive) {
      return res.status(400).json({ message: 'Cannot deactivate super admin accounts' });
    }

    admin.isActive = isActive;
    await admin.save();

    res.json({
      message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully`,
      admin: {
        id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        isActive: admin.isActive
      }
    });
  } catch (error) {
    console.error('Update admin status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Public Content Management
exports.getPublicContent = async (req, res) => {
  try {
    const cacheKey = cacheService.getPublicContentKey();
    
    const content = await cacheService.getOrSet(cacheKey, async () => {
      return await PublicContent.find()
        .populate('updatedByAdmin', 'fullName email')
        .sort({ createdAt: -1 });
    }, cacheService.getTTL('public_content'));
    
    res.json(content);
  } catch (error) {
    console.error('Get public content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// server/controllers/superAdminController.js (replace updatePublicContent)
const VALID_TYPES = ['terms', 'privacy', 'rules', 'faq'];

/**
 * Update or create public content.
 * Accepts either:
 *  - PUT /super-admin/content/:type   (where :type is one of VALID_TYPES like 'faq')
 *  - PUT /super-admin/content/:id     (where :id is numeric, treated as a PK)
 */
exports.updatePublicContent = async (req, res) => {
  try {
    let { type: param } = req.params;            
    const { title, content } = req.body;
    const actorId = req.userId;  // Changed from req.user?.userId || null to req.userId

    if (!title || !content) {
      return res.status(400).json({ message: 'title and content are required' });
    }

    // Helper: map human titles to enum keys (optional)
    const titleMap = {
      'frequently asked questions': 'faq',
      'faq': 'faq',
      'terms': 'terms',
      'terms and conditions': 'terms',
      'privacy': 'privacy',
      'privacy policy': 'privacy',
      'rules': 'rules',
      'house rules': 'rules'
    };

    // If param looks numeric -> treat as ID
    const isNumeric = /^\d+$/.test(String(param));
    let publicContent;

    if (isNumeric) {
      // Update by id
      publicContent = await PublicContent.findById(param);
      if (!publicContent) {
        return res.status(404).json({ message: 'Content not found' });
      }

      await PublicContent.findByIdAndUpdate(param, {
        title,
        content,
        lastUpdatedBy: actorId
      });

      publicContent = await PublicContent.findById(param);
      return res.json({ message: 'Content updated successfully', content: publicContent });
    }

    // Normalize the param: lower-case and map human-friendly titles to enum keys
    const normalized = String(param).trim().toLowerCase();
    const mappedType = VALID_TYPES.includes(normalized) ? normalized : (titleMap[normalized] || null);

    if (!mappedType) {
      return res.status(400).json({ message: `Invalid content type. Allowed: ${VALID_TYPES.join(', ')}` });
    }

    // Use findOneAndUpdate with upsert for findOrCreate behavior
    const contentRecord = await PublicContent.findOneAndUpdate(
      { type: mappedType },
      {
        type: mappedType,
        title,
        content,
        lastUpdatedBy: actorId,
        isActive: true
      },
      { 
        upsert: true, 
        new: true, 
        setDefaultsOnInsert: true 
      }
    );

    // Add cache invalidation after successful update
    const contentType = contentRecord.type;
    console.log('[CONTENT][UPDATE_BY_TYPE] invalidating caches for type', contentType);
    
    await cacheService.invalidatePublicContentCaches();
    await cacheService.del(cacheService.getPublicContentKey());
    if (contentType) {
      await cacheService.del(cacheService.getPublicContentByTypeKey(contentType));
    }

    return res.json({
      message: 'Content updated successfully',
      content: contentRecord
    });
  } catch (error) {
    console.error('Update public content error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePublicContentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, isActive } = req.body;
    
    const publicContent = await PublicContent.findById(id);
    if (!publicContent) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    // Create version history before updating
    const existingVersions = await ContentVersion.countDocuments({ contentId: id });
    const newVersion = existingVersions + 1;
    
    await ContentVersion.create({
      contentId: publicContent._id,
      version: newVersion,
      title,
      content,
      updatedBy: req.userId  // Changed from req.user.userId to req.userId
    });
    
    // Update the content
    const updatedContent = await PublicContent.findByIdAndUpdate(id, {
      title,
      content,
      isActive,
      lastUpdatedBy: req.userId  // Changed from req.user.userId to req.userId
    }, { new: true });

    // Invalidate public content caches after update
    await cacheService.invalidatePublicContentCaches();

    // Belt-and-suspenders: explicitly delete known keys
    const allKey = cacheService.getPublicContentKey();
    const typeKey = cacheService.getPublicContentByTypeKey(updatedContent.type);
    await cacheService.del(allKey);
    await cacheService.del(typeKey);

    res.json({
      message: 'Content updated successfully',
      content: updatedContent
    });
  } catch (error) {
    console.error('Update public content error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPublicContentByType = async (req, res) => {
  try {
    const { type } = req.params;
    const cacheKey = cacheService.getPublicContentByTypeKey(type);
    
    const content = await cacheService.getOrSet(cacheKey, async () => {
      return await PublicContent.findOne({
        type: type,
        isActive: true 
      });
    }, cacheService.getTTL('public_content'));
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    res.json(content);
  } catch (error) {
    console.error('Get public content by type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createPublicContent = async (req, res) => {
  try {
    const { type, title, content, isActive = true } = req.body;
    
    console.log('Create request received:', { type, title, content: content?.substring(0, 100), isActive });
    
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: 'Invalid content type' });
    }
    
    const publicContent = await PublicContent.create({
      type,
      title,
      content,
      isActive,
      lastUpdatedBy: req.userId  // Changed from req.user.userId to req.userId
    });
    
    console.log('Content created:', publicContent);

    // Invalidate caches after create so list/type endpoints refresh
    console.log('[CONTENT][CREATE] invalidating caches for new content of type', publicContent.type);
    await cacheService.invalidatePublicContentCaches();
    await cacheService.del(cacheService.getPublicContentKey());
    await cacheService.del(cacheService.getPublicContentByTypeKey(publicContent.type));

    res.status(201).json({
      message: 'Content created successfully',
      content: publicContent
    });
  } catch (error) {
    console.error('Create public content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateContentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const publicContent = await PublicContent.findByIdAndUpdate(id, { 
      isActive,
      lastUpdatedBy: req.userId  // Changed from req.user.userId to req.userId
    }, { new: true });
    
    if (!publicContent) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    // Invalidate public content caches after status change
    await cacheService.invalidatePublicContentCaches();

    res.json({
      message: 'Content status updated successfully',
      content: publicContent
    });
  } catch (error) {
    console.error('Update content status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getContentVersions = async (req, res) => {
  try {
    const { id } = req.params;
    
    const versions = await ContentVersion.find({ contentId: id })
      .populate('updatedByAdmin', 'fullName')
      .sort({ version: -1 });
    
    res.json(versions);
  } catch (error) {
    console.error('Get content versions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.restoreContentVersion = async (req, res) => {
  try {
    const { versionId } = req.params;
    
    const version = await ContentVersion.findById(versionId);
    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }
    
    const publicContent = await PublicContent.findById(version.contentId);
    if (!publicContent) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    // Create new version entry for the restoration
    const currentVersionCount = await ContentVersion.countDocuments({ contentId: publicContent._id });
    await ContentVersion.create({
      contentId: publicContent._id,
      version: currentVersionCount + 1,
      title: version.title,
      content: version.content,
      updatedBy: req.userId  // Changed from req.user.userId to req.userId
    });
    
    const updatedContent = await PublicContent.findByIdAndUpdate(publicContent._id, {
      title: version.title,
      content: version.content,
      lastUpdatedBy: req.userId  // Changed from req.user.userId to req.userId
    }, { new: true });
    
    // Invalidate public content caches after restoring a version
    await cacheService.invalidatePublicContentCaches();
    // Explicitly delete known keys to ensure no stale type cache remains
    const allKey = cacheService.getPublicContentKey();
    const typeKey = cacheService.getPublicContentByTypeKey(updatedContent.type);
    await cacheService.del(allKey);
    await cacheService.del(typeKey);

    res.json({
      message: 'Version restored successfully',
      content: updatedContent
    });
  } catch (error) {
    console.error('Restore content version error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Activity Monitoring - commented out due to missing ActivityLog model
// exports.getActivityLogs = async (req, res) => {
//   // This function references ActivityLog model which doesn't exist
//   res.status(501).json({ message: 'Activity logs not implemented' });
// };

// Emergency Controls
exports.getEmergencyStatus = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    
    if (!settings || !settings.emergencyLockdown) {
      return res.json({
        isLocked: false
      });
    }

    // Get lock details if available
    const lockDetails = {
      isLocked: true,
      lockedAt: settings.emergencyLockedAt,
      reason: settings.emergencyLockReason
    };

    // Get admin who locked the system
    if (settings.emergencyLockedBy) {
      const admin = await Admin.findById(settings.emergencyLockedBy)
        .select('fullName email');
      if (admin) {
        lockDetails.lockedBy = {
          id: admin._id,
          fullName: admin.fullName,
          email: admin.email
        };
      }
    }

    res.json(lockDetails);
  } catch (error) {
    console.error('Get emergency status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update emergency lock functions to add socket broadcasts
exports.activateEmergencyLock = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'Emergency lock reason is required' });
    }

    // Use findOneAndUpdate with upsert for findOrCreate behavior
    const settings = await Settings.findOneAndUpdate(
      {},
      { 
        emergencyLockdown: true,
        emergencyLockedAt: new Date(),
        emergencyLockedBy: req.user.userId,
        emergencyLockReason: reason.trim()
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    // Invalidate settings cache so lockdown is enforced immediately
    await cacheService.invalidateSettingsCaches();

    // Emit socket event to notify all users about emergency lockdown
    const io = req.app.get('io');
    if (io) {
      // Emit to all connected users
      io.emit('emergency-lockdown', {
        message: 'Emergency lockdown has been activated. Students will be logged out for security reasons.',
        reason: reason.trim(),
        activatedAt: new Date(),
        activatedBy: req.user.fullName || req.user.email
      });
    }

    res.json({
      message: 'Emergency lock activated successfully',
      isLocked: true,
      lockedAt: settings.emergencyLockedAt,
      reason: settings.emergencyLockReason
    });
  } catch (error) {
    console.error('Activate emergency lock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle Emergency Lockdown (legacy endpoint)
exports.toggleEmergencyLockdown = async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'enabled field must be a boolean' });
    }

    await Settings.findOneAndUpdate(
      {},
      { emergencyLockdown: enabled },
      { upsert: true }
    );

    // Invalidate settings cache for immediate effect
    await cacheService.invalidateSettingsCaches();

    // Emit socket event for lockdown changes
    const io = req.app.get('io');
    if (io) {
      if (enabled) {
        io.emit('emergency-lockdown', {
          message: 'Emergency lockdown has been activated. Students will be logged out for security reasons.',
          reason: 'System lockdown toggled',
          activatedAt: new Date(),
          activatedBy: req.user.fullName || req.user.email
        });
      } else {
        io.emit('emergency-unlock', {
          message: 'Emergency lockdown has been deactivated. Normal operations resumed.',
          deactivatedAt: new Date(),
          deactivatedBy: req.user.fullName || req.user.email
        });
      }
    }

    res.json({ 
      message: `Emergency lockdown ${enabled ? 'activated' : 'deactivated'} successfully`,
      emergencyLockdown: enabled
    });
  } catch (error) {
    console.error('Toggle emergency lockdown error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deactivateEmergencyLock = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    
    if (!settings || !settings.emergencyLockdown) {
      return res.status(400).json({ message: 'Emergency lock is not currently active' });
    }

    await Settings.findOneAndUpdate({}, {
      emergencyLockdown: false,
      emergencyLockedAt: null,
      emergencyLockedBy: null,
      emergencyLockReason: null
    });

    // Invalidate settings cache so unlock is reflected immediately
    await cacheService.invalidateSettingsCaches();

    // Emit socket event to notify about unlock
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency-unlock', {
        message: 'Emergency lockdown has been deactivated. Normal operations resumed.',
        deactivatedAt: new Date(),
        deactivatedBy: req.user.fullName || req.user.email
      });
    }

    res.json({
      message: 'Emergency lock deactivated successfully',
      isLocked: false
    });
  } catch (error) {
    console.error('Deactivate emergency lock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

