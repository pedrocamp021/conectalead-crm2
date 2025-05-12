import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DashboardStats, ClientStatusData, PlanDistributionData } from './types';

interface DashboardChartsProps {
  stats: DashboardStats;
  isLoading: boolean;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const statusData: ClientStatusData[] = [
    { name: 'Ativo', value: stats.activeClients, color: '#22c55e' },
    { name: 'Inativo', value: stats.inactiveClients, color: '#eab308' },
    { name: 'Vencido', value: stats.expiredClients, color: '#ef4444' },
  ];

  const planData: PlanDistributionData[] = [
    { name: 'Mensal', value: stats.planDistribution.monthly },
    { name: 'Trimestral', value: stats.planDistribution.quarterly },
    { name: 'Anual', value: stats.planDistribution.yearly },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuição de Status dos Clientes</h3>
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Clientes por Tipo de Plano</h3>
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
  );
};