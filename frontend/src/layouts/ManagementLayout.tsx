import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import Navbar from '@/components/management/layout/Navbar';
import Sidebar from '@/components/management/layout/Sidebar';

const ManagementLayout: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <div className="min-h-screen bg-gray-100">
      {isAuthenticated && <Navbar onMobileMenuToggle={function(): void {
      throw new Error('Function not implemented.');
      } } isMobileMenuOpen={false} />}
      <div className="flex">
        {isAuthenticated && <Sidebar isOpen={false} setIsOpen={function(isOpen: boolean): void {
        throw new Error('Function not implemented.');
        } } isCollapsed={false} setIsCollapsed={function(isCollapsed: boolean): void {
        throw new Error('Function not implemented.');
        } } />}
        <main className={`flex-1 ${isAuthenticated ? 'p-6' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagementLayout;
