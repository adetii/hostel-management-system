const mongoose = require('mongoose');

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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to prevent duplicate active assignments
roomAssignmentSchema.index({ roomId: 1, studentId: 1, status: 1 }, { unique: true });

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

module.exports = mongoose.model('RoomAssignment', roomAssignmentSchema);