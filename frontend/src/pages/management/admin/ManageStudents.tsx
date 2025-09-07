import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState } from '@/store';
import {
  fetchStudents,
  updateStudentByAdmin,
  deleteStudent,
  toggleStudentStatus,
  createStudent,
} from '@/store/slices/studentSlice';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { Card } from '@/components/management/common/Card';
import { Student } from '@/types';
import Button from '@/components/management/common/Button';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  TableCellsIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import ExportButton from '@/components/management/common/ExportButton';
import StudentDeletionModal from '@/components/management/common/StudentDeletionModal';
import {
  exportStudentsToPDF,
  exportStudentsToExcel,
  exportIndividualStudentToPDF
} from '@/utils/exportUtils';


interface FormData {
  email: string;
  password: string;
  full_name: string;
  gender: string; 
  phoneNumber: string;
  dateOfBirth: string;
  programmeOfStudy: string;
  guardianName: string;
  guardianPhoneNumber: string;
  level: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  full_name?: string;
  gender?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  programmeOfStudy?: string;
  guardianName?: string;
  guardianPhoneNumber?: string;
  level?: string;
}

const ManageStudents: React.FC = () => {
  const dispatch = useAppDispatch();
  const { students, error, loading } = useSelector((state: RootState) => state.student);
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState(''); // New gender filter
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isViewMode, setIsViewMode] = useState(true); // Add this line
  const [showDeleteModal, setShowDeleteModal] = useState<{id: string, name: string, email: string} | null>(null);
  
  // Add local loading states for all actions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    full_name: '',
    gender: '',
    phoneNumber: '',
    dateOfBirth: '',
    programmeOfStudy: '',
    guardianName: '',
    guardianPhoneNumber: '',
    level: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Helper to normalize date for input[type="date"]
  const normalizeDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    if (dateString.includes('T')) return dateString.slice(0, 10);
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    dispatch(fetchStudents() as any);
  }, [dispatch]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q !== null) {
      setSearchTerm(q);
    }
  }, [location.search]);

  // Export handlers with filtered data and numbering
  const handleExportAllStudentsPDF = () => {
    const studentsWithNumbers = filteredStudents.map((student, index) => ({
      ...student,
      serialNumber: index + 1
    }));
    exportStudentsToPDF(studentsWithNumbers, 'All Students Report');
  };

  const handleExportAllStudentsExcel = () => {
    const studentsWithNumbers = filteredStudents.map((student, index) => ({
      ...student,
      serialNumber: index + 1
    }));
    exportStudentsToExcel(studentsWithNumbers, 'All_Students_Report');
  };

  const handleExportActiveStudentsPDF = () => {
    const activeStudents = filteredStudents.filter(s => s.isActive);
    const studentsWithNumbers = activeStudents.map((student, index) => ({
      ...student,
      serialNumber: index + 1
    }));
    exportStudentsToPDF(studentsWithNumbers, 'Active Students Report');
  };

  const handleExportActiveStudentsExcel = () => {
    const activeStudents = filteredStudents.filter(s => s.isActive);
    const studentsWithNumbers = activeStudents.map((student, index) => ({
      ...student,
      serialNumber: index + 1
    }));
    exportStudentsToExcel(studentsWithNumbers, 'Active_Students_Report');
  };

  const handleExportIndividualStudent = (student: Student) => {
    exportIndividualStudentToPDF(student, student.Bookings);
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!editingStudent && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (!editingStudent && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (editingStudent && formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.full_name) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (!formData.programmeOfStudy) {
      newErrors.programmeOfStudy = 'Programme of study is required';
    }

    if (!formData.guardianName) {
      newErrors.guardianName = 'Guardian name is required';
    }

    if (!formData.guardianPhoneNumber) {
      newErrors.guardianPhoneNumber = 'Guardian phone number is required';
    }

    if (!formData.level) {
      newErrors.level = 'Level is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form validation function to check if all required fields are filled
  const isFormValid = (): boolean => {
    if (editingStudent) {
      // For editing, password is not required
      return !!(formData.email && formData.full_name && formData.gender && 
               formData.phoneNumber && formData.dateOfBirth && formData.programmeOfStudy && 
               formData.guardianName && formData.guardianPhoneNumber && formData.level);
    } else {
      // For creating, all fields including password are required
      return !!(formData.email && formData.password && formData.full_name && formData.gender && 
               formData.phoneNumber && formData.dateOfBirth && formData.programmeOfStudy && 
               formData.guardianName && formData.guardianPhoneNumber && formData.level);
    }
  };

  // Event handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      gender: '',
      phoneNumber: '',
      dateOfBirth: '',
      programmeOfStudy: '',
      guardianName: '',
      guardianPhoneNumber: '',
      level: '',
    });
    setErrors({});
  };

  const handleEditStudent = (student: Student) => {
    navigate(`/management/admin/students/${student.publicId ?? student.id}?tab=profile`);
  };

  // Modified handler for viewing student profile
  const handleViewStudent = (student: Student) => {
    navigate(`/management/admin/students/${student.publicId ?? student.id}`);
  };

  const handleDeleteStudent = (student: Student) => {
    setShowDeleteModal({
      id: student.id,
      name: student.full_name || student.fullName || 'Unknown',
      email: student.email
    });
  };

  const confirmDelete = async () => {
    if (showDeleteModal) {
      setIsDeleting(true);
      try {
        const result = await dispatch(deleteStudent(showDeleteModal.id)).unwrap();
        toast.success('Student and all related data deleted successfully');
        
        // Show detailed success message if available
        if (result.summary) {
          console.log('Deletion summary:', result.summary);
        }
        
        setShowDeleteModal(null);
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete student');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleToggleStatus = async (studentId: string) => {
    setTogglingStatusId(studentId);
    try {
      await dispatch(toggleStudentStatus(studentId)).unwrap();
      toast.success('Student status updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update student status');
    } finally {
      setTogglingStatusId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (editingStudent) {
        const studentData = {
          email: formData.email,
          full_name: formData.full_name,
          gender: formData.gender,
          phoneNumber: formData.phoneNumber,
          dateOfBirth: formData.dateOfBirth,
          programmeOfStudy: formData.programmeOfStudy,
          guardianName: formData.guardianName,
          guardianPhoneNumber: formData.guardianPhoneNumber,
          level: formData.level,
          // Include password only if provided during edit
          ...(formData.password ? { password: formData.password } : {}),
        };
        
        await dispatch(updateStudentByAdmin({
          id: editingStudent.id,
          studentData: studentData
        })).unwrap();
      } else {
        // Create new student (password required)
        await dispatch(createStudent(formData)).unwrap();
      }
      
      setShowCreateForm(false);
      setEditingStudent(null);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || (editingStudent ? 'Failed to update student' : 'Failed to create student'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate stats with proper typing
  const stats = {
    total: students.length,
    active: students.filter((s: Student) => s.isActive).length,
    inactive: students.filter((s: Student) => !s.isActive).length,
  };

  // Filter students
  // Updated filter logic to include gender with null safety
  const filteredStudents = students.filter((student: Student) => {
    // Safely get string values with fallbacks
    const fullName = (student.full_name || student.fullName || '');
    const email = student.email || '';
    const programme = student.programmeOfStudy || '';
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = fullName.toLowerCase().includes(searchLower) ||
                         email.toLowerCase().includes(searchLower) ||
                         programme.toLowerCase().includes(searchLower);
    
    const matchesFilter = filter === '' || 
                         (filter === 'active' && student.isActive) ||
                         (filter === 'inactive' && !student.isActive);
    
    const matchesGender = genderFilter === '' || student.gender === genderFilter;
    
    return matchesSearch && matchesFilter && matchesGender;
  });

  // Check if any filters are active (not default)
  const hasActiveFilters = searchTerm !== '' || filter !== '' || genderFilter !== '';

  // Only show loading screen for initial load (when no students exist)
  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen space-x-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-700">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Manage Students
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage student accounts
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <ExportButton
            options={[
              // Show filtered option only when filters are active
              ...(hasActiveFilters ? [{
                label: 'Filtered Students (Excel)',
                action: handleExportAllStudentsExcel,
                icon: <TableCellsIcon className="w-4 h-4" />
              }] : []),
              {
                label: 'All Students (Excel)',
                action: () => {
                  const studentsWithNumbers = students.map((student, index) => ({
                    ...student,
                    serialNumber: index + 1
                  }));
                  exportStudentsToExcel(studentsWithNumbers, 'All_Students_Report');
                },
                icon: <TableCellsIcon className="w-4 h-4" />
              },
              {
                label: 'Active Students (Excel)',
                action: handleExportActiveStudentsExcel,
                icon: <TableCellsIcon className="w-4 h-4" />
              }
            ]}
            className="[&>button]:bg-white [&>button]:hover:bg-white [&>button]:border-0 [&>button]:rounded-lg"
            buttonSize="xs"
          />
          <Button
            leftIcon={<PlusIcon className="w-3 h-3" />}
            onClick={() => setShowCreateForm(true)}
            variant="primary"
            size="sm"
          >
            Add Student
          </Button>
        </div>
      </div>

      {/* Modal: Create Student */}
      {showCreateForm && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={() => {
            setShowCreateForm(false);
            setEditingStudent(null);
            resetForm();
          }}
        >
          <div
            className="w-full max-w-md sm:max-w-2xl rounded-xl bg-white dark:bg-gray-800 shadow-xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-student-title"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4 bg-white dark:bg-gray-800">
              <h2 id="create-student-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Add New Student
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingStudent(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                aria-label="Close"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
                </div>

                {/* Programme of Study */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Programme of Study
                  </label>
                  <input
                    type="text"
                    name="programmeOfStudy"
                    value={formData.programmeOfStudy}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {errors.programmeOfStudy && <p className="mt-1 text-sm text-red-600">{errors.programmeOfStudy}</p>}
                </div>

                {/* Guardian Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Guardian Name
                  </label>
                  <input
                    type="text"
                    name="guardianName"
                    value={formData.guardianName}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {errors.guardianName && <p className="mt-1 text-sm text-red-600">{errors.guardianName}</p>}
                </div>

                {/* Guardian Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Guardian Phone Number
                  </label>
                  <input
                    type="tel"
                    name="guardianPhoneNumber"
                    value={formData.guardianPhoneNumber}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {errors.guardianPhoneNumber && <p className="mt-1 text-sm text-red-600">{errors.guardianPhoneNumber}</p>}
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Level
                  </label>
                  <input
                    type="text"
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {errors.level && <p className="mt-1 text-sm text-red-600">{errors.level}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingStudent(null);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !isFormValid()}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div
                          className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                          aria-hidden="true"
                        />
                        <span>Creating...</span>
                      </>
                    ) : (
                      'Create Student'
                    )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* End Modal */}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Students
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Students
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.active}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Inactive Students
              </p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {stats.inactive}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <XMarkIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card variant="glass" className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Gender Filter */}
          <div className="w-full lg:w-48">
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </Card>

      {/* Students Display */}
      {viewMode === 'table' ? (
        <Card variant="glass" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStudents.map((student: Student, index: number) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {(student.full_name || student.fullName || '').charAt(0)?.toUpperCase() || 'N'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.full_name || student.fullName || 'No Name'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Level {student.level}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{student.email}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{student.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {typeof student.gender === 'string' ? 
                          (student.gender.charAt(0).toUpperCase() + student.gender.slice(1)) : 
                          'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleViewStudent(student)}
                          className="flex-1"
                          leftIcon={<EyeIcon className="w-4 h-4" />}
                        >
                          View Profile
                        </Button>
                        
                        <Button
                          variant={student.isActive ? 'warning' : 'success'}
                          size="sm"
                          onClick={() => handleToggleStatus(student.id)}
                          className="flex-1"
                          disabled={togglingStatusId === student.id}
                          leftIcon={
                            togglingStatusId === student.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              student.isActive ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />
                            )
                          }
                        >
                          {togglingStatusId === student.id
                            ? (student.isActive ? 'Deactivating...' : 'Activating...')
                            : (student.isActive ? 'Deactivate' : 'Activate')
                          }
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteStudent(student)}
                          leftIcon={<TrashIcon className="w-4 h-4" />}
                        >
                          Delete
                        </Button>
                      </div>
                     </td> 
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student: Student, index: number) => (
            <Card key={student.id} variant="glass" className="p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-shrink-0 h-12 w-12">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {(student.full_name || student.fullName || '').charAt(0)?.toUpperCase() || 'N'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                    {student.full_name || student.fullName || 'No Name'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {student.email}
                  </p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  student.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {student.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Level:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{student.level}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{student.phoneNumber}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleViewStudent(student)}
                      className="flex-1"
                      leftIcon={<EyeIcon className="w-4 h-4" />}
                    >
                      View Profile
                    </Button>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => handleExportIndividualStudent(student)}
                      leftIcon={<DocumentArrowDownIcon className="w-4 h-4" />}
                    >
                      Export
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant={student.isActive ? 'warning' : 'success'}
                      size="sm"
                      onClick={() => handleToggleStatus(student.id)}
                      className="flex-1"
                      disabled={togglingStatusId === student.id}
                      leftIcon={
                        togglingStatusId === student.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          student.isActive ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />
                        )
                      }
                    >
                      {togglingStatusId === student.id
                        ? (student.isActive ? 'Deactivating...' : 'Activating...')
                        : (student.isActive ? 'Deactivate' : 'Activate')
                      }
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteStudent(student)}
                      leftIcon={<TrashIcon className="w-4 h-4" />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
            </Card>
          ))}
        </div>
      )}



      {/* Comprehensive Student Deletion Modal */}
      <StudentDeletionModal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={confirmDelete}
        studentId={showDeleteModal?.id || ''}
        studentName={showDeleteModal?.name || ''}
        studentEmail={showDeleteModal?.email || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ManageStudents;
