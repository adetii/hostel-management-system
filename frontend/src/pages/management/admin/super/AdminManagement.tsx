import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/api/config';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  UserIcon,
  PhoneIcon,
  CalendarIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import Portal from '@/utils/Portal';

interface Admin {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
  role: 'admin' | 'super_admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState<number | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    gender: 'male' as 'male' | 'female',
    dateOfBirth: ''
  });

  // Add loading states for actions
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    filterAdmins();
  }, [admins, searchTerm, statusFilter]);

  const fetchAdmins = async () => {
    try {
      const response = await api.get('/super-admin/admins');
      setAdmins(response.data);
    } catch (error) {
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const filterAdmins = () => {
    let filtered = admins;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(admin => 
        admin.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(admin => 
        statusFilter === 'active' ? admin.isActive : !admin.isActive
      );
    }

    setFilteredAdmins(filtered);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      phoneNumber: '',
      gender: 'male',
      dateOfBirth: ''
    });
  };

  // inside AdminManagement component
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/super-admin/admins', formData);
      toast.success('Admin created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create admin');
    } finally {
      setCreating(false);
    }
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    await updateAdmin();
  };

  const updateAdmin = async () => {
    if (!selectedAdmin) return;
    
    try {
      const { password, ...updateData } = formData;
      const finalUpdateData = password ? { ...updateData, password } : updateData;
      
      await api.put(`/super-admin/admins/${selectedAdmin.id}`, finalUpdateData);
      toast.success('Admin updated successfully');
      setShowEditModal(false);
      setSelectedAdmin(null);
      resetForm();
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update admin');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;
    setDeleting(true);
    try {
      await api.delete(`/super-admin/admins/${selectedAdmin.id}`);
      toast.success('Admin deleted successfully');
      setShowDeleteModal(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    } finally {
      setDeleting(false);
    }
  };

  const toggleAdminStatus = async (id: number, isActive: boolean) => {
    setTogglingId(id);
    try {
      await api.put(`/super-admin/admins/${id}/status`, { isActive: !isActive });
      toast.success(`Admin ${!isActive ? 'activated' : 'deactivated'} successfully`);
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to update admin status');
    } finally {
      setTogglingId(null);
    }
  };

  const openEditModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setFormData({
      email: admin.email,
      password: '', // No pre-fill password
      fullName: admin.fullName,
      phoneNumber: admin.phoneNumber,
      gender: admin.gender,
      dateOfBirth: formatDateForInput(admin.dateOfBirth)
    });
    setShowEditModal(true);
  };

  function formatDateForInput(dateOfBirth: string | Date | null | undefined): string {
  if (!dateOfBirth) return '';
  if (typeof dateOfBirth === 'string') {
    // If already in YYYY-MM-DD or ISO-like, take the date part
    const match = dateOfBirth.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  const d = new Date(dateOfBirth as any);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

  const openViewModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowViewModal(true);
  };

  const openDeleteModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen space-x-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-lg text-gray-700">Loading profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Admin Management</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Create and manage administrator accounts</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors text-sm sm:text-base w-full sm:w-auto"
        >
          <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="sm:inline">Create Admin</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-2 sm:px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredAdmins.length} of {admins.length} admins
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Admin Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contact Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAdmins.map((admin) => (
              <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{admin.fullName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{admin.email}</div>
                    </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{admin.phoneNumber}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{admin.gender}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      admin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {admin.isActive ? (
                        <><CheckCircleIcon className="w-4 h-4 mr-1" /> Active</>
                      ) : (
                        <><XCircleIcon className="w-4 h-4 mr-1" /> Inactive</>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                  {/* Actions (desktop) */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openViewModal(admin)}
                        className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        title="View Admin"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => openEditModal(admin)}
                        className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        title="Edit Admin"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => toggleAdminStatus(admin.id, admin.isActive)}
                        disabled={togglingId === admin.id}
                        className={`flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-70 disabled:cursor-not-allowed ${
                          admin.isActive ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'
                        }`}
                        title={admin.isActive ? 'Deactivate Admin' : 'Activate Admin'}
                      >
                        {togglingId === admin.id && (
                          <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                        )}
                        {admin.isActive ? (
                          <><XCircleIcon className="h-4 w-4 mr-1" /> Deactivate</>
                        ) : (
                          <><CheckCircleIcon className="h-4 w-4 mr-1" /> Activate</>
                        )}
                      </button>
                      <button
                        onClick={() => openDeleteModal(admin)}
                        className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        title="Delete Admin"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>
        
        {filteredAdmins.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No admins found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating a new admin account.'}
            </p>
          </div>
        )}

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-3">
        {filteredAdmins.map((admin) => (
          <div key={admin.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            {/* Admin Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                    {admin.fullName}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{admin.email}</p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      admin.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {admin.isActive ? (
                        <><CheckCircleIcon className="w-3 h-3 mr-1" /> Active</>
                      ) : (
                        <><XCircleIcon className="w-3 h-3 mr-1" /> Inactive</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowMobileActions(showMobileActions === admin.id ? null : admin.id)}
                className="ml-2 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            </div>

            {/* Admin Details */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <PhoneIcon className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                <span>{admin.phoneNumber}</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <UserIcon className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                <span className="capitalize">{admin.gender}</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-300 sm:col-span-2">
                <CalendarIcon className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                <span>Created: {new Date(admin.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Mobile Actions Dropdown */}
            {showMobileActions === admin.id && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      openViewModal(admin);
                      setShowMobileActions(null);
                    }}
                    className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => {
                      openEditModal(admin);
                      setShowMobileActions(null);
                    }}
                    className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      toggleAdminStatus(admin.id, admin.isActive);
                      setShowMobileActions(null);
                    }}
                    className={`flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-70 disabled:cursor-not-allowed ${
                      admin.isActive ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'
                    }`}
                  >
                    {admin.isActive ? (
                      <><XCircleIcon className="h-4 w-4 mr-1" /> Deactivate</>
                    ) : (
                      <><CheckCircleIcon className="h-4 w-4 mr-1" /> Activate</>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      openDeleteModal(admin);
                      setShowMobileActions(null);
                    }}
                    className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {filteredAdmins.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No admins found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating a new admin account.'}
            </p>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <Portal>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
            <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border border-gray-200 dark:border-gray-700 w-full max-w-md sm:w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create New Admin</h3>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    {creating && <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                    {creating ? 'Creating...' : 'Create Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <Portal>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Edit Admin</h3>
              <form onSubmit={handleEditAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Leave blank to keep current password"
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedAdmin(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    {updating && <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                    {updating ? 'Updating...' : 'Update Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* View Admin Modal */}
      {showViewModal && selectedAdmin && (
        <Portal>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Admin Details</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="mx-auto h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <UserIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">{selectedAdmin.fullName}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedAdmin.email}</p>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4 space-y-3">
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                    <span className="text-sm text-gray-900 dark:text-white">{selectedAdmin.phoneNumber}</span>
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                    <span className="text-sm text-gray-900 dark:text-white capitalize">{selectedAdmin.gender}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(selectedAdmin.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedAdmin.isActive
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {selectedAdmin.isActive ? (
                        <><CheckCircleIcon className="w-4 h-4 mr-1" /> Active</>
                      ) : (
                        <><XCircleIcon className="w-4 h-4 mr-1" /> Inactive</>
                      )}
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4 text-xs text-gray-500 dark:text-gray-400">
                  <p>Created: {new Date(selectedAdmin.createdAt).toLocaleString()}</p>
                  <p>Updated: {new Date(selectedAdmin.updatedAt).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedAdmin(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(selectedAdmin);
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 dark:text-blue-400 dark:border-blue-400 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                >
                  Edit Admin
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAdmin && (
        <Portal>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-200 dark:border-gray-700 w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="text-center">
                <TrashIcon className="mx-auto h-12 w-12 text-red-600 dark:text-red-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Delete Admin</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{selectedAdmin.fullName}</strong>? 
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-6">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedAdmin(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAdmin}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {deleting && <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                  {deleting ? 'Deleting...' : 'Delete Admin'}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default AdminManagement;


