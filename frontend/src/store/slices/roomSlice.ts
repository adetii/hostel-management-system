import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { PayloadAction } from '@reduxjs/toolkit';
import { Room, RoomOccupants } from '@/types/room';
import api, { cachedGet } from '@/api/config';
import { toast } from 'react-hot-toast';
import { shouldSuppressAuth401ToastMessage } from '../../utils/toastUtils';

interface RoomState {
  rooms: Room[];
  selectedRoom: Room | null;
  loading: boolean;
  error: string | null;
  roomOccupants: RoomOccupants | null;
}

const initialState: RoomState = {
  rooms: [],
  selectedRoom: null,
  loading: false,
  error: null,
  roomOccupants: null,
};

interface BookRoomPayload {
  roomId: string;
  startDate?: string;
  endDate?: string;
  termsAgreed: boolean;
};

export const fetchRooms = createAsyncThunk('room/fetchRooms', async () => {
  const response = await cachedGet('/rooms');
  return response.data;
});

export const fetchRoomById = createAsyncThunk(
  'room/fetchRoomById',
  async (id: string) => {
    const response = await cachedGet(`/rooms/${id}`);
    return response.data;
  }
);

export const bookRoom = createAsyncThunk(
  'room/bookRoom',
  async ({ roomId, termsAgreed }: Pick<BookRoomPayload, 'roomId' | 'termsAgreed'>, { rejectWithValue }) => {
    console.log('Booking room with data:', { roomId, termsAgreed });
    try {
      const response = await api.post('/bookings', {
        roomId,
        termsAgreed,
      });
      return response.data;
    } catch (error: any) {
      console.error('Booking error details:', error.response?.data);
      // Extract the error message from the backend response
      const errorMessage = error.response?.data?.message || 'Failed to book room. Please try again.';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateRoomStatus = createAsyncThunk(
  'rooms/updateStatus',
  async (
    { roomId, status }: { roomId: string; status: 'available' | 'unavailable' },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/rooms/${roomId}/status`, { status });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update room status'
      );
    }
  }
);

export const updateRoom = createAsyncThunk(
  'rooms/updateRoom',
  async (room: Room, { rejectWithValue }) => {
    try {
      const response = await api.put(`/rooms/${room._id}`, room);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update room'
      );
    }
  }
);

// Add new action to fetch room occupants
export const fetchRoomOccupants = createAsyncThunk(
  'room/fetchRoomOccupants',
  async (roomId: string, { rejectWithValue }) => {
    try {
      const response = await cachedGet(`/rooms/${roomId}/occupants`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch room occupants'
      );
    }
  }
);

// Add these new async thunks after the existing ones
export const createRoom = createAsyncThunk(
  'rooms/createRoom',
  async (roomData: Omit<Room, '_id' | 'id'>, { rejectWithValue }) => {
    try {
      const response = await api.post('/rooms', roomData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create room'
      );
    }
  }
);

export const deleteRoom = createAsyncThunk(
  'rooms/deleteRoom',
  async (roomId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/rooms/${roomId}`);
      return roomId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete room'
      );
    }
  }
);

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    clearSelectedRoom: (state) => {
      state.selectedRoom = null;
    },
  },
  // inside extraReducers builder
  extraReducers: (builder) => {
    builder
      // Fetch Rooms
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = action.payload;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch rooms';
        if (!shouldSuppressAuth401ToastMessage(state.error)) {
          toast.error(state.error);
        }
      })
      // Fetch Room by ID
      .addCase(fetchRoomById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoomById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedRoom = action.payload;
      })
      .addCase(fetchRoomById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch room details';
        if (!shouldSuppressAuth401ToastMessage(state.error)) {
          toast.error(state.error);
        }
      })
      // Book Room - REMOVE GLOBAL LOADING STATES
      .addCase(bookRoom.pending, (state) => {
        // Remove: state.loading = true;
        state.error = null;
      })
      .addCase(bookRoom.fulfilled, (state, action) => {
        // Remove: state.loading = false;
        const updatedRoom = action.payload;
        state.rooms = state.rooms.map((room) =>
          room._id === updatedRoom._id ? updatedRoom : room
        );
        if (state.selectedRoom?._id === updatedRoom._id) {
          state.selectedRoom = updatedRoom;
        }
      })
      .addCase(bookRoom.rejected, (state, action) => {
        // Remove: state.loading = false;
        state.error = action.payload as string || 'Failed to book room';
        toast.error(state.error);
      })
      // Update Room Status
      .addCase(updateRoomStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRoomStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = state.rooms.map((room) =>
          room._id === action.payload._id ? action.payload : room
        );
        // Removed toast here to avoid duplicate; UI handles the toast immediately
      })
      .addCase(updateRoomStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Removed toast here; UI shows the error and reverts optimistic change
      })
      // Update Room
      .addCase(updateRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRoom.fulfilled, (state, action) => {
        state.loading = false;
        const updatedRoom = action.payload;
        state.rooms = state.rooms.map((room) =>
          room._id === updatedRoom._id ? updatedRoom : room
        );
        toast.success('Room updated successfully');
      })
      .addCase(updateRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(state.error);
      })
      // Fetch Room Occupants
      .addCase(fetchRoomOccupants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoomOccupants.fulfilled, (state, action) => {
        state.loading = false;
        state.roomOccupants = action.payload;
      })
      .addCase(fetchRoomOccupants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(state.error);
      })
      // Create Room
      .addCase(createRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms.push(action.payload);
        toast.success('Room created successfully');
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(state.error);
      })
      // Delete Room
      .addCase(deleteRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = state.rooms.filter(room => room._id !== action.payload);
        toast.success('Room deleted successfully');
      })
      .addCase(deleteRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(state.error);
      });
  },
});

export const { clearSelectedRoom } = roomSlice.actions;
export default roomSlice.reducer;

