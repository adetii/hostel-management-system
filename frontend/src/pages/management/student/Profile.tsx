import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store';
import { fetchStudentById, updateStudentProfile } from '@/store/slices/studentSlice';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { toast } from 'react-hot-toast';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface ProfileFormData {
  full_name: string;
  phoneNumber: string;
  programmeOfStudy: string;
  level: string;
  guardianName: string;
  guardianPhoneNumber: string;
}

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const Button: React.FC<{
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
    lg: 'px-6 py-3 text-base'
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

const StudentProfile: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  // IMPORTANT: Remove 'loading' completely from this line
  const { selectedStudent: student, error } = useSelector((state: RootState) => state.student);
  
  const [isEditing, setIsEditing] = useState(false);
  // Add local loading state
  const [isUpdating, setIsUpdating] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    phoneNumber: '',
    programmeOfStudy: '',
    level: '',
    guardianName: '',
    guardianPhoneNumber: '',
  });

  useEffect(() => {
    if (user) {
      dispatch(fetchStudentById(user.publicId ?? user.id));
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (student) {
      setFormData({
        full_name: student.full_name || '',
        phoneNumber: student.phoneNumber || '',
        programmeOfStudy: student.programmeOfStudy || '',
        level: student.level || '',
        guardianName: (student as any).guardianName || '',
        guardianPhoneNumber: (student as any).guardianPhoneNumber || '',
      });
    }
  }, [student]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'level') {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id && !user?.publicId) {
      toast.error('User ID not available');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      await dispatch(updateStudentProfile({ 
        id: user.publicId ?? user.id, 
        level: formData.level 
      })).unwrap();
      
      setIsEditing(false);

    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    if (student) {
      setFormData({
        full_name: student.full_name || '',
        phoneNumber: student.phoneNumber || '',
        programmeOfStudy: student.programmeOfStudy || '',
        level: student.level || '',
        guardianName: (student as any).guardianName || '',
        guardianPhoneNumber: (student as any).guardianPhoneNumber || '',
      });
    }
    setIsEditing(false);
  };

  // REMOVE the global loading check - only check for student data
  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen space-x-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-700">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <UserIcon className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Profile</h3>
            <p className="text-gray-600 mb-6">There was an error loading your profile information. Please try again later.</p>
            <Button onClick={() => window.location.reload()} variant="primary">
              Retry
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <Button
                onClick={() => navigate('/management/student')}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-2 flex-shrink-0"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">My Profile</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">Manage your personal information</p>
              </div>
            </div>
            <div className="flex items-center flex-shrink-0">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="primary"
                  size="sm"
                  className="flex items-center space-x-1 sm:space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                  <span>Edit Profile</span>
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleCancel}
                    variant="secondary"
                    size="sm"
                    className="flex items-center space-x-1 sm:space-x-2"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Cancel</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-transparent">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Personal Information */}
          <Card>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                <UserIcon className="h-5 w-5" />
                <span>Personal Information</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Your basic personal details</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                     <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={formData.full_name}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      value={student.email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender
                  </label>
                  <input
                    type="text"
                    value={student.gender}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : ''}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Academic Information */}
          <Card>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                <AcademicCapIcon className="h-5 w-5" />
                <span>Academic Information</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Your academic details and current level</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Programme of Study
                  </label>
                  <div className="relative">
                    <AcademicCapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={formData.programmeOfStudy}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Level
                  </label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isEditing 
                        ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white' 
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <option value="100">Level 100</option>
                    <option value="200">Level 200</option>
                    <option value="300">Level 300</option>
                    <option value="400">Level 400</option>
                  </select>
                  {isEditing && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This is the only field you can update</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Guardian Information */}
          <Card>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                <UserGroupIcon className="h-5 w-5" />
                <span>Guardian Information</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Emergency contact details</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Guardian Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={formData.guardianName}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Guardian Phone Number
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="tel"
                      value={formData.guardianPhoneNumber}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          {isEditing && (
        <Card className="p-6">
          <div className="space-y-4">
            {/* Message at the top */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Only the academic level can be updated.<br />
                Contact administration for other changes.
              </p>
            </div>
          
              {/* Buttons at the bottom */}
              <div className="flex justify-end items-center space-x-3">
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="secondary"
                  className="flex items-center space-x-2"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  disabled={isUpdating}  // Changed from 'loading' to 'isUpdating'
                  className="flex items-center space-x-2"
                >
                  {isUpdating ? (  // Changed from 'loading' to 'isUpdating'
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CheckIcon className="h-4 w-4" />
                  )}
                  <span>{isUpdating ? 'Updating...' : 'Save'}</span>
                </Button>
              </div>
          </div>
        </Card>
          )}
        </form>
      </div>
    </div>
  );
};

export default StudentProfile;
