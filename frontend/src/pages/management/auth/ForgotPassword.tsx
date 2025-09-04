import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { forgotPassword } from '@/store/slices/authSlice';
import { RootState } from '@/store';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useAppDispatch();
  const { loading } = useSelector((state: RootState) => state.auth);

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      toast.error('Invalid email address');
      return;
    }
    
    try {
      await dispatch(forgotPassword(email)).unwrap();
      setIsSubmitted(true);
    } catch (error: any) {
      // Don't show toast here as it's handled in authSlice
      if (!error?.userNotFound) {
        setErrors({ email: error.message || 'Failed to send reset instructions' });
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="h-screen w-screen fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed overflow-hidden flex items-center justify-center lg:justify-end animate-fade-in"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80')`
        }}
      >
        {/* Floating background elements */}
        <div className="floating-bubble-1"></div>
        <div className="floating-bubble-2"></div>
        <div className="floating-bubble-3"></div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/70 to-purple-900/80 animate-gradient-shift"></div>
        
        {/* Content on image - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:flex absolute left-0 top-0 h-full w-1/2 flex-col justify-center items-start p-12 text-white z-10 animate-slide-in-left">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6 animate-fade-in-down animation-delay-300">
              ELITE<br />
              <span className="text-2xl font-normal">HOSTEL</span>
            </h1>
            <p className="text-lg mb-4 opacity-90 animate-fade-in-up animation-delay-500">
              A HOME CLOSE FOR<br />
              YOUR ACADEMIC SUCCESS
            </p>
            <p className="text-sm opacity-75 leading-relaxed animate-fade-in animation-delay-700">
              Check your email for password reset instructions.
            </p>
          </div>
        </div>

        {/* Success Message - Centered on mobile, right side on desktop */}
        <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center mx-4 lg:mx-0 lg:mr-8 py-8 animate-slide-in-right animation-delay-200">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 hover-lift animate-scale-in animation-delay-400">
              <div className="text-center mb-6 lg:mb-8">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6 animate-bounce-in animation-delay-600">
                  <CheckCircleIcon className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
                
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 animate-fade-in-down animation-delay-800">
                  Check Your Email
                </h2>
                
                <p className="text-sm lg:text-base text-gray-600 mb-4 animate-fade-in animation-delay-900">
                  We've sent password reset instructions to:
                </p>
                <p className="text-blue-600 font-medium text-base lg:text-lg animate-fade-in-up animation-delay-1000">
                  {email}
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 rounded-xl p-3 lg:p-4 animate-fade-in-left animation-delay-1100">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-xs lg:text-sm text-yellow-800 font-medium mb-1">
                        Didn't receive the email?
                      </p>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        <li>• Check your spam/junk folder</li>
                        <li>• Make sure the email address is correct</li>
                        <li>• Wait a few minutes for delivery</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <Link
                  to="/management/login"
                  className="flex items-center justify-center gap-2 w-full px-4 lg:px-6 py-2.5 lg:py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200 text-sm lg:text-base hover-lift animate-fade-in-up animation-delay-1200"
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

  return (
    <div className="h-screen w-screen fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed overflow-hidden flex items-center justify-center lg:justify-end animate-fade-in"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80')`
      }}
    >
      {/* Floating background elements */}
      <div className="floating-bubble-1"></div>
      <div className="floating-bubble-2"></div>
      <div className="floating-bubble-3"></div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/70 to-purple-900/80 animate-gradient-shift"></div>
      
      {/* Content on image - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:flex absolute left-0 top-0 h-full w-1/2 flex-col justify-center items-start p-12 text-white z-10 animate-slide-in-left">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-6 animate-fade-in-down animation-delay-300">
            ELITE<br />
            <span className="text-2xl font-normal">HOSTEL</span>
          </h1>
          <p className="text-lg mb-4 opacity-90 animate-fade-in-up animation-delay-500">
            A HOME CLOSE FOR<br />
            YOUR ACADEMIC SUCCESS
          </p>
          <p className="text-sm opacity-75 leading-relaxed animate-fade-in animation-delay-700">
            No worries! We'll help you reset your password and get back to your account.
          </p>
        </div>
      </div>

      {/* Forgot Password Form - Centered on mobile, right side on desktop */}
      <div className="relative z-20 w-full lg:w-1/2 flex items-center justify-center mx-4 lg:mx-0 lg:mr-8 py-8 animate-slide-in-right animation-delay-200">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 hover-lift animate-scale-in animation-delay-400">
            <div className="text-center mb-6 lg:mb-8">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6 animate-bounce-in animation-delay-600">
                <EnvelopeIcon className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 animate-fade-in-down animation-delay-800">
                Forgot Password?
              </h2>
              
              <p className="text-sm lg:text-base text-gray-600 animate-fade-in animation-delay-900">
                No worries! Enter your email and we'll send you reset instructions.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
              <div className="space-y-2 animate-fade-in-left animation-delay-1000">
                <label htmlFor="email" className="block text-xs lg:text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Enter your email address"
                    className={`
                      block w-full pl-7 lg:pl-10 pr-8 lg:pr-12 py-1 lg:py-2 border rounded-lg text-xs lg:text-sm
                          bg-white border-gray-300 text-gray-900 placeholder-gray-500
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          transition-all duration-300 transform focus:scale-105
                      ${
                        errors.email
                          ? 'border-red-500 focus:ring-red-500 animate-shake'
                          : 'hover:border-gray-400'
                      }
                    `}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs lg:text-sm text-red-500 flex items-center gap-1 animate-fade-in-down">
                    <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>
                    {errors.email}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base hover-lift animate-fade-in-up animation-delay-1100"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="animate-pulse">Sending Instructions...</span>
                  </>
                ) : (
                  <>
                    Send Reset Instructions
                    <EnvelopeIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-gray-200 animate-fade-in animation-delay-1200">
              <p className="text-xs lg:text-sm text-gray-600">
                Remember your password?{' '}
                <Link
                  to="/management/login"
                  className="text-xs lg:text-sm text-blue-600 hover:text-blue-500 font-medium transition-all duration-200 hover:scale-105 hover:underline"
                >
                  Back to login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
