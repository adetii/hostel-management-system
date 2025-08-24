import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { RootState } from '@/store';
import { fetchRooms, bookRoom } from '@/store/slices/roomSlice';
import { fetchPublicSettings } from '@/store/slices/settingsSlice';
import { fetchStudentById, fetchStudentByIdFresh } from '@/store/slices/studentSlice';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { Room } from '@/types/room';
import { Student, Booking } from '@/types'; // Ensure proper import
import { useSocket } from '@/contexts/SocketContext';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ArrowLeftIcon,
  HomeIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { invalidateSettingsCache } from '@/api/config';

interface Filters {
  type: string;
  capacity: string;
  search: string;
}

// Update the Card component
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

// Update the Button component
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
    secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
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
        
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
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

const BookRoom: React.FC = () => {
  const { socket } = useSocket();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { rooms, loading } = useSelector((state: RootState) => state.room);
  const { settings, loading: settingsLoading } = useSelector((state: RootState) => state.settings);
  const { user } = useSelector((state: RootState) => state.auth);
  const { selectedStudent: student, loading: studentLoading } = useSelector(
    (state: RootState) => state.student
  );

  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [warned, setWarned] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<Filters>({
    type: '',
    capacity: '',
    search: '',
  });

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [termsAgreed, setTermsAgreed] = useState<boolean>(false);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Initial data fetch (keeps existing fetchPublicSettings)
  useEffect(() => {
    dispatch(fetchRooms());
    dispatch(fetchPublicSettings());
    
    if (user?.id) {
      dispatch(fetchStudentById(user.id.toString()));
    }
  }, [dispatch, user]);




  // Socket event listeners
  useEffect(() => {
    if (socket) {
      socket.on('room-availability-changed', (data: any) => {
        dispatch(fetchRooms());
      });

      socket.on('room-just-booked', (data: any) => {
        // suppress for self (avoid toasting when the current user booked the room)
        if (user && String(data.studentId) === String(user.id)) return;

        dispatch(fetchRooms());
        toast.error(`Room ${data.roomNumber} was just booked by another student`);
        
        if (selectedRoom && selectedRoom.roomNumber === data.roomNumber) {
          handleCloseBookingModal();
          toast.error('The room you were trying to book is no longer available');
        }
      });

      // New: refresh settings on server-side updates
      const onSettingsUpdated = (data: any) => {
        invalidateSettingsCache();
        dispatch(fetchPublicSettings());
        if (!data.bookingPortalEnabled) {
          toast.error('Booking portal has been disabled by admin');
          navigate('/management/student');
        }
      };
      socket.on('settings-updated', onSettingsUpdated);

      const onPortalStatusChanged = () => {
        invalidateSettingsCache();
        dispatch(fetchPublicSettings());
      };
      socket.on('portal-status-changed', onPortalStatusChanged);

      return () => {
        socket.off('room-availability-changed');
        socket.off('room-just-booked');
        socket.off('settings-updated', onSettingsUpdated);
        socket.off('portal-status-changed', onPortalStatusChanged);
      };
    }
  }, [socket, dispatch, selectedRoom, navigate, user]);

  // Replace any occurrences of '/student/dashboard' with '/management/student' where navigating after booking
  // Example locations (ensure all similar spots reflect the same correction):
  // Filter handlers
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({ type: '', capacity: '', search: '' });
  };

  // Optimized room filtering
  const filteredRooms = useMemo(() => {
    return (rooms as Room[]).filter(room => {
      if (room.status !== 'available') return false;
      if (filters.type && room.type !== filters.type) return false;
      if (filters.capacity && room.capacity !== Number(filters.capacity)) return false;
      if (filters.search && !room.roomNumber.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [rooms, filters]);

  // Booking modal handlers
  const handleOpenBookingModal = (room: Room): void => {
    setSelectedRoom(room);
    setShowBookingModal(true);
    setBookingError(null);
    setTermsAgreed(false);
  };

  const handleCloseBookingModal = (): void => {
    setShowBookingModal(false);
    setSelectedRoom(null);
    setTermsAgreed(false);
    setBookingError(null);
    setIsBooking(false);
  };

  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setTermsAgreed(e.target.checked);
  };

  const validateBookingForm = (): boolean => {
    if (!termsAgreed) {
      setBookingError('You must agree to the terms and conditions');
      return false;
    }
    return true;
  };

  const handleBook = async () => {
    if (!selectedRoom?._id) return;
    const payload = {
      roomId: String(selectedRoom._id),
      termsAgreed,
    };
    setBookingError(null);

    if (!validateBookingForm()) {
      return;
    }

    setIsBooking(true);

    try {
      await dispatch(bookRoom(payload)).unwrap();
      
      handleCloseBookingModal();
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

  if (loading || settingsLoading || studentLoading) {
    return (
     <div className="flex items-center justify-center min-h-screen space-x-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-700">Loading available rooms...</p>
      </div>
    );
  }

  if (!isBookingPortalOpen) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => navigate('/management/student')}
                  variant="secondary"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Back to Dashboard</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Book a Room</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Browse and book available rooms</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Closed Notice */}
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          <Card className="p-8 text-center">
            <div className="text-yellow-500 mb-4">
              <ClockIcon className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Booking Portal Closed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The room booking portal is currently closed. Please check back during the booking period.
            </p>
            {openTime && closeTime && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Booking Schedule</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p><span className="font-medium">Opens:</span> {openTime.toLocaleString()}</p>
                  <p><span className="font-medium">Closes:</span> {closeTime.toLocaleString()}</p>
                </div>
              </div>
            )}
            <Button
              onClick={() => navigate('/student/dashboard')}
              variant="primary"
              className="flex items-center space-x-2 mx-auto"
            >
              <HomeIcon className="h-4 w-4" />
              <span>Return to Dashboard</span>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/student/dashboard')}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Book a Room</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredRooms.length} available room{filteredRooms.length !== 1 ? 's' : ''} • Updates in real-time
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-2 lg:hidden"
              >
                <FunnelIcon className="h-4 w-4" />
                <span>Filters</span>
              </Button>
              <div className="hidden sm:flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <ViewColumnsIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="sticky top-6">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                    <FunnelIcon className="h-5 w-5" />
                    <span>Filter Rooms</span>
                  </h3>
                  <Button
                    onClick={clearFilters}
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {/* Search */}
                  <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search Room Number
                    </label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        id="search"
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                        placeholder="e.g., 101, 202"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Room Type */}
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Room Type
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={filters.type}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">All Types</option>
                      <option value="single">Single</option>
                      <option value="double">Double</option>
                      <option value="triple">Triple</option>
                      <option value="deluxe">Deluxe</option>
                    </select>
                  </div>

                  {/* Capacity */}
                  <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Capacity
                    </label>
                    <select
                      id="capacity"
                      name="capacity"
                      value={filters.capacity}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Any Capacity</option>
                      <option value="1">1 Person</option>
                      <option value="2">2 People</option>
                      <option value="3">3 People</option>
                      <option value="4">4 People</option>
                    </select>
                  </div>
                </div>

                {/* Active Filters */}
                {(filters.type || filters.capacity || filters.search) && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Active Filters</h4>
                    <div className="flex flex-wrap gap-2">
                      {filters.search && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          Search: {filters.search}
                        </span>
                      )}
                      {filters.type && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          Type: {filters.type}
                        </span>
                      )}
                      {filters.capacity && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          Capacity: {filters.capacity}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Real-time Status Banner */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-sm text-green-800 dark:text-green-200">
                  <span className="font-medium">Live Updates:</span> Room availability updates automatically. No need to refresh!
                </p>
              </div>
            </div>

            {/* Results */}
            {filteredRooms.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <HomeIcon className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No rooms available
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Try adjusting your filters or check back later for new availability.
                </p>
                <Button onClick={clearFilters} variant="primary">
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
              }>
                {filteredRooms.map((room) => (
                  <Card key={String(room._id || room.id)} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                    {viewMode === 'grid' ? (
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                              Room {room.roomNumber}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {room.type || 'Standard'} Room
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Available
                          </span>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {room.capacity} person{room.capacity !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Current Occupancy:</span>
                            <div className="flex items-center space-x-2">
                              <UsersIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {room.currentOccupancy || 0}/{room.capacity}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${((room.currentOccupancy || 0) / room.capacity) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <Button
                            onClick={() => navigate(`/student/room-details/${String(room._id || room.id)}`)}
                            variant="primary"
                            className="flex-1 flex items-center justify-center space-x-2 !rounded-full px-4 py-2"
                          >
                            <InformationCircleIcon className="h-4 w-4" />
                            <span>View Details</span>
                          </Button>
                          <Button
                            onClick={() => handleOpenBookingModal(room)}
                            variant="success"
                            className="flex-1 !rounded-full px-4 py-2"
                            disabled={room.status !== 'available'}
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Room {room.roomNumber}
                              </h3>
                              <p className="text-sm text-gray-600 capitalize">
                                {room.type || 'Standard'} • {room.capacity} person{room.capacity !== 1 ? 's' : ''} • {room.currentOccupancy || 0}/{room.capacity} occupied
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Available
                            </span>
                            <Button
                              onClick={() => navigate(`/student/room-details/${room.id}`)}
                              variant="secondary"
                              size="sm"
                            >
                              View Details
                            </Button>
                            <Button
                              onClick={() => handleOpenBookingModal(room)}
                              variant="primary"
                              size="sm"
                              disabled={room.status !== 'available'}
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={handleCloseBookingModal}
        title={`Book Room ${selectedRoom?.roomNumber}`}
      >
        {selectedRoom && (
          <form onSubmit={handleBook} className="space-y-6">
            {/* Room Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center space-x-2">
                <HomeIcon className="h-5 w-5" />
                <span>Room Summary</span>
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Room Number:</span>
                  <p className="text-blue-900">{selectedRoom.roomNumber}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Type:</span>
                  <p className="text-blue-900 capitalize">{selectedRoom.type || 'Standard'}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Capacity:</span>
                  <p className="text-blue-900">{selectedRoom.capacity} person{selectedRoom.capacity !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Current Occupancy:</span>
                  <p className="text-blue-900">{selectedRoom.currentOccupancy || 0}/{selectedRoom.capacity}</p>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Terms and Conditions</h4>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 max-h-32 overflow-y-auto">
                <p className="mb-2">
                  By booking this room, you agree to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Follow all hostel rules and regulations</li>
                  <li>Respect other residents and maintain cleanliness</li>
                  <li>Pay all required fees on time</li>
                  <li>Report any damages or issues promptly</li>
                  <li>Vacate the room when required by the administration</li>
                </ul>
              </div>
              
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={handleTermsChange}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  I have read and agree to the terms and conditions of the hostel booking policy.
                </span>
              </label>
            </div>

            {/* Error Message */}
            {bookingError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{bookingError}</p>
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
                disabled={isBooking || !termsAgreed}
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
        )}
      </Modal>
    </div>
  );
};

export default BookRoom;

