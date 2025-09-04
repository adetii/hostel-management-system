const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const roomAssignmentSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false // Optional for legacy assignments
  },
  // ADD ACADEMIC YEAR FIELDS
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
  assignedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    required: true,
    default: 'active'
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

// Updated compound index to include academic fields
roomAssignmentSchema.index({ 
  roomId: 1, 
  studentId: 1, 
  academicYear: 1, 
  semester: 1, 
  status: 1 
}, { unique: true });

// Index for academic period queries
roomAssignmentSchema.index({ academicYear: 1, semester: 1, status: 1 });
// Ensure unique index on publicId
roomAssignmentSchema.index({ publicId: 1 }, { unique: true, sparse: true });

// Populate virtual fields
roomAssignmentSchema.virtual('room', {
  ref: 'Room',
  localField: 'roomId',
  foreignField: '_id',
  justOne: true
});

roomAssignmentSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

roomAssignmentSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true
});

// Helper method to get academic period string
roomAssignmentSchema.methods.getAcademicPeriod = function() {
  return `${this.academicYear} Semester ${this.semester}`;
};

// Generate publicId if missing
roomAssignmentSchema.pre('save', function(next) {
  if (!this.publicId) {
    this.publicId = uuidv4();
  }
  next();
});

module.exports = mongoose.model('RoomAssignment', roomAssignmentSchema);