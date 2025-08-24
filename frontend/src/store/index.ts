import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import roomReducer from './slices/roomSlice';
import studentReducer from './slices/studentSlice';
import settingsReducer from './slices/settingsSlice';
import bookingReducer from './slices/bookingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    room: roomReducer,
    student: studentReducer,
    settings: settingsReducer,
    booking: bookingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
