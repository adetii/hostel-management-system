const mongoose = require('mongoose');
require('dotenv').config();
const { Booking, RoomAssignment, AcademicSettings } = require('../models');

async function migrateAcademicFields() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get current academic settings
    const academicSettings = await AcademicSettings.getCurrent();
    const { academicYear, semester } = academicSettings.getCurrentPeriod();

    console.log(`Current academic period: ${academicYear} Semester ${semester}`);

    // Update bookings without academic fields
    const bookingUpdateResult = await Booking.updateMany(
      {
        $or: [
          { academicYear: { $exists: false } },
          { semester: { $exists: false } }
        ]
      },
      {
        $set: {
          academicYear,
          semester
        }
      }
    );

    console.log(`Updated ${bookingUpdateResult.modifiedCount} bookings with academic fields`);

    // Update room assignments without academic fields
    const assignmentUpdateResult = await RoomAssignment.updateMany(
      {
        $or: [
          { academicYear: { $exists: false } },
          { semester: { $exists: false } }
        ]
      },
      {
        $set: {
          academicYear,
          semester
        }
      }
    );

    console.log(`Updated ${assignmentUpdateResult.modifiedCount} room assignments with academic fields`);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateAcademicFields();