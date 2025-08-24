const mongoose = require('mongoose');

const publicContentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['terms', 'privacy', 'rules', 'faq']
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for backward compatibility
publicContentSchema.virtual('updatedByAdmin', {
  ref: 'Admin',
  localField: 'lastUpdatedBy',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('PublicContent', publicContentSchema);