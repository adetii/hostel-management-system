import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  HomeIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  ArchiveBoxIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { BookingArchive } from '@/types';
import { Card } from '@/components/management/common/Card';
import Button from '@/components/management/common/Button';
import { FaEnvelope } from 'react-icons/fa';

const ArchivedBookingDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { studentId } = useParams<{ studentId: string }>();
  const booking = (location.state as any)?.booking as BookingArchive | undefined;

  const goBack = () => {
    if (studentId) {
      navigate(`/management/admin/students/${studentId}?tab=bookings`);
    } else {
      navigate(-1);
    }
  };

  if (!booking) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArchiveBoxIcon className="w-5 h-5 text-gray-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Archived Booking
              </h1>
            </div>
          </div>
          <div className="text-gray-700 dark:text-gray-300">
            <p>This archived booking couldn’t be loaded directly.</p>
            <p className="mt-2">Please navigate here from the student’s Booking History list.</p>
            <div className="mt-6">
              <Button variant="primary" onClick={goBack} leftIcon={<ArrowLeftIcon className="w-5 h-5" />}>
                Back
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const roomInfo = (() => {
    const r: any = (booking as any).room ?? (booking as any).roomId;
    if (r && typeof r === 'object') {
      return {
        roomNumber: r?.roomNumber ?? 'N/A',
        roomType: r?.roomType ?? r?.type ?? 'N/A',
        capacity: r?.capacity ?? 'N/A',
      };
    }
    return { roomNumber: 'N/A', roomType: 'N/A', capacity: 'N/A' };
  })();

  const studentInfo = (() => {
    const s: any = (booking as any).student ?? (booking as any).studentId;
    if (s && typeof s === 'object') {
      return {
        fullName: s?.fullName ?? s?.full_name ?? 'N/A',
        email: s?.email ?? 'N/A',
      };
    }
    return { fullName: 'N/A', email: 'N/A' };
  })();

  const academicPeriod =
    booking.academicYear && booking.semester
      ? `${booking.academicYear} Semester ${booking.semester}`
      : 'N/A';

  const formatDateTime = (d?: string) => (d ? new Date(d).toLocaleString() : 'N/A');
  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : 'N/A');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <Button 
                  variant="primary" 
                  onClick={goBack} 
                  leftIcon={<ArrowLeftIcon className="w-5 h-5" />}
                  className="shrink-0"
                >
                  Back
                </Button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white break-words">
                    Archived Booking
                  </h1>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1 break-words">
                    Room {roomInfo.roomNumber} • {academicPeriod}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                  <ArchiveBoxIcon className="w-4 h-4" />
                  Archived
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Core Details */}
            <div className="xl:col-span-2 space-y-6">
              {/* Room & Booking Info */}
              <Card className="p-0 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <HomeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Room & Booking Details</h2>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                        <HomeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Room Number
                        </p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white break-words">
                          {roomInfo.roomNumber}
                          {roomInfo.roomType !== 'N/A' && (
                            <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                              • {roomInfo.roomType}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Capacity: {roomInfo.capacity}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
                        <CalendarIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Booking Date
                        </p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white break-words">
                          {formatDate(booking.bookingDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0">
                        <ClockIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Archived At
                        </p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white break-words">
                          {formatDateTime((booking as any).archivedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-lg flex items-center justify-center shrink-0">
                        <CheckCircleIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Academic Period
                        </p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white break-words">
                          {academicPeriod}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Student Info */}
            <div className="space-y-6">
              <Card className="p-0 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Student Information</h2>
                  </div>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <UserIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Full Name
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white break-words">
                        {studentInfo.fullName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
                      <FaEnvelope className="text-sm font-medium text-gray-600 dark:text-gray-400">@</FaEnvelope>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Email Address
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white break-all">
                        {studentInfo.email}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchivedBookingDetails;