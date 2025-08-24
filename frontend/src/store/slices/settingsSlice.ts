import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { cachedGet } from '@/api/config';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { shouldSuppressAuth401ToastMessage } from '../../utils/toastUtils';

// Define the initial state interface
interface SettingsState {
  settings: {
    // Simplified booking portal settings
    bookingPortalEnabled: boolean;
    bookingPortalOpenDateTime: string;
    bookingPortalCloseDateTime: string;

  } | null;
  loading: boolean;
  error: string | null;
}

// Define the initial state
const initialState: SettingsState = {
  settings: null,
  loading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk('settings/fetchSettings', async () => {
  const response = await api.get('/settings');
  return response.data;
});

// Add a new thunk for fetching public settings
// fetchPublicSettings thunk
export const fetchPublicSettings = createAsyncThunk('settings/fetchPublicSettings', async () => {
  const response = await api.get('/settings/public');
  return response.data;
});

export const updateSettings = createAsyncThunk('settings/updateSettings', async (data: any) => {
  const response = await api.put('/settings', data);
  return response.data;
});

export const toggleRegistration = createAsyncThunk(
  'settings/toggleRegistration',
  async (isOpen: boolean) => {
    const response = await api.put('/settings/registration', { isOpen });
    return response.data;
  }
);

export const toggleMaintenance = createAsyncThunk(
  'settings/toggleMaintenance',
  async ({ isEnabled, message }: { isEnabled: boolean; message: string }) => {
    const response = await api.put('/settings/maintenance', { isEnabled, message });
    return response.data;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Settings
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch settings';
        if (!shouldSuppressAuth401ToastMessage(state.error)) {
          toast.error(state.error);
        }
      })
      // Fetch Public Settings
      .addCase(fetchPublicSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchPublicSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch public settings';
        if (!shouldSuppressAuth401ToastMessage(state.error)) {
          toast.error(state.error);
        }
      })
      // Update Settings
      .addCase(updateSettings.pending, (state) => {
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update settings';
        // keep existing success toast logic above this
        if (!shouldSuppressAuth401ToastMessage(state.error)) {
          toast.error(state.error);
        }
      })
      // Toggle Registration
      .addCase(toggleRegistration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleRegistration.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
        toast.success(
          `Registration ${action.payload.registrationOpen ? 'opened' : 'closed'} successfully!`
        );
      })
      .addCase(toggleRegistration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to toggle registration';
        toast.error(state.error);
      })
      // Toggle Maintenance
      .addCase(toggleMaintenance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleMaintenance.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
        toast.success(
          `Maintenance mode ${action.payload.maintenanceMode ? 'enabled' : 'disabled'} successfully!`
        );
      })
      .addCase(toggleMaintenance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to toggle maintenance mode';
        toast.error(state.error);
      });
  },
});

export default settingsSlice.reducer;

