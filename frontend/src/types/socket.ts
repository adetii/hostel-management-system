export interface RoomStatusChangedData {
  roomId: string;
  roomNumber: string;
  status: string;
  available: boolean;
}

export interface RoomAvailabilityChangedData {
  roomId: string;
  roomNumber: string;
  available: boolean;
}

export interface BookingStatusUpdatedData {
  bookingId: string;
  studentId: string;
  status: string;
  roomNumber?: string;
}

export interface RoomJustBookedData {
  roomId: string;
  roomNumber: string;
  studentId: string;
  studentName: string;
}

export interface NewBookingData {
  bookingId: string;
  studentId: string;
  studentName: string;
  roomId: string;
  roomNumber: string;
}

export interface BookingCancelledData {
  bookingId: string;
  studentId: string;
  roomId: string;
  roomNumber: string;
}

export interface BookingUpdatedData {
  id: number;
  roomId: number;
  status: string;
}

export interface BookingDeletedData {
  id: number;
}
