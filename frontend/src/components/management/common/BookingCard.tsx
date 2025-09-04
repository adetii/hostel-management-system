import React from 'react';
import {
  HomeIcon,
  CalendarIcon,
  EyeIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Booking, BookingArchive } from '@/types';
import Button from './Button';

interface BookingCardProps {
  booking: Booking | BookingArchive;
  onViewDetails: () => void;
  isArchived?: boolean;
}

const BookingCard: React.FC<BookingCardProps> = ({ 
  booking, 
  onViewDetails, 
  isArchived = false 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', 
        label: 'Active' 
      },
      inactive: { 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', 
        label: 'Completed' 
      },
      archived: { 
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', 
        label: 'Archived' 
      },
      cancelled: { 
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', 
        label: 'Cancelled' 
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getRoomInfo = () => {
    // For archived bookings, room data is in 'room' field
    // For regular bookings, room data is in 'roomId' field
    const roomData = isArchived 
      ? (booking as any).room 
      : (typeof booking.roomId === 'object' ? booking.roomId : null);
    
    if (roomData) {
      return {
        roomNumber: roomData.roomNumber || 'N/A',
        roomType: roomData.roomType || roomData.type || 'Standard',
        capacity: roomData.capacity || 'N/A'
      };
    }
    
    return {
      roomNumber: 'N/A',
      roomType: 'Standard',
      capacity: 'N/A'
    };
  };

  const formatCapacity = (capacity: number | string) => {
    const cap = typeof capacity === 'string' ? parseInt(capacity) : capacity;
    if (isNaN(cap)) return 'N/A';
    return cap === 1 ? '1 student' : `${cap} students`;
  };

  const roomInfo = getRoomInfo();
  const academicPeriod = `${booking.academicYear} Semester ${booking.semester}`;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
      {/* Mobile Layout */}
      <div className="block sm:hidden space-y-3">
        {/* Room Info */}
        <div className="flex items-center space-x-2">
          <HomeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              Room {roomInfo.roomNumber}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
              {roomInfo.roomType} • {formatCapacity(roomInfo.capacity)}
            </p>
          </div>
        </div>

        {/* Booking Date */}
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-900 dark:text-white">
              {formatDate(booking.bookingDate)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {academicPeriod}
            </p>
          </div>
        </div>

        {/* Archive Date (if archived) */}
        {isArchived && 'archivedAt' in booking && (
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Archived: {formatDate(booking.archivedAt)}
              </p>
            </div>
          </div>
        )}

        {/* Status and Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          {getStatusBadge(isArchived ? 'archived' : booking.status)}
          <Button
            variant="secondary"
            size="sm"
            onClick={onViewDetails}
            leftIcon={<EyeIcon className="w-4 h-4" />}
          >
            Details
          </Button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4 lg:space-x-6">
            {/* Room Info */}
            <div className="flex items-center space-x-2">
              <HomeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Room {roomInfo.roomNumber}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {roomInfo.roomType} • {formatCapacity(roomInfo.capacity)}
                </p>
              </div>
            </div>

            {/* Booking Date */}
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDate(booking.bookingDate)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {academicPeriod}
                </p>
              </div>
            </div>

            {/* Archive Date (if archived) */}
            {isArchived && 'archivedAt' in booking && (
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Archived: {formatDate(booking.archivedAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status and Actions */}
        <div className="flex items-center space-x-3 ml-4">
          {getStatusBadge(isArchived ? 'archived' : booking.status)}
          <Button
            variant="secondary"
            size="sm"
            onClick={onViewDetails}
            leftIcon={<EyeIcon className="w-4 h-4" />}
          >
            Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;