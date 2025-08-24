import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  HomeIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const NotFound: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Determine the appropriate home route based on user role
  const getHomeRoute = () => {
    if (!user) return '/management/login';
    return user.role === 'admin' ? '/management/admin' : '/management/student';
  };

  const getHomeLabel = () => {
    if (!user) return 'Go to Login';
    return user.role === 'admin' ? 'Admin Dashboard' : 'Student Dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden flex items-center justify-center">
      {/* Floating background elements */}
      <div className="floating-bubble-1"></div>
      <div className="floating-bubble-2"></div>
      <div className="floating-bubble-3"></div>
      
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-indigo-900/40 to-purple-900/50 animate-gradient-shift"></div>
      
      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in-up">
          {/* 404 Number */}
          <div className="mb-8 animate-bounce-in animation-delay-200">
            <h2 className="text-8xl sm:text-9xl lg:text-[12rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient-shift leading-none">
              404
            </h2>
          </div>
          
          {/* Error Icon */}
          <div className="mb-6 animate-scale-in animation-delay-400">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto animate-pulse-glow">
              <ExclamationTriangleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>
          
          {/* Main heading */}
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 animate-fade-in-down animation-delay-600">
            Oops! Page Not Found
          </h2>
          
         
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-1200">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/30 hover-lift"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Go Back
            </button>
          </div>
          
          {/* Elite Hostel branding */}
          <div className="mt-12 animate-fade-in animation-delay-1400">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">
                ELITE HOSTEL
              </h3>
              <p className="text-gray-400 text-sm">
                A HOME CLOSE FOR YOUR ACADEMIC SUCCESS
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 border-2 border-blue-400/30 rounded-full animate-float animation-delay-500"></div>
      <div className="absolute bottom-20 right-20 w-16 h-16 border-2 border-purple-400/30 rounded-full animate-float-reverse animation-delay-700"></div>
      <div className="absolute top-1/2 left-20 w-12 h-12 border-2 border-pink-400/30 rounded-full animate-float animation-delay-900"></div>
    </div>
  );
};

export default NotFound;
