import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} sidebarOpen={sidebarOpen} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="lg:ml-64 pt-4 px-4 pb-8 min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
