import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  UsersIcon,
  DocumentTextIcon,
  EyeIcon,
  ShieldExclamationIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface SuperAdminSidebarProps {
  isExpanded: boolean;
}

const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({ isExpanded }) => {
  const location = useLocation();
  
  const superAdminItems = [
    {
      name: 'Admin Management',
      path: '/management/admin/super/admin-management',
      icon: UsersIcon,
    },
    {
      name: 'Public Content',
      path: '/management/admin/super/public-content',
      icon: DocumentTextIcon,
    },
    {
      name: 'Emergency Controls',
      path: '/management/admin/super/emergency-controls',
      icon: ShieldExclamationIcon,
    },
    {
      name: 'Public Website',
      path: '/',
      icon: GlobeAltIcon,
      external: true
    }
  ];

  return (
    <div className="border-t border-gray-200 dark:border-slate-700/50 mt-4 pt-4">
      <div className={`px-3 mb-3 ${!isExpanded && 'text-center'}`}>
        {!isExpanded && (
          <div className="w-6 h-0.5 bg-slate-600 mx-auto"></div>
        )}
      </div>
      
      <nav className="space-y-1">
        {superAdminItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              target={item.external ? '_blank' : undefined}
              className={`
                group flex items-center px-3 py-2.5 rounded-xl text-sm font-medium
                transition-colors duration-200 ease-in-out
                relative overflow-hidden
                ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-transparent dark:bg-gradient-to-r dark:from-blue-500/20 dark:to-purple-500/20 dark:text-white dark:border-blue-500/30'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700/50'
                }
                ${isExpanded ? '' : 'justify-center'}
              `}
              title={!isExpanded ? item.name : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r" />
              )}
              
              {/* Icon */}
              <item.icon className={`flex-shrink-0 ${isExpanded ? 'w-5 h-5 mr-3' : 'w-6 h-6'}`} />
              
              {/* Label and Description */}
              {isExpanded && (
                <div className="flex-1">
                  <div className="font-medium truncate">{item.name}</div>
                </div>
              )}
              
              {/* Tooltip for collapsed state */}
              {!isExpanded && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white dark:bg-slate-800 dark:text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default SuperAdminSidebar;