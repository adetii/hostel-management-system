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
      archived: 'Archived',
      history: 'History',
      edit: 'Edit',
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

  // Filter out UUID/publicId segments (typically 36 characters with dashes)
  const isUUID = (segment: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(segment);
  };

  // Filter out MongoDB ObjectIds (24 character hex strings)
  const isObjectId = (segment: string): boolean => {
    const objectIdRegex = /^[0-9a-f]{24}$/i;
    return objectIdRegex.test(segment);
  };

  // Filter out any ID-like segments
  const shouldExcludeSegment = (segment: string): boolean => {
    return isUUID(segment) || isObjectId(segment);
  };

  const filteredPathnames = pathnames.filter(segment => !shouldExcludeSegment(segment));

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    ...filteredPathnames.map((segment, index) => {
      // Reconstruct path using original pathnames up to the current filtered segment
      const originalIndex = pathnames.indexOf(segment);
      const constructedPath = `/${pathnames.slice(0, originalIndex + 1).join('/')}`;
      const isLast = index === filteredPathnames.length - 1;
      
      return {
        label: getBreadcrumbLabel(segment),
        path: isLast ? undefined : getBreadcrumbPath(segment, constructedPath),
      };
    }),
  ];

  if (filteredPathnames.length === 0) return null;

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