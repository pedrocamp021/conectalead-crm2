import React from 'react';
import { useAppStore } from '../lib/store';
import { DashboardPage } from '../components/dashboard/DashboardPage';
import { KanbanBoard } from '../components/kanban/KanbanBoard';

export const Dashboard: React.FC = () => {
  const { isAdmin } = useAppStore();

  return (
    <div className="space-y-8">
      {isAdmin ? (
        <DashboardPage />
      ) : (
        <>
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Gestão de Leads</h1>
            <p className="text-gray-600">Gerencie seus leads arrastando os cartões entre as colunas</p>
          </div>
          <KanbanBoard />
        </>
      )}
    </div>
  );
};