export interface Student {
  id: string;
  publicId?: string;
  email: string;
  full_name: string;
  fullName?: string;
  gender: 'male' | 'female'; // Make it more specific
  phoneNumber: string;
  dateOfBirth: string;
  programmeOfStudy: string;
  guardianName: string;
  guardianPhoneNumber: string;
  level: string;
  isActive: boolean;
  createdAt: string; // Add missing property
  updatedAt: string; // Add missing property
  Bookings?: Booking[]; // Add Bookings property
}

export interface Booking {
  _id: string;
  studentId: string;
  roomId: string;
  bookingDate: string;
  termsAgreed: boolean;
  status: 'active' | 'cancelled';
}

export interface StudentState {
  students: Student[];
  bookings: string[];
  selectedStudent: Student | null;
  loading: boolean;
  error: string | null;
}
