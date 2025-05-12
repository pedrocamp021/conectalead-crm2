import React, { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  expiredClients: number;
  planDistribution: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
}

export const AdminDashboard: React.FC = () => {
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
    const fetchStats = async () => {
      try {
        const { data: clients, error } = await supabase
          .from('clients')
          .select('*');

        if (error) throw error;

        const currentDate = new Date();
        
        const stats = {
          totalClients: clients.length,
          activeClients: clients.filter(client => client.status === 'ativo').length,
          inactiveClients: clients.filter(client => client.status === 'inativo').length,
          expiredClients: clients.filter(client => client.status === 'vencido').length,
          planDistribution: {
            monthly: clients.filter(client => client.plan_type === 'mensal').length,
            quarterly: clients.filter(client => client.plan_type === 'trimestral').length,
            yearly: clients.filter(client => client.plan_type === 'anual').length
          }
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
      title: 'Total de Clientes',
      value: stats.totalClients,
      icon: <Users className="h-8 w-8" />,
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50'
    },
    {
      title: 'Clientes Ativos',
      value: stats.activeClients,
      icon: <UserCheck className="h-8 w-8" />,
      bgColor: 'bg-green-500',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50'
    },
    {
      title: 'Clientes Inativos',
      value: stats.inactiveClients,
      icon: <UserX className="h-8 w-8" />,
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgLight: 'bg-yellow-50'
    },
    {
      title: 'Planos Vencidos',
      value: stats.expiredClients,
      icon: <Clock className="h-8 w-8" />,
      bgColor: 'bg-red-500',
      textColor: 'text-red-600',
      bgLight: 'bg-red-50'
    }
  ];

  const statusData = [
    { name: 'Ativos', value: stats.activeClients, color: '#22c55e' },
    { name: 'Inativos', value: stats.inactiveClients, color: '#eab308' },
    { name: 'Vencidos', value: stats.expiredClients, color: '#ef4444' }
  ];

  const planData = [
    { name: 'Mensal', value: stats.planDistribution.monthly },
    { name: 'Trimestral', value: stats.planDistribution.quarterly },
    { name: 'Anual', value: stats.planDistribution.yearly }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Visão Geral</h2>
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
                  <div className="ml-2 text-sm text-gray-500">clientes</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status dos Clientes</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição por Plano</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Clientes" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};