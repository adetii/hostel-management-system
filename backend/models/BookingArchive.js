const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bookingArchiveSchema = new mongoose.Schema({
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
    required: true
  },
  termsAgreed: {
    type: Boolean,
    required: true
  },
  status: {
    type: String,
    enum: ['archived'],
    default: 'archived'
  },
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    enum: [1, 2],
    required: true
  },
  originalBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  archivedAt: {
    type: Date,
    default: Date.now
  },
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  createdByAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  // Store original timestamps
  originalCreatedAt: {
    type: Date,
    required: true
  },
  originalUpdatedAt: {
    type: Date,
    required: true
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

// Add indexes for efficient queries
bookingArchiveSchema.index({ studentId: 1, academicYear: 1, semester: 1 });
bookingArchiveSchema.index({ academicYear: 1, semester: 1 });
bookingArchiveSchema.index({ archivedAt: 1 });
bookingArchiveSchema.index({ originalBookingId: 1 }, { unique: true });
// Ensure unique index on publicId
bookingArchiveSchema.index({ publicId: 1 }, { unique: true, sparse: true });

// Populate virtual fields
bookingArchiveSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

bookingArchiveSchema.virtual('room', {
  ref: 'Room',
  localField: 'roomId',
  foreignField: '_id',
  justOne: true
});

bookingArchiveSchema.virtual('archivedByAdmin', {
  ref: 'Admin',
  localField: 'archivedBy',
  foreignField: '_id',
  justOne: true
});

bookingArchiveSchema.virtual('createdBy', {
  ref: 'Admin',
  localField: 'createdByAdmin',
  foreignField: '_id',
  justOne: true
});

// Helper method to get academic period string
bookingArchiveSchema.methods.getAcademicPeriod = function() {
  return `${this.academicYear} Semester ${this.semester}`;
};

// Static method to archive a booking
bookingArchiveSchema.statics.archiveBooking = async function(booking, archivedBy = null) {
  const archiveData = {
    studentId: booking.studentId,
    roomId: booking.roomId,
    bookingDate: booking.bookingDate,
    termsAgreed: booking.termsAgreed,
    academicYear: booking.academicYear,
    semester: booking.semester,
    originalBookingId: booking._id,
    createdByAdmin: booking.createdByAdmin,
    originalCreatedAt: booking.createdAt,
    originalUpdatedAt: booking.updatedAt,
    archivedBy: archivedBy
  };
  
  return await this.create(archiveData);
};

// Static method to get archived bookings for a student
bookingArchiveSchema.statics.getStudentArchives = async function(studentId, options = {}) {
  const {
    academicYear,
    semester,
    page = 1,
    limit = 10,
    populate = true
  } = options;
  
  let query = { studentId };
  
  if (academicYear) query.academicYear = academicYear;
  if (semester) query.semester = semester;
  
  const skip = (page - 1) * limit;
  
  let queryBuilder = this.find(query)
    .sort({ academicYear: -1, semester: -1, archivedAt: -1 })
    .skip(skip)
    .limit(limit);
  
  if (populate) {
    queryBuilder = queryBuilder
      .populate('student', 'fullName email')
      .populate('room', 'roomNumber roomType capacity');
  }
  
  const [archives, total] = await Promise.all([
    queryBuilder.exec(),
    this.countDocuments(query)
  ]);
  
  return {
    archives,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Generate publicId if missing
bookingArchiveSchema.pre('save', function(next) {
  if (!this.publicId) {
    this.publicId = uuidv4();
  }
  next();
});

module.exports = mongoose.model('BookingArchive', bookingArchiveSchema);