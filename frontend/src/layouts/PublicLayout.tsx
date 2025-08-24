import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/components/public/layout/Navbar';
import Footer from '@/components/public/Footer';

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <React.Suspense fallback={<div className="h-16" />}>
        <Navbar />  {/* Changed from Header to Navbar */}
      </React.Suspense>
      <main className="flex-1">
        <Outlet />
      </main>
      <React.Suspense fallback={<div className="h-16" />}>
        <Footer />
      </React.Suspense>
    </div>
  );
};

export default PublicLayout;
