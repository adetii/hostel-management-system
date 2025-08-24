// Top of file imports and token extraction
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { resetPassword } from '@/store/slices/authSlice';
import { RootState } from '@/store';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Weak', color: 'red' });
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);
  
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset token');
      navigate('/management/login');
    }
  }, [token, navigate]);

  useEffect(() => {
    if (password) {
      const strength = calculatePasswordStrength(password);
      setPasswordStrength(strength);
    }
  }, [password]);

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 6) score++;
    if (/(?=.*[a-z])(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (/(?=.*[!@#$%^&*])/.test(password)) score++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['red', 'red', 'yellow', 'blue', 'green'];
    
    return {
      score,
      label: labels[score] || 'Very Weak',
      color: colors[score] || 'red'
    };
  };

  const validatePassword = (password: string) => {
    if (!password.trim()) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      return 'Password must contain both uppercase and lowercase letters';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword.trim()) {
      return 'Please confirm your password';
    }
    if (confirmPassword !== password) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    // Clear error when user starts typing
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
    
    // Revalidate confirm password if it exists
    if (confirmPassword) {
      const confirmError = validateConfirmPassword(confirmPassword, value);
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    // Clear error when user starts typing
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate both passwords
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword, password);
    
    if (passwordError || confirmPasswordError) {
      setErrors({
        password: passwordError,
        confirmPassword: confirmPasswordError,
      });
      return;
    }
    
    try {
      await dispatch(resetPassword({ token: token!, password })).unwrap();
      setIsSuccess(true);
      toast.success('Password reset successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/management/login');
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
      if (error.message?.includes('token') || error.message?.includes('expired')) {
        setIsTokenValid(false);
      }
    }
  };

  if (!isTokenValid) {
    return (
      <div className="h-screen w-screen fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed overflow-hidden flex items-center justify-center lg:justify-end"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80')`
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/70 to-purple-900/80"></div>
        
        <div className="relative z-20 w-full h-full flex items-center justify-center mx-4">
          <div className="w-full max-w-md h-[95vh] lg:h-auto overflow-y-auto scrollbar-hide">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 lg:p-8 min-h-full lg:min-h-0 flex flex-col justify-center text-center">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6">
                <ExclamationTriangleIcon className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Invalid Reset Link
              </h2>
              
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              
              <div className="space-y-4">
                // Inside the "Invalid Reset Link" fallback UI section
                <Link
                  to="/management/forgot-password"
                  className="w-full flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm lg:text-base"
                >
                  Request New Reset Link
                </Link>
                
                <Link
                  to="/management/login"
                  className="flex items-center justify-center gap-2 w-full px-4 lg:px-6 py-2.5 lg:py-3 bg-white/20 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-white/30 transition-all duration-200 border border-white/30 text-sm lg:text-base"
                >
                  <ArrowLeftIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="h-screen w-screen fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed overflow-hidden flex items-center justify-center lg:justify-end"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80')`
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/70 to-purple-900/80"></div>
        
        <div className="relative z-20 w-full h-full flex items-center justify-center mx-4">
          <div className="w-full max-w-md h-[95vh] lg:h-auto overflow-y-auto scrollbar-hide">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 lg:p-8 min-h-full lg:min-h-0 flex flex-col justify-center text-center">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6">
                <CheckCircleIcon className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Password Reset Successful!
              </h2>
              
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 mb-6">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 mb-6">
                <p className="text-blue-800 dark:text-blue-200 text-xs lg:text-sm">
                  Redirecting to login page in 3 seconds...
                </p>
              </div>
              
              <Link
                to="/management/login"
                className="w-full flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm lg:text-base"
              >
                Continue to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed overflow-hidden flex items-center justify-center lg:justify-end"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80')`
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/70 to-purple-900/80"></div>
      
      {/* Content on image - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:flex absolute left-0 top-0 h-full w-1/2 flex-col justify-center items-start p-12 text-white z-10">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-6">
            ELITE<br />
            <span className="text-2xl font-normal">HOSTEL</span>
          </h1>
          <p className="text-lg mb-4 opacity-90">
            A HOME CLOSE FOR<br />
            YOUR ACADEMIC SUCCESS
          </p>
          <p className="text-sm opacity-75 leading-relaxed">
            Create a strong password to secure your account.
          </p>
        </div>
      </div>

      {/* Reset Password Form - Centered on mobile, right side on desktop */}
      <div className="relative z-20 w-full lg:w-1/2 flex items-center justify-center mx-2 lg:mx-0 lg:mr-8 py-4 lg:py-8">
        <div className="w-full max-w-sm lg:max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-4 lg:p-6">
            <div className="text-center mb-4 lg:mb-6">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
                <LockClosedIcon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                Reset Password
              </h2>
              
              <p className="text-xs lg:text-sm text-gray-600">
                Enter your new password below
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
              {/* New Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs lg:text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your new password"
                    className={`
                      block w-full pl-4 pr-12 py-2.5 lg:py-3 border rounded-lg text-sm lg:text-base
                      bg-white border-gray-300 text-gray-900 placeholder-gray-500
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      transition-all duration-200
                      ${
                        errors.password
                          ? 'border-red-500 focus:ring-red-500'
                          : 'hover:border-gray-400'
                      }
                      ${password && !errors.password ? 'border-green-500' : ''}
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Password Strength:</span>
                      <span className={`text-xs font-medium text-${passwordStrength.color}-600`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full bg-${passwordStrength.color}-500 transition-all duration-300`}
                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <p className="text-xs lg:text-sm text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-xs lg:text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder="Confirm your new password"
                    className={`
                      block w-full pl-4 pr-12 py-2.5 lg:py-3 border rounded-lg text-sm lg:text-base
                      bg-white border-gray-300 text-gray-900 placeholder-gray-500
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      transition-all duration-200
                      ${
                        errors.confirmPassword
                          ? 'border-red-500 focus:ring-red-500'
                          : 'hover:border-gray-400'
                      }
                      ${confirmPassword && !errors.confirmPassword && confirmPassword === password ? 'border-green-500' : ''}
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  {confirmPassword && !errors.confirmPassword && confirmPassword === password && (
                    <div className="absolute inset-y-0 right-8 flex items-center">
                      <CheckCircleIcon className="h-4 w-4 lg:h-5 lg:w-5 text-green-500" />
                    </div>
                  )}
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs lg:text-sm text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-50 rounded-xl p-3 lg:p-4">
                <p className="text-xs lg:text-sm font-medium text-blue-800 mb-2">Password Requirements:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li className={`flex items-center gap-2 ${password.length >= 6 ? 'text-green-600' : ''}`}>
                    <span className={`w-1 h-1 rounded-full ${password.length >= 6 ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                    At least 6 characters
                  </li>
                  <li className={`flex items-center gap-2 ${/(?=.*[a-z])(?=.*[A-Z])/.test(password) ? 'text-green-600' : ''}`}>
                    <span className={`w-1 h-1 rounded-full ${/(?=.*[a-z])(?=.*[A-Z])/.test(password) ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                    Both uppercase and lowercase letters
                  </li>
                  <li className={`flex items-center gap-2 ${/(?=.*\d)/.test(password) ? 'text-green-600' : ''}`}>
                    <span className={`w-1 h-1 rounded-full ${/(?=.*\d)/.test(password) ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                    At least one number
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading || !password.trim() || !confirmPassword.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <LockClosedIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                    Reset Password
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-white/20">
              <Link
                to="/management/login"
                className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium text-xs lg:text-sm"
              >
                <ArrowLeftIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
