import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { fetchSettings, updateSettings } from '@/store/slices/settingsSlice';
import { Card } from '@/components/management/common/Card';
import Button from '@/components/management/common/Button';
import { useSocket } from '@/contexts/SocketContext';
import {
  CogIcon,
  CalendarIcon,
  ClockIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  BellIcon,
  UserGroupIcon,
  HomeIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '@/api/config';

interface SettingsFormData {
  bookingPortalEnabled: boolean;
  bookingPortalOpenDateTime: string;
  bookingPortalCloseDateTime: string;
}

interface NoticeForm {
  subject: string;
  message: string;
}

// Settings component
const Settings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { settings, loading } = useSelector((state: RootState) => state.settings);
  const { socket } = useSocket();
  const [formData, setFormData] = useState<SettingsFormData>({
    bookingPortalEnabled: false,
    bookingPortalOpenDateTime: '',
    bookingPortalCloseDateTime: '',
  });
  const [activeTab, setActiveTab] = useState('booking');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Get current user and compute super admin flag
  const { user } = useSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role === 'super_admin';

  // Academic period state
  const [academicPeriod, setAcademicPeriod] = useState<any>(null);
  const [loadingAcademic, setLoadingAcademic] = useState<boolean>(false);
  const [transitioning, setTransitioning] = useState<boolean>(false);

  // Notice form state
  const [noticeForm, setNoticeForm] = useState({
    subject: '',
    message: '',
    attachment: null as File | null
  });
  const [sendingNotice, setSendingNotice] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Define tabs
  const tabs = [
    { id: 'booking', name: 'Booking Portal', icon: CalendarIcon },
    { id: 'send-notice', name: 'Send Notice', icon: EnvelopeIcon },
    { id: 'general', name: 'General', icon: CogIcon },
    ...(isSuperAdmin ? [{ id: 'academic', name: 'Academic Period', icon: CalendarIcon }] : []),
  ];

  // Fetch academic period function
  const fetchAcademicPeriod = async () => {
    if (!isSuperAdmin) return;
    try {
      setLoadingAcademic(true);
      const res = await api.get('/academic/settings');
      setAcademicPeriod(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load academic period');
    } finally {
      setLoadingAcademic(false);
    }
  };

  // Handle semester transition
  const handleTransitionSemester = async () => {
    if (transitioning) return;
    const confirmed = window.confirm(
      'This action will close the current semester, mark active bookings as inactive, and advance the academic period.\n\nDo you want to proceed?'
    );
    if (!confirmed) return;

    setTransitioning(true);
    try {
      const res = await api.post('/academic/transition-semester');
      const message =
        res?.data?.message ||
        `Semester transitioned successfully to ${res?.data?.to || 'next period'}.`;
      toast.success(message);
      await fetchAcademicPeriod();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to transition semester');
    } finally {
      setTransitioning(false);
    }
  };

  // Format date for input
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  // Create form data from settings
  const createFormDataFromSettings = (settings: any): SettingsFormData => ({
    bookingPortalEnabled: settings.bookingPortalEnabled ?? false,
    bookingPortalOpenDateTime: formatDateForInput(settings.bookingPortalOpenDateTime) ?? '',
    bookingPortalCloseDateTime: formatDateForInput(settings.bookingPortalCloseDateTime) ?? '',
  });

  // Validate booking dates
  const validateBookingDates = (): string | null => {
    const { bookingPortalOpenDateTime, bookingPortalCloseDateTime } = formData;
    
    // Both dates are required
    if (!bookingPortalOpenDateTime.trim()) {
      return 'Portal open date and time is required';
    }
    
    if (!bookingPortalCloseDateTime.trim()) {
      return 'Portal close date and time is required';
    }
    
    const now = new Date();
    const openDate = new Date(bookingPortalOpenDateTime);
    const closeDate = new Date(bookingPortalCloseDateTime);
    
    // Both dates must be in the future
    if (openDate <= now) {
      return 'Portal open date must be in the future';
    }
    
    if (closeDate <= now) {
      return 'Portal close date must be in the future';
    }
    
    // Open date must be before close date
    if (openDate >= closeDate) {
      return 'Portal open date must be before close date';
    }
    
    return null;
  };

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
    setHasChanges(true);
  };

  // Handle reset
  const handleReset = async () => {
    if (settings) {
      setResetting(true);
      // Add a small delay to show the spinner
      await new Promise(resolve => setTimeout(resolve, 300));
      setFormData(createFormDataFromSettings(settings));
      setHasChanges(false);
      setResetting(false);
      toast.success('Changes reset successfully');
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveClick();
  };

  // Save settings
  const onSaveClick = async () => {
    if (!hasChanges || saving) return;
    
    // Validate booking dates
    const validationError = validateBookingDates();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    
    setSaving(true);
    try {
      // Only update schedule; do not allow toggling bookingPortalEnabled from UI
      const payload = {
        bookingPortalOpenDateTime: formData.bookingPortalOpenDateTime,
        bookingPortalCloseDateTime: formData.bookingPortalCloseDateTime,
      };
      await dispatch(updateSettings(payload as any)).unwrap();
      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch (error: any) {
      // Toasts are handled in the slice; optional: toast.error here if needed
    } finally {
      setSaving(false);
    }
  };

  // Handle notice form changes
  const handleNoticeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNoticeForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle file changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setNoticeForm(prev => ({ ...prev, attachment: file }));
  };

  // Send notice
  const handleSendNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!noticeForm.subject.trim() || !noticeForm.message.trim()) {
      toast.error('Please fill in both subject and message');
      return;
    }

    setSendingNotice(true);
    try {
      const formData = new FormData();
      formData.append('subject', noticeForm.subject);
      formData.append('message', noticeForm.message);
      if (noticeForm.attachment) {
        formData.append('attachment', noticeForm.attachment);
      }

      const response = await api.post('/settings/send-notice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Use backend-provided message and success flag
      const { message, success } = response.data || {};
      if (success) {
        toast.success(message || 'Notice sent successfully');
      } else {
        toast.error(message || 'Failed to send notice');
      }

      // Reset form state
      setNoticeForm({ subject: '', message: '', attachment: null });
      
      // Safely clear the file input field
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to send notice';
      toast.error(errorMessage);
    } finally {
      setSendingNotice(false);
    }
  };

  // Effects
  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAcademicPeriod();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (settings) {
      setFormData(createFormDataFromSettings(settings));
      setHasChanges(false);
    }
  }, [settings]);

  // Socket listener for real-time updates
  useEffect(() => {
    if (socket) {
      const handleSettingsUpdate = (updatedSettings: any) => {
        // Only update form data if dates were actually reset or if it's a full settings update
        if (updatedSettings.datesReset) {
          // Full reset - clear the dates
          setFormData(createFormDataFromSettings(updatedSettings));
          setHasChanges(false);
          toast.success('Portal schedule completed - dates have been reset');
        } else if (updatedSettings.statusOnly) {
          // Status-only change - preserve existing dates
          setFormData(prev => ({
            ...prev,
            bookingPortalEnabled: updatedSettings.bookingPortalEnabled
          }));
        } else if (!updatedSettings.reason) {
          // Manual settings update - update everything
          setFormData(createFormDataFromSettings(updatedSettings));
          setHasChanges(false);
        }
      };

      socket.on('settings-updated', handleSettingsUpdate);
      socket.on('portal-status-changed', handleSettingsUpdate);

      return () => {
        socket.off('settings-updated', handleSettingsUpdate);
        socket.off('portal-status-changed', handleSettingsUpdate);
      };
    }
  }, [socket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen space-x-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-700">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            System Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure hostel management system settings
          </p>
        </div>
        {hasChanges && (
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Unsaved changes</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Card variant="glass" className="p-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </Card>

      {/* Booking Tab */}
      {activeTab === 'booking' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card variant="glass" className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Booking Portal Configuration
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Control when students can book rooms
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3 mb-3">
                <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-400">
                  Automatic Scheduling Status
                </h4>
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                <p>
                  <span className="font-medium">Portal Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${formData.bookingPortalEnabled
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {formData.bookingPortalEnabled ? 'Open' : 'Closed'}
                  </span>
                </p>
                {formData.bookingPortalOpenDateTime && (
                  <div className="text-xs space-y-1">
                    <p><span className="font-medium">Scheduled Open/Activation:</span> {new Date(formData.bookingPortalOpenDateTime).toLocaleString()}</p>
                    {formData.bookingPortalCloseDateTime ? (
                      <p><span className="font-medium">Scheduled Close:</span> {new Date(formData.bookingPortalCloseDateTime).toLocaleString()}</p>
                    ) : (
                      <p className="text-amber-600 dark:text-amber-400"><span className="font-medium">⚡ One-time activation:</span> Portal will open and stay open</p>
                    )}
                  </div>
                )}

                {!formData.bookingPortalOpenDateTime && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">No schedule set - portal will remain in current state</p>
                )}

                <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-800/30 rounded text-xs">
                  <p className="font-medium text-blue-900 dark:text-blue-200">Scheduling Options:</p>
                  <ul className="text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                    <li>• <strong>Future Activation:</strong> Set only open date/time for one-time portal activation</li>
                    <li>• <strong>Scheduled Period:</strong> Set both open and close times for automatic open/close cycle</li>
                    <li>• <strong>Auto Reset:</strong> Dates reset after completion</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-6 mt-6">
              {/* Portal Status (Read-only) */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <GlobeAltIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Booking Portal Status (Read-only)
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Status is determined automatically by the schedule below
                    </p>
                  </div>
                </div>
                <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${formData.bookingPortalEnabled
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {formData.bookingPortalEnabled ? 'Open' : 'Closed'}
                </span>
              </div>

              {/* Portal Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Portal Opens
                  </label>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="datetime-local"
                      name="bookingPortalOpenDateTime"
                      value={formData.bookingPortalOpenDateTime}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Set future date/time to automatically enable portal
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Portal Closes
                  </label>
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="datetime-local"
                      name="bookingPortalCloseDateTime"
                      value={formData.bookingPortalCloseDateTime}
                      onChange={handleChange}
                      required
                      min={formData.bookingPortalOpenDateTime || new Date().toISOString().slice(0, 16)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Set future date/time to automatically disable portal
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </form>
      )}

      {/* Send Notice Tab */}
      {activeTab === 'send-notice' && (
        <Card variant="glass" className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <EnvelopeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Send Notice to All Students
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Send important notices and announcements to all students via email
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Subject Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={noticeForm.subject}
                onChange={handleNoticeChange}
                placeholder="Enter notice subject"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Message Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <textarea
                name="message"
                value={noticeForm.message}
                onChange={handleNoticeChange}
                placeholder="Enter your notice message here..."
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-vertical"
                required
              />
            </div>

            {/* File Attachment Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Attachment (Optional)
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400"
                />
                {noticeForm.attachment && (
                  <div className="mt-2 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        {noticeForm.attachment.name} ({(noticeForm.attachment.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNoticeForm(prev => ({ ...prev, attachment: null }))}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Supported formats: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG (Max: 10MB)
              </p>
            </div>

            {/* Send Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setNoticeForm({ subject: '', message: '', attachment: null })}
                className="px-6 py-3 border bg-red-600 border-gray-300 dark:border-gray-600 text-white dark:text-gray-300 rounded-lg hover:bg-red-400 dark:hover:bg-red-400 transition-colors duration-200"
              >
                Clear
              </button>
              <Button
                type="button"
                onClick={handleSendNotice}
                variant="primary"
                isLoading={sendingNotice}
                loadingText="Sending..."
                disabled={sendingNotice || !noticeForm.subject.trim() || !noticeForm.message.trim()}
                className="px-6 py-3"
              >
                Send
              </Button>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Notice Information:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>This notice will be sent to all active students</li>
                  <li>Students' email addresses are protected (sent via BCC)</li>
                  <li>The notice will appear with official hostel branding</li>
                  <li>Optional attachments will be included in the email</li>
                  <li>Make sure your message is clear and professional</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card variant="glass" className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <CogIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                General Settings
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                System-wide configuration options
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  System Information
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Additional general settings will be available in future updates. Current settings cover the core functionality of the hostel management system.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Academic Period Tab */}
      {activeTab === 'academic' && isSuperAdmin && (
        <Card variant="glass" className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Academic Period
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View and manage academic year and semester
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Current Period: </span>
                {loadingAcademic && <span>Loading...</span>}
                {!loadingAcademic && academicPeriod && (
                  <span>
                    {academicPeriod.currentAcademicYear} — Semester {academicPeriod.currentSemester}
                  </span>
                )}
                {!loadingAcademic && !academicPeriod && <span>Unavailable</span>}
              </p>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Transitioning the semester will close the current semester, mark all active bookings
                as inactive, and advance the academic period. This action may take several seconds
                and cannot be undone.
              </p>
            </div>

            <div className="flex">
              <Button
                type="button"
                onClick={handleTransitionSemester}
                disabled={transitioning}
                className={`inline-flex items-center gap-2 ${
                  transitioning ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {transitioning ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : null}
                <span>{transitioning ? 'Transitioning...' : 'Transition Semester'}</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons - Only show for booking tab */}
      {activeTab === 'booking' && (
        <Card variant="glass" className="p-6">
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              onClick={handleReset}
              variant="secondary"
              disabled={!hasChanges || saving || resetting}
              isLoading={resetting}
              loadingText="Resetting..."
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!hasChanges || saving || resetting}
              isLoading={saving}
              loadingText="Saving..."
              onClick={onSaveClick}
            >
              Save
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Settings;