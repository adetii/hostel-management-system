import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { resendVerification } from '@/store/slices/authSlice';
import { EnvelopeIcon, HomeIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const EmailVerificationSent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const dispatch = useAppDispatch();

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    try {
      await dispatch(resendVerification(email)).unwrap();
    } catch (e) {
      // toast handled in slice
    } finally {
      setSending(false);
    }
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
            We’ve sent you a verification link. Please check your inbox.
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
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-50 flex items-center justify-center">
                <EnvelopeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-xl font-bold">Check your email</h1>
              <p className="text-sm text-gray-600">
                We’ve sent a verification link to{' '}
                <span className="font-medium text-gray-900">{email || 'your email'}</span>.
              </p>
            </div>

            <form onSubmit={handleResend} className="space-y-3">
              <label className="block text-xs font-medium text-gray-700">Resend to a different email</label>
              <input
                type="email"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
              />

                <button
                  type="submit"
                  disabled={sending || !email}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-60 transition"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <PaperAirplaneIcon className="h-4 w-4" />
                  )}
                  {sending ? 'Sending...' : 'Resend verification email'}
                </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              
              <p>
                Once verified, you can{' '}
                <Link to="/management/login" className="text-blue-600 hover:text-blue-500 underline">
                  sign in here
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationSent;