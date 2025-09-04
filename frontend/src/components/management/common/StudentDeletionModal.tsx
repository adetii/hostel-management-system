import React, { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, UserIcon, HomeIcon, CalendarIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import api from '@/api/config';

interface StudentDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  studentId: string;
  studentName: string;
  studentEmail: string;
  isDeleting: boolean;
}

interface DeletionPreview {
  student: {
    id: string;
    name: string;
    email: string;
    programmeOfStudy: string;
    level: string;
  };
  impact: {
    activeBookings: number;
    totalBookings: number;
    roomAssignments: number;
    affectedRooms: string[];
  };
  actions: string[];
}

const StudentDeletionModal: React.FC<StudentDeletionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  studentId,
  studentName,
  studentEmail,
  isDeleting
}) => {
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && studentId) {
      fetchDeletionPreview();
    }
  }, [isOpen, studentId]);

  const fetchDeletionPreview = async () => {
    setLoadingPreview(true);
    setPreviewError(null);
    
    try {
      const response = await api.get(`/students/${studentId}/deletion-preview`);
      setPreview(response.data);
    } catch (error: any) {
      console.error('Error fetching deletion preview:', error);
      setPreviewError(error?.response?.data?.message || 'Failed to load deletion preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="bg-black bg-opacity-50 fixed inset-0 z-40" onClick={onClose} />
      
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative z-50">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Delete Student Account
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action will permanently remove all student data
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={isDeleting}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 overflow-y-auto flex-1 min-h-0">
          {/* Student Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 h-10 w-10">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {studentName.charAt(0)?.toUpperCase() || 'N'}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  {studentName}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {studentEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Deletion Preview */}
          {loadingPreview ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading deletion preview...</span>
            </div>
          ) : previewError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-200 text-sm">
                {previewError}
              </p>
            </div>
          ) : preview ? (
            <div className="space-y-6">
              {/* Impact Summary */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Deletion Impact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Active Bookings
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                      {preview.impact.activeBookings}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <ArchiveBoxIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        Total Bookings
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                      {preview.impact.totalBookings}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <HomeIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Room Assignments
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                      {preview.impact.roomAssignments}
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                        Affected Rooms
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                      {preview.impact.affectedRooms.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Affected Rooms */}
              {preview.impact.affectedRooms.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Affected Rooms
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {preview.impact.affectedRooms.map((room, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200"
                      >
                        Room {room}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Actions to be Performed
                </h4>
                <ul className="space-y-2">
                  {preview.actions.map((action, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {action}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Warning */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Warning: This action cannot be undone
                    </h5>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      All personal data will be permanently deleted. Booking records will be archived with anonymized data for system integrity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-6 pb-6">
          {/* Actions */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:flex-1"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={onConfirm}
              className="w-full sm:flex-1"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                     Deleting...
                </>
              ) : (
                'Delete Student'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDeletionModal;
