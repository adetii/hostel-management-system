import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeftIcon,
  PencilIcon,
  UserIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  HomeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { RootState } from '@/store';
import { fetchStudentByIdFresh, updateStudentByAdmin } from '@/store/slices/studentSlice';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { Student, Booking } from '@/types';
import { Card } from '@/components/management/common/Card';
import Button from '@/components/management/common/Button';
import BookingHistory from '@/components/management/common/BookingHistory';
import { exportIndividualStudentToPDF } from '@/utils/exportUtils';
import { bookingHistoryApi } from '@/api/bookingHistory';

type TabType = 'profile' | 'bookings';

const StudentProfile: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const { selectedStudent, loading, error } = useSelector((state: RootState) => state.student);

  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) || 'profile'
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add state for current booking
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [loadingCurrentBooking, setLoadingCurrentBooking] = useState(false);

  const [formData, setFormData] = useState({
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load student data on mount
  useEffect(() => {
    if (studentId) {
      dispatch(fetchStudentByIdFresh(studentId));
    }
  }, [dispatch, studentId]);

  // Load current booking when student is loaded
  useEffect(() => {
    if (selectedStudent && studentId) {
      loadCurrentBooking();
    }
  }, [selectedStudent, studentId]);

  // Load current booking function
  const loadCurrentBooking = async () => {
    if (!studentId) return;

    try {
      setLoadingCurrentBooking(true);
      const response = await bookingHistoryApi.getCurrentBookings(studentId);
      if (response.bookings && response.bookings.length > 0) {
        setCurrentBooking(response.bookings[0]); // Get the first (and should be only) active booking
      } else {
        setCurrentBooking(null);
      }
    } catch (error) {
      console.error('Failed to load current booking:', error);
      setCurrentBooking(null);
    } finally {
      setLoadingCurrentBooking(false);
    }
  };

  // Update form data when student is loaded (but not during submission)
  useEffect(() => {
    if (selectedStudent && !isSubmitting) {
      setFormData({
        email: selectedStudent.email || '',
        password: '',
        full_name: selectedStudent.full_name || '',
        gender: String(selectedStudent.gender || ''),
        phoneNumber: selectedStudent.phoneNumber || '',
        dateOfBirth: normalizeDateForInput(selectedStudent.dateOfBirth),
        programmeOfStudy: selectedStudent.programmeOfStudy || '',
        guardianName: selectedStudent.guardianName || '',
        guardianPhoneNumber: selectedStudent.guardianPhoneNumber || '',
        level: selectedStudent.level || '',
      });
    }
  }, [selectedStudent, isSubmitting]); // Add isSubmitting dependency

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab !== 'profile') {
      setSearchParams({ tab: activeTab });
    } else {
      setSearchParams({});
    }
  }, [activeTab, setSearchParams]);

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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsEditMode(false); // Exit edit mode when switching tabs
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.full_name) newErrors.full_name = 'Full name is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.programmeOfStudy) newErrors.programmeOfStudy = 'Programme of study is required';
    if (!formData.guardianName) newErrors.guardianName = 'Guardian name is required';
    if (!formData.guardianPhoneNumber) newErrors.guardianPhoneNumber = 'Guardian phone number is required';
    if (!formData.level) newErrors.level = 'Level is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
    

  const handleSave = async () => {
    if (!validateForm() || !selectedStudent) return;

    setIsSubmitting(true);
    try {
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
        ...(formData.password ? { password: formData.password } : {}),
      };
  
      await dispatch(updateStudentByAdmin({
        id: selectedStudent.publicId ?? selectedStudent.id,
        studentData
      })).unwrap();
  
    setIsEditMode(false); // Return to read mode after successful update
    
  } catch (error: any) {
    toast.error(error.message || 'Failed to update student profile');
  } finally {
    setIsSubmitting(false);
  }
  };

  const handleExportProfile = () => {
    if (selectedStudent) {
      exportIndividualStudentToPDF(selectedStudent, selectedStudent.Bookings || []);
    }
  };

  // Show full-screen loader ONLY during initial fetch (not during updates)
  const isInitialLoading = loading && !selectedStudent;

  if (isInitialLoading) {
    return (
     <div className="flex items-center justify-center min-h-screen space-x-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-700">Loading student profile...</p>
      </div>
    );
  }

  if (error || !selectedStudent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Student Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'The requested student profile could not be found.'}
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/management/admin/students')}
            leftIcon={<ArrowLeftIcon className="w-5 h-5" />}
          >
            Back to Students
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile' as TabType, label: 'Profile', icon: UserIcon },
    { id: 'bookings' as TabType, label: 'Booking History', icon: CalendarIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/management/admin/students')}
            leftIcon={<ArrowLeftIcon className="w-5 h-5" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Student Profile
            </h1>

          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="primary"
            onClick={handleExportProfile}
            leftIcon={<DocumentArrowDownIcon className="w-5 h-5" />}
          >
            Export
          </Button>
          {activeTab === 'profile' && (
            <Button
              variant="primary"
              onClick={handleEditToggle}
              leftIcon={<PencilIcon className="w-5 h-5" />}
            >
              {isEditMode ? 'Cancel' : 'Edit'}
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="glass" className="p-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              selectedStudent.isActive
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              {selectedStudent.isActive ? (
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className={`font-medium ${
                selectedStudent.isActive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {selectedStudent.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="glass" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <EnvelopeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {selectedStudent.email}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="glass" className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <PhoneIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {selectedStudent.phoneNumber}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="glass" className="p-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              currentBooking
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-gray-100 dark:bg-gray-900/30'
            }`}>
              <HomeIcon className={`w-6 h-6 ${
                currentBooking
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Room Status</p>
              <p className={`font-medium ${
                currentBooking
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {loadingCurrentBooking ? 'Loading...' :
                 currentBooking ? `Room ${typeof currentBooking.roomId === 'object' ? currentBooking.roomId.roomNumber : 'N/A'}` : 'No Room'
                }
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Card variant="glass" className="p-1">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Tab Content */}
      <Card variant="glass" className="p-6">
        {activeTab === 'profile' && (
          <ProfileTab
            student={selectedStudent}
            currentBooking={currentBooking}
            loadingCurrentBooking={loadingCurrentBooking}
            formData={formData}
            errors={errors}
            isEditMode={isEditMode}
            isSubmitting={isSubmitting}
            onInputChange={handleInputChange}
            onSave={handleSave}
          />
        )}

        {activeTab === 'bookings' && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Booking History
            </h3>
            <BookingHistory studentId={selectedStudent.publicId ?? selectedStudent.id} isViewMode={false} />
          </div>
        )}
      </Card>
    </div>
  );
};

// Updated Profile Tab Component with Current Booking
interface ProfileTabProps {
  student: Student;
  currentBooking: Booking | null;
  loadingCurrentBooking: boolean;
  formData: any;
  errors: Record<string, string>;
  isEditMode: boolean;
  isSubmitting: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSave: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
  student,
  currentBooking,
  loadingCurrentBooking,
  formData,
  errors,
  isEditMode,
  isSubmitting,
  onInputChange,
  onSave
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoomInfo = (booking: Booking) => {
    if (typeof booking.roomId === 'object' && booking.roomId) {
      return {
        roomNumber: booking.roomId.roomNumber,
        roomType: booking.roomId.roomType || booking.roomId.type || 'Standard',
        capacity: booking.roomId.capacity || 'N/A'
      };
    }
    return {
      roomNumber: 'N/A',
      roomType: 'N/A',
      capacity: 'N/A'
    };
  };

  // Add local AdminButton (same as the one in student/Profile.tsx)
  const AdminButton: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
  }> = ({ children, onClick, type = 'button', variant = 'primary', size = 'md', disabled = false, className = '' }) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800';
  
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
    };
  
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-3 text-base'
    };
  
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      >
        {children}
      </button>
    );
  };

  // Update the ProfileTab component - READ MODE section
  if (!isEditMode) {
    return (
      <div className="space-y-8">
        {/* Current Booking Information - Enhanced Display */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <HomeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Current Booking</span>
          </h4>

          {loadingCurrentBooking ? (
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Loading current booking...</span>
            </div>
          ) : currentBooking ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                    Room Number
                  </label>
                  <p className="text-green-900 dark:text-green-100 font-semibold">
                    {getRoomInfo(currentBooking).roomNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                    Room Type
                  </label>
                  <p className="text-green-900 dark:text-green-100 capitalize">
                    {getRoomInfo(currentBooking).roomType}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                    Capacity
                  </label>
                  <p className="text-green-900 dark:text-green-100">
                    {getRoomInfo(currentBooking).capacity === 'N/A' ? 'N/A' :
                     `${getRoomInfo(currentBooking).capacity} ${getRoomInfo(currentBooking).capacity === 1 ? 'student' : 'students'}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                    Booking Date
                  </label>
                  <p className="text-green-900 dark:text-green-100">
                    {formatDate(currentBooking.bookingDate)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                    Academic Period
                  </label>
                  <p className="text-green-900 dark:text-green-100">
                    {currentBooking.academicYear} Semester {currentBooking.semester}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                    Status
                  </label>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Active
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <MapPinIcon className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">No Active Booking</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    This student does not currently have an active room booking.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Personal Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Personal Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <p className="text-gray-900 dark:text-white">{student.full_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <p className="text-gray-900 dark:text-white">{student.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gender
              </label>
              <p className="text-gray-900 dark:text-white capitalize">{student.gender}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <p className="text-gray-900 dark:text-white">{student.phoneNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date of Birth
              </label>
              <p className="text-gray-900 dark:text-white">
                {new Date(student.dateOfBirth).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Academic Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Programme of Study
              </label>
              <p className="text-gray-900 dark:text-white">{student.programmeOfStudy}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Level
              </label>
              <p className="text-gray-900 dark:text-white">{student.level}</p>
            </div>
          </div>
        </div>

        {/* Guardian Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Guardian Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Guardian Name
              </label>
              <p className="text-gray-900 dark:text-white">{student.guardianName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Guardian Phone Number
              </label>
              <p className="text-gray-900 dark:text-white">{student.guardianPhoneNumber}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit mode form - COMPLETE IMPLEMENTATION
  return (
    <div className="space-y-8">
      {/* Current Booking Information - READ ONLY */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <HomeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Current Booking</span>
        </h4>

        {loadingCurrentBooking ? (
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Loading current booking...</span>
          </div>
        ) : currentBooking ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                  Room Number
                </label>
                <p className="text-green-900 dark:text-green-100 font-semibold">
                  {getRoomInfo(currentBooking).roomNumber}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                  Room Type
                </label>
                <p className="text-green-900 dark:text-green-100 capitalize">
                  {getRoomInfo(currentBooking).roomType}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                  Booking Date
                </label>
                <p className="text-green-900 dark:text-green-100">
                  {formatDate(currentBooking.bookingDate)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                  Academic Period
                </label>
                <p className="text-green-900 dark:text-green-100">
                  {currentBooking.academicYear} Semester {currentBooking.semester}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                  Status
                </label>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Active
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <MapPinIcon className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-gray-900 dark:text-white font-medium">No Active Booking</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  This student does not currently have an active room booking.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EDITABLE FORM FIELDS - REMOVE THE <form> WRAPPER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* All your existing form fields */}
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={onInputChange}
            className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter email address"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
        </div>

        {/* New Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            New Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={onInputChange}
            className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter new password (leave blank to keep current)"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            name="full_name"
            id="full_name"
            value={formData.full_name}
            onChange={onInputChange}
            className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
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
            value={formData.gender}
            onChange={onInputChange}
            className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
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
            value={formData.phoneNumber}
            onChange={onInputChange}
            className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
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
            value={formData.dateOfBirth}
            onChange={onInputChange}
            className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
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
            value={formData.programmeOfStudy}
            onChange={onInputChange}
            className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
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
            value={formData.level}
            onChange={onInputChange}
            className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
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
            value={formData.guardianName}
            onChange={onInputChange}
            className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
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
            value={formData.guardianPhoneNumber}
            onChange={onInputChange}
            className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              errors.guardianPhoneNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter guardian phone number"
          />
          {errors.guardianPhoneNumber && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.guardianPhoneNumber}</p>}
        </div>
      </div>

      {/* Update Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onSave}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Updating...</span>
            </>
          ) : (
            <span>Update</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default StudentProfile;