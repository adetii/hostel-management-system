import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import LazyQuillEditor from '@/components/management/common/LazyQuillEditor';
import 'react-quill/dist/quill.snow.css';
import api from '@/api/config';
import {
  DocumentTextIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PlusIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import Portal from '@/utils/Portal';

interface PublicContent {
  id: number;
  type: 'terms' | 'privacy' | 'rules' | 'faq';
  title: string;
  content: string;
  lastUpdatedBy: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version?: number;
  updatedByAdmin?: {
    id: number;
    fullName: string;
    email: string;
  };
}

interface ContentVersion {
  id: number;
  contentId: number;
  version: number;
  title: string;
  content: string;
  updatedBy: number;
  createdAt: string;
  updatedByAdmin?: {
    fullName?: string;
  };
}

const PublicContentEditor: React.FC = () => {
  const [contents, setContents] = useState<PublicContent[]>([]);
  const [filteredContents, setFilteredContents] = useState<PublicContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<PublicContent | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState<number | null>(null);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'terms' | 'privacy' | 'rules' | 'faq'>('all');
  const [formData, setFormData] = useState({
    type: 'terms' as PublicContent['type'],
    title: '',
    content: '',
    isActive: true
  });

  const contentTypes = [
    { value: 'terms', label: 'Terms of Service', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    { value: 'privacy', label: 'Privacy Policy', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    { value: 'rules', label: 'Hostel Rules', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    { value: 'faq', label: 'FAQ', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  ];

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ]
  };

  const quillFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align', 'script'
  ];

  useEffect(() => {
    fetchContents();
  }, []);

  useEffect(() => {
    filterContents();
  }, [contents, searchTerm, statusFilter, typeFilter]);

  const fetchContents = async () => {
    try {
      const response = await api.get('/super-admin/content');
      setContents(response.data);
    } catch (error) {
      toast.error('Failed to fetch content');
    } finally {
      setLoading(false);
    }
  };

  const filterContents = () => {
    let filtered = contents;

    if (searchTerm) {
      filtered = filtered.filter(content => 
        content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(content => 
        statusFilter === 'active' ? content.isActive : !content.isActive
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(content => content.type === typeFilter);
    }

    setFilteredContents(filtered);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/super-admin/content', formData);
      toast.success('Content created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchContents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create content');
    }
  };

  const handleEdit = (content: PublicContent) => {
    setEditingContent(content);
    setFormData({
      type: content.type,
      title: content.title,
      content: content.content,
      isActive: content.isActive
    });
    setShowEditor(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContent) return;

    setSaving(true);

    try {
      const response = await api.put(`/super-admin/content/${editingContent.id}`, formData);
      toast.success('Content updated successfully');

      const updated = response.data?.content;
      if (updated) {
        setContents(prev =>
          prev.map(c => (c.id === editingContent.id ? { ...c, ...updated } : c))
        );
      }

      setShowEditor(false);
      setEditingContent(null);
      resetForm();
      fetchContents();
    } catch (error: any) {
      console.error('Save error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update content');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: number, isActive: boolean) => {
    try {
      await api.patch(`/super-admin/content/${id}/status`, { isActive: !isActive });
      toast.success(`Content ${!isActive ? 'activated' : 'deactivated'} successfully`);
      fetchContents();
    } catch (error) {
      toast.error('Failed to update content status');
    }
  };

  const handlePreview = (content: PublicContent) => {
    setEditingContent(content);
    setShowPreview(true);
  };

  const fetchVersionHistory = async (contentId: number) => {
    try {
      const response = await api.get(`/super-admin/content/${contentId}/versions`);
      setVersions(response.data);
      setShowVersionHistory(true);
    } catch (error) {
      toast.error('Failed to fetch version history');
    }
  };

  const restoreVersion = async (versionId: number) => {
    setRestoringVersionId(versionId);
    try {
      await api.post(`/super-admin/content/restore-version/${versionId}`);
      toast.success('Version restored successfully');
      setShowVersionHistory(false);
      fetchContents();
    } catch (error) {
      toast.error('Failed to restore version');
    } finally {
      setRestoringVersionId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'terms',
      title: '',
      content: '',
      isActive: true
    });
  };

  const getTypeInfo = (type: string) => {
    return contentTypes.find(t => t.value === type) || contentTypes[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
        <p className="text-lg text-gray-700">Loading public contents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Public Content Management</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">Manage website content including terms, privacy policy, rules, and FAQ</p>
        </div>
      </div>

      {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Status Filter */}
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 uppercase">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white
                          focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                          hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-150 ease-in-out"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <svg
                className="w-4 h-4 text-gray-400 dark:text-gray-300 absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 
                    0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 
                    8.27a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            {/* Type Filter */}
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 uppercase">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white
                          focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                          hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-150 ease-in-out"
              >
                <option value="all">All Types</option>
                {contentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <svg
                className="w-4 h-4 text-gray-400 dark:text-gray-300 absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 
                    0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 
                    8.27a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

          </div>
        </div>

      {/* Content List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
            Content Pages ({filteredContents.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredContents.map((content) => {
            const typeInfo = getTypeInfo(content.type);
            return (
              <div key={content.id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                {/* Mobile Layout */}
                <div className="block sm:hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 dark:text-gray-300 flex-shrink-0" />
                        <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">{content.title}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          content.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {content.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {content.version && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            v{content.version}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <p>Updated: {formatDate(content.updatedAt)}</p>
                        {content.updatedByAdmin && (
                          <p>By: {content.updatedByAdmin.fullName}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowMobileActions(showMobileActions === content.id ? null : content.id)}
                      className="ml-2 p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100"
                    >
                      <Bars3Icon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Mobile Actions Dropdown */}
                  {showMobileActions === content.id && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          handlePreview(content);
                          setShowMobileActions(null);
                        }}
                        className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Preview
                      </button>
                      <button
                        onClick={() => {
                          fetchVersionHistory(content.id);
                          setShowMobileActions(null);
                        }}
                        className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <ClockIcon className="h-4 w-4 mr-1" />
                        History
                      </button>
                     
                      <button
                        onClick={() => {
                          handleEdit(content);
                          setShowMobileActions(null);
                        }}
                        className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      {/* Removed Activate/Deactivate button */}
                    </div>
                  )}
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <DocumentTextIcon className="h-6 w-6 text-gray-400 dark:text-gray-300" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{content.title}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            content.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {content.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {content.version && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                              v{content.version}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <p>Last updated: {formatDate(content.updatedAt)}</p>
                      {content.updatedByAdmin && (
                        <p>By: {content.updatedByAdmin.fullName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <button
                      onClick={() => handlePreview(content)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      <span className="hidden lg:inline">Preview</span>
                    </button>
                    <button
                      onClick={() => fetchVersionHistory(content.id)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                    >
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span className="hidden lg:inline">History</span>
                    </button>
                    
                    <button
                      onClick={() => handleEdit(content)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      <span className="hidden lg:inline">Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && editingContent && (
        <Portal>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
            <div className="relative top-4 sm:top-10 mx-auto border border-gray-200 dark:border-gray-700 w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800 max-h-[90vh] flex flex-col m-4">
              <div className="p-4 sm:p-5 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Edit {getTypeInfo(editingContent.type).label}
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditor(false);
                      setEditingContent(null);
                      resetForm();
                    }}
                    className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <form onSubmit={handleSave} className="space-y-4 flex-1 flex flex-col">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                          Title
                        </label>
                        <input
                          id="title"
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Enter title"
                          required
                        />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="editIsActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                      />
                      <label htmlFor="editIsActive" className="ml-2 block text-sm text-gray-900 dark:text-white">
                        Active
                      </label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Content Editor */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Content Editor</label>
                    <div className="rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shadow-sm overflow-hidden">
                      <LazyQuillEditor
                        theme="snow"
                        value={formData.content}
                        onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Enter content..."
                        className="h-96 dark:[&_.ql-editor]:bg-gray-900 dark:[&_.ql-editor]:text-white dark:[&_.ql-toolbar]:bg-gray-800 dark:[&_.ql-toolbar]:border-gray-700 dark:[&_.ql-stroke]:stroke-gray-300 dark:[&_.ql-fill]:fill-gray-300"
                      />
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="hidden xl:flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Live Preview</label>
                    <div className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-4 overflow-y-auto h-96">
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert text-gray-900 dark:text-white"
                        dangerouslySetInnerHTML={{ __html: formData.content }}
                      />
                    </div>
                  </div>
                  </div>

                  
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditor(false);
                        setEditingContent(null);
                        resetForm();
                      }}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreview(editingContent)}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                    >
                      Preview
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      aria-busy={saving}
                      className={`w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {saving ? (
                        <span className="inline-flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                        </span>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Preview Modal */}
      {showPreview && editingContent && (
        <Portal>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
            <div className="relative top-4 sm:top-10 mx-auto border border-gray-200 dark:border-gray-700 w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800 max-h-[90vh] flex flex-col">
              <div className="p-4 sm:p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Preview: {editingContent.title}
                  </h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="border border-gray-200 dark:border-gray-600 rounded-md p-4 bg-gray-50 dark:bg-gray-900 max-h-96 overflow-y-auto">
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert text-gray-900 dark:text-white"
                    dangerouslySetInnerHTML={{ __html: editingContent.content }}
                  />
                </div>
                
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Version History Modal */}
      {showVersionHistory && (
        <Portal>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
            <div className="relative top-4 sm:top-10 mx-auto border border-gray-200 dark:border-gray-700 w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800 max-h-[85vh] overflow-hidden">
              <div className="p-4 sm:p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Version History</h3>
                  <button
                    onClick={() => setShowVersionHistory(false)}
                    className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {versions.map((version) => (
                    <div key={version.id} className="border border-gray-200 dark:border-gray-600 rounded-md p-4 bg-white dark:bg-gray-700">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{version.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Version {version.version} • {formatDate(version.createdAt)} • By {version.updatedByAdmin?.fullName || 'Unknown'}
                          </p>
                        </div>
                        <button
                          onClick={() => restoreVersion(version.id)}
                          disabled={restoringVersionId === version.id}
                          aria-busy={restoringVersionId === version.id}
                          className="w-full sm:w-auto px-3 py-1 text-sm border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {restoringVersionId === version.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Restoring...
                            </>
                          ) : (
                            'Restore'
                          )}
                        </button>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        <div className="line-clamp-3">
                          {version.content.substring(0, 200)}...
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setShowVersionHistory(false)}
                    className="w-full sm:w-auto px-4 py-2 border bg-red-600 rounded-md text-sm font-medium text-gray-700 hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default PublicContentEditor;

