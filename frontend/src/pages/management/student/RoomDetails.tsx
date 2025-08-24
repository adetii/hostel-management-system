import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { RootState } from '@/store';
import { fetchRoomById, fetchRoomOccupants, bookRoom } from '@/store/slices/roomSlice';
import { fetchPublicSettings } from '@/store/slices/settingsSlice';
import { fetchStudentById, fetchStudentByIdFresh } from '@/store/slices/studentSlice';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useSocket } from '@/contexts/SocketContext';
import {
  ArrowLeftIcon,
  HomeIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PhoneIcon,
  AcademicCapIcon,
  UserIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  WrenchScrewdriverIcon,
  CalendarDaysIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { invalidateSettingsCache } from '@/api/config';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}> = ({ children, onClick, type = 'button', variant = 'primary', size = 'md', disabled = false, className = '' }) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700',
    secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-600 dark:hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 dark:bg-yellow-600 dark:hover:bg-yellow-700'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};

function validateBookingForm(): boolean {
  // Add your validation logic here. For now, always return true.
  return true;
}

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

const capitalizeFirstLetter = (str?: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : 'Unknown';

// RoomDetails component start
const RoomDetails: React.FC = () => {
  const { socket } = useSocket();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { selectedRoom: room, roomOccupants, loading: roomLoading } = useSelector(
    (state: RootState) => state.room,
  );
  const { settings, loading: settingsLoading } = useSelector(
    (state: RootState) => state.settings,
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const { selectedStudent: student, loading: studentLoading } = useSelector(
    (state: RootState) => state.student
  );

  // ALL useState hooks first
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // ALL useEffect hooks MUST come here - BEFORE any conditional returns
  useEffect(() => {
    if (id) {
      dispatch(fetchRoomById(id)).finally(() => {
        setHasAttemptedLoad(true);
      });
      dispatch(fetchRoomOccupants(id));
      dispatch(fetchPublicSettings());
    }
    
    if (user?.id) {
      dispatch(fetchStudentById(user.id));
    }
  }, [dispatch, id, user]);

  // Socket event listeners
  useEffect(() => {
    if (socket && id) {
      socket.on('room-availability-changed', (data: any) => {
        if (data.roomId === id) {
          dispatch(fetchRoomById(id));
          dispatch(fetchRoomOccupants(id));
        }
      });

      socket.on('room-just-booked', (data: any) => {
        if (data.roomId === id) {
          // suppress for self (avoid toasting when the current user booked the room)
          if (user && String(data.studentId) === String(user.id)) {
            return;
          }
          dispatch(fetchRoomById(id));
          dispatch(fetchRoomOccupants(id));
          toast.error('This room was just booked by another student');
        }
      });
      const refreshSettings = () => {
        invalidateSettingsCache();
        dispatch(fetchPublicSettings());
      };

      socket.on('settings-updated', refreshSettings);
      socket.on('portal-status-changed', refreshSettings);
      socket.on('room-updated', (data: any) => {
        if (data.roomId === id) {
          dispatch(fetchRoomById(id));
          // keep this mild success toast or remove if you prefer absolute quiet
          toast.success('Room details have been updated');
        }
      });

      return () => {
        socket.off('settings-updated', refreshSettings);
        socket.off('portal-status-changed', refreshSettings);
        socket.off('room-availability-changed');
        socket.off('room-just-booked');
        socket.off('room-updated');
      };
    }
  }, [socket, dispatch, id, user]);

  // NOW conditional returns can come after ALL hooks
  if (roomLoading || settingsLoading || studentLoading || !hasAttemptedLoad) {
    return (
     <div className="flex items-center justify-center min-h-screen space-x-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-700">Loading room details...</p>
      </div>
    );
  }

  if (!room && hasAttemptedLoad) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          <Card className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <XCircleIcon className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Room Not Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The room you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/management/student/rooms')} variant="primary">
              Browse Available Rooms
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const handleBookRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;

    setBookingError(null);

    if (!validateBookingForm()) {
      return;
    }

    setIsBooking(true);
    

    try {
      await dispatch(
        bookRoom({
          roomId: room._id as string,
          termsAgreed,
        })
      ).unwrap();
      
      setShowBookingModal(false);
      toast.success('Room booked successfully!');
      if (user?.id) {
        await dispatch(fetchStudentByIdFresh(String(user.id)));
      }
      navigate('/management/student');
    } catch (error: any) {
      setBookingError(error.message || 'Failed to book room. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleOpenBookingModal = () => {
    setShowBookingModal(true);
    setBookingError(null);
    setTermsAgreed(false);
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setTermsAgreed(false);
    setBookingError(null);
    setIsBooking(false);
  };

  // Booking portal availability (robust parsing + strict window check)
  const normalizeBoolean = (v: unknown): boolean => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v === 1;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      return s === 'true' || s === '1' || s === 'yes' || s === 'on';
    }
    return false;
  };

  const parseTime = (value?: string | null) => {
    if (!value) return null;
    const raw = String(value).trim();

    if (/^\d+$/.test(raw)) {
      const d = new Date(Number(raw));
      return isNaN(d.getTime()) ? null : d;
    }

    let normalized = raw;
    if (normalized.includes(' ') && !normalized.includes('T')) {
      normalized = normalized.replace(' ', 'T');
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      normalized = `${normalized}T00:00:00`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
      normalized = `${normalized}:00`;
    }

    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  };

  const now = new Date();
  const isBookingPortalEnabled = normalizeBoolean(settings?.bookingPortalEnabled);
  const openTime = parseTime(settings?.bookingPortalOpenDateTime ?? null);
  const closeTime = parseTime(settings?.bookingPortalCloseDateTime ?? null);
  // Replace hasWindow/isBookingPortalOpen with backend-aligned logic
  const withinWindow = Boolean(
    (!openTime || now >= (openTime as Date)) &&
    (!closeTime || now <= (closeTime as Date))
  );
  const isBookingPortalOpen = Boolean(isBookingPortalEnabled && withinWindow);

  if (roomLoading || settingsLoading || studentLoading) {
    return (
     <div className="flex items-center justify-center min-h-screen space-x-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-700">Loading rooms details ...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          <Card className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <XCircleIcon className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Room Not Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The room you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/management/student/rooms')} variant="primary">
              Browse Available Rooms
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Normalize occupants shape (supports both array and { occupants: [] })
  const occupants = Array.isArray(roomOccupants) ? roomOccupants : (roomOccupants?.occupants ?? []);
  const occupiedCount = occupants.length;
  const availableSpaces = Math.max(0, (room.capacity ?? 0) - occupiedCount);
  const occupancyPercentage = room?.capacity ? (occupiedCount / room.capacity) * 100 : 0;

  // Normalize room fields coming from backend/frontend
  const getRoomType = () => room.roomType || room.type || 'Unknown';
  const getRoomStatus = () => {
    if (room.status) return room.status;
    if (typeof room.isAvailable === 'boolean') return room.isAvailable ? 'available' : 'unavailable';
    return 'unknown';
  };

  const isRoomAvailable = getRoomStatus() === 'available' && availableSpaces > 0;

  const getStatusIcon = () => {
    const status = getRoomStatus();
    switch (status) {
      case 'available':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'unavailable':
        return <XCircleIcon className="h-5 w-5" />;
      default:
        return <XCircleIcon className="h-5 w-5" />;
    }
  };

  const getStatusColor = () => {
    const status = getRoomStatus();
    switch (status) {
      case 'available':
        return isRoomAvailable ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300';
      case 'unavailable':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300';
    }
  };

  const getStatusText = () => {
    const status = getRoomStatus();
    if (status === 'available') {
      return isRoomAvailable ? 'Available' : 'Fully Occupied';
    }
    return capitalizeFirstLetter(status);
  };

  function handleTermsChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTermsAgreed(event.target.checked);
    if (bookingError) {
      setBookingError(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between min-h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <Button
                onClick={() => navigate('/management/student/rooms')}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-2 flex-shrink-0"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Rooms</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  Room {room.roomNumber}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                  {capitalizeFirstLetter(getRoomType())} Room Details
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 flex-shrink-0">
              <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="ml-1 hidden xs:inline">{getStatusText()}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room Overview */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-3">
                      <HomeIcon className="h-8 w-8 text-blue-600" />
                      <span>Room {room.roomNumber}</span>
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">{capitalizeFirstLetter(getRoomType())}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Availability</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {availableSpaces}/{room.capacity}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">spaces available</p>
                  </div>
                </div>
                
                {/* Occupancy Progress - Fix the progress bar background */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Room Occupancy</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{occupancyPercentage.toFixed(0)}% occupied</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        occupancyPercentage === 100 ? 'bg-red-500 dark:bg-red-400' : 
                        occupancyPercentage >= 75 ? 'bg-yellow-500 dark:bg-yellow-400' : 'bg-green-500 dark:bg-green-400'
                      }`}
                      style={{ width: `${occupancyPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Room Stats Grid - Fix the colored backgrounds */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                    <HomeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Room Type</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{capitalizeFirstLetter(getRoomType())}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                    <UsersIcon className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-900 dark:text-green-300">Capacity</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">{room.capacity} {room.capacity === 1 ? 'Person' : 'People'}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                    <UserIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-300">Occupied</p>
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{occupiedCount}</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                    <MapPinIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300">Available</p>
                    <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{availableSpaces}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Room Features */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                  <InformationCircleIcon className="h-5 w-5" />
                  <span>Room Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <HomeIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Room Number</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{room.roomNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        <UsersIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Maximum Capacity</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{room.capacity} {room.capacity === 1 ? 'Person' : 'People'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <AcademicCapIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Room Type</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{capitalizeFirstLetter(getRoomType())}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                        {getStatusIcon()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Current Status</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{getStatusText()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Action */}
            {isRoomAvailable && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                    <CalendarDaysIcon className="h-5 w-5" />
                    <span>Book This Room</span>
                  </h3>
                  {!isBookingPortalOpen ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <ClockIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">Booking Portal Closed</h4>
                          <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                            Room booking is not currently available. Please check back during the booking period.
                          </p>
                          {openTime && closeTime && (
                            <div className="text-xs text-yellow-600 dark:text-yellow-500 space-y-1">
                              <p><span className="font-medium">Opens:</span> {openTime.toLocaleString()}</p>
                              <p><span className="font-medium">Closes:</span> {closeTime.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-green-800 dark:text-green-300">
                          <CheckCircleIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">Available for booking</span>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                          {availableSpaces} space{availableSpaces !== 1 ? 's' : ''} remaining
                        </p>
                      </div>
                      <Button
                        onClick={handleOpenBookingModal}
                        variant="success"
                        className="w-full"
                      >
                        Book
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Current Occupants */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                  <UsersIcon className="h-5 w-5" />
                  <span>Current Occupants</span>
                </h3>
                {occupants && occupants.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Occupancy Status</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {occupiedCount}/{room.capacity}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            occupancyPercentage === 100 ? 'bg-red-500' : 
                            occupancyPercentage >= 75 ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${occupancyPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {occupants.map((student: any) => (
                        <div key={String(student._id || student.id)} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {(student.fullName || student.full_name || 'N/A').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{student.fullName || student.full_name || 'N/A'}</p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                              <AcademicCapIcon className="h-3 w-3" />
                              <span>{student.programmeOfStudy || 'N/A'}</span>
                              <span>•</span>
                              <span>Level {student.level || 'N/A'}</span>
                            </div>
                            {student.phoneNumber && (
                              <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500 mt-1">
                                <PhoneIcon className="h-3 w-3" />
                                <span>{student.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                      <UsersIcon className="h-12 w-12 mx-auto" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No Current Occupants</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">This room is completely available for booking</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Real-time Updates Notice */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Live Updates</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">Room availability updates automatically</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={handleCloseBookingModal}
        title={`Book Room ${room.roomNumber}`}
      >
        <form onSubmit={handleBookRoom} className="space-y-6">
          {/* Room Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-3 flex items-center space-x-2">
              <HomeIcon className="h-5 w-5" />
              <span>Room Summary</span>
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-400 font-medium">Room Number:</span>
                <p className="text-blue-900 dark:text-blue-300">{room.roomNumber}</p>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-400 font-medium">Type:</span>
                <p className="text-blue-900 dark:text-blue-300 capitalize">{getRoomType()}</p>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-400 font-medium">Capacity:</span>
                <p className="text-blue-900 dark:text-blue-300">{room.capacity} {room.capacity === 1 ? 'Person' : 'People'}</p>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-400 font-medium">Available Spaces:</span>
                <p className="text-blue-900 dark:text-blue-300">{availableSpaces}</p>
              </div>
            </div>
          </div>
          
          {/* Terms and Conditions */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Terms and Conditions</h4>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto">
              <div className="space-y-4">
                    <div>
                      <h6 className="font-medium text-gray-900 dark:text-white">1. Acceptance of Terms</h6>
                      <p>
                       By booking this room, you agree to:
                      </p>
                    </div>

                    <div>
                      <h6 className="font-medium text-gray-900 dark:text-white">2. Booking & Reservations</h6>
                      <p>All bookings are subject to availability and confirmation. A valid form of identification is required at check-in.</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Advance payment may be required for certain bookings</li>
                        <li>Cancellation policies apply as per booking terms</li>
                        <li>Check-in time: 2:00 PM, Check-out time: 11:00 AM</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-medium text-gray-900 dark:text-white">3. Guest Responsibilities</h6>
                      <p>As a guest, you are expected to maintain a respectful and safe environment for all residents.</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Respect other guests and maintain quiet hours (10 PM - 7 AM)</li>
                        <li>Keep common areas clean and tidy</li>
                        <li>Report any damages or issues immediately</li>
                        <li>Follow all safety and security protocols</li>
                        <li>Comply with local laws and regulations</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-medium text-gray-900 dark:text-white">4. Payment Terms</h6>
                      <p>Payment is due at the time of booking or check-in. We accept major credit cards, debit cards, and cash.</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Security deposit of GH₵50 required upon check-in</li>
                        <li>Late payment fees may apply</li>
                        <li>Refunds processed within 5-7 business days</li>
                        <li>All prices are subject to applicable taxes</li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-medium text-gray-900 dark:text-white">5. Liability & Damages</h6>
                      <p>
                        The hostel is not responsible for loss, theft, or damage to personal belongings. Guests are advised to use provided lockers
                        and secure their valuables.
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Guests are liable for damages to hostel property</li>
                        <li>Insurance coverage is recommended</li>
                        <li>Report incidents immediately to management</li>
                        <li>Emergency procedures must be followed</li>
                      </ul>
                    </div>
                  </div>
            </div>
            
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={handleTermsChange}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I have read and agree to the terms and conditions of the hostel booking policy.
              </span>
            </label>
          </div>

          {/* Error Message */}
          {bookingError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{bookingError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseBookingModal}
              className="flex-1"
              disabled={isBooking}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              className="flex-1"
              disabled={isBooking || !termsAgreed}  // Button disables during booking
            >
              {isBooking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Booking...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Confirm Booking
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoomDetails;


