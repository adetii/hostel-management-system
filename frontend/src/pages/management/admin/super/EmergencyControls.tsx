import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/api/config';
import {
  ExclamationTriangleIcon,
  LockClosedIcon,
  LockOpenIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface EmergencyStatus {
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: {
    id: number;
    fullName: string;
    email: string;
  };
  reason?: string;
}

// EmergencyControls component
const EmergencyControls: React.FC = () => {
  const [emergencyStatus, setEmergencyStatus] = useState<EmergencyStatus>({ isLocked: false });
  const [loading, setLoading] = useState(true);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [locking, setLocking] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    fetchEmergencyStatus();
  }, []);

  const fetchEmergencyStatus = async () => {
    try {
      const response = await api.get('/super-admin/emergency-status');
      setEmergencyStatus(response.data);
    } catch (error) {
      toast.error('Failed to fetch emergency status');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyLock = async () => {
    if (confirmText !== 'EMERGENCY LOCK') {
      toast.error('Please type "EMERGENCY LOCK" to confirm');
      return;
    }

    if (!lockReason.trim()) {
      toast.error('Please provide a reason for the emergency lock');
      return;
    }

    setLocking(true);
    try {
      await api.post('/super-admin/emergency-lock', {
        reason: lockReason
      });
      toast.success('Emergency lock activated successfully');
      setShowLockModal(false);
      setLockReason('');
      setConfirmText('');
      fetchEmergencyStatus();
    } catch (error) {
      toast.error('Failed to activate emergency lock');
    } finally {
      setLocking(false);
    }
  };

  const handleEmergencyUnlock = async () => {
    setUnlocking(true);
    try {
      await api.post('/super-admin/emergency-unlock');
      toast.success('Emergency lock deactivated successfully');
      fetchEmergencyStatus();
    } catch (error) {
      toast.error('Failed to deactivate emergency lock');
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen space-x-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-700">Loading controls...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Emergency Controls</h1>
          <p className="text-gray-600 dark:text-gray-400">Emergency system controls for critical situations</p>
        </div>
      </div>

      {/* Current Status */}
      <div className={`rounded-lg p-6 ${
        emergencyStatus.isLocked 
          ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800' 
          : 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800'
      }`}>
        <div className="flex items-center">
          {emergencyStatus.isLocked ? (
            <LockClosedIcon className="h-8 w-8 text-red-600 mr-3" />
          ) : (
            <ShieldCheckIcon className="h-8 w-8 text-green-600 mr-3" />
          )}
          <div>
            <h2 className={`text-xl font-semibold ${
              emergencyStatus.isLocked ? 'text-red-900' : 'text-green-900'
            }`}>
              System Status: {emergencyStatus.isLocked ? 'EMERGENCY LOCKED' : 'NORMAL OPERATION'}
            </h2>
            <p className={`text-sm ${
              emergencyStatus.isLocked ? 'text-red-700' : 'text-green-700'
            }`}>
              {emergencyStatus.isLocked 
                ? 'Student dashboards are currently locked due to emergency'
                : 'All systems operating normally'
              }
            </p>
          </div>
        </div>

        {emergencyStatus.isLocked && emergencyStatus.lockedAt && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="font-medium text-red-900 dark:text-red-400 mb-2">Lock Details</h3>
            <div className="space-y-2 text-sm text-red-700 dark:text-red-300">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-2" />
                <span>Locked at: {new Date(emergencyStatus.lockedAt).toLocaleString()}</span>
              </div>
              {emergencyStatus.lockedBy && (
                <div>
                  <span>Locked by: {emergencyStatus.lockedBy.fullName} ({emergencyStatus.lockedBy.email})</span>
                </div>
              )}
              {emergencyStatus.reason && (
                <div>
                  <span className="font-medium">Reason: </span>
                  <span>{emergencyStatus.reason}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Emergency Actions */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Emergency Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Emergency Lock */}
            <div className="border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
                <h3 className="text-lg font-medium text-red-900 dark:text-red-400">Emergency Lock</h3>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                Immediately lock all student dashboards to prevent access during emergencies.
                This action will:
              </p>
              <ul className="text-sm text-red-600 dark:text-red-400 mb-4 list-disc list-inside space-y-1">
                <li>Block all student dashboard access</li>
                <li>Display emergency message to students</li>
                <li>Log the emergency action</li>
                <li>Send notifications to all admins</li>
              </ul>
              <button
                onClick={() => setShowLockModal(true)}
                disabled={emergencyStatus.isLocked}
                className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LockClosedIcon className="h-4 w-4 mr-2 inline" />
                {emergencyStatus.isLocked ? 'Already Locked' : 'Activate Emergency Lock'}
              </button>
            </div>

            {/* Emergency Unlock */}
            <div className="border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <LockOpenIcon className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
                <h3 className="text-lg font-medium text-green-900 dark:text-green-400">Emergency Unlock</h3>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Restore normal system operation and unlock student dashboards.
                This action will:
              </p>
              <ul className="text-sm text-green-600 mb-4 list-disc list-inside space-y-1">
                <li>Restore student dashboard access</li>
                <li>Remove emergency messages</li>
                <li>Log the unlock action</li>
                <li>Send notifications to all admins</li>
              </ul>
              <button
                onClick={handleEmergencyUnlock}
                disabled={!emergencyStatus.isLocked || unlocking}
                aria-busy={unlocking}
                className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {unlocking ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deactivating...
                  </>
                ) : (
                  <>
                    <LockOpenIcon className="h-4 w-4 mr-2 inline" />
                    {!emergencyStatus.isLocked ? 'System Not Locked' : 'Deactivate Emergency Lock'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Lock Modal */}
      {showLockModal && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4">
          <div className="relative mt-20 md:mt-0 mx-auto w-full max-w-md p-5 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="mt-1">
              <div className="flex items-center justify-center mb-4">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
              </div>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center mb-4">
                Confirm Emergency Lock
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for Emergency Lock
                  </label>
                  <textarea
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:ring-red-500 focus:border-red-500"
                    placeholder="Describe the emergency situation..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type "EMERGENCY LOCK" to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:ring-red-500 focus:border-red-500"
                    placeholder="EMERGENCY LOCK"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowLockModal(false);
                    setLockReason('');
                    setConfirmText('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmergencyLock}
                  disabled={locking}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {locking ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Activating...
                    </>
                  ) : (
                    'Activate Emergency Lock'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyControls;