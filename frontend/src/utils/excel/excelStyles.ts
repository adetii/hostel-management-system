// Column width configurations
export const COLUMN_WIDTHS = {
  STUDENTS: [
    { wch: 5 },  // #
    { wch: 25 }, // Full Name
    { wch: 30 }, // Email
    { wch: 10 }, // Gender
    { wch: 15 }, // Phone Number
    { wch: 15 }, // Date of Birth
    { wch: 30 }, // Programme of Study
    { wch: 8 },  // Level
    { wch: 25 }, // Guardian Name
    { wch: 15 }, // Guardian Phone
    { wch: 10 }  // Status
  ],
  BOOKINGS: [
    { wch: 15 }, // Booking ID
    { wch: 25 }, // Student
    { wch: 15 }, // Room
    { wch: 15 }, // Date
    { wch: 12 }, // Status
    { wch: 15 }  // Terms Agreed
  ],
  ROOMS: [
    { wch: 15 }, // Room Number
    { wch: 20 }, // Type
    { wch: 10 }, // Capacity
    { wch: 15 }, // Status
    { wch: 40 }  // Description
  ]
};

// Default cell styles
export const DEFAULT_CELL_STYLE = {
  font: { name: 'Arial', size: 10 },
  alignment: { vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: 'E2E8F0' } },
    bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
    left: { style: 'thin', color: { rgb: 'E2E8F0' } },
    right: { style: 'thin', color: { rgb: 'E2E8F0' } }
  }
};
