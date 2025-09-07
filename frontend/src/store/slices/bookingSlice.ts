import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import api, { cachedGet } from '@/api/config';
import toast from 'react-hot-toast';
import { shouldSuppressAuth401ToastMessage } from '../../utils/toastUtils';

export interface Booking {
  _id: string;
  publicId?: string;
  studentId: string;
  roomId: string;
  bookingDate: string;
  termsAgreed: boolean;
  status: 'active' | 'cancelled' | 'pending' | 'confirmed' | 'completed';
  User?: {
    id?: string;
    _id?: string;
    full_name?: string;
    fullName?: string;
    email?: string;
    programmeOfStudy?: string;
    level?: string;
  };
  Room?: {
    _id?: string;
    id?: string | number;
    roomNumber: string;
    roomType?: string;
    type?: string;
    capacity?: number;
  };
}

interface BookingState {
  bookings: Booking[];
  selectedBooking: Booking | null;
  loading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  bookings: [],
  selectedBooking: null,
  loading: false,
  error: null,
};

// Fetch all bookings
export const fetchBookings = createAsyncThunk(
  'booking/fetchBookings',
  async (args: { bypassCache?: boolean } | undefined, { rejectWithValue }) => {
    try {
      const response = await cachedGet('/bookings', args?.bypassCache ? { headers: { 'X-Bypass-Cache': 'true' } } : undefined);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch bookings'
      );
    }
  }
);

// Update booking room
export const updateBookingRoom = createAsyncThunk(
  'booking/updateBookingRoom',
  async ({ bookingId, newRoomId }: { bookingId: string; newRoomId: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/room`, { roomId: newRoomId });
      toast.success('Booking updated successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update booking';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Update booking status
export const updateBookingStatus = createAsyncThunk(
  'booking/updateBookingStatus',
  async ({ bookingId, status }: { bookingId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/status`, { status });
      toast.success('Booking status updated successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update booking status';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Cancel booking
export const cancelBooking = createAsyncThunk(
  'booking/cancelBooking',
  async ({ bookingId, reason }: { bookingId: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/cancel`, { cancellationReason: reason });
      toast.success('Booking cancelled successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to cancel booking';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Delete booking
export const deleteBooking = createAsyncThunk(
  'booking/deleteBooking',
  async ({ bookingId }: { bookingId: string }, { rejectWithValue }) => {
    try {
      await api.delete(`/bookings/${bookingId}`);
      toast.success('Booking deleted successfully');
      return bookingId;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete booking';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Clear all bookings
export const clearAllBookings = createAsyncThunk(
  'booking/clearAllBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete('/bookings');
      toast.success(response.data.message);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to clear all bookings';
     if (!shouldSuppressAuth401ToastMessage(error.response?.data?.message)) {
          toast.error(message);
        }
      return rejectWithValue(message);
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setSelectedBooking: (state, action) => {
      state.selectedBooking = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Bookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        const normalize = (b: any) => ({
          ...b,
          User: (b.User || b.studentId) ? {
            ...b.User,
            full_name: b.User?.full_name ?? b.studentId?.fullName,
            fullName: b.User?.fullName ?? b.studentId?.fullName,
            email: b.User?.email ?? b.studentId?.email,
            programmeOfStudy: b.User?.programmeOfStudy ?? b.studentId?.programmeOfStudy,
            level: b.User?.level ?? b.studentId?.level,
          } : undefined,
          Room: (b.Room || b.roomId) ? {
            ...b.Room,
            roomNumber: b.Room?.roomNumber ?? b.roomId?.roomNumber,
            roomType: b.Room?.roomType ?? b.roomId?.roomType,
            capacity: b.Room?.capacity ?? b.roomId?.capacity,
          } : undefined,
        });
        state.bookings = Array.isArray(action.payload) ? action.payload.map(normalize) : [];
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Booking Room
      .addCase(updateBookingRoom.pending, (state) => {
        state.error = null;
      })
      .addCase(updateBookingRoom.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          const b = action.payload;
          const normalized = {
            ...b,
            User: (b.User || b.studentId) ? {
              ...b.User,
              full_name: b.User?.full_name ?? b.studentId?.fullName,
              fullName: b.User?.fullName ?? b.studentId?.fullName,
              email: b.User?.email ?? b.studentId?.email,
              programmeOfStudy: b.User?.programmeOfStudy ?? b.studentId?.programmeOfStudy,
              level: b.User?.level ?? b.studentId?.level,
            } : undefined,
            Room: (b.Room || b.roomId) ? {
              ...b.Room,
              roomNumber: b.Room?.roomNumber ?? b.roomId?.roomNumber,
              roomType: b.Room?.roomType ?? b.roomId?.roomType,
              capacity: b.Room?.capacity ?? b.roomId?.capacity,
            } : undefined,
          };
          state.bookings[index] = normalized;
        }
      })
      .addCase(updateBookingRoom.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Update Booking Status
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
      })
      // Cancel Booking
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
      })
      // Delete Booking
      .addCase(deleteBooking.fulfilled, (state, action) => {
        state.bookings = state.bookings.filter(b => b._id !== action.payload);
      })
      // Clear All Bookings
      .addCase(clearAllBookings.pending, (state) => {
        state.error = null;
      })
      .addCase(clearAllBookings.fulfilled, (state) => {
        state.bookings = [];
      })
      .addCase(clearAllBookings.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedBooking, clearError } = bookingSlice.actions;
export default bookingSlice.reducer;
