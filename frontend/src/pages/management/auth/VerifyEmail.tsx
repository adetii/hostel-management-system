import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { verifyEmail } from '@/store/slices/authSlice';
import { CheckCircleIcon, ExclamationTriangleIcon, HomeIcon } from '@heroicons/react/24/outline';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { token: tokenFromParams } = useParams<{ token: string }>();
  const hasRunRef = useRef(false);
  
  // Get token from URL parameter (e.g., /verify-email/abc123) or query parameter (fallback)
  const tokenFromQuery = searchParams.get('token') || '';
  const token = tokenFromParams || tokenFromQuery;

  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    // Prevent multiple calls
    if (hasRunRef.current) {
      return;
    }

    const run = async () => {
      if (!token) {
        setStatus('error');
        setErrorMsg('Invalid or missing verification token.');
        return;
      }
      
      hasRunRef.current = true;
      setStatus('verifying');
      
      try {
        console.log('Verifying email with token:', token);
        console.log('Public API base URL:', import.meta.env.VITE_API_URL || '/api');
        const result = await dispatch(verifyEmail(token)).unwrap();
        console.log('Verification result:', result);
        setStatus('success');
      } catch (err: any) {
        console.error('Email verification error:', err);
        console.error('Error response:', err?.response);
        setStatus('error');
        setErrorMsg(err?.message || 'Email verification failed. The link may have expired.');
      }
    };
    
    run();
  }, [token]); // Removed dispatch from dependencies to prevent re-runs

  const renderContent = () => {
    if (status === 'verifying') {
      return (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your email...</p>
        </div>
      );
    }
    if (status === 'success') {
      return (
        <div className="text-center space-y-4">
          <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Email verified!</h2>
          <p className="text-gray-600">You can now sign in to your account.</p>
          <Link
            to="/management/login"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
          >
            Go to Sign in
          </Link>
        </div>
      );
    }
    if (status === 'error') {
      return (
        <div className="text-center space-y-4">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Verification failed</h2>
          <p className="text-gray-600">{errorMsg}</p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/management/verify-email/sent"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
            >
              Resend verification email
            </Link>
            <Link
              to="/management/register"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
            >
              Register again
            </Link>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className="h-screen w-screen fixed inset-0 bg-cover bg-center bg-no-repeat bg-fixed overflow-hidden flex items-center justify-center lg:justify-end"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80')`
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/70 to-purple-900/80"></div>

      <div className="hidden lg:flex absolute left-0 top-0 h-full w-1/2 flex-col justify-center items-start p-12 text-white z-10">
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-bold mb-6">
            ELITE<br />
            <span className="text-2xl font-normal">HOSTEL</span>
          </h1>
          <p className="text-lg mb-4 opacity-90">
            A HOME CLOSE FOR<br />
            YOUR ACADEMIC SUCCESS
          </p>
          <p className="text-sm opacity-75 leading-relaxed">
            Verify your email to continue.
          </p>
          <div className="absolute top-20 right-20 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute bottom-40 right-10 w-12 h-12 bg-blue-400/20 rounded-full animate-float-reverse"></div>
          <div className="absolute top-1/2 right-32 w-8 h-8 bg-purple-400/20 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="relative z-20 w-full lg:w-1/2 flex items-center justify-center mx-4 lg:mx-0 lg:mr-8 py-8">
        <div className="w-full max-w-sm lg:max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900">ELITE HOSTEL</h1>
              <p className="text-sm text-gray-500">Email Verification</p>
            </div>
            {renderContent()}
            <div className="mt-4 text-center">
              <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800">
                <HomeIcon className="h-5 w-5" />
                <span>Home</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;