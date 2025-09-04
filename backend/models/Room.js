const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  roomType: {
    type: String,
    required: true,
    enum: ['1-in-a-room', '2-in-a-room', '3-in-a-room', '4-in-a-room']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  currentOccupancy: {
    type: Number,
    required: true,
    default: 0,
    min: 0, 
    max:4
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

// Virtual to calculate availability based on occupancy
roomSchema.virtual('hasSpace').get(function() {
  return this.currentOccupancy < this.capacity;
});

// Add virtuals for population
roomSchema.virtual('assignments', {
  ref: 'RoomAssignment',
  localField: '_id',
  foreignField: 'roomId',
  justOne: false
});

roomSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'roomId',
  justOne: false
});

// Ensure unique index on publicId
roomSchema.index({ publicId: 1 }, { unique: true, sparse: true });

// Method to update occupancy
roomSchema.methods.updateOccupancy = async function() {
  const RoomAssignment = mongoose.model('RoomAssignment');
  const activeAssignments = await RoomAssignment.countDocuments({
    roomId: this._id,
    status: 'active'
  });
  
  this.currentOccupancy = activeAssignments;
  this.isAvailable = activeAssignments < this.capacity;
  return this.save();
};

// Generate publicId if missing
roomSchema.pre('save', function(next) {
  if (!this.publicId) {
    this.publicId = uuidv4();
  }
  next();
});

module.exports = mongoose.model('Room', roomSchema);