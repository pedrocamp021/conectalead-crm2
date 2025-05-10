import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { ClientList } from '../components/admin/ClientList';

export const Admin: React.FC = () => {
  const { isAdmin } = useAppStore();

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div>
      <ClientList />
    </div>
  );
};