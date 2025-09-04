const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

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
    enum: ['active', 'inactive'],
    default: 'active'
  },
  academicYear: {
    type: String,
    required: true,
    default: '2025/26'
  },
  semester: {
    type: Number,
    enum: [1, 2],
    required: true,
    default: 1
  },
  createdByAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  publicId: {
    type: String,
    unique: true,
    index: true,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add compound index for efficient queries
bookingSchema.index({ studentId: 1, academicYear: 1, semester: 1 });
bookingSchema.index({ status: 1, academicYear: 1, semester: 1 });
// Ensure unique index on publicId
bookingSchema.index({ publicId: 1 }, { unique: true, sparse: true });

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

// Helper method to get academic period string
bookingSchema.methods.getAcademicPeriod = function() {
  return `${this.academicYear} Semester ${this.semester}`;
};

// Static method to get current academic settings
bookingSchema.statics.getCurrentAcademicSettings = function() {
  return {
    academicYear: '2025/26',
    semester: 1
  };
};

// Generate publicId if missing
bookingSchema.pre('save', function(next) {
  if (!this.publicId) {
    this.publicId = uuidv4();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);