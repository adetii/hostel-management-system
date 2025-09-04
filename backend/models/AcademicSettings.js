const mongoose = require('mongoose');

const academicSettingsSchema = new mongoose.Schema({
  currentAcademicYear: {
    type: String,
    required: true,
    default: '2025/26'
  },
  currentSemester: {
    type: Number,
    enum: [1, 2],
    required: true,
    default: 1
  },
  semesterStartDates: {
    type: Map,
    of: {
      semester1: Date,
      semester2: Date
    },
    default: new Map([
      ['2025/26', {
        semester1: new Date('2025-09-01'),
        semester2: new Date('2026-01-15')
      }]
    ])
  },
  autoArchiveEnabled: {
    type: Boolean,
    default: true
  },
  archiveRetentionYears: {
    type: Number,
    default: 5
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Remove the problematic empty index and replace with a proper one
// Ensure only one settings document exists by using a compound index
academicSettingsSchema.index({ currentAcademicYear: 1, currentSemester: 1 });

// Static method to get current settings
academicSettingsSchema.statics.getCurrent = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Static method to update current academic period
academicSettingsSchema.statics.updateCurrentPeriod = async function(academicYear, semester) {
  return await this.findOneAndUpdate(
    {},
    { 
      currentAcademicYear: academicYear,
      currentSemester: semester
    },
    { upsert: true, new: true }
  );
};

// Method to get current academic period
academicSettingsSchema.methods.getCurrentPeriod = function() {
  return {
    academicYear: this.currentAcademicYear,
    semester: this.currentSemester,
    periodString: `${this.currentAcademicYear} Semester ${this.currentSemester}`
  };
};

// Method to check if it's time for semester transition
academicSettingsSchema.methods.shouldTransitionSemester = function() {
  const now = new Date();
  const currentYearDates = this.semesterStartDates.get(this.currentAcademicYear);
  
  if (!currentYearDates) return false;
  
  if (this.currentSemester === 1 && now >= currentYearDates.semester2) {
    return { transition: true, newSemester: 2, newAcademicYear: this.currentAcademicYear };
  }
  
  // Check for new academic year (assuming next year starts in September)
  const nextYear = this.getNextAcademicYear();
  const nextYearDates = this.semesterStartDates.get(nextYear);
  
  if (nextYearDates && now >= nextYearDates.semester1) {
    return { transition: true, newSemester: 1, newAcademicYear: nextYear };
  }
  
  return { transition: false };
};

// Helper method to get next academic year
academicSettingsSchema.methods.getNextAcademicYear = function() {
  const [startYear] = this.currentAcademicYear.split('/');
  const nextStartYear = parseInt(startYear) + 1;
  const nextEndYear = nextStartYear + 1;
  return `${nextStartYear}/${nextEndYear.toString().slice(-2)}`;
};

module.exports = mongoose.model('AcademicSettings', academicSettingsSchema);