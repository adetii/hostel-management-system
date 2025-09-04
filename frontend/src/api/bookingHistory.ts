import api from './config';
import { 
  BookingHistoryResponse, 
  BookingArchiveResponse, 
  BookingSummaryResponse,
  AcademicSettings 
} from '@/types';

const isMongoObjectId = (v: string) => /^[a-fA-F0-9]{24}$/.test(v);
const baseForStudent = (idOrPublicId: string) =>
  isMongoObjectId(idOrPublicId) ? `/students/${idOrPublicId}` : `/students/p/${idOrPublicId}`;

export const bookingHistoryApi = {
  // Get current bookings for a student
  getCurrentBookings: async (studentId: string): Promise<BookingHistoryResponse> => {
    const response = await api.get(`${baseForStudent(studentId)}/bookings/current`);
    return response.data;
  },

  // Get recent bookings for a student
  getRecentBookings: async (studentId: string): Promise<BookingHistoryResponse> => {
    const response = await api.get(`${baseForStudent(studentId)}/bookings/recent`);
    return response.data;
  },

  // Get archived bookings for a student
  getArchivedBookings: async (
    studentId: string, 
    params?: {
      academicYear?: string;
      semester?: number;
      page?: number;
      limit?: number;
    }
  ): Promise<BookingArchiveResponse> => {
    const response = await api.get(`${baseForStudent(studentId)}/bookings/archived`, { params });
    return response.data;
  },

  // Get booking summary for a student
  getBookingSummary: async (studentId: string): Promise<BookingSummaryResponse> => {
    const response = await api.get(`${baseForStudent(studentId)}/bookings/summary`);
    return response.data;
  },

  // Get academic settings
  getAcademicSettings: async (): Promise<AcademicSettings> => {
    const response = await api.get('/academic/settings');
    return response.data;
  },

  // Get all academic years with booking data
  getAcademicYears: async () => {
    const response = await api.get('/academic/years');
    return response.data;
  }
};

export default bookingHistoryApi;