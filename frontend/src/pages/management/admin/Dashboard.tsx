import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  HomeIcon, 
  CheckCircleIcon,                
  XCircleIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { RootState } from '@/store';
import { fetchStudents } from '@/store/slices/studentSlice';
import { fetchRooms } from '@/store/slices/roomSlice';
import { fetchBookings } from '@/store/slices/bookingSlice';
import { Card } from '@/components/management/common';
import { Student } from '@/types';
import { Room } from '@/types/room';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useSocket } from '@/contexts/SocketContext';
import { Link } from 'react-router-dom';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toggleStudentStatus } from '@/store/slices/studentSlice';
import { toast } from 'react-hot-toast';

// Enhanced Stats Card Component
interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  description?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color, 
  description 
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'from-green-500 to-green-600 text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'from-yellow-500 to-yellow-600 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400',
    red: 'from-red-500 to-red-600 text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400',
    purple: 'from-purple-500 to-purple-600 text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400',
    indigo: 'from-indigo-500 to-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400'
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm dark:shadow-slate-900/20 border border-gray-200 dark:border-slate-700 p-6 group hover:scale-105 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {value.toLocaleString()}
          </p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {description}
            </p>
          )}
          
          {trend && (
            <div className="flex items-center mt-2">
              {trend.isPositive ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {trend.value}%
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color].split(' ')[2]} ${colorClasses[color].split(' ')[3]} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`h-8 w-8 ${colorClasses[color].split(' ')[1]} ${colorClasses[color].split(' ')[4]}`} />
        </div>
      </div>
    </div>
  );
};





  const getActivityColor = (type: string) => {
    switch (type) {
      case 'booking': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'student': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'room': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
    }
  };

  

// Main Dashboard Component
const Dashboard = (): JSX.Element => {
  const { socket } = useSocket();
  const dispatch = useAppDispatch();
  const { students, loading: studentsLoading } = useSelector((state: RootState) => state.student);
  const { rooms, loading: roomsLoading } = useSelector((state: RootState) => state.room);
  const { bookings } = useSelector((state: RootState) => state.booking);

  useEffect(() => {
    dispatch(fetchStudents());
    dispatch(fetchRooms());
    dispatch(fetchBookings());
  }, [dispatch]);


    const handleToggleStatus = (studentId: string) => {
    dispatch(toggleStudentStatus(studentId) as any)
      .then(() => {
        toast.success('Student status updated successfully');
      })
      .catch(() => {
        toast.error('Failed to update student status');
      });
    };

  // Socket event handlers
  useEffect(() => {
    if (socket) {
      const handleRoomStatusChanged = () => dispatch(fetchRooms());
      const handleNewBooking = (data: any) => {
        dispatch(fetchStudents());
        dispatch(fetchRooms());
        dispatch(fetchBookings());
        toast.success(`New booking: ${data.studentName} booked Room ${data.roomNumber}`);
      };
      const handleBookingCancelled = (data: any) => {
        dispatch(fetchRooms());
        dispatch(fetchBookings());
        toast.success(`Booking cancelled: Room ${data.roomNumber} is now available`);
      };
      const handleRoomCreated = (data: any) => {
        dispatch(fetchRooms());
        toast.success(`New room added: Room ${data.roomNumber}`);
      };
      const handleRoomUpdated = (data: any) => {
        dispatch(fetchRooms());
        toast.success(`Room ${data.roomNumber} has been updated`);
      };
      const handleRoomDeleted = (data: any) => {
        dispatch(fetchRooms());
        toast.success(`Room ${data.roomNumber} has been deleted`);
      };
      const handleStudentUpdated = (data: any) => {
        dispatch(fetchStudents());
        toast.success(`Student profile updated: ${data.studentName}`);
      };
      const handleStudentDeleted = (data: any) => {
        dispatch(fetchStudents());
        toast.success(`Student removed: ${data.studentName}`);
      };
      const handleSettingsUpdated = () => {
        toast.success('System settings have been updated');
      };
      const handleRoomAvailabilityChanged = (data: any) => {
        dispatch(fetchRooms());
        if (data.available) {
          toast.success(`Room ${data.roomNumber} is now available!`);
        } else {
          toast.success(`Room ${data.roomNumber} occupancy updated`);
        }
      };

      // Register event listeners
      socket.on('room-status-changed', handleRoomStatusChanged);
      socket.on('new-booking', handleNewBooking);
      socket.on('booking-cancelled', handleBookingCancelled);
      socket.on('room-created', handleRoomCreated);
      socket.on('room-updated', handleRoomUpdated);
      socket.on('room-deleted', handleRoomDeleted);
      socket.on('student-updated', handleStudentUpdated);
      socket.on('student-deleted', handleStudentDeleted);
      socket.on('settings-updated', handleSettingsUpdated);
      socket.on('room-availability-changed', handleRoomAvailabilityChanged);

      // Cleanup
      return () => {
        socket.off('room-status-changed', handleRoomStatusChanged);
        socket.off('new-booking', handleNewBooking);
        socket.off('booking-cancelled', handleBookingCancelled);
        socket.off('room-created', handleRoomCreated);
        socket.off('room-updated', handleRoomUpdated);
        socket.off('room-deleted', handleRoomDeleted);
        socket.off('student-updated', handleStudentUpdated);
        socket.off('student-deleted', handleStudentDeleted);
        socket.off('settings-updated', handleSettingsUpdated);
        socket.off('room-availability-changed', handleRoomAvailabilityChanged);
      };
    }
  }, [socket, dispatch]);

  

  // Calculate statistics
  const totalStudents = students.length;
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((room: Room) => room.isAvailable === true).length;
  const unavailableRooms = rooms.filter((room: Room) => room.isAvailable === false).length;
  const totalBookings = bookings.length;
  const occupancyRate = totalRooms > 0 ? Math.round((unavailableRooms / totalRooms) * 100) : 0;


  if (studentsLoading || roomsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen space-x-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-700">Loading stats...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 dark:text-slate-300">
            Welcome back! 
            Here's what's happening in your hostel today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Students"
            value={totalStudents}
            icon={UserGroupIcon}
            color="blue"
            trend={{ value: 12, isPositive: true }}
            description="Active registrations"
          />
          <StatsCard
            title="Total Rooms"
            value={totalRooms}
            icon={HomeIcon}
            color="indigo"
            description="Available inventory"
          />
          <StatsCard
            title="Available Rooms"
            value={availableRooms}
            icon={CheckCircleIcon}
            color="green"
            trend={{ value: 8, isPositive: true }}
            description="Ready for booking"
          />
          <StatsCard
            title="Utilization Rate"
            value={occupancyRate}
            icon={ChartBarIcon}
            color="purple"
            trend={{ value: 5, isPositive: true }}
            description={`${unavailableRooms}/${totalRooms} rooms`}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatsCard
            title="Unavailable Rooms"
            value={unavailableRooms}
            icon={XCircleIcon}
            color="red"
            description="Currently unavailable"
          />
          <StatsCard
            title="Total Bookings"
            value={totalBookings}
            icon={CalendarDaysIcon}
            color="green"
            description="All time bookings"
          />
          <StatsCard
            title="Room Efficiency"
            value={Math.round((availableRooms / totalRooms) * 100)}
            icon={ChartBarIcon}
            color="blue"
            description="Available percentage"
          />
        </div>

       

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Students */}
          <div className="lg:col-span-2">
            <Card variant="glass">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Students
                  </h3>
                  <Link 
                    to="/management/admin/students" 
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    View all
                    <ArrowRightIcon className="ml-1 h-4 w-4" />
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-sm">
                          Student
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-sm">
                          Programme
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-sm">
                          Level
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 text-sm">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {students.slice(0, 5).map((student: Student) => (
                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                {student.full_name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {student.full_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  ID: N/A
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {student.programmeOfStudy}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Level {student.level}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                                student.isActive
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}
                            >
                              {student.isActive ? (
                                <>
                                  <CheckIcon className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <XMarkIcon className="h-3 w-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
