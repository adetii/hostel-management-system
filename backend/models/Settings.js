const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  bookingPortalEnabled: {
    type: Boolean,
    required: true,
    default: false
  },
  bookingPortalOpenDateTime: {
    type: Date
  },
  bookingPortalCloseDateTime: {
    type: Date
  },
  emergencyLockdown: {
    type: Boolean,
    default: false
  },
  emergencyLockedAt: {
    type: Date
  },
  emergencyLockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  emergencyLockReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure only one settings document exists
settingsSchema.statics.getSingletonSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);