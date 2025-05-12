import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAppStore } from '../../lib/store';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Loader2 } from 'lucide-react';

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, client, isAdmin, isLoading } = useAppStore();

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto text-blue-600 animate-spin" />
          <p className="mt-4 text-lg text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If the user is a client with expired plan
  if (!isAdmin && client?.status === 'expired') {
    return <Navigate to="/expired" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Fixed at top */}
      <Header toggleSidebar={toggleSidebar} />

      {/* Sidebar - Fixed at left */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Content - Adjusted with left padding on desktop */}
      <main className="pt-16 lg:pl-64 transition-all duration-300">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};