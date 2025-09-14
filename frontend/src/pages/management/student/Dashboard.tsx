import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { RootState } from '@/store';
import { fetchStudentByIdFresh } from '@/store/slices/studentSlice';
import { fetchRooms, fetchRoomOccupantsFresh } from '@/store/slices/roomSlice';
import { fetchPublicSettings } from '@/store/slices/settingsSlice';
import { logoutUser } from '@/store/slices/authSlice';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useSocket } from '@/contexts/SocketContext';
import { RoomAvailabilityChangedData, BookingStatusUpdatedData } from '@/types/socket';
import { Card, Button } from '@/components/management/common';
import {
  UserIcon,
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  PhoneIcon,
  AcademicCapIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Booking } from '@/types';
import { invalidateSettingsCache } from '@/api/config';

const StudentDashboard: React.FC = () => {
  const { socket } = useSocket();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { selectedStudent: student, loading: studentLoading } = useSelector(
    (state: RootState) => state.student
  );
  const { rooms, loading: roomsLoading, roomOccupants } = useSelector((state: RootState) => state.room);
  const { settings, loading: settingsLoading } = useSelector((state: RootState) => state.settings);

  const [activeTab, setActiveTab] = useState<'overview' | 'roommates'>('overview');

  // Compute booking/room info BEFORE any effects that use roomIdStr
  const bookingsList = (student as any)?.Bookings ?? (student as any)?.bookings ?? [];
  const activeBooking = bookingsList.find((booking: Booking) => booking.status === 'active');

  // Ensure we always have a string roomId (handles both string ID and populated object)
  const roomIdStr =
    typeof activeBooking?.roomId === 'string'
      ? activeBooking.roomId
      : (activeBooking?.roomId as any)?._id;

  // Find room for active booking (use populated object directly if available)
  const currentRoom =
    (typeof activeBooking?.roomId === 'object' && (activeBooking?.roomId as any)?._id
      ? (activeBooking?.roomId as any)
      : rooms.find((room) => {
          return (
            room._id === roomIdStr ||
            room.id === roomIdStr
          );
        })) || null;

  // Normalize occupants and filter roommates robustly (handle id string/number and _id fallback)
  const toIdStr = (v: unknown) => (v == null ? '' : String(v));
  const normalizedOccupants = Array.isArray(roomOccupants)
    ? roomOccupants
    : (roomOccupants?.occupants ?? []);
  const roommates =
    normalizedOccupants.filter((occupant: any) => {
      const occId = toIdStr(occupant?.id ?? occupant?._id);
      const meId = toIdStr((student as any)?.id ?? (student as any)?._id);
      return occId !== meId;
    }) || [];

  // Initial fetches
  useEffect(() => {
    if (user && user.id) {
      dispatch(fetchStudentByIdFresh(user.id));
      dispatch(fetchRooms());
      dispatch(fetchPublicSettings());
    }
  }, [dispatch, user]);

  // Fresh occupants when roomId becomes known/changes
  useEffect(() => {
    if (roomIdStr) {
      dispatch(fetchRoomOccupantsFresh(roomIdStr));
    }
  }, [dispatch, roomIdStr]);

  // Consolidated socket listeners (force fresh reloads)
  useEffect(() => {
    if (!socket || !user?.id) return;

    const onRoomAvailabilityChanged = (data: RoomAvailabilityChangedData) => {
      dispatch(fetchRooms());
      if (roomIdStr && String(data.roomId) === String(roomIdStr)) {
        dispatch(fetchRoomOccupantsFresh(roomIdStr));
      }
      if (data.available) {
        toast.success(`Room ${data.roomNumber} is now available!`);
      }
    };

    const onBookingStatusUpdated = (data: BookingStatusUpdatedData) => {
      if (data.studentId === user.id) {
        toast.success(`Your booking status: ${data.status}`);
        dispatch(fetchStudentByIdFresh(user.id));
        if (roomIdStr) {
          dispatch(fetchRoomOccupantsFresh(roomIdStr));
        }
      }
    };

    const onRoommateUpdated = () => {
      if (roomIdStr) {
        dispatch(fetchRoomOccupantsFresh(roomIdStr));
      }
    };

    const refreshSettings = () => {
      invalidateSettingsCache();
      dispatch(fetchPublicSettings());
    };

    socket.on('room-availability-changed', onRoomAvailabilityChanged);
    socket.on('booking-status-updated', onBookingStatusUpdated);
    socket.on('roommate-updated', onRoommateUpdated);
    socket.on('settings-updated', refreshSettings);
    socket.on('portal-status-changed', refreshSettings);

    return () => {
      socket.off('room-availability-changed', onRoomAvailabilityChanged);
      socket.off('booking-status-updated', onBookingStatusUpdated);
      socket.off('roommate-updated', onRoommateUpdated);
      socket.off('settings-updated', refreshSettings);
      socket.off('portal-status-changed', refreshSettings);
    };
  }, [socket, user?.id, dispatch, roomIdStr]);

  // Listen for account deactivation (kept separate)
  useEffect(() => {
    if (socket && user) {
      socket.on('account-deactivated', (data) => {
        toast.error(data.message);
        dispatch(logoutUser());
      });

      return () => {
        socket.off('account-deactivated');
      };
    }
  }, [socket, user, dispatch]);

  if (studentLoading || roomsLoading || settingsLoading) {
    return (
     <div className="flex items-center justify-center min-h-screen space-x-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-700">Loading dashboard...</p>
      </div>
    );
  }

  // Compute booking portal status (robust parsing + strict window check)
  // Booking portal status helpers
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

    // numeric timestamp
    if (/^\d+$/.test(raw)) {
      const d = new Date(Number(raw));
      return isNaN(d.getTime()) ? null : d;
    }

    // normalize common server formats like "YYYY-MM-DD HH:mm" or "YYYY-MM-DDTHH:mm"
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

  const tabs = [
    { id: 'overview', name: 'Overview', icon: HomeIcon },
    { id: 'roommates', name: 'Roommates', icon: UsersIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                Welcome back, {student?.fullName || 'Student'}!
              </p>
            </div>
            
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Full Name</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{student?.full_name}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Level</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {student?.level ? `Level ${student.level}` : 'Not Set'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {activeBooking ? (
                  <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Booking Status</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {activeBooking ? 'Active' : 'No Booking'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPinIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Room Number</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentRoom?.roomNumber || 'Not Assigned'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
          <div className="border-b border-gray-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-2 sm:space-x-8 px-4 sm:px-6 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600'
                    } whitespace-nowrap py-4 px-2 sm:px-1 border-b-2 font-medium text-sm flex items-center space-x-1 sm:space-x-2 flex-shrink-0`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs sm:text-sm">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <HomeIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                      Current Accommodation
                    </h3>

                    {activeBooking && currentRoom ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-slate-400">Room Number:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{currentRoom.roomNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-slate-400">Room Type:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{currentRoom.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-slate-400">Capacity:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {currentRoom.capacity} {currentRoom.capacity === 1 ? 'Person' : 'People'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-slate-400">Booking Date:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(activeBooking.bookingDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                          <Button
                            onClick={() => setActiveTab('roommates')}
                            className="w-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                          >
                            View Roommates ({roommates.length})
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <HomeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-slate-400 mb-4">No active booking found</p>
                        {/* Conditional CTA based on portal status */}
                        {isBookingPortalOpen ? (
                          <Button
                            onClick={() => navigate('/management/student/rooms')}
                            className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                          >
                            Browse Available Rooms
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 rounded-lg p-3">
                              <h4 className="font-medium">Booking Portal Currently Closed</h4>
                            </div>
                            <Button
                              onClick={() => navigate('/management/student/rooms')}
                              className="bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600"
                            >
                              View Rooms
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )}

            {/* Roommates Tab */}
            {activeTab === 'roommates' && (
              <div className="space-y-6">
                {roommates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roommates.map((roommate: any, index: number) => (
                      <Card
                        key={String(roommate.id ?? roommate._id) || `rm-${index}`}
                        className="p-6"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-400 font-medium text-lg">
                                {(roommate.full_name || roommate.fullName || '')?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {roommate.full_name || roommate.fullName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                              {roommate.programmeOfStudy}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-slate-500">
                              {roommate.level ? `Level ${roommate.level}` : null}
                            </p>

                            {roommate.phoneNumber && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                                <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                                  <PhoneIcon className="h-4 w-4 mr-2" />
                                  {roommate.phoneNumber}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <UsersIcon className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Roommates</h3>
                    <p className="text-gray-500 dark:text-slate-400 mb-4">
                      {!activeBooking
                        ? 'You need to book a room first to see roommates'
                        : 'You are the only occupant in this room'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;