import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import SuperAdminSidebar from './SuperAdminSidebar';
import {
  HomeIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  UserIcon,
  GlobeAltIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UsersIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<any>;
  roles: string[];
  badge?: string;
}

const navItems: NavItem[] = [
  {
    path: '/management/student',
    label: 'Dashboard',
    icon: HomeIcon,
    roles: ['student'],
  },
  {
    path: '/management/admin',
    label: 'Dashboard',
    icon: HomeIcon,
    roles: ['admin', 'super_admin'],
  },
  {
    path: '/management/student/rooms',
    label: 'Available Rooms',
    icon: BuildingOfficeIcon,
    roles: ['student'],
  },
  {
    path: '/management/student/profile',
    label: 'My Profile',
    icon: UserIcon,
    roles: ['student'],
  },
  {
    path: '/management/admin/students',
    label: 'Manage Students',
    icon: UsersIcon,
    roles: ['admin', 'super_admin'],
  },
  {
    path: '/management/admin/rooms',
    label: 'Manage Rooms',
    icon: BuildingOfficeIcon,
    roles: ['admin', 'super_admin'],
  },
  {
    path: '/management/admin/bookings',
    label: 'Manage Bookings',
    icon: CalendarIcon,
    roles: ['admin', 'super_admin'],
  },
  {
    path: '/management/admin/settings',
    label: 'Settings',
    icon: CogIcon,
    roles: ['admin', 'super_admin'], 
  },
    {
    path: '/management/admin/profile',
    label: 'My Profile',
    icon: UserIcon,
    roles: ['admin', 'super_admin'],
  },
  {
    label: 'Public Website',
      path: '/',
      icon: GlobeAltIcon,
      roles: ['student', 'admin']
  },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile, setIsOpen]);

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 flex flex-col
    transition-all duration-300 ease-in-out
    bg-white/90 dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-800 dark:to-slate-900
    border-r border-gray-200 dark:border-slate-700/50
    backdrop-blur-xl
    shadow-2xl
    ${
      isMobile
        ? `transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-64`
        : `${isCollapsed ? 'w-16' : 'w-64'}`
    }
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={sidebarClasses}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700/50">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-gray-900 dark:text-white">
                <h1 className="text-lg font-bold">Elite Hostel MS</h1>
                <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{user?.role} Panel</p>
              </div>
            </div>
          )}
          
          {/* Toggle buttons */}
          <div className="flex items-center space-x-2">
            {!isMobile && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/50"
              >
                {isCollapsed ? (
                  <ChevronRightIcon className="w-4 h-4" />
                ) : (
                  <ChevronLeftIcon className="w-4 h-4" />
                )}
              </button>
            )}
            
            {isMobile && (
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/50"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  group flex items-center px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-colors duration-200 ease-in-out
                  relative overflow-hidden
                  ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-transparent dark:bg-gradient-to-r dark:from-blue-500/20 dark:to-purple-500/20 dark:text-white dark:border-blue-500/30'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700/50'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r" />
                )}
                
                {/* Icon */}
                <item.icon className={`flex-shrink-0 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`} />
                
                {/* Label */}
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                
                {/* Badge */}
                {!isCollapsed && item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white dark:bg-slate-800 dark:text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
          
          {user?.role === 'super_admin' && (
            <SuperAdminSidebar isExpanded={!isCollapsed} />
          )}
        </nav>

        {/* User info at bottom */}
        {!isCollapsed && user && (
          <div className="p-4 border-t border-gray-200 dark:border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user.fullName?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.fullName}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
