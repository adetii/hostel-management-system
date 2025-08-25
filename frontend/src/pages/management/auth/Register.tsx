import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { register } from '@/store/slices/authSlice';
import { RootState } from '@/store';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  gender: string;
  phoneNumber: string;
  dateOfBirth: string;
  programmeOfStudy: string;
  guardianName: string;
  guardianPhoneNumber: string;
  level: string;
}

const Register: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    gender: '',
    phoneNumber: '',
    dateOfBirth: '',
    programmeOfStudy: '',
    guardianName: '',
    guardianPhoneNumber: '',
    level: '',
  });

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state: RootState) => state.auth as { loading: boolean });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
 
  const steps = [
    {
      id: 1,
      title: 'Account Details',
      description: 'Create your login credentials',
      fields: ['email', 'password', 'confirmPassword']
    },
    {
      id: 2,
      title: 'Personal Information',
      description: 'Tell us about yourself',
      fields: ['fullName', 'gender', 'phoneNumber', 'dateOfBirth']
    },
    {
      id: 3,
      title: 'Academic & Guardian Info',
      description: 'Complete your profile',
      fields: ['programmeOfStudy', 'level', 'guardianName', 'guardianPhoneNumber']
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName);
  };

  const validateField = (fieldName: string) => {
    const newErrors = { ...errors };
    const value = formData[fieldName as keyof FormData];

    switch (fieldName) {
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;
      case 'password':
        if (!value.trim()) {
          newErrors.password = 'Password is required';
        } else if (value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        } else {
          delete newErrors.password;
        }
        break;
      case 'confirmPassword':
        if (formData.password !== value) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      case 'fullName':
        if (!value.trim()) {
          newErrors.fullName = 'Full name is required';
        } else {
          delete newErrors.fullName;
        }
        break;
      case 'gender':
        if (!value) {
          newErrors.gender = 'Gender is required';
        } else {
          delete newErrors.gender;
        }
        break;
      case 'phoneNumber':
      case 'guardianPhoneNumber':
        if (!value.trim()) {
          newErrors[fieldName] = 'Phone number is required';
        } else if (!/^\+?[0-9]{10,15}$/.test(value)) {
          newErrors[fieldName] = 'Please enter a valid phone number';
        } else {
          delete newErrors[fieldName];
        }
        break;
      case 'dateOfBirth':
        if (!value) {
          newErrors.dateOfBirth = 'Date of birth is required';
        } else {
          delete newErrors.dateOfBirth;
        }
        break;
      case 'programmeOfStudy':
        if (!value.trim()) {
          newErrors.programmeOfStudy = 'Programme of study is required';
        } else {
          delete newErrors.programmeOfStudy;
        }
        break;
      case 'guardianName':
        if (!value.trim()) {
          newErrors.guardianName = 'Guardian name is required';
        } else {
          delete newErrors.guardianName;
        }
        break;
      case 'level':
        if (!value.trim()) {
          newErrors.level = 'Level is required';
        } else {
          delete newErrors.level;
        }
        break;
    }

    setErrors(newErrors);
  };

  const validateStep = (stepNumber: number) => {
    const step = steps.find(s => s.id === stepNumber);
    if (!step) return true;

    const stepErrors: Record<string, string> = {};
    
    step.fields.forEach(field => {
      const value = formData[field as keyof FormData];
      
      switch (field) {
        case 'email':
          if (!value.trim()) {
            stepErrors.email = 'Email is required';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            stepErrors.email = 'Please enter a valid email address';
          }
          break;
        case 'password':
          if (!value.trim()) {
            stepErrors.password = 'Password is required';
          } else if (value.length < 6) {
            stepErrors.password = 'Password must be at least 6 characters';
          }
          break;
        case 'confirmPassword':
          if (formData.password !== value) {
            stepErrors.confirmPassword = 'Passwords do not match';
          }
          break;
        case 'fullName':
        case 'programmeOfStudy':
        case 'guardianName':
        case 'level':
          if (!value.trim()) {
            stepErrors[field] = `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
          }
          break;
        case 'gender':
        case 'dateOfBirth':
          if (!value) {
            stepErrors[field] = `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
          }
          break;
        case 'phoneNumber':
        case 'guardianPhoneNumber':
          if (!value.trim()) {
            stepErrors[field] = 'Phone number is required';
          } else if (!/^\+?[0-9]{10,15}$/.test(value)) {
            stepErrors[field] = 'Please enter a valid phone number';
          }
          break;
      }
    });

    setErrors(prev => ({ ...prev, ...stepErrors }));
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const nextStep = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all steps
    let allValid = true;
    for (let i = 1; i <= steps.length; i++) {
      if (!validateStep(i)) {
        allValid = false;
      }
    }
    
    try {
      await dispatch(register({ ...formData, role: 'student' })).unwrap();
      navigate('/management/login')
    } catch (error: any) {
      
    }
  };

  const isStepCompleted = (stepNumber: number) => {
    const step = steps.find(s => s.id === stepNumber);
    if (!step) return false;
    
    return step.fields.every(field => {
      const value = formData[field as keyof FormData];
      return value && value.trim() !== '';
    });
  };

  const renderFormField = (fieldName: string, type: string, placeholder: string, icon?: React.ReactNode) => {
    const value = formData[fieldName as keyof FormData];
    const error = errors[fieldName];
    const isTouched = touchedFields[fieldName];

    return (
      <div className="space-y-1">
        <label htmlFor={fieldName} className="block text-xs font-medium text-gray-700">
          {placeholder}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <div className="h-4 w-4 text-gray-400">{icon}</div>
            </div>
          )}
          <input
            type={type}
            name={fieldName}
            id={fieldName}
            value={value}
            onChange={handleChange}
            onBlur={() => handleBlur(fieldName)}
            placeholder={`Enter ${placeholder.toLowerCase()}`}
            className={`
              block w-full ${icon ? 'pl-9' : 'pl-3'} pr-8 py-2 border rounded-lg text-sm
              bg-white border-gray-300
              text-gray-900 placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all duration-200
              ${
                error && isTouched
                  ? 'border-red-500 focus:ring-red-500'
                  : 'hover:border-gray-400'
              }
              ${value && !error ? 'border-green-500' : ''}
            `}
          />
          {value && !error && (
            <div className="absolute inset-y-0 right-2 flex items-center">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            </div>
          )}
        </div>
        {error && isTouched && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
            {error}
          </p>
        )}
      </div>
    );
  };

  const renderPasswordField = (fieldName: string, placeholder: string, showPassword: boolean, togglePassword: () => void) => {
    const value = formData[fieldName as keyof FormData];
    const error = errors[fieldName];
    const isTouched = touchedFields[fieldName];

    return (
      <div className="space-y-1">
        <label htmlFor={fieldName} className="block text-xs font-medium text-gray-700">
          {placeholder}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <LockClosedIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            name={fieldName}
            id={fieldName}
            value={value}
            onChange={handleChange}
            onBlur={() => handleBlur(fieldName)}
            placeholder={`Enter ${placeholder.toLowerCase()}`}
            className={`
              block w-full pl-9 pr-16 py-2 border rounded-lg text-sm
              bg-white border-gray-300
              text-gray-900 placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all duration-200
              ${
                error && isTouched
                  ? 'border-red-500 focus:ring-red-500'
                  : 'hover:border-gray-400'
              }
              ${value && !error ? 'border-green-500' : ''}
            `}
          />
          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
            {value && !error && (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            )}
            <button
              type="button"
              onClick={togglePassword}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        {error && isTouched && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
            {error}
          </p>
        )}
      </div>
    );
  };

  const renderSelectField = (fieldName: string, placeholder: string, options: Array<{value: string, label: string}>, icon?: React.ReactNode) => {
    const value = formData[fieldName as keyof FormData];
    const error = errors[fieldName];
    const isTouched = touchedFields[fieldName];

    return (
      <div className="space-y-1">
        <label htmlFor={fieldName} className="block text-xs font-medium text-gray-700">
          {placeholder}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <div className="h-4 w-4 text-gray-400">{icon}</div>
            </div>
          )}
          <select
            name={fieldName}
            id={fieldName}
            value={value}
            onChange={handleChange}
            onBlur={() => handleBlur(fieldName)}
            className={`
              block w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2 border rounded-lg text-sm
              bg-white border-gray-300
              text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all duration-200
              ${
                error && isTouched
                  ? 'border-red-500 focus:ring-red-500'
                  : 'hover:border-gray-400'
              }
              ${value && !error ? 'border-green-500' : ''}
            `}
          >
            <option value="" className="text-gray-500">Select {placeholder.toLowerCase()}</option>
            {options.map(option => (
              <option key={option.value} value={option.value} className="text-gray-900">
                {option.label}
              </option>
            ))}
          </select>
          {value && !error && (
            <div className="absolute inset-y-0 right-6 flex items-center">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            </div>
          )}
        </div>
        {error && isTouched && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <div 
      className="h-screen w-screen fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed overflow-hidden flex items-center justify-center lg:justify-end animate-fade-in"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80')`
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/70 to-purple-900/80 animate-gradient-shift"></div>
      
      {/* Content on image - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:flex absolute left-0 top-0 h-full w-1/2 flex-col justify-center items-start p-12 text-white z-10 animate-slide-in-left">
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-bold mb-6 animate-fade-in-up animation-delay-300">
            ELITE<br />
            <span className="text-2xl font-normal animate-fade-in-up animation-delay-500">HOSTEL</span>
          </h1>
          <p className="text-lg mb-4 opacity-90 animate-fade-in-up animation-delay-700">
            A HOME CLOSE FOR<br />
            YOUR ACADEMIC SUCCESS
          </p>
          <p className="text-sm opacity-75 leading-relaxed animate-fade-in-up animation-delay-900">
            Join our community! Create your account to access premium hostel facilities.
          </p>
          
          {/* Floating Elements */}
          <div className="absolute top-20 right-20 w-20 h-20 bg-white/10 rounded-full animate-float animation-delay-1000"></div>
          <div className="absolute bottom-40 right-10 w-12 h-12 bg-blue-400/20 rounded-full animate-float-reverse animation-delay-1500"></div>
          <div className="absolute top-1/2 right-32 w-8 h-8 bg-purple-400/20 rounded-full animate-pulse animation-delay-2000"></div>
        </div>
      </div>
      
      {/* Register Form - Centered on mobile, right side on desktop */}
      <div className="relative z-20 w-full lg:w-1/2 flex items-center justify-center mx-2 lg:mx-0 lg:mr-8 py-4 animate-slide-in-right">
        <div className="w-full max-w-xs lg:max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-3 lg:p-6 animate-scale-in animation-delay-300 hover:shadow-2xl transition-all duration-500">
            {/* Logo/Header */}
            <div className="text-center mb-3 lg:mb-6">
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-4 animate-bounce-in animation-delay-500 hover:rotate-12 transition-transform duration-300">
                <UserGroupIcon className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
              </div>
              <h2 className="text-lg lg:text-2xl font-bold text-gray-900 mb-1 lg:mb-2 animate-fade-in-up animation-delay-700">
                Create Account
              </h2>
              <p className="text-xs lg:text-sm text-gray-600 animate-fade-in-up animation-delay-900">
                Join our hostel community
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-4 lg:mb-6 animate-slide-in-up animation-delay-1100">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-medium transition-all duration-500 transform
                      ${
                        currentStep === step.id
                          ? 'bg-blue-600 text-white scale-110 animate-pulse'
                          : currentStep > step.id
                          ? 'bg-green-500 text-white animate-bounce-in'
                          : 'bg-gray-200 text-gray-500'
                      }
                    `}>
                      {currentStep > step.id ? (
                        <CheckCircleIcon className="w-3 h-3 lg:w-4 lg:h-4 animate-scale-in" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span className={`
                      text-xs mt-1 transition-colors duration-300
                      ${
                        currentStep === step.id
                          ? 'text-blue-600 font-medium'
                          : currentStep > step.id
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }
                    `}>
                      {step.title.split(' ')[0]}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-8 lg:w-12 h-0.5 mx-1 lg:mx-2 transition-all duration-500
                      ${
                        currentStep > step.id
                          ? 'bg-green-500 animate-expand'
                          : 'bg-gray-200'
                      }
                    `}></div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Form Content with staggered animations */}
            <form onSubmit={handleSubmit} className="animate-slide-in-up animation-delay-1300">
              {/* Step 1: Account Details */}
              {currentStep === 1 && (
                <div className="space-y-3 lg:space-y-4 animate-fade-in">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 lg:mb-4 animate-slide-in-up">
                    {steps[0].title}
                  </h3>
                  
                  {/* Email Field */}
                  <div className="space-y-1 lg:space-y-2 animate-slide-in-up animation-delay-200">
                    <label className="block text-xs lg:text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-500">
                        <EnvelopeIcon className="h-3 w-3 lg:h-5 lg:w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={() => handleBlur('email')}
                        placeholder="Enter your email"
                        className={`
                          block w-full pl-7 lg:pl-10 pr-3 lg:pr-4 py-1.5 lg:py-3 border rounded-lg text-xs lg:text-base
                          bg-white border-gray-300 text-gray-900 placeholder-gray-500
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          transition-all duration-300 transform focus:scale-105
                          ${
                            errors.email && touchedFields.email
                              ? 'border-red-500 focus:ring-red-500 animate-shake'
                              : 'hover:border-gray-400 hover:shadow-md'
                          }
                        `}
                      />
                    </div>
                    {errors.email && touchedFields.email && (
                      <p className="text-xs text-red-500 flex items-center gap-1 animate-fade-in">
                        <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1 lg:space-y-2 animate-slide-in-up animation-delay-400">
                    <label className="block text-xs lg:text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-500">
                        <LockClosedIcon className="h-3 w-3 lg:h-5 lg:w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={() => handleBlur('password')}
                        placeholder="Create a password"
                        className={`
                          block w-full pl-7 lg:pl-10 pr-8 lg:pr-12 py-1.5 lg:py-3 border rounded-lg text-xs lg:text-base
                          bg-white border-gray-300 text-gray-900 placeholder-gray-500
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          transition-all duration-300 transform focus:scale-105
                          ${
                            errors.password && touchedFields.password
                              ? 'border-red-500 focus:ring-red-500 animate-shake'
                              : 'hover:border-gray-400 hover:shadow-md'
                          }
                        `}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:scale-110 transition-transform duration-200"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-3 w-3 lg:h-5 lg:w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                        ) : (
                          <EyeIcon className="h-3 w-3 lg:h-5 lg:w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                        )}
                      </button>
                    </div>
                    {errors.password && touchedFields.password && (
                      <p className="text-xs text-red-500 flex items-center gap-1 animate-fade-in">
                        <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-1 lg:space-y-2 animate-slide-in-up animation-delay-600">
                    <label className="block text-xs lg:text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-500">
                        <LockClosedIcon className="h-3 w-3 lg:h-5 lg:w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={() => handleBlur('confirmPassword')}
                        placeholder="Confirm your password"
                        className={`
                          block w-full pl-7 lg:pl-10 pr-8 lg:pr-12 py-1.5 lg:py-3 border rounded-lg text-xs lg:text-base
                          bg-white border-gray-300 text-gray-900 placeholder-gray-500
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          transition-all duration-300 transform focus:scale-105
                          ${
                            errors.confirmPassword && touchedFields.confirmPassword
                              ? 'border-red-500 focus:ring-red-500 animate-shake'
                              : 'hover:border-gray-400 hover:shadow-md'
                          }
                        `}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:scale-110 transition-transform duration-200"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-3 w-3 lg:h-5 lg:w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                        ) : (
                          <EyeIcon className="h-3 w-3 lg:h-5 lg:w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && touchedFields.confirmPassword && (
                      <p className="text-xs text-red-500 flex items-center gap-1 animate-fade-in">
                        <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Personal Information */}
              {currentStep === 2 && (
                <div className="space-y-3 lg:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                    {renderFormField('fullName', 'text', 'Full Name', <UserIcon />)}
                    {renderSelectField('gender', 'Gender', [
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' }
                    ], <UserIcon />)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                    {renderFormField('phoneNumber', 'tel', 'Phone Number', <PhoneIcon />)}
                    {renderFormField('dateOfBirth', 'date', 'Date of Birth', <CalendarDaysIcon />)}
                  </div>
                </div>
              )}

              {/* Step 3: Academic & Guardian Info */}
              {currentStep === 3 && (
                <div className="space-y-3 lg:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                    {renderFormField('programmeOfStudy', 'text', 'Programme of Study', <AcademicCapIcon />)}
                    {renderFormField('level', 'text', 'Level', <AcademicCapIcon />)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                    {renderFormField('guardianName', 'text', 'Guardian Name', <UserGroupIcon />)}
                    {renderFormField('guardianPhoneNumber', 'tel', 'Guardian Phone Number', <PhoneIcon />)}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-4 lg:mt-6 animate-slide-in-up animation-delay-800">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-1.5 lg:py-2 text-gray-600 hover:text-gray-800 transition-all duration-200 hover:scale-105 text-xs lg:text-sm"
                  >
                    <ChevronLeftIcon className="w-3 h-3 lg:w-4 lg:h-4 transition-transform duration-200 hover:-translate-x-1" />
                    Previous
                  </button>
                )}
                
                <div className="flex-1"></div>
                
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-1 lg:gap-2 px-3 lg:px-6 py-1.5 lg:py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-xs lg:text-sm"
                  >
                    Next
                    <ChevronRightIcon className="w-3 h-3 lg:w-4 lg:h-4 transition-transform duration-200 hover:translate-x-1" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-1 lg:gap-2 px-3 lg:px-6 py-1.5 lg:py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 text-xs lg:text-sm"
                  >
                    {loading ? (
                      <>
                        <div className="w-3 h-3 lg:w-4 lg:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="animate-pulse">Creating...</span>
                      </>
                    ) : (
                      <>
                        Create Account
                        <CheckCircleIcon className="w-3 h-3 lg:w-4 lg:h-4 transition-transform duration-200 hover:scale-110" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Login Link */}
            <div className="text-center mt-4 lg:mt-6 pt-3 lg:pt-4 border-t border-gray-200 animate-fade-in animation-delay-1000">
              <p className="text-xs lg:text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/management/login"
                  className="text-xs lg:text-sm text-blue-600 hover:text-blue-500 font-medium transition-all duration-200 hover:scale-105 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
