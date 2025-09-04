// import updates
import React, { useEffect, useRef } from 'react';
import {
  XMarkIcon,
  HomeIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Booking, BookingArchive } from '@/types';
import Button from './Button';


interface BookingDetailsModalProps {
  booking: Booking | BookingArchive;
  onClose: () => void;
}

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  onClose
}) => {
  const isArchived = booking.status === 'archived';
  const dialogRef = useRef<HTMLDivElement>(null);
  
  // Prevent background scroll and add keyboard support
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    
    // Lock background scroll
    document.body.style.overflow = 'hidden';
    
    // Keyboard support
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Focus management
    const timer = setTimeout(() => {
      dialogRef.current?.focus();
    }, 100);
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [onClose]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCapacity = (capacity: number | string) => {
    const cap = typeof capacity === 'string' ? parseInt(capacity) : capacity;
    if (isNaN(cap)) return 'N/A';
    return cap === 1 ? '1 student' : `${cap} students`;
  };

  // Get room information
  const getRoomInfo = () => {
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

  const roomInfo = getRoomInfo();
  
  // Get academic period
  const academicPeriod = booking.academicYear && booking.semester 
    ? `${booking.academicYear} Semester ${booking.semester}`
    : 'N/A';

  // Get status information
  const getStatusInfo = () => {
    if (isArchived) {
      return {
        label: 'Archived Booking',
        description: 'This booking has been archived and is no longer active.',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-800'
      };
    }
    
    switch (booking.status) {
      case 'active':
        return {
          label: 'Active Booking',
          description: 'This booking is currently active and the room is occupied.',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/30'
        };
      case 'inactive':
        return {
          label: 'Cancelled Booking',
          description: 'This booking has been cancelled.',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/30'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    // Center the modal on all devices and add safe padding
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-details-title"
        tabIndex={-1}
        className="
          relative z-10 bg-white dark:bg-gray-900 shadow-2xl
          w-full max-w-3xl lg:max-w-4xl max-h-[90vh]
          rounded-xl overflow-hidden
          flex flex-col
          animate-in fade-in-0 zoom-in-95 duration-200
        "
      >
        {/* Header (not sticky, so full structure is visible) */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-4 md:px-6 py-4">
            <div className="flex items-start md:items-center justify-between gap-3">
              <div className="flex items-start md:items-center gap-3 min-w-0">
                {isArchived ? (
                  <ArchiveBoxIcon className="w-6 h-6 md:w-7 md:h-7 text-gray-600 dark:text-gray-400" />
                ) : (
                  <HomeIcon className="w-6 h-6 md:w-7 md:h-7 text-gray-800 dark:text-gray-200" />
                )}
                <div className="min-w-0">
                  <h2
                    id="booking-details-title"
                    className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white truncate"
                  >
                    Booking Details
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    Room {roomInfo.roomNumber} • {academicPeriod}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
                  aria-label={`Status: ${statusInfo.label}`}
                >
                  {isArchived ? (
                    <ArchiveBoxIcon className="w-4 h-4" />
                  ) : (
                    <CheckCircleIcon className="w-4 h-4" />
                  )}
                  {statusInfo.label}
                </span>

                <button
                  onClick={onClose}
                  className="ml-1 inline-flex items-center justify-center rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700"
                  aria-label="Close"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content inside the dialog */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Status */}
          <div className={`p-4 rounded-lg ${statusInfo.bgColor}`}>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className={`w-5 h-5 ${statusInfo.color} flex-shrink-0`} />
              <h3 className={`font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </h3>
            </div>
            <p className={`text-sm mt-1 ${statusInfo.color} opacity-80`}>
              {statusInfo.description}
            </p>
          </div>

          {/* Room Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
              <HomeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span>Room Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Room Number</p>
                <p className="font-medium text-gray-900 dark:text-white">{roomInfo.roomNumber}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Room Type</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">
                  {roomInfo.roomType}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Capacity</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatCapacity(roomInfo.capacity)}
                </p>
              </div>
            </div>
          </div>

          {/* Booking Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span>Booking Information</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Booking Date</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDateShort(booking.bookingDate)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Academic Period</p>
                <p className="font-medium text-gray-900 dark:text-white">{academicPeriod}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                  {booking.status}
                </span>
              </div>             
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
              <ClockIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <span>Timeline</span>
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(isArchived && 'originalCreatedAt' in booking ? booking.originalCreatedAt : booking.createdAt)}
                </span>
              </div>
              
              {isArchived && 'archivedAt' in booking && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Archived</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(booking.archivedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Information (if available) */}
          {booking.createdByAdmin && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <span>Administrative Info</span>
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Created by Admin</p>
                <p className="font-medium text-gray-900 dark:text-white">Yes</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={onClose}
              className="px-6"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;