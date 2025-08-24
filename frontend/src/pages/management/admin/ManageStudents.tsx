import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
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
  const { students, error } = useSelector((state: RootState) => state.student);
  const location = useLocation();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState(''); // New gender filter
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isViewMode, setIsViewMode] = useState(true); // Add this line
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  
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
    setEditingStudent(student);
    setFormData({
      email: student.email,
      password: '',
      full_name: student.full_name,
      gender: String(student.gender ?? ''),
      phoneNumber: student.phoneNumber,
      dateOfBirth: normalizeDateForInput(student.dateOfBirth),
      programmeOfStudy: student.programmeOfStudy,
      guardianName: student.guardianName,
      guardianPhoneNumber: student.guardianPhoneNumber,
      level: student.level,
    });
    setShowCreateForm(true);
  };

  // Modified handler for viewing student profile
  const handleViewStudent = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      email: student.email,
      password: '',
      full_name: student.full_name,
      gender: String(student.gender ?? ''),
      phoneNumber: student.phoneNumber,
      dateOfBirth: normalizeDateForInput(student.dateOfBirth),
      programmeOfStudy: student.programmeOfStudy,
      guardianName: student.guardianName,
      guardianPhoneNumber: student.guardianPhoneNumber,
      level: student.level,
    });
    setIsViewMode(true); // Start in view mode
    setShowCreateForm(true);
  };

  const handleDeleteStudent = (studentId: string) => {
    setShowDeleteModal(studentId);
  };

  const confirmDelete = async () => {
    if (showDeleteModal) {
      setIsDeleting(true);
      try {
        await dispatch(deleteStudent(showDeleteModal)).unwrap();
        toast.success('Student deleted successfully');
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
          level: formData.level
        };
        
        await dispatch(updateStudentByAdmin({
          id: editingStudent.id,
          studentData: studentData
        })).unwrap();
      } else {
        // Create new student
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
    const fullName = student.full_name || '';
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
  if (!students) {
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
          />
          <Button
            leftIcon={<PlusIcon className="w-5 h-5" />}
            onClick={() => {
              setShowCreateForm(true);
              setIsViewMode(false);
              setEditingStudent(null);
              resetForm();
            }}
            variant="primary"
          >
            Add Student
          </Button>
        </div>
      </div>

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
                    Programme
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
                              {student.full_name?.charAt(0)?.toUpperCase() || 'N'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.full_name || 'No Name'}
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
                      <div className="text-sm text-gray-900 dark:text-white">{student.programmeOfStudy}</div>
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
                          variant="secondary"
                          size="xs"
                          onClick={() => handleExportIndividualStudent(student)}
                          leftIcon={<DocumentArrowDownIcon className="w-4 h-4" />}
                        >
                          Export
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
                          onClick={() => handleDeleteStudent(student.id)}
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
                      {student.full_name?.charAt(0)?.toUpperCase() || 'N'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                    {student.full_name}
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
                    <span className="text-gray-500 dark:text-gray-400">Programme:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{student.programmeOfStudy}</span>
                  </div>
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
                      onClick={() => handleDeleteStudent(student.id)}
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

      {/* Create/Edit Student Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingStudent ? (isViewMode ? 'Student Profile' : 'Edit Student') : 'Add New Student'}
                </h2>
                <div className="flex items-center space-x-2">
                  {editingStudent && isViewMode && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsViewMode(false)}
                      leftIcon={<PencilIcon className="w-4 h-4" />}
                    >
                      Edit Profile
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingStudent(null);
                      setIsViewMode(true);
                      resetForm();
                    }}
                    leftIcon={<XMarkIcon className="w-5 h-5" />}
                  />
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required={!isViewMode}
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isViewMode}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      isViewMode ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                    } ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
                </div>

                {/* Password (only for new students) */}
                {!editingStudent && !isViewMode && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter password"
                    />
                    {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    required={!isViewMode}
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={isViewMode}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      isViewMode ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                    } ${
                      errors.full_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.full_name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.full_name}</p>}
                </div>

                {/* Gender */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    id="gender"
                    required={!isViewMode}
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={isViewMode}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:text-gray-900 dark:disabled:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      isViewMode ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                    } ${
                      errors.gender ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  {errors.gender && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.gender}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    id="phoneNumber"
                    required={!isViewMode}
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    disabled={isViewMode}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      isViewMode ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                    } ${
                      errors.phoneNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {errors.phoneNumber && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phoneNumber}</p>}
                </div>

                {/* Date of Birth */}
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    id="dateOfBirth"
                    required={!isViewMode}
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    disabled={isViewMode}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      isViewMode ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                    } ${
                      errors.dateOfBirth ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dateOfBirth}</p>}
                </div>

                {/* Programme of Study */}
                <div>
                  <label htmlFor="programmeOfStudy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Programme of Study
                  </label>
                  <input
                    type="text"
                    name="programmeOfStudy"
                    id="programmeOfStudy"
                    required={!isViewMode}
                    value={formData.programmeOfStudy}
                    onChange={handleChange}
                    disabled={isViewMode}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      isViewMode ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                    } ${
                      errors.programmeOfStudy ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter programme of study"
                  />
                  {errors.programmeOfStudy && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.programmeOfStudy}</p>}
                </div>

                {/* Level */}
                <div>
                  <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Level
                  </label>
                  <input
                    type="text"
                    name="level"
                    id="level"
                    required={!isViewMode}
                    value={formData.level}
                    onChange={handleChange}
                    disabled={isViewMode}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      isViewMode ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                    } ${
                      errors.level ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter level (e.g., 100, 200, 300)"
                  />
                  {errors.level && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.level}</p>}
                </div>

                {/* Guardian Name */}
                <div>
                  <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Guardian Name
                  </label>
                  <input
                    type="text"
                    name="guardianName"
                    id="guardianName"
                    required={!isViewMode}
                    value={formData.guardianName}
                    onChange={handleChange}
                    disabled={isViewMode}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      isViewMode ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                    } ${
                      errors.guardianName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter guardian name"
                  />
                  {errors.guardianName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.guardianName}</p>}
                </div>

                {/* Guardian Phone Number */}
                <div>
                  <label htmlFor="guardianPhoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Guardian Phone Number
                  </label>
                  <input
                    type="tel"
                    name="guardianPhoneNumber"
                    id="guardianPhoneNumber"
                    required={!isViewMode}
                    value={formData.guardianPhoneNumber}
                    onChange={handleChange}
                    disabled={isViewMode}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      isViewMode ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                    } ${
                      errors.guardianPhoneNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter guardian phone number"
                  />
                  {errors.guardianPhoneNumber && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.guardianPhoneNumber}</p>}
                </div>
              </div>

              {!isViewMode && (
                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingStudent(null);
                      setIsViewMode(true);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isFormValid() || isSubmitting}
                    className="flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{editingStudent ? 'Updating...' : 'Creating...'}</span>
                      </>
                    ) : (
                      <span>{editingStudent ? 'Update Student' : 'Create Student'}</span>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
                Delete Student
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                Are you sure you want to delete this student? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmDelete}
                  className="flex-1"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;
