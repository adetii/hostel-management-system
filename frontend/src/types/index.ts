import { RoomState } from './room';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'admin' | 'super_admin';
  isActive: boolean;
}

export interface Student extends User {
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
  _id: string;
  roomNumber: string;
  type: 'single' | 'double' | 'triple';
  capacity: number;
  status: 'available' | 'occupied' | 'unavailable';
  description?: string;
  amenities?: string[];
}

export interface Booking {
  _id: string;
  studentId: string;
  roomId: string;
  bookingDate: string;
  termsAgreed: boolean;
  status: 'active' | 'cancelled';
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
  room: RoomState;
  student: {
    students: Student[];
    selectedStudent: Student | null;
    loading: boolean;
    error: string | null;
  };
  settings: SettingsState;
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
