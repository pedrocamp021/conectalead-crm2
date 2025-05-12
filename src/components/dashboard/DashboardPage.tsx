import React, { useEffect, useState } from 'react';
import { DashboardMetrics } from './DashboardMetrics';
import { DashboardCharts } from './DashboardCharts';
import { supabase } from '../../lib/supabase';
import type { DashboardStats } from './types';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    expiredClients: 0,
    planDistribution: {
      monthly: 0,
      quarterly: 0,
      yearly: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('*');

        if (clientsError) throw clientsError;

        const currentDate = new Date();
        
        const stats = {
          totalClients: clients.length,
          activeClients: clients.filter(client => client.status === 'active').length,
          inactiveClients: clients.filter(client => client.status === 'inactive').length,
          expiredClients: clients.filter(client => new Date(client.expiration_date) < currentDate).length,
          planDistribution: {
            monthly: clients.filter(client => client.plan_type === 'monthly').length,
            quarterly: clients.filter(client => client.plan_type === 'quarterly').length,
            yearly: clients.filter(client => client.plan_type === 'yearly').length
          }
        };

        setStats(stats);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Visão Geral do Dashboard</h2>
        <DashboardMetrics stats={stats} isLoading={isLoading} />
      </div>
      <DashboardCharts stats={stats} isLoading={isLoading} />
    </div>
  );
};