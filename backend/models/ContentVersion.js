const mongoose = require('mongoose');

const contentVersionSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PublicContent',
    required: true
  },
  version: {
    type: Number,
    required: true
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
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields for backward compatibility
contentVersionSchema.virtual('publicContent', {
  ref: 'PublicContent',
  localField: 'contentId',
  foreignField: '_id',
  justOne: true
});

contentVersionSchema.virtual('updatedByAdmin', {
  ref: 'Admin',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('ContentVersion', contentVersionSchema);