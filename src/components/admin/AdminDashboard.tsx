import React, { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  expiredClients: number;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    expiredClients: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get all clients
        const { data: clients, error } = await supabase
          .from('clients')
          .select('*');

        if (error) throw error;

        const currentDate = new Date();
        
        const stats = {
          totalClients: clients.length,
          activeClients: clients.filter(client => client.status === 'active').length,
          inactiveClients: clients.filter(client => client.status === 'inactive').length,
          expiredClients: clients.filter(client => new Date(client.expiration_date) < currentDate).length
        };

        setStats(stats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: <Users className="h-8 w-8" />,
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50'
    },
    {
      title: 'Active Clients',
      value: stats.activeClients,
      icon: <UserCheck className="h-8 w-8" />,
      bgColor: 'bg-green-500',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50'
    },
    {
      title: 'Inactive Clients',
      value: stats.inactiveClients,
      icon: <UserX className="h-8 w-8" />,
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgLight: 'bg-yellow-50'
    },
    {
      title: 'Expired Plans',
      value: stats.expiredClients,
      icon: <Clock className="h-8 w-8" />,
      bgColor: 'bg-red-500',
      textColor: 'text-red-600',
      bgLight: 'bg-red-50'
    }
  ];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`${card.bgLight} rounded-lg shadow-sm overflow-hidden`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.textColor}`}>
                  {card.icon}
                </div>
                <div className={`${card.bgColor} text-white text-sm font-medium px-2.5 py-0.5 rounded-full`}>
                  {card.title}
                </div>
              </div>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-gray-900">
                  {card.value}
                </div>
                <div className="ml-2 text-sm text-gray-500">clients</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};