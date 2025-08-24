import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x && x !== 'management');

  const getBreadcrumbLabel = (segment: string): string => {
    const labels: Record<string, string> = {
      admin: 'Admin',
      student: 'Student', 
      dashboard: 'Dashboard',
      rooms: 'Rooms',
      students: 'Students',
      bookings: 'Bookings',
      settings: 'Settings',
      profile: 'Profile',
    };
    return labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const getBreadcrumbPath = (segment: string, currentPath: string): string => {
    // Handle role-based navigation
    if (segment === 'student') {
      return '/management/student';
    }
    if (['admin', 'super_admin'].includes(segment)) {
      return '/management/admin';
    }
    
    // For other segments, return the constructed path with management prefix
    return `/management${currentPath}`;
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    ...pathnames.map((segment, index) => {
      const constructedPath = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;
      
      return {
        label: getBreadcrumbLabel(segment),
        path: isLast ? undefined : getBreadcrumbPath(segment, constructedPath),
      };
    }),
  ];

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm">
      <Link
        to="/"
        className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <HomeIcon className="w-4 h-4" />
      </Link>
      
      {breadcrumbs.slice(1).map((breadcrumb, index) => (
        <React.Fragment key={index}>
          <ChevronRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          {breadcrumb.path ? (
            <Link
              to={breadcrumb.path}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {breadcrumb.label}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-white font-medium">{breadcrumb.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
