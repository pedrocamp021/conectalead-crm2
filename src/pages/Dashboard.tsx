import React from 'react';
import { useAppStore } from '../lib/store';
import { DashboardPage } from '../components/dashboard/DashboardPage';
import { ClientDashboard } from '../components/dashboard/ClientDashboard';

export const Dashboard: React.FC = () => {
  const { isAdmin } = useAppStore();

  return isAdmin ? <DashboardPage /> : <ClientDashboard />;
};