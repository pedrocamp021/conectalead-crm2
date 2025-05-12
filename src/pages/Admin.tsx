import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { AdminClientes } from '../components/admin/AdminClientes';

export const Admin: React.FC = () => {
  const { isAdmin } = useAppStore();

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestão de Clientes</h2>
      <AdminClientes />
    </div>
  );
};