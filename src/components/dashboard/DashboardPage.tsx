import React, { useEffect, useState } from 'react';
import { DashboardMetrics } from './DashboardMetrics';
import { DashboardCharts } from './DashboardCharts';
import { supabase } from '../../lib/supabase';
import type { DashboardStats, WeeklyLeads } from './types';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    expiredClients: 0
  });
  const [weeklyLeads, setWeeklyLeads] = useState<WeeklyLeads[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch clients data
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('*');

        if (clientsError) throw clientsError;

        const currentDate = new Date();
        
        // Calculate client stats
        const stats = {
          totalClients: clients.length,
          activeClients: clients.filter(client => client.status === 'active').length,
          inactiveClients: clients.filter(client => client.status === 'inactive').length,
          expiredClients: clients.filter(client => new Date(client.expiration_date) < currentDate).length
        };

        // Fetch leads for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('created_at')
          .gte('created_at', thirtyDaysAgo.toISOString());

        if (leadsError) throw leadsError;

        // Group leads by week
        const weeklyData = leads.reduce((acc: { [key: string]: number }, lead) => {
          const weekStart = new Date(lead.created_at);
          weekStart.setHours(0, 0, 0, 0);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          
          const weekKey = weekStart.toISOString().split('T')[0];
          acc[weekKey] = (acc[weekKey] || 0) + 1;
          return acc;
        }, {});

        const weeklyLeads = Object.entries(weeklyData).map(([week, leads]) => ({
          week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          leads
        }));

        setStats(stats);
        setWeeklyLeads(weeklyLeads);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
        <DashboardMetrics stats={stats} isLoading={isLoading} />
      </div>
      <DashboardCharts stats={stats} weeklyLeads={weeklyLeads} isLoading={isLoading} />
    </div>
  );
};