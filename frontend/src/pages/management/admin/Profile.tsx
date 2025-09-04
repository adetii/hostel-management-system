import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import api from '@/api/config';
import { toast } from 'react-hot-toast';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type Gender = 'male' | 'female';

interface AdminProfileData {
  id: number;
  email: string;
  fullName: string;
  role: 'admin' | 'super_admin';
  phoneNumber?: string;
  gender?: Gender;
  dateOfBirth?: string;
  isActive: boolean;
}

const AdminProfile: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [form, setForm] = useState<Pick<AdminProfileData, 'email' | 'fullName' | 'phoneNumber' | 'gender' | 'dateOfBirth'>>({
    email: '',
    fullName: '',
    phoneNumber: '',
    gender: 'male',
    dateOfBirth: '',
  });

  const adminId = useMemo(() => user?.id, [user]);

  // Helper to format date for display
  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Not set';
    return d.toLocaleDateString();
  };

  // Helper to normalize date for input[type="date"]
  const normalizeDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    if (dateString.includes('T')) return dateString.slice(0, 10);
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!adminId) return;
      setLoading(true);
      try {
        const res = await api.get(`/admins/${adminId}`);
        const data = res.data || {};
        const mapped: AdminProfileData = {
          id: data.id,
          email: data.email,
          fullName: data.fullName || data.full_name || '',
          role: data.role,
          phoneNumber: data.phoneNumber || '',
          gender: (data.gender as Gender) || 'male',
          dateOfBirth: data.dateOfBirth || '',
          isActive: !!data.isActive,
        };
        setProfile(mapped);
        setForm({
          email: mapped.email,
          fullName: mapped.fullName,
          phoneNumber: mapped.phoneNumber || '',
          gender: mapped.gender || 'male',
          dateOfBirth: normalizeDateForInput(mapped.dateOfBirth),
        });
      } catch (err: any) {
        if (!err?.isSessionTimeout) {
          toast.error('Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [adminId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    if (!profile) return;
    setForm({
      email: profile.email,
      fullName: profile.fullName,
      phoneNumber: profile.phoneNumber || '',
      gender: profile.gender || 'male',
      dateOfBirth: normalizeDateForInput(profile.dateOfBirth),
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!adminId) return;
    setSaving(true);
    try {
      const payload = {
        email: form.email,
        fullName: form.fullName,
        phoneNumber: form.phoneNumber || undefined,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || undefined,
      };
      const res = await api.put(`/admins/${adminId}`, payload);
      const updated = res.data?.admin || {};
      const mapped: AdminProfileData = {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName || updated.full_name || '',
        role: updated.role,
        phoneNumber: updated.phoneNumber || '',
        gender: (updated.gender as Gender) || 'male',
        dateOfBirth: updated.dateOfBirth || '',
        isActive: !!updated.isActive,
      };
      setProfile(mapped);
      setForm({
        email: mapped.email,
        fullName: mapped.fullName,
        phoneNumber: mapped.phoneNumber || '',
        gender: mapped.gender || 'male',
        dateOfBirth: normalizeDateForInput(mapped.dateOfBirth),
      });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      if (!err?.isSessionTimeout) {
        toast.error(err?.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen space-x-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-700">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-300">
        Could not load profile.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Manage your personal information</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <PencilIcon className="h-5 w-5" />
            Edit Profile
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              disabled={saving}
            >
              <XMarkIcon className="h-5 w-5" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Avatar and basic info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <UserIcon className="h-12 w-12 text-blue-600 dark:text-blue-300" />
            </div>
            <h2 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
              {profile.fullName}
            </h2>
            {/* Removed role text under avatar */}
            {profile.isActive ? (
              <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Active
              </span>
            ) : (
              <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                Inactive
              </span>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              <span className="truncate">{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <span>{profile.phoneNumber || 'Not set'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
              <span>{formatDisplayDate(profile.dateOfBirth)}</span>
            </div>
          </div>
        </div>
        {/* Right: Editable form */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email ?? profile.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                placeholder="Enter email address"
              />
            </div>

            {/* Role (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <input
                type="text"
                value={profile.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                disabled
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900/50 text-gray-900 dark:text-gray-300 px-3 py-2"
                aria-readonly="true"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={form.phoneNumber || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
              <select
                name="gender"
                value={form.gender || 'male'}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              />
            </div>

            {/* Removed the entire Role field block */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;