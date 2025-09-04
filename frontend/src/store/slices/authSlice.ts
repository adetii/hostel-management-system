import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-hot-toast';
import api from '../../api/config';
import { setCsrfToken, clearCsrfToken } from '@/utils/csrf';
import { publicApi } from '@/api/config';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'admin' | 'super_admin';
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  hydrated: boolean; // added
}

// Remove localStorage-based hydration
const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  hydrated: false, // added
};

// Hydrate auth state via CSRF endpoint only
export const hydrateAuth = createAsyncThunk(
  'auth/hydrate',
  async (_, { rejectWithValue }) => {
    try {
      const csrfRes = await api.get('/auth/csrf-token', {
        headers: { 'X-Skip-Auth-Redirect': 'true' }
      });
      const { csrfToken, user, isAuthenticated } = csrfRes.data;
      setCsrfToken(csrfToken);
      return { user, isAuthenticated };
    } catch (err: any) {
      if (err.response?.status === 401) {
        clearCsrfToken();
        return { user: null, isAuthenticated: false };
      }
      // Handle emergency lockdown 503 clearly
      if (err.response?.status === 503 && err.response?.data?.emergencyLockdown) {
        return rejectWithValue({
          message: 'Emergency lockdown is active. Please try again later.',
          emergencyLockdown: true
        });
      }
      return rejectWithValue(err.response?.data || { message: 'Authentication check failed' });
    }
  }
);

// Login thunk
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const csrfRes = await api.get('/auth/csrf-token', {
        headers: { 'X-Skip-Auth-Redirect': 'true' }
      });
      setCsrfToken(csrfRes.data.csrfToken);
      return res.data;
    } catch (err: any) {
      // Show clearer message on emergency lockdown
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 503 && data?.emergencyLockdown) {
        return rejectWithValue({
          message: '',
          emergencyLockdown: true
        });
      }
      return rejectWithValue(data || { message: 'Login failed' });
    }
  }
);

// Register thunk - updated for emergency lockdown handling
export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    email: string;
    password: string;
    fullName: string;
    gender: string;
    phoneNumber: string;
    dateOfBirth: string;
    programmeOfStudy: string;
    guardianName: string;
    guardianPhoneNumber: string;
    level: string;
    role: string;
  }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/register', userData);
      // Don't try to get CSRF token after registration since user doesn't have a session yet
      // The CSRF token will be obtained after email verification and login
      return res.data;
    } catch (err: any) {
      // Handle emergency lockdown 503 specifically for registration
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 503 && data?.emergencyLockdown) {
        return rejectWithValue({
          message: 'Student registration is temporarily disabled due to emergency lockdown. Please try again later.',
          emergencyLockdown: true
        });
      }
      return rejectWithValue(err.response?.data || { message: 'Registration failed' });
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/auth/me');
      return res.data;
    } catch (err: any) {
      // Handle emergency lockdown 503 clearly
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 503 && data?.emergencyLockdown) {
        return rejectWithValue({
          message: '',
          emergencyLockdown: true
        });
      }
      return rejectWithValue(err.response?.data || { message: 'Not authenticated' });
    }
  }
);

// Forgot password thunk
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || { message: 'Failed to send reset email' });
    }
  }
);

// Reset password thunk
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }: { token: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/reset-password', { token, newPassword: password });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || { message: 'Failed to reset password' });
    }
  }
);

// New: verify email thunk
export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token: string, { rejectWithValue }) => {
    try {
      // Use public (non-tabbed) API and correct path (no extra /api prefix)
      const url = `/auth/verify-email/${token}`;
      console.log('Calling verification URL:', url);
      console.log('Public API base URL:', publicApi.defaults.baseURL);
      const res = await publicApi.get(url);
      console.log('Verification response:', res.data);
      return res.data;
    } catch (err: any) {
      console.error('Verification API error:', err);
      console.error('Error response data:', err?.response?.data);
      return rejectWithValue(err?.response?.data || { message: 'Email verification failed' });
    }
  }
);

// New: resend verification thunk
export const resendVerification = createAsyncThunk(
  'auth/resendVerification',
  async (email: string, { rejectWithValue }) => {
    try {
      // Use public (non-tabbed) API and correct path (no extra /api prefix)
      const res = await publicApi.post(`/auth/resend-verification`, { email });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data || { message: 'Failed to resend verification email' });
    }
  }
);

// Logout thunk - renamed to logoutUser to match imports
export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
    clearCsrfToken();
    return true;
  } catch (err: any) {
    return rejectWithValue(err.response?.data || { message: 'Logout failed' });
  }
});

// Slice definition
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null as null | {
      publicId: string; id: string; email: string; fullName: string; role: string; isActive: boolean 
},
    loading: false,
    error: null as null | string,
    isAuthenticated: false,
    hydrated: false // added
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.hydrated = true; // ensure app doesn't get stuck in loading
      clearCsrfToken();
    },
    forceLogout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.hydrated = true;
      clearCsrfToken();
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.fulfilled, (state, action: PayloadAction<{ user: any; isAuthenticated: boolean }>) => {
        state.user = action.payload.user;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.error = null;
        state.loading = false;
        state.hydrated = true; // added
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.hydrated = true; // added
      })
      .addCase(hydrateAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.hydrated = true; // added (safe)
        toast.success('Logged in successfully');
      })
      .addCase(login.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
        // If backend signals unverified account, show a clearer toast
        if (action.payload?.emailNotVerified) {
          toast.error(action.payload?.message || 'Email not verified. Please verify your email.');
        } else {
          toast.error(state.error);
        }
      })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // Do NOT authenticate on registration; prompt to verify email
        state.user = null;
        state.isAuthenticated = false;
        state.hydrated = true; // added (safe)
        toast.success(action.payload?.message || 'Verification email sent. Please check your inbox.');
      })
      .addCase(register.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload?.message || 'Registration failed';
        
        // Show specific toast for emergency lockdown
        if (action.payload?.emergencyLockdown) {
          toast.error(action.payload.message, {
            duration: 6000,
            icon: '🚨',
          });
        } else {
          toast.error(state.error);
        }
      })
      .addCase(forgotPassword.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        toast.success('Password reset email sent');
      })
      .addCase(forgotPassword.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to send reset email';
        toast.error(state.error);
      })
      .addCase(resetPassword.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        toast.success('Password reset successful');
      })
      .addCase(resetPassword.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to reset password';
        toast.error(state.error);
      })
      .addCase(getCurrentUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getCurrentUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state, action: any) => {
        state.loading = false;
        state.user = null;
        state.error = action.payload?.message || 'Not authenticated';
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.error = null;
        state.loading = false;
        state.isAuthenticated = false;
        state.hydrated = true; // added
        clearCsrfToken();
        toast.success('Logged out successfully');
      })
      .addCase(logoutUser.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload?.message || 'Logout failed';
        toast.error(state.error);
      })
      // New: verify email handlers
      .addCase(verifyEmail.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(verifyEmail.fulfilled, (state, action: any) => {
        state.loading = false;
        toast.success(action.payload?.message || 'Email verified. You can now log in.');
      })
      .addCase(verifyEmail.rejected, (state, action: any) => {
        state.loading = false;
        const msg = action.payload?.message || 'Email verification failed';
        state.error = msg;
        toast.error(msg);
      })
      // New: resend verification handlers
      .addCase(resendVerification.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(resendVerification.fulfilled, (state, action: any) => {
        state.loading = false;
        toast.success(action.payload?.message || 'Verification email sent.');
      })
      .addCase(resendVerification.rejected, (state, action: any) => {
        state.loading = false;
        const msg = action.payload?.message || 'Failed to resend verification email';
        state.error = msg;
        toast.error(msg);
      });
  }
});

// Export the action creators
export const { logout, forceLogout, clearError, setLoading } = authSlice.actions;

export default authSlice.reducer;