import { Student, Booking, Room } from '@/types';
import { Booking as SliceBooking } from '@/store/slices/bookingSlice';
import { Room as RoomType } from '@/types/room';

// Extended Student interface with numbering
export interface StudentWithNumber extends Student {
  serialNumber?: number;
}

// Export configuration
export interface ExportConfig {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  lightGray: string;
  darkGray: string;
}

// Summary data interface
export interface SummaryData {
  [key: string]: string | number;
}

// Export types
export type BookingExport = Booking | SliceBooking;
export type RoomExport = Room | RoomType;
