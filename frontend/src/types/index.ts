import { RoomState } from './room';

export interface User {
  id: string;
  publicId?: string;
  email: string;
  fullName: string;
  role: 'student' | 'admin' | 'super_admin';
  isActive: boolean;
}

export interface Student extends User {
  password: string;
  guardianPhoneNumber: string;
  guardianName: string;
  full_name: string; // keep backward compat; backend provides virtual
  dateOfBirth: any;
  gender: string | number | readonly string[] | undefined;
  level: string;
  programmeOfStudy: string;
  phoneNumber: string;
  Bookings?: Booking[]; // This line has been added
}

export interface Room {
  roomType: string;
  _id: string;
  roomNumber: string;
  type: 'single' | 'double' | 'triple';
  capacity: number;
  status: 'available' | 'occupied' | 'unavailable';
  description?: string;
  amenities?: string[];
}

// Enhanced Booking interface with academic year/semester support
export interface Booking {
  _id: string;
  studentId: string;
  roomId: string | Room;
  bookingDate: string;
  termsAgreed: boolean;
  status: 'active' | 'inactive' | 'cancelled';
  academicYear: string;
  semester: 1 | 2;
  createdAt: string;
  updatedAt: string;
  createdByAdmin?: string;
}

// New interfaces for booking history
export interface BookingArchive {
  _id: string;
  studentId: string;
  roomId: string | Room;
  bookingDate: string;
  termsAgreed: boolean;
  status: 'archived';
  academicYear: string;
  semester: 1 | 2;
  originalBookingId: string;
  archivedAt: string;
  archivedBy?: string;
  createdByAdmin?: string;
  originalCreatedAt: string;
  originalUpdatedAt: string;
  publicId?: string;
}

export interface BookingHistoryResponse {
  bookings: Booking[];
  academicPeriod: string;
  count: number;
}

export interface BookingArchiveResponse {
  archives: BookingArchive[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  totalCount: number;
}

export interface BookingSummaryResponse {
  summary: {
    current: {
      count: number;
      period: string;
    };
    recent: {
      count: number;
      period: string;
    };
    archived: {
      count: number;
      totalPeriods: number;
    };
  };
  totalBookings: number;
}

export interface AcademicSettings {
  _id: string;
  currentAcademicYear: string;
  currentSemester: 1 | 2;
  semesterStartDates: Map<string, {
    semester1: string;
    semester2: string;
  }>;
  autoArchiveEnabled: boolean;
  archiveRetentionYears: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface Settings {
  hostelName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  maintenanceFee: number;
  bookingPortalEnabled?: boolean;
  bookingPortalOpenDateTime?: string;
  bookingPortalCloseDateTime?: string;
}

export interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
}

export interface RootState {
  auth: AuthState;
  settings: SettingsState;
  room: RoomState;
}

export type { RoomState };

interface PublicContent {
  id: string; // Mongoose virtual id getter is string
  type: 'terms' | 'privacy' | 'rules' | 'faq';
  title: string;
  content: string;
  lastUpdatedBy: string; // Admin ObjectId as string
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
