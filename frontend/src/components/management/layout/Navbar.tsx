import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { logoutUser } from '@/store/slices/authSlice';
import { toast } from 'react-hot-toast';
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  CogIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface NavbarProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onMobileMenuToggle, isMobileMenuOpen }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Fixed theme persistence: check localStorage first, then system preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Apply dark mode on component mount and when isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Initialize theme on mount (for cases where the component mounts after page refresh)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/management/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (user?.role === 'student') {
      navigate(`/management/student/rooms?search=${encodeURIComponent(query)}`);
    } else if (user?.role === 'admin' || user?.role === 'super_admin') {
      navigate(`/management/admin/students?search=${encodeURIComponent(query)}`);
    } else {
      navigate(`/?search=${encodeURIComponent(query)}`);
    }

    setSearchQuery('');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-40 dark:bg-slate-800/80 dark:border-slate-700/50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Mobile menu button + Search */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={onMobileMenuToggle}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-700"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            {/* Search bar - Hidden on mobile */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50/50 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:border-slate-600 dark:bg-slate-700/50 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </form>
          </div>

          {/* Center - Greeting (hidden on mobile) */}
          <div className="hidden lg:flex items-center">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">{getGreeting()},</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{user?.fullName}</p>
            </div>
          </div>

          {/* Right side - Actions + User menu */}
          <div className="flex items-center space-x-3">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-700"
              title="Toggle dark mode"
            >
              {isDarkMode ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>

            

            {/* User menu */}
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-700"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user.fullName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-32 dark:text-white">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize dark:text-gray-400">{user.role}</p>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User dropdown menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 dark:bg-slate-800 dark:border-slate-700">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.fullName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize mt-1 dark:bg-blue-900 dark:text-blue-200">
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      {user.role === 'student' && (
                        <Link
                          to="/management/student/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:bg-slate-700"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <UserCircleIcon className="w-4 h-4 mr-3" />
                          My Profile
                        </Link>
                      )}

                      {(user.role === 'admin' || user.role === 'super_admin') && (
                        <Link
                          to="/management/admin/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:bg-slate-700"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <UserCircleIcon className="w-4 h-4 mr-3" />
                          My Profile
                        </Link>
                      )}
                      
                      {(user.role === 'admin' || user.role === 'super_admin') && (
                        <Link
                          to="/management/admin/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:bg-slate-700"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <CogIcon className="w-4 h-4 mr-3" />
                          Settings
                        </Link>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 py-1 dark:border-slate-700">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50/50 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-700/50 dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </form>
      </div>
    </nav>
  );
};

export default Navbar;
