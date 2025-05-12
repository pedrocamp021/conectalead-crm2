import React from 'react';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import type { DashboardStats } from './types';

interface DashboardMetricsProps {
  stats: DashboardStats;
  isLoading: boolean;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
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
  );
};