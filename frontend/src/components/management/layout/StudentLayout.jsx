import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';  // Changed from { Navbar } to default import
import Sidebar from './Sidebar';  // Changed from { Sidebar } to default import

const StudentLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;