const mongoose = require('../config/database');
const User = require('./User');
const Admin = require('./Admin');
const Room = require('./Room');
const Booking = require('./Booking');
const Settings = require('./Settings');
const PasswordResetToken = require('./PasswordResetToken');
const RoomAssignment = require('./RoomAssignment');
const PublicContent = require('./PublicContent');
const ContentVersion = require('./ContentVersion');

// Export models and mongoose instance
module.exports = {
  mongoose,
  User,
  Admin,
  Room,
  Booking,
  Settings,
  PasswordResetToken,
  RoomAssignment,
  PublicContent,
  ContentVersion
};