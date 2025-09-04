const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female']
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  programmeOfStudy: {
    type: String,
    trim: true
  },
  guardianName: {
    type: String,
    trim: true
  },
  guardianPhoneNumber: {
    type: String,
    trim: true
  },
  level: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },

  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    index: true,
    sparse: true
  },
  verificationTokenExpiresAt: {
    type: Date
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
  toObject: { virtuals: true },
  collection: 'students' // ensure the model uses the "students" collection
});

// Ensure unique index on publicId (sparse during rollout)
userSchema.index({ publicId: 1 }, { unique: true, sparse: true });
// Add index for verification token lookups
userSchema.index({ verificationToken: 1 }, { sparse: true });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate publicId if missing
userSchema.pre('save', function(next) {
  if (!this.publicId) {
    this.publicId = uuidv4();
  }
  next();
});

// Instance method to check password
userSchema.methods.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Virtual for backward compatibility with Sequelize field names
userSchema.virtual('full_name').get(function() {
  return this.fullName;
});

userSchema.virtual('full_name').set(function(v) {
  this.fullName = v;
});

// Add virtuals to support strict populate of related models
userSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'studentId'
});

userSchema.virtual('roomAssignments', {
  ref: 'RoomAssignment',
  localField: '_id',
  foreignField: 'studentId'
});

module.exports = mongoose.model('User', userSchema);