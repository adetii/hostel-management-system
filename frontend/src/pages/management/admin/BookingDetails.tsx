import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  HomeIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  UserIcon,
  BuildingOfficeIcon,
  ClockIcon,
  InformationCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/management/common/Card';
import Button from '@/components/management/common/Button';
import api from '@/api/config';
import { toast } from 'react-hot-toast';
import { exportBookingsToPDF } from '@/utils/exportUtils';

const BookingDetails = () => {
  const { publicId, id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        // Use publicId if available, otherwise fall back to id
        const bookingId = publicId || id;
        const url = publicId ? `/bookings/p/${publicId}` : `/bookings/${id}`;
        const { data } = await api.get(url);
        setBooking(data);
      } catch (err) {
        console.error('Failed to load booking:', err);
        toast.error(err?.response?.data?.message || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    if (publicId || id) fetchBooking();
  }, [publicId, id]);

  const studentName = useMemo(() => {
    return (
      booking?.studentId?.fullName ||
      booking?.studentId?.full_name ||
      booking?.User?.full_name ||
      booking?.User?.fullName ||
      booking?.User?.name ||
      booking?.studentName ||
      'N/A'
    );
  }, [booking]);

  const studentEmail = useMemo(() => {
    return booking?.User?.email || booking?.studentId?.email || 'N/A';
  }, [booking]);

  const roomInfo = useMemo(() => {
    const r = booking?.Room || booking?.roomId || {};
    return {
      roomNumber: r.roomNumber ?? 'N/A',
      roomType: r.roomType || r.type || 'Standard',
      capacity: r.capacity ?? 'N/A'
    };
  }, [booking]);

  const academicPeriod = useMemo(() => {
    if (!booking?.academicYear || !booking?.semester) return 'N/A';
    return `${booking.academicYear} Semester ${booking.semester}`;
  }, [booking]);

  const statusInfo = useMemo(() => {
    const isArchived = booking?.status === 'archived';
    if (isArchived) {
      return {
        label: 'Archived',
        description: 'This booking has been archived and is no longer active.',
        color: 'text-gray-700 dark:text-gray-300',
        bgColor: 'bg-gray-100 dark:bg-gray-700',
        borderColor: 'border-gray-200 dark:border-gray-600',
        icon: <ArchiveBoxIcon className="w-4 h-4" />
      };
    }
    switch (booking?.status) {
      case 'active':
        return {
          label: 'Active',
          description: 'This booking is currently active and the room is occupied.',
          color: 'text-emerald-700 dark:text-emerald-300',
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
          icon: <CheckCircleIcon className="w-4 h-4" />
        };
      case 'inactive':
      case 'cancelled':
        return {
          label: 'Cancelled',
          description: 'This booking has been cancelled.',
          color: 'text-red-700 dark:text-red-300',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: <XCircleIcon className="w-4 h-4" />
        };
      case 'pending':
        return {
          label: 'Pending',
          description: 'This booking is awaiting approval.',
          color: 'text-amber-700 dark:text-amber-300',
          bgColor: 'bg-amber-50 dark:bg-amber-900/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
          icon: <ExclamationTriangleIcon className="w-4 h-4" />
        };
      default:
        return {
          label: booking?.status || 'Unknown',
          description: 'Booking status information',
          color: 'text-gray-700 dark:text-gray-300',
          bgColor: 'bg-gray-100 dark:bg-gray-700',
          borderColor: 'border-gray-200 dark:border-gray-600',
          icon: <InformationCircleIcon className="w-4 h-4" />
        };
    }
  }, [booking]);

  const handleExport = () => {
    if (!booking) return;
    
    // Create enhanced booking data for export with multiple student name formats
    const bookingForExport = {
      ...booking,
      // Ensure student name is available in all possible formats the PDF function might expect
      studentFullName: studentName,
      studentName: studentName,
      student_name: studentName,
      full_name: studentName,
      fullName: studentName,
      // Enhance User object (in case PDF function looks here)
      User: {
        ...booking.User,
        full_name: studentName,
        fullName: studentName,
        name: studentName
      },
      // Enhance studentId object (preserve original data)
      studentId: {
        ...booking.studentId,
        full_name: studentName,
        fullName: studentName,
        name: studentName
      }
    };
    
    const friendlyTitle = `Booking - ${studentName}`;
    console.log('Exporting with student name:', studentName);
    
    exportBookingsToPDF([bookingForExport], friendlyTitle);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen space-x-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-700">Loading booking details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-6 sm:p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Booking Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We couldn't find the booking you requested. It may have been deleted or the ID is incorrect.
            </p>
            <Button variant="primary" onClick={() => navigate('/management/admin/bookings')}>
              Back to Bookings
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title & Breadcrumb */}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <HomeIcon className="w-4 h-4" />
                <span>Bookings</span>
                <span>/</span>
                <span className="text-gray-900 dark:text-white">Room {roomInfo.roomNumber}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Booking Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {academicPeriod} • Created {formatDateTime(booking?.createdAt)}
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}>
                {statusInfo.icon}
                {statusInfo.label}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            
            <Button
              variant="primary"
              onClick={handleExport}
              leftIcon={<DocumentArrowDownIcon className="w-4 h-4" />}
              className="sm:order-1"
            >
              Export PDF
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/management/admin/bookings')}
              leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
              className="sm:order-2"
            >
              Back to Bookings
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Status Description */}
        <div className="mb-8">
          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Booking Status</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {statusInfo.description}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Primary Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room Information */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <BuildingOfficeIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Room Information</h2>
                    <p className="text-blue-100 text-sm">Accommodation details</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="group">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-full border border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <HomeIcon className="w-4 h-4 text-gray-500" />
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Room Number</p>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{roomInfo.roomNumber}</p>
                    </div>
                  </div>
                  
                  <div className="group">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-full border border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <HomeIcon className="w-4 h-4 text-gray-500" />
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Room Type</p>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white capitalize">{roomInfo.roomType}</p>
                    </div>
                  </div>
                  
                  <div className="group">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-full border border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <UserIcon className="w-4 h-4 text-gray-500" />
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Capacity</p>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{roomInfo.capacity}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Booking Timeline */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Booking Timeline</h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Booking Date</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white ml-5">
                      {formatDate(booking?.bookingDate)}
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Academic Period</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white ml-5">
                      {academicPeriod}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Student Info & Actions */}
          <div className="space-y-6">
            {/* Student Information */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Student Information</h2>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Full Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{studentName}</p>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Email Address</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{studentEmail}</p>
                </div>
              </div>
            </Card> 
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;