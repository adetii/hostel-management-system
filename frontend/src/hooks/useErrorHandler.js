import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

export const useErrorHandler = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  // Removed the commented line about useAuth

  const handleError = (error) => {
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      // Only redirect to login if we're on a management page
      if (location.pathname.startsWith('/management')) {
        window.location.href = '/management/login';
        setError('Session expired. Please login again.');
      } else {
        // For public pages, just show an error message without redirecting
        setError('Authentication required for this action.');
      }
    } else if (error.response?.status === 403) {
      // Forbidden
      setError('You do not have permission to perform this action.');
    } else if (error.response?.status >= 500) {
      // Server error
      setError('Server error. Please try again later.');
    } else {
      // Other errors
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  const clearError = () => setError('');

  const executeWithErrorHandling = async (asyncFunction) => {
    try {
      setLoading(true);
      setError('');
      const result = await asyncFunction();
      return { success: true, data: result };
    } catch (error) {
      handleError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    error,
    loading,
    handleError,
    clearError,
    executeWithErrorHandling
  };
};