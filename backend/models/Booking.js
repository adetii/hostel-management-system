const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  termsAgreed: {
    type: Boolean,
    required: true,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active'
  },
  createdByAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Populate virtual fields
bookingSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

bookingSchema.virtual('room', {
  ref: 'Room',
  localField: 'roomId',
  foreignField: '_id',
  justOne: true
});

bookingSchema.virtual('createdBy', {
  ref: 'Admin',
  localField: 'createdByAdmin',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Booking', bookingSchema);