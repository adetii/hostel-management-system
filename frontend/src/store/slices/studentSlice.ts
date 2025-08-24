import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { cachedGet } from '@/api/config';
import { Student } from '@/types';
import { toast } from 'react-hot-toast';
import { shouldSuppressAuth401ToastMessage } from '../../utils/toastUtils';

interface StudentState {
  students: Student[];
  selectedStudent: Student | null;
  loading: boolean;
  bookings: string[];
  error: string | null;
}

const initialState: StudentState = {
  students: [],
  bookings: [],
  selectedStudent: null,
  loading: false,
  error: null,
};

export const fetchStudents = createAsyncThunk('student/fetchStudents', async () => {
  const response = await cachedGet('/students');
  return response.data;
});

export const fetchStudentById = createAsyncThunk('student/fetchStudentById', async (id: string) => {
  if (!id) return null;
  const response = await cachedGet(`/students/${id}`);
  return response.data;
});

export const fetchStudentByIdFresh = createAsyncThunk('student/fetchStudentByIdFresh', async (id: string) => {
  if (!id) return null;
  const response = await cachedGet(`/students/${id}`, {
    headers: { 'X-Bypass-Cache': 'true' }
  });
  return response.data;
});

export const updateStudentProfile = createAsyncThunk(
  'student/updateProfile',
  async (data: {
    id: string;
    level?: string;
    fullName?: string;
    gender?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    programmeOfStudy?: string;
    guardianName?: string;
    guardianPhoneNumber?: string;
  }) => {
    const { id, ...updateData } = data;
    const response = await api.put(`/students/${id}`, updateData);
    // Return just the student object so reducers receive the correct shape
    return response.data.student;
  }
);

export const checkoutStudent = createAsyncThunk(
  'students/checkout',
  async (studentId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/students/${studentId}/check-out`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to checkout student');
    }
  }
);

// New thunks for admin operations
export const updateStudentByAdmin = createAsyncThunk(
  'student/updateByAdmin',
  async (data: { id: string; studentData: Partial<Student> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/students/${data.id}`, data.studentData);
      console.log('Update response:', response.data); // Debug log
      return response.data.student; // Extract the student object from the response
    } catch (error: any) {
      console.error('Update error:', error.response?.data); // Debug log
      return rejectWithValue(error.response?.data?.message || 'Failed to update student');
    }
  }
);

export const deleteStudent = createAsyncThunk(
  'student/delete',
  async (studentId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/students/${studentId}`);
      return studentId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete student');
    }
  }
);

export const toggleStudentStatus = createAsyncThunk(
  'student/toggleStatus',
  async (studentId: string, { rejectWithValue }) => {
    try {
      const response = await api.put(`/students/${studentId}/status`);
      return response.data.student;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update student status');
    }
  }
);

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    clearSelectedStudent: (state) => {
      state.selectedStudent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Students
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        const error = action.error as any;
        state.error = error.message || 'Failed to fetch students';
        if (state.error && !shouldSuppressAuth401ToastMessage(state.error)) {
          toast.error(state.error);
        }
      })
      // Fetch Student by ID
      .addCase(fetchStudentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentById.fulfilled, (state, action) => {
        state.loading = false;
        // Normalize Bookings to always exist (map from backend 'bookings' if necessary)
        const payload = action.payload
          ? { ...action.payload, Bookings: (action.payload as any).Bookings ?? (action.payload as any).bookings ?? [] }
          : action.payload;
        state.selectedStudent = payload as any;
      })
      .addCase(fetchStudentById.rejected, (state, action) => {
        state.loading = false;
        const error = action.error as any;
        state.error = error.message || 'Failed to fetch student details';
        if (state.error && !shouldSuppressAuth401ToastMessage(state.error)) {
          toast.error(state.error);
        }
      })

      // Create Student
      .addCase(createStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.students.push(action.payload);
        toast.success('Student created successfully!');
      })
      .addCase(createStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(state.error);
      })

      // Update Student Profile
      .addCase(updateStudentProfile.pending, (state) => {
        state.error = null;
      })
      .addCase(updateStudentProfile.fulfilled, (state, action) => {
        state.selectedStudent = action.payload;
        state.students = state.students.map((student) =>
          student.id === action.payload.id ? action.payload : student
        );
        toast.success('Profile updated successfully!');
      })
      .addCase(updateStudentProfile.rejected, (state, action) => {
        const error = action.error as any;
        state.error = error.message || 'Failed to update profile';
        if (!error.isSessionTimeout) {
          toast.error(state.error);
        }
      })
      // Update Student by Admin
      .addCase(updateStudentByAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStudentByAdmin.fulfilled, (state, action) => {
        state.loading = false;
        // Update both selectedStudent and students array
        if (action.payload) {
          state.selectedStudent = action.payload;
          state.students = state.students.map((student) =>
            student.id === action.payload.id ? action.payload : student
          );
          // Show success toast here since it's not shown in the component
          toast.success('Student updated successfully');
        }
      })
      .addCase(updateStudentByAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string || 'Failed to update student');
      })
      // Toggle Student Status
      .addCase(toggleStudentStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleStudentStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.students = state.students.map(student => 
          student.id === action.payload.id ? { ...student, ...action.payload } : student
        );
      })
      .addCase(toggleStudentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Student
      .addCase(deleteStudent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.students = state.students.filter(student => student.id !== action.payload);
      })
      .addCase(deleteStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Add handlers for fetchStudentByIdFresh (bypass cache)
      .addCase(fetchStudentByIdFresh.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentByIdFresh.fulfilled, (state, action) => {
        state.loading = false;
        // Normalize Bookings to always exist (map from backend 'bookings' if necessary)
        const payload = action.payload
          ? { ...action.payload, Bookings: (action.payload as any).Bookings ?? (action.payload as any).bookings ?? [] }
          : action.payload;
        state.selectedStudent = payload as any;
      })
      .addCase(fetchStudentByIdFresh.rejected, (state, action) => {
        state.loading = false;
        const error = action.error as any;
        state.error = error.message || 'Failed to fetch student details';
        if (state.error && !shouldSuppressAuth401ToastMessage(state.error)) {
          toast.error(state.error);
        }
      })
  },
});

export const { clearSelectedStudent } = studentSlice.actions;
export default studentSlice.reducer;

// Move createStudent definition before the slice definition
export const createStudent = createAsyncThunk(
  'student/createStudent',
  async (studentData: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/students', studentData);
      return response.data.student; // Extract student object from response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create student');
    }
  }
);

// Also add updateStudent as an alias to updateStudentByAdmin if needed
export const updateStudent = updateStudentByAdmin;