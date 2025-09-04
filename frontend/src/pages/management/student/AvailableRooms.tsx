import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { RootState } from '@/store';
import { fetchRooms, bookRoom } from '@/store/slices/roomSlice';
import { fetchPublicSettings } from '@/store/slices/settingsSlice';
import { fetchStudentById, fetchStudentByIdFresh } from '@/store/slices/studentSlice';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { Card, Button as CommonButton, Modal } from '@/components/management/common';
import { Room } from '@/types/room';
import { Booking } from '@/types';
import { useSocket } from '@/contexts/SocketContext';
import { RoomJustBookedData } from '@/types/socket';
import {
  HomeIcon,
  UsersIcon,
  FunnelIcon,
  ArrowLeftIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MapPinIcon,
  EyeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { invalidateSettingsCache } from '@/api/config';

interface Filters {
  type: string;
  capacity: string;
  search: string;
}
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
const AvailableRooms: React.FC = () => {
  const { socket } = useSocket();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { rooms, loading } = useSelector((state: RootState) => state.room);
  const { settings, loading: settingsLoading } = useSelector((state: RootState) => state.settings);
  const { user } = useSelector((state: RootState) => state.auth);
  const { selectedStudent: student, loading: studentLoading } = useSelector(
    (state: RootState) => state.student
  );

  // UI/State
  const [filters, setFilters] = useState<Filters>({ type: '', capacity: '', search: '' });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [termsAgreed, setTermsAgreed] = useState<boolean>(false);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const redirectingRef = useRef(false);

  // Normalize helpers
  const getRoomType = (room?: Partial<Room> | null): string => {
    const raw = (room as any)?.type ?? (room as any)?.roomType ?? '';
    const norm = String(raw || '').trim().toLowerCase();
    return norm || 'standard';
  };

  const getRoomStatus = (room?: any): string => {
    const status = room?.status;
    const isAvailable = typeof room?.isAvailable === 'boolean' ? room?.isAvailable : undefined;
    if (typeof status === 'string' && status) return status.toLowerCase();
    if (typeof isAvailable === 'boolean') return isAvailable ? 'available' : 'occupied';
    return 'unknown';
  };

  const getCurrentOccupancy = (room?: any): number => {
    if (!room) return 0;
    if (Array.isArray(room.occupants)) return room.occupants.length;
    if (typeof room.currentOccupancy === 'number') return room.currentOccupancy;
    return 0;
  };

  const getAvailableSpaces = (room?: any): number => {
    const capacity = Number(room?.capacity ?? 0);
    const current = getCurrentOccupancy(room);
    return Math.max(0, capacity - current);
  };

  // Normalize boolean-like values from settings (e.g., "true", "false", 1, 0)
  const normalizeBoolean = (v: unknown): boolean => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v === 1;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      return s === 'true' || s === '1' || s === 'yes' || s === 'on';
    }
    return false;
  };

  // Effects
  useEffect(() => {
    dispatch(fetchRooms());
    dispatch(fetchPublicSettings());
    if (user?.id) dispatch(fetchStudentById(user.id.toString()));
  }, [dispatch, user?.id]);

  // Redirect if student has active booking
  useEffect(() => {
    const list = (student as any)?.Bookings ?? (student as any)?.bookings ?? [];
    if (Array.isArray(list) && list.some((b: Booking) => b.status === 'active')) {
      navigate('/management/student');
    }
  }, [student, navigate]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;
    const handler = (data: RoomJustBookedData) => {
      // suppress for self (avoid toasting when the current user booked the room)
      if (!user || String(data.studentId) === String(user.id)) return;
      dispatch(fetchRooms());
      toast.error(`Room ${data.roomNumber} was just booked by another student`);
    };
    const onSettingsUpdated = () => {
      invalidateSettingsCache();
      dispatch(fetchPublicSettings());
    };
    const onPortalStatusChanged = () => {
      invalidateSettingsCache();
      dispatch(fetchPublicSettings());
    };

    socket.on('settings-updated', onSettingsUpdated);
    socket.on('portal-status-changed', onPortalStatusChanged);
    socket.on('room-just-booked', handler);
    return () => {
      socket.off('room-just-booked', handler);
      socket.off('settings-updated', onSettingsUpdated);
      socket.off('portal-status-changed', onPortalStatusChanged);
    };
  }, [socket, dispatch, user]);

  // Filter change handlers
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ type: '', capacity: '', search: '' });
  };

  // Optimize filtering and sorting with useMemo
  const filteredRooms = useMemo(() => {
    const list = (rooms as Room[]).filter(r => {
      // normalize fields
      const status = getRoomStatus(r);
      const type = getRoomType(r);

      if (status !== 'available') return false;
      if (filters.type && type !== filters.type) return false;

      if (filters.capacity) {
        const cap = Number(filters.capacity);
        if (Number(r.capacity) !== cap) return false;
      }

      if (filters.search) {
        const rn = String(r.roomNumber || '').toLowerCase();
        if (!rn.includes(filters.search.toLowerCase())) return false;
      }
      return true;
    });

    const normalize = (rn: string) => {
      const match = (rn || '').match(/^([A-Za-z]+)(\d+)/);
      if (match) return { prefix: match[1].toUpperCase(), num: parseInt(match[2], 10) };
      return { prefix: (rn || '').toUpperCase(), num: Number.MAX_SAFE_INTEGER };
    };

    return list.sort((a, b) => {
      const A = normalize(String(a.roomNumber || ''));
      const B = normalize(String(b.roomNumber || ''));
      if (A.prefix !== B.prefix) return A.prefix < B.prefix ? -1 : 1;
      if (A.num !== B.num) return A.num - B.num;
      return String(a.roomNumber || '').localeCompare(String(b.roomNumber || ''));
    });
  }, [rooms, filters]);

  // Booking modal handlers
  const handleOpenBookingModal = (room: Room): void => {
    // Safety: block opening when portal is closed (in case any UI path missed the check)
    if (!isBookingPortalOpen) {
      toast.error('Booking portal is currently closed.');
      return;
    }
    setSelectedRoom(room);
    setShowBookingModal(true);
    setBookingError(null);
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

  const handleBookRoom = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!selectedRoom) return;

    setBookingError(null);
    if (!validateBookingForm()) return;

    const roomId = (selectedRoom as any)?._id ?? String((selectedRoom as any)?.id ?? '');
    if (!roomId || typeof roomId !== 'string') {
      setBookingError('Invalid room identifier. Please try again.');
      return;
    }

    setIsBooking(true);
    try {
      await dispatch(
        bookRoom({
          roomId,
          termsAgreed
        })
      ).unwrap();

      toast.success('Room booked successfully!');

      // mark redirecting, close modal, navigate with replace
      redirectingRef.current = true;
      handleCloseBookingModal();
      navigate('/management/student', { replace: true });

      // background refresh (do not await)
      if (user?.id) {
        setTimeout(() => {
          dispatch(fetchStudentByIdFresh(String(user.id)));
        }, 0);
      }
      return;
    } catch (error: any) {
      setBookingError(error?.message || 'Failed to book room. Please try again.');
    } finally {
      if (!redirectingRef.current) {
        setIsBooking(false);
      }
    }
  };

  // Booking portal availability (robust parsing + strict window check)
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                    <Button
                      onClick={() => navigate('/management/student')}
                      variant="secondary"
                      size="sm"
                      className="flex items-center space-x-2 flex-shrink-0"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Back to Dashbaord</span>
                    </Button>           
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Available Rooms</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1"></p>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Booking Portal Status */}
        {!isBookingPortalOpen && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-yellow-900 dark:text-yellow-200 mb-2">
                  Booking Portal Currently Closed
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                  Room booking is not currently available. You can browse rooms but cannot make bookings at this time.
                </p>
                
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="p-6 mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search by room number..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Filter Toggle and View Mode */}
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className=" dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-600 flex items-center"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters
                {(filters.type || filters.capacity) && (
                  <span className="ml-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {[filters.type, filters.capacity].filter(Boolean).length}
                  </span>
                )}
              </Button>

              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <ViewColumnsIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Room Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={filters.type}
                    onChange={handleFilterChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Types</option>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="triple">Triple</option>
                    <option value="deluxe">Deluxe</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Capacity
                  </label>
                  <select
                    id="capacity"
                    name="capacity"
                    value={filters.capacity}
                    onChange={handleFilterChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Any Capacity</option>
                    <option value="1">1 Person</option>
                    <option value="2">2 People</option>
                    <option value="3">3 People</option>
                    <option value="4">4 People</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={clearFilters}
                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Rooms Display */}
        {filteredRooms.length === 0 ? (
          <Card className="p-12 text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <HomeIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No rooms found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Try adjusting your filters to see more rooms.
            </p>
            <Button onClick={clearFilters} className="bg-blue-600 text-white hover:bg-blue-700">
              Clear All Filters
            </Button>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredRooms.map(room => {
              const type = getRoomType(room);
              const capacity = Number(room.capacity ?? 0);

              return viewMode === 'grid' ? (
                <Card
                  key={String((room as any)._id ?? (room as any).id ?? Math.random())}
                  className="overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                          <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
                          Room {String(room.roomNumber || '')}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 capitalize mt-1">
                          {type} Room
                        </p>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Available
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                          <UsersIcon className="h-4 w-4 mr-2" />
                          Capacity:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {capacity} {capacity === 1 ? 'Person' : 'People'}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        onClick={() => navigate(`/management/student/rooms/p/${room.publicId || room._id || room.id}`)}
                        className="bg-gray-600 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600 rounded-lg px-4 py-2 flex items-center justify-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      {isBookingPortalOpen && (
                       <Button
                            onClick={() => handleOpenBookingModal(room)}
                            variant="success"
                            className="bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
                          >
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Book
                          </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card
                  key={String((room as any)._id ?? (room as any).id ?? Math.random())}
                  className="p-6 hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <MapPinIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Room {String(room.roomNumber || '')}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                          {type} Room • {capacity} {capacity === 1 ? 'Person' : 'People'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <span className="inline-flex items-center justify-center sm:justify-start px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Available
                    </span>
                    
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => navigate(`/management/student/rooms/p/${room.publicId || room._id || room.id}`)}
                        className="bg-gray-600 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600 rounded-lg px-4 py-2 flex items-center justify-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      
                      {isBookingPortalOpen && (
                        <Button
                          onClick={() => handleOpenBookingModal(room)}
                          variant='success'
                          className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2 flex items-center justify-center"
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Book
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Booking Modal */}
        <Modal
        isOpen={showBookingModal}
        onClose={handleCloseBookingModal}
        title={`Book Room ${selectedRoom?.roomNumber ?? ''}`}
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
                <p className="text-blue-900 dark:text-blue-300">{selectedRoom?.roomNumber}</p>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-400 font-medium">Type:</span>
                <p className="text-blue-900 dark:text-blue-300 capitalize">{getRoomType()}</p>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-400 font-medium">Capacity:</span>
                <p className="text-blue-900 dark:text-blue-300">
                  {selectedRoom?.capacity} {selectedRoom?.capacity === 1 ? 'Person' : 'People'}
                </p>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-400 font-medium">Available Spaces:</span>
                <p className="text-blue-900 dark:text-blue-300">{getAvailableSpaces(selectedRoom)}</p>
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
      </Modal>
      </div>
    </div>
  );
};

export default AvailableRooms;
