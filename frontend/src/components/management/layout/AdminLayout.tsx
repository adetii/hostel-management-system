import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Breadcrumb from './Breadcrumb';
import { SocketProvider } from '@/contexts/SocketContext';

const AdminLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <SocketProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Sidebar */}
        <Sidebar
          isOpen={isMobileMenuOpen}
          setIsOpen={setIsMobileMenuOpen}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Main content area */}
        <div className={`transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        }`}>
          {/* Navbar */}
          <Navbar
            onMobileMenuToggle={handleMobileMenuToggle}
            isMobileMenuOpen={isMobileMenuOpen}
          />

          {/* Breadcrumb */}
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumb />
          </div>

          {/* Page content */}
          <main className="px-4 sm:px-6 lg:px-8 pb-8">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SocketProvider>
  );
};

export default AdminLayout;

