import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import {
  fetchBookings,
  updateBookingRoom,
  deleteBooking,
  clearAllBookings,
  Booking,
} from '@/store/slices/bookingSlice';
import { fetchRooms } from '@/store/slices/roomSlice';
import { Card } from '@/components/management/common/Card';
import Button from '@/components/management/common/Button';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  HomeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChartBarIcon,
  TableCellsIcon,
  UserPlusIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'react-hot-toast';
import ExportButton from '@/components/management/common/ExportButton';
import { exportBookingsToExcel, exportBookingsToPDF } from '@/utils/exportUtils';
import api from '@/api/config';
import { useLocation, useNavigate } from 'react-router-dom';

// Local interfaces for admin-assisted booking
interface Student {
  id: number;
  publicId?: string;
  full_name: string;
  email: string;
  programmeOfStudy?: string;
  level?: string;
  gender: 'male' | 'female';
  phoneNumber: string;
  isActive: boolean;
}

interface RoomLite {
  _id?: string;
  id?: string | number;
  roomNumber: string;
  roomType?: string;
  capacity: number;
  currentOccupancy?: number;
  status: string;
}

const ManageBookings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { socket } = useSocket();
  const { bookings, loading } = useSelector((state: RootState) => state.booking);
  const { rooms } = useSelector((state: RootState) => state.room);
  const location = useLocation();
  const navigate = useNavigate();

  // Filters and view state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Edit booking modal
  const [selectedBooking, setSelectedBookingLocal] = useState<Booking | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newRoomId, setNewRoomId] = useState<string | null>(null);
  const [isUpdatingBooking, setIsUpdatingBooking] = useState(false);
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);
  const [isClearingAllBookings, setIsClearingAllBookings] = useState(false);

  // Delete/Clear modals
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  // Admin-assisted booking modal
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [availableRooms, setAvailableRooms] = useState<RoomLite[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomLite | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  
  // Add this new loading state
  const [isFetchingRooms, setIsFetchingRooms] = useState(false);

  // Helpers
  const getRoomIdString = (room: RoomLite | any): string | null => {
    const rid = room?._id ?? room?.id;
    return rid != null ? String(rid) : null;
  };

  const getBookingRoomIdString = (b: Booking): string | null => {
    const anyB = b as any;
    // roomId could be: string, {_id}, {id}, or b.Room could be populated
    if (typeof anyB?.roomId === 'string') return anyB.roomId;
    const rid =
      anyB?.Room?._id ??
      anyB?.Room?.id ??
      anyB?.roomId?._id ??
      anyB?.roomId?.id;
    return rid != null ? String(rid) : null;
  };

  // Get student email from either User or studentId
  const getStudentEmail = (b: Booking | any): string | null => {
    return b?.User?.email ?? b?.studentId?.email ?? null;
  };

  // Effects
  useEffect(() => {
    dispatch(fetchBookings());
    dispatch(fetchRooms());
  }, [dispatch]);

  useEffect(() => {
    if (!socket) return;
    const onUpdated = () => {
      dispatch(fetchBookings());
    };
    const onDeleted = () => {
      dispatch(fetchBookings());
    };
    socket.on('booking-updated', onUpdated);
    socket.on('booking-deleted', onDeleted);
    return () => {
      socket.off('booking-updated', onUpdated);
      socket.off('booking-deleted', onDeleted);
    };
  }, [socket, dispatch]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q !== null) setSearchTerm(q);
  }, [location.search]);

  // Format helpers
  const parseDateFromMMDDYYYY = (dateString: string): Date | null => {
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  };

  // Derived data
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking: Booking) => {
      const search = searchTerm.trim().toLowerCase();

      const studentName = (
        booking.User?.full_name ||
        (booking as any).User?.fullName ||
        (booking as any).studentId?.fullName ||
        ''
      ).toLowerCase();

      const studentEmail = (
        booking.User?.email ||
        (booking as any).studentId?.email ||
        ''
      ).toLowerCase();

      const roomNumber = (
        booking.Room?.roomNumber ||
        (booking as any).roomId?.roomNumber ||
        ''
      ).toLowerCase();

      const matchesSearch =
        search === '' ||
        studentName.includes(search) ||
        studentEmail.includes(search) ||
        roomNumber.includes(search);

      const matchesStatus = statusFilter === '' || booking.status === statusFilter;

      const matchesDate =
        dateFilter === '' ||
        (() => {
          const filterDate = parseDateFromMMDDYYYY(dateFilter);
          if (!filterDate) return false;
          const bookingDate = new Date(booking.bookingDate);
          return bookingDate.toDateString() === filterDate.toDateString();
        })();

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bookings, searchTerm, statusFilter, dateFilter]);

  const hasActiveFilters = searchTerm !== '' || dateFilter !== '';

  const selectedRoomIdString = selectedBooking ? getBookingRoomIdString(selectedBooking) : null;

  // Ensure the edit modal includes current room (even if not available) plus all available rooms
  const editModalAvailableRooms = useMemo(() => {
    return rooms.filter((room: any) => {
      if (!selectedBooking) return true;
      const rid = getRoomIdString(room);
      return (selectedRoomIdString && rid === selectedRoomIdString) || room.status === 'available';
    });
  }, [rooms, selectedBooking, selectedRoomIdString]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const today = bookings.filter(
      (b) => new Date(b.bookingDate).toDateString() === new Date().toDateString()
    ).length;
    const thisWeek = bookings.filter((b) => {
      const bookingDate = new Date(b.bookingDate);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return bookingDate >= weekAgo && bookingDate <= now;
    }).length;
    const thisMonth = bookings.filter((b) => {
      const bookingDate = new Date(b.bookingDate);
      const now = new Date();
      return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
    }).length;
    return { total, today, thisWeek, thisMonth };
  }, [bookings]);

  // Handlers
  const handleEditBooking = (booking: Booking) => {
    setSelectedBookingLocal(booking);
    setNewRoomId(getBookingRoomIdString(booking));
    setIsEditModalOpen(true);
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) {
      setIsEditModalOpen(false);
      setSelectedBookingLocal(null);
      setNewRoomId(null);
      return;
    }
    const currentRid = getBookingRoomIdString(selectedBooking) ?? '';
    if (newRoomId && newRoomId !== currentRid) {
      setIsUpdatingBooking(true);
      try {
        await dispatch(
          updateBookingRoom({
            bookingId: selectedBooking._id,
            newRoomId,
          })
        );
        setIsEditModalOpen(false);
        setSelectedBookingLocal(null);
        setNewRoomId(null);
      } catch {
        // Thunk handles toasts/errors
      } finally {
        setIsUpdatingBooking(false);
      }
    } else {
      setIsEditModalOpen(false);
      setSelectedBookingLocal(null);
      setNewRoomId(null);
    }
  };

  const handleDeleteBooking = (bookingId: string) => {
    setShowDeleteModal(bookingId);
  };

  const confirmDelete = async () => {
    if (!showDeleteModal) return;
    setIsDeletingBooking(true);
    try {
      await dispatch(deleteBooking({ bookingId: showDeleteModal }));
      setShowDeleteModal(null);
    } catch {
      // Thunk handles toasts/errors
    } finally {
      setIsDeletingBooking(false);
    }
  };

  const handleClearAllBookings = () => setShowClearAllModal(true);

  const confirmClearAll = async () => {
    setIsClearingAllBookings(true);
    try {
      await dispatch(clearAllBookings());
      setShowClearAllModal(false);
    } catch {
      // Thunk handles toasts/errors
    } finally {
      setIsClearingAllBookings(false);
    }
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedBookingLocal(null);
    setNewRoomId(null);
  };

  const handleExportAllBookingsExcel = () => {
    exportBookingsToExcel(filteredBookings, 'All_Bookings_Report');
  };

  const handleExportAllBookingsPDF = () => {
    exportBookingsToPDF(filteredBookings, 'All Bookings Report');
  };

  const handleExportActiveBookingsExcel = () => {
    const activeBookings = filteredBookings.filter(
      (booking) => booking.status === 'confirmed' || booking.status === 'active'
    );
    exportBookingsToExcel(activeBookings, 'Active_Bookings_Report');
  };

  // Admin-assisted booking modal helpers
  const handleCloseAddBookingModal = () => {
    setShowAddBookingModal(false);
    setCurrentStep(1);
    setStudentSearchTerm('');
    setSearchResults([]);
    setSelectedStudent(null);
    setAvailableRooms([]);
    setSelectedRoom(null);
    setBookingError(null);
  };

  const searchStudents = async (term: string) => {
    if (term.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await api.get(`/students/search?q=${encodeURIComponent(term.trim())}`);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Student search error:', error);
      setSearchResults([]);
      toast.error('Failed to search students');
    } finally {
      setIsSearching(false);
    }
  };

  const fetchAvailableRooms = async (gender: 'male' | 'female') => {
    setIsFetchingRooms(true);
    try {
      const response = await api.get(`/rooms/available-by-gender?gender=${gender}`);
      setAvailableRooms(response.data || []);
    } catch (error) {
      console.error('Failed to fetch available rooms:', error);
      setAvailableRooms([]);
      toast.error('Failed to fetch available rooms');
    } finally {
      setIsFetchingRooms(false);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setCurrentStep(2);
    fetchAvailableRooms(student.gender);
  };

  const handleRoomSelect = (room: RoomLite) => {
    setSelectedRoom(room);
    setCurrentStep(3);
  };

  const handleCreateBooking = async () => {
    if (!selectedStudent || !selectedRoom) {
      toast.error('Please select both student and room');
      return;
    }
    setIsCreatingBooking(true);
    setBookingError(null);
    try {
      const response = await api.post('/bookings/admin-create', {
        studentId: selectedStudent.id,
        roomId: selectedRoom.id ?? selectedRoom._id,
        termsAgreed: true,
      });
      toast.success(response.data?.message || 'Booking created successfully');
      dispatch(fetchBookings());
      handleCloseAddBookingModal();
    } catch (error: any) {
      console.error('Create booking error:', error);
      const errorMessage = error?.response?.data?.message || 'Error creating booking';
      setBookingError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreatingBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen space-x-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-700">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Manage Bookings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage student room bookings
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <ExportButton
            options={[
              ...(hasActiveFilters
                ? [
                    {
                      label: 'Filtered Bookings (Excel)',
                      action: handleExportAllBookingsExcel,
                      icon: <TableCellsIcon className="w-4 h-4" />,
                    },
                  ]
                : []),
              {
                label: 'All Bookings (Excel)',
                action: () => exportBookingsToExcel(bookings, 'All_Bookings_Report'),
                icon: <TableCellsIcon className="w-4 h-4" />,
              },
              {
                label: 'Active Bookings (Excel)',
                action: handleExportActiveBookingsExcel,
                icon: <TableCellsIcon className="w-4 h-4" />,
              },
              {
                label: 'All Bookings (PDF)',
                action: handleExportAllBookingsPDF,
                icon: <TableCellsIcon className="w-4 h-4" />,
              },
            ]}
            className="[&>button]:bg-white [&>button]:hover:bg-white [&>button]:border-0 [&>button]:rounded-lg"
            buttonSize="xs"
          />
          <Button
            onClick={() => dispatch(fetchBookings({ bypassCache: true }))}
            variant="secondary"
            size="sm"
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
          >
            Refresh
          </Button>
          <Button
            onClick={() => setShowAddBookingModal(true)}
            variant="primary"
            size="sm"
            leftIcon={<UserPlusIcon className="w-5 h-5" />}
            className="w-full sm:w-auto"
          >
            Add Booking
          </Button>
          <Button
            onClick={handleClearAllBookings}
            variant="danger"
            size="sm"
            leftIcon={<TrashIcon className="w-5 h-5" />}
            className="w-full sm:w-auto"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Bookings</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.today}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CalendarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Week</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.thisWeek}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <CalendarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.thisMonth}</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <CalendarIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card variant="glass" className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name, email, or room number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          <div className="w-full lg:w-48">
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="MM/DD/YYYY"
              />
            </div>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </Card>

      {/* Bookings Display */}
      {viewMode === 'table' ? (
        <Card variant="glass" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Room Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Booking Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBookings.map((booking: Booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {booking.User?.full_name?.charAt(0).toUpperCase() || 'N'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {booking.User?.full_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {getStudentEmail(booking) || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <HomeIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            Room {booking.Room?.roomNumber || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Capacity: {booking.Room?.capacity ?? 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(booking.bookingDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          booking.status === 'confirmed' || booking.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {booking.status || 'confirmed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/management/admin/bookings/p/${booking.publicId}`)}
                          leftIcon={<EyeIcon className="w-4 h-4" />}
                        >
                          View
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleEditBooking(booking)}
                          className="flex-1"
                          leftIcon={<PencilIcon className="w-4 h-4" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteBooking(booking._id)}
                          leftIcon={<TrashIcon className="w-4 h-4" />}
                        >
                          Delete
                        </Button>
                        
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking: Booking) => (
            <Card key={booking._id} variant="glass" className="p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-shrink-0 h-12 w-12">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {booking.User?.full_name?.charAt(0).toUpperCase() || 'N'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                    {booking.User?.full_name || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {getStudentEmail(booking) || 'N/A'}
                  </p>
                </div>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    booking.status === 'confirmed' || booking.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : booking.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {booking.status || 'confirmed'}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center">
                    <HomeIcon className="w-4 h-4 mr-1" />
                    Room:
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {booking.Room?.roomNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center">
                    <UserIcon className="w-4 h-4 mr-1" />
                    Capacity:
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {booking.Room?.capacity ?? 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    Date:
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {new Date(booking.bookingDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/management/admin/bookings/p/${booking.publicId}`)}
                  leftIcon={<EyeIcon className="w-4 h-4" />}
                >
                  View
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleEditBooking(booking)}
                  className="flex-1"
                  leftIcon={<PencilIcon className="w-4 h-4" />}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteBooking(booking._id)}
                  leftIcon={<TrashIcon className="w-4 h-4" />}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Booking Modal */}
      {isEditModalOpen && selectedBooking && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Booking</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseModal}
                  leftIcon={<XMarkIcon className="w-5 h-5" />}
                />
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Student Info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Student Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Name
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedBooking.User?.full_name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {getStudentEmail(selectedBooking) || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Booking Info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Current Booking</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Current Room
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        Room {selectedBooking.Room?.roomNumber || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Booking Date
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(selectedBooking.bookingDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* New Room Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select New Room
                  </label>
                  <select
                    value={newRoomId ?? ''}
                    onChange={(e) => setNewRoomId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    {editModalAvailableRooms.map((room: any) => {
                      const rid = getRoomIdString(room);
                      return (
                        <option key={rid ?? room.roomNumber} value={rid ?? ''}>
                          Room {room.roomNumber} (Capacity: {room.capacity})
                          {room.status !== 'available' ? ' - Unavailable' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                
                <Button
                  onClick={handleCloseModal}
                  variant="secondary"
                  disabled={isUpdatingBooking}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateBooking}
                  variant="primary"
                  isLoading={isUpdatingBooking}
                  loadingText="Updating..."
                  disabled={isUpdatingBooking || !newRoomId || newRoomId === selectedRoomIdString}
                >
                  Update Booking
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
                Delete Booking
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                Are you sure you want to delete this booking? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setShowDeleteModal(null)} className="flex-1" disabled={isDeletingBooking}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={confirmDelete} className="flex-1" isLoading={isDeletingBooking} loadingText="Deleting..." disabled={isDeletingBooking}>
                  Delete Booking
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
                Clear All Bookings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                Are you sure you want to clear ALL bookings? This action cannot be undone and will delete all booking
                records.
              </p>
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setShowClearAllModal(false)} className="flex-1" disabled={isClearingAllBookings}>
                  Cancel
                </Button>
                <Button 
                  variant="danger" 
                  onClick={confirmClearAll} 
                  className="flex-1"
                  isLoading={isClearingAllBookings}
                  loadingText="Clearing..."
                  disabled={isClearingAllBookings}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Booking Modal */}
      {showAddBookingModal && (
        <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Create Booking for Student</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseAddBookingModal}
                  leftIcon={<XMarkIcon className="w-5 h-5" />}
                  className="p-2"
                />
              </div>

              {/* Steps */}
              <div className="flex items-center justify-between space-x-2 sm:space-x-4">
                <div
                  className={`flex items-center space-x-1 sm:space-x-2 ${
                    currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                      currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    1
                  </div>
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">Select Student</span>
                </div>
                <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700" />
                <div
                  className={`flex items-center space-x-1 sm:space-x-2 ${
                    currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                      currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    2
                  </div>
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">Select Room</span>
                </div>
                <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700" />
                <div
                  className={`flex items-center space-x-1 sm:space-x-2 ${
                    currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                      currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    3
                  </div>
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">Confirm</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search Student
                    </label>
                    <input
                      type="text"
                      value={studentSearchTerm}
                      onChange={(e) => {
                        setStudentSearchTerm(e.target.value);
                        searchStudents(e.target.value);
                      }}
                      placeholder="Enter name or email..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Results</h3>
                    <div className="space-y-2">
                      {isSearching && <p className="text-sm text-gray-500 dark:text-gray-400">Searching...</p>}
                      {!isSearching && searchResults.length === 0 && studentSearchTerm.trim().length >= 2 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No students found</p>
                      )}
                      {searchResults.map((s) => (
                        <div
                          key={s.id}
                          className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{s.full_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{s.email}</p>
                          </div>
                          <Button variant="primary" size="sm" onClick={() => handleStudentSelect(s)}>
                            Select
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && selectedStudent && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Available Rooms</h3>
                    <Button variant="secondary" size="sm" onClick={() => setCurrentStep(1)}>
                      Back
                    </Button>
                  </div>

                  {isFetchingRooms ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="ml-3 text-sm text-gray-600 dark:text-gray-400">Loading available rooms...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableRooms.length === 0 ? (
                        <div className="col-span-full text-center py-8">
                          <p className="text-sm text-gray-500 dark:text-gray-400">No available rooms found for {selectedStudent.gender} students</p>
                        </div>
                      ) : (
                        availableRooms.map((room) => {
                          const rid = getRoomIdString(room);
                          return (
                            <div
                              key={rid ?? room.roomNumber}
                              className={`p-4 rounded-lg border ${
                                selectedRoom && getRoomIdString(selectedRoom) === rid
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    Room {room.roomNumber}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Capacity: {room.capacity}
                                  </p>
                                </div>
                                <Button variant="primary" size="sm" onClick={() => handleRoomSelect(room)}>
                                  Select
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && selectedStudent && selectedRoom && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Confirm Booking</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Student: <span className="font-medium">{selectedStudent.full_name}</span>
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Room: <span className="font-medium">Room {selectedRoom.roomNumber}</span>
                    </p>
                  </div>
                  {bookingError && <p className="text-sm text-red-600">{bookingError}</p>}
                  <div className="flex justify-between">
                    <Button variant="secondary" onClick={() => setCurrentStep(2)}>
                      Back
                    </Button>
                    <Button variant="primary" onClick={handleCreateBooking} disabled={isCreatingBooking}>
                      {isCreatingBooking ? 'Creating...' : 'Create Booking'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBookings;