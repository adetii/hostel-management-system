import React, { useState, useEffect } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  CalendarIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { bookingHistoryApi } from '@/api/bookingHistory';
import { 
  BookingArchive, 
  BookingSummaryResponse,
  BookingArchiveResponse 
} from '@/types';
import { Card } from './Card';
import Button from './Button';
import BookingCard from './BookingCard';
import BookingDetailsModal from './BookingDetailsModal';
import { useNavigate } from 'react-router-dom';

interface BookingHistoryProps {
  studentId: string;
  isViewMode?: boolean;
}

// Update the BookingHistory component to prevent flashing
const BookingHistory: React.FC<BookingHistoryProps> = ({ 
  studentId, 
  isViewMode = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(!isViewMode);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true); // Add this state
  const [summary, setSummary] = useState<BookingSummaryResponse | null>(null);
  const [archivedBookings, setArchivedBookings] = useState<BookingArchive[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingArchive | null>(null);
  const [archivePage, setArchivePage] = useState(1);
  const [archivePagination, setArchivePagination] = useState<any>(null);
  const [loadingArchives, setLoadingArchives] = useState(false);

  // Load booking summary when component mounts or expands
  useEffect(() => {
    if (isExpanded && !summary) {
      loadBookingSummary();
    }
  }, [isExpanded, studentId]);

  // Load archived bookings when summary is loaded
  useEffect(() => {
    if (summary && summary.summary?.archived?.count > 0) {
      loadArchivedBookings(1);
    } else if (summary) {
      setInitialLoad(false); // Set initial load to false even if no bookings
    }
  }, [summary]);

  const loadBookingSummary = async () => {
    try {
      setLoading(true);
      const summaryData = await bookingHistoryApi.getBookingSummary(studentId);
      setSummary(summaryData);
    } catch (error: any) {
      toast.error('Failed to load booking summary');
      console.error('Booking summary error:', error);
      setInitialLoad(false); // Set to false even on error
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedBookings = async (page: number = 1) => {
    try {
      setLoadingArchives(true);
      const response = await bookingHistoryApi.getArchivedBookings(studentId, {
        page,
        limit: 10
      });
      
      if (page === 1) {
        setArchivedBookings(response.archives);
      } else {
        setArchivedBookings(prev => [...prev, ...response.archives]);
      }
      
      setArchivePagination(response.pagination);
      setArchivePage(page);
      setInitialLoad(false); // Set to false after loading
    } catch (error: any) {
      toast.error('Failed to load archived bookings');
      console.error('Archived bookings error:', error);
      setInitialLoad(false); // Set to false even on error
    } finally {
      setLoadingArchives(false);
    }
  };

  const handleLoadMoreArchives = () => {
    if (archivePagination && archivePage < archivePagination.pages) {
      loadArchivedBookings(archivePage + 1);
    }
  };

  const navigate = useNavigate();

  if (!isExpanded) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-2">
            <ArchiveBoxIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Booking History
            </h3>
            {summary && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({summary.summary?.archived?.count || 0} archived)
              </span>
            )}
          </div>
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ArchiveBoxIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Booking History
          </h3>
          {summary && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({summary.summary?.archived?.count || 0} archived)
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <ChevronUpIcon className="w-5 h-5" />
        </button>
      </div>

      {loading || initialLoad ? ( // Show loading while initial load is happening
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading booking history...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Archived Bookings */}
          {archivedBookings.length > 0 ? (
            <div className="space-y-3">
              {archivedBookings.map((archive) => (
                <BookingCard
                  key={archive.publicId || archive._id}
                  booking={archive}
                  onViewDetails={() => {
                    const path = archive.publicId
                      ? `/management/admin/students/${studentId}/bookings/archived/p/${archive.publicId}`
                      : `/management/admin/students/${studentId}/bookings/archived/${archive._id}`;
                    navigate(path, {
                      state: { booking: archive }
                    });
                  }}
                  isArchived
                />
              ))}
              
              {archivePagination && archivePage < archivePagination.pages && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMoreArchives}
                    disabled={loadingArchives}
                  >
                    {loadingArchives ? 'Loading...' : 'Load More Archives'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <ArchiveBoxIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Archived Bookings
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                This student has no archived booking records.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
};

export default BookingHistory;