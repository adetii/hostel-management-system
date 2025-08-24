import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from './store';
import { useAppDispatch } from './hooks/useAppDispatch';
import { Toaster } from 'react-hot-toast';
import { hydrateAuth } from './store/slices/authSlice';
import ScrollToTop from './components/public/ScrollToTop';
import ScrollToTopOnRouteChange from './components/public/ScrollToTopOnRouteChange';
import { getOrCreateTabId } from './utils/tabId';
import api from './api/config';

// Essential components (loaded immediately)
import PublicLayout from './layouts/PublicLayout';
import Home from './pages/public/Home';
import { AuthLayout } from './components/management/layout';
import { AdminLayout } from './components/management/layout';
import { StudentLayout } from './components/management/layout';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Login from './pages/management/auth/Login';
import Register from './pages/management/auth/Register';
import NotFound from '@/pages/management/NotFound';

// Lazy load heavy components
const About = lazy(() => import('./pages/public/About'));
const Contact = lazy(() => import('./pages/public/Contact'));
const Rooms = lazy(() => import('./pages/public/Rooms'));
const Services = lazy(() => import('./pages/public/Services'));
const FAQ = lazy(() => import('./pages/public/FAQ'));
const Terms = lazy(() => import('./pages/public/Terms'));
const Privacy = lazy(() => import('./pages/public/Privacy'));
const Rules = lazy(() => import('./pages/public/Rules'));

// Auth Pages (lazy loaded)
const ForgotPassword = lazy(() => import('./pages/management/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/management/auth/ResetPassword'));

// Admin Pages (lazy loaded)
const AdminDashboard = lazy(() => import('./pages/management/admin/Dashboard'));
const ManageStudents = lazy(() => import('./pages/management/admin/ManageStudents'));
const ManageRooms = lazy(() => import('./pages/management/admin/ManageRooms'));
const ManageBookings = lazy(() => import('./pages/management/admin/ManageBookings'));
const Settings = lazy(() => import('./pages/management/admin/Settings'));
const AdminManagement = lazy(() => import('@/pages/management/admin/super/AdminManagement'));
const PublicContentEditor = lazy(() => import('@/pages/management/admin/super/PublicContentEditor'));
const EmergencyControls = lazy(() => import('@/pages/management/admin/super/EmergencyControls'));
const AdminProfile = lazy(() => import('@/pages/management/admin/Profile'));

// Student Pages (lazy loaded)
const StudentDashboard = lazy(() => import('@/pages/management/student/Dashboard'));
const AvailableRooms = lazy(() => import('@/pages/management/student/AvailableRooms'));
const BookRoom = lazy(() => import('@/pages/management/student/BookRoom'));
const RoomDetails = lazy(() => import('@/pages/management/student/RoomDetails'));
const Profile = lazy(() => import('@/pages/management/student/Profile'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

// Tab ID initializer component
const TabInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    getOrCreateTabId();
  }, []);
  return <>{children}</>;
};

// Conditional Auth initializer component - only for management routes
const ConditionalAuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { hydrated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Only initialize auth for management routes, excluding auth pages
    const path = location.pathname;
    const isAuthPage =
      path === '/management/login' ||
      path === '/management/register' ||
      path === '/management/forgot-password' ||
      path === '/management/reset-password';

    if (path.startsWith('/management') && !isAuthPage && !hydrated) {
      dispatch(hydrateAuth());
    }
  }, [dispatch, location.pathname, hydrated]);

  return <>{children}</>;
}

// Debug Logger component for route debugging
const DebugLogger: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  useEffect(() => {
  }, [location]);
  return <>{children}</>;
};

// Main App component
function App() {
  return (
    <Provider store={store}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <TabInitializer>
          <ConditionalAuthInitializer>
            <DebugLogger>
              <ScrollToTopOnRouteChange />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<PublicLayout />}>
                  {/* Home now wrapped in Suspense to show a loader while its sections load */}
                  <Route
                    index
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <Home />
                      </Suspense>
                    }
                  />
                  <Route path="about" element={
                    <Suspense fallback={<PageLoader />}>
                      <About />
                    </Suspense>
                  } />
                  <Route path="contact" element={
                    <Suspense fallback={<PageLoader />}>
                      <Contact />
                    </Suspense>
                  } />
                  <Route path="rooms" element={
                    <Suspense fallback={<PageLoader />}>
                      <Rooms />
                    </Suspense>
                  } />
                  <Route path="services" element={
                    <Suspense fallback={<PageLoader />}>
                      <Services />
                    </Suspense>
                  } />
                  <Route path="faq" element={
                    <Suspense fallback={<PageLoader />}>
                      <FAQ />
                    </Suspense>
                  } />
                  <Route path="terms" element={
                    <Suspense fallback={<PageLoader />}>
                      <Terms />
                    </Suspense>
                  } />
                  <Route path="privacy" element={
                    <Suspense fallback={<PageLoader />}>
                      <Privacy />
                    </Suspense>
                  } />
                  <Route path="rules" element={
                    <Suspense fallback={<PageLoader />}>
                      <Rules />
                    </Suspense>
                  } />
                </Route>

                {/* Management Authentication Routes */}
                <Route path="/management" element={<AuthLayout />}>
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="forgot-password" element={
                    <Suspense fallback={<PageLoader />}>
                      <ForgotPassword />
                    </Suspense>
                  } />
                  <Route path="reset-password" element={
                    <Suspense fallback={<PageLoader />}>
                      <ResetPassword />
                    </Suspense>
                  } />
                </Route>

                {/* Protected Routes - Admin */}
                <Route
                  path="/management/admin/*"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={
                    <Suspense fallback={<PageLoader />}>
                      <AdminDashboard />
                    </Suspense>
                  } />
                  <Route path="students" element={
                    <Suspense fallback={<PageLoader />}>
                      <ManageStudents />
                    </Suspense>
                  } />
                  <Route path="rooms" element={
                    <Suspense fallback={<PageLoader />}>
                      <ManageRooms />
                    </Suspense>
                  } />
                  <Route path="bookings" element={
                    <Suspense fallback={<PageLoader />}>
                      <ManageBookings />
                    </Suspense>
                  } />
                  <Route path="settings" element={
                    <Suspense fallback={<PageLoader />}>
                      <Settings />
                    </Suspense>
                  } />
                  <Route path="profile" element={
                    <Suspense fallback={<PageLoader />}>
                      <AdminProfile />
                    </Suspense>
                  } />
                  <Route path="super/admin-management" element={
                    <ProtectedRoute requiredRole="super_admin">
                      <Suspense fallback={<PageLoader />}>
                        <AdminManagement />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="super/public-content" element={
                    <ProtectedRoute requiredRole="super_admin">
                      <Suspense fallback={<PageLoader />}>
                        <PublicContentEditor />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="super/emergency-controls" element={
                    <ProtectedRoute requiredRole="super_admin">
                      <Suspense fallback={<PageLoader />}>
                        <EmergencyControls />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                </Route>

                {/* Protected Routes - Student */}
                <Route
                  path="/management/student/*"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <StudentLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={
                    <Suspense fallback={<PageLoader />}>
                      <StudentDashboard />
                    </Suspense>
                  } />
                  <Route path="rooms" element={
                    <Suspense fallback={<PageLoader />}>
                      <AvailableRooms />
                    </Suspense>
                  } />
                  <Route path="rooms/:id" element={
                    <Suspense fallback={<PageLoader />}>
                      <RoomDetails />
                    </Suspense>
                  } />
                  <Route path="book-room/:id" element={
                    <Suspense fallback={<PageLoader />}>
                      <BookRoom />
                    </Suspense>
                  } />
                  <Route path="profile" element={
                    <Suspense fallback={<PageLoader />}>
                      <Profile />
                    </Suspense>
                  } />
                </Route>

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              {/* Render the floating scroll-to-top button */}
              <ScrollToTop />
            </DebugLogger>
          </ConditionalAuthInitializer>
        </TabInitializer>
      </Router>
    </Provider>
  );
}

export default App;
