import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  HomeIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { login } from '@/store/slices/authSlice';
import { RootState, AppDispatch } from '@/store';

interface LoginFormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading } = useSelector((state: RootState) => state.auth as { loading: boolean });
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(login({ email, password })).unwrap();

      // Navigate based on role from the result
      switch (result.user.role) {
        case 'super_admin':
        case 'admin':
          navigate('/management/admin');
          break;
        case 'student':
          navigate('/management/student');
          break;
        default:
          navigate('/management/admin');
      }
    } catch (error: any) {
      // If email not verified, send user to the resend page
      if (error?.emailNotVerified) {
        toast.error(error?.message || 'Email not verified. Please check your inbox.');
        navigate(`/management/verify-email/sent?email=${encodeURIComponent(email)}`);
      } else {
        console.error('Login error:', error);
      }
    }
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
            Welcome back! Sign in to access your hostel account and manage your stay.
          </p>
          
          {/* Floating Elements */}
          <div className="absolute top-20 right-20 w-20 h-20 bg-white/10 rounded-full animate-float animation-delay-1000"></div>
          <div className="absolute bottom-40 right-10 w-12 h-12 bg-blue-400/20 rounded-full animate-float-reverse animation-delay-1500"></div>
          <div className="absolute top-1/2 right-32 w-8 h-8 bg-purple-400/20 rounded-full animate-pulse animation-delay-2000"></div>
        </div>
      </div>
      
      {/* Login Form - Centered on mobile, right side on desktop */}
      <div className="relative z-20 w-full lg:w-1/2 flex items-center justify-center mx-4 lg:mx-0 lg:mr-8 py-8 animate-slide-in-right">
        <div className="w-full max-w-sm lg:max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-4 lg:p-6 animate-scale-in animation-delay-300 hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
            {/* Logo/Header */}
            <div className="text-center mb-4 lg:mb-6">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4 animate-bounce-in animation-delay-500 hover:rotate-12 transition-transform duration-300">
                <HomeIcon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2 animate-fade-in-up animation-delay-700">
                Welcome Back
              </h2>
              <p className="text-xs lg:text-sm text-gray-600 animate-fade-in-up animation-delay-900">
                Sign in to your hostel account
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
              {/* Email Field */}
              <div className="space-y-1 lg:space-y-2 animate-slide-in-up animation-delay-1100">
                <label htmlFor="email" className="block text-xs lg:text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-500">
                    <EnvelopeIcon className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className={`
                     block w-full pl-7 lg:pl-10 pr-8 lg:pr-12 py-1 lg:py-2 border rounded-lg text-xs lg:text-sm
                     bg-white border-gray-300 text-gray-900 placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-300 transform focus:scale-105
                      ${
                        errors.email
                          ? 'border-red-500 focus:ring-red-500 animate-shake'
                          : 'hover:border-gray-400 hover:shadow-md'
                      }
                    `}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs lg:text-sm text-red-500 flex items-center gap-1 animate-fade-in">
                    <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1 lg:space-y-2 animate-slide-in-up animation-delay-1300">
                <label htmlFor="password" className="block text-xs lg:text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-500">
                    <LockClosedIcon className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`
                     block w-full pl-7 lg:pl-10 pr-8 lg:pr-12 py-1 lg:py-2 border rounded-lg text-xs lg:text-sm
                     bg-white border-gray-300 text-gray-900 placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-300 transform focus:scale-105
                      ${
                        errors.password
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
                      <EyeSlashIcon className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                    ) : (
                      <EyeIcon className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs lg:text-sm text-red-500 flex items-center gap-1 animate-fade-in">
                    <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-between animate-slide-in-up animation-delay-1500">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-3 w-3 lg:h-4 lg:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200 hover:scale-110"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-xs lg:text-sm text-gray-700 hover:text-gray-900 transition-colors duration-200">
                    Remember me
                  </label>
                </div>
                <Link
                  to="/management/forgot-password"
                  className="text-xs lg:text-sm text-blue-600 hover:text-blue-500 font-medium transition-all duration-200 hover:scale-105 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base transform hover:scale-105 active:scale-95 animate-slide-in-up animation-delay-1700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="animate-pulse">Signing in...</span>
                  </>
                ) : (
                  <>
                    <span className="transition-all duration-200">Sign In</span>
                    <ArrowRightIcon className="w-4 h-4 lg:w-5 lg:h-5 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="text-center mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-gray-200 animate-fade-in animation-delay-1900">
              <p className="text-xs lg:text-base text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/management/register"
                  className="text-xs lg:text-sm text-blue-600 hover:text-blue-500 font-medium transition-all duration-200 hover:scale-105 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;